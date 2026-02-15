"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, XCircle, Shield, Clock } from "lucide-react";

// Mock data for this week's tests
const totalSent = 245;
const totalPassed = 208;
const totalFailed = 37;

// Mock alerts data
const mockAlerts = [
  {
    id: 1,
    type: "warning",
    title: "High Failure Rate Detected",
    message: "Engineering department has a 45% failure rate in the latest phishing drill",
    time: "2 hours ago",
  },
  {
    id: 2,
    type: "success",
    title: "Drill Completed Successfully",
    message: "Q1 Security Awareness Training completed with 92% pass rate",
    time: "5 hours ago",
  },
  {
    id: 3,
    type: "info",
    title: "New Employees Added",
    message: "15 new employees added to the system and assigned to upcoming drills",
    time: "1 day ago",
  },
  {
    id: 4,
    type: "critical",
    title: "Multiple Failed Attempts",
    message: "User john.doe@company.com has failed 3 consecutive phishing tests",
    time: "2 days ago",
  },
];

export default function DashboardPage() {
  const passedPercentage = (totalPassed / totalSent) * 100;
  const failedPercentage = (totalFailed / totalSent) * 100;

  return (
    <DashboardShell>
      <div className="space-y-8 px-8 py-6">
        {/* Top Half - Stacked Bar Section */}
        <div>
          <h2 className="text-sm font-medium text-neutral-300 uppercase tracking-wider mb-6">Performance</h2>

          {/* Single Horizontal Stacked Bar */}
          <div>
            <div className="h-16 w-full bg-[#0a0a0f]/40 rounded-xl overflow-hidden border border-white/[0.06] flex">
              {/* Passed Section */}
              <div
                className="bg-blue-600/30 border-r border-blue-500/20 flex items-center justify-center transition-all"
                style={{ width: `${passedPercentage}%` }}
              >
                <span className="text-sm font-medium text-blue-300">
                  {totalPassed} Passed
                </span>
              </div>
              {/* Failed Section */}
              <div
                className="bg-blue-500/20 flex items-center justify-center transition-all"
                style={{ width: `${failedPercentage}%` }}
              >
                <span className="text-sm font-medium text-blue-400">
                  {totalFailed} Failed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Half - Alerts Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium text-neutral-300 uppercase tracking-wider">Recent Alerts</h2>
            <span className="text-sm text-neutral-500">Last 7 days</span>
          </div>

            <div className="space-y-3">
              {mockAlerts.map((alert) => {
                const alertIcons = {
                  warning: AlertTriangle,
                  success: CheckCircle2,
                  info: Shield,
                  critical: XCircle,
                };

                const Icon = alertIcons[alert.type as keyof typeof alertIcons];

                return (
                  <div
                    key={alert.id}
                    className="flex items-start gap-4 p-4 rounded-xl border bg-blue-500/10 border-blue-500/20 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white mb-1">{alert.title}</h3>
                          <p className="text-sm text-neutral-400 line-clamp-2">{alert.message}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-neutral-500 flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          {alert.time}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      </div>
    </DashboardShell>
  );
}
