import Retell from "retell-sdk";

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function makeVishingCall(params: {
  toNumber: string;
  fromNumber?: string;
}) {
  const response = await retellClient.call.createPhoneCall({
    from_number: params.fromNumber || process.env.RETELL_FROM_NUMBER || "",
    to_number: params.toNumber,
  });

  return {
    callId: response.call_id,
    status: response.call_status,
  };
}

export async function getCallDetails(callId: string) {
  const response = await retellClient.call.retrieve(callId);
  return {
    callId: response.call_id,
    status: response.call_status,
    transcript: response.transcript,
    summary: response.call_analysis?.call_summary,
    successful: response.call_analysis?.call_successful,
  };
}
