import { BaseEmail } from "./BaseEmail";
export default function ApplicationReceivedEmail({
  name = "IBF member",
  href = "https://innovators-global.com",
}: {
  name?: string;
  href?: string;
}) {
  return (
    <BaseEmail
      eyebrow="NEW APPLICATION"
      title="A candidate applied to your project."
      cta="Review application"
      href={href}
    >
      <p>Hello {name},</p>
      <p>
        Review their introduction, skills, availability, and resume before
        updating the application.
      </p>
    </BaseEmail>
  );
}
