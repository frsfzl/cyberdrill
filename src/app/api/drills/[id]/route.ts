import { NextRequest, NextResponse } from "next/server";
import {
  getCampaign,
  updateCampaign,
  deleteCampaign,
} from "@/lib/models/campaign";
import { getInteractionsByCampaign } from "@/lib/models/interaction";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await getCampaign(id);
    const interactions = await getInteractionsByCampaign(id);
    return NextResponse.json({ ...campaign, interactions });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 404 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const campaign = await updateCampaign(id, body);
    return NextResponse.json(campaign);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteCampaign(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
