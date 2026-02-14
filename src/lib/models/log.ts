import { supabase } from "@/lib/db";

export async function createLog(data: {
  campaign_id?: string;
  level: "info" | "warn" | "error";
  action: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabase.from("logs").insert(data);
  if (error) console.error("Failed to write log:", error);
}
