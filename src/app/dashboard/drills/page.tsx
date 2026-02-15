"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  Target,
  Mail,
  Phone,
  X,
  ArrowRight,
  Zap,
  Play,
  CheckCircle2,
  Clock,
  Loader2
} from "lucide-react";
import type { Campaign as Drill } from "@/types";

const statusConfig: Record<string, { 
  label: string; 
  color: string; 
  bg: string;
  icon: React.ElementType;
}> = {
  draft: { 
    label: "Draft", 
    color: "text-neutral-400", 
    bg: "bg-neutral-500/10",
    icon: Clock
  },
  capturing: { 
    label: "Capturing", 
    color: "text-amber-400", 
    bg: "bg-amber-500/10",
    icon: Zap
  },
  generating: { 
    label: "Generating", 
    color: "text-cyan-400", 
    bg: "bg-cyan-500/10",
    icon: Zap
  },
  ready: { 
    label: "Ready", 
    color: "text-emerald-400", 
    bg: "bg-emerald-500/10",
    icon: CheckCircle2
  },
  delivering: { 
    label: "Delivering", 
    color: "text-violet-400", 
    bg: "bg-violet-500/10",
    icon: Zap
  },
  active: { 
    label: "Active", 
    color: "text-green-400", 
    bg: "bg-green-500/10",
    icon: Play
  },
  closed: { 
    label: "Completed", 
    color: "text-neutral-400", 
    bg: "bg-neutral-500/10",
    icon: CheckCircle2
  },
};

const deliveryMethodIcons: Record<string, React.ElementType> = {
  email: Mail,
  vapi: Phone,
  both: Zap,
};

