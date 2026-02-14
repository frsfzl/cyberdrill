import { NextRequest, NextResponse } from "next/server";
import { updateInteractionState } from "@/lib/models/interaction";
import { createLog } from "@/lib/models/log";

export async function POST(req: NextRequest) {
  try {
    const { token, submitted } = await req.json();

    // Strict validation: only accept boolean true
    if (!token || submitted !== true) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    const interaction = await updateInteractionState(
      token,
      "CREDENTIALS_SUBMITTED",
      { form_submitted_at: new Date().toISOString() }
    );

    await createLog({
      campaign_id: interaction.campaign_id,
      level: "info",
      action: "form_submitted",
      message: "Employee submitted form (boolean event only, no credentials captured)",
      metadata: { token, employee_id: interaction.employee_id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Capture event failed:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
