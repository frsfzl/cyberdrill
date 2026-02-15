"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Loader2,
  Play,
  Square,
  BarChart3,
  ExternalLink,
  Phone,
  RefreshCw,
} from "lucide-react";
import { CallAnalyticsCard } from "@/components/call-analytics-card";
import type { Campaign, Interaction, Employee } from "@/types";

type CampaignWithInteractions = Campaign & {
  interactions: (Interaction & {
    employees: { name: string; email: string; department: string; position: string };
  })[];
};

const stateLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-secondary" },
  DELIVERED: { label: "Delivered", color: "bg-blue-500/20 text-blue-500" },
  LINK_CLICKED: {
    label: "Clicked",
    color: "bg-yellow-500/20 text-yellow-500",
  },
  CREDENTIALS_SUBMITTED: {
    label: "Submitted",
    color: "bg-red-500/20 text-red-500",
  },
  REPORTED: { label: "Reported", color: "bg-green-500/20 text-green-500" },
  NO_INTERACTION: { label: "No Action", color: "bg-muted" },
};

export default function CampaignMonitorPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<CampaignWithInteractions | null>(
    null
  );
  const [launching, setLaunching] = useState(false);
  const [closing, setClosing] = useState(false);
  const [processingAnalytics, setProcessingAnalytics] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/campaigns/${id}`);
    if (res.ok) setCampaign(await res.json());
  }, [id]);

  const processCallAnalytics = useCallback(async (manual = false) => {
    if (manual) setProcessingAnalytics(true);
    try {
      const res = await fetch('/api/calls/process-analytics', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.processed > 0 || manual) {
          console.log(`Processed ${data.processed} call analytics, sent ${data.emailsSent} emails`);
          // Reload campaign to show updated analytics
          await load();
        }
      }
    } catch (error) {
      console.error('Failed to process call analytics:', error);
    } finally {
      if (manual) setProcessingAnalytics(false);
    }
  }, [load]);

  useEffect(() => {
    load();
    processCallAnalytics(); // Check for completed calls on mount

    // Poll every 10 seconds for campaign updates and call analytics
    const interval = setInterval(() => {
      load();
      processCallAnalytics();
    }, 10000);

    return () => clearInterval(interval);
  }, [load, processCallAnalytics]);

  async function handleLaunch() {
    setLaunching(true);
    await fetch(`/api/campaigns/${id}/launch`, { method: "POST" });
    await load();
    setLaunching(false);
  }

  async function handleClose() {
    setClosing(true);
    await fetch(`/api/campaigns/${id}/close`, { method: "POST" });
    await load();
    setClosing(false);
  }

  if (!campaign) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  const interactions = campaign.interactions || [];
  const total = interactions.length;
  const clicked = interactions.filter(
    (i) =>
      i.state === "LINK_CLICKED" || i.state === "CREDENTIALS_SUBMITTED"
  ).length;
  const submitted = interactions.filter(
    (i) => i.state === "CREDENTIALS_SUBMITTED"
  ).length;

  // Filter interactions with call analytics
  const callAnalytics = interactions.filter(i => i.call_analytics && i.vishing_call_id);

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{campaign.name}</h2>
          <p className="text-muted-foreground">{campaign.pretext_scenario}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => processCallAnalytics(true)}
            disabled={processingAnalytics}
          >
            {processingAnalytics ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Check for Results
          </Button>
          {campaign.status === "draft" && (
            <Button onClick={handleLaunch} disabled={launching}>
              {launching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Launch Campaign
            </Button>
          )}
          {campaign.status === "active" && (
            <>
              <Link href={`/dashboard/campaigns/${id}/report`}>
                <Button variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Report
                </Button>
              </Link>
              <Button
                variant="destructive"
                onClick={handleClose}
                disabled={closing}
              >
                {closing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Square className="mr-2 h-4 w-4" />
                )}
                Close Campaign
              </Button>
            </>
          )}
          {campaign.status === "closed" && (
            <Link href={`/dashboard/campaigns/${id}/report`}>
              <Button>
                <BarChart3 className="mr-2 h-4 w-4" />
                View Report
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="text-lg px-3 py-1">{campaign.status}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Targets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Click Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {total > 0 ? Math.round((clicked / total) * 100) : 0}%
            </div>
            <Progress
              value={total > 0 ? (clicked / total) * 100 : 0}
              className="mt-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Submit Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {total > 0 ? Math.round((submitted / total) * 100) : 0}%
            </div>
            <Progress
              value={total > 0 ? (submitted / total) * 100 : 0}
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {campaign.ngrok_url && (
        <Card>
          <CardContent className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">
              Phishing page URL:
            </span>
            <a
              href={campaign.ngrok_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary flex items-center gap-1"
            >
              {campaign.ngrok_url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Interactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clicked At</TableHead>
                <TableHead>Submitted At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No interactions yet
                  </TableCell>
                </TableRow>
              ) : (
                interactions.map((interaction) => {
                  const stateInfo =
                    stateLabels[interaction.state] || stateLabels.PENDING;
                  return (
                    <TableRow key={interaction.id}>
                      <TableCell className="font-medium">
                        {interaction.employees?.name}
                      </TableCell>
                      <TableCell>{interaction.employees?.email}</TableCell>
                      <TableCell>
                        {interaction.employees?.department}
                      </TableCell>
                      <TableCell>
                        <Badge className={stateInfo.color}>
                          {stateInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {interaction.link_clicked_at
                          ? new Date(
                              interaction.link_clicked_at
                            ).toLocaleTimeString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {interaction.form_submitted_at
                          ? new Date(
                              interaction.form_submitted_at
                            ).toLocaleTimeString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Call Analytics Section */}
      {callAnalytics.length > 0 && (
        <Card className="border-primary/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Voice Call Analytics</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI-powered analysis of vishing simulation results
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {callAnalytics.length} {callAnalytics.length === 1 ? 'call' : 'calls'} analyzed
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {callAnalytics.map((interaction) => (
              <div key={interaction.id} className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <h4 className="font-semibold text-lg">{interaction.employees?.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {interaction.employees?.department} • {interaction.employees?.position} • {interaction.employees?.email}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {interaction.updated_at && new Date(interaction.updated_at).toLocaleString()}
                  </div>
                </div>
                <CallAnalyticsCard
                  analytics={interaction.call_analytics!}
                  callDuration={interaction.call_duration}
                  recordingUrl={interaction.call_recording_url}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}
