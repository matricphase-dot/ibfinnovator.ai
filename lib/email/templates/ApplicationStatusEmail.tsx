import { BaseEmail } from "./BaseEmail";
export default function ApplicationStatusEmail({
  name = "IBF member",
  href = "https://innovators-global.com",
}: {
  name?: string;
  href?: string;
}) {
  return (
    <BaseEmail
      eyebrow="APPLICATION UPDATE"
      title="Your application status changed."
      cta="View applications"
      href={href}
    >
      <p>Hello {name},</p>
      <p>
        Open your applications workspace to review the latest status and next
        steps.
      </p>
    </BaseEmail>
  );
}
