import { supabase } from "@/lib/db";
import type { Interaction, InteractionState } from "@/types";

export async function createInteraction(data: {
  campaign_id: string;
  employee_id: string;
}) {
  const { data: interaction, error } = await supabase
    .from("interactions")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return interaction as Interaction;
}

export async function getInteractionByToken(token: string) {
  const { data, error } = await supabase
    .from("interactions")
    .select("*, employees(*), campaigns(*)")
    .eq("tracking_token", token)
    .single();
  if (error) throw error;
  return data;
}

export async function updateInteractionState(
  token: string,
  state: InteractionState,
  extras: Partial<Interaction> = {}
) {
  const { data, error } = await supabase
    .from("interactions")
    .update({
      state,
      updated_at: new Date().toISOString(),
      ...extras,
    })
    .eq("tracking_token", token)
    .select()
    .single();
  if (error) throw error;
  return data as Interaction;
}

export async function getInteractionsByCampaign(campaignId: string) {
  const { data, error } = await supabase
    .from("interactions")
    .select("*, employees(name, email, department)")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
