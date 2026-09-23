import "server-only";
import { Resend } from "resend";
import type { ReactNode } from "react";
import {
  sanitizeEmailRecipients,
  sanitizeEmailSubject,
} from "@/lib/security/email";
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
  // ROOT FIX M3: central choke-point sanitization — strips CR/LF header injection
  // from every caller (project titles are user-controlled) and validates recipients.
  const subject = sanitizeEmailSubject(input.subject);
  const to = sanitizeEmailRecipients(input.to);
  if (!key || !from) {
    console.info("[email:skipped]", {
      to,
      subject,
      reason: "RESEND_API_KEY or EMAIL_FROM missing",
    });
    return { skipped: true as const };
  }
  if (!to) {
    console.info("[email:skipped]", { subject, reason: "invalid recipient" });
    return { skipped: true as const };
  }
  try {
    const resend = new Resend(key);
    if (input.react) {
      const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        react: input.react,
      });
      if (error) throw error;
      return { skipped: false as const, id: data?.id };
    }
    if (input.html) {
      const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html: input.html,
      });
      if (error) throw error;
      return { skipped: false as const, id: data?.id };
    }
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      text: input.text || subject,
    });
    if (error) throw error;
    return { skipped: false as const, id: data?.id };
  } catch (error) {
    console.error("[email:error]", error);
    return { skipped: true as const, error };
  }
}
