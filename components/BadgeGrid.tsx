"use client";
import { Award, ChevronDown, Linkedin } from "lucide-react";
import { useState } from "react";
export default function BadgeGrid({ badges = [] }: { badges: any[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!badges.length)
    return (
      <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl">
        <Award className="mx-auto text-slate-600" />
        <p className="text-sm text-slate-500 mt-3">No badges earned yet.</p>
      </div>
    );
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {badges.map((x) => (
        <article className="project-cyber-card" key={x.id}>
          <span className="feature-icon">
            <Award />
          </span>
          <h3 className="font-bold mt-4">{x.badge?.name}</h3>
          <p className="text-xs text-cyan-300 mt-1">{x.project?.title}</p>
          <p
            className={`text-sm text-slate-400 mt-3 ${open === x.id ? "" : "line-clamp-2"}`}
          >
            {x.evidence}
          </p>
          <p className="text-[10px] text-slate-600 mt-3">
            {new Date(x.created_at).toLocaleDateString()}
          </p>
          <div className="flex mt-3">
            <button
              onClick={() => setOpen(open === x.id ? null : x.id)}
              className="text-xs text-cyan-300"
            >
              Evidence <ChevronDown size={12} className="inline" />
            </button>
            <a
              target="_blank"
              rel="noreferrer"
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent((process.env.NEXT_PUBLIC_APP_URL || "https://innovators-global.com") + "/profile/" + x.receiver_id)}`}
              className="ml-auto text-xs text-[#0a66c2]"
            >
              <Linkedin size={14} />
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
