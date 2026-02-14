"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";
import type { Employee } from "@/types";

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: "",
    pretext_scenario: "",
    company_name: "",
    industry: "",
    login_page_url: "",
  });

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then(setEmployees)
      .catch(() => {});
  }, []);

  function toggleEmployee(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleCreate() {
    setLoading(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        target_employee_ids: selectedIds,
      }),
    });

    if (res.ok) {
      const campaign = await res.json();
      router.push(`/dashboard/campaigns/${campaign.id}`);
    }
    setLoading(false);
  }

  return (
    <DashboardShell>
      <h2 className="text-2xl font-bold">Create Campaign</h2>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Q1 2026 Phishing Drill"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={form.company_name}
                  onChange={(e) =>
                    setForm({ ...form, company_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={form.industry}
                  onChange={(e) =>
                    setForm({ ...form, industry: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pretext_scenario">Pretext Scenario</Label>
              <Textarea
                id="pretext_scenario"
                value={form.pretext_scenario}
                onChange={(e) =>
                  setForm({ ...form, pretext_scenario: e.target.value })
                }
                placeholder="e.g., IT department requesting password reset due to security breach..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login_page_url">Login Page URL to Clone *</Label>
              <Input
                id="login_page_url"
                value={form.login_page_url}
                onChange={(e) =>
                  setForm({ ...form, login_page_url: e.target.value })
                }
                placeholder="https://login.example.com"
              />
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={!form.name || !form.login_page_url}
              className="w-full"
            >
              Next: Select Targets
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Select Target Employees ({selectedIds.length} selected)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedIds.map((id) => {
                  const emp = employees.find((e) => e.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="gap-1">
                      {emp?.name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => toggleEmployee(id)}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}

            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {employees
                .filter((e) => !e.opted_out)
                .map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => toggleEmployee(emp.id)}
                    className={`flex items-center justify-between rounded-md border p-3 cursor-pointer transition-colors ${
                      selectedIds.includes(emp.id)
                        ? "border-primary bg-primary/5"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div>
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {emp.email} - {emp.department}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {emp.position}
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading || selectedIds.length === 0}
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}
