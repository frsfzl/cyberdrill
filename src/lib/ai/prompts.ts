export function phishingEmailPrompt(params: {
  companyName: string;
  industry: string;
  pretextScenario: string;
  employeeName: string;
  trackingUrl: string;
}): string {
  return `You are a cybersecurity expert creating a realistic phishing email for a security awareness training exercise.

Context:
- Company: ${params.companyName} (${params.industry})
- Pretext scenario: ${params.pretextScenario}
- Target employee name: ${params.employeeName}
- The email should include this link naturally: ${params.trackingUrl}

Generate a realistic phishing email that uses the pretext scenario. The email should:
1. Be believable and professionally written
2. Use social engineering tactics (urgency, authority, fear)
3. Include the tracking URL as a call-to-action link
4. Be between 100-200 words

Respond in this exact JSON format only (no markdown, no code blocks):
{"subject": "the email subject line", "body": "the full email body in HTML format"}`;
}

export function vishingScriptPrompt(params: {
  companyName: string;
  industry: string;
  pretextScenario: string;
  employeeName: string;
}): string {
  return `You are a cybersecurity expert creating a vishing (voice phishing) script for a security awareness training exercise.

Context:
- Company: ${params.companyName} (${params.industry})
- Pretext scenario: ${params.pretextScenario}
- Target employee name: ${params.employeeName}

Generate a realistic vishing call script. The script should:
1. Start with a believable introduction
2. Use social engineering tactics to build rapport and urgency
3. Attempt to extract sensitive information (credentials, access codes)
4. Include natural dialogue with pauses and responses to common objections
5. Be structured as a conversation flow

Respond with the script as plain text, using "CALLER:" and "NOTES:" prefixes for dialogue and stage directions.`;
}
