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
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ArrowUpDown,
  Zap,
  Play,
  Target,
  CheckCircle2,
} from "lucide-react";
import type { Campaign as Drill, Employee } from "@/types";

const statusConfig: Record<string, { 
  label: string; 
  color: string;
  bg: string;
  dot: string;
}> = {
  draft: { label: "Draft", color: "text-neutral-400", bg: "bg-neutral-500/15", dot: "bg-neutral-400" },
  capturing: { label: "Capturing", color: "text-amber-400", bg: "bg-amber-500/15", dot: "bg-amber-400" },
  generating: { label: "Generating", color: "text-cyan-400", bg: "bg-cyan-500/15", dot: "bg-cyan-400" },
  ready: { label: "Ready", color: "text-emerald-400", bg: "bg-emerald-500/15", dot: "bg-emerald-400" },
  delivering: { label: "Delivering", color: "text-violet-400", bg: "bg-violet-500/15", dot: "bg-violet-400" },
  active: { label: "Active", color: "text-green-400", bg: "bg-green-500/15", dot: "bg-green-400" },
  closed: { label: "Completed", color: "text-neutral-400", bg: "bg-neutral-500/15", dot: "bg-neutral-400" },
};

const STEPS = [
  { id: 1, label: "Type", desc: "Choose attack vector" },
  { id: 2, label: "Details", desc: "Name & scenario" },
  { id: 3, label: "Targets", desc: "Select employees" },
  { id: 4, label: "Review", desc: "Confirm & create" },
];

