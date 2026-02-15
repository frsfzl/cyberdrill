"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, BarChart3 } from "lucide-react";
import type { Campaign as Drill, Employee } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    employees: 0,
    campaigns: 0,
    activeCampaigns: 0,
  });
  const [recentDrills, setRecentDrills] = useState<Drill[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [empRes, drillRes] = await Promise.all([
          fetch("/api/employees"),
          fetch("/api/drills"),
        ]);
        const employees: Employee[] = await empRes.json();
        const drills: Drill[] = await drillRes.json();
        setStats({
          employees: employees.length,
          campaigns: drills.length,
          activeCampaigns: drills.filter((d) => d.status === "active")
            .length,
        });
        setRecentDrills(drills.slice(0, 5));
      } catch {
        // API may not be ready yet
      }
    }
    load();
  }, []);

  const statCards = [
    {
      title: "Total Employees",
      value: stats.employees,
      icon: Users,
    },
    {
      title: "Total Drills",
      value: stats.campaigns,
      icon: Target,
    },
    {
      title: "Active Drills",
      value: stats.activeCampaigns,
      icon: BarChart3,
    },
  ];

  return (
    <DashboardShell>
      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Drills</CardTitle>
        </CardHeader>
        <CardContent>
          {recentDrills.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No drills yet. Create your first drill to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {recentDrills.map((drill) => (
                <Link
                  key={drill.id}
                  href={`/dashboard/drills/${drill.id}`}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="font-medium">{drill.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {drill.pretext_scenario}
                    </p>
                  </div>
                  <span className="text-xs font-medium uppercase rounded-full bg-secondary px-2 py-1">
                    {drill.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
