/**
 * VAPI.ai Voice Call Integration
 * Handles outbound vishing calls via VAPI
 */

interface VapiCallParams {
  toNumber: string;
  script: string;
  employeeName?: string;
  companyName?: string;
}

interface VapiCallResult {
  callId: string;
  status: string;
}

export async function makeVapiCall(params: VapiCallParams): Promise<VapiCallResult> {
  const apiKey = process.env.VAPI_PRIVATE_KEY;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

  if (!apiKey || !phoneNumberId) {
    throw new Error('VAPI credentials not configured');
  }

  // Create assistant configuration with the vishing script
  const assistant = {
    model: {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      systemPrompt: `You are a professional IT Security representative from ${params.companyName || 'the company'}.

Your goal is to deliver the following security message to ${params.employeeName || 'the employee'}:

${params.script}

IMPORTANT GUIDELINES:
- Stay in character as IT Security
- Be professional and courteous
- Create urgency but don't be aggressive
- If asked questions, redirect to "checking the email we sent"
- Keep the call under 2 minutes
- End by thanking them for their cooperation`,
    },
    voice: {
      provider: '11labs',
      voiceId: 'bIHbv24MWmeRgasZH58o', // Professional male voice
    },
    firstMessage: `Hello, this is ${params.companyName || 'IT'} Security Department. May I speak with ${params.employeeName || 'you'}?`,
    endCallMessage: 'Thank you for your time. Have a great day.',
    endCallPhrases: ['goodbye', 'hang up', 'end call', 'bye'],
  };

  console.log(`[VAPI] Making call to ${params.toNumber}...`);
  console.log(`[VAPI] Using phone number ID: ${phoneNumberId}`);

  // Make the outbound call
  const response = await fetch('https://api.vapi.ai/call/phone', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phoneNumberId,
      customer: {
        number: params.toNumber,
      },
      assistant,
    }),
  });

  const responseText = await response.text();
  console.log(`[VAPI] Response (${response.status}):`, responseText);

  if (!response.ok) {
    throw new Error(`VAPI call failed (${response.status}): ${responseText}`);
  }

  const data = JSON.parse(responseText);

  return {
    callId: data.id,
    status: data.status || 'initiated',
  };
}

export async function getVapiCallStatus(callId: string) {
  const apiKey = process.env.VAPI_PRIVATE_KEY;

  if (!apiKey) {
    throw new Error('VAPI credentials not configured');
  }

  const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get call status');
  }

  return await response.json();
}
