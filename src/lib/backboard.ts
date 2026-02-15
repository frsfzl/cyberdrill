/**
 * Backboard AI Memory Integration
 * Uses Backboard API for persistent employee training history and AI recommendations
 */

import { supabase } from './db';

// Backboard API endpoint
const BACKBOARD_API_URL = process.env.BACKBOARD_API_URL || 'https://app.backboard.io/api';

interface BackboardMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Detect attack scenario type from call analytics
 */
function detectScenarioType(analytics: any): string {
  if (!analytics) return 'vishing_call';

  const susceptibility = analytics['Phishing Susceptibility Analysis'] || {};
  const redFlags = analytics['Red Flags Recognition'] || {};
  const response = analytics['Employee Response Analysis'] || {};

  // Check for specific attack patterns
  const indicators = [
    susceptibility.indicators || [],
    redFlags.redFlagsIdentified || [],
    redFlags.redFlagsMissed || []
  ].flat().map((s: string) => s.toLowerCase());

  const text = indicators.join(' ');

  // Detect scenario types
  if (text.includes('urgent') || text.includes('immediate') || text.includes('asap')) {
    return 'urgency_tactics';
  }
  if (text.includes('invoice') || text.includes('payment') || text.includes('wire')) {
    return 'invoice_scam';
  }
  if (text.includes('it') || text.includes('tech support') || text.includes('password')) {
    return 'it_impersonation';
  }
  if (text.includes('ceo') || text.includes('executive') || text.includes('manager')) {
    return 'authority_impersonation';
  }
  if (text.includes('credential') || text.includes('login') || text.includes('verify account')) {
    return 'credential_harvesting';
  }

  return 'vishing_call';
}

/**
 * Store employee drill result in Backboard memory
 */
export async function storeEmployeeDrillResult(
  employeeId: string,
  drillData: {
    date: Date;
    scenario: string;
    riskScore?: number;
    fellForPhish?: boolean;
    redFlagsMissed?: string[];
    weaknesses?: string[];
    department?: string;
    analytics?: any;
  }
) {
  const apiKey = process.env.BACKBOARD_API_KEY;
  if (!apiKey) {
    console.warn('[Backboard] API key not configured, skipping storage');
    return null;
  }

  try {
    // Detect specific scenario type for better predictions
    const scenarioType = drillData.analytics
      ? detectScenarioType(drillData.analytics)
      : drillData.scenario;

    const response = await fetch(`${BACKBOARD_API_URL}/v1/threads/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        threadId: `employee_${employeeId}`,
        messages: [{
          role: 'system',
          content: JSON.stringify({
            timestamp: drillData.date.toISOString(),
            scenario: drillData.scenario,
            scenarioType,
            riskScore: drillData.riskScore,
            fellForPhish: drillData.fellForPhish,
            redFlagsMissed: drillData.redFlagsMissed || [],
            weaknesses: drillData.weaknesses || [],
            department: drillData.department,
          })
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Backboard] Failed to store drill result:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[Backboard] Error storing drill result:', error);
    return null;
  }
}

/**
 * Get AI-powered recommendations from Backboard based on org-wide drill history
 */
export async function getAIRecommendations(
  departmentData: Array<{
    department: string;
    submitRate: number;
    clickRate: number;
    total: number;
  }>
): Promise<string[]> {
  const apiKey = process.env.BACKBOARD_API_KEY;
  if (!apiKey) {
    console.warn('[Backboard] API key not configured');
    return [];
  }

  try {
    // Store current org analysis
    const analysisThreadId = 'org_wide_analysis';

    // Create a prompt for AI analysis
    const prompt = `Based on this security drill data across departments:

${departmentData.map(d =>
  `- ${d.department}: ${d.total} employees, ${d.submitRate}% fell for phishing, ${d.clickRate}% clicked`
).join('\n')}

Provide 3-5 specific, actionable recommendations for improving security awareness. Format as bullet points. Focus on high-risk departments and practical training strategies.`;

    const response = await fetch(`${BACKBOARD_API_URL}/v1/threads/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        threadId: analysisThreadId,
        messages: [{
          role: 'user',
          content: prompt
        }],
        send_to_llm: true,
        model: 'openai/gpt-4o-mini'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Backboard] Failed to get recommendations:', error);
      return [];
    }

    const data = await response.json();
    const content = data.messages?.[data.messages.length - 1]?.content || '';

    // Parse bullet points from response
    const recommendations = content
      .split('\n')
      .filter((line: string) => line.trim().match(/^[-•*]/))
      .map((line: string) => line.replace(/^[-•*]\s*/, '').trim())
      .filter((line: string) => line.length > 0);

    return recommendations;
  } catch (error) {
    console.error('[Backboard] Error getting recommendations:', error);
    return [];
  }
}

