import "server-only";
import { Resend } from "resend";
import type { ReactNode } from "react";
type Input = {
  to: string | string[];
  subject: string;
  react?: ReactNode;
  html?: string;
  text?: string;
};
export async function sendEmail(input: Input) {
  const key = process.env.RESEND_API_KEY,
    from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.info("[email:skipped]", {
      to: input.to,
      subject: input.subject,
      reason: "RESEND_API_KEY or EMAIL_FROM missing",
    });
    return { skipped: true as const };
  }
  try {
    const resend = new Resend(key);
    const payload: any = { from, to: input.to, subject: input.subject };
    if (input.react) payload.react = input.react;
    else if (input.html) payload.html = input.html;
    else payload.text = input.text || input.subject;
    const { data, error } = await resend.emails.send(payload);
    if (error) throw error;
    return { skipped: false as const, id: data?.id };
  } catch (error) {
    console.error("[email:error]", error);
    return { skipped: true as const, error };
  }
}
