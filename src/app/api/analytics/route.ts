import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET() {
  try {
    // Get all data
    const { data: campaigns, error: campError } = await supabase
      .from("campaigns")
      .select("*");
    if (campError) throw campError;

    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("*");
    if (empError) throw empError;

    const { data: interactions, error: intError } = await supabase
      .from("interactions")
      .select("*, employees(*), campaigns(*)")
      .order("updated_at", { ascending: false });
    if (intError) throw intError;

    // Count drill types
    const emailDrills = campaigns.filter(
      (c) => !c.delivery_method || c.delivery_method === "email" || c.delivery_method === "both"
    ).length;
    const callDrills = campaigns.filter((c) => c.delivery_method === "vapi").length;

    // Calculate metrics across all interactions
    let clicked = 0;
    let failed = 0;

    for (const i of interactions) {
      const isEmail = !i.vishing_call_id;

      if (isEmail) {
        // Email: clicked = LINK_CLICKED or beyond, failed = SUBMITTED/LEARNING_VIEWED
        if (
          i.state === "LINK_CLICKED" ||
          i.state === "CREDENTIALS_SUBMITTED" ||
          i.state === "LEARNING_VIEWED"
        ) {
          clicked++;
        }
        if (i.state === "CREDENTIALS_SUBMITTED" || i.state === "LEARNING_VIEWED") {
          failed++;
        }
      } else {
        // Call: clicked = has outcome, failed = vishing_outcome === "failed"
        if (i.vishing_outcome) {
          clicked++;
        }
        if (i.vishing_outcome === "failed") {
          failed++;
        }
      }
    }

    const totalInteractions = interactions.length;
    const clickRate = totalInteractions > 0 ? Math.round((clicked / totalInteractions) * 100) : 0;
    const failRate = totalInteractions > 0 ? Math.round((failed / totalInteractions) * 100) : 0;

    // Drill type breakdown
    const drillTypeBreakdown = [
      {
        type: "Email",
        count: emailDrills,
        clicked: interactions.filter((i) => {
          if (i.vishing_call_id) return false;
          return (
            i.state === "LINK_CLICKED" ||
            i.state === "CREDENTIALS_SUBMITTED" ||
            i.state === "LEARNING_VIEWED"
          );
        }).length,
        failed: interactions.filter((i) => {
          if (i.vishing_call_id) return false;
          return i.state === "CREDENTIALS_SUBMITTED" || i.state === "LEARNING_VIEWED";
        }).length,
      },
      {
        type: "Call",
        count: callDrills,
        clicked: interactions.filter((i) => i.vishing_outcome).length,
        failed: interactions.filter((i) => i.vishing_outcome === "failed").length,
      },
    ];

    // Department breakdown
    const deptMap = new Map<
      string,
      { total: number; clicked: number; failed: number }
    >();

    for (const i of interactions) {
      const dept = (i.employees as { department: string })?.department || "Unknown";
      const entry = deptMap.get(dept) || { total: 0, clicked: 0, failed: 0 };
      entry.total++;

      const isEmail = !i.vishing_call_id;
      if (isEmail) {
        if (
          i.state === "LINK_CLICKED" ||
          i.state === "CREDENTIALS_SUBMITTED" ||
          i.state === "LEARNING_VIEWED"
        ) {
          entry.clicked++;
        }
        if (i.state === "CREDENTIALS_SUBMITTED" || i.state === "LEARNING_VIEWED") {
          entry.failed++;
        }
      } else {
        if (i.vishing_outcome) entry.clicked++;
        if (i.vishing_outcome === "failed") entry.failed++;
      }

      deptMap.set(dept, entry);
    }

    const departmentBreakdown = Array.from(deptMap.entries())
      .map(([department, stats]) => ({
        department,
        ...stats,
        clickRate: stats.total > 0 ? Math.round((stats.clicked / stats.total) * 100) : 0,
        failRate: stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.failRate - a.failRate);

    // Timeline - group by date
    const dateMap = new Map<string, { email: number; call: number }>();
    const last30Days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().split("T")[0];
    });

    // Initialize all dates with 0
    for (const date of last30Days) {
      dateMap.set(date, { email: 0, call: 0 });
    }

    for (const i of interactions) {
      const date = i.updated_at?.split("T")[0];
      if (!date || !dateMap.has(date)) continue;

      const entry = dateMap.get(date)!;
      if (i.vishing_call_id) {
        entry.call++;
      } else {
        entry.email++;
      }
    }

    const timeline = Array.from(dateMap.entries())
      .map(([date, counts]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        ...counts,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      overview: {
        totalEmployees: employees.length,
        totalDrills: campaigns.length,
        emailDrills,
        callDrills,
        totalInteractions,
        clicked,
        failed,
        clickRate,
        failRate,
        successRate: 100 - failRate,
      },
      drillTypeBreakdown,
      departmentBreakdown,
      timeline,
      recentInteractions: interactions.slice(0, 10),
    });
  } catch (error) {
    console.error("[Analytics API] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
