import { BaseEmail } from "./BaseEmail";
export default function MeetingInviteEmail({
  name = "IBF member",
  href = "https://innovators-global.com",
}: {
  name?: string;
  href?: string;
}) {
  return (
    <BaseEmail
      eyebrow="MEETING INVITATION"
      title="You were invited to an IBF meeting."
      cta="View meeting"
      href={href}
    >
      <p>Hello {name},</p>
      <p>
        Review the meeting details and respond from your meetings workspace.
      </p>
    </BaseEmail>
  );
}
