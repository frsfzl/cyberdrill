"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Users,
  Building2,
  X,
  Plus,
  Filter,
  Trash2,
  ChevronDown,
  UserPlus,
  Upload,
} from "lucide-react";
import type { Employee } from "@/types";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/employees");
    if (res.ok) setEmployees(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Track scroll position for floating effect
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;

    const handleScroll = () => {
      setIsScrolled(main.scrollTop > 60);
    };
    
    main.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    
    return () => main.removeEventListener("scroll", handleScroll);
  }, []);

  // Close add menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setIsAddMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    load();
  }

  async function handleAddEmployee(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsAdding(true);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());

    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setIsAddDialogOpen(false);
      load();
    }
    setIsAdding(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/employees/import", {
      method: "POST",
      body: fd,
    });

    if (res.ok) {
      load();
    }
    setLoading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const filtered = employees.filter((e) => {
    const matchesSearch =
      !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase());

    const matchesDepartment =
      departmentFilter === "all" || e.department === departmentFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !e.opted_out) ||
      (statusFilter === "opted-out" && e.opted_out);

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departments = [...new Set(employees.map((e) => e.department || "Unassigned"))];

  const activeFiltersCount = 
    (departmentFilter !== "all" ? 1 : 0) + 
    (statusFilter !== "all" ? 1 : 0);

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
            {/* Left: Search & Filters */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className={`relative transition-all duration-300 ${isScrolled ? "w-56" : "w-64"}`}>
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isScrolled ? "text-neutral-400" : "text-neutral-500"}`} />
                <Input
                  placeholder="Search employees..."
                  className={`pl-10 border-white/[0.06] rounded-xl h-10 text-sm placeholder:text-neutral-500 focus:border-blue-500/50 disabled:opacity-50 transition-all duration-300 ${
                    isScrolled 
                      ? "bg-[#0a0a0f] border-white/[0.08]" 
                      : "bg-[#111118]/60"
                  }`}
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
                  className={`h-10 px-3 rounded-xl border-white/[0.06] hover:bg-white/[0.05] transition-all disabled:opacity-50 ${
                    isScrolled ? "bg-[#0a0a0f] border-white/[0.08]" : "bg-[#111118]/60"
                  } ${
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
                    <div className={`absolute top-full left-0 mt-2 w-56 p-3 rounded-xl border border-white/[0.08] shadow-2xl z-50 ${
                      isScrolled ? "bg-[#0a0a0f]" : "bg-[#111118]"
                    }`}>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-neutral-500 mb-1.5 block">Department</label>
                          <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-white/[0.06] text-sm text-neutral-300 focus:border-blue-500/50 outline-none"
                          >
                            <option value="all">All</option>
                            {departments.map((dept) => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-neutral-500 mb-1.5 block">Status</label>
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-[#0a0a0f] border border-white/[0.06] text-sm text-neutral-300 focus:border-blue-500/50 outline-none"
                          >
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="opted-out">Opted Out</option>
                          </select>
                        </div>
                        {activeFiltersCount > 0 && (
                          <button
                            onClick={() => { setDepartmentFilter("all"); setStatusFilter("all"); }}
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

              {/* Active Filter Pills */}
              {departmentFilter !== "all" && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{departmentFilter}</span>
                  <button 
                    onClick={() => setDepartmentFilter("all")}
                    className="ml-1 hover:text-blue-300 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {statusFilter !== "all" && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400">
                  <Users className="h-3.5 w-3.5" />
                  <span className="capitalize">{statusFilter.replace("-", " ")}</span>
                  <button 
                    onClick={() => setStatusFilter("all")}
                    className="ml-1 hover:text-blue-300 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Add Employee Dropdown */}
            <div className="relative" ref={addMenuRef}>
              {/* Hidden file input for CSV upload */}
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* Add Employee Button with Dropdown */}
              <div className="flex">
                <Button 
                  className="h-10 px-4 rounded-l-xl rounded-r-none bg-white hover:bg-neutral-200 text-black font-medium transition-all"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
                <Button 
                  className="h-10 px-2 rounded-l-none rounded-r-xl bg-white hover:bg-neutral-200 text-black font-medium transition-all border-l border-black/10"
                  onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isAddMenuOpen ? "rotate-180" : ""}`} />
                </Button>
              </div>

              {/* Add Employee Dropdown Menu */}
              {isAddMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsAddMenuOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 w-48 p-2 rounded-xl bg-[#111118] border border-white/[0.08] shadow-2xl z-50 animate-in fade-in slide-in-from-top-1">
                    <button
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        setIsAddDialogOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                    >
                      <UserPlus className="h-4 w-4 text-blue-400" />
                      Add manually
                    </button>
                    <div className="my-1 border-t border-white/[0.06]" />
                    <button
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        fileRef.current?.click();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                    >
                      <Upload className="h-4 w-4 text-emerald-400" />
                      Upload CSV
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Spacer when floating */}
        <div className={`transition-all duration-500 ${isScrolled ? "h-20" : "h-0"}`} />

        {/* Employee List */}
        <div className="px-8 pt-2 pb-8">
          {/* Table Header - Static at top */}
          <div className="flex items-center px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
            <div className="flex-1 min-w-0">Employee</div>
            <div className="w-48 hidden md:block">Contact</div>
            <div className="w-32 hidden lg:block">Department</div>
            <div className="w-32 hidden sm:block">Position</div>
            <div className="w-24">Status</div>
            <div className="w-10"></div>
          </div>

          {loading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState hasEmployees={employees.length > 0} />
          ) : (
            <div className="space-y-1">
              {/* Table Rows */}
              {filtered.map((emp, index) => {
                const initials = emp.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={emp.id}
                    className="group flex items-center px-4 py-3 rounded-xl hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/[0.06]"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    {/* Employee */}
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-medium text-sm flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{emp.name}</p>
                        <p className="text-sm text-neutral-500 truncate">{emp.email}</p>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="w-48 hidden md:block text-sm text-neutral-400">
                      {emp.phone || "—"}
                    </div>

                    {/* Department */}
                    <div className="w-32 hidden lg:block">
                      <span className="text-sm text-neutral-300">{emp.department || "—"}</span>
                    </div>

                    {/* Position */}
                    <div className="w-32 hidden sm:block">
                      <span className="text-sm text-neutral-300">{emp.position || "—"}</span>
                    </div>

                    {/* Status */}
                    <div className="w-24">
                      <Badge 
                        variant={emp.opted_out ? "destructive" : "secondary"}
                        className={`text-xs ${
                          emp.opted_out 
                            ? "bg-red-500/10 text-red-400 border-red-500/20" 
                            : "bg-green-500/10 text-green-400 border-green-500/20"
                        }`}
                      >
                        {emp.opted_out ? "Opted Out" : "Active"}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="w-10 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(emp.id)}
                        className="h-8 w-8 p-0 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Employee Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-[#111118] border-white/[0.08] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Add Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-neutral-400">Name *</Label>
                <Input id="name" name="name" required className="bg-[#0a0a0f] border-white/[0.06] text-white placeholder:text-neutral-600 focus:border-blue-500/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-400">Email *</Label>
                <Input id="email" name="email" type="email" required className="bg-[#0a0a0f] border-white/[0.06] text-white placeholder:text-neutral-600 focus:border-blue-500/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-neutral-400">Phone</Label>
                <Input id="phone" name="phone" className="bg-[#0a0a0f] border-white/[0.06] text-white placeholder:text-neutral-600 focus:border-blue-500/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department" className="text-neutral-400">Department</Label>
                <Input id="department" name="department" className="bg-[#0a0a0f] border-white/[0.06] text-white placeholder:text-neutral-600 focus:border-blue-500/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position" className="text-neutral-400">Position</Label>
                <Input id="position" name="position" className="bg-[#0a0a0f] border-white/[0.06] text-white placeholder:text-neutral-600 focus:border-blue-500/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager_email" className="text-neutral-400">Manager Email</Label>
                <Input id="manager_email" name="manager_email" type="email" className="bg-[#0a0a0f] border-white/[0.06] text-white placeholder:text-neutral-600 focus:border-blue-500/50" />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 rounded-xl bg-white hover:bg-neutral-200 text-black font-medium transition-all" disabled={isAdding}>
              {isAdding ? "Adding..." : "Add Employee"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

// Loading State Component
function LoadingState() {
  return (
    <div className="space-y-1">
      {/* Table Rows Skeleton */}
      {[1, 2, 3, 4, 5, 6].map((row) => (
        <div
          key={row}
          className="flex items-center px-4 py-3 rounded-xl bg-white/[0.02]"
        >
          {/* Employee Skeleton */}
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/[0.05] animate-pulse flex-shrink-0" />
            <div className="min-w-0 space-y-2">
              <div className="h-4 w-32 bg-white/[0.05] rounded animate-pulse" />
              <div className="h-3 w-48 bg-white/[0.05] rounded animate-pulse" />
            </div>
          </div>

          {/* Contact Skeleton */}
          <div className="w-48 hidden md:block">
            <div className="h-4 w-24 bg-white/[0.05] rounded animate-pulse" />
          </div>

          {/* Department Skeleton */}
          <div className="w-32 hidden lg:block">
            <div className="h-4 w-20 bg-white/[0.05] rounded animate-pulse" />
          </div>

          {/* Position Skeleton */}
          <div className="w-32 hidden sm:block">
            <div className="h-4 w-20 bg-white/[0.05] rounded animate-pulse" />
          </div>

          {/* Status Skeleton */}
          <div className="w-24">
            <div className="h-5 w-16 bg-white/[0.05] rounded animate-pulse" />
          </div>

          {/* Actions Skeleton */}
          <div className="w-10" />
        </div>
      ))}
    </div>
  );
}

// Empty State Component
function EmptyState({ hasEmployees }: { hasEmployees: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/10 flex items-center justify-center mb-6">
        <Users className="h-10 w-10 text-blue-400/50" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        {hasEmployees ? "No employees found" : "No employees yet"}
      </h3>
      <p className="text-neutral-500 mb-6 max-w-md">
        {hasEmployees
          ? "Try adjusting your search or filter criteria"
          : "Get started by adding employees manually or importing from CSV"}
      </p>
    </div>
  );
}
