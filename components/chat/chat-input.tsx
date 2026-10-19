"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Smile,
  Bold,
  Italic,
  Code,
  X,
  FileText,
  Loader2,
} from "lucide-react";
import FileUploader, { type UploadedFile } from "@/components/FileUploader";

interface ChatInputProps {
  placeholder?: string;
  onSendMessage: (content: string, attachments: string[]) => Promise<boolean>;
  onTyping?: () => void;
  userId?: string;
  disabled?: boolean;
}

const COMMON_PICKER_EMOJIS = [
  "😀", "😂", "🚀", "🔥", "👍", "❤️", "🎉", "👀",
  "💯", "👏", "💡", "🙌", "✨", "🤝", "💪", "⚡"
];

export function ChatInput({
  placeholder = "Write a message…",
  onSendMessage,
  onTyping,
  userId,
  disabled = false,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const nextHeight = Math.min(el.scrollHeight, 180);
    el.style.height = `${Math.max(nextHeight, 40)}px`;
  }, [text]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if ((!trimmed && files.length === 0) || isSending || disabled) return;

    setIsSending(true);
    const attachmentUrls = files.map((f) => f.url);
    const success = await onSendMessage(trimmed, attachmentUrls);

    if (success) {
      setText("");
      setFiles([]);
      setShowUploader(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = "40px";
      }
    }
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const insertFormat = (before: string, after: string = before) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = text.slice(start, end);
    const newText = text.slice(0, start) + before + sel + after + text.slice(end);
    setText(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setText((t) => t + emoji);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setText(newText);
    setShowEmojiPicker(false);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="relative border border-slate-700/80 bg-slate-900/90 rounded-2xl shadow-lg transition-all focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/30">
      {/* File Upload Section Drawer */}
      {showUploader && userId && (
        <div className="p-3 border-b border-slate-800 bg-slate-950/60 rounded-t-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">
              Attach files or images
            </span>
            <button
              type="button"
              onClick={() => setShowUploader(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X size={14} />
            </button>
          </div>
          <FileUploader
            bucket="project-files"
            folderKey={userId}
            multiple
            onUploaded={(uploaded) => {
              setFiles((prev) => [...prev, ...uploaded]);
              setShowUploader(false);
            }}
            label="Upload images, documents, or files"
          />
        </div>
      )}

      {/* Uploaded File Pills Preview */}
      {files.length > 0 && (
        <div className="px-3 pt-2.5 flex flex-wrap gap-2">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200"
            >
              <FileText size={13} className="text-cyan-400 shrink-0" />
              <span className="truncate max-w-[150px] font-medium">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="text-slate-400 hover:text-red-400 ml-1"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Textarea */}
      <div className="px-3 pt-2.5 pb-1">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (onTyping) onTyping();
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSending}
          rows={1}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none leading-relaxed"
        />
      </div>

      {/* Bottom Actions Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-slate-800/80">
        <div className="flex items-center space-x-1 text-slate-400">
          {/* Markdown Formatting Helpers */}
          <button
            type="button"
            onClick={() => insertFormat("**")}
            className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Bold (**text**)"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertFormat("*")}
            className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Italic (*text*)"
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            onClick={() => insertFormat("`")}
            className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Inline Code (`code`)"
          >
            <Code size={14} />
          </button>

          <span className="h-4 w-[1px] bg-slate-800 mx-1" />

          {/* Attachment Toggle */}
          <button
            type="button"
            onClick={() => setShowUploader(!showUploader)}
            className={`p-1.5 rounded transition-colors ${
              showUploader || files.length > 0
                ? "text-cyan-400 bg-cyan-500/10"
                : "hover:text-slate-200 hover:bg-slate-800"
            }`}
            title="Attach file"
          >
            <Paperclip size={14} />
          </button>

          {/* Emoji Picker Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Add emoji"
            >
              <Smile size={14} />
            </button>

            {showEmojiPicker && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowEmojiPicker(false)}
                />
                <div className="absolute left-0 bottom-full mb-2 z-50 p-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl grid grid-cols-4 gap-1 w-48">
                  {COMMON_PICKER_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => insertEmoji(e)}
                      className="p-2 text-lg hover:scale-125 transition-transform hover:bg-slate-800 rounded-lg text-center"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right side: Character info & Send Button */}
        <div className="flex items-center gap-2">
          {text.length > 4000 && (
            <span
              className={`text-[10px] font-mono ${
                text.length > 4900 ? "text-red-400" : "text-amber-400"
              }`}
            >
              {5000 - text.length} left
            </span>
          )}

          <button
            type="button"
            onClick={handleSend}
            disabled={(!text.trim() && files.length === 0) || isSending || disabled}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed shadow transition-all active:scale-95"
            title="Send message (Enter)"
          >
            {isSending ? (
              <Loader2 size={14} className="animate-spin text-slate-950" />
            ) : (
              <Send size={14} className="text-slate-950 font-bold" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
