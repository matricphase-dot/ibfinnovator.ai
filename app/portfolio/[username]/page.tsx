import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabasePublic } from "@/lib/supabase/public";
import Link from "next/link";
import { ExternalLink, Sparkles, Building2, GraduationCap, MapPin } from "lucide-react";

interface PortfolioProps {
  params: Promise<{ username: string }>;
}

async function getPortfolioData(username: string) {
  const cleanUsername = username.replace(/^@/, "").toLowerCase();
  const { data: profile } = await supabasePublic
    .from("profiles")
    .select("id, name, full_name, username, role, avatar_url, bio, headline, links, skills, startup_name, startup_stage, education, is_published, company")
    .eq("username", cleanUsername)
    .maybeSingle();

  return profile;
}

export async function generateMetadata({ params }: PortfolioProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPortfolioData(username);
  if (!profile) return { title: "Portfolio Not Found · Innovators" };

  const displayName = profile.full_name || profile.name || profile.username;
  const title = `${displayName} (@${profile.username}) · Portfolio`;
  const description = profile.headline || profile.bio || `Explore the work, startup projects, and skills of ${displayName} on Innovators.`;

  return {
    title,
    description: description.slice(0, 160),
    openGraph: {
      title,
      description: description.slice(0, 160),
      type: "profile",
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description.slice(0, 160),
    },
  };
}

export default async function PortfolioPage({ params }: PortfolioProps) {
  const { username } = await params;
  const profile = await getPortfolioData(username);

  if (!profile) {
    notFound();
  }

  const displayName = profile.full_name || profile.name || profile.username;
  const isFounder = String(profile.role).toLowerCase() === "founder";
  const links = Array.isArray(profile.links) ? profile.links : [];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between selection:bg-cyan-300 selection:text-slate-950">
      {/* Edge navigation bar */}
      <header className="w-full max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="https://innovators-global.com" className="flex items-center gap-2 group">
          <span className="w-7 h-7 rounded-lg bg-cyan-300 grid place-items-center text-slate-950 font-bold text-xs group-hover:rotate-6 transition">
            <Sparkles size={14} />
          </span>
          <span className="font-bold text-sm tracking-tight text-white">innovators.ai</span>
        </Link>
        <Link
          href="/auth/signup"
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-cyan-300/40 hover:text-cyan-300 transition"
        >
          Build your portfolio
        </Link>
      </header>

      {/* Main Portfolio Card */}
      <main className="w-full max-w-xl mx-auto px-6 py-12 flex-1 flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full border-2 border-cyan-300/30 p-1 bg-gradient-to-b from-cyan-300/20 to-transparent">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#101b2c] grid place-items-center text-cyan-300 text-2xl font-black">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          {isFounder ? (
            <span className="absolute bottom-0 right-0 p-1 rounded-full bg-[#070b14] border border-cyan-300/40 text-cyan-300 shadow-sm" title="Startup Founder">
              <Building2 size={14} />
            </span>
          ) : (
            <span className="absolute bottom-0 right-0 p-1 rounded-full bg-[#070b14] border border-violet-400/40 text-violet-300 shadow-sm" title="Student Builder">
              <GraduationCap size={14} />
            </span>
          )}
        </div>

        {/* Identity */}
        <h1 className="text-2xl font-black text-white tracking-tight">{displayName}</h1>
        <p className="text-sm font-medium text-cyan-300/90 mt-1">@{profile.username}</p>

        {/* Role badge */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-slate-300">
          {isFounder ? "Founder & Operator" : "Student & Builder"}
          {profile.startup_name && ` · ${profile.startup_name}`}
        </div>

        {/* Headline / Bio */}
        {(profile.headline || profile.bio) && (
          <p className="text-sm text-slate-400 mt-4 max-w-md leading-relaxed">
            {profile.headline || profile.bio}
          </p>
        )}

        {/* Founder / Student Metadata highlights */}
        <div className="w-full grid grid-cols-2 gap-3 mt-6">
          {profile.startup_stage && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-left">
              <span className="text-[10px] uppercase tracking-wider font-mono text-slate-500">Stage</span>
              <p className="text-xs font-bold text-white mt-0.5">{profile.startup_stage}</p>
            </div>
          )}
          {profile.education && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-left">
              <span className="text-[10px] uppercase tracking-wider font-mono text-slate-500">Education</span>
              <p className="text-xs font-bold text-white mt-0.5 truncate">{profile.education}</p>
            </div>
          )}
        </div>

        {/* Skills Chips */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="w-full mt-6">
            <p className="text-[10px] uppercase tracking-wider font-mono text-slate-500 mb-2">Core Competencies</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {profile.skills.map((skill: string) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-cyan-300/[0.08] border border-cyan-300/20 text-cyan-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Link-in-Bio Stack */}
        <div className="w-full space-y-3 mt-8">
          {links.length > 0 ? (
            links.map((link: any, idx: number) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-cyan-300/40 hover:bg-cyan-300/[0.04] transition flex items-center justify-between group"
              >
                <span className="text-sm font-semibold text-white group-hover:text-cyan-300 transition">
                  {link.title || link.url}
                </span>
                <ExternalLink size={16} className="text-slate-500 group-hover:text-cyan-300 transition" />
              </a>
            ))
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-white/10 text-xs text-slate-500">
              No public bio links added yet.
            </div>
          )}
        </div>
      </main>

      {/* Footer Colophon */}
      <footer className="w-full max-w-3xl mx-auto px-6 py-6 text-center text-xs text-slate-600 border-t border-white/[0.06]">
        Powered by <Link href="https://innovators-global.com" className="text-slate-400 hover:text-white transition">innovators.ai</Link> · Founder & Builder Network
      </footer>
    </div>
  );
}
