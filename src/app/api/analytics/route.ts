import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET() {
  try {
    // Get all interactions with employee and campaign data
    const { data: interactions, error: intError } = await supabase
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

    // Overall stats
    const totalInteractions = interactions.length;
    const clicked = interactions.filter(
      (i) =>
        i.state === "LINK_CLICKED" || i.state === "CREDENTIALS_SUBMITTED"
    ).length;
    const submitted = interactions.filter(
      (i) => i.state === "CREDENTIALS_SUBMITTED"
    ).length;
    const reported = interactions.filter(
      (i) => i.state === "REPORTED"
    ).length;

    // Department breakdown
    const deptMap = new Map<
      string,
      { total: number; clicked: number; submitted: number }
    >();
    for (const i of interactions) {
      const dept =
        (i.employees as { department: string })?.department || "Unknown";
      const entry = deptMap.get(dept) || { total: 0, clicked: 0, submitted: 0 };
      entry.total++;
      if (
        i.state === "LINK_CLICKED" ||
        i.state === "CREDENTIALS_SUBMITTED"
      )
        entry.clicked++;
      if (i.state === "CREDENTIALS_SUBMITTED") entry.submitted++;
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
