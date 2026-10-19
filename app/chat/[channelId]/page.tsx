import { Metadata } from "next";
import AppShell from "@/components/AppShell";
import { ChatWorkspace } from "@/components/chat/chat-workspace";

export const metadata: Metadata = {
  title: "Channel Chat | Innovators.ai",
  description: "Real-time team chat and threaded collaboration.",
};

export default async function ChannelChatPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;

  return (
    <AppShell>
      <ChatWorkspace initialChannelId={channelId} />
    </AppShell>
  );
}
