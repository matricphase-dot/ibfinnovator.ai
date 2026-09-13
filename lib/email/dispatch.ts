import "server-only";
import type { ReactNode } from "react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "./client";
type Dispatch = {
  profileId?: string;
  to?: string;
  subject: string;
  react?: ReactNode;
  html?: string;
  text?: string;
  notificationId?: string;
};
export function dispatchEmail(input: Dispatch): void {
  void (async () => {
    try {
      let to = input.to,
        optIn = true;
      if (input.profileId) {
        const { data } = await supabaseAdmin
          .from("profiles")
          .select("email,email_opt_in")
          .eq("id", input.profileId)
          .maybeSingle();
        to = to || data?.email;
        optIn = data?.email_opt_in !== false;
      }
      if (!to || !optIn) {
        console.info("[email:dispatch-skipped]", {
          subject: input.subject,
          reason: !to ? "no recipient" : "opted out",
        });
        return;
      }
      const result = await sendEmail({
        to,
        subject: input.subject,
        react: input.react,
        html: input.html,
        text: input.text,
      });
      if (!result.skipped && input.notificationId)
        await supabaseAdmin
          .from("notifications")
          .update({ delivered_email_at: new Date().toISOString() })
          .eq("id", input.notificationId);
    } catch (error) {
      console.error("[email:dispatch-error]", error);
    }
  })();
}
