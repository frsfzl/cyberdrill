import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET() {
  try {
    // Get all interactions with employee and campaign data
    const { data: allInteractions, error: intError } = await supabase
      .from("interactions")
      .select("*, employees(name, email, department, position), campaigns(name, status)");
    if (intError) throw intError;

    const { data: campaigns, error: campError } = await supabase
      .from("campaigns")
      .select("*");
    if (campError) throw campError;

    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("*");
    if (empError) throw empError;

    // Filter to only completed interactions (emails clicked/submitted/reported OR calls with analytics)
    const interactions = allInteractions.filter(i => {
      // Call interactions with analytics (completed calls)
      if (i.vishing_call_id && i.call_analytics) {
        return true;
      }
      // Email interactions that were acted upon (no vishing_call_id means it's an email)
      if (!i.vishing_call_id && (i.link_clicked_at || i.form_submitted_at || i.state === 'REPORTED')) {
        return true;
      }
      return false;
    });

    // Overall stats
    const totalInteractions = interactions.length;
    const clicked = interactions.filter(
      (i) =>
        i.clicked_at || i.state === "LINK_CLICKED" || i.state === "CREDENTIALS_SUBMITTED"
    ).length;
    const submitted = interactions.filter(
      (i) => i.submitted_at || i.state === "CREDENTIALS_SUBMITTED"
    ).length;
    const reported = interactions.filter(
      (i) => i.reported_at || i.state === "REPORTED"
    ).length;

    // Department breakdown
    const deptMap = new Map<
      string,
      { total: number; clicked: number; submitted: number; reported: number }
    >();
    for (const i of interactions) {
      const dept =
        (i.employees as { department: string })?.department || "Unknown";
      const entry = deptMap.get(dept) || { total: 0, clicked: 0, submitted: 0, reported: 0 };
      entry.total++;
      if (
        i.clicked_at ||
        i.state === "LINK_CLICKED" ||
        i.state === "CREDENTIALS_SUBMITTED"
      )
        entry.clicked++;
      if (i.submitted_at || i.state === "CREDENTIALS_SUBMITTED") entry.submitted++;
      if (i.reported_at || i.state === "REPORTED") entry.reported++;
      deptMap.set(dept, entry);
    }

    const departmentBreakdown = Array.from(deptMap.entries()).map(
      ([dept, stats]) => ({
        department: dept,
        ...stats,
        clickRate:
          stats.total > 0
            ? Math.round((stats.clicked / stats.total) * 100)
            : 0,
        submitRate:
          stats.total > 0
            ? Math.round((stats.submitted / stats.total) * 100)
            : 0,
        reportRate:
          stats.total > 0
            ? Math.round((stats.reported / stats.total) * 100)
            : 0,
      })
    );

    // Campaign timeline
    const campaignTimeline = campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      created_at: c.created_at,
      closed_at: c.closed_at,
      targets: c.target_employee_ids?.length || 0,
    }));

    return NextResponse.json({
      overview: {
        totalEmployees: employees.length,
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c) => c.status === "active")
          .length,
        totalInteractions,
        clickRate:
          totalInteractions > 0
            ? Math.round((clicked / totalInteractions) * 100)
            : 0,
        submitRate:
          totalInteractions > 0
            ? Math.round((submitted / totalInteractions) * 100)
            : 0,
        reportRate:
          totalInteractions > 0
            ? Math.round((reported / totalInteractions) * 100)
            : 0,
      },
      departmentBreakdown,
      campaignTimeline,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
