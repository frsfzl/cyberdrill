"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Mail, Phone as PhoneIcon } from "lucide-react";
import type { Employee } from "@/types";

interface EmployeeTableProps {
  employees: Employee[];
  onDelete: (id: string) => void;
}

export function EmployeeTable({ employees, onDelete }: EmployeeTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/[0.06] hover:bg-transparent">
          <TableHead className="text-neutral-400 font-medium">Employee</TableHead>
          <TableHead className="text-neutral-400 font-medium">Contact</TableHead>
          <TableHead className="text-neutral-400 font-medium">Department</TableHead>
          <TableHead className="text-neutral-400 font-medium">Position</TableHead>
          <TableHead className="text-neutral-400 font-medium">Status</TableHead>
          <TableHead className="w-[60px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-neutral-500 py-8">
              No employees found
            </TableCell>
          </TableRow>
        ) : (
          employees.map((emp, index) => (
            <TableRow 
              key={emp.id} 
              className="border-white/[0.04] hover:bg-white/[0.02] transition-colors group"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-medium text-sm">
                    {emp.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{emp.name}</p>
                    <p className="text-xs text-neutral-500">{emp.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  {emp.phone && (
                    <div className="flex items-center gap-1.5 text-neutral-400">
                      <PhoneIcon className="h-3.5 w-3.5" />
                      <span className="text-sm">{emp.phone}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-neutral-300">{emp.department || "—"}</span>
              </TableCell>
              <TableCell>
                <span className="text-neutral-300">{emp.position || "—"}</span>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={emp.opted_out ? "destructive" : "secondary"}
                  className={`${
                    emp.opted_out 
                      ? "bg-red-500/10 text-red-400 border-red-500/20" 
                      : "bg-green-500/10 text-green-400 border-green-500/20"
                  }`}
                >
                  {emp.opted_out ? "Opted Out" : "Active"}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(emp.id)}
                  className="text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
