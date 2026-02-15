import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import type { Employee, DeliveryMethod, InteractionState } from "@/types";

export async function POST() {
  try {
    // Fetch all employees
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("*");

    if (empError) throw empError;
    if (!employees || employees.length === 0) {
      return NextResponse.json(
        { error: "No employees found" },
        { status: 400 }
      );
    }

    // Generate random week from past year
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    const randomDate = new Date(
      oneYearAgo.getTime() + Math.random() * (now.getTime() - oneYearAgo.getTime())
    );

    // Get the Monday of that week
    const dayOfWeek = randomDate.getDay();
    const diff = randomDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(randomDate.setDate(diff));

    // Format week name
    const weekName = `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    // Random delivery method (email or vapi for call)
    const deliveryMethods: DeliveryMethod[] = ["email", "vapi"];
    const deliveryMethod = deliveryMethods[Math.floor(Math.random() * deliveryMethods.length)];

    // Select random number of employees (30-80% of total)
    const minEmployees = Math.ceil(employees.length * 0.3);
    const maxEmployees = Math.ceil(employees.length * 0.8);
    const numTargets = Math.floor(Math.random() * (maxEmployees - minEmployees + 1)) + minEmployees;

    // Shuffle and select random employees
    const shuffled = [...employees].sort(() => Math.random() - 0.5);
    const selectedEmployees = shuffled.slice(0, numTargets);

    // Create the campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        name: weekName,
        status: "closed",
        pretext_scenario: "Security awareness training drill",
        company_name: "Your Company",
        industry: "Technology",
        login_page_url: "https://example.com/login",
        target_employee_ids: selectedEmployees.map((e: Employee) => e.id),
        delivery_window: {
          start: monday.toISOString(),
          end: new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        delivery_method: deliveryMethod,
        generated_email: {
          subject: "Important Security Update",
          body: "Please review the attached security update.",
        },
        closed_at: new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    // Create interactions for each employee with random states
    const interactions = selectedEmployees.map((employee: Employee) => {
      // Random outcome based on percentages
      // 65% no interaction, 20% clicked, 15% submitted credentials
      const rand = Math.random() * 100;
      let state: InteractionState;
      let linkClickedAt = null;
      let formSubmittedAt = null;

      // Add some randomness to percentages (±5%)
      const noInteractionThreshold = 60 + Math.random() * 10; // 60-70%
      const clickedThreshold = noInteractionThreshold + 15 + Math.random() * 10; // +15-25%

      if (rand < noInteractionThreshold) {
        state = "NO_INTERACTION";
      } else if (rand < clickedThreshold) {
        state = "LINK_CLICKED";
        // Random time during the week
        const clickTime = new Date(monday.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
        linkClickedAt = clickTime.toISOString();
      } else {
        state = "CREDENTIALS_SUBMITTED";
        const clickTime = new Date(monday.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
        linkClickedAt = clickTime.toISOString();
        formSubmittedAt = new Date(clickTime.getTime() + Math.random() * 5 * 60 * 1000).toISOString(); // within 5 min of click
      }

      return {
        campaign_id: campaign.id,
        employee_id: employee.id,
        state,
        email_delivered_at: new Date(monday.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        link_clicked_at: linkClickedAt,
        form_submitted_at: formSubmittedAt,
      };
    });

    // Insert all interactions
    const { error: interactionError } = await supabase
      .from("interactions")
      .insert(interactions);

    if (interactionError) throw interactionError;

    return NextResponse.json({
      success: true,
      campaign: campaign,
      interactions: interactions.length,
      stats: {
        noInteraction: interactions.filter(i => i.state === "NO_INTERACTION").length,
        clicked: interactions.filter(i => i.state === "LINK_CLICKED").length,
        submitted: interactions.filter(i => i.state === "CREDENTIALS_SUBMITTED").length,
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error generating mock drill:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
