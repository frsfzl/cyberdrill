"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  X,
  ArrowLeft,
  Check,
  Info,
  Mail,
  Link2,
  Users,
  Calendar,
  AlertCircle,
  Search,
  Building2,
  Briefcase,
  Globe,
  Shield
} from "lucide-react";
import type { Employee } from "@/types";

const PRETEXT_SCENARIOS = [
  {
    id: "password-reset",
    label: "IT Password Reset",
    description: "Urgent password reset request from IT department",
    icon: Shield,
  },
  {
    id: "hr-benefits",
    label: "HR Benefits Enrollment",
    description: "Update benefits information or enrollment form",
    icon: Briefcase,
  },
  {
    id: "executive-request",
    label: "Executive Request",
    description: "Urgent request from C-level executive",
    icon: Building2,
  },
  {
    id: "vendor-invoice",
    label: "Vendor Invoice",
    description: "Payment or invoice verification from vendor",
    icon: Mail,
  },
  {
    id: "security-alert",
    label: "Security Alert",
    description: "Account security notification or breach alert",
    icon: AlertCircle,
  },
  {
    id: "custom",
    label: "Custom Scenario",
    description: "Create your own custom pretext",
    icon: Globe,
  },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState(1);
  const [selectedPretext, setSelectedPretext] = useState("");
  const [customPretext, setCustomPretext] = useState("");

  const [form, setForm] = useState({
    name: "",
    company_name: "",
    industry: "",
    login_page_url: "",
    delivery_window_start: "",
    delivery_window_end: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then(setEmployees)
      .catch(() => {});
  }, []);

  const filteredEmployees = employees.filter((emp) =>
    !emp.opted_out &&
    (emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const departmentGroups = filteredEmployees.reduce((acc, emp) => {
    const dept = emp.department || "Unassigned";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {} as Record<string, Employee[]>);

  function validateStep(stepNum: number): boolean {
    const newErrors: Record<string, string> = {};

    if (stepNum === 1) {
      if (!form.name.trim()) newErrors.name = "Campaign name is required";
      if (!form.login_page_url.trim()) newErrors.login_page_url = "Login page URL is required";
      if (form.login_page_url && !/^https?:\/\/.+/.test(form.login_page_url)) {
        newErrors.login_page_url = "Please enter a valid URL";
      }
    }

    if (stepNum === 2) {
      if (!selectedPretext) newErrors.pretext = "Please select a pretext scenario";
      if (selectedPretext === "custom" && !customPretext.trim()) {
        newErrors.customPretext = "Please describe your custom scenario";
      }
    }

    if (stepNum === 3) {
      if (selectedIds.length === 0) newErrors.targets = "Please select at least one target employee";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  }

  function toggleEmployee(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectDepartment(dept: string) {
    const deptEmployeeIds = departmentGroups[dept].map((e) => e.id);
    const allSelected = deptEmployeeIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !deptEmployeeIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...deptEmployeeIds])]);
    }
  }

  async function handleCreate() {
    if (!validateStep(step)) return;

    setLoading(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        pretext_scenario: selectedPretext === "custom" ? customPretext :
          PRETEXT_SCENARIOS.find((s) => s.id === selectedPretext)?.description || "",
        target_employee_ids: selectedIds,
        delivery_window: {
          start: form.delivery_window_start || "",
          end: form.delivery_window_end || "",
        },
      }),
    });

    if (res.ok) {
      const campaign = await res.json();
      router.push(`/dashboard/campaigns/${campaign.id}`);
    } else {
      setErrors({ submit: "Failed to create campaign. Please try again." });
    }
    setLoading(false);
  }

  const progress = (step / 4) * 100;
  const stepLabels = ["Details", "Scenario", "Targets", "Review"];

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Create Campaign</h1>
              <p className="text-muted-foreground mt-1">
                Configure and deploy a new phishing simulation
              </p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                {stepLabels.map((label, idx) => (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className={`flex items-center justify-center h-8 w-8 rounded-full border-2 transition-all ${
                        idx + 1 < step
                          ? "bg-primary border-primary text-primary-foreground"
                          : idx + 1 === step
                          ? "border-primary text-primary"
                          : "border-muted text-muted-foreground"
                      }`}
                    >
                      {idx + 1 < step ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span className="text-sm font-medium">{idx + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        idx + 1 === step ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Step 1: Campaign Details */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                Provide basic information about your simulation campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Campaign Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Q1 2026 Security Awareness Drill"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    placeholder="Acme Corporation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    placeholder="Technology"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login_page_url" className="flex items-center gap-2">
                  Login Page URL to Clone <span className="text-destructive">*</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    (Will be captured with SingleFile)
                  </span>
                </Label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login_page_url"
                    value={form.login_page_url}
                    onChange={(e) => setForm({ ...form, login_page_url: e.target.value })}
                    placeholder="https://login.example.com"
                    className={`pl-10 ${errors.login_page_url ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.login_page_url && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.login_page_url}
                  </p>
                )}
                <p className="text-xs text-muted-foreground flex items-start gap-1.5 mt-2">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  This URL will be cloned pixel-for-pixel and served via ngrok tunnel
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button onClick={handleNext} size="lg" className="px-8">
                  Next Step
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Pretext Scenario */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Pretext Scenario</CardTitle>
              <CardDescription>
                Select the social engineering scenario for your campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {PRETEXT_SCENARIOS.map((scenario) => {
                  const Icon = scenario.icon;
                  return (
                    <button
                      key={scenario.id}
                      onClick={() => setSelectedPretext(scenario.id)}
                      className={`p-6 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                        selectedPretext === scenario.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${
                          selectedPretext === scenario.id ? "bg-primary/10" : "bg-muted"
                        }`}>
                          <Icon className={`h-6 w-6 ${
                            selectedPretext === scenario.id ? "text-primary" : "text-muted-foreground"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{scenario.label}</h3>
                          <p className="text-sm text-muted-foreground">
                            {scenario.description}
                          </p>
                        </div>
                        {selectedPretext === scenario.id && (
                          <Check className="h-5 w-5 text-primary mt-1" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedPretext === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="custom_pretext">Custom Scenario Description</Label>
                  <textarea
                    id="custom_pretext"
                    value={customPretext}
                    onChange={(e) => setCustomPretext(e.target.value)}
                    placeholder="Describe your custom phishing scenario in detail..."
                    rows={4}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                      errors.customPretext ? "border-destructive" : "border-input"
                    }`}
                  />
                  {errors.customPretext && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.customPretext}
                    </p>
                  )}
                </div>
              )}

              {errors.pretext && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.pretext}
                </p>
              )}

              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleNext} size="lg" className="px-8">
                  Next Step
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Target Selection */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Select Targets</span>
                <Badge variant="secondary" className="text-lg px-4 py-1">
                  {selectedIds.length} selected
                </Badge>
              </CardTitle>
              <CardDescription>
                Choose employees to include in this simulation (minimum 1 required)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selected Employees Preview */}
              {selectedIds.length > 0 && (
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm font-medium mb-3">Selected Employees:</p>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {selectedIds.map((id) => {
                      const emp = employees.find((e) => e.id === id);
                      return (
                        <Badge key={id} variant="secondary" className="gap-2">
                          {emp?.name}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-destructive"
                            onClick={() => toggleEmployee(id)}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or department..."
                  className="pl-10"
                />
              </div>

              {/* Department Groups */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(departmentGroups).map(([dept, emps]) => {
                  const deptIds = emps.map((e) => e.id);
                  const allSelected = deptIds.every((id) => selectedIds.includes(id));
                  const someSelected = deptIds.some((id) => selectedIds.includes(id));

                  return (
                    <div key={dept} className="space-y-2">
                      <button
                        onClick={() => selectDepartment(dept)}
                        className="flex items-center justify-between w-full p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-muted-foreground" />
                          <div className="text-left">
                            <p className="font-medium">{dept}</p>
                            <p className="text-sm text-muted-foreground">
                              {emps.length} employee{emps.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                          allSelected
                            ? "bg-primary border-primary"
                            : someSelected
                            ? "bg-primary/50 border-primary"
                            : "border-input"
                        }`}>
                          {allSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          {someSelected && !allSelected && <div className="h-2 w-2 bg-primary-foreground rounded-sm" />}
                        </div>
                      </button>

                      <div className="pl-6 space-y-1">
                        {emps.map((emp) => (
                          <button
                            key={emp.id}
                            onClick={() => toggleEmployee(emp.id)}
                            className={`w-full flex items-center justify-between rounded-md border p-3 transition-all ${
                              selectedIds.includes(emp.id)
                                ? "border-primary bg-primary/5"
                                : "border-transparent hover:bg-accent"
                            }`}
                          >
                            <div className="text-left">
                              <p className="font-medium text-sm">{emp.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {emp.email} • {emp.position}
                              </p>
                            </div>
                            <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                              selectedIds.includes(emp.id)
                                ? "bg-primary border-primary"
                                : "border-input"
                            }`}>
                              {selectedIds.includes(emp.id) && (
                                <Check className="h-3 w-3 text-primary-foreground" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {errors.targets && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.targets}
                </p>
              )}

              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleNext} size="lg" className="px-8">
                  Review Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review & Launch */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Create</CardTitle>
              <CardDescription>
                Review your campaign configuration before creating
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Campaign Name</p>
                      <p className="font-medium">{form.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Company</p>
                      <p className="font-medium">{form.company_name || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Industry</p>
                      <p className="font-medium">{form.industry || "Not specified"}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Login Page URL</p>
                      <p className="font-medium text-sm break-all">{form.login_page_url}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Pretext Scenario</p>
                      <p className="font-medium">
                        {selectedPretext === "custom"
                          ? "Custom Scenario"
                          : PRETEXT_SCENARIOS.find((s) => s.id === selectedPretext)?.label}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Target Employees</p>
                      <p className="font-medium">{selectedIds.length} selected</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-500">Important Notes</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Campaign will be created in DRAFT status</li>
                        <li>• Page capture and content generation will begin after creation</li>
                        <li>• You must manually launch the campaign once ready</li>
                        <li>• All interactions will be logged per SOP compliance requirements</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {errors.submit && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.submit}
                </p>
              )}

              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={loading}
                  size="lg"
                  className="px-8"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
