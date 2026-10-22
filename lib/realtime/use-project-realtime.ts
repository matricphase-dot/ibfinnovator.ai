"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type RealtimeStatus = "CONNECTING" | "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR";

export interface RealtimeOptions {
  onIssueChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onCommentChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onActivityChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onCycleChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onModuleChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onPageChange?: (payload: RealtimePostgresChangesPayload<any>) => void;
}

/**
 * Hook for Supabase Realtime multi-user live synchronization across IBF Workspace.
 *
 * Supports both signatures:
 * 1. Simple callback: useProjectRealtime(projectId, onIssueChange)
 * 2. Detailed options: useProjectRealtime(projectId, options)
 */
export function useProjectRealtime(
  projectId: string,
  optionsOrHandler?: (() => void) | RealtimeOptions
): { status: RealtimeStatus; isLive: boolean } {
  const [status, setStatus] = useState<RealtimeStatus>("CONNECTING");
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Normalize callbacks
  const callbacksRef = useRef<RealtimeOptions>({});
  useEffect(() => {
    if (typeof optionsOrHandler === "function") {
      callbacksRef.current = {
        onIssueChange: () => optionsOrHandler(),
        onCommentChange: () => optionsOrHandler(),
        onActivityChange: () => optionsOrHandler(),
        onCycleChange: () => optionsOrHandler(),
        onModuleChange: () => optionsOrHandler(),
        onPageChange: () => optionsOrHandler(),
      };
    } else if (optionsOrHandler) {
      callbacksRef.current = optionsOrHandler;
    } else {
      callbacksRef.current = {};
    }
  }, [optionsOrHandler]);

  useEffect(() => {
    if (!projectId) return;

    const supabase = createClient();
    setStatus("CONNECTING");

    // Create unique channel for this project
    const channelName = `project-realtime-${projectId}-${Date.now()}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel
      // 1. Issues Realtime (INSERT, UPDATE, DELETE)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "issues",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          callbacksRef.current.onIssueChange?.(payload);
        }
      )
      // 2. Comments Realtime (INSERT, UPDATE, DELETE)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "issue_comments",
        },
        (payload) => {
          callbacksRef.current.onCommentChange?.(payload);
        }
      )
      // 3. Activities Audit Trail Realtime (INSERT)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "issue_activities",
        },
        (payload) => {
          callbacksRef.current.onActivityChange?.(payload);
        }
      )
      // 4. Cycles Realtime (INSERT, UPDATE, DELETE)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cycles",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          callbacksRef.current.onCycleChange?.(payload);
        }
      )
      // 5. Modules Realtime (INSERT, UPDATE, DELETE)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "modules",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          callbacksRef.current.onModuleChange?.(payload);
        }
      )
      // 6. Documentation Pages Realtime (INSERT, UPDATE, DELETE)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          callbacksRef.current.onPageChange?.(payload);
        }
      )
      .subscribe((subscribeStatus) => {
        if (subscribeStatus === "SUBSCRIBED") {
          setStatus("SUBSCRIBED");
        } else if (subscribeStatus === "TIMED_OUT") {
          setStatus("TIMED_OUT");
        } else if (subscribeStatus === "CLOSED") {
          setStatus("CLOSED");
        } else if (subscribeStatus === "CHANNEL_ERROR") {
          setStatus("CHANNEL_ERROR");
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setStatus("CLOSED");
    };
  }, [projectId]);

  return {
    status,
    isLive: status === "SUBSCRIBED",
  };
}
