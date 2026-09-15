"use client";

import AppShell from "@/components/AppShell";
import ChatRoom from "@/components/ChatRoom";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function DirectChat() {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) return null;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto border-x border-white/[.07]">
        <ChatRoom
          mode="DIRECT"
          projectId={projectId}
          title="Project conversation"
          subtitle="Accepted collaborators only"
          emptyText="Send the first message to your collaborator."
          backHref="/dashboard"
          headerIcon={
            <Link
              href="/dashboard"
              aria-label="Back to dashboard"
              className="p-2 text-slate-400 hover:text-[#00f5d4] transition shrink-0"
            >
              <ArrowLeft />
            </Link>
          }
        />
      </div>
    </AppShell>
  );
}
