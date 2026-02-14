import { supabase } from "@/lib/db";
import type { Campaign, CampaignStatus } from "@/types";

export async function getCampaigns() {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Campaign[];
}

export async function getCampaign(id: string) {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Campaign;
}

export async function createCampaign(
  campaign: Omit<Campaign, "id" | "created_at" | "closed_at">
) {
  const { data, error } = await supabase
    .from("campaigns")
    .insert(campaign)
    .select()
    .single();
  if (error) throw error;
  return data as Campaign;
}

export async function updateCampaign(
  id: string,
  updates: Partial<Campaign>
) {
  const { data, error } = await supabase
    .from("campaigns")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Campaign;
}

export async function updateCampaignStatus(
  id: string,
  status: CampaignStatus
) {
  return updateCampaign(id, { status });
}

export async function deleteCampaign(id: string) {
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) throw error;
}
