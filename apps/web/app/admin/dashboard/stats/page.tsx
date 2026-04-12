"use client";

import React from "react";
import { useAdminPlatformStats } from "@/hooks/use-admin-users";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, Briefcase, Building, FileText, BookOpen, Video,
  Users, Home, TrendingUp, AlertCircle, BarChart3, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  badge?: { label: string; value: number; type: "warn" | "ok" };
}

function StatCard({ label, value, sub, icon: Icon, color, badge }: StatCardProps) {
  const colors: Record<string, { bg: string; icon: string; text: string; border: string }> = {
    blue: { bg: "bg-blue-50", icon: "text-blue-500", text: "text-blue-700", border: "border-blue-100" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-500", text: "text-emerald-700", border: "border-emerald-100" },
    amber: { bg: "bg-amber-50", icon: "text-amber-500", text: "text-amber-700", border: "border-amber-100" },
    purple: { bg: "bg-purple-50", icon: "text-purple-500", text: "text-purple-700", border: "border-purple-100" },
    indigo: { bg: "bg-indigo-50", icon: "text-indigo-500", text: "text-indigo-700", border: "border-indigo-100" },
    rose: { bg: "bg-rose-50", icon: "text-rose-500", text: "text-rose-700", border: "border-rose-100" },
    cyan: { bg: "bg-cyan-50", icon: "text-cyan-500", text: "text-cyan-700", border: "border-cyan-100" },
    orange: { bg: "bg-orange-50", icon: "text-orange-500", text: "text-orange-700", border: "border-orange-100" },
  };

  const c = colors[color] ?? colors.blue;

  return (
    <Card className={cn("border shadow-sm transition-shadow hover:shadow-md bg-white", c.border)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className={cn("text-[10px] font-bold uppercase tracking-wider", c.text)}>{label}</p>
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", c.bg)}>
            <Icon className={cn("h-4 w-4", c.icon)} />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
        {badge && (
          <div className={cn("mt-2 flex items-center gap-1 text-[11px] font-medium",
            badge.type === "warn" ? "text-amber-600" : "text-emerald-600"
          )}>
            <AlertCircle className="h-3 w-3" />
            {badge.value} {badge.label}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminStatsPage() {
  const { data: stats, isLoading } = useAdminPlatformStats();

  if (isLoading) {
    return (
      <div className="flex-1 min-w-0 p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Platform Statistics</h1>
          <p className="text-xs text-gray-500 mt-0.5">Real-time overview of platform activity</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  const s = stats ?? {
    total_users: 0, total_properties: 0, total_jobs: 0, total_companies: 0,
    total_tenders: 0, total_courses: 0, total_articles: 0, total_enrollments: 0,
    pending_properties: 0, pending_jobs: 0, pending_companies: 0, pending_owner_apps: 0,
    pending_company_apps: 0, active_video_adverts: 0,
  };

  const mainStats: StatCardProps[] = [
    { label: "Total Users", value: s.total_users.toLocaleString(), sub: "registered accounts", icon: Users, color: "blue" },
    { label: "Properties", value: s.total_properties.toLocaleString(), sub: "real estate listings", icon: Home, color: "emerald",
      badge: s.pending_properties > 0 ? { label: "pending review", value: s.pending_properties, type: "warn" } : undefined },
    { label: "Jobs", value: s.total_jobs.toLocaleString(), sub: "job listings", icon: Briefcase, color: "amber",
      badge: s.pending_jobs > 0 ? { label: "pending review", value: s.pending_jobs, type: "warn" } : undefined },
    { label: "Companies", value: s.total_companies.toLocaleString(), sub: "registered companies", icon: Building, color: "purple",
      badge: s.pending_companies > 0 ? { label: "pending", value: s.pending_companies, type: "warn" } : undefined },
    { label: "Tenders", value: s.total_tenders.toLocaleString(), sub: "procurement tenders", icon: FileText, color: "indigo" },
    { label: "Courses", value: s.total_courses.toLocaleString(), sub: "online courses", icon: BookOpen, color: "cyan" },
    { label: "Articles", value: s.total_articles.toLocaleString(), sub: "news articles", icon: Building2, color: "rose" },
    { label: "Enrollments", value: s.total_enrollments.toLocaleString(), sub: "course enrollments", icon: TrendingUp, color: "orange" },
  ];

  const pendingStats = [
    { label: "Pending Owner Applications", value: s.pending_owner_apps, icon: Users, color: "amber" },
    { label: "Pending Company Applications", value: s.pending_company_apps, icon: Building, color: "purple" },
    { label: "Active Video Adverts", value: s.active_video_adverts, icon: Video, color: "indigo" },
  ];

  return (
    <div className="flex-1 min-w-0 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Platform Statistics</h1>
        <p className="text-xs text-gray-500 mt-0.5">Real-time overview of platform activity and content</p>
      </div>

      {/* Main Stats */}
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Content Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {mainStats.map(stat => <StatCard key={stat.label} {...stat} />)}
        </div>
      </div>

      {/* Pending actions */}
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Pending Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {pendingStats.map(stat => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              badge={stat.value > 0 ? { label: "require attention", value: stat.value, type: "warn" } : undefined}
            />
          ))}
        </div>
      </div>

      {/* Quick summary table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <h3 className="text-[13px] font-semibold text-gray-700 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Platform Summary
          </h3>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { label: "Total Users", value: s.total_users, pending: null },
            { label: "Properties Listed", value: s.total_properties, pending: s.pending_properties },
            { label: "Jobs Posted", value: s.total_jobs, pending: s.pending_jobs },
            { label: "Companies Registered", value: s.total_companies, pending: s.pending_companies },
            { label: "Tenders Published", value: s.total_tenders, pending: null },
            { label: "Online Courses", value: s.total_courses, pending: null },
            { label: "News Articles", value: s.total_articles, pending: null },
            { label: "Course Enrollments", value: s.total_enrollments, pending: null },
            { label: "Active Video Adverts", value: s.active_video_adverts, pending: null },
            { label: "Pending Owner Applications", value: s.pending_owner_apps, pending: null },
            { label: "Pending Company Applications", value: s.pending_company_apps, pending: null },
          ].map(({ label, value, pending }) => (
            <div key={label} className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50 transition-colors">
              <span className="text-[13px] text-gray-600">{label}</span>
              <div className="flex items-center gap-3">
                {pending !== null && pending > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-amber-600">
                    <Clock className="h-3 w-3" />{pending} pending
                  </span>
                )}
                <span className="text-[13px] font-semibold text-gray-900 tabular-nums min-w-[40px] text-right">{value.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
