"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface EmployeeFormProps {
  onSuccess: () => void;
}

export function EmployeeForm({ onSuccess }: EmployeeFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());

    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setOpen(false);
      onSuccess();
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-medium transition-all hover:scale-105">
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#111118] border-white/[0.08] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Add Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <Button type="submit" className="w-full h-11 rounded-xl bg-white hover:bg-neutral-200 text-black font-medium transition-all" disabled={loading}>
            {loading ? "Adding..." : "Add Employee"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
