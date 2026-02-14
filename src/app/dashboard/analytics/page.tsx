"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Target,
  MousePointerClick,
  ShieldAlert,
  Flag,
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

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <DashboardShell>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-muted-foreground">Loading...</p>
      </DashboardShell>
    );
  }

  const { overview, departmentBreakdown, campaignTimeline } = data;

  const statCards = [
    {
      title: "Total Employees",
      value: overview.totalEmployees,
      icon: Users,
    },
    {
      title: "Total Campaigns",
      value: overview.totalCampaigns,
      icon: Target,
    },
    {
      title: "Click Rate",
      value: `${overview.clickRate}%`,
      icon: MousePointerClick,
    },
    {
      title: "Submission Rate",
      value: `${overview.submitRate}%`,
      icon: ShieldAlert,
    },
    {
      title: "Report Rate",
      value: `${overview.reportRate}%`,
      icon: Flag,
    },
  ];

  return (
    <DashboardShell>
      <h2 className="text-2xl font-bold">Analytics</h2>

      <div className="grid gap-4 md:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {departmentBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Total Targets</TableHead>
                  <TableHead>Click Rate</TableHead>
                  <TableHead>Submission Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentBreakdown.map((dept) => (
                  <TableRow key={dept.department}>
                    <TableCell className="font-medium">
                      {dept.department}
                    </TableCell>
                    <TableCell>{dept.total}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={dept.clickRate} className="w-20" />
                        <span className="text-sm">{dept.clickRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={dept.submitRate} className="w-20" />
                        <span className="text-sm">{dept.submitRate}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {campaignTimeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No campaigns yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Targets</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Closed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignTimeline.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="capitalize">{c.status}</TableCell>
                    <TableCell>{c.targets}</TableCell>
                    <TableCell>
                      {new Date(c.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {c.closed_at
                        ? new Date(c.closed_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
