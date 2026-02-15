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
      delivery_method,
      vapi_delay_minutes,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Campaign name is required" },
        { status: 400 }
      );
    }

    // Only require login_page_url for email delivery
    const needsEmail = !delivery_method || delivery_method === "email" || delivery_method === "both";
    if (needsEmail && !login_page_url) {
      return NextResponse.json(
        { error: "Login page URL is required for email delivery" },
        { status: 400 }
      );
    }

    const campaign = await createCampaign({
      name,
      status: "draft",
      pretext_scenario: pretext_scenario || "",
      company_name: company_name || "",
      industry: industry || "",
      login_page_url: login_page_url || "",
      target_employee_ids: target_employee_ids || [],
      delivery_window: delivery_window || { start: "", end: "" },
      delivery_method: delivery_method || "email",
      vapi_delay_minutes: vapi_delay_minutes || 5,
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
