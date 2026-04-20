"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useUserStore } from "@/stores/user-store";
import { usePublicProperties } from "@/hooks/use-properties";
import { useJobs } from "@/hooks/use-jobs";
import { useArticles, useArticleCategories } from "@/hooks/use-articles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart, Star, Newspaper, Building2, Briefcase,
  Eye, ArrowRight, CheckCircle,
  ExternalLink, Trash2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

/* ── Status helpers ─────────────────────────────────────────────────────── */

const PROPERTY_STATUS: Record<string, { label: string; cls: string }> = {
  active:         { label: "Active",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending_review: { label: "Pending",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
  rejected:       { label: "Rejected", cls: "bg-red-50 text-red-700 border-red-200" },
  inactive:       { label: "Inactive", cls: "bg-gray-50 text-gray-600 border-gray-200" },
};

/* ── Section header ─────────────────────────────────────────────────────── */

function SectionHeader({
  icon: Icon,
  title,
  sub,
  href,
  count,
}: {
  icon: React.ElementType;
  title: string;
  sub?: string;
  href?: string;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-semibold text-gray-900">{title}</h2>
            {count != null && (
              <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary">
                {count}
              </span>
            )}
          </div>
          {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
        </div>
      </div>
      {href && (
        <Link href={href}>
          <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 text-primary px-2">
            View all <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      )}
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────── */

function EmptyState({ icon: Icon, text, action }: { icon: React.ElementType; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 mb-3">
        <Icon className="h-5 w-5 text-gray-300" />
      </div>
      <p className="text-[12px] text-gray-400 mb-3">{text}</p>
      {action}
    </div>
  );
}

/* ── Compact data table wrapper ─────────────────────────────────────────── */

function DataTable({
  headers,
  children,
  className,
}: {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-gray-100 bg-white", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/50">
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Stat card ───────────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  sub,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className={cn("rounded-xl border p-4 bg-white shadow-sm transition-shadow hover:shadow-md", `border-${color}-100`)}>
      <div className="flex items-center justify-between mb-3">
        <p className={cn("text-[10px] font-bold uppercase tracking-wider", `text-${color}-600`)}>{label}</p>
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", `bg-${color}-50`)}>
          <Icon className={cn("h-3.5 w-3.5", `text-${color}-500`)} />
        </div>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── News category card ─────────────────────────────────────────────────── */

const CATEGORY_COLORS: Record<string, string> = {
  business:     "from-blue-50 border-blue-100 text-blue-700",
  politics:     "from-purple-50 border-purple-100 text-purple-700",
  sports:       "from-emerald-50 border-emerald-100 text-emerald-700",
  technology:   "from-cyan-50 border-cyan-100 text-cyan-700",
  health:       "from-red-50 border-red-100 text-red-700",
  entertainment: "from-pink-50 border-pink-100 text-pink-700",
  education:    "from-amber-50 border-amber-100 text-amber-700",
  general:      "from-gray-50 border-gray-100 text-gray-700",
};

/* ══════════════════════════════════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════════════════════════════════ */

export default function UserDashboardPage() {
  const { user } = useAuth();
  const { favoritePropertyIds, favoriteJobIds, toggleFavoriteProperty, toggleFavoriteJob, newsPreferences, toggleNewsPreference } = useUserStore();

  /* ── Queries ── */
  // Fetch properties that are favourited (we query all and filter client-side since most APIs don't support multi-id filter)
  const { data: propertiesData, isLoading: propertiesLoading } = usePublicProperties({ page_size: 100 });
  const allProperties = propertiesData?.data ?? [];
  const savedProperties = allProperties.filter((p) => favoritePropertyIds.includes(p.id));

  const { data: jobsData, isLoading: jobsLoading } = useJobs({ page_size: 100 });
  const allJobs = jobsData?.data ?? [];
  const savedJobs = allJobs.filter((j) => favoriteJobIds.includes(j.id));

  const { data: categoriesData } = useArticleCategories();
  const categories = categoriesData ?? [];

  const { data: newsData } = useArticles({
    category: newsPreferences.length > 0 ? newsPreferences[0] : undefined,
    page_size: 6,
  });
  const newsArticles = newsData?.data ?? [];

  return (
    <div className="px-4 md:px-6 pt-5 pb-12 max-w-[1400px] mx-auto">

      {/* Welcome banner */}
      <section className="mb-5">
        <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-0.5 tracking-tight">
          Welcome back, <span className="text-primary">{user?.first_name ?? "there"}</span>! 👋
        </h1>
        <p className="text-[12px] text-gray-400">
          {format(new Date(), "EEEE, d MMMM yyyy")} · Manage your saved listings, applications & news reads
        </p>
      </section>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <StatCard label="Saved Properties" value={favoritePropertyIds.length} sub="favourited listings" color="blue" icon={Heart} />
        <StatCard label="Saved Jobs" value={favoriteJobIds.length} sub="favourited positions" color="purple" icon={Star} />
        <StatCard label="News Interests" value={newsPreferences.length} sub="selected categories" color="emerald" icon={Newspaper} />
      </div>

      {/* ══════════════════════════════════════════
          OVERVIEW DASHBOARD
      ══════════════════════════════════════════ */}
      <div className="grid lg:grid-cols-2 gap-5">

          {/* Saved properties */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <SectionHeader
              icon={Heart}
              title="Saved Properties"
              sub="Properties you've marked as favourite"
              href="/user/dashboard/saved-properties"
              count={savedProperties.length}
            />
            {propertiesLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
              </div>
            ) : savedProperties.length === 0 ? (
              <EmptyState
                icon={Building2}
                text={favoritePropertyIds.length === 0 ? "No saved properties yet" : "Properties not found"}
                action={
                  <Link href="/real-estate">
                    <Button size="sm" variant="outline" className="text-xs gap-1 h-7">
                      <Building2 className="h-3 w-3" /> Browse Properties
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-1.5">
                {savedProperties.slice(0, 4).map((p) => {
                  const images = (() => { try { return JSON.parse(p.images) as string[]; } catch { return [] as string[]; } })();
                  const thumb = images[0];
                  return (
                    <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-50 hover:border-gray-100 hover:bg-gray-50/50 transition-all group">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt={p.title} className="h-8 w-8 rounded-lg object-cover shrink-0 border border-gray-100" />
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                          <Building2 className="h-3.5 w-3.5 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-gray-900 truncate">{p.title}</p>
                        <p className="text-[10px] text-gray-400 truncate">{p.city} · {p.currency} {p.price.toLocaleString()}/{p.price_period}</p>
                      </div>
                      <button
                        onClick={() => toggleFavoriteProperty(p.id)}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors shrink-0"
                        title="Remove from favourites"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Saved jobs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <SectionHeader
              icon={Star}
              title="Saved Jobs"
              sub="Positions you've bookmarked"
              href="/user/dashboard/saved-jobs"
              count={savedJobs.length}
            />
            {jobsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
              </div>
            ) : savedJobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                text={favoriteJobIds.length === 0 ? "No saved jobs yet" : "Jobs not found"}
                action={
                  <Link href="/job-board">
                    <Button size="sm" variant="outline" className="text-xs gap-1 h-7">
                      <Briefcase className="h-3 w-3" /> Browse Jobs
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-1.5">
                {savedJobs.slice(0, 4).map((j) => (
                  <div key={j.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-50 hover:border-gray-100 hover:bg-gray-50/50 transition-all group">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50">
                      <Briefcase className="h-3.5 w-3.5 text-purple-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-gray-900 truncate">{j.title}</p>
                      <p className="text-[10px] text-gray-400 truncate">{j.company_name}{j.city ? ` · ${j.city}` : ""}</p>
                    </div>
                    <button
                      onClick={() => toggleFavoriteJob(j.id)}
                      className="p-1 text-red-400 hover:text-red-600 transition-colors shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* News snippet */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <SectionHeader
              icon={Newspaper}
              title="Your News Feed"
              sub={newsPreferences.length > 0 ? `Based on ${newsPreferences.length} selected categories` : "Set your preferences"}
              href="/user/dashboard/news-preferences"
            />
            {newsArticles.length === 0 ? (
              <EmptyState
                icon={Newspaper}
                text="Select news categories to see your feed"
                action={
                  <Link href="/user/dashboard/news-preferences">
                    <Button size="sm" variant="outline" className="text-xs gap-1 h-7">
                      <Newspaper className="h-3 w-3" /> Set Preferences
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-2">
                {newsArticles.slice(0, 4).map((a) => (
                  <Link
                    key={a.id}
                    href={`/news/${a.slug}`}
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[11.5px] font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{a.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{a.category} · {a.read_time_minutes} min read</p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-gray-300 shrink-0 mt-0.5" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      <style dangerouslySetInnerHTML={{ __html: `.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}` }} />
    </div>
  );
}
