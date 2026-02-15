"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Search,
  Filter,
  Target,
  Mail,
  Phone,
  X,
  ChevronDown,
  Zap,
  Play,
  MoreHorizontal,
  ArrowUpDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MousePointerClick,
  Reply,
  Loader2,
} from "lucide-react";
import type { Campaign as Drill } from "@/types";

// Status configurations with badge colors like the reference
const statusConfig: Record<string, { 
  label: string; 
  color: string;
  bg: string;
  dot: string;
}> = {
  draft: { 
    label: "Draft", 
    color: "text-neutral-400",
    bg: "bg-neutral-500/15",
    dot: "bg-neutral-400",
  },
  capturing: { 
    label: "Capturing", 
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    dot: "bg-amber-400",
  },
  generating: { 
    label: "Generating", 
    color: "text-cyan-400",
    bg: "bg-cyan-500/15",
    dot: "bg-cyan-400",
  },
  ready: { 
    label: "Ready", 
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    dot: "bg-emerald-400",
  },
  delivering: { 
    label: "Delivering", 
    color: "text-violet-400",
    bg: "bg-violet-500/15",
    dot: "bg-violet-400",
  },
  active: { 
    label: "Active", 
    color: "text-green-400",
    bg: "bg-green-500/15",
    dot: "bg-green-400",
  },
  closed: { 
    label: "Completed", 
    color: "text-neutral-400",
    bg: "bg-neutral-500/15",
    dot: "bg-neutral-400",
  },
};

// Mock stats for display (until we have real interaction data)
interface DrillStats {
  sent: number;
  clicked: number;
  replied: number;
  clickRate: number;
}

function generateMockStats(drill: Drill): DrillStats {
  const baseSent = drill.target_employee_ids.length;
  const clicked = Math.floor(baseSent * (Math.random() * 0.4 + 0.1));
  const replied = Math.floor(clicked * 0.3);
  return {
    sent: baseSent,
    clicked,
    replied,
    clickRate: Math.round((clicked / Math.max(baseSent, 1)) * 100),
  };
}

