import { BaseEmail } from "./BaseEmail";
export default function WelcomeEmail({
  name = "IBF member",
  href = "https://innovators-global.com",
}: {
  name?: string;
  href?: string;
}) {
  return (
    <BaseEmail
      eyebrow="WELCOME TO IBF"
      title="Your collaboration journey starts now."
      cta="Complete your profile"
      href={href}
    >
      <p>Hello {name},</p>
      <p>
        Your IBF account is ready. Complete your profile to receive relevant
        project and talent matches.
      </p>
    </BaseEmail>
  );
}
