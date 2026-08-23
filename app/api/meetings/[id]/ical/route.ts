import { requireUser } from "@/lib/supabase/server";
const esc = (s: string = "") =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
const stamp = (v: string) =>
  new Date(v)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params,
    { supabase, user } = await requireUser();
  const { data: m } = await supabase
    .from("meetings")
    .select("*,attendees:meeting_attendees(user_id)")
    .eq("id", id)
    .single();
  if (
    !m ||
    !(
      m.organizer_id === user.id ||
      m.attendees?.some((x: any) => x.user_id === user.id)
    )
  )
    return new Response("Forbidden", { status: 403 });
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IBF//Meetings//EN",
    "BEGIN:VEVENT",
    `UID:${m.id}@ibfinnovator.ai`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(m.starts_at)}`,
    `DTEND:${stamp(m.ends_at)}`,
    `SUMMARY:${esc(m.title)}`,
    `DESCRIPTION:${esc(m.description || "IBF collaboration meeting")}`,
    `LOCATION:${esc(m.location || "Online")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(body, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="ibf-meeting-${m.id}.ics"`,
    },
  });
}
