import { BaseEmail } from "./BaseEmail";
export default function ConnectionAcceptedEmail({
  name = "IBF member",
  href = "https://innovators-global.com",
}: {
  name?: string;
  href?: string;
}) {
  return (
    <BaseEmail
      eyebrow="CONNECTION ACCEPTED"
      title="Your collaboration request was accepted."
      cta="Open conversation"
      href={href}
    >
      <p>Hello {name},</p>
      <p>
        You can now continue the conversation and align on goals, availability,
        and next steps.
      </p>
    </BaseEmail>
  );
}
