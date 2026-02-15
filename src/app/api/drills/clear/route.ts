import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

/**
 * Clear all campaigns and related data
 * WARNING: This is a destructive operation!
 */
export async function POST() {
  try {
    console.log('[Clear Campaigns] Starting...');

    // Delete interactions (cascades from campaigns)
    const { error: interactionsError } = await supabase
      .from('interactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (interactionsError) {
      console.error('[Clear Campaigns] Failed to delete interactions:', interactionsError);
      throw interactionsError;
    }

    // Delete logs
    const { error: logsError } = await supabase
      .from('logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (logsError) {
      console.error('[Clear Campaigns] Failed to delete logs:', logsError);
      throw logsError;
    }

    // Delete campaigns
    const { error: campaignsError } = await supabase
      .from('campaigns')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (campaignsError) {
      console.error('[Clear Campaigns] Failed to delete campaigns:', campaignsError);
      throw campaignsError;
    }

    console.log('[Clear Campaigns] ✅ All campaigns and data cleared successfully');

    return NextResponse.json({
      success: true,
      message: 'All campaigns and data cleared successfully'
    });
  } catch (error) {
    console.error('[Clear Campaigns] ❌ Error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
