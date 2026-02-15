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

  // Ensure phone number is in E.164 format (starts with +)
  // If no country code, assume US (+1)
  let phoneNumber = params.toNumber.replace(/\D/g, ''); // Remove non-digits

  if (!params.toNumber.startsWith('+')) {
    // If 10 digits, assume US number (add +1)
    if (phoneNumber.length === 10) {
      phoneNumber = `+1${phoneNumber}`;
    } else if (phoneNumber.length === 11 && phoneNumber.startsWith('1')) {
      // Already has 1 prefix, just add +
      phoneNumber = `+${phoneNumber}`;
    } else {
      // Otherwise just add +
      phoneNumber = `+${phoneNumber}`;
    }
  } else {
    phoneNumber = params.toNumber;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`[VAPI] 📞 Initiating outbound call`);
  console.log(`[VAPI] 👤 To: ${params.employeeName || 'Employee'}`);
  console.log(`[VAPI] 📱 Number: ${phoneNumber}`);
  console.log(`[VAPI] 🏢 Company: ${params.companyName || 'N/A'}`);
  console.log(`[VAPI] 📞 Phone Number ID: ${phoneNumberId}`);
  console.log(`[VAPI] 📝 Script length: ${params.script.length} chars`);
  const assistantId = process.env.VAPI_ASSISTANT_ID;

  if (!assistantId) {
    throw new Error('VAPI_ASSISTANT_ID not configured');
  }

  const requestBody = {
    phoneNumberId,
    customer: {
      number: phoneNumber,
      numberE164CheckEnabled: false
    },
    assistantId, // Use permanent assistant with structured outputs
    assistantOverrides: {
      // Override the system prompt with dynamic script
      model: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: params.script
          }
        ]
      },
      firstMessage: `Hello, this is ${params.companyName || 'IT'} Security Department. May I speak with ${params.employeeName || 'you'}?`
    }
  };

  console.log(`[VAPI] 🚀 Sending API request...`);
  console.log(`[VAPI] Using assistant ID: ${assistantId}`);
  console.log(`[VAPI] Request body:`, JSON.stringify(requestBody, null, 2));

  const response = await fetch('https://api.vapi.ai/call/phone', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();

  console.log(`[VAPI] 📥 Response status: ${response.status}`);
  console.log(`[VAPI] 📥 Response body:`, responseText);

  if (!response.ok) {
    console.error(`[VAPI] ❌ API request failed`);
    console.error(`[VAPI] Status: ${response.status}`);
    console.error(`[VAPI] Body:`, responseText);
    throw new Error(`VAPI call failed (${response.status}): ${responseText}`);
  }

  const data = JSON.parse(responseText);

  console.log(`[VAPI] ✅ Call successfully initiated!`);
  console.log(`[VAPI] 📞 Call ID: ${data.id}`);
  console.log(`[VAPI] 📊 Status: ${data.status || 'initiated'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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

  console.log(`[VAPI] 📞 Fetching call status for: ${callId}`);

  const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[VAPI] ❌ Failed to get call status:`, errorText);
    throw new Error(`Failed to get call status: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[VAPI] ✅ Call status: ${data.status}`);

  return data;
}

export async function processCallAnalytics(callId: string) {
  console.log(`[VAPI] 📊 Processing analytics for call: ${callId}`);

  const call = await getVapiCallStatus(callId);

  // Check if call has ended
  if (call.status !== 'ended') {
    console.log(`[VAPI] ⏳ Call not ended yet, status: ${call.status}`);
    return null;
  }

  // Extract structured outputs
  const artifact = call.artifact || {};
  const structuredOutputs = artifact.structuredOutputs || {};

  console.log(`[VAPI] 📊 Found ${Object.keys(structuredOutputs).length} structured outputs`);

  // Map structured outputs by name
  const analytics: Record<string, any> = {};
  Object.entries(structuredOutputs).forEach(([outputId, data]: [string, any]) => {
    console.log(`[VAPI] 📋 Processing: ${data.name}`);
    analytics[data.name] = data.result;
  });

  // Extract call metadata
  const transcript = call.transcript || '';
  const recordingUrl = call.recordingUrl || '';
  const duration = call.endedAt && call.startedAt
    ? Math.floor((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000)
    : 0;

  console.log(`[VAPI] ✅ Analytics processed successfully`);

  return {
    analytics,
    transcript,
    recordingUrl,
    duration,
    status: call.status,
  };
}
