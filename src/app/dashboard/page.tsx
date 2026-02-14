"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Target, BarChart3, Plus } from "lucide-react";
import type { Campaign, Employee } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    employees: 0,
    campaigns: 0,
    activeCampaigns: 0,
  });
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [empRes, campRes] = await Promise.all([
          fetch("/api/employees"),
          fetch("/api/campaigns"),
        ]);
        const employees: Employee[] = await empRes.json();
        const campaigns: Campaign[] = await campRes.json();
        setStats({
          employees: employees.length,
          campaigns: campaigns.length,
          activeCampaigns: campaigns.filter((c) => c.status === "active")
            .length,
        });
        setRecentCampaigns(campaigns.slice(0, 5));
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
      title: "Total Campaigns",
      value: stats.campaigns,
      icon: Target,
    },
    {
      title: "Active Campaigns",
      value: stats.activeCampaigns,
      icon: BarChart3,
    },
  ];

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <Link href="/dashboard/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

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
          <CardTitle>Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCampaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No campaigns yet. Create your first campaign to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {recentCampaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/dashboard/campaigns/${campaign.id}`}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.pretext_scenario}
                    </p>
                  </div>
                  <span className="text-xs font-medium uppercase rounded-full bg-secondary px-2 py-1">
                    {campaign.status}
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
