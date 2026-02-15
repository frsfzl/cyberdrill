"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  X,
  Filter,
  Settings,
  Mail,
  Phone,
  Shield,
  Target
} from "lucide-react";

interface Alert {
  id: string;
  title: string;
  message: string;
  type: "critical" | "warning" | "info" | "success";
  category: "security" | "drill" | "system" | "employee";
  timestamp: string;
  read: boolean;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    title: "High Click Rate Detected",
    message: "The 'Q1 Security Test' drill has a 45% click rate, significantly above average.",
    type: "warning",
    category: "drill",
    timestamp: "2026-02-14T10:30:00Z",
    read: false,
  },
  {
    id: "2",
    title: "Employee Reported Phishing",
    message: "Sarah Chen reported a suspicious email that matched an active drill pattern.",
    type: "success",
    category: "employee",
    timestamp: "2026-02-14T09:15:00Z",
    read: false,
  },
  {
    id: "3",
    title: "New Vishing Script Available",
    message: "An updated AI voice script for IT support scenarios is now available.",
    type: "info",
    category: "system",
    timestamp: "2026-02-13T16:45:00Z",
    read: true,
  },
  {
    id: "4",
    title: "Failed Login Attempts",
    message: "Multiple failed login attempts detected from IP 192.168.1.45.",
    type: "critical",
    category: "security",
    timestamp: "2026-02-13T14:20:00Z",
    read: false,
  },
  {
    id: "5",
    title: "Drill Completed Successfully",
    message: "The 'Executive Team Test' drill has been completed. View the full report.",
    type: "success",
    category: "drill",
    timestamp: "2026-02-12T11:00:00Z",
    read: true,
  },
];

const typeConfig = {
  critical: { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: AlertTriangle },
  warning: { color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: AlertTriangle },
  info: { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Info },
  success: { color: "bg-green-500/10 text-green-400 border-green-500/20", icon: CheckCircle2 },
};

const categoryConfig = {
  security: { label: "Security", icon: Shield },
  drill: { label: "Drill", icon: Target },
  system: { label: "System", icon: Settings },
  employee: { label: "Employee", icon: Mail },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [filter, setFilter] = useState<"all" | "unread" | "critical">("all");

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "unread") return !alert.read;
    if (filter === "critical") return alert.type === "critical";
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.read).length;
  const criticalCount = alerts.filter((a) => a.type === "critical" && !a.read).length;

  function markAsRead(id: string) {
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, read: true } : a)));
  }

  function dismissAlert(id: string) {
    setAlerts(alerts.filter((a) => a.id !== id));
  }

  function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-[#111118]/40 border-white/[0.06]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Total Alerts</p>
                  <p className="text-3xl font-bold text-white mt-1">{alerts.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#111118]/40 border-white/[0.06]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Unread</p>
                  <p className="text-3xl font-bold text-white mt-1">{unreadCount}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#111118]/40 border-white/[0.06]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Critical</p>
                  <p className="text-3xl font-bold text-white mt-1">{criticalCount}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className={`h-9 px-4 rounded-lg ${
                filter === "all"
                  ? "bg-white text-black hover:bg-neutral-200"
                  : "border-white/[0.06] bg-[#111118]/60 text-neutral-300 hover:bg-white/[0.05]"
              }`}
            >
              All
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
              className={`h-9 px-4 rounded-lg ${
                filter === "unread"
                  ? "bg-white text-black hover:bg-neutral-200"
                  : "border-white/[0.06] bg-[#111118]/60 text-neutral-300 hover:bg-white/[0.05]"
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                  {unreadCount}
                </span>
              )}
            </Button>
            <Button
              variant={filter === "critical" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("critical")}
              className={`h-9 px-4 rounded-lg ${
                filter === "critical"
                  ? "bg-white text-black hover:bg-neutral-200"
                  : "border-white/[0.06] bg-[#111118]/60 text-neutral-300 hover:bg-white/[0.05]"
              }`}
            >
              Critical
              {criticalCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">
                  {criticalCount}
                </span>
              )}
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 rounded-lg border-white/[0.06] bg-[#111118]/60 text-neutral-300 hover:bg-white/[0.05]"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <Card className="bg-[#111118]/40 border-white/[0.06]">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-blue-400/50" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No alerts</h3>
                <p className="text-neutral-500">You're all caught up!</p>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert) => {
              const typeInfo = typeConfig[alert.type];
              const categoryInfo = categoryConfig[alert.category];
              const TypeIcon = typeInfo.icon;
              const CategoryIcon = categoryInfo.icon;

              return (
                <Card
                  key={alert.id}
                  className={`group bg-[#111118]/40 border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 ${
                    !alert.read ? "border-l-2 border-l-blue-500" : ""
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeInfo.color}`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-semibold ${!alert.read ? "text-white" : "text-neutral-300"}`}>
                                {alert.title}
                              </h3>
                              {!alert.read && (
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                              )}
                            </div>
                            <p className="text-sm text-neutral-400 mb-2">{alert.message}</p>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-xs border-white/[0.08] text-neutral-500">
                                <CategoryIcon className="h-3 w-3 mr-1" />
                                {categoryInfo.label}
                              </Badge>
                              <span className="text-xs text-neutral-500">{formatTime(alert.timestamp)}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!alert.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(alert.id)}
                                className="h-8 text-xs text-neutral-400 hover:text-white hover:bg-white/[0.05]"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Mark read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => dismissAlert(alert.id)}
                              className="h-8 w-8 text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
