"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import {
  User, Lock, Bell, Palette, Shield, LogOut,
  Save, Eye, EyeOff, Check,
} from "lucide-react";
import { toast, Toaster } from "sonner";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "access", label: "Access & Roles", icon: Shield },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminSettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [showPass, setShowPass] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });

  const [passwords, setPasswords] = useState({
    current: "", next: "", confirm: "",
  });

  const [notifications, setNotifications] = useState({
    email_activity: true,
    email_reports: true,
    browser_alerts: false,
    new_applications: true,
    new_listings: false,
  });

  function handleSave() {
    setSaved(true);
    toast.success("Settings saved successfully.");
    setTimeout(() => setSaved(false), 2500);
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "SA";

  return (
    <div className="min-h-full bg-gray-50 px-4 py-8 md:px-8">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your admin account preferences and access.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Sidebar tabs ──────────────────────────── */}
        <aside className="lg:w-56 shrink-0">
          {/* Profile card */}
          <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-2xl font-black text-primary ring-4 ring-primary/10">
              {initials}
            </div>
            <p className="text-[14px] font-bold text-gray-900">{user?.first_name} {user?.last_name}</p>
            <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
            <span className="mt-1.5 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wider">
              {user?.role?.replace("_", " ")}
            </span>
          </div>

          <nav className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-[13px] font-medium transition-colors border-b border-gray-50 last:border-0 ${
                  activeTab === id
                    ? "bg-primary/[0.08] text-primary font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            ))}

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-3 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              Sign out
            </button>
          </nav>
        </aside>

        {/* ── Main content ──────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {/* Tab header */}
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-[15px] font-bold text-gray-900">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h2>
            </div>

            <div className="p-6">
              {/* ── Profile tab ─────────────────── */}
              {activeTab === "profile" && (
                <div className="space-y-5 max-w-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="First name">
                      <input
                        value={profile.first_name}
                        onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
                        className="input-field"
                      />
                    </Field>
                    <Field label="Last name">
                      <input
                        value={profile.last_name}
                        onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
                        className="input-field"
                      />
                    </Field>
                  </div>
                  <Field label="Email address">
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                      className="input-field"
                    />
                  </Field>
                  <Field label="Phone number">
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+211 ..."
                      className="input-field"
                    />
                  </Field>
                  <Field label="Role">
                    <div className="flex h-10 items-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-[13px] text-gray-500 select-none">
                      {user?.role?.replace("_", " ")} — managed by system
                    </div>
                  </Field>
                </div>
              )}

              {/* ── Security tab ─────────────────── */}
              {activeTab === "security" && (
                <div className="space-y-5 max-w-lg">
                  <p className="text-[13px] text-gray-500 leading-relaxed">
                    Change your password. You'll be asked to re-authenticate after saving.
                  </p>
                  {(["current", "next", "confirm"] as const).map((f) => (
                    <Field
                      key={f}
                      label={f === "current" ? "Current password" : f === "next" ? "New password" : "Confirm new password"}
                    >
                      <div className="relative">
                        <input
                          type={showPass ? "text" : "password"}
                          value={passwords[f]}
                          onChange={(e) => setPasswords((p) => ({ ...p, [f]: e.target.value }))}
                          className="input-field pr-10"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                        >
                          {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </Field>
                  ))}
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-[12px] text-amber-700">
                    Password changes require API integration with <code className="font-mono bg-amber-100 px-1 rounded">POST /api/profile/change-password</code>.
                  </div>
                </div>
              )}

              {/* ── Notifications tab ─────────────── */}
              {activeTab === "notifications" && (
                <div className="space-y-4 max-w-lg">
                  {(Object.entries(notifications) as [keyof typeof notifications, boolean][]).map(([key, val]) => (
                    <label key={key} className="flex items-center justify-between rounded-xl border border-gray-100 p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">
                          {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Receive {key.replace(/_/g, " ")} updates via configured channels
                        </p>
                      </div>
                      <button
                        onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key] }))}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${val ? "bg-primary" : "bg-gray-200"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${val ? "translate-x-4" : "translate-x-0.5"}`}
                        />
                      </button>
                    </label>
                  ))}
                </div>
              )}

              {/* ── Appearance tab ─────────────────── */}
              {activeTab === "appearance" && (
                <div className="space-y-4 max-w-lg">
                  <p className="text-[13px] text-gray-500">Choose your preferred display mode.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "light", label: "Light", bg: "bg-white border-primary", textColor: "text-gray-900" },
                      { id: "dark", label: "Dark", bg: "bg-gray-900 border-gray-700", textColor: "text-white" },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        className={`rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${theme.id === "light" ? "border-primary ring-2 ring-primary/20" : "border-gray-200"}`}
                      >
                        <div className={`h-16 rounded-lg mb-3 ${theme.id === "light" ? "bg-gray-50 border border-gray-200" : "bg-gray-800"}`}>
                          <div className={`h-3 m-2 rounded ${theme.id === "light" ? "bg-gray-200" : "bg-gray-600"}`} />
                          <div className={`h-2 mx-2 mt-1 rounded w-2/3 ${theme.id === "light" ? "bg-gray-100" : "bg-gray-700"}`} />
                        </div>
                        <p className="text-[13px] font-semibold text-gray-900">{theme.label}</p>
                        {theme.id === "light" && (
                          <span className="text-[10px] text-primary font-bold">Active</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Access tab ─────────────────────── */}
              {activeTab === "access" && (
                <div className="space-y-4 max-w-lg">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3">Current Permissions</p>
                    {["Manage Users", "Manage Listings", "Manage Applications", "Manage Content", "View Analytics", "System Settings"].map((perm) => (
                      <div key={perm} className="flex items-center gap-2.5 py-1.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-[13px] text-gray-700">{perm}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[12px] text-gray-400">
                    Role-based access is managed at the system level. Contact your system administrator to change role assignments.
                  </p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            {(activeTab === "profile" || activeTab === "security" || activeTab === "notifications") && (
              <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
                <p className="text-[11px] text-gray-400">
                  {activeTab === "profile" && "Profile changes are saved locally until API integration is complete."}
                  {activeTab === "security" && "Use a strong password with at least 8 characters."}
                  {activeTab === "notifications" && "Notification preferences are saved per session."}
                </p>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground hover:brightness-95 transition-all active:scale-95"
                >
                  {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                  {saved ? "Saved!" : "Save changes"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `.input-field{display:flex;width:100%;height:2.5rem;align-items:center;border-radius:.75rem;border:1px solid #e5e7eb;background:#f9fafb;padding:0 .75rem;font-size:.8125rem;color:#111827;outline:none;transition:all .15s}.input-field:focus{border-color:var(--color-primary);background:#fff;box-shadow:0 0 0 3px color-mix(in oklch,var(--color-primary) 15%,transparent)}`,
      }} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold text-gray-600">{label}</label>
      {children}
    </div>
  );
}
