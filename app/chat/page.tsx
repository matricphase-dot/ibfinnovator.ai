import { Metadata } from "next";
import AppShell from "@/components/AppShell";
import { ChatWorkspace } from "@/components/chat/chat-workspace";

export const metadata: Metadata = {
  title: "Team Chat | Innovators.ai",
  description: "Real-time team collaboration, channels, and threaded discussions.",
};

export default function ChatPage() {
  return (
    <AppShell>
      <ChatWorkspace />
    </AppShell>
  );
}
