import { BaseEmail } from "./BaseEmail";
export default function NewMessageEmail({
  name = "IBF member",
  href = "https://innovators-global.com",
}: {
  name?: string;
  href?: string;
}) {
  return (
    <BaseEmail
      eyebrow="NEW MESSAGE"
      title="You received a new IBF message."
      cta="Read message"
      href={href}
    >
      <p>Hello {name},</p>
      <p>A collaborator sent you a message while you were away.</p>
    </BaseEmail>
  );
}
