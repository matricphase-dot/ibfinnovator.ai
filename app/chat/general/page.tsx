"use client";

import AppShell from "@/components/AppShell";
import ChatRoom from "@/components/ChatRoom";
import { Users } from "lucide-react";

export default function Chat() {
  return (
    <AppShell>
      <ChatRoom
        mode="GENERAL"
        title="IBF Community"
        subtitle="Community room"
        emptyText="Start the first community conversation."
        headerIcon={
          <span className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 grid place-items-center shrink-0">
            <Users size={20} />
          </span>
        }
        aside={
          <aside className="hidden xl:block w-72 border-l border-white/[.07] bg-white p-5">
            <b className="text-sm">Community guidelines</b>
            <p className="text-xs text-slate-500 leading-5 mt-3">
              Be generous with context. Keep feedback constructive. Never share
              secrets, passwords or private customer data.
            </p>
            <h3 className="text-xs font-black tracking-widest text-slate-500 mt-8">
              CHANNEL PURPOSE
            </h3>
            <p className="text-sm text-slate-400 mt-4">
              Introductions, collaboration requests, product feedback and
              ecosystem questions.
            </p>
          </aside>
        }
      />
    </AppShell>
  );
}
