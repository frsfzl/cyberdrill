"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmployeeForm } from "@/components/employees/employee-form";
import { CsvUpload } from "@/components/employees/csv-upload";
import {
  Search,
  Users,
  Building2,
  ChevronDown,
  X,
  Plus,
  Filter,
  Trash2,
  Mail,
  Phone
} from "lucide-react";
import type { Employee } from "@/types";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/employees");
    if (res.ok) setEmployees(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    load();
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
        {/* Clean Top Bar - Single Line - Sticky */}
        <div className="sticky top-0 z-30 px-8 py-4 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between gap-4" style={{ position: 'sticky', top: 0 }}>
          {/* Left: Search & Filters */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search employees..."
                className="pl-10 bg-[#111118]/60 border-white/[0.06] rounded-xl h-10 text-sm placeholder:text-neutral-500 focus:border-blue-500/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`h-10 px-3 rounded-xl border-white/[0.06] bg-[#111118]/60 hover:bg-white/[0.05] transition-all ${
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

          {/* Right: Import & Add */}
          <div className="flex items-center gap-2">
            <CsvUpload onSuccess={load} />
            <EmployeeForm onSuccess={load} />
          </div>
        </div>

        {/* Employee List - Integrated into page */}
        <div className="px-8 pt-6 pb-8">
          {filtered.length === 0 ? (
            <EmptyState hasEmployees={employees.length > 0} />
          ) : (
            <div className="space-y-1">
              {/* Table Header */}
              <div className="flex items-center px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <div className="flex-1 min-w-0">Employee</div>
                <div className="w-48 hidden md:block">Contact</div>
                <div className="w-32 hidden lg:block">Department</div>
                <div className="w-32 hidden sm:block">Position</div>
                <div className="w-24">Status</div>
                <div className="w-10"></div>
              </div>

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
    </DashboardShell>
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
      {!hasEmployees && (
        <Button className="rounded-xl bg-white hover:bg-neutral-200 text-black px-6 py-5 font-medium transition-all hover:scale-105">
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      )}
    </div>
  );
}
