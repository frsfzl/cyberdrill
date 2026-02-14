import { NextRequest, NextResponse } from "next/server";
import { getCampaigns, createCampaign } from "@/lib/models/campaign";

export async function GET() {
  try {
    const campaigns = await getCampaigns();
    return NextResponse.json(campaigns);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      pretext_scenario,
      company_name,
      industry,
      login_page_url,
      target_employee_ids,
      delivery_window,
    } = body;

    if (!name || !login_page_url) {
      return NextResponse.json(
        { error: "Name and login page URL are required" },
        { status: 400 }
      );
    }

    const campaign = await createCampaign({
      name,
      status: "draft",
      pretext_scenario: pretext_scenario || "",
      company_name: company_name || "",
      industry: industry || "",
      login_page_url,
      target_employee_ids: target_employee_ids || [],
      delivery_window: delivery_window || { start: "", end: "" },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