export default function DrillsPage() {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/drills")
      .then((r) => r.json())
      .then((data) => {
        setDrills(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = drills.filter((drill) => {
    const matchesSearch = 
      !search || 
      drill.name.toLowerCase().includes(search.toLowerCase()) ||
      drill.company_name.toLowerCase().includes(search.toLowerCase()) ||
      drill.pretext_scenario?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || drill.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const activeFiltersCount = statusFilter !== "all" ? 1 : 0;

  // Group drills by status for display
  const groupedDrills = filtered.reduce((acc, drill) => {
    const status = drill.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(drill);
    return acc;
  }, {} as Record<string, Drill[]>);

  // Order statuses for display
  const statusOrder = ["active", "delivering", "ready", "generating", "capturing", "draft", "closed"];

  return (
    <DashboardShell>
      <div className="relative">
        {/* Sticky Header Bar */}
        <div 
          className="sticky top-0 z-30 px-8 py-4 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between gap-4" 
          style={{ position: 'sticky', top: 0 }}
        >
          {/* Left: Search & Filters */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search drills..."
                className="pl-10 bg-[#111118]/60 border-white/[0.06] rounded-xl h-10 text-sm placeholder:text-neutral-500 focus:border-blue-500/50 disabled:opacity-50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                disabled={loading}
                className={`h-10 px-3 rounded-xl border-white/[0.06] bg-[#111118]/60 hover:bg-white/[0.05] transition-all disabled:opacity-50 ${
                  activeFiltersCount > 0 ? "border-blue-500/30 bg-blue-500/5" : ""
                }`}
              >
                <Filter className="h-4 w-4 mr-2 text-neutral-400" />
                <span className="text-sm text-neutral-300">Filter</span>
                {activeFiltersCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>

              {/* Filter Dropdown Menu */}
              {isFilterOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsFilterOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 w-56 p-3 rounded-xl bg-[#111118] border border-white/[0.08] shadow-2xl z-50">
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-neutral-500 mb-1.5 block">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-white/[0.06] text-sm text-neutral-300 focus:border-blue-500/50 outline-none"
                        >
                          <option value="all">All Status</option>
                          <option value="active">Active</option>
                          <option value="ready">Ready</option>
                          <option value="draft">Draft</option>
                          <option value="closed">Completed</option>
                        </select>
                      </div>
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={() => setStatusFilter("all")}
                          className="w-full text-xs text-neutral-400 hover:text-white py-1"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Active Filter Pill */}
            {statusFilter !== "all" && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400">
                <span className="capitalize">{statusFilter}</span>
                <button 
                  onClick={() => setStatusFilter("all")}
                  className="ml-1 hover:text-blue-300 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right: New Drill Button */}
          <Link href="/dashboard/drills/new">
            <Button className="h-10 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-medium transition-all hover:scale-105">
              <Plus className="h-4 w-4 mr-2" />
              New Drill
            </Button>
          </Link>
        </div>

        {/* Drills Content */}
        <div className="px-8 pt-6 pb-8">
          {loading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState hasDrills={drills.length > 0} />
          ) : (
            <div className="space-y-8">
              {/* Drills Grouped by Status */}
              {statusOrder.map((status) => {
                const statusDrills = groupedDrills[status];
                if (!statusDrills || statusDrills.length === 0) return null;

                const config = statusConfig[status];
                const StatusIcon = config.icon;

                return (
                  <div key={status} className="space-y-3">
                    {/* Status Header */}
                    <div className="flex items-center gap-3 px-1">
                      <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                        <StatusIcon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <h3 className="text-sm font-medium text-neutral-300 uppercase tracking-wider">
                        {config.label}
                      </h3>
                      <span className="text-xs text-neutral-500">
                        {statusDrills.length}
                      </span>
                    </div>

                    {/* Drills List */}
                    <div className="space-y-1">
                      {statusDrills.map((drill, index) => {
                        const DeliveryIcon = deliveryMethodIcons[drill.delivery_method || "email"];
                        
                        return (
                          <Link
                            key={drill.id}
                            href={`/dashboard/drills/${drill.id}`}
                            className="group flex items-center px-4 py-4 rounded-xl hover:bg-white/[0.03] transition-all duration-300 border border-transparent hover:border-white/[0.06]"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            {/* Icon/Avatar */}
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mr-4 group-hover:scale-105 transition-transform">
                              <Target className="h-5 w-5 text-blue-400" />
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                                  {drill.name}
                                </h4>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${config.color} ${config.bg} border-transparent`}
                                >
                                  {config.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-neutral-500 truncate">
                                {drill.pretext_scenario || "No scenario configured"}
                              </p>
                            </div>

                            {/* Meta Info */}
                            <div className="hidden md:flex items-center gap-6 mr-6">
                              {/* Targets */}
                              <div className="flex items-center gap-2 text-sm text-neutral-400">
                                <Target className="h-4 w-4" />
                                <span>{drill.target_employee_ids.length} targets</span>
                              </div>

                              {/* Delivery Method */}
                              <div className="flex items-center gap-2 text-sm text-neutral-400">
                                <DeliveryIcon className="h-4 w-4" />
                                <span className="capitalize">{drill.delivery_method || "email"}</span>
                              </div>

                              {/* Content Status */}
                              <div className="flex items-center gap-2 text-sm">
                                {drill.generated_email ? (
                                  <span className="text-green-400 flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Email
                                  </span>
                                ) : (
                                  <span className="text-neutral-500">No email</span>
                                )}
                              </div>
                            </div>

                            {/* Arrow */}
                            <div className="w-8 flex justify-end">
                              <ArrowRight className="h-5 w-5 text-neutral-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

// Loading State Component
function LoadingState() {
  return (
    <div className="space-y-8">
      {/* Skeleton for multiple status groups */}
      {[1, 2, 3].map((group) => (
        <div key={group} className="space-y-3">
          {/* Status Header Skeleton */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-lg bg-white/[0.05] animate-pulse" />
            <div className="h-4 w-24 bg-white/[0.05] rounded animate-pulse" />
            <div className="h-4 w-8 bg-white/[0.05] rounded animate-pulse" />
          </div>

          {/* Drill Rows Skeleton */}
          <div className="space-y-1">
            {[1, 2, 3].map((row) => (
              <div 
                key={row}
                className="flex items-center px-4 py-4 rounded-xl bg-white/[0.02]"
              >
                <div className="w-10 h-10 rounded-lg bg-white/[0.05] animate-pulse mr-4" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-5 w-48 bg-white/[0.05] rounded animate-pulse" />
                    <div className="h-5 w-16 bg-white/[0.05] rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-64 bg-white/[0.05] rounded animate-pulse" />
                </div>
                <div className="hidden md:flex items-center gap-6 mr-6">
                  <div className="h-4 w-20 bg-white/[0.05] rounded animate-pulse" />
                  <div className="h-4 w-20 bg-white/[0.05] rounded animate-pulse" />
                  <div className="h-4 w-16 bg-white/[0.05] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty State Component
function EmptyState({ hasDrills }: { hasDrills: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/10 flex items-center justify-center mb-6">
        <Target className="h-10 w-10 text-blue-400/50" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        {hasDrills ? "No drills found" : "No drills yet"}
      </h3>
      <p className="text-neutral-500 mb-6 max-w-md">
        {hasDrills
          ? "Try adjusting your search or filter criteria"
          : "Get started by creating your first phishing simulation drill"}
      </p>
      {!hasDrills && (
        <Link href="/dashboard/drills/new">
          <Button className="rounded-xl bg-white hover:bg-neutral-200 text-black px-6 py-5 font-medium transition-all hover:scale-105">
            <Plus className="h-4 w-4 mr-2" />
            Create Drill
          </Button>
        </Link>
      )}
    </div>
  );
}
