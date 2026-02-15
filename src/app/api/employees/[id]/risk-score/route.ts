import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getPredictiveRiskScore } from "@/lib/backboard";

/**
 * GET /api/employees/[id]/risk-score
 * Get AI-powered predictive risk score for an employee
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = params.id;

    // Fetch employee details
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, name, email, department, position')
      .eq('id', employeeId)
      .single();

    if (empError || !employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Get predictive risk analysis from Backboard
    const riskScore = await getPredictiveRiskScore(
      employee.id,
      employee.name,
      employee.department
    );

    if (!riskScore) {
      return NextResponse.json(
        { error: 'Unable to generate risk score. Backboard may not be configured.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        position: employee.position,
      },
      riskScore,
    });

  } catch (error) {
    console.error('[Risk Score API] Error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
