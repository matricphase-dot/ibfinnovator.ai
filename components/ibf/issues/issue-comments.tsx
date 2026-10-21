"use client";

import React, { useState, useEffect } from "react";
import { IssueComment } from "@/types/database.types";
import { MessageSquare, Send, Loader2, User } from "lucide-react";

interface IssueCommentsProps {
  issueId: string;
}

export function IssueComments({ issueId }: IssueCommentsProps) {
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function fetchComments() {
      setLoading(true);
      try {
        const res = await fetch(`/api/issues/${issueId}/comments`);
        if (!res.ok) throw new Error("Failed to load comments");
        const data = await res.json();
        if (isMounted) setComments(data || []);
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load discussions");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (issueId) fetchComments();
    return () => {
      isMounted = false;
    };
  }, [issueId]);

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/issues/${issueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_html: newComment.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to post comment");
      }

      const created = await res.json();
      setComments((prev) => [...prev, created]);
      setNewComment("");
    } catch (err: any) {
      setError(err.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
        <MessageSquare size={14} className="text-cyan-400" />
        <span>Discussion ({comments.length})</span>
      </div>

      {loading ? (
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 size={14} className="animate-spin text-cyan-400" />
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 px-4 text-center rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <p className="text-xs text-slate-400">No comments yet.</p>
          <p className="text-[11px] text-slate-600 mt-0.5">Start the discussion below.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => {
            const authorName = comment.actor?.full_name || comment.actor?.name || "Team Member";
            const timeStr = new Date(comment.created_at).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={comment.id}
                className="p-3.5 rounded-xl bg-[#0b101c] border border-white/[0.06] flex flex-col gap-2 hover:border-white/10 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {comment.actor?.avatar_url ? (
                      <img
                        src={comment.actor.avatar_url}
                        alt={authorName}
                        className="w-5 h-5 rounded-full object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-cyan-400/10 text-cyan-300 grid place-items-center text-[10px] font-bold">
                        {authorName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-white">{authorName}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{timeStr}</span>
                </div>
                <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed pl-7">
                  {comment.comment_html}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post comment input */}
      <form onSubmit={handlePostComment} className="flex flex-col gap-2 pt-2">
        {error && <p className="text-[11px] text-rose-400">{error}</p>}
        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment, note, or @mention..."
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#090e18] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400/50 resize-none transition"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handlePostComment(e);
              }
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">Press Cmd+Enter to send</span>
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-300 hover:bg-cyan-200 disabled:opacity-40 disabled:hover:bg-cyan-300 text-slate-950 font-bold text-xs transition"
          >
            {submitting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Send size={13} />
            )}
            Comment
          </button>
        </div>
      </form>
    </div>
  );
}
