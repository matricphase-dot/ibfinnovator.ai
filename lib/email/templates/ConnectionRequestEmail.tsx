import { BaseEmail } from "./BaseEmail";
export default function ConnectionRequestEmail({
  name = "IBF member",
  href = "https://innovators-global.com",
}: {
  name?: string;
  href?: string;
}) {
  return (
    <BaseEmail
      eyebrow="NEW CONNECTION"
      title="Someone wants to collaborate."
      cta="Review request"
      href={href}
    >
      <p>Hello {name},</p>
      <p>
        You received a new connection request. Review the profile and project
        context before responding.
      </p>
    </BaseEmail>
  );
}
