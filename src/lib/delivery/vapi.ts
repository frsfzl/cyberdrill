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

  // Use inline assistant configuration for dynamic per-call customization
  const assistant = {
    model: {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: `You are a professional IT Security representative from ${params.companyName || 'the company'}.

Your goal is to deliver the following security message to ${params.employeeName || 'the employee'}:

${params.script}

IMPORTANT GUIDELINES:
- Stay in character as IT Security
- Be professional and courteous
- Create urgency but don't be aggressive
- If asked questions, redirect to "checking the email we sent"
- Keep the call under 2 minutes
- End by thanking them for their cooperation`
        }
      ]
    },
    voice: {
      provider: '11labs',
      voiceId: 'bIHbv24MWmeRgasZH58o' // Professional male voice
    },
    firstMessage: `Hello, this is ${params.companyName || 'IT'} Security Department. May I speak with ${params.employeeName || 'you'}?`,
    endCallMessage: 'Thank you for your time. Have a great day.',
    endCallPhrases: ['goodbye', 'hang up', 'end call', 'bye']
  };

  const requestBody = {
    phoneNumberId,
    customer: {
      number: phoneNumber,
      numberE164CheckEnabled: false
    },
    assistant
  };

  console.log(`[VAPI] 🚀 Sending API request...`);
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
