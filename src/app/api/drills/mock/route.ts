import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { createCampaign } from "@/lib/models/campaign";

// Mock scenarios for emails
const EMAIL_SCENARIOS = [
  "Password Reset Request",
  "HR Benefits Update",
  "IT Security Alert",
  "Invoice Payment Required",
  "Account Verification",
];

// Mock scenarios for calls
const CALL_SCENARIOS = [
  "IT Support Verification",
  "HR Policy Update",
  "Security Breach Alert",
  "Manager Authorization Request",
];

/**
 * Generate random mock drill with simulated interactions
 * - Email: 65% no interaction, 25% clicked, 10% submitted
 * - Call: 75% no interaction, 25% failed
 */
export async function POST(req: NextRequest) {
  try {
    // Get all available employees
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id")
      .eq("opted_out", false);

    if (empError || !employees || employees.length === 0) {
      return NextResponse.json(
        { error: "No employees found" },
        { status: 400 }
      );
    }

    // Randomize drill type
    const isEmail = Math.random() > 0.5;
    const deliveryMethod = isEmail ? "email" : "vapi";

    // Select random employees (between 5 and min(20, total employees))
    const numEmployees = Math.min(
      20,
      Math.max(5, Math.floor(Math.random() * employees.length))
    );
    const shuffled = [...employees].sort(() => 0.5 - Math.random());
    const selectedEmployees = shuffled.slice(0, numEmployees);
    const targetEmployeeIds = selectedEmployees.map((e) => e.id);

    // Pick random scenario
    const scenarios = isEmail ? EMAIL_SCENARIOS : CALL_SCENARIOS;
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

    // Create the campaign
    const campaign = await createCampaign({
      name: `Mock ${isEmail ? "Email" : "Call"} Drill - ${new Date().toLocaleDateString()}`,
      status: "closed", // Mark as closed so it's complete
      pretext_scenario: scenario,
      company_name: "Mock Corp",
      industry: "Technology",
      login_page_url: isEmail ? "https://example.com/login" : "",
      target_employee_ids: targetEmployeeIds,
      delivery_window: { start: "", end: "" },
      delivery_method: deliveryMethod,
      vapi_delay_minutes: 5,
    });

    // Create interactions with simulated outcomes
    const interactions = [];
    for (const employeeId of targetEmployeeIds) {
      const rand = Math.random();
      
      let state: string;
      let linkClickedAt: string | null = null;
      let formSubmittedAt: string | null = null;
      let learningViewedAt: string | null = null;
      let vishingOutcome: string | null = null;
      let callAnalytics: object | null = null;

      if (isEmail) {
        // Email distribution: 65% no interaction, 25% clicked, 10% submitted
        if (rand < 0.65) {
          state = "DELIVERED";
        } else if (rand < 0.90) {
          state = "LINK_CLICKED";
          linkClickedAt = randomPastDate();
        } else {
          state = "LEARNING_VIEWED";
          linkClickedAt = randomPastDate();
          learningViewedAt = randomPastDate(1); // 1 min after click
        }
      } else {
        // Call distribution: 75% no interaction, 25% failed
        if (rand < 0.75) {
          state = "DELIVERED";
          vishingOutcome = "no_answer";
        } else {
          state = "NO_INTERACTION"; // Actually means call completed
          vishingOutcome = "failed";
          // Add mock call analytics for failed calls
          callAnalytics = generateMockCallAnalytics();
        }
      }

      const { data: interaction, error: intError } = await supabase
        .from("interactions")
        .insert({
          campaign_id: campaign.id,
          employee_id: employeeId,
          tracking_token: crypto.randomUUID(),
          state,
          email_delivered_at: new Date().toISOString(),
          link_clicked_at: linkClickedAt,
          form_submitted_at: formSubmittedAt,
          learning_viewed_at: learningViewedAt,
          vishing_outcome: vishingOutcome,
          call_analytics: callAnalytics,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!intError && interaction) {
        interactions.push(interaction);
      }
    }

    return NextResponse.json({
      success: true,
      campaign,
      interactionsCreated: interactions.length,
      stats: {
        type: deliveryMethod,
        total: targetEmployeeIds.length,
        clicked: interactions.filter(
          (i) =>
            i.state === "LINK_CLICKED" ||
            i.state === "LEARNING_VIEWED" ||
            i.state === "CREDENTIALS_SUBMITTED"
        ).length,
        failed: interactions.filter(
          (i) =>
            i.state === "LEARNING_VIEWED" ||
            i.state === "CREDENTIALS_SUBMITTED" ||
            i.vishing_outcome === "failed"
        ).length,
      },
    });
  } catch (error) {
    console.error("[Mock Drill] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// Generate a random date in the past (0-7 days ago)
function randomPastDate(minutesOffset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 7));
  date.setMinutes(date.getMinutes() - minutesOffset);
  return date.toISOString();
}

// Generate mock call analytics for failed vishing attempts
function generateMockCallAnalytics(): object {
  return {
    "Phishing Susceptibility Analysis": {
      fellForPhish: true,
      suspicionLevel: ["none", "low", "medium"][Math.floor(Math.random() * 3)],
      agreedToAction: Math.random() > 0.3,
      riskLevel: ["critical", "high", "medium"][Math.floor(Math.random() * 3)],
    },
    "Red Flags Recognition": {
      redFlagsIdentified: [],
      redFlagsMissed: ["Urgency", "Unknown caller", "Request for credentials"],
      verificationAttempted: false,
    },
    "Employee Response Analysis": {
      responseType: ["complied_immediately", "asked_questions"][
        Math.floor(Math.random() * 2)
      ],
      emotionalState: ["calm", "nervous", "confused"][
        Math.floor(Math.random() * 3)
      ],
      informationShared: true,
    },
    "Call Quality Metrics": {
      callDuration: Math.floor(Math.random() * 300) + 60,
      engagementLevel: ["high", "medium", "low"][Math.floor(Math.random() * 3)],
      callOutcome: "completed_successfully",
    },
    "Training Recommendations": {
      strongPoints: [],
      weaknesses: ["Verification protocols", "Red flag recognition"],
      riskScore: Math.floor(Math.random() * 40) + 60,
      followUpRequired: true,
    },
  };
}
