"use client";
import AppShell from "@/components/AppShell";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Check,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import FileUploader from "@/components/FileUploader";
import type { UploadedFile } from "@/lib/upload";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
type Tab = "profile" | "notifications" | "security";
export default function Settings() {
  const [p, setP] = useState<any>(null),
    [tab, setTab] = useState<Tab>("profile"),
    [saving, setSaving] = useState(false),
    [show, setShow] = useState(false),
    [investor, setInvestor] = useState({ visible: false, pitch: "" }),
    [prefs, setPrefs] = useState({
      connection: true,
      messages: true,
      matches: true,
      milestones: true,
      email: true,
    });
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(setP);
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        const x = data.user?.user_metadata?.notifications;
        if (x) setPrefs({ ...prefs, ...x });
      });
  }, []);
  // Seed the investor controls once the profile arrives.
  useEffect(() => {
    if (!p?.id) return;
    setInvestor({
      visible: Boolean(p.investor_visible),
      pitch: p.investor_pitch ?? "",
    });
  }, [p?.id]);
  const investorWords = investor.pitch.trim().split(/\s+/).filter(Boolean).length;
  const initials =
    p?.name
      ?.split(" ")
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "IB";

  async function saveAvatar(files: UploadedFile[]) {
    const file = files[0];
    if (!file) return;
    setP((prev: any) => ({ ...prev, avatar_url: file.url }));
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ avatar_url: file.url }),
    });
    response.ok
      ? toast.success("Profile photo updated")
      : toast.error("Could not save your photo");
  }

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const f = new FormData(e.currentTarget);
    const body = {
      name: f.get("name"),
      bio: f.get("bio"),
      availability: f.get("availability"),
      skills: String(f.get("skills"))
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      interests: String(f.get("interests"))
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    };
    const r = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    r.ok
      ? toast.success("Profile settings saved")
      : toast.error("Could not save settings");
  }
  async function saveInvestor() {
    if (investor.visible && investorWords < 50) {
      toast.error("Write at least 50 words before making your pitch visible.");
      return;
    }
    setSaving(true);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        investor_visible: investor.visible,
        investor_pitch: investor.pitch.trim() || null,
      }),
    });
    setSaving(false);
    if (response.ok) {
      const saved = await response.json();
      setP((prev: any) => ({ ...prev, ...saved }));
      toast.success("Investor settings saved");
    } else {
      const payload = await response.json().catch(() => ({}));
      toast.error(
        typeof payload.error === "string"
          ? payload.error
          : "Could not save investor settings",
      );
    }
  }

  async function saveNotifications() {
    setSaving(true);
    const s = createClient();
    const { error } = await s.auth.updateUser({
      data: { notifications: prefs },
    });
    setSaving(false);
    error
      ? toast.error(error.message)
      : toast.success("Notification preferences saved");
  }
  async function changePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      a = String(f.get("password")),
      b = String(f.get("confirm"));
    if (a.length < 8)
      return toast.error("Password must be at least 8 characters");
    if (a !== b) return toast.error("Passwords do not match");
    setSaving(true);
    const { error } = await createClient().auth.updateUser({ password: a });
    setSaving(false);
    error
      ? toast.error(error.message)
      : (toast.success("Password updated"), e.currentTarget.reset());
  }
  async function logout() {
    await createClient().auth.signOut();
    location.href = "/";
  }
  async function deleteAccount() {
    if (
      !confirm(
        "Permanently delete your IBF account and all associated data? This cannot be undone.",
      )
    )
      return;
    const r = await fetch("/api/account", { method: "DELETE" });
    if (r.ok) {
      await createClient().auth.signOut();
      location.href = "/";
    } else toast.error("Account deletion failed");
  }
  const tabs: [[Tab, any, string], [Tab, any, string], [Tab, any, string]] = [
    ["profile", UserRound, "Profile"],
    ["notifications", Bell, "Notifications"],
    ["security", Lock, "Security"],
  ];
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-5 md:p-8">
        <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
          ACCOUNT CONTROL
        </p>
        <h1 className="text-3xl font-black mt-2">Settings</h1>
        {p?.onboarding_completed === false && (
          <Link
            href="/auth/complete-onboarding"
            className="flex flex-wrap items-center gap-3 mt-6 rounded-2xl border border-cyan-300/30 bg-cyan-300/[.07] px-5 py-4"
          >
            <Sparkles size={18} className="text-cyan-300" />
            <span className="text-sm font-bold text-cyan-100">
              Finish your onboarding to unlock full matching
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-black text-cyan-300">
              Continue <ArrowRight size={14} />
            </span>
          </Link>
        )}
        <div className="grid md:grid-cols-[190px_1fr] gap-6 mt-8">
          <aside className="space-y-1">
            {tabs.map(([id, I, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`sidebar-link w-full ${tab === id ? "active" : ""}`}
              >
                <I size={17} />
                {label}
              </button>
            ))}
          </aside>
          {tab === "profile" && (
            <form
              onSubmit={saveProfile}
              className="bg-white border border-slate-200 rounded-2xl p-6"
            >
              <h2 className="font-bold text-lg">Profile preferences</h2>
              <p className="text-sm text-slate-500 mt-1">
                These details are used by matching and public discovery.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-6">
                {p?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.avatar_url}
                    alt="Your profile photo"
                    className="w-20 h-20 rounded-2xl object-cover border border-slate-200"
                  />
                ) : (
                  <span className="w-20 h-20 rounded-2xl bg-[#101b2c] text-cyan-300 text-xl font-black grid place-items-center">
                    {initials}
                  </span>
                )}
                <div className="min-w-[240px] flex-1">
                  <FileUploader
                    bucket="avatars"
                    maxFiles={1}
                    accept="image/png,image/jpeg,image/webp"
                    label="Upload a profile photo"
                    hint="PNG, JPEG or WebP up to 2 MB"
                    onChange={(files) => void saveAvatar(files)}
                  />
                </div>
              </div>
              <label className="block text-sm font-bold mt-6">
                Display name
                <input
                  name="name"
                  defaultValue={p?.name || ""}
                  className="field mt-2"
                />
              </label>
              <label className="block text-sm font-bold mt-4">
                Bio
                <textarea
                  name="bio"
                  defaultValue={p?.bio || ""}
                  className="field mt-2 min-h-24"
                />
              </label>
              <label className="block text-sm font-bold mt-4">
                Skills
                <input
                  name="skills"
                  defaultValue={p?.skills?.join(", ") || ""}
                  className="field mt-2"
                  placeholder="React, Finance, Product Design"
                />
              </label>
              <label className="block text-sm font-bold mt-4">
                Interests
                <input
                  name="interests"
                  defaultValue={p?.interests?.join(", ") || ""}
                  className="field mt-2"
                  placeholder="FinTech, Climate Tech"
                />
              </label>
              <label className="block text-sm font-bold mt-4">
                Availability
                <input
                  name="availability"
                  defaultValue={p?.availability || ""}
                  className="field mt-2"
                />
              </label>
              <div className="flex gap-3 mt-6">
                <button disabled={saving} className="btn btn-primary">
                  <Save size={16} />
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="btn btn-secondary ml-auto text-red-300"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </form>
          )}
          {tab === "profile" && p?.role === "FOUNDER" && (
            <section className="bg-white border border-slate-200 rounded-2xl p-6 mt-5">
              <h2 className="font-bold text-lg">Investor visibility</h2>
              <p className="text-sm text-slate-500 mt-1">
                Opt in to the investor directory. Investors see your name, company,
                industry, pitch and open projects — never your email.
              </p>

              <button
                type="button"
                onClick={() =>
                  setInvestor((prev) => ({ ...prev, visible: !prev.visible }))
                }
                aria-pressed={investor.visible}
                className={`mt-5 pill border ${
                  investor.visible
                    ? "bg-cyan-300 text-slate-950 border-cyan-300"
                    : "bg-white/5 text-slate-400 border-white/10"
                }`}
              >
                {investor.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                {investor.visible ? "Visible to investors" : "Hidden from investors"}
              </button>

              <label className="block text-sm font-bold mt-5">
                Your pitch
                <textarea
                  value={investor.pitch}
                  onChange={(event) =>
                    setInvestor((prev) => ({ ...prev, pitch: event.target.value }))
                  }
                  className="field mt-2 font-normal min-h-40"
                  placeholder="What you are building, the market, traction so far, and what you want from an investor."
                  maxLength={4000}
                />
              </label>
              <p
                className={`text-[11px] mt-2 ${
                  investorWords >= 50 ? "text-cyan-300" : "text-slate-500"
                }`}
              >
                {investorWords} / 50 words minimum
              </p>

              <button
                type="button"
                onClick={() => void saveInvestor()}
                disabled={saving}
                className="btn btn-primary mt-5 disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? "Saving…" : "Save investor settings"}
              </button>
            </section>
          )}
          {tab === "notifications" && (
            <section className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="font-bold text-lg">Notification preferences</h2>
              <p className="text-sm text-slate-500 mt-1">
                Choose which updates should reach you.
              </p>
              <div className="mt-6 divide-y divide-white/[.07]">
                {(
                  [
                    [
                      "connection",
                      "Connection requests",
                      "When someone wants to collaborate with you",
                    ],
                    [
                      "messages",
                      "Direct messages",
                      "New private and team-room messages",
                    ],
                    [
                      "matches",
                      "New strong matches",
                      "Projects or talent above your match threshold",
                    ],
                    [
                      "milestones",
                      "Milestone updates",
                      "Assignments, due dates and completion updates",
                    ],
                    [
                      "email",
                      "Email summaries",
                      "Receive important activity by email",
                    ],
                  ] as const
                ).map(([id, title, desc]) => (
                  <label
                    className="flex items-center gap-4 py-4 cursor-pointer"
                    key={id}
                  >
                    <span
                      className={`h-10 w-10 rounded-xl grid place-items-center ${prefs[id] ? "bg-cyan-300/10 text-cyan-300" : "bg-white/5 text-slate-600"}`}
                    >
                      <Bell size={17} />
                    </span>
                    <span>
                      <b className="text-sm text-white">{title}</b>
                      <p className="text-xs text-slate-500 mt-1">{desc}</p>
                    </span>
                    <button
                      type="button"
                      onClick={() => setPrefs({ ...prefs, [id]: !prefs[id] })}
                      className={`ml-auto w-11 h-6 p-1 rounded-full transition ${prefs[id] ? "bg-cyan-300" : "bg-slate-700"}`}
                    >
                      <i
                        className={`block h-4 w-4 bg-white rounded-full transition ${prefs[id] ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </button>
                  </label>
                ))}
              </div>
              <button
                onClick={saveNotifications}
                disabled={saving}
                className="btn btn-primary mt-6"
              >
                <Save size={16} />
                {saving ? "Saving…" : "Save preferences"}
              </button>
            </section>
          )}
          {tab === "security" && (
            <section className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-start">
                <span className="h-11 w-11 rounded-xl bg-cyan-300/10 text-cyan-300 grid place-items-center">
                  <ShieldCheck />
                </span>
                <div className="ml-3">
                  <h2 className="font-bold text-lg">Password and security</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Update the password for your Supabase account.
                  </p>
                </div>
              </div>
              <form onSubmit={changePassword} className="mt-6">
                <label className="block text-sm font-bold">
                  New password
                  <div className="relative mt-2">
                    <input
                      name="password"
                      required
                      minLength={8}
                      type={show ? "text" : "password"}
                      className="field pr-12"
                      placeholder="At least 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute right-3 top-3 text-slate-500"
                    >
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
                <label className="block text-sm font-bold mt-4">
                  Confirm new password
                  <input
                    name="confirm"
                    required
                    minLength={8}
                    type={show ? "text" : "password"}
                    className="field mt-2"
                  />
                </label>
                <button disabled={saving} className="btn btn-primary mt-6">
                  <Lock size={16} />
                  {saving ? "Updating…" : "Update password"}
                </button>
              </form>
              <div className="mt-8 pt-6 border-t border-white/[.07]">
                <b className="text-sm">Active session</b>
                <p className="text-xs text-slate-500 mt-2">
                  Sign out from this browser when using a shared device.
                </p>
                <button
                  onClick={logout}
                  className="btn btn-secondary text-red-300 mt-4"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
              <div className="mt-8 pt-6 border-t border-white/[.07]">
                <b className="text-sm">Privacy and your data</b>
                <p className="text-xs text-slate-500 mt-2">
                  Download a portable copy of your IBF information or
                  permanently delete your account.
                </p>
                <div className="flex gap-2 mt-4">
                  <a href="/api/account" className="btn btn-secondary">
                    Download my data
                  </a>
                  <button
                    onClick={deleteAccount}
                    className="btn btn-secondary text-red-300"
                  >
                    Delete account
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
