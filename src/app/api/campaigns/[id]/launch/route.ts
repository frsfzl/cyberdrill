import { NextRequest, NextResponse } from "next/server";
import { getCampaign, updateCampaign } from "@/lib/models/campaign";
import { createInteraction } from "@/lib/models/interaction";
import { createLog } from "@/lib/models/log";
import { capturePage } from "@/lib/capture/singlefile";
import { modifyHtml } from "@/lib/capture/html-modifier";
import { startLandingServer } from "@/lib/landing-server";
import { startTunnel } from "@/lib/tunnel/ngrok";
import { generateContent } from "@/lib/ai/gemini";
import { phishingEmailPrompt } from "@/lib/ai/prompts";
import { sendPhishingEmail } from "@/lib/delivery/email";
import { getEmployee } from "@/lib/models/employee";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const campaign = await getCampaign(id);
    if (campaign.status !== "draft" && campaign.status !== "ready") {
      return NextResponse.json(
        { error: `Campaign cannot be launched from status: ${campaign.status}` },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Step 1: Capture the login page
    await updateCampaign(id, { status: "capturing" });
    await createLog({
      campaign_id: id,
      level: "info",
      action: "capture_start",
      message: `Capturing page: ${campaign.login_page_url}`,
    });

    const filename = `${id}.html`;
    const htmlPath = await capturePage(campaign.login_page_url, filename);
    await modifyHtml(htmlPath, appUrl);

    // Step 2: Start landing server + ngrok tunnel
    const { port } = await startLandingServer(htmlPath, appUrl);
    const ngrokUrl = await startTunnel(port);

    await updateCampaign(id, {
      status: "generating",
      captured_html_path: htmlPath,
      ngrok_url: ngrokUrl,
    });

    // Step 3: Generate phishing email
    await createLog({
      campaign_id: id,
      level: "info",
      action: "generate_start",
      message: "Generating phishing email content",
    });

    // Create interactions for each target employee
    const interactions = [];
    for (const employeeId of campaign.target_employee_ids) {
      const interaction = await createInteraction({
        campaign_id: id,
        employee_id: employeeId,
      });
      interactions.push(interaction);
    }

    // Generate email template
    const emailPrompt = phishingEmailPrompt({
      companyName: campaign.company_name,
      industry: campaign.industry,
      pretextScenario: campaign.pretext_scenario,
      employeeName: "{{EMPLOYEE_NAME}}",
      trackingUrl: `${appUrl}/api/track/click?token={{TOKEN}}`,
    });

    const emailResult = await generateContent(emailPrompt);
    let generatedEmail: { subject: string; body: string };
    try {
      const cleaned = emailResult.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      generatedEmail = JSON.parse(cleaned);
    } catch {
      generatedEmail = {
        subject: "Action Required - Security Update",
        body: emailResult,
      };
    }

    await updateCampaign(id, {
      status: "delivering",
      generated_email: generatedEmail,
    });

    // Step 4: Send emails
    await createLog({
      campaign_id: id,
      level: "info",
      action: "delivery_start",
      message: `Sending emails to ${interactions.length} employees`,
    });

    for (const interaction of interactions) {
      try {
        const employee = await getEmployee(interaction.employee_id);
        const trackingUrl = `${appUrl}/api/track/click?token=${interaction.tracking_token}`;
        const personalizedBody = generatedEmail.body
          .replace(/\{\{EMPLOYEE_NAME\}\}/g, employee.name)
          .replace(/\{\{TOKEN\}\}/g, interaction.tracking_token)
          .replace(/\{\{TRACKING_URL\}\}/g, trackingUrl);

        await sendPhishingEmail({
          to: employee.email,
          subject: generatedEmail.subject,
          html: personalizedBody,
        });

        // Stagger sending by 2-5 seconds
        await new Promise((r) =>
          setTimeout(r, 2000 + Math.random() * 3000)
        );
      } catch (error) {
        await createLog({
          campaign_id: id,
          level: "error",
          action: "delivery_failed",
          message: `Failed to send email to employee ${interaction.employee_id}: ${(error as Error).message}`,
        });
      }
    }

    // Step 5: Mark as active
    await updateCampaign(id, { status: "active" });
    await createLog({
      campaign_id: id,
      level: "info",
      action: "campaign_active",
      message: "Campaign is now active",
    });

    return NextResponse.json({ success: true, ngrokUrl });
  } catch (error) {
    await createLog({
      campaign_id: id,
      level: "error",
      action: "launch_failed",
      message: (error as Error).message,
    });
    // Reset to draft on failure
    await updateCampaign(id, { status: "draft" });
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
