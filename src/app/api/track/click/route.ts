import { NextRequest, NextResponse } from "next/server";
import { updateInteractionState, getInteractionByToken } from "@/lib/models/interaction";
import { createLog } from "@/lib/models/log";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const interaction = await getInteractionByToken(token);
    if (!interaction) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    // Only advance state if not already past LINK_CLICKED
    if (
      interaction.state === "PENDING" ||
      interaction.state === "DELIVERED"
    ) {
      await updateInteractionState(token, "LINK_CLICKED", {
        link_clicked_at: new Date().toISOString(),
        user_agent: req.headers.get("user-agent") || undefined,
      });
    }

    await createLog({
      campaign_id: interaction.campaign_id,
      level: "info",
      action: "link_clicked",
      message: `Employee clicked tracking link`,
      metadata: { token, employee_id: interaction.employee_id },
    });

    // Redirect to the ngrok URL with token
    const campaign = interaction.campaigns;
    if (campaign?.ngrok_url) {
      return NextResponse.redirect(`${campaign.ngrok_url}?t=${token}`);
    }

    // Fallback: redirect to learning page
    return NextResponse.redirect(
      new URL(`/learn/${token}`, req.url)
    );
  } catch (error) {
    console.error("Click tracking failed:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
