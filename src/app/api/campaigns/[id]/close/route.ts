import { NextRequest, NextResponse } from "next/server";
import { getCampaign, updateCampaign } from "@/lib/models/campaign";
import { createLog } from "@/lib/models/log";
import { stopLandingServer } from "@/lib/landing-server";
import { stopTunnel } from "@/lib/tunnel/ngrok";
import fs from "fs/promises";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const campaign = await getCampaign(id);

    // Teardown tunnel
    await stopTunnel();
    await stopLandingServer();

    // Delete captured HTML
    if (campaign.captured_html_path) {
      try {
        await fs.unlink(campaign.captured_html_path);
      } catch {
        // File may already be deleted
      }
    }

    // Update all pending/delivered interactions to NO_INTERACTION
    const { supabase } = await import("@/lib/db");
    await supabase
      .from("interactions")
      .update({
        state: "NO_INTERACTION",
        updated_at: new Date().toISOString(),
      })
      .eq("campaign_id", id)
      .in("state", ["PENDING", "DELIVERED"]);

    await updateCampaign(id, {
      status: "closed",
      closed_at: new Date().toISOString(),
      ngrok_url: undefined,
      captured_html_path: undefined,
    });

    await createLog({
      campaign_id: id,
      level: "info",
      action: "campaign_closed",
      message: "Campaign closed, tunnel torn down, HTML deleted",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
