import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getPredictiveRiskScore } from "@/lib/backboard";

/**
 * GET /api/analytics/high-risk-employees?limit=10
 * Get organization's highest-risk employees based on AI predictions
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Fetch all employees
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, email, department, position');

    if (empError || !employees) {
      return NextResponse.json(
        { error: 'Failed to fetch employees' },
        { status: 500 }
      );
    }

    // Get interactions for each employee to filter who has drill history
    const { data: interactions, error: intError } = await supabase
      .from('interactions')
      .select('employee_id, state, vishing_outcome, call_analytics');

    if (intError) {
      throw intError;
    }

    // Filter to employees who have completed at least one drill
    const employeesWithDrills = employees.filter(emp =>
      interactions?.some(i => i.employee_id === emp.id)
    );

    // Get risk scores for all employees (in parallel for speed)
    const riskPromises = employeesWithDrills.slice(0, 50).map(async (emp) => {
      const riskScore = await getPredictiveRiskScore(emp.id, emp.name, emp.department);
      return {
        employee: emp,
        riskScore: riskScore?.overallRiskScore || 0,
        attackTypeBreakdown: riskScore?.attackTypeBreakdown || [],
        trendingWeaknesses: riskScore?.trendingWeaknesses || [],
        recommendations: riskScore?.recommendations || [],
      };
    });

    const results = await Promise.all(riskPromises);

    // Sort by risk score (highest first) and take top N
    const highRiskEmployees = results
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, limit);

    return NextResponse.json({
      highRiskEmployees,
      totalAnalyzed: results.length,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[High Risk Employees API] Error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