const SCENARIOS = [
  { id: "password-reset", title: "Password Reset", desc: "Fake IT department password reset request" },
  { id: "hr-benefits", title: "HR Benefits", desc: "HR benefits enrollment update request" },
  { id: "executive", title: "Executive Request", desc: "Urgent request from C-level executive" },
  { id: "invoice", title: "Vendor Invoice", desc: "Payment verification from vendor" },
  { id: "security", title: "Security Alert", desc: "Account security breach notification" },
  { id: "custom", title: "Custom", desc: "Create your own custom scenario" },
];

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

  // New Drill Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [drillType, setDrillType] = useState<"email" | "vapi" | null>(null);
  const [drillForm, setDrillForm] = useState({
    name: "",
    loginUrl: "",
  });
  const [selectedScenario, setSelectedScenario] = useState("");
  const [scenarioInfo, setScenarioInfo] = useState<string | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch employees for target selection
  useEffect(() => {
    if (isModalOpen && modalStep === 3) {
      fetch("/api/employees")
        .then(r => r.json())
        .then(data => setEmployees(data.filter((e: Employee) => !e.opted_out)))
        .catch(() => setEmployees([]));
    }
  }, [isModalOpen, modalStep]);

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

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    const handleScroll = () => setIsScrolled(main.scrollTop > 60);
    main.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => main.removeEventListener("scroll", handleScroll);
  }, []);

  const filtered = drills.filter((drill) => {
    const matchesSearch = !search || 
      drill.name.toLowerCase().includes(search.toLowerCase()) ||
      drill.company_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || drill.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedDrills = [...filtered].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === "name") return a.name.localeCompare(b.name);
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
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedDrills(newSet);
  };

  const activeFiltersCount = statusFilter !== "all" ? 1 : 0;
  const openModal = () => { setIsModalOpen(true); setModalStep(1); setDrillType(null); };
  const closeModal = () => { 
    setIsModalOpen(false); 
    setModalStep(1); 
    setDrillType(null); 
    setDrillForm({ name: "", loginUrl: "" });
    setSelectedScenario("");
    setScenarioInfo(null);
    setSelectedTargets([]);
    setEmployees([]);
    setIsCreating(false);
  };

  // Create the drill
  const handleCreateDrill = async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/drills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: drillForm.name,
          login_page_url: drillType === "email" ? drillForm.loginUrl : "",
          pretext_scenario: SCENARIOS.find(s => s.id === selectedScenario)?.desc || "",
          target_employee_ids: selectedTargets,
          delivery_method: drillType,
          delivery_window: { start: "", end: "" },
          status: "draft",
          company_name: "",
          industry: "",
        }),
      });

      if (res.ok) {
        closeModal();
        load(); // Refresh drills list
      } else {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to create drill:", errorData);
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Error creating drill:", error);
      setIsCreating(false);
    }
  };

  // Group employees by department
  const departmentGroups: Record<string, Employee[]> = employees.reduce((acc, emp) => {
    const dept = emp.department || "Unassigned";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {} as Record<string, Employee[]>);

  // Toggle individual target
  const toggleTarget = (id: string) => {
    setSelectedTargets(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Toggle entire department
  const toggleDepartment = (dept: string) => {
    const deptIds = departmentGroups[dept].map(e => e.id);
    const allSelected = deptIds.every(id => selectedTargets.includes(id));
    
    if (allSelected) {
      setSelectedTargets(prev => prev.filter(id => !deptIds.includes(id)));
    } else {
      setSelectedTargets(prev => [...new Set([...prev, ...deptIds])]);
    }
  };
  const nextStep = () => setModalStep(s => Math.min(s + 1, 4));
  const prevStep = () => setModalStep(s => Math.max(s - 1, 1));

  return (
    <DashboardShell>
      <div className="relative">
        {/* Floating Header Bar */}
        <div 
          ref={headerRef}
          className={`transition-all duration-500 ease-out z-30 ${
            isScrolled 
              ? "fixed top-4 left-[232px] right-6 px-6 py-3 bg-[#111118]/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/50"
              : "px-8 py-6 bg-transparent"
          }`}
          style={{ width: isScrolled ? "calc(100% - 280px)" : "auto" }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className={`relative transition-all duration-300 ${isScrolled ? "w-56" : "w-64"}`}>
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isScrolled ? "text-neutral-400" : "text-neutral-500"}`} />
              <Input
                placeholder="Search..."
                className={`pl-10 rounded-xl h-10 text-sm placeholder:text-neutral-500 focus:border-blue-500/50 disabled:opacity-50 transition-all ${
                  isScrolled ? "bg-[#0a0a0f] border-white/[0.08]" : "bg-[#111118]/60 border-white/[0.06]"
                }`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center gap-3">
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
                  <ChevronRight className={`h-4 w-4 text-neutral-500 rotate-90 transition-transform ${isStatusOpen ? "rotate-180" : ""}`} />
                </Button>

                {isStatusOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsStatusOpen(false)} />
                    <div className={`absolute top-full right-0 mt-2 w-48 p-2 rounded-xl border border-white/[0.08] shadow-2xl z-50 ${isScrolled ? "bg-[#0a0a0f]" : "bg-[#111118]"}`}>
                      {["all", "active", "ready", "draft", "closed"].map((val) => (
                        <button
                          key={val}
                          onClick={() => { setStatusFilter(val); setIsStatusOpen(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors capitalize ${
                            statusFilter === val ? "bg-blue-500/10 text-blue-400" : "text-neutral-300 hover:text-white hover:bg-white/[0.05]"
                          }`}
                        >
                          {val === "all" ? "All statuses" : val}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

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
                    {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : "Name"}
                  </span>
                  <ChevronRight className={`h-4 w-4 text-neutral-500 rotate-90 transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
                </Button>

                {isSortOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                    <div className={`absolute top-full right-0 mt-2 w-40 p-2 rounded-xl border border-white/[0.08] shadow-2xl z-50 ${isScrolled ? "bg-[#0a0a0f]" : "bg-[#111118]"}`}>
                      {["newest", "oldest", "name"].map((val) => (
                        <button
                          key={val}
                          onClick={() => { setSortBy(val); setIsSortOpen(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors capitalize ${
                            sortBy === val ? "bg-blue-500/10 text-blue-400" : "text-neutral-300 hover:text-white hover:bg-white/[0.05]"
                          }`}
                        >
                          {val === "newest" ? "Newest first" : val === "oldest" ? "Oldest first" : "Name"}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <Button 
                onClick={openModal}
                className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </div>
          </div>
        </div>

        <div className={`transition-all duration-500 ${isScrolled ? "h-20" : "h-0"}`} />

        {/* Drills Table */}
        <div className="px-8 pt-2 pb-8">
          {loading ? (
            <LoadingTable />
          ) : sortedDrills.length === 0 ? (
            <EmptyState hasDrills={drills.length > 0} />
          ) : (
            <div className="space-y-4">
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

              {sortedDrills.map((drill) => {
                const config = statusConfig[drill.status] || statusConfig.draft;
                const stats = generateMockStats(drill);
                const isSelected = selectedDrills.has(drill.id);
                const progress = drill.status === "active" ? Math.min(stats.clickRate, 100) : drill.status === "closed" ? 100 : drill.status === "draft" ? 0 : Math.floor(Math.random() * 60);

                return (
                  <Link
                    key={drill.id}
                    href={`/dashboard/drills/${drill.id}`}
                    className={`grid grid-cols-[40px_2fr_120px_100px_80px_80px_80px_100px] gap-4 px-4 py-5 rounded-xl border transition-all duration-200 group ${
                      isSelected ? "bg-blue-500/5 border-blue-500/30" : "bg-[#111118]/40 border-white/[0.06] hover:border-white/[0.12] hover:bg-[#111118]/60"
                    }`}
                  >
                    <div className="flex items-center" onClick={(e) => e.preventDefault()}>
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(drill.id)}
                        className="border-white/[0.15] data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate group-hover:text-blue-300 transition-colors">{drill.name}</p>
                        <p className="text-xs text-neutral-500 truncate">{drill.pretext_scenario?.slice(0, 40) || "No scenario"}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${config.color} ${config.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
                        {config.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-medium w-8">{progress}%</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${progress > 50 ? "bg-green-500" : progress > 20 ? "bg-blue-500" : "bg-neutral-500"}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-center"><span className="text-sm text-neutral-300">{stats.sent}</span></div>
                    <div className="flex items-center justify-center"><span className="text-sm text-neutral-300">{stats.clicked}</span></div>
                    <div className="flex items-center justify-center"><span className="text-sm text-neutral-300">{stats.replied}</span></div>

                    <div className="flex items-center justify-end gap-1">
                      {drill.status === "ready" && (
                        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-green-400 hover:bg-green-500/10 transition-colors" onClick={(e) => e.preventDefault()}>
                          <Play className="h-4 w-4 fill-current" />
                        </button>
                      )}
                      <button 
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        onClick={async (e) => {
                          e.preventDefault();
                          if (!confirm("Delete this drill?")) return;
                          await fetch(`/api/drills/${drill.id}`, { method: "DELETE" });
                          load();
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* New Drill Modal - Clean Design */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
          
          <div className="relative w-[800px] h-[500px] bg-[#0a0a0f] rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Step Indicator - Glowing Circles */}
            <div className="absolute top-8 left-0 right-0 flex justify-center">
              <div className="flex items-center gap-0">
                {STEPS.map((step, idx) => (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      {/* Glowing Circle */}
                      <div 
                        className={`w-3 h-3 rounded-full transition-all duration-500 ${
                          step.id === modalStep 
                            ? "bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.8)] scale-125" 
                            : step.id < modalStep 
                              ? "bg-blue-500/60" 
                              : "bg-white/20"
                        }`}
                      />
                      {/* Label */}
                      <span className={`text-[10px] mt-2 font-medium uppercase tracking-wider transition-colors ${
                        step.id === modalStep ? "text-blue-400" : step.id < modalStep ? "text-neutral-400" : "text-neutral-600"
                      }`}>
                        {step.label}
                      </span>
                      {/* Desc */}
                      <span className={`text-[9px] mt-0.5 transition-colors ${
                        step.id === modalStep ? "text-neutral-400" : "text-neutral-700"
                      }`}>
                        {step.desc}
                      </span>
                    </div>
                    {/* Connecting Line */}
                    {idx < STEPS.length - 1 && (
                      <div className="w-16 h-px mx-2 bg-white/10 relative">
                        <div 
                          className="absolute inset-y-0 left-0 bg-blue-500/50 transition-all duration-500"
                          style={{ width: step.id < modalStep ? "100%" : "0%" }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Content Area - No Scroll */}
            <div className="h-full flex flex-col pt-28 pb-20 px-12">
              
              {/* Step 1: Choose Type */}
              {modalStep === 1 && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <h3 className="text-xl font-medium text-white mb-8">Choose Attack Type</h3>
                  
                  <div className="flex gap-6">
                    {/* Email Option */}
                    <button
                      onClick={() => setDrillType("email")}
                      className={`group w-[280px] h-[220px] rounded-2xl border transition-all duration-300 ${
                        drillType === "email"
                          ? "bg-blue-500/5 border-blue-500/40"
                          : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                      }`}
                    >
                      <div className="h-full flex flex-col items-center justify-center p-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all ${
                          drillType === "email" ? "bg-blue-500/20" : "bg-white/[0.05]"
                        }`}>
                          <Mail className={`h-7 w-7 ${drillType === "email" ? "text-blue-400" : "text-neutral-400"}`} />
                        </div>
                        <h4 className="text-lg font-medium text-white mb-2">Email</h4>
                        <p className="text-center text-neutral-500 text-sm">Phishing emails with malicious links</p>
                        {/* Login URL - Only for Email */}
                    {drillType === "email" && (
                          <div className="mt-4 flex items-center gap-1.5 text-blue-400 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Selected</span>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Call Option */}
                    <button
                      onClick={() => setDrillType("vapi")}
                      className={`group w-[280px] h-[220px] rounded-2xl border transition-all duration-300 ${
                        drillType === "vapi"
                          ? "bg-violet-500/5 border-violet-500/40"
                          : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                      }`}
                    >
                      <div className="h-full flex flex-col items-center justify-center p-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all ${
                          drillType === "vapi" ? "bg-violet-500/20" : "bg-white/[0.05]"
                        }`}>
                          <Phone className={`h-7 w-7 ${drillType === "vapi" ? "text-violet-400" : "text-neutral-400"}`} />
                        </div>
                        <h4 className="text-lg font-medium text-white mb-2">Call</h4>
                        <p className="text-center text-neutral-500 text-sm">AI-powered voice phishing calls</p>
                        {drillType === "vapi" && (
                          <div className="mt-4 flex items-center gap-1.5 text-violet-400 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Selected</span>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Details */}
              {modalStep === 2 && (
                <div className="flex-1 flex flex-col pt-4">
                  {/* Drill Name */}
                  <div className="mb-4">
                    <label className="text-xs text-neutral-500 uppercase tracking-wider mb-1.5 block">Drill Name *</label>
                    <input
                      type="text"
                      value={drillForm.name}
                      onChange={(e) => setDrillForm({...drillForm, name: e.target.value})}
                      placeholder="e.g., Q1 Security Test"
                      className="w-full h-10 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>

                  {/* Login URL - Only for Email */}
                  {drillType === "email" && (
                    <div className="mb-4">
                      <label className="text-xs text-neutral-500 uppercase tracking-wider mb-1.5 block">Login Page to Clone *</label>
                      <input
                        type="text"
                        value={drillForm.loginUrl}
                        onChange={(e) => setDrillForm({...drillForm, loginUrl: e.target.value})}
                        placeholder="https://login.company.com"
                        className="w-full h-10 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                  )}

                  {/* Scenarios */}
                  <div className="relative">
                    <label className="text-xs text-neutral-500 uppercase tracking-wider mb-2 block">
                      Select Scenario *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {SCENARIOS.map((scenario) => (
                        <div key={scenario.id} className="relative">
                          {/* Tooltip above */}
                          {scenarioInfo === scenario.id && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 p-2.5 rounded-lg bg-[#1a1a24] border border-white/[0.12] shadow-xl z-10">
                              <p className="text-xs text-neutral-300 leading-relaxed">{scenario.desc}</p>
                              {/* Arrow */}
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1a24] border-r border-b border-white/[0.12] rotate-45" />
                            </div>
                          )}
                          <button
                            onClick={() => setSelectedScenario(scenario.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-all ${
                              selectedScenario === scenario.id
                                ? "bg-blue-500/10 border-blue-500/40"
                                : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                            }`}
                          >
                            <span className={`text-sm font-medium ${selectedScenario === scenario.id ? "text-white" : "text-neutral-300"}`}>
                              {scenario.title}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setScenarioInfo(scenarioInfo === scenario.id ? null : scenario.id); }}
                              className="w-5 h-5 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-neutral-500 hover:text-white text-xs transition-colors"
                            >
                              i
                            </button>
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {/* Click outside to close */}
                    {scenarioInfo && (
                      <div 
                        className="fixed inset-0 z-0" 
                        onClick={() => setScenarioInfo(null)}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Select Targets */}
              {modalStep === 3 && (
                <div className="flex-1 flex flex-col">
                  <h3 className="text-lg font-medium text-white text-center mb-4">Select Targets</h3>
                  
                  {/* Selected Count */}
                  <div className="flex justify-center mb-3">
                    <span className="text-sm text-neutral-400">
                      <span className="text-blue-400 font-medium">{selectedTargets.length}</span> employees selected
                    </span>
                  </div>

                  {/* Scrollable Employee List */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[260px]">
                    {Object.entries(departmentGroups).map(([dept, emps]) => (
                      <div key={dept} className="rounded-lg bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                        {/* Department Header */}
                        <button
                          onClick={() => toggleDepartment(dept)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            emps.every(e => selectedTargets.includes(e.id))
                              ? "bg-blue-500 border-blue-500"
                              : emps.some(e => selectedTargets.includes(e.id))
                                ? "bg-blue-500/50 border-blue-500"
                                : "border-white/[0.2]"
                          }`}>
                            {(emps.every(e => selectedTargets.includes(e.id)) || emps.some(e => selectedTargets.includes(e.id))) && (
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <span className="font-medium text-sm text-white">{dept}</span>
                          <span className="text-xs text-neutral-500">({emps.length})</span>
                        </button>

                        {/* Employees */}
                        <div className="divide-y divide-white/[0.04]">
                          {emps.map((emp) => (
                            <button
                              key={emp.id}
                              onClick={() => toggleTarget(emp.id)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.02] transition-colors"
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                selectedTargets.includes(emp.id)
                                  ? "bg-blue-500 border-blue-500"
                                  : "border-white/[0.2]"
                              }`}>
                                {selectedTargets.includes(emp.id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                              </div>
                              <div className="flex-1 text-left">
                                <p className="text-sm text-white">{emp.name}</p>
                                <p className="text-xs text-neutral-500">{emp.email}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {modalStep === 4 && (
                <div className="flex-1 flex flex-col">
                  <h3 className="text-lg font-medium text-white text-center mb-6">Review Drill</h3>
                  
                  <div className="space-y-3">
                    {/* Drill Name */}
                    <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
                      <span className="text-sm text-neutral-500">Drill Name</span>
                      <span className="text-sm text-white font-medium">{drillForm.name}</span>
                    </div>

                    {/* Drill Type */}
                    <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
                      <span className="text-sm text-neutral-500">Type</span>
                      <span className="text-sm text-white font-medium capitalize">
                        {drillType === "vapi" ? "Call" : drillType}
                      </span>
                    </div>

                    {/* Login URL - Only show for email */}
                    {drillType === "email" && (
                      <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
                        <span className="text-sm text-neutral-500">Login Page</span>
                        <span className="text-sm text-white font-medium truncate max-w-[300px]">{drillForm.loginUrl}</span>
                      </div>
                    )}

                    {/* Scenario */}
                    <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
                      <span className="text-sm text-neutral-500">Scenario</span>
                      <span className="text-sm text-white font-medium">
                        {SCENARIOS.find(s => s.id === selectedScenario)?.title}
                      </span>
                    </div>

                    {/* Targets */}
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm text-neutral-500">Targets</span>
                      <span className="text-sm text-blue-400 font-medium">{selectedTargets.length} employees</span>
                    </div>
                  </div>

                  {/* Info Note */}
                  <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      This drill will be created in <span className="text-blue-400">DRAFT</span> status. 
                      {drillType === "email" 
                        ? "Page capture and content generation will begin automatically. You can launch when ready."
                        : "Vishing script generation will begin automatically. You can launch when ready."}
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-between px-8">
              <Button
                variant="ghost"
                onClick={modalStep === 1 ? closeModal : prevStep}
                className="h-9 px-4 text-sm text-neutral-400 hover:text-white hover:bg-white/[0.05]"
              >
                {modalStep === 1 ? "Cancel" : "Back"}
              </Button>
              <Button
                onClick={modalStep === 4 ? handleCreateDrill : nextStep}
                disabled={
                  (modalStep === 1 && !drillType) || 
                  (modalStep === 2 && (!drillForm.name.trim() || (drillType === "email" && !drillForm.loginUrl.trim()) || !selectedScenario)) ||
                  (modalStep === 3 && selectedTargets.length === 0) ||
                  (modalStep === 4 && isCreating)
                }
                className="h-9 px-6 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all hover:scale-105 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:hover:scale-100"
              >
                {modalStep === 4 ? (isCreating ? "Creating..." : "Create Drill") : "Continue"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function generateMockStats(drill: Drill) {
  const baseSent = drill.target_employee_ids?.length || 0;
  const clicked = Math.floor(baseSent * 0.3);
  return { sent: baseSent, clicked, replied: Math.floor(clicked * 0.4), clickRate: baseSent > 0 ? Math.round((clicked / baseSent) * 100) : 0 };
}

function LoadingTable() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="grid grid-cols-[40px_2fr_120px_100px_80px_80px_80px_100px] gap-4 px-4 py-5 rounded-xl bg-[#111118]/40 border border-white/[0.06]">
          <div className="flex items-center"><div className="h-4 w-4 bg-white/[0.05] rounded animate-pulse" /></div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-white/[0.05] rounded-lg animate-pulse" />
            <div className="space-y-2"><div className="h-4 w-32 bg-white/[0.05] rounded animate-pulse" /><div className="h-3 w-24 bg-white/[0.05] rounded animate-pulse" /></div>
          </div>
          <div className="flex items-center"><div className="h-6 w-20 bg-white/[0.05] rounded animate-pulse" /></div>
          <div className="flex items-center gap-2"><div className="h-4 w-8 bg-white/[0.05] rounded animate-pulse" /><div className="flex-1 h-1.5 bg-white/[0.05] rounded-full animate-pulse" /></div>
          {[1, 2, 3].map((j) => <div key={j} className="flex items-center justify-center"><div className="h-4 w-6 bg-white/[0.05] rounded animate-pulse" /></div>)}
          <div className="flex items-center justify-end gap-1"><div className="h-9 w-9 bg-white/[0.05] rounded-lg animate-pulse" /><div className="h-9 w-9 bg-white/[0.05] rounded-lg animate-pulse" /></div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasDrills }: { hasDrills: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/10 flex items-center justify-center mb-6">
        <Target className="h-10 w-10 text-blue-400/50" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{hasDrills ? "No drills found" : "No drills yet"}</h3>
      <p className="text-neutral-500 mb-6 max-w-md">{hasDrills ? "Try adjusting your search" : "Create your first drill"}</p>
    </div>
  );
}
