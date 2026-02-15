"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
};

interface HoverInfo {
  label: string;
  value: number;
  percent: number;
  color: string;
}

function DonutChart({ safe, clicked, failed, total }: { safe: number; clicked: number; failed: number; total: number }) {
  const size = 220;
  const outerR = 95;
  const innerR = 60;
  const cx = size / 2;
  const cy = size / 2;

  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<HoverInfo | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const segments = [
    { label: "Safe", value: safe, color: "#1d4ed8", hover: "#2563eb", glow: "rgba(37,99,235,0.5)" },
    { label: "Clicked", value: clicked, color: "#60a5fa", hover: "#7dd3fc", glow: "rgba(96,165,250,0.4)" },
    { label: "Failed", value: failed, color: "#bfdbfe", hover: "#dbeafe", glow: "rgba(191,219,254,0.4)" },
  ];

  const safeRate = total > 0 ? Math.round((safe / total) * 100) : 0;

  let startAngle = -90;
  const arcs = segments.map((seg) => {
    const fraction = total > 0 ? seg.value / total : 0;
    const sweep = fraction * 360;
    const gap = fraction > 0 ? 1.5 : 0;
    const result = { ...seg, start: startAngle + gap / 2, end: startAngle + sweep - gap / 2, fraction };
    startAngle += sweep;
    return result;
  });

  function toRad(deg: number) {
    return (deg * Math.PI) / 180;
  }

  function arcPath(startDeg: number, endDeg: number, inner: number, outer: number) {
    const sweep = endDeg - startDeg;
    if (sweep <= 0) return "";
    const largeArc = sweep > 180 ? 1 : 0;

    const os = { x: cx + outer * Math.cos(toRad(startDeg)), y: cy + outer * Math.sin(toRad(startDeg)) };
    const oe = { x: cx + outer * Math.cos(toRad(endDeg)), y: cy + outer * Math.sin(toRad(endDeg)) };
    const ie = { x: cx + inner * Math.cos(toRad(endDeg)), y: cy + inner * Math.sin(toRad(endDeg)) };
    const is_ = { x: cx + inner * Math.cos(toRad(startDeg)), y: cy + inner * Math.sin(toRad(startDeg)) };

    return [
      `M ${os.x} ${os.y}`,
      `A ${outer} ${outer} 0 ${largeArc} 1 ${oe.x} ${oe.y}`,
      `L ${ie.x} ${ie.y}`,
      `A ${inner} ${inner} 0 ${largeArc} 0 ${is_.x} ${is_.y}`,
      `Z`,
    ].join(" ");
  }

  return (
    <div
      className="relative transition-all duration-700 ease-out mx-auto"
      style={{
        width: size,
        height: size,
        transform: mounted ? "scale(1)" : "scale(0.85)",
        opacity: mounted ? 1 : 0,
      }}
    >
      <svg width={size} height={size} style={{ filter: "drop-shadow(0 0 20px rgba(29,78,216,0.12))" }}>
        <defs>
          {segments.map((seg, i) => (
            <linearGradient key={`g${i}`} id={`analytics-donut-g-${i}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={seg.hover} />
              <stop offset="100%" stopColor={seg.color} />
            </linearGradient>
          ))}
          <radialGradient id="analytics-hole-shadow" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
          </radialGradient>
          <linearGradient id="analytics-gloss" x1="0.3" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.03)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={outerR - innerR} />

        {arcs.map((arc, i) => {
          if (arc.fraction <= 0) return null;
          const isHov = hovered?.label === arc.label;
          const path = arcPath(arc.start, arc.end, innerR, outerR);
          const midAngle = toRad((arc.start + arc.end) / 2);
          const tx = isHov ? Math.cos(midAngle) * 4 : 0;
          const ty = isHov ? Math.sin(midAngle) * 4 : 0;

          return (
            <path
              key={i}
              d={path}
              fill={`url(#analytics-donut-g-${i})`}
              className="cursor-pointer"
              style={{
                filter: isHov ? `drop-shadow(0 0 10px ${arc.glow})` : "none",
                transform: `translate(${tx}px, ${ty}px)`,
                transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), filter 0.2s ease",
              }}
              onMouseEnter={() => setHovered({
                label: arc.label,
                value: arc.value,
                percent: total > 0 ? Math.round((arc.value / total) * 100) : 0,
                color: arc.color,
              })}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}

        <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke="url(#analytics-gloss)" strokeWidth={outerR - innerR} pointerEvents="none" />
        <circle cx={cx} cy={cy} r={innerR} fill="url(#analytics-hole-shadow)" pointerEvents="none" />
        <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} pointerEvents="none" />
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} pointerEvents="none" />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center transition-all duration-200">
          {hovered ? (
            <>
              <span className="text-2xl font-bold text-white tracking-tight">{hovered.percent}%</span>
              <span className="text-xs font-medium mt-0.5" style={{ color: hovered.color }}>{hovered.label}</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">{hovered.value} interactions</span>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold text-white tracking-tight">{safeRate}%</span>
              <span className="text-xs text-neutral-400 mt-0.5">Safe Rate</span>
              <span className="text-[10px] text-neutral-600 mt-0.5">{total} total</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

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

  const { overview, departmentBreakdown, timeline } = data;

  const safe = overview.totalInteractions - overview.clicked;
  const clickedOnly = overview.clicked - overview.failed;

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
          {/* Security Score Donut */}
          <div className="p-5 rounded-xl bg-[#111118]/40 border border-white/[0.06] flex flex-col items-center justify-center">
            <h3 className="text-sm font-medium text-white mb-4">Security Score</h3>
            <DonutChart
              safe={safe}
              clicked={clickedOnly}
              failed={overview.failed}
              total={overview.totalInteractions}
            />
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
