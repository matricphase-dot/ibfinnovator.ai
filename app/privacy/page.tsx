import type { Metadata } from "next";
import PrivacyPolicyClient from "./privacy-client";

export const metadata: Metadata = {
  title: "Privacy Policy · The Innovators (IBF)",
  description:
    "The official Privacy Policy for The Innovators (Innovator Bridge Foundry). Comprehensive data protection disclosures covering GDPR, UK GDPR, California CCPA/CPRA, India DPDP Act 2023, cookie governance, and self-service account erasure.",
  alternates: {
    canonical: "https://innovators-global.com/privacy",
  },
  openGraph: {
    title: "Privacy Policy · The Innovators (IBF)",
    description:
      "Comprehensive data protection and privacy specification for The Innovators platform. Built with transparency, zero ad brokerage, and self-service data sovereignty.",
    url: "https://innovators-global.com/privacy",
    siteName: "The Innovators · Innovator Bridge Foundry",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy · The Innovators (IBF)",
    description:
      "Comprehensive privacy and data protection charter for The Innovators platform.",
  },
};

export default function PrivacyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Privacy Policy",
    url: "https://innovators-global.com/privacy",
    description:
      "Statutory privacy policy and data stewardship disclosures for The Innovators (Innovator Bridge Foundry).",
    publisher: {
      "@type": "Organization",
      name: "Innovator Bridge Foundry, Inc.",
      url: "https://innovators-global.com",
      logo: "https://innovators-global.com/icons/icon-512.png",
    },
    inLanguage: "en-US",
    datePublished: "2026-01-15T00:00:00Z",
    dateModified: "2026-10-21T00:00:00Z",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PrivacyPolicyClient />
    </>
  );
}
