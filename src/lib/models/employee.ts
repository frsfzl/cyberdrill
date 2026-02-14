import { supabase } from "@/lib/db";
import type { Employee } from "@/types";

export async function getEmployees() {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Employee[];
}

export async function getEmployee(id: string) {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Employee;
}

export async function createEmployee(
  employee: Omit<Employee, "id" | "created_at" | "updated_at">
) {
  const { data, error } = await supabase
    .from("employees")
    .insert(employee)
    .select()
    .single();
  if (error) throw error;
  return data as Employee;
}

export async function updateEmployee(
  id: string,
  updates: Partial<Omit<Employee, "id" | "created_at">>
) {
  const { data, error } = await supabase
    .from("employees")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Employee;
}

export async function deleteEmployee(id: string) {
  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) throw error;
}

export async function bulkCreateEmployees(
  employees: Omit<Employee, "id" | "created_at" | "updated_at">[]
) {
  const { data, error } = await supabase
    .from("employees")
    .upsert(employees, { onConflict: "email" })
    .select();
  if (error) throw error;
  return data as Employee[];
}
