"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Hash,
  Lock,
  Plus,
  Search,
  MessageSquare,
  Users,
  Compass,
  FolderKanban,
  X,
  Loader2,
} from "lucide-react";

export interface Channel {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  member_count?: number;
  is_member?: boolean;
}

export interface DirectMessagePeer {
  connection_id: string;
  project_id: string;
  project_title?: string;
  peer: {
    id: string;
    name: string;
    username?: string;
    avatar_url?: string;
    last_seen_at?: string;
  };
}

interface ChannelSidebarProps {
  workspaceName?: string;
  channels: Channel[];
  directMessages?: DirectMessagePeer[];
  activeChannelId?: string;
  currentUserId?: string;
  onSelectChannel: (channelId: string) => void;
  onCreateChannel: (data: {
    name: string;
    description: string;
    is_private: boolean;
  }) => Promise<Channel | null>;
  unreadCounts?: Record<string, number>;
}

export function ChannelSidebar({
  workspaceName = "IBF Community",
  channels,
  directMessages = [],
  activeChannelId,
  currentUserId,
  onSelectChannel,
  onCreateChannel,
  unreadCounts = {},
}: ChannelSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    const formattedName = newChannelName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "");

    if (formattedName.length < 2) {
      setCreateError("Channel name must be at least 2 characters");
      return;
    }

    setIsCreating(true);
    try {
      const created = await onCreateChannel({
        name: formattedName,
        description: newChannelDesc.trim(),
        is_private: isPrivate,
      });

      if (created) {
        setShowCreateModal(false);
        setNewChannelName("");
        setNewChannelDesc("");
        setIsPrivate(false);
        onSelectChannel(created.id);
      } else {
        setCreateError("Failed to create channel");
      }
    } catch (err: any) {
      setCreateError(err.message || "Failed to create channel");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <aside className="w-64 md:w-72 h-full flex flex-col bg-slate-950 border-r border-slate-800/80 shrink-0 select-none">
      {/* Workspace Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-md">
            IB
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-100 truncate">
              {workspaceName}
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-400 font-mono">Live Workspace</span>
            </div>
          </div>
        </div>

        {/* Link to Project Management workspace */}
        <Link
          href="/dashboard"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title="Go to Dashboard / Projects"
        >
          <FolderKanban size={16} />
        </Link>
      </div>

      {/* Search Filter Bar */}
      <div className="p-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Jump to channel..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Channels List Section */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-6">
        <div>
          <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            <span>Channels</span>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Create Channel"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="mt-1 space-y-0.5">
            {filteredChannels.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-500 italic">No channels found</p>
            ) : (
              filteredChannels.map((channel) => {
                const isActive = channel.id === activeChannelId;
                const unread = unreadCounts[channel.id] || 0;

                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => onSelectChannel(channel.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left group ${
                      isActive
                        ? "bg-cyan-500/15 text-cyan-300 font-semibold shadow-sm"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
                    }`}
                  >
                    {channel.is_private ? (
                      <Lock
                        size={14}
                        className={`shrink-0 ${
                          isActive ? "text-cyan-300" : "text-slate-500 group-hover:text-slate-400"
                        }`}
                      />
                    ) : (
                      <Hash
                        size={14}
                        className={`shrink-0 ${
                          isActive ? "text-cyan-300" : "text-slate-500 group-hover:text-slate-400"
                        }`}
                      />
                    )}
                    <span className="truncate flex-1">{channel.name}</span>
                    {unread > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 font-bold text-[10px]">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Direct Messages Section */}
        {directMessages.length > 0 && (
          <div>
            <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              <span>Direct Messages</span>
            </div>

            <div className="mt-1 space-y-0.5">
              {directMessages.map((dm) => (
                <Link
                  key={dm.connection_id}
                  href={`/chat/direct/${dm.project_id}`}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors group"
                >
                  <div className="relative shrink-0">
                    {dm.peer.avatar_url ? (
                      <Image
                        src={dm.peer.avatar_url}
                        alt={dm.peer.name}
                        width={20}
                        height={20}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center text-[10px] font-bold">
                        {dm.peer.name?.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-slate-950" />
                  </div>
                  <span className="truncate flex-1">{dm.peer.name}</span>
                  {dm.project_title && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                      {dm.project_title}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Hash size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">Create Channel</h3>
                <p className="text-xs text-slate-400">
                  Channels are where conversations happen.
                </p>
              </div>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Channel Name
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                    #
                  </span>
                  <input
                    type="text"
                    required
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="e.g. product-launch"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Lowercase letters, numbers, and dashes only.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="What is this channel about?"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 resize-none"
                />
              </div>

              {/* Private Channel Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Lock size={16} className="text-slate-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      Make Private
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Only invited members can view this channel
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newChannelName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isCreating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Create Channel"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
