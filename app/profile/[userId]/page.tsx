import type { Metadata } from "next";
import ProfileView from "@/components/ProfileView";
import { supabasePublic } from "@/lib/supabase/public";
const base = "https://innovators-global.com";
async function getProfile(userId: string) {
  const { data } = await supabasePublic
    .from("profiles")
    .select("id,name,username,bio,skills,company")
    .eq("id", userId)
    .maybeSingle();
  return data;
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params,
    p = await getProfile(userId);
  if (!p) return { title: "Profile not found" };
  const description = (p.bio || `${p.name} on IBF`).slice(0, 160);
  return {
    title: p.name,
    description,
    alternates: { canonical: `${base}/profile/${userId}` },
    openGraph: {
      title: p.name,
      description,
      url: `${base}/profile/${userId}`,
      type: "profile",
    },
    twitter: { card: "summary", title: p.name, description },
  };
}
export default async function PublicProfile({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params,
    p = await getProfile(userId),
    jsonLd = p
      ? {
          "@context": "https://schema.org",
          "@type": "Person",
          name: p.name,
          alternateName: p.username ? `@${p.username}` : undefined,
          description: p.bio,
          url: `${base}/profile/${userId}`,
          worksFor: p.company
            ? { "@type": "Organization", name: p.company }
            : undefined,
          knowsAbout: p.skills,
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
      <ProfileView userId={userId} />
    </>
  );
}
