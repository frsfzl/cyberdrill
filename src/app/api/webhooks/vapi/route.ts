import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { createLog } from "@/lib/models/log";
import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Generate HTML email with call analytics results
 */
function generateResultsEmail(
  employeeName: string,
  analytics: Record<string, any>,
  callDuration: number
): string {
  const susceptibility = analytics['Phishing Susceptibility Analysis'];
  const redFlags = analytics['Red Flags Recognition'];
  const response = analytics['Employee Response Analysis'];
  const training = analytics['Training Recommendations'];

  const passed = !susceptibility?.fellForPhish;
  const riskLevel = susceptibility?.riskLevel || 'unknown';
  const riskScore = training?.riskScore || 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Drill Results</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background: ${passed ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}; padding: 40px 30px; text-align: center; color: white;">
      <div style="font-size: 48px; margin-bottom: 10px;">${passed ? '✅' : '❌'}</div>
      <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Security Drill Complete</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
        ${passed ? 'Great job! You passed the test.' : 'This was a training exercise.'}
      </p>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 30px;">
      <p style="margin: 0 0 20px 0; font-size: 16px; color: #1f2937;">
        Hi <strong>${employeeName}</strong>,
      </p>

      <p style="margin: 0 0 30px 0; font-size: 16px; color: #4b5563; line-height: 1.6;">
        The phone call you just received was a <strong>simulated vishing (voice phishing) attack</strong>
        conducted by your IT Security team as part of ongoing security awareness training.
        This was <strong>not a real threat</strong> - no actual harm was intended or done.
      </p>

      <!-- Overall Result -->
      <div style="background: ${passed ? '#f0fdf4' : '#fef2f2'}; border-left: 4px solid ${passed ? '#10b981' : '#ef4444'}; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h2 style="margin: 0; font-size: 20px; color: #1f2937;">Your Result</h2>
          <div style="background: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; color: ${passed ? '#059669' : '#dc2626'};">
            ${passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 15px;">
          <div>
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">Risk Level</div>
            <div style="font-size: 18px; font-weight: bold; color: #1f2937; text-transform: uppercase;">${riskLevel}</div>
          </div>
          <div>
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">Risk Score</div>
            <div style="font-size: 18px; font-weight: bold; color: #1f2937;">${riskScore}/100</div>
          </div>
          <div>
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">Duration</div>
            <div style="font-size: 18px; font-weight: bold; color: #1f2937;">${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}</div>
          </div>
        </div>
      </div>

      <!-- What You Did Well -->
      ${training?.strongPoints && training.strongPoints.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #059669; display: flex; align-items: center;">
          <span style="font-size: 24px; margin-right: 10px;">✓</span>
          What You Did Well
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
          ${training.strongPoints.map((point: string) => `
            <li style="margin-bottom: 8px; line-height: 1.5;">${point}</li>
          `).join('')}
        </ul>
      </div>
      ` : ''}

      <!-- Areas for Improvement -->
      ${training?.weaknesses && training.weaknesses.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #dc2626; display: flex; align-items: center;">
          <span style="font-size: 24px; margin-right: 10px;">⚠️</span>
          Areas for Improvement
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
          ${training.weaknesses.map((weakness: string) => `
            <li style="margin-bottom: 8px; line-height: 1.5;">${weakness}</li>
          `).join('')}
        </ul>
      </div>
      ` : ''}

      <!-- Red Flags -->
      ${redFlags ? `
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #92400e;">🚩 Red Flags Analysis</h3>
        <div style="color: #78350f;">
          <div style="margin-bottom: 10px;">
            <strong>Identified:</strong> ${redFlags.redFlagsIdentified?.length || 0} warning signs
          </div>
          <div style="margin-bottom: 10px;">
            <strong>Missed:</strong> ${redFlags.redFlagsMissed?.length || 0} warning signs
          </div>
          <div>
            <strong>Verification Attempted:</strong> ${redFlags.verificationAttempted ? '✓ Yes' : '✗ No'}
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Key Takeaways -->
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1e40af;">💡 Key Takeaways</h3>
        <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
          <li style="margin-bottom: 8px; line-height: 1.5;">Always verify the identity of unexpected callers, even if they claim to be from IT or management</li>
          <li style="margin-bottom: 8px; line-height: 1.5;">Be suspicious of urgent requests that pressure you to act immediately</li>
          <li style="margin-bottom: 8px; line-height: 1.5;">Never share passwords, credentials, or sensitive information over the phone</li>
          <li style="margin-bottom: 8px; line-height: 1.5;">When in doubt, hang up and contact the person/department through official channels</li>
          <li style="margin-bottom: 8px; line-height: 1.5;">Report suspicious calls to IT Security immediately</li>
        </ul>
      </div>

      <!-- Next Steps -->
      ${training?.followUpRequired ? `
      <div style="background: #fef2f2; border: 2px solid #ef4444; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #dc2626; display: flex; align-items: center;">
          <span style="font-size: 24px; margin-right: 10px;">⚠️</span>
          Action Required
        </h3>
        <p style="margin: 0; color: #991b1b; line-height: 1.6;">
          Based on your performance, we recommend completing additional security awareness training.
          Your manager will be in touch with next steps within 24-48 hours.
        </p>
      </div>
      ` : `
      <div style="background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #059669;">👍 Keep Up the Good Work!</h3>
        <p style="margin: 0; color: #065f46; line-height: 1.6;">
          Continue to stay vigilant and apply these security best practices in your daily work.
        </p>
      </div>
      `}

      <p style="margin: 30px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
        If you have any questions about this drill or want to learn more about protecting yourself
        from social engineering attacks, please contact your IT Security team.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
        <strong>CyberDrill Security Awareness Training</strong>
      </p>
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
        This drill is part of your organization's ongoing commitment to cybersecurity awareness.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * VAPI Webhook Handler
 * Receives call completion events and stores analytics
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[VAPI Webhook] 📥 Received event');
    console.log(`[VAPI Webhook] Type: ${message?.type}`);
    console.log('[VAPI Webhook] Full Body:', JSON.stringify(body, null, 2));

    // Only process call-ended events
    if (message?.type !== 'end-of-call-report') {
      console.log(`[VAPI Webhook] ⏭️  Skipping event type: ${message?.type}`);
      return NextResponse.json({ received: true });
    }

    console.log('[VAPI Webhook] ✅ Processing end-of-call-report');

    const call = message.call;
    const callId = call?.id;

    if (!callId) {
      console.error('[VAPI Webhook] ❌ No call ID in event');
      return NextResponse.json({ error: 'No call ID' }, { status: 400 });
    }

    console.log(`[VAPI Webhook] 📞 Processing call: ${callId}`);

    // Find the interaction by vishing_call_id
    const { data: interaction, error: findError } = await supabase
      .from('interactions')
      .select('*')
      .eq('vishing_call_id', callId)
      .single();

    if (findError || !interaction) {
      console.error(`[VAPI Webhook] ❌ Interaction not found for call ${callId}:`, findError);
      return NextResponse.json({ error: 'Interaction not found' }, { status: 404 });
    }

    console.log(`[VAPI Webhook] ✅ Found interaction: ${interaction.id}`);
    console.log(`[VAPI Webhook] 👤 Employee: ${interaction.employee_id}`);

    // Extract analytics from structured outputs
    const artifact = call.artifact || {};
    const structuredOutputs = artifact.structuredOutputs || {};

    console.log(`[VAPI Webhook] 📊 Structured outputs count: ${Object.keys(structuredOutputs).length}`);
    console.log('[VAPI Webhook] 📊 Structured outputs:', JSON.stringify(structuredOutputs, null, 2));

    // Map structured outputs by name
    const analytics: Record<string, any> = {};
    Object.entries(structuredOutputs).forEach(([outputId, data]: [string, any]) => {
      console.log(`[VAPI Webhook] 📋 Processing output: ${data.name}`);
      console.log(`[VAPI Webhook] 📋 Result:`, JSON.stringify(data.result, null, 2));
      analytics[data.name] = data.result;
    });

    console.log('[VAPI Webhook] 📊 Final analytics object:', JSON.stringify(analytics, null, 2));

    // Extract call metadata
    const transcript = call.transcript || '';
    const recordingUrl = call.recordingUrl || '';
    const duration = call.endedAt && call.startedAt
      ? Math.floor((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000)
      : 0;

    console.log(`[VAPI Webhook] ⏱️  Call duration: ${duration}s`);
    console.log(`[VAPI Webhook] 📝 Transcript length: ${transcript.length} chars`);
    console.log(`[VAPI Webhook] 🎙️  Recording URL: ${recordingUrl ? 'Yes' : 'No'}`);

    // Update interaction with analytics
    const { error: updateError } = await supabase
      .from('interactions')
      .update({
        call_transcript: transcript,
        call_recording_url: recordingUrl,
        call_duration: duration,
        call_analytics: analytics,
        vishing_outcome: analytics['Phishing Susceptibility Analysis']?.fellForPhish ? 'failed' : 'passed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', interaction.id);

    if (updateError) {
      console.error(`[VAPI Webhook] ❌ Failed to update interaction:`, updateError);
      throw updateError;
    }

    console.log(`[VAPI Webhook] ✅ Analytics stored successfully`);

    // Log the analytics
    if (interaction.campaign_id) {
      await createLog({
        campaign_id: interaction.campaign_id,
        level: 'info',
        action: 'vapi_analytics_received',
        message: `Call analytics processed for employee ${interaction.employee_id}`,
        metadata: {
          callId,
          duration,
          fellForPhish: analytics['Phishing Susceptibility Analysis']?.fellForPhish,
          riskLevel: analytics['Phishing Susceptibility Analysis']?.riskLevel,
        },
      });
    }

    // Get employee details for email
    console.log(`[VAPI Webhook] 👤 Looking up employee: ${interaction.employee_id}`);
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('name, email')
      .eq('id', interaction.employee_id)
      .single();

    if (empError) {
      console.error(`[VAPI Webhook] ❌ Employee lookup error:`, empError);
    }

    console.log(`[VAPI Webhook] 👤 Employee found:`, employee);

    if (employee?.email) {
      console.log(`[VAPI Webhook] 📧 Preparing to send results email to ${employee.email}...`);
      console.log(`[VAPI Webhook] 📧 Analytics for email:`, JSON.stringify(analytics, null, 2));

      try {
        const resend = getResend();
        console.log(`[VAPI Webhook] 📧 Resend client created`);

        const htmlContent = generateResultsEmail(employee.name, analytics, duration);
        console.log(`[VAPI Webhook] 📧 Email HTML generated (${htmlContent.length} chars)`);

        const fellForPhish = analytics['Phishing Susceptibility Analysis']?.fellForPhish;
        const subject = `🎯 Security Drill Results - ${fellForPhish ? 'Training Recommended' : 'Well Done!'}`;

        console.log(`[VAPI Webhook] 📧 Sending email...`);
        console.log(`[VAPI Webhook] 📧 From: ${process.env.RESEND_FROM || "CyberDrill <noreply@zerobet.ai>"}`);
        console.log(`[VAPI Webhook] 📧 To: ${employee.email}`);
        console.log(`[VAPI Webhook] 📧 Subject: ${subject}`);

        const { data: emailData, error: emailError } = await resend.emails.send({
          from: process.env.RESEND_FROM || "CyberDrill <noreply@zerobet.ai>",
          to: employee.email,
          subject,
          html: htmlContent,
        });

        if (emailError) {
          console.error(`[VAPI Webhook] ❌ Failed to send email:`, emailError);
          console.error(`[VAPI Webhook] ❌ Email error details:`, JSON.stringify(emailError, null, 2));
          await createLog({
            campaign_id: interaction.campaign_id,
            level: 'error',
            action: 'results_email_failed',
            message: `Failed to send results email to ${employee.email}`,
            metadata: { error: emailError },
          });
        } else {
          console.log(`[VAPI Webhook] ✅ Results email sent successfully!`);
          console.log(`[VAPI Webhook] ✅ Email ID:`, emailData);
          await createLog({
            campaign_id: interaction.campaign_id,
            level: 'info',
            action: 'results_email_sent',
            message: `Results email sent to ${employee.email}`,
            metadata: { employeeId: interaction.employee_id, emailId: emailData },
          });
        }
      } catch (emailError) {
        console.error(`[VAPI Webhook] ❌ Email send exception:`, emailError);
        console.error(`[VAPI Webhook] ❌ Error stack:`, (emailError as Error).stack);
        await createLog({
          campaign_id: interaction.campaign_id,
          level: 'error',
          action: 'results_email_exception',
          message: `Email send exception: ${(emailError as Error).message}`,
          metadata: { error: String(emailError) },
        });
      }
    } else {
      console.log(`[VAPI Webhook] ⚠️  No email address for employee ${interaction.employee_id}`);
      console.log(`[VAPI Webhook] ⚠️  Employee data:`, employee);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[VAPI Webhook] 🎉 Processing complete');

    return NextResponse.json({ success: true, interactionId: interaction.id });
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('[VAPI Webhook] ❌ Error processing webhook:');
    console.error(error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
