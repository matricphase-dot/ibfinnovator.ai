import "server-only";
import * as Sentry from "@sentry/nextjs";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

type NotificationInput = {
  user_id: string;
  type: string;
  message: string;
  link?: string;
  metadata?: Json;
};

export async function enqueueNotification(input: NotificationInput): Promise<void> {
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: input.user_id,
    type: input.type,
    message: input.message,
    link: input.link ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) {
    Sentry.captureException(error, { tags: { area: "notification-insert" } });
    console.error("[notification:insert-failed]", error.message);
  }
}
