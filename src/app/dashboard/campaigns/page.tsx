"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight } from "lucide-react";
import type { Campaign } from "@/types";

const statusColors: Record<string, string> = {
  draft: "bg-secondary text-secondary-foreground",
  capturing: "bg-yellow-500/20 text-yellow-500",
  generating: "bg-blue-500/20 text-blue-500",
  ready: "bg-green-500/20 text-green-500",
  delivering: "bg-purple-500/20 text-purple-500",
  active: "bg-green-600/20 text-green-600",
  closed: "bg-muted text-muted-foreground",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then(setCampaigns)
      .catch(() => {});
  }, []);

  return (
    <DashboardShell>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Campaigns</h2>
        <Link href="/dashboard/campaigns/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No campaigns yet</p>
            <Link href="/dashboard/campaigns/new">
              <Button>Create your first campaign</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {campaign.pretext_scenario || "No scenario set"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusColors[campaign.status] || ""}>
                    {campaign.status}
                  </Badge>
                  <Link href={`/dashboard/campaigns/${campaign.id}`}>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6 text-sm text-muted-foreground">
                  <span>{campaign.target_employee_ids.length} targets</span>
                  <span>{campaign.company_name}</span>
                  <span>
                    Created{" "}
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
