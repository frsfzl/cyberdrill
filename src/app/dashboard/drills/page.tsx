"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  ArrowRight,
  Search,
  Filter,
  Target,
  Mail,
  Phone,
  Calendar,
  TrendingUp
} from "lucide-react";
import type { Campaign as Drill } from "@/types";

const statusConfig: Record<string, { color: string; label: string; icon?: string }> = {
  draft: { color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20", label: "Draft" },
  capturing: { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "Capturing" },
  generating: { color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", label: "Generating" },
  ready: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Ready" },
  delivering: { color: "bg-violet-500/10 text-violet-400 border-violet-500/20", label: "Delivering" },
  active: { color: "bg-green-500/10 text-green-400 border-green-500/20", label: "Active" },
  closed: { color: "bg-zinc-600/10 text-zinc-500 border-zinc-600/20", label: "Closed" },
};

export default function DrillsPage() {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then(setDrills)
      .catch(() => {});
  }, []);

  const filteredDrills = drills.filter((drill) => {
    const matchesSearch = drill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drill.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || drill.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: drills.length,
    active: drills.filter((d) => d.status === "active").length,
    draft: drills.filter((d) => d.status === "draft").length,
    closed: drills.filter((d) => d.status === "closed").length,
  };

  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* New Drill Button */}
        <div className="flex justify-end">
          <Link href="/dashboard/drills/new">
            <Button size="lg" className="gap-2 bg-white hover:bg-neutral-200 text-black font-medium transition-all hover:scale-105">
              <Plus className="h-4 w-4" />
              New Drill
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Drills</p>
                  <p className="text-3xl font-bold mt-2">{stats.total}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-3xl font-bold mt-2">{stats.active}</p>
                </div>
                <Target className="h-8 w-8 text-green-500/40" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-zinc-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Drafts</p>
                  <p className="text-3xl font-bold mt-2">{stats.draft}</p>
                </div>
                <Filter className="h-8 w-8 text-zinc-500/40" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-muted">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold mt-2">{stats.closed}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search drills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="ready">Ready</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Drills List */}
        {filteredDrills.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-6 mb-6">
                <Target className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {drills.length === 0 ? "No drills yet" : "No matching drills"}
              </h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                {drills.length === 0
                  ? "Get started by creating your first phishing simulation drill"
                  : "Try adjusting your search or filters"}
              </p>
              {drills.length === 0 && (
                <Link href="/dashboard/drills/new">
                  <Button size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Drill
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDrills.map((drill) => {
              const statusInfo = statusConfig[drill.status] || statusConfig.draft;

              return (
                <Card key={drill.id} className="group hover:shadow-lg transition-all duration-200 hover:border-primary/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">
                            {drill.name}
                          </CardTitle>
                          <Badge variant="outline" className={`${statusInfo.color} border`}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">
                          {drill.pretext_scenario || "No scenario configured"}
                        </p>
                      </div>
                      <Link href={`/dashboard/drills/${drill.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ArrowRight className="h-5 w-5" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-6 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span className="font-medium">{drill.target_employee_ids.length}</span>
                        <span>targets</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{drill.generated_email ? "Email ready" : "Pending"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{drill.generated_vishing_script ? "Script ready" : "Pending"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(drill.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{drill.company_name}</span>
                        {drill.industry && ` • ${drill.industry}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
