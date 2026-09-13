import { BaseEmail } from "./BaseEmail";
export default function BadgeAwardedEmail({
  name = "IBF member",
  href = "https://innovators-global.com",
}: {
  name?: string;
  href?: string;
}) {
  return (
    <BaseEmail
      eyebrow="CREDENTIAL EARNED"
      title="You earned a contribution badge."
      cta="View credential"
      href={href}
    >
      <p>Hello {name},</p>
      <p>A founder recognized your verified contribution to a project.</p>
    </BaseEmail>
  );
}
