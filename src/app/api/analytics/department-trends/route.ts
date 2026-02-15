import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getDepartmentRiskTrends } from "@/lib/backboard";

/**
 * GET /api/analytics/department-trends?department=Engineering
 * Get AI-powered risk trend analysis for a department
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentName = searchParams.get('department');

    if (!departmentName) {
      return NextResponse.json(
        { error: 'Department parameter required' },
        { status: 400 }
      );
    }

    // Fetch all employees in this department
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, department')
      .eq('department', departmentName);

    if (empError || !employees || employees.length === 0) {
      return NextResponse.json(
        { error: 'Department not found or has no employees' },
        { status: 404 }
      );
    }

    // Fetch drill history for all employees in the department
    const { data: interactions, error: intError } = await supabase
      .from('interactions')
      .select('employee_id, state, vishing_outcome, call_analytics')
      .in('employee_id', employees.map(e => e.id));

    if (intError) {
      throw intError;
    }

    // Calculate employee performance metrics
    const employeesData = employees.map(emp => {
      const empInteractions = interactions?.filter(i => i.employee_id === emp.id) || [];
      const totalDrills = empInteractions.length;
      const failures = empInteractions.filter(i =>
        i.state === 'CREDENTIALS_SUBMITTED' ||
        i.vishing_outcome === 'failed'
      ).length;

      // Extract common weaknesses from call analytics
      const weaknesses = new Set<string>();
      empInteractions.forEach(i => {
        if (i.call_analytics) {
          const analytics = i.call_analytics as any;
          const empWeaknesses = analytics['Training Recommendations']?.weaknesses || [];
          empWeaknesses.forEach((w: string) => weaknesses.add(w));
        }
      });

      return {
        id: emp.id,
        name: emp.name,
        recentDrills: totalDrills,
        failureRate: totalDrills > 0 ? Math.round((failures / totalDrills) * 100) : 0,
        commonWeaknesses: Array.from(weaknesses).slice(0, 3),
      };
    });

    // Get AI analysis from Backboard
    const trends = await getDepartmentRiskTrends(departmentName, employeesData);

    if (!trends) {
      return NextResponse.json(
        { error: 'Unable to generate department trends. Backboard may not be configured.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      department: departmentName,
      employeeCount: employees.length,
      trends,
      employeesData,
    });

  } catch (error) {
    console.error('[Department Trends API] Error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
