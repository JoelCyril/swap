import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM ?? "SWAP <notifications@swapuae.com>";
const appOrigin = process.env.APP_ORIGIN ?? "https://swapuae.com";

let resend: Resend | null = null;

function getResend() {
  if (!resendApiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable");
  }

  if (!resend) {
    resend = new Resend(resendApiKey);
  }

  return resend;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const client = getResend();

  const { error } = await client.emails.send({
    from: emailFrom,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export function absoluteUrl(path: string) {
  return `${appOrigin}${path.startsWith("/") ? path : `/${path}`}`;
}
