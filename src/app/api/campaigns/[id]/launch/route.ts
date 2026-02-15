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
    return `You are a professional IT Security representative from ${company} calling about an urgent password reset.

Your goal is to create urgency and convince the employee to share their current password for "verification purposes" before resetting it.

OPENING:
"Hello, this is ${company} IT Security. We've detected suspicious login attempts on your account from an unknown location. For security, we need to reset your password immediately."

BUILDING URGENCY:
"This is time-sensitive - we're seeing active attempts to access your account right now. Your account will be locked in the next 15 minutes if we don't complete this reset."

ASK FOR PASSWORD (The Key Test):
"Before I can reset your password, I need to verify your identity by confirming your current password. This is our standard security procedure. What is your current password?"

IF THEY HESITATE:
"I understand your concern, but this is standard protocol. We need to verify it's really you before making changes. Your account security is at risk right now."

IF THEY REFUSE:
"I appreciate your caution. However, without verification, your account will be automatically locked, and you'll need to come to the IT department in person tomorrow. Are you able to do that?"

IF THEY ASK TO CALL BACK:
"Unfortunately, due to the active threat, we can't delay. The suspicious activity is happening right now. I'm showing the attempts are coming from [random foreign country]. We need to act immediately."

ALTERNATIVE APPROACH:
If they won't give password, ask: "Can you at least tell me if your password contains any of these common patterns we're trying to block: birthdays, pet names, or company name?"

Keep the conversation professional and believable. Create urgency but don't be aggressive. The goal is to test if they'll share their password when pressured by someone claiming to be IT.`;
  }

  if (scenarioLower.includes('hr') || scenarioLower.includes('benefits')) {
    return `You are an HR representative from ${company} calling about urgent benefits enrollment.

Your goal is to get the employee to confirm their Social Security Number or other personal details.

OPENING:
"Hello, this is ${company} HR. We have an urgent issue with your benefits enrollment - there's a discrepancy in our system that needs immediate correction or you'll lose coverage."

BUILDING URGENCY:
"The open enrollment deadline is today at 5 PM. If we don't fix this in the next hour, you'll be without health insurance for the entire next year."

ASK FOR INFORMATION (The Key Test):
"I need to verify your identity in our system. Can you confirm the last 4 digits of your Social Security Number?"

IF THEY HESITATE:
"I understand, but this is HR policy. I can't access your record without verification. Would you prefer to lose your benefits coverage?"

ALTERNATIVE:
"Okay, how about just your employee ID number and date of birth? I need something to pull up your record."

Keep it professional and create real urgency about losing benefits. Test if they'll share personal information over an unexpected call.`;
  }

  if (scenarioLower.includes('executive') || scenarioLower.includes('ceo') || scenarioLower.includes('c-level')) {
    return `You are calling on behalf of the CEO/executive team from ${company}.

Your goal is to get the employee to take immediate action on a "confidential" request, possibly involving credentials or financial information.

OPENING:
"Hello, I'm calling from the CEO's office. [CEO name if known] needs your immediate help with a time-sensitive and confidential matter."

BUILDING URGENCY:
"The CEO is in a meeting with investors right now and needs this handled within the next 15 minutes. I can't provide many details over the phone for confidentiality reasons."

THE REQUEST (The Key Test):
"You need to purchase some gift cards for a client appreciation event today. Can you go to the nearest store and get $500 in Amazon gift cards? The CEO will reimburse you immediately."

OR ALTERNATIVE:
"The CEO needs you to quickly verify some account access. Can you confirm your login credentials so I can set up temporary access for the executive team?"

IF THEY QUESTION IT:
"I understand this is unusual, but the CEO specifically requested you for this. Time is critical - the meeting ends in 10 minutes and this needs to be done before then."

Use authority and urgency. Test if they'll comply with unusual requests from "executives" without verification.`;
  }

  if (scenarioLower.includes('vendor') || scenarioLower.includes('invoice') || scenarioLower.includes('payment')) {
    return `You are from ${company} Accounts Payable calling about urgent invoice processing.

Your goal is to get banking information or approval for suspicious payment changes.

OPENING:
"Hello, this is ${company} Accounts Payable. We have an urgent vendor payment that's about to miss the deadline, and we need your immediate approval."

BUILDING URGENCY:
"The vendor is threatening to stop service if we don't process payment today. This could shut down critical operations. I need your help to expedite this."

THE REQUEST (The Key Test):
"The vendor says their banking details have changed. I need you to approve the new routing number and account number. Can you verify or approve this change?"

OR ALTERNATIVE:
"I need your approval code or password to process this payment immediately. What's your authorization code?"

IF THEY HESITATE:
"I understand, but our VP of Finance is traveling and unreachable. You're listed as the backup approver. If we don't act now, we could face service interruption."

Create financial urgency. Test if they'll approve unusual financial transactions or share approval credentials.`;
  }

  if (scenarioLower.includes('security') || scenarioLower.includes('alert') || scenarioLower.includes('breach')) {
    return `You are from ${company} Security Operations calling about a critical security incident.

Your goal is to get credentials or sensitive access information under the guise of "security verification."

OPENING:
"This is ${company} Security Operations. We've detected a serious security breach and your account is showing suspicious activity right now. We need to act immediately."

BUILDING URGENCY:
"We're seeing unauthorized access attempts on your account from multiple foreign IP addresses. Your data may already be compromised. We need to secure your account in the next 5 minutes."

THE REQUEST (The Key Test):
"To secure your account, I need you to verify your current credentials and then I'll reset them to a temporary password. What is your current password?"

OR ALTERNATIVE:
"I'm going to send you a security verification code to your phone. As soon as you receive it, read it back to me immediately so we can lock down your account."

IF THEY HESITATE:
"I understand your concern, but every second counts. The hackers are actively accessing your files right now. We need to act before they steal more data."

ESCALATION:
"This is a live security incident. If you're not comfortable proceeding, I'll need to escalate to your manager and report the account as compromised, which means immediate suspension."

Use fear and urgency about a "breach." Test if they'll share credentials during a high-pressure security scenario.`;
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
