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

    // Use hardcoded template (bypass AI for now)
    const generatedEmail = {
      subject: "Urgent: Security Verification Required",
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #d32f2f; margin-top: 0;">Security Alert</h2>
            <p>Dear {{EMPLOYEE_NAME}},</p>
            <p>We've detected unusual activity on your account and need you to verify your login credentials immediately.</p>
            <p>This is part of our enhanced security measures to protect your account from unauthorized access.</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="{{TRACKING_URL}}" style="background: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                Verify Account Now
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">This verification link will expire in 24 hours.</p>
            <p style="color: #666; font-size: 14px;">If you did not request this verification, please contact IT support immediately.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              ${campaign.company_name || 'IT Security Department'}<br>
              This is an automated security notification.
            </p>
          </div>
        </div>
      `,
    };

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

        console.log(`[Email] Sending to ${employee.email}...`);
        await sendPhishingEmail({
          to: employee.email,
          subject: generatedEmail.subject,
          html: personalizedBody,
        });
        console.log(`[Email] Sent successfully to ${employee.email}`);

        // Stagger sending by 2-5 seconds
        await new Promise((r) =>
          setTimeout(r, 2000 + Math.random() * 3000)
        );
      } catch (error) {
        console.error(`[Email] Failed to send to employee ${interaction.employee_id}:`, error);
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
    console.error("[Campaign Launch] Failed:", error);
    await createLog({
      campaign_id: id,
      level: "error",
      action: "launch_failed",
      message: (error as Error).message,
      metadata: { stack: (error as Error).stack },
    });
    // Reset to draft on failure
    await updateCampaign(id, { status: "draft" });
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
