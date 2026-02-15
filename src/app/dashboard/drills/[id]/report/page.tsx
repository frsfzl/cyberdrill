"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import type { Campaign as Drill, Interaction } from "@/types";

type DrillWithInteractions = Drill & {
  interactions: (Interaction & {
    employees: { name: string; email: string; department: string };
  })[];
};

export default function DrillReportPage() {
  const { id } = useParams<{ id: string }>();
  const [drill, setDrill] = useState<DrillWithInteractions | null>(
    null
  );

  useEffect(() => {
    fetch(`/api/drills/${id}`)
      .then((r) => r.json())
      .then(setDrill)
      .catch(() => {});
  }, [id]);

  if (!drill) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  const interactions = drill.interactions || [];
  const total = interactions.length;
  const delivered = interactions.filter(
    (i) => i.state !== "PENDING"
  ).length;
  const clicked = interactions.filter(
    (i) =>
      i.state === "LINK_CLICKED" || i.state === "CREDENTIALS_SUBMITTED"
  ).length;
  const submitted = interactions.filter(
    (i) => i.state === "CREDENTIALS_SUBMITTED"
  ).length;
  const reported = interactions.filter(
    (i) => i.state === "REPORTED"
  ).length;
  const noAction = interactions.filter(
    (i) => i.state === "NO_INTERACTION" || i.state === "DELIVERED"
  ).length;

  const pct = (n: number) =>
    total > 0 ? Math.round((n / total) * 100) : 0;

  return (
    <DashboardShell>
      <div>
        <h2 className="text-2xl font-bold">{drill.name} - Report</h2>
        <p className="text-muted-foreground">
          {drill.company_name} | {drill.pretext_scenario}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: "Targets", value: total },
          { label: "Delivered", value: `${pct(delivered)}%` },
          { label: "Clicked", value: `${pct(clicked)}%` },
          { label: "Submitted", value: `${pct(submitted)}%` },
          { label: "Reported", value: `${pct(reported)}%` },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funnel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Delivered", count: delivered, color: "bg-blue-500" },
            { label: "Link Clicked", count: clicked, color: "bg-yellow-500" },
            {
              label: "Credentials Submitted",
              count: submitted,
              color: "bg-red-500",
            },
            { label: "Reported", count: reported, color: "bg-green-500" },
            { label: "No Action", count: noAction, color: "bg-muted" },
          ].map((step) => (
            <div key={step.label} className="flex items-center gap-4">
              <span className="w-44 text-sm">{step.label}</span>
              <Progress value={pct(step.count)} className="flex-1" />
              <span className="w-16 text-sm text-right">
                {step.count} ({pct(step.count)}%)
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Individual Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Risk Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interactions.map((i) => {
                const risk =
                  i.state === "CREDENTIALS_SUBMITTED"
                    ? "High"
                    : i.state === "LINK_CLICKED"
                      ? "Medium"
                      : i.state === "REPORTED"
                        ? "Low"
                        : "None";
                const riskColor =
                  risk === "High"
                    ? "bg-red-500/20 text-red-500"
                    : risk === "Medium"
                      ? "bg-yellow-500/20 text-yellow-500"
                      : risk === "Low"
                        ? "bg-green-500/20 text-green-500"
                        : "bg-muted";
                return (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">
                      {i.employees?.name}
                    </TableCell>
                    <TableCell>{i.employees?.email}</TableCell>
                    <TableCell>{i.employees?.department}</TableCell>
                    <TableCell className="capitalize">
                      {i.state.toLowerCase().replace(/_/g, " ")}
                    </TableCell>
                    <TableCell>
                      <Badge className={riskColor}>{risk}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
