import Retell from "retell-sdk";

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function makeVishingCall(params: {
  toNumber: string;
  fromNumber?: string;
}) {
  // Check if Retell is configured
  const fromNumber = params.fromNumber || process.env.RETELL_FROM_NUMBER;
  const apiKey = process.env.RETELL_API_KEY;

  if (!apiKey || !fromNumber || fromNumber === '+1234567890') {
    // Simulation mode - no actual call
    console.log(`[Vishing] SIMULATION MODE - Would call ${params.toNumber}`);
    console.log(`[Vishing] To enable real calls: Add payment method to Retell and get a phone number`);

    return {
      callId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'simulated',
    };
  }

  // Real call mode
  const response = await retellClient.call.createPhoneCall({
    from_number: fromNumber,
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
