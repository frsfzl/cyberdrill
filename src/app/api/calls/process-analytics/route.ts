import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { processCallAnalytics } from "@/lib/delivery/vapi";
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
 * Process Call Analytics API Route
 * Polls VAPI API for completed calls and processes analytics
 */
export async function POST(req: NextRequest) {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Process Analytics] 🔄 Starting call analytics processing...');

    // Find all interactions with call IDs but no analytics
    const { data: interactions, error: fetchError } = await supabase
      .from('interactions')
      .select('*, employees(name, email)')
      .not('vishing_call_id', 'is', null)
      .is('call_analytics', null);

    if (fetchError) {
      console.error('[Process Analytics] ❌ Error fetching interactions:', fetchError);
      throw fetchError;
    }

    console.log(`[Process Analytics] 📋 Found ${interactions?.length || 0} pending calls to check`);

    if (!interactions || interactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending calls to process',
        processed: 0
      });
    }

    let processedCount = 0;
    let emailsSent = 0;

    // Process each call
    for (const interaction of interactions) {
      const callId = interaction.vishing_call_id;

      try {
        console.log(`[Process Analytics] 📞 Checking call ${callId} for employee ${interaction.employee_id}`);

        // Fetch call analytics from VAPI API
        const result = await processCallAnalytics(callId);

        if (!result) {
          console.log(`[Process Analytics] ⏳ Call ${callId} not completed yet`);
          continue;
        }

        const { analytics, transcript, recordingUrl, duration } = result;

        console.log(`[Process Analytics] ✅ Call ${callId} completed, updating interaction...`);

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
          console.error(`[Process Analytics] ❌ Failed to update interaction ${interaction.id}:`, updateError);
          continue;
        }

        processedCount++;

        // Log analytics
        if (interaction.campaign_id) {
          await createLog({
            campaign_id: interaction.campaign_id,
            level: 'info',
            action: 'vapi_analytics_processed',
            message: `Call analytics processed for employee ${interaction.employee_id}`,
            metadata: {
              callId,
              duration,
              fellForPhish: analytics['Phishing Susceptibility Analysis']?.fellForPhish,
              riskLevel: analytics['Phishing Susceptibility Analysis']?.riskLevel,
            },
          });
        }

        // Send results email
        const employee = interaction.employees;
        if (employee?.email) {
          console.log(`[Process Analytics] 📧 Sending results email to ${employee.email}...`);

          try {
            const resend = getResend();
            const htmlContent = generateResultsEmail(employee.name, analytics, duration);
            const fellForPhish = analytics['Phishing Susceptibility Analysis']?.fellForPhish;

            const { data: emailData, error: emailError } = await resend.emails.send({
              from: process.env.RESEND_FROM || "CyberDrill <noreply@zerobet.ai>",
              to: employee.email,
              subject: `🎯 Security Drill Results - ${fellForPhish ? 'Training Recommended' : 'Well Done!'}`,
              html: htmlContent,
            });

            if (emailError) {
              console.error(`[Process Analytics] ❌ Failed to send email to ${employee.email}:`, emailError);
              await createLog({
                campaign_id: interaction.campaign_id,
                level: 'error',
                action: 'results_email_failed',
                message: `Failed to send results email to ${employee.email}`,
                metadata: { error: emailError },
              });
            } else {
              console.log(`[Process Analytics] ✅ Email sent to ${employee.email}`);
              emailsSent++;
              await createLog({
                campaign_id: interaction.campaign_id,
                level: 'info',
                action: 'results_email_sent',
                message: `Results email sent to ${employee.email}`,
                metadata: { employeeId: interaction.employee_id, emailId: emailData },
              });
            }
          } catch (emailError) {
            console.error(`[Process Analytics] ❌ Email exception for ${employee.email}:`, emailError);
          }
        }

      } catch (error) {
        console.error(`[Process Analytics] ❌ Error processing call ${callId}:`, error);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`[Process Analytics] 🎉 Complete! Processed: ${processedCount}, Emails sent: ${emailsSent}`);

    return NextResponse.json({
      success: true,
      processed: processedCount,
      emailsSent,
      total: interactions.length
    });

  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('[Process Analytics] ❌ Error:', error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
