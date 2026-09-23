"use client";
import AppShell from "@/components/AppShell";
import {
  Bell,
  Check,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useClerk, useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import FileUploader from "@/components/FileUploader";
type Tab = "profile" | "notifications" | "security" | "investor";
export default function Settings() {
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const [p, setP] = useState<any>(null),
    [tab, setTab] = useState<Tab>("profile"),
    [saving, setSaving] = useState(false),
    [usernameError, setUsernameError] = useState(""),
    [show, setShow] = useState(false),
    [prefs, setPrefs] = useState({
      connection: true,
      messages: true,
      matches: true,
      milestones: true,
      email: true,
    });
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((x) => {
        // ROOT FIX: 401 {error} must not become profile (was: p.name.slice crash).
        if (!x || x.error || !x.id) {
          window.location.assign("/auth/signin?next=/settings");
          return;
        }
        setP(x);
        if (x?.email_opt_in !== undefined)
          setPrefs((v) => ({ ...v, email: x.email_opt_in }));
      });
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        const x = data.user?.user_metadata?.notifications;
        // ROOT FIX: functional update (was: stale prefs closure drops email opt-in).
        if (x) setPrefs((v) => ({ ...v, ...x }));
      });
  }, []);
  async function saveAvatar(url: string) {
    const r = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ avatar_url: url }),
    });
    if (r.ok) {
      setP(await r.json());
      toast.success("Avatar updated");
    } else toast.error("Could not update avatar");
  }
  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUsernameError("");
    const f = new FormData(e.currentTarget);
    const username = String(f.get("username") || "")
      .trim()
      .toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      setUsernameError("Use 3–30 lowercase letters, numbers, or underscores.");
      return;
    }
    setSaving(true);
    const body = {
      name: f.get("name"),
      username,
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
    const result = await r.json().catch(() => ({}));
    setSaving(false);
    if (r.status === 409) {
      setUsernameError("Username already taken");
      return;
    }
    r.ok
      ? (setP(result), toast.success("Profile settings saved"))
      : toast.error(result.error || "Could not save settings");
  }
  async function saveNotifications() {
    setSaving(true);
    const r = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email_opt_in: prefs.email }),
      }),
      d = await r.json();
    setSaving(false);
    r.ok
      ? (setP(d), toast.success("Notification preferences saved"))
      : toast.error(d.error || "Could not save preferences");
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
  async function saveInvestor(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      visible = f.get("investor_visible") === "on",
      pitch = String(f.get("investor_pitch") || "");
    const r = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          investor_visible: visible,
          investor_pitch: pitch,
        }),
      }),
      d = await r.json();
    if (r.ok) {
      setP(d);
      toast.success("Investor visibility updated");
    } else toast.error(d.error || "Could not update visibility");
  }
  async function logout() {
    if (clerkUser) await signOut({ redirectUrl: "/" });
    else {
      await createClient().auth.signOut();
      location.href = "/";
    }
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
      if (clerkUser) await signOut({ redirectUrl: "/" });
      else {
        await createClient().auth.signOut();
        location.href = "/";
      }
    } else toast.error("Account deletion failed");
  }
  const tabs: Array<[Tab, any, string]> = [
    ["profile", UserRound, "Profile"],
    ["notifications", Bell, "Notifications"],
    ["security", Lock, "Security"],
    ["investor", Eye, "Investor Visibility"],
  ];
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-5 md:p-8">
        <p className="text-[10px] tracking-[.2em] text-cyan-300 font-bold">
          ACCOUNT CONTROL
        </p>
        <h1 className="text-3xl font-black mt-2">Settings</h1>
        {p && !p.onboarding_completed && (
          <div className="mt-6 p-4 rounded-2xl border border-amber-300/20 bg-amber-300/[.06] flex items-center gap-4">
            <div>
              <b className="text-amber-200">Finish your onboarding</b>
              <p className="text-sm text-slate-500 mt-1">
                Complete your profile to unlock accurate matching and
                collaboration tools.
              </p>
            </div>
            <a
              href="/auth/complete-onboarding"
              className="btn btn-primary ml-auto"
            >
              Complete now
            </a>
          </div>
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
              {p?.id && (
                <div className="mt-6 grid sm:grid-cols-[90px_1fr] gap-4 items-start">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-cyan-300/10 text-cyan-300 grid place-items-center font-black">
                    {p.avatar_url ? (
                      <img
                        src={p.avatar_url}
                        alt="Current avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (p.name || "IB").slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <FileUploader
                    bucket="avatars"
                    folderKey={p.id}
                    maxMB={2}
                    onUploaded={(files) => files[0] && saveAvatar(files[0].url)}
                    label="Upload profile image"
                  />
                </div>
              )}
              <label className="block text-sm font-bold mt-6">
                Display name
                <input
                  name="name"
                  defaultValue={p?.name || ""}
                  className="field mt-2"
                />
              </label>
              <label className="block text-sm font-bold mt-4">
                Username
                <input
                  name="username"
                  defaultValue={p?.username || ""}
                  onChange={(e) => {
                    e.currentTarget.value = e.currentTarget.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_]/g, "");
                    setUsernameError("");
                  }}
                  minLength={3}
                  maxLength={30}
                  pattern="[a-z0-9_]{3,30}"
                  className="field mt-2"
                  placeholder="your_username"
                />
                {usernameError && (
                  <span className="block text-xs text-red-300 mt-2">
                    {usernameError}
                  </span>
                )}
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
          {tab === "investor" && (
            <form
              onSubmit={saveInvestor}
              className="bg-white border border-slate-200 rounded-2xl p-6"
            >
              <h2 className="font-bold text-lg">Investor Visibility</h2>
              <p className="text-sm text-slate-500 mt-1">
                Let verified investors discover your founder profile without
                exposing contact details.
              </p>
              <label className="flex items-center gap-3 mt-6">
                <input
                  type="checkbox"
                  name="investor_visible"
                  defaultChecked={p?.investor_visible}
                  className="w-5 h-5 accent-cyan-300"
                />
                <span>
                  <b className="text-sm">Open to investor conversations</b>
                  <small className="block text-slate-500">
                    Your name, username, company, stage, and pitch become
                    public.
                  </small>
                </span>
              </label>
              <label className="block text-sm font-bold mt-5">
                Public investor pitch (minimum 50 words)
                <textarea
                  name="investor_pitch"
                  defaultValue={p?.investor_pitch || ""}
                  className="field mt-2 min-h-40"
                  placeholder="Explain the problem, traction, market, business model, current stage, and what kind of investor conversation you want."
                />
              </label>
              <button className="btn btn-primary mt-6">
                <Save size={16} />
                Save visibility
              </button>
            </form>
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
