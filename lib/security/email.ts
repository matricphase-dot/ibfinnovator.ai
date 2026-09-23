import { z } from "zod";

/**
 * ROOT FIX for M3: Resend subject / recipient header injection.
 * Central choke-point — every email path goes through `sendEmail`,
 * so sanitizing here fixes all callers (applications, meetings, certificates…)
 * instead of patching each route.
 */

const MAX_SUBJECT = 140;
const MAX_TO = 5;

export function sanitizeEmailSubject(raw: unknown): string {
  const text = typeof raw === "string" ? raw : String(raw ?? "");
  // Strip CR/LF + control chars (header-injection vectors), collapse whitespace
  const singleLine = text
    .replace(/[\r\n]+/g, " ")
    .replace(/[\x00-\x1F\x7F]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!singleLine) return "Notification from IBF";
  return singleLine.slice(0, MAX_SUBJECT);
}

export const emailRecipientSchema = z.string().trim().email().max(254);

export function sanitizeEmailRecipients(
  to: string | string[],
): string[] | null {
  const list = Array.isArray(to) ? to : [to];
  const clean: string[] = [];
  for (const candidate of list.slice(0, MAX_TO)) {
    const parsed = emailRecipientSchema.safeParse(candidate);
    if (parsed.success) clean.push(parsed.data);
  }
  return clean.length > 0 ? clean : null;
}
