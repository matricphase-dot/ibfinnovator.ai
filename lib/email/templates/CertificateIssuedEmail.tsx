import { BaseEmail } from "./BaseEmail";
export default function CertificateIssuedEmail({
  name = "IBF member",
  href = "https://innovators-global.com",
}: {
  name?: string;
  href?: string;
}) {
  return (
    <BaseEmail
      eyebrow="CERTIFICATE ISSUED"
      title="Your experience certificate is ready."
      cta="View certificate"
      href={href}
    >
      <p>Hello {name},</p>
      <p>
        A founder issued a verifiable certificate for your project contribution.
      </p>
    </BaseEmail>
  );
}
