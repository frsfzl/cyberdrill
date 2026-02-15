import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getAIRecommendations } from "@/lib/backboard";

/**
 * Fallback recommendations based on rules
 */
function generateFallbackRecommendations(
  departmentData: Array<{ department: string; submitRate: number; clickRate: number; total: number }>
): string[] {
  const recommendations: string[] = [];

  // High-risk departments (>20% submit rate)
  const highRisk = departmentData.filter(d => d.submitRate >= 20);
  if (highRisk.length > 0) {
    recommendations.push(
      `Focus on ${highRisk.map(d => d.department).join(', ')} departments with ${highRisk.length > 1 ? 'their' : 'its'} ${Math.max(...highRisk.map(d => d.submitRate))}% phishing susceptibility. Schedule mandatory security awareness training within 30 days.`
    );
  }

  // Medium-risk departments (10-20%)
  const mediumRisk = departmentData.filter(d => d.submitRate >= 10 && d.submitRate < 20);
  if (mediumRisk.length > 0) {
    recommendations.push(
      `${mediumRisk.map(d => d.department).join(', ')} show${mediumRisk.length === 1 ? 's' : ''} moderate vulnerability. Increase drill frequency to monthly and provide targeted phishing awareness materials.`
    );
  }

  // High click rate but low submit rate (good awareness)
  const goodCatchers = departmentData.filter(d => d.clickRate >= 30 && d.submitRate < 10);
  if (goodCatchers.length > 0) {
    recommendations.push(
      `${goodCatchers.map(d => d.department).join(', ')} demonstrate${goodCatchers.length === 1 ? 's' : ''} good awareness (clicking but not submitting). Use these teams as peer mentors for other departments.`
    );
  }

  // Overall org health
  const avgSubmitRate = departmentData.reduce((sum, d) => sum + d.submitRate, 0) / departmentData.length;
  if (avgSubmitRate > 15) {
    recommendations.push(
      `Organization-wide submission rate of ${avgSubmitRate.toFixed(1)}% indicates need for comprehensive security culture improvement. Consider executive sponsorship and gamified training programs.`
    );
  } else if (avgSubmitRate < 5) {
    recommendations.push(
      `Excellent organization-wide security awareness with ${avgSubmitRate.toFixed(1)}% submission rate. Maintain momentum with quarterly advanced drills and emerging threat simulations.`
    );
  }

  // Small sample warning
  const totalEmployees = departmentData.reduce((sum, d) => sum + d.total, 0);
  if (totalEmployees < 20) {
    recommendations.push(
      `Expand drill coverage to more employees (currently ${totalEmployees}) for statistically significant insights. Target at least 50+ employees across all departments.`
    );
  }

  return recommendations.slice(0, 5); // Max 5 recommendations
}

/**
 * Get AI-powered recommendations from Backboard
 */
export async function GET() {
  try {
    console.log('[Recommendations] 🤖 Generating AI recommendations...');

    // Get department analytics
    const { data: allInteractions, error: intError } = await supabase
      .from("interactions")
      .select("*, employees(name, email, department, position), campaigns(name, status)");

    if (intError) throw intError;

    // Filter to completed interactions
    const interactions = allInteractions.filter(i => {
      if (i.vishing_call_id && i.call_analytics) return true;
      if (!i.vishing_call_id && (i.link_clicked_at || i.form_submitted_at || i.state === 'REPORTED')) return true;
      return false;
    });

    // Calculate department stats
    const deptMap = new Map<string, { total: number; clicked: number; submitted: number; reported: number }>();

    for (const i of interactions) {
      const dept = (i.employees as { department: string })?.department || "Unknown";
      const entry = deptMap.get(dept) || { total: 0, clicked: 0, submitted: 0, reported: 0 };
      entry.total++;
      if (i.clicked_at || i.state === "LINK_CLICKED" || i.state === "CREDENTIALS_SUBMITTED") entry.clicked++;
      if (i.submitted_at || i.state === "CREDENTIALS_SUBMITTED") entry.submitted++;
      if (i.reported_at || i.state === "REPORTED") entry.reported++;
      deptMap.set(dept, entry);
    }

    const departmentData = Array.from(deptMap.entries()).map(([dept, stats]) => ({
      department: dept,
      total: stats.total,
      clickRate: stats.total > 0 ? Math.round((stats.clicked / stats.total) * 100) : 0,
      submitRate: stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0,
    }));

    // Get AI recommendations from Backboard
    let recommendations = await getAIRecommendations(departmentData);

    // Fallback to rule-based recommendations if Backboard returns nothing
    if (recommendations.length === 0) {
      console.log('[Recommendations] ⚠️ Backboard returned no recommendations, using fallback');
      recommendations = generateFallbackRecommendations(departmentData);
    }

    console.log(`[Recommendations] ✅ Generated ${recommendations.length} recommendations`);

    return NextResponse.json({
      recommendations,
      basedOn: {
        departments: departmentData.length,
        totalInteractions: interactions.length,
      }
    });

  } catch (error) {
    console.error('[Recommendations] ❌ Error:', error);
    return NextResponse.json(
      { error: (error as Error).message, recommendations: [] },
      { status: 500 }
    );
  }
}
