import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export async function sendPhishingEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const { error } = await getResend().emails.send({
    from: process.env.RESEND_FROM || "CyberDrill <noreply@zerobet.ai>",
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) throw new Error(error.message);
}
