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

  const primaryFrom = process.env.EMAIL_FROM || "SWAP <notifications@swapuae.com>";
  const fallbackFrom = "SWAP <onboarding@resend.dev>";

  const res = await client.emails.send({
    from: primaryFrom,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  if (res.error) {
    if (
      res.error.message?.toLowerCase().includes("not verified") ||
      res.error.message?.toLowerCase().includes("domain")
    ) {
      console.warn(`[Email] ${primaryFrom} not verified in Resend yet, falling back to ${fallbackFrom}`);
      const fallbackRes = await client.emails.send({
        from: fallbackFrom,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });
      if (fallbackRes.error) {
        throw new Error(fallbackRes.error.message);
      }
      return fallbackRes;
    }
    throw new Error(res.error.message);
  }

  return res;
}

export function absoluteUrl(path: string) {
  return `${appOrigin}${path.startsWith("/") ? path : `/${path}`}`;
}
