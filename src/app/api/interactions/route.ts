import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const withAnalytics = searchParams.get("with_analytics") === "true";
    const limit = parseInt(searchParams.get("limit") || "10");

    let query = supabase
      .from("interactions")
      .select(`
        *,
        employee:employees(*)
      `)
      .order("updated_at", { ascending: false })
      .limit(limit);

    // Filter to only interactions with call analytics if requested
    if (withAnalytics) {
      query = query.not("call_analytics", "is", null);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Interactions API] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
