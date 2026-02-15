"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import type { Campaign, Interaction } from "@/types";

type CampaignWithInteractions = Campaign & {
  interactions: (Interaction & {
    employees: { name: string; email: string; department: string; position: string };
  })[];
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "text-neutral-400 border-neutral-500/30", bg: "bg-neutral-500/10" },
  capturing: { label: "Capturing", color: "text-amber-400 border-amber-500/30", bg: "bg-amber-500/10" },
  generating: { label: "Generating", color: "text-cyan-400 border-cyan-500/30", bg: "bg-cyan-500/10" },
  ready: { label: "Ready", color: "text-emerald-400 border-emerald-500/30", bg: "bg-emerald-500/10" },
  delivering: { label: "Delivering", color: "text-violet-400 border-violet-500/30", bg: "bg-violet-500/10" },
  active: { label: "Active", color: "text-blue-400 border-blue-500/30", bg: "bg-blue-500/10" },
  closed: { label: "Completed", color: "text-neutral-400 border-neutral-500/30", bg: "bg-neutral-500/10" },
};

const stateLabels: Record<string, string> = {
  PENDING: "Pending",
  DELIVERED: "Delivered",
  LINK_CLICKED: "Clicked",
  CREDENTIALS_SUBMITTED: "Submitted",
  LEARNING_VIEWED: "Submitted",
  REPORTED: "Reported",
  NO_INTERACTION: "No Action",
};

export default function DrillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<CampaignWithInteractions | null>(null);
  const [launching, setLaunching] = useState(false);
  const [closing, setClosing] = useState(false);
  const [processingAnalytics, setProcessingAnalytics] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/drills/${id}`);
    if (res.ok) setCampaign(await res.json());
  }, [id]);

  const processCallAnalytics = useCallback(async (manual = false) => {
    if (manual) setProcessingAnalytics(true);
    try {
      const res = await fetch('/api/calls/process-analytics', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.processed > 0 || manual) await load();
      }
    } catch (error) {
      console.error('Failed to process call analytics:', error);
    } finally {
      if (manual) setProcessingAnalytics(false);
    }
  }, [load]);

  useEffect(() => {
    load();
    processCallAnalytics();
    const interval = setInterval(() => {
      load();
      processCallAnalytics();
    }, 10000);
    return () => clearInterval(interval);
  }, [load, processCallAnalytics]);

  async function handleLaunch() {
    setLaunching(true);
    await fetch(`/api/drills/${id}/launch`, { method: "POST" });
    await load();
    setLaunching(false);
  }

  async function handleClose() {
    setClosing(true);
    await fetch(`/api/drills/${id}/close`, { method: "POST" });
    await load();
    setClosing(false);
  }

  if (!campaign) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </DashboardShell>
    );
  }

  const interactions = campaign.interactions || [];
  const total = interactions.length;
  const isEmail = !campaign.delivery_method || campaign.delivery_method === "email" || campaign.delivery_method === "both";
  
  // For emails: clicked = link clicked or beyond
  // For calls: clicked = call was made (vishing_outcome exists)
  const clicked = isEmail
    ? interactions.filter((i) =>
        i.state === "LINK_CLICKED" || i.state === "CREDENTIALS_SUBMITTED" || i.state === "LEARNING_VIEWED"
      ).length
    : interactions.filter((i) => i.vishing_outcome).length;
  
  // Failed = submitted (email) or fell for phish (call)
  const failed = isEmail
    ? interactions.filter((i) =>
        i.state === "CREDENTIALS_SUBMITTED" || i.state === "LEARNING_VIEWED"
      ).length
    : interactions.filter((i) => i.vishing_outcome === "failed").length;
  
  const clickRate = total > 0 ? Math.round((clicked / total) * 100) : 0;
  const failRate = total > 0 ? Math.round((failed / total) * 100) : 0;

  const status = statusConfig[campaign.status] || statusConfig.draft;

  return (
    <DashboardShell>
      <div className="max-w-5xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Link 
              href="/dashboard/drills" 
              className="text-sm text-neutral-400 hover:text-white transition-colors"
            >
              ← Back to Drills
            </Link>
            <div className="flex items-center gap-3 mt-2">
              <h1 className="text-2xl font-semibold text-white">{campaign.name}</h1>
              <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${status.color} ${status.bg}`}>
                {status.label}
              </span>
            </div>
            <p className="text-neutral-400 mt-1">{campaign.pretext_scenario}</p>
          </div>
          <div className="flex items-center gap-3 pt-8">
            {campaign.status === "draft" && (
              <Button 
                onClick={handleLaunch} 
                disabled={launching}
                className="h-9 px-6 bg-white hover:bg-neutral-200 text-black text-sm font-medium"
              >
                {launching ? "Launching..." : "Launch"}
              </Button>
            )}
            {campaign.status === "active" && (
              <Button 
                onClick={handleClose}
                disabled={closing}
                className="h-9 px-6 bg-red-600 hover:bg-red-500 text-white text-sm font-medium"
              >
                {closing ? "Closing..." : "Close"}
              </Button>
            )}
          </div>
        </div>

        {/* Info Row */}
        <div className="grid grid-cols-3 gap-8 py-4 border-y border-white/10 mb-6">
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Login URL Cloned</p>
            <p className="text-sm text-white truncate" title={campaign.login_page_url}>
              {campaign.login_page_url || "Not set"}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Phishing Page URL</p>
            {campaign.ngrok_url ? (
              <a
                href={campaign.ngrok_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                {campaign.ngrok_url}
              </a>
            ) : (
              <p className="text-sm text-neutral-500">Not generated</p>
            )}
          </div>
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Targets</p>
            <p className="text-sm text-white">{total} employees</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
              {isEmail ? "Click Rate" : "Response Rate"}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-white">{clickRate}%</span>
              <span className="text-sm text-neutral-400">{clicked} of {total}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full mt-3">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${clickRate}%` }}
              />
            </div>
          </div>
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Fail Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-white">{failRate}%</span>
              <span className="text-sm text-neutral-400">{failed} of {total}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full mt-3">
              <div 
                className="h-full bg-red-500 rounded-full transition-all"
                style={{ width: `${failRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Interactions Table */}
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-4">Interactions</p>
          <div className="border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="text-left text-xs font-medium text-neutral-400 uppercase px-4 py-3">Employee</th>
                  <th className="text-left text-xs font-medium text-neutral-400 uppercase px-4 py-3">Email</th>
                  <th className="text-left text-xs font-medium text-neutral-400 uppercase px-4 py-3">Department</th>
                  <th className="text-left text-xs font-medium text-neutral-400 uppercase px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-neutral-400 uppercase px-4 py-3">Failed</th>
                </tr>
              </thead>
              <tbody>
                {interactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-500">
                      No interactions yet
                    </td>
                  </tr>
                ) : (
                  interactions.map((interaction) => {
                    // Determine if failed
                    const didFail = isEmail
                      ? (interaction.state === "CREDENTIALS_SUBMITTED" || interaction.state === "LEARNING_VIEWED")
                      : interaction.vishing_outcome === "failed";
                    
                    return (
                      <tr key={interaction.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-sm text-white">{interaction.employees?.name}</td>
                        <td className="px-4 py-3 text-sm text-neutral-300">{interaction.employees?.email}</td>
                        <td className="px-4 py-3 text-sm text-neutral-300">{interaction.employees?.department}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-neutral-300">
                            {stateLabels[interaction.state] || "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {didFail ? (
                            <span className="text-red-400">Yes</span>
                          ) : (
                            <span className="text-neutral-600">No</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
