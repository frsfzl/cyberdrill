import { NextRequest, NextResponse } from "next/server";
import { makeVishingCall, getCallDetails } from "@/lib/delivery/voice";
import { getEmployee } from "@/lib/models/employee";
import { createLog } from "@/lib/models/log";

export async function POST(req: NextRequest) {
  try {
    const { employeeId, campaignId } = await req.json();

    if (!employeeId) {
      return NextResponse.json(
        { error: "employeeId is required" },
        { status: 400 }
      );
    }

    const employee = await getEmployee(employeeId);
    if (!employee.phone) {
      return NextResponse.json(
        { error: "Employee has no phone number" },
        { status: 400 }
      );
    }

    const result = await makeVishingCall({ toNumber: employee.phone });

    await createLog({
      campaign_id: campaignId,
      level: "info",
      action: "vishing_call_initiated",
      message: `Vishing call initiated to ${employee.name}`,
      metadata: { callId: result.callId, employeeId },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const callId = req.nextUrl.searchParams.get("callId");
    if (!callId) {
      return NextResponse.json(
        { error: "callId is required" },
        { status: 400 }
      );
    }

    const details = await getCallDetails(callId);
    return NextResponse.json(details);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
