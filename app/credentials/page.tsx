"use client";
import AppShell from "@/components/AppShell";
import { Loader2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import BadgeGrid from "@/components/BadgeGrid";
import CertificateCard from "@/components/CertificateCard";
type Tab = "Badges" | "Certificates" | "Reviews received";
export default function Credentials() {
  const [data, setData] = useState<any>({
      badges: [],
      certificates: [],
      reviews: [],
    }),
    [loading, setLoading] = useState(true),
    [tab, setTab] = useState<Tab>("Badges");
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => fetch(`/api/users/${p.id}`).then((r) => r.json()))
      .then((p) =>
        setData({
          badges: p.badges || [],
          certificates: p.certificates || [],
          reviews: p.reviews || [],
        }),
      )
      .finally(() => setLoading(false));
  }, []);
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto p-5 md:p-8">
        <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
          VERIFIED EXPERIENCE
        </p>
        <h1 className="text-3xl font-black mt-2">Credentials</h1>
        <p className="text-slate-500 mt-2">
          Portable proof earned through real startup contributions.
        </p>
        <div className="flex gap-2 mt-7">
          {(["Badges", "Certificates", "Reviews received"] as Tab[]).map(
            (x) => (
              <button
                onClick={() => setTab(x)}
                className={`pill ${tab === x ? "bg-slate-900" : "bg-white border border-slate-200"}`}
                key={x}
              >
                {x}
              </button>
            ),
          )}
        </div>
        {loading ? (
          <Loader2 className="animate-spin text-cyan-300 mx-auto mt-28" />
        ) : (
          <div className="mt-6">
            {tab === "Badges" && <BadgeGrid badges={data.badges} />}{" "}
            {tab === "Certificates" &&
              (data.certificates.length ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {data.certificates.map((c: any) => (
                    <CertificateCard certificate={c} key={c.id} />
                  ))}
                </div>
              ) : (
                <Empty text="No certificates yet." />
              ))}
            {tab === "Reviews received" &&
              (data.reviews.length ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {data.reviews.map((r: any) => (
                    <article className="project-cyber-card" key={r.id}>
                      <div className="flex text-amber-300">
                        {[1, 2, 3, 4, 5].map((x) => (
                          <Star
                            key={x}
                            size={14}
                            fill={x <= r.rating ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-slate-400 mt-4">{r.comment}</p>
                      <p className="text-xs text-slate-500 mt-3">
                        {r.project?.title} · {r.reviewer?.name}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty text="No reviews received yet." />
              ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl text-slate-500">
      {text}
    </div>
  );
}