/**
 * Get employee drill history from Supabase (fallback when Backboard unavailable)
 */
async function getEmployeeHistoryFromSupabase(employeeId: string) {
  try {
    const { data: interactions, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('employee_id', employeeId)
      .not('call_analytics', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !interactions) {
      return [];
    }

    // Convert to Backboard message format for compatibility
    return interactions.map(i => ({
      content: JSON.stringify({
        timestamp: i.created_at,
        scenario: 'vishing_call',
        scenarioType: detectScenarioType(i.call_analytics),
        riskScore: (i.call_analytics as any)?.['Training Recommendations']?.riskScore,
        fellForPhish: i.vishing_outcome === 'failed',
        redFlagsMissed: (i.call_analytics as any)?.['Red Flags Recognition']?.redFlagsMissed || [],
        weaknesses: (i.call_analytics as any)?.['Training Recommendations']?.weaknesses || [],
        department: 'Unknown',
      })
    }));
  } catch (error) {
    console.error('[Backboard] Error fetching from Supabase:', error);
    return [];
  }
}

/**
 * Get employee's drill history from Backboard
 */
export async function getEmployeeHistory(employeeId: string) {
  const apiKey = process.env.BACKBOARD_API_KEY;
  if (!apiKey) {
    console.warn('[Backboard] API key not configured, using Supabase fallback');
    return getEmployeeHistoryFromSupabase(employeeId);
  }

  try {
    const response = await fetch(`${BACKBOARD_API_URL}/v1/threads/messages?threadId=employee_${employeeId}&limit=10`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.log('[Backboard] API returned error, using Supabase fallback');
      return getEmployeeHistoryFromSupabase(employeeId);
    }

    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error('[Backboard] Error fetching employee history:', error);
    console.log('[Backboard] Using Supabase fallback');
    return getEmployeeHistoryFromSupabase(employeeId);
  }
}

/**
 * Predictive Risk Analysis Types
 */
export interface AttackTypeRisk {
  attackType: string;
  riskScore: number; // 0-100
  confidence: number; // 0-100
  reasoning: string;
}

export interface PredictiveRiskScore {
  employeeId: string;
  overallRiskScore: number;
  attackTypeBreakdown: AttackTypeRisk[];
  trendingWeaknesses: string[];
  recommendations: string[];
  lastUpdated: string;
}

/**
 * Fallback: Calculate risk score locally when Backboard unavailable
 */
function calculateLocalRiskScore(history: any[]): PredictiveRiskScore {
  let totalDrills = 0;
  let failures = 0;
  let totalRiskScore = 0;
  const weaknessMap = new Map<string, number>();
  const scenarioMap = new Map<string, { total: number; failed: number }>();

  history.forEach((msg: any) => {
    try {
      const data = JSON.parse(msg.content);
      totalDrills++;

      if (data.fellForPhish) failures++;
      if (data.riskScore) totalRiskScore += data.riskScore;

      // Track weaknesses
      (data.weaknesses || []).forEach((w: string) => {
        weaknessMap.set(w, (weaknessMap.get(w) || 0) + 1);
      });

      // Track scenario types
      const scenario = data.scenarioType || 'unknown';
      const stats = scenarioMap.get(scenario) || { total: 0, failed: 0 };
      stats.total++;
      if (data.fellForPhish) stats.failed++;
      scenarioMap.set(scenario, stats);
    } catch {}
  });

  // Calculate overall risk
  const failureRate = totalDrills > 0 ? (failures / totalDrills) : 0;

  // Use VAPI risk scores if available, otherwise use failure rate
  let avgRiskScore = 50; // Default baseline
  if (totalRiskScore > 0 && totalDrills > 0) {
    avgRiskScore = totalRiskScore / totalDrills;
  } else {
    // No VAPI risk scores available - calculate based on failures
    avgRiskScore = failureRate * 100;
  }

  // Weight failure rate heavily (70%) since it's the most important indicator
  const overallRiskScore = Math.round(failureRate * 100 * 0.7 + avgRiskScore * 0.3);

  console.log(`[Predictive] Risk calc: ${totalDrills} drills, ${failures} failures (${(failureRate*100).toFixed(1)}%), avgRisk: ${avgRiskScore.toFixed(1)}, overall: ${overallRiskScore}`);

  // Attack type breakdown
  const attackTypeBreakdown: AttackTypeRisk[] = Array.from(scenarioMap.entries())
    .map(([type, stats]) => ({
      attackType: type.replace(/_/g, ' '),
      riskScore: Math.round((stats.failed / stats.total) * 100),
      confidence: Math.min(stats.total * 20, 100),
      reasoning: `Failed ${stats.failed} out of ${stats.total} drills`
    }))
    .sort((a, b) => b.riskScore - a.riskScore);

  // Top weaknesses
  const trendingWeaknesses = Array.from(weaknessMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w]) => w);

  // Generate recommendations
  const recommendations: string[] = [];
  if (overallRiskScore > 70) {
    recommendations.push('Immediate one-on-one security coaching required');
    recommendations.push('Enroll in advanced phishing recognition training');
  } else if (overallRiskScore > 50) {
    recommendations.push('Schedule refresher training on phishing awareness');
    recommendations.push('Review recent drill failures with manager');
  } else {
    recommendations.push('Continue regular drill participation');
    recommendations.push('Share best practices with colleagues');
  }

  if (trendingWeaknesses.length > 0) {
    recommendations.push(`Focus training on: ${trendingWeaknesses[0]}`);
  }

  return {
    employeeId: '',
    overallRiskScore,
    attackTypeBreakdown,
    trendingWeaknesses,
    recommendations: recommendations.slice(0, 3),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get predictive risk score for an employee based on their drill history
 * Uses Backboard AI to analyze patterns, falls back to local calculation if unavailable
 */
export async function getPredictiveRiskScore(
  employeeId: string,
  employeeName: string,
  department: string
): Promise<PredictiveRiskScore | null> {
  const apiKey = process.env.BACKBOARD_API_KEY;

  try {
    // Fetch employee's historical drill data
    const history = await (apiKey ? getEmployeeHistory(employeeId) : getEmployeeHistoryFromSupabase(employeeId));

    if (!history || history.length === 0) {
      console.log(`[Backboard] No history for employee ${employeeId}, returning baseline risk`);
      return {
        employeeId,
        overallRiskScore: 50,
        attackTypeBreakdown: [],
        trendingWeaknesses: [],
        recommendations: ['Complete initial security awareness training', 'Participate in first drill to establish baseline'],
        lastUpdated: new Date().toISOString(),
      };
    }

    // Try Backboard AI first if API key available
    if (apiKey) {
      try {
        const prompt = `Analyze this employee's phishing drill history and predict vulnerability to future attacks.

Employee: ${employeeName}
Department: ${department}
Historical Drill Results (${history.length} drills):
${history.map((msg: any) => {
  try {
    const data = JSON.parse(msg.content);
    return `- ${data.fellForPhish ? 'FAILED' : 'PASSED'}: ${data.scenario}, Risk Score: ${data.riskScore || 'N/A'}, Weaknesses: ${data.weaknesses?.join(', ') || 'None'}`;
  } catch { return ''; }
}).filter(Boolean).join('\n')}

Provide JSON with overall risk score (0-100), attack type breakdown, trending weaknesses, and top 3 recommendations.
Format: {"overallRiskScore": number, "attackTypeBreakdown": [{"attackType": string, "riskScore": number, "confidence": number, "reasoning": string}], "trendingWeaknesses": [string], "recommendations": [string]}`;

        // Store the analysis request in Backboard thread
        const response = await fetch(`${BACKBOARD_API_URL}/v1/threads/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            threadId: `risk_analysis_${employeeId}`,
            messages: [{
              role: 'user',
              content: prompt
            }],
            send_to_llm: true, // Request AI response
            model: 'openai/gpt-4o-mini'
          })
        });

        if (response.ok) {
          const data = await response.json();
          // Backboard returns the AI response in the messages array
          const aiResponse = data.messages?.[data.messages.length - 1]?.content || '{}';
          const analysis = JSON.parse(aiResponse);
          console.log(`[Backboard] ✅ AI analysis complete for ${employeeId}`);
          return {
            employeeId,
            overallRiskScore: analysis.overallRiskScore || 50,
            attackTypeBreakdown: analysis.attackTypeBreakdown || [],
            trendingWeaknesses: analysis.trendingWeaknesses || [],
            recommendations: analysis.recommendations || [],
            lastUpdated: new Date().toISOString(),
          };
        }

        throw new Error(`API returned ${response.status}`);
      } catch (aiError) {
        console.warn(`[Backboard] AI failed, using local calculation:`, (aiError as Error).message);
      }
    }

    // Fallback: Local calculation
    console.log(`[Backboard] Using local analysis for ${history.length} drills`);
    const riskScore = calculateLocalRiskScore(history);
    riskScore.employeeId = employeeId;
    return riskScore;
  } catch (error) {
    console.error('[Backboard] Error:', error);
    return null;
  }
}

/**
 * Get department-level risk trends using local analysis
 */
export async function getDepartmentRiskTrends(
  departmentName: string,
  employeesData: Array<{
    id: string;
    name: string;
    recentDrills: number;
    failureRate: number;
    commonWeaknesses: string[];
  }>
): Promise<{
  department: string;
  avgRiskScore: number;
  trendingVulnerabilities: string[];
  highRiskEmployees: string[];
  recommendations: string[];
} | null> {
  try {
    console.log(`[Predictive] Analyzing department: ${departmentName} with ${employeesData.length} employees`);

    // Local calculation - no Backboard API needed
    // Calculate average risk score
    const avgRiskScore = employeesData.length > 0
      ? Math.round(employeesData.reduce((sum, emp) => sum + emp.failureRate, 0) / employeesData.length)
      : 50;

    // Aggregate all weaknesses
    const weaknessCount = new Map<string, number>();
    employeesData.forEach(emp => {
      emp.commonWeaknesses.forEach(w => {
        weaknessCount.set(w, (weaknessCount.get(w) || 0) + 1);
      });
    });

    // Top 3 trending vulnerabilities
    const trendingVulnerabilities = Array.from(weaknessCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([w]) => w);

    // Identify high-risk employees (failure rate > 50%)
    const highRiskEmployees = employeesData
      .filter(emp => emp.failureRate > 50)
      .sort((a, b) => b.failureRate - a.failureRate)
      .slice(0, 3)
      .map(emp => emp.name);

    // Generate recommendations
    const recommendations: string[] = [];
    if (avgRiskScore > 60) {
      recommendations.push(`Department requires immediate attention with ${avgRiskScore}% average failure rate`);
      recommendations.push(`Schedule department-wide security training for ${departmentName}`);
    } else if (avgRiskScore > 40) {
      recommendations.push(`Moderate risk detected in ${departmentName} - schedule refresher training`);
    } else {
      recommendations.push(`${departmentName} shows good security awareness - maintain current training`);
    }

    if (highRiskEmployees.length > 0) {
      recommendations.push(`Provide one-on-one coaching for: ${highRiskEmployees.join(', ')}`);
    }

    if (trendingVulnerabilities.length > 0) {
      recommendations.push(`Focus department training on: ${trendingVulnerabilities[0]}`);
    }

    return {
      department: departmentName,
      avgRiskScore,
      trendingVulnerabilities,
      highRiskEmployees,
      recommendations: recommendations.slice(0, 3),
    };

  } catch (error) {
    console.error('[Predictive] Error analyzing department trends:', error);
    return null;
  }
}
