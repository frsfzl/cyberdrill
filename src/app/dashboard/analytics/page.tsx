"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Users,
  Target,
  MousePointerClick,
  ShieldAlert,
  Flag,
  TrendingUp,
  TrendingDown,
  Activity,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Phone,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalEmployees: number;
    totalCampaigns: number;
    activeCampaigns: number;
    totalInteractions: number;
    clickRate: number;
    submitRate: number;
    reportRate: number;
  };
  departmentBreakdown: {
    department: string;
    total: number;
    clicked: number;
    submitted: number;
    reported: number;
    clickRate: number;
    submitRate: number;
  }[];
  campaignTimeline: {
    id: string;
    name: string;
    status: string;
    created_at: string;
    closed_at: string | null;
    targets: number;
  }[];
}

const COLORS = {
  primary: "hsl(var(--primary))",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  violet: "#8b5cf6",
  cyan: "#06b6d4",
};

const PIE_COLORS = [COLORS.danger, COLORS.warning, COLORS.success];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto animate-pulse" />
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const { overview, departmentBreakdown } = data;

  // Calculate risk level
  const getRiskLevel = (submitRate: number) => {
    if (submitRate >= 30) return { label: "Critical", color: "text-red-500", bg: "bg-red-500/10" };
    if (submitRate >= 20) return { label: "High", color: "text-orange-500", bg: "bg-orange-500/10" };
    if (submitRate >= 10) return { label: "Medium", color: "text-yellow-500", bg: "bg-yellow-500/10" };
    return { label: "Low", color: "text-green-500", bg: "bg-green-500/10" };
  };

  const overallRisk = getRiskLevel(overview.submitRate);

  // Prepare chart data
  const departmentChartData = departmentBreakdown.map((d) => ({
    department: d.department.length > 15 ? d.department.substring(0, 15) + "..." : d.department,
    clickRate: d.clickRate,
    submitRate: d.submitRate,
    reportRate: ((d.reported / d.total) * 100) || 0,
  }));

  const interactionPieData = [
    { name: "Submitted", value: overview.submitRate, color: COLORS.danger },
    { name: "Clicked Only", value: overview.clickRate - overview.submitRate, color: COLORS.warning },
    { name: "No Interaction", value: 100 - overview.clickRate, color: COLORS.success },
  ];

  const radarData = departmentBreakdown.slice(0, 6).map((d) => ({
    department: d.department,
    vulnerability: d.submitRate,
    awareness: ((d.reported / d.total) * 100) || 0,
    engagement: d.clickRate,
  }));

  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Controls */}
        <div className="flex justify-end">
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Employees
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overview.totalEmployees}</div>
              <p className="text-xs text-muted-foreground mt-2">Enrolled in drills</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-violet-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Campaigns
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overview.totalCampaigns}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {overview.activeCampaigns} currently active
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Click Rate
                </CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overview.clickRate.toFixed(1)}%</div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingDown className="h-3 w-3 text-green-500" />
                <p className="text-xs text-green-500">-2.3% from last period</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-danger">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Submission Rate
                </CardTitle>
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overview.submitRate.toFixed(1)}%</div>
              <Badge variant="outline" className={`mt-2 ${overallRisk.color} border-current`}>
                {overallRisk.label} Risk
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-success">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Report Rate
                </CardTitle>
                <Flag className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{overview.reportRate.toFixed(1)}%</div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <p className="text-xs text-green-500">+5.7% from last period</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Interaction Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Interaction Distribution</CardTitle>
              <CardDescription>
                Employee response breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={interactionPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {interactionPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {interactionPieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Department Vulnerability Radar */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Department Vulnerability Assessment</CardTitle>
              <CardDescription>
                Multi-dimensional risk analysis across departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="department"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  />
                  <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Radar
                    name="Vulnerability"
                    dataKey="vulnerability"
                    stroke={COLORS.danger}
                    fill={COLORS.danger}
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Awareness"
                    dataKey="awareness"
                    stroke={COLORS.success}
                    fill={COLORS.success}
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Department Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Department Performance Comparison</CardTitle>
            <CardDescription>
              Click rates, submission rates, and report rates by department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={departmentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="department"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Legend />
                <Bar dataKey="clickRate" fill={COLORS.warning} name="Click Rate" radius={[4, 4, 0, 0]} />
                <Bar dataKey="submitRate" fill={COLORS.danger} name="Submit Rate" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reportRate" fill={COLORS.success} name="Report Rate" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Risk Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>Department Risk Heatmap</CardTitle>
            <CardDescription>
              Detailed breakdown of security awareness by department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {departmentBreakdown.map((dept) => {
                const risk = getRiskLevel(dept.submitRate);
                return (
                  <div
                    key={dept.department}
                    className="p-4 rounded-lg border hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1.5 rounded-lg ${risk.bg}`}>
                          {dept.submitRate >= 30 ? (
                            <AlertTriangle className={`h-5 w-5 ${risk.color}`} />
                          ) : (
                            <CheckCircle2 className={`h-5 w-5 ${risk.color}`} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{dept.department}</h3>
                          <p className="text-sm text-muted-foreground">
                            {dept.total} employees targeted
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`${risk.color} border-current`}>
                        {risk.label} Risk
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Click Rate</span>
                          <span className="text-sm font-medium">{dept.clickRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={dept.clickRate} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Submit Rate</span>
                          <span className="text-sm font-medium">{dept.submitRate.toFixed(1)}%</span>
                        </div>
                        <Progress
                          value={dept.submitRate}
                          className="h-2"
                          style={{ "--progress-background": COLORS.danger } as React.CSSProperties}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Report Rate</span>
                          <span className="text-sm font-medium">
                            {((dept.reported / dept.total) * 100 || 0).toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={(dept.reported / dept.total) * 100 || 0}
                          className="h-2"
                          style={{ "--progress-background": COLORS.success } as React.CSSProperties}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MousePointerClick className="h-4 w-4" />
                        <span>{dept.clicked} clicked</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ShieldAlert className="h-4 w-4" />
                        <span>{dept.submitted} submitted</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Flag className="h-4 w-4" />
                        <span>{dept.reported} reported</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="border-l-4 border-l-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              AI-Generated Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentBreakdown
                .filter((d) => d.submitRate >= 20)
                .map((dept) => (
                  <div key={dept.department} className="flex gap-4 p-4 rounded-lg bg-warning/5 border border-warning/20">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{dept.department}</h4>
                      <p className="text-sm text-muted-foreground">
                        High vulnerability detected with {dept.submitRate.toFixed(1)}% submission rate.
                        Recommend mandatory security awareness training within 30 days and follow-up drill
                        within 60 days.
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Schedule Training
                    </Button>
                  </div>
                ))}
              {departmentBreakdown.filter((d) => d.submitRate >= 20).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No critical recommendations at this time. Continue monitoring and conducting regular drills.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
