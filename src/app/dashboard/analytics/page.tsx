"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

interface AnalyticsData {
  overview: {
    totalEmployees: number;
    totalDrills: number;
    emailDrills: number;
    callDrills: number;
    totalInteractions: number;
    clicked: number;
    failed: number;
    clickRate: number;
    failRate: number;
    successRate: number;
  };
  drillTypeBreakdown: {
    type: string;
    count: number;
    clicked: number;
    failed: number;
  }[];
  departmentBreakdown: {
    department: string;
    total: number;
    clicked: number;
    failed: number;
    clickRate: number;
    failRate: number;
  }[];
  timeline: {
    date: string;
    email: number;
    call: number;
  }[];
}

const COLORS = {
  email: "#3b82f6",
  call: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  neutral: "#6b7280",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !data) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span className="text-sm text-neutral-400">Loading analytics...</span>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const { overview, drillTypeBreakdown, departmentBreakdown, timeline } = data;

  const getRiskColor = (rate: number) => {
    if (rate >= 30) return "text-red-400";
    if (rate >= 15) return "text-amber-400";
    return "text-emerald-400";
  };

  const getRiskBg = (rate: number) => {
    if (rate >= 30) return "bg-red-500/10 border-red-500/20";
    if (rate >= 15) return "bg-amber-500/10 border-amber-500/20";
    return "bg-emerald-500/10 border-emerald-500/20";
  };

  return (
    <DashboardShell>
      <div className="max-w-7xl mx-auto py-8 px-6 space-y-8">
        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-6">
          {/* Drill Type Breakdown */}
          <div className="p-5 rounded-xl bg-[#111118]/40 border border-white/[0.06]">
            <h3 className="text-sm font-medium text-white mb-4">Drill Type Breakdown</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={drillTypeBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    <Cell fill={COLORS.email} />
                    <Cell fill={COLORS.call} />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111118",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs text-neutral-400">Email ({overview.emailDrills})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-xs text-neutral-400">Call ({overview.callDrills})</span>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="col-span-2 p-5 rounded-xl bg-[#111118]/40 border border-white/[0.06]">
            <h3 className="text-sm font-medium text-white mb-4">Activity Timeline</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="colorEmail" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.email} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.email} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.call} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.call} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <YAxis
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111118",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="email"
                    stroke={COLORS.email}
                    fillOpacity={1}
                    fill="url(#colorEmail)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="call"
                    stroke={COLORS.call}
                    fillOpacity={1}
                    fill="url(#colorCall)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Department Performance */}
        <div className="p-5 rounded-xl bg-[#111118]/40 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-medium text-white">Department Performance</h3>
            <div className="flex items-center gap-4 text-xs text-neutral-400">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Click Rate
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Fail Rate
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentBreakdown} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="department"
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111118",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(v) => `${v}%`}
                />
                <Bar dataKey="clickRate" fill={COLORS.email} radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="failRate" fill={COLORS.danger} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Risk Cards */}
        <div>
          <h3 className="text-sm font-medium text-white mb-4">Department Risk Assessment</h3>
          <div className="grid grid-cols-3 gap-4">
            {departmentBreakdown.slice(0, 6).map((dept) => (
              <div
                key={dept.department}
                className={`p-4 rounded-xl border ${getRiskBg(dept.failRate)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white">{dept.department}</h4>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getRiskColor(dept.failRate)} border-current`}
                  >
                    {dept.failRate >= 30 ? "High" : dept.failRate >= 15 ? "Medium" : "Low"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">Employees</span>
                    <span className="text-white">{dept.total}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">Clicked</span>
                    <span className="text-amber-400">{dept.clicked}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">Failed</span>
                    <span className="text-red-400">{dept.failed}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Fail Rate</span>
                    <span className={getRiskColor(dept.failRate)}>{dept.failRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
