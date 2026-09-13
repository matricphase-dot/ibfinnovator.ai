import type { Metadata } from "next";
import { supabasePublic } from "@/lib/supabase/public";
import ProjectDetailClient from "@/components/ProjectDetailClient";
const base = "https://innovators-global.com";
async function getProject(id: string) {
  const { data } = await supabasePublic
    .from("projects")
    .select(
      "id,title,description,created_at,domain,founder:profiles!founder_id(name,company)",
    )
    .eq("id", id)
    .maybeSingle();
  return data as any;
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params,
    p = await getProject(id);
  if (!p) return { title: "Project not found" };
  const description = String(p.description).slice(0, 160);
  return {
    title: p.title,
    description,
    alternates: { canonical: `${base}/projects/${id}` },
    openGraph: {
      title: p.title,
      description,
      url: `${base}/projects/${id}`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: p.title, description },
  };
}
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    p = await getProject(id);
  const founder = Array.isArray(p?.founder) ? p.founder[0] : p?.founder;
  const jsonLd = p
    ? {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: p.title,
        description: p.description,
        datePosted: p.created_at,
        employmentType: "OTHER",
        jobLocationType: "TELECOMMUTE",
        hiringOrganization: {
          "@type": "Organization",
          name: founder?.company || founder?.name || "IBF Founder",
        },
        identifier: {
          "@type": "PropertyValue",
          name: "IBF Project",
          value: p.id,
        },
      }
    : null;
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <ProjectDetailClient />
    </>
  );
}