export default function DrillsPage() {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedDrills, setSelectedDrills] = useState<Set<string>>(new Set());
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drills");
      if (res.ok) {
        const data = await res.json();
        setDrills(data);
      }
    } catch (error) {
      console.error("Failed to load drills:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Track scroll for floating effect
  useEffect(() => {
    const scrollContainer = headerRef.current?.closest('[class*="overflow-y-auto"]') as HTMLElement;
    if (!scrollContainer) return;

    const handleScroll = () => {
      setIsScrolled(scrollContainer.scrollTop > 60);
    };
    
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const filtered = drills.filter((drill) => {
    const matchesSearch = 
      !search || 
      drill.name.toLowerCase().includes(search.toLowerCase()) ||
      drill.company_name.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || drill.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort drills
  const sortedDrills = [...filtered].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const toggleSelectAll = () => {
    if (selectedDrills.size === sortedDrills.length) {
      setSelectedDrills(new Set());
    } else {
      setSelectedDrills(new Set(sortedDrills.map(d => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedDrills);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedDrills(newSet);
  };

  const activeFiltersCount = statusFilter !== "all" ? 1 : 0;

  return (
    <DashboardShell>
      <div className="relative">
        {/* Header Bar - Floating when scrolled */}
        <div 
          ref={headerRef}
          className={`transition-all duration-500 ease-out z-30 ${
            isScrolled 
              ? "sticky top-4 mx-6 px-6 py-3 bg-[#111118]/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/50"
              : "px-8 py-6 bg-transparent"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Left: Search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search..."
                className={`pl-10 rounded-xl h-10 text-sm placeholder:text-neutral-500 focus:border-blue-500/50 disabled:opacity-50 transition-all ${
                  isScrolled 
                    ? "bg-[#0a0a0f] border-white/[0.08]" 
                    : "bg-[#111118]/60 border-white/[0.06]"
                }`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Right: Filters & Add */}
            <div className="flex items-center gap-3">
              {/* Status Filter Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => { setIsStatusOpen(!isStatusOpen); setIsSortOpen(false); }}
                  disabled={loading}
                  className={`h-10 px-4 rounded-xl border-white/[0.06] hover:bg-white/[0.05] transition-all disabled:opacity-50 gap-2 ${
                    isScrolled ? "bg-[#0a0a0f] border-white/[0.08]" : "bg-[#111118]/60"
                  } ${activeFiltersCount > 0 ? "border-blue-500/30 bg-blue-500/5" : ""}`}
                >
                  <Zap className="h-4 w-4 text-neutral-400" />
                  <span className="text-sm text-neutral-300">
                    {statusFilter === "all" ? "All statuses" : statusConfig[statusFilter]?.label}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform ${isStatusOpen ? "rotate-180" : ""}`} />
                </Button>

                {isStatusOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsStatusOpen(false)} />
                    <div className="absolute top-full right-0 mt-2 w-48 p-2 rounded-xl bg-[#111118] border border-white/[0.08] shadow-2xl z-50">
                      {[
                        { value: "all", label: "All statuses" },
                        { value: "active", label: "Active" },
                        { value: "ready", label: "Ready" },
                        { value: "draft", label: "Draft" },
                        { value: "closed", label: "Completed" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => { setStatusFilter(option.value); setIsStatusOpen(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            statusFilter === option.value 
                              ? "bg-blue-500/10 text-blue-400" 
                              : "text-neutral-300 hover:text-white hover:bg-white/[0.05]"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => { setIsSortOpen(!isSortOpen); setIsStatusOpen(false); }}
                  disabled={loading}
                  className={`h-10 px-4 rounded-xl border-white/[0.06] hover:bg-white/[0.05] transition-all disabled:opacity-50 gap-2 ${
                    isScrolled ? "bg-[#0a0a0f] border-white/[0.08]" : "bg-[#111118]/60"
                  }`}
                >
                  <ArrowUpDown className="h-4 w-4 text-neutral-400" />
                  <span className="text-sm text-neutral-300">
                    {sortBy === "newest" ? "Newest first" : sortBy === "oldest" ? "Oldest first" : "Name"}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
                </Button>

                {isSortOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                    <div className="absolute top-full right-0 mt-2 w-40 p-2 rounded-xl bg-[#111118] border border-white/[0.08] shadow-2xl z-50">
                      {[
                        { value: "newest", label: "Newest first" },
                        { value: "oldest", label: "Oldest first" },
                        { value: "name", label: "Name" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => { setSortBy(option.value); setIsSortOpen(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            sortBy === option.value 
                              ? "bg-blue-500/10 text-blue-400" 
                              : "text-neutral-300 hover:text-white hover:bg-white/[0.05]"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Add New Button */}
              <Link href="/dashboard/drills/new">
                <Button className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all hover:scale-105 shadow-lg shadow-blue-500/20">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Spacer when floating */}
        <div className={`transition-all duration-500 ${isScrolled ? "h-4" : "h-0"}`} />

        {/* Drills Table */}
        <div className="px-8 pt-4 pb-8">
          {loading ? (
            <LoadingTable />
          ) : sortedDrills.length === 0 ? (
            <EmptyState hasDrills={drills.length > 0} />
          ) : (
            <div className="space-y-3">
              {/* Table Header */}
              <div className="grid grid-cols-[40px_2fr_120px_100px_80px_80px_80px_100px] gap-4 px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <div>
                  <Checkbox 
                    checked={selectedDrills.size === sortedDrills.length && sortedDrills.length > 0}
                    onCheckedChange={toggleSelectAll}
                    className="border-white/[0.15] data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  />
                </div>
                <div>Name</div>
                <div>Status</div>
                <div>Progress</div>
                <div className="text-center">Sent</div>
                <div className="text-center">Clicked</div>
                <div className="text-center">Replied</div>
                <div className="text-right">Actions</div>
              </div>

              {/* Table Rows - Card Style */}
              {sortedDrills.map((drill) => {
                const config = statusConfig[drill.status] || statusConfig.draft;
                const stats = generateMockStats(drill);
                const isSelected = selectedDrills.has(drill.id);
                const progress = drill.status === "active" ? Math.min(stats.clickRate, 100) : 
                                drill.status === "closed" ? 100 : 
                                drill.status === "draft" ? 0 : Math.floor(Math.random() * 60);

                return (
                  <Link
                    key={drill.id}
                    href={`/dashboard/drills/${drill.id}`}
                    className={`grid grid-cols-[40px_2fr_120px_100px_80px_80px_80px_100px] gap-4 px-4 py-4 rounded-xl border transition-all duration-200 group ${
                      isSelected 
                        ? "bg-blue-500/5 border-blue-500/30" 
                        : "bg-[#111118]/40 border-white/[0.06] hover:border-white/[0.12] hover:bg-[#111118]/60"
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="flex items-center" onClick={(e) => e.preventDefault()}>
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(drill.id)}
                        className="border-white/[0.15] data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                    </div>

                    {/* Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Target className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                          {drill.name}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          {drill.pretext_scenario?.slice(0, 40) || "No scenario"}
                          {drill.pretext_scenario && drill.pretext_scenario.length > 40 ? "..." : ""}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${config.color} ${config.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
                        {config.label}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-medium w-8">{progress}%</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            progress > 50 ? "bg-green-500" : progress > 20 ? "bg-blue-500" : "bg-neutral-500"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Sent */}
                    <div className="flex items-center justify-center">
                      <span className="text-sm text-neutral-300">{stats.sent}</span>
                    </div>

                    {/* Clicked */}
                    <div className="flex items-center justify-center">
                      <span className="text-sm text-neutral-300">{stats.clicked}</span>
                    </div>

                    {/* Replied */}
                    <div className="flex items-center justify-center">
                      <span className="text-sm text-neutral-300">{stats.replied}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1">
                      {drill.status === "ready" && (
                        <button 
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-green-400 hover:bg-green-500/10 transition-colors"
                          onClick={(e) => { e.preventDefault(); /* Launch drill */ }}
                        >
                          <Play className="h-4 w-4 fill-current" />
                        </button>
                      )}
                      <button 
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                        onClick={(e) => e.preventDefault()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

// Loading Table Skeleton
function LoadingTable() {
  return (
    <div className="space-y-3">
      {/* Header Skeleton */}
      <div className="grid grid-cols-[40px_2fr_120px_100px_80px_80px_80px_100px] gap-4 px-4 py-3">
        <div className="h-4 w-4 bg-white/[0.05] rounded animate-pulse" />
        <div className="h-4 w-16 bg-white/[0.05] rounded animate-pulse" />
        <div className="h-4 w-12 bg-white/[0.05] rounded animate-pulse" />
        <div className="h-4 w-16 bg-white/[0.05] rounded animate-pulse" />
        <div className="h-4 w-8 bg-white/[0.05] rounded animate-pulse" />
        <div className="h-4 w-8 bg-white/[0.05] rounded animate-pulse" />
        <div className="h-4 w-8 bg-white/[0.05] rounded animate-pulse" />
        <div className="h-4 w-12 bg-white/[0.05] rounded animate-pulse" />
      </div>

      {/* Row Skeletons */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div 
          key={i}
          className="grid grid-cols-[40px_2fr_120px_100px_80px_80px_80px_100px] gap-4 px-4 py-4 rounded-xl bg-[#111118]/40 border border-white/[0.06]"
        >
          <div className="flex items-center">
            <div className="h-4 w-4 bg-white/[0.05] rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-white/[0.05] rounded-lg animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-white/[0.05] rounded animate-pulse" />
              <div className="h-3 w-24 bg-white/[0.05] rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center">
            <div className="h-6 w-20 bg-white/[0.05] rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-8 bg-white/[0.05] rounded animate-pulse" />
            <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full animate-pulse" />
          </div>
          <div className="flex items-center justify-center">
            <div className="h-4 w-6 bg-white/[0.05] rounded animate-pulse" />
          </div>
          <div className="flex items-center justify-center">
            <div className="h-4 w-6 bg-white/[0.05] rounded animate-pulse" />
          </div>
          <div className="flex items-center justify-center">
            <div className="h-4 w-6 bg-white/[0.05] rounded animate-pulse" />
          </div>
          <div className="flex items-center justify-end gap-1">
            <div className="h-8 w-8 bg-white/[0.05] rounded-lg animate-pulse" />
            <div className="h-8 w-8 bg-white/[0.05] rounded-lg animate-pulse" />
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
          <Button className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all hover:scale-105 shadow-lg shadow-blue-500/20">
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </Link>
      )}
    </div>
  );
}
