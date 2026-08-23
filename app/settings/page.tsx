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
import toast from "react-hot-toast";
type Tab = "profile" | "notifications" | "security";
export default function Settings() {
  const [p, setP] = useState<any>(null),
    [tab, setTab] = useState<Tab>("profile"),
    [saving, setSaving] = useState(false),
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
      .then((r) => r.json())
      .then(setP);
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        const x = data.user?.user_metadata?.notifications;
        if (x) setPrefs({ ...prefs, ...x });
      });
  }, []);
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
