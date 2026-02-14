"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmployeeTable } from "@/components/employees/employee-table";
import { EmployeeForm } from "@/components/employees/employee-form";
import { CsvUpload } from "@/components/employees/csv-upload";
import {
  Search,
  Users,
  UserX,
  Building2,
  Download,
  Filter,
  TrendingUp,
  CheckCircle2,
  XCircle
} from "lucide-react";
import type { Employee } from "@/types";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "departments">("table");

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

  const stats = {
    total: employees.length,
    active: employees.filter((e) => !e.opted_out).length,
    optedOut: employees.filter((e) => e.opted_out).length,
    departments: [...new Set(employees.map((e) => e.department))].length,
  };

  const departments = [...new Set(employees.map((e) => e.department || "Unassigned"))];

  const departmentGroups = employees.reduce((acc, emp) => {
    const dept = emp.department || "Unassigned";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {} as Record<string, Employee[]>);

  function exportToCsv() {
    const csv = [
      ["Name", "Email", "Phone", "Department", "Position", "Manager", "Status"].join(","),
      ...filtered.map((e) =>
        [
          e.name,
          e.email,
          e.phone,
          e.department,
          e.position,
          e.manager_email || "",
          e.opted_out ? "Opted Out" : "Active",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employees-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <h1 className="text-4xl font-bold tracking-tight">Employees</h1>
            <p className="text-muted-foreground text-lg">
              Manage employee directory and simulation eligibility
            </p>
          </div>
          <div className="flex gap-2">
            <CsvUpload onSuccess={load} />
            <EmployeeForm onSuccess={load} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Employees
                  </p>
                  <p className="text-3xl font-bold mt-2">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground/40" />
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
                <CheckCircle2 className="h-8 w-8 text-green-500/40" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Opted Out
                  </p>
                  <p className="text-3xl font-bold mt-2">{stats.optedOut}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500/40" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-violet-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Departments
                  </p>
                  <p className="text-3xl font-bold mt-2">{stats.departments}</p>
                </div>
                <Building2 className="h-8 w-8 text-violet-500/40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or department..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="opted-out">Opted Out</option>
              </select>

              <div className="flex border border-border rounded-lg">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="rounded-r-none"
                >
                  Table
                </Button>
                <Button
                  variant={viewMode === "departments" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("departments")}
                  className="rounded-l-none"
                >
                  Departments
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={exportToCsv}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Employee List */}
        {viewMode === "table" ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  All Employees
                  <span className="ml-3 text-muted-foreground font-normal text-base">
                    ({filtered.length} {filtered.length === 1 ? "result" : "results"})
                  </span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-muted p-6 mb-6">
                    <UserX className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No employees found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    {employees.length === 0
                      ? "Get started by adding employees manually or importing from CSV"
                      : "Try adjusting your search or filter criteria"}
                  </p>
                </div>
              ) : (
                <EmployeeTable employees={filtered} onDelete={handleDelete} />
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(departmentGroups).map(([dept, emps]) => {
              const deptActive = emps.filter((e) => !e.opted_out).length;
              const deptOptedOut = emps.filter((e) => e.opted_out).length;

              return (
                <Card key={dept}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-muted">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{dept}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {emps.length} employee{emps.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="font-medium">{deptActive} active</span>
                          </div>
                          {deptOptedOut > 0 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span>{deptOptedOut} opted out</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {emps.map((emp) => (
                        <div
                          key={emp.id}
                          className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <p className="font-medium">{emp.name}</p>
                              <Badge
                                variant={emp.opted_out ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {emp.opted_out ? "Opted Out" : "Active"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span>{emp.email}</span>
                              {emp.position && (
                                <>
                                  <span>•</span>
                                  <span>{emp.position}</span>
                                </>
                              )}
                              {emp.phone && (
                                <>
                                  <span>•</span>
                                  <span>{emp.phone}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(emp.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            Delete
                          </Button>
                        </div>
                      ))}
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
