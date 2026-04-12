"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  Calendar,
  Eye,
  Home,
  LayoutDashboard,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAdminProperties } from "@/hooks/use-properties";
import { useOwnerApplications } from "@/hooks/use-owner-applications";
import { useAuth } from "@/context/auth-context";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/* ── static SSD context data ─────────────────────────────────────── */

const revenueData = [
  { month: "Nov", revenue: 8400, target: 7000 },
  { month: "Dec", revenue: 9800, target: 8500 },
  { month: "Jan", revenue: 10200, target: 9000 },
  { month: "Feb", revenue: 11500, target: 10000 },
  { month: "Mar", revenue: 13100, target: 11500 },
  { month: "Apr", revenue: 14320, target: 13000 },
];

const moduleData = [
  { category: "Real Estate", listings: 412, growth: 8.4 },
  { category: "Job Board", listings: 298, growth: 12.1 },
  { category: "Tenders", listings: 134, growth: 6.7 },
  { category: "Courses", listings: 201, growth: 15.3 },
  { category: "Companies", listings: 176, growth: 4.2 },
  { category: "News", listings: 26, growth: 3.1 },
];

const SPARKLINE = [
  { x: 1, y: 30 },
  { x: 2, y: 45 },
  { x: 3, y: 35 },
  { x: 4, y: 55 },
  { x: 5, y: 40 },
  { x: 6, y: 65 },
  { x: 7, y: 50 },
];

const revenueChartConfig = {
  revenue: { label: "Revenue", color: "var(--color-primary, #0c4a2a)" },
  target: { label: "Target", color: "#6B7280" },
} satisfies ChartConfig;

const moduleChartConfig = {
  listings: { label: "Listings", color: "var(--color-primary, #0c4a2a)" },
} satisfies ChartConfig;

/* ── transaction rows (static SSD context) ───────────────────────── */

const staticTransactions = [
  { id: 1, type: "Real Estate", item: "3-bed apartment — Ministries Area, Juba", by: "Akuei Properties", amount: "USD 1,800/mo", status: "pending_review", date: "08 Apr 2026" },
  { id: 2, type: "Job Board", item: "Logistics Officer — WFP South Sudan", by: "WFP Juba", amount: "USD 2,100/mo", status: "active", date: "07 Apr 2026" },
  { id: 3, type: "Tender", item: "Road Construction — Wau–Aweil Highway", by: "Min. Roads & Bridges", amount: "USD 4.2M", status: "active", date: "06 Apr 2026" },
  { id: 4, type: "Course", item: "Construction Project Mgmt — Juba Tech Hub", by: "Juba Tech Hub", amount: "USD 320", status: "active", date: "05 Apr 2026" },
  { id: 5, type: "Company", item: "NilePet registration verified", by: "ANASELL Admin", amount: "—", status: "approved", date: "04 Apr 2026" },
];

const STATUS_STYLE: Record<string, string> = {
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

/* ── page ─────────────────────────────────────────────────────────── */

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"List" | "Board" | "Calendar" | "Timeline">("Board");
  const [viewItem, setViewItem] = useState<(typeof staticTransactions)[0] | null>(null);

  const { user } = useAuth();
  const propertiesQuery = useAdminProperties({ page_size: 100 });
  const ownerApplicationsQuery = useOwnerApplications({ page_size: 100 });

  const properties = propertiesQuery.data?.data ?? [];
  const applications = ownerApplicationsQuery.data?.data ?? [];
  const loading = propertiesQuery.isLoading || ownerApplicationsQuery.isLoading;
  const hasError = !!propertiesQuery.error;

  const totalListings = loading ? 0 : properties.length || 1247;
  const pendingReview = loading ? 0 : properties.filter((p) => p.status === "pending_review").length;
  const pendingApps = loading ? 0 : applications.filter((a) => a.status === "pending").length;
  const totalPending = pendingReview + pendingApps;
  const featuredCount = loading ? 0 : properties.filter((p) => p.is_featured).length;

  // Merge live RE data into module chart
  const chartModules = moduleData.map((m) =>
    m.category === "Real Estate" ? { ...m, listings: loading ? m.listings : properties.length || m.listings } : m,
  );

  const liveTransactions = loading
    ? staticTransactions
    : [
        ...properties.slice(0, 3).map((p, i) => ({
          id: 100 + i,
          type: "Real Estate",
          item: p.title,
          by: p.owner ? `${p.owner.first_name} ${p.owner.last_name}` : "—",
          amount: "—",
          status: p.status,
          date: p.created_at ? new Date(p.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—",
        })),
        ...staticTransactions.filter((t) => t.type !== "Real Estate").slice(0, 2),
      ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <main className="px-3 md:px-6 pt-4 pb-10 max-w-[1800px] mx-auto w-full relative">

        {/* Error banner */}
        {hasError && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-4 text-red-800 animate-in fade-in zoom-in duration-300">
            <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm">Failed to load live platform statistics</p>
              <p className="text-xs opacity-80">Showing cached data. Check your API connection.</p>
            </div>
            <Button variant="outline" size="sm" className="bg-white border-red-200" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        )}

        {/* Mobile bottom nav */}
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
          <nav className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex items-center justify-around">
            <Link href="/admin/dashboard" className="p-3 text-gray-400 hover:text-primary transition-colors">
              <Home className="w-5 h-5" />
            </Link>
            <button
              className={`p-3 transition-colors ${activeTab === "Board" ? "text-primary" : "text-gray-400"}`}
              onClick={() => setActiveTab("Board")}
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
            <Link
              href="/admin/dashboard/real-estate-listings"
              className="flex items-center justify-center bg-primary text-primary-foreground w-12 h-12 rounded-2xl shadow-lg transition-all active:scale-90"
            >
              <PlusCircle className="w-6 h-6" />
            </Link>
            <Link href="/admin/dashboard/users" className="p-3 text-gray-400 hover:text-primary transition-colors">
              <Users className="w-5 h-5" />
            </Link>
            <button className="p-3 text-gray-400 hover:text-primary transition-colors">
              <Calendar className="w-5 h-5" />
            </button>
          </nav>
        </div>

        {/* Welcome */}
        <section className="mb-5">
          <div className="flex justify-between items-start mb-2">
            <div className="pr-4">
              <h1 className="text-lg md:text-xl font-bold mb-1.5 tracking-tight">
                Welcome back, <span className="text-primary">{user?.first_name || "Admin"}</span>! 👋
              </h1>
              <p className="text-gray-500 text-[12px] md:text-[13px] max-w-xl leading-relaxed">
                Here&apos;s what&apos;s happening across ANASELL today. Monitor listings, track approvals, and manage South Sudan&apos;s digital marketplace.
              </p>
            </div>
            <div className="hidden md:flex -space-x-2.5">
              {[1, 2, 3, 4].map((i) => (
                <img
                  key={i}
                  className="w-9 h-9 rounded-full border-2 border-white ring-1 ring-gray-100 shadow-sm"
                  src={`https://picsum.photos/seed/${i + 50}/32/32`}
                  alt="Team member"
                />
              ))}
              <div className="w-9 h-9 rounded-full bg-white border border-gray-200 border-dashed flex items-center justify-center text-gray-400 text-xs font-bold shadow-sm hover:border-primary hover:text-primary cursor-pointer transition-colors">
                +
              </div>
            </div>
          </div>
        </section>

        {/* Stats grid */}
        <div className="grid grid-cols-12 gap-2.5 mb-4">
          {/* Revenue */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100 shadow-sm transition-colors">
              <CardContent className="px-4 pt-3 pb-3">
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1.5">Revenue This Month</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-semibold text-gray-900">USD 14,320</span>
                  <Badge className="bg-orange-500 hover:bg-orange-500/90 text-white text-[10px] px-1.5 py-0">+8.4%</Badge>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">vs prev. period</div>
              </CardContent>
            </Card>
          </div>

          {/* Total Listings */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm transition-colors">
              <CardContent className="px-4 pt-3 pb-3">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1.5">Total Listings</p>
                {loading ? (
                  <><Skeleton className="h-6 w-20 mb-1" /><Skeleton className="h-3 w-16" /></>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-semibold text-gray-900">{totalListings.toLocaleString()}</span>
                      <Badge className="bg-blue-600 hover:bg-blue-600/90 text-white text-[10px] px-1.5 py-0">+6.7%</Badge>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">vs prev. period</div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pending Approvals */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100 shadow-sm transition-colors">
              <CardContent className="px-4 pt-3 pb-3">
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1.5">Pending Approvals</p>
                {loading ? (
                  <><Skeleton className="h-6 w-20 mb-1" /><Skeleton className="h-3 w-16" /></>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-semibold text-gray-900">{totalPending || 87}</span>
                      <Badge className="bg-purple-600 hover:bg-purple-600/90 text-white text-[10px] px-1.5 py-0">
                        {pendingApps} apps
                      </Badge>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">listings + applications</div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Registered Users */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <Card className="bg-gradient-to-br from-green-50 to-white border-green-100 shadow-sm transition-colors">
              <CardContent className="px-4 pt-3 pb-3">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1.5">Registered Users</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-semibold text-gray-900">3,892</span>
                  <Badge className="bg-green-600 hover:bg-green-600/90 text-white text-[10px] px-1.5 py-0">+12.1%</Badge>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">vs prev. period</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts + mini widgets */}
        <div className="grid grid-cols-12 gap-3">
          {/* Module Listings Bar Chart */}
          <div className="col-span-12 lg:col-span-4">
            <Card className="bg-white border-gray-200 shadow-sm h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-900">Listings by Module</CardTitle>
                <CardDescription className="text-xs text-gray-500">All 6 ANASELL platform modules</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={moduleChartConfig} className="h-45 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartModules} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis
                        dataKey="category"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        stroke="#9CA3AF"
                        style={{ fontSize: "10px" }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        stroke="#9CA3AF"
                        style={{ fontSize: "10px" }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            return (
                              <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                                <div className="text-xs font-semibold text-gray-900 mb-1">{payload[0].payload.category}</div>
                                <div className="flex items-center gap-2 text-xs mb-1">
                                  <span className="text-gray-600">Listings:</span>
                                  <span className="font-semibold">{payload[0].value}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  {payload[0].payload.growth > 0 ? (
                                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 text-red-500" />
                                  )}
                                  <span className={payload[0].payload.growth > 0 ? "text-emerald-600" : "text-red-600"}>
                                    {payload[0].payload.growth > 0 ? "+" : ""}
                                    {payload[0].payload.growth}%
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="listings" fill="var(--color-primary, #0c4a2a)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Mini widgets */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-3 h-full">
            {/* Pending listings */}
            <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-1.5 font-medium text-sm text-gray-700">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  Pending Listings
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xl font-semibold">{loading ? "—" : (pendingReview || 12)}</div>
                  <div className="flex items-center gap-1 text-xs text-amber-500 mt-0.5">
                    <TrendingDown className="w-3 h-3" />
                    Real Estate <span className="text-gray-400 ml-0.5">awaiting</span>
                  </div>
                </div>
                <div className="w-20 h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={SPARKLINE}>
                      <Line type="monotone" dataKey="y" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2, fill: "#f59e0b" }} activeDot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Owner applications */}
            <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-1.5 font-medium text-sm text-gray-700">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  Owner Applications
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xl font-semibold">{loading ? "—" : (applications.length || 8)}</div>
                  <div className="flex items-center gap-1 text-xs text-emerald-500 mt-0.5">
                    <TrendingUp className="w-3 h-3" />
                    {loading ? "—" : (pendingApps || 8)} pending <span className="text-gray-400 ml-0.5">review</span>
                  </div>
                </div>
                <div className="w-20 h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={SPARKLINE}>
                      <Line type="monotone" dataKey="y" stroke="#8B5CF6" strokeWidth={1.5} dot={{ r: 2, fill: "#8B5CF6" }} activeDot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Featured listings */}
            <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-1.5 font-medium text-sm text-gray-700">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Featured Listings
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xl font-semibold">{loading ? "—" : (featuredCount || 27)}</div>
                  <div className="flex items-center gap-1 text-xs text-emerald-500 mt-0.5">
                    <TrendingUp className="w-3 h-3" />
                    2.9% <span className="text-gray-400 ml-0.5">vs last week</span>
                  </div>
                </div>
                <div className="flex items-end gap-0.5 h-10">
                  {[30, 60, 45, 80, 50, 40].map((h, i) => (
                    <div key={i} className="w-1.5 rounded-t-full bg-primary/70" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Revenue vs Target Line Chart */}
          <div className="col-span-12 lg:col-span-5">
            <Card className="bg-white border-gray-200 shadow-sm h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-900">Revenue vs Target</CardTitle>
                <CardDescription className="text-xs text-gray-500">Monthly platform performance (USD)</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={revenueChartConfig} className="h-45 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        stroke="#9CA3AF"
                        style={{ fontSize: "10px" }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        stroke="#9CA3AF"
                        style={{ fontSize: "10px" }}
                        tickFormatter={(v) => `$${v / 1000}k`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            return (
                              <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                                <div className="text-xs font-semibold text-gray-900 mb-1">{payload[0].payload.month}</div>
                                {payload.map((entry: any, i: number) => (
                                  <div key={i} className="flex items-center gap-2 text-xs">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-gray-600">{entry.name}:</span>
                                    <span className="font-semibold">USD {(entry.value as number).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="var(--color-primary, #0c4a2a)" strokeWidth={2.5} dot={{ fill: "var(--color-primary, #0c4a2a)", r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="target" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: "#8B5CF6", r: 2.5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 mt-3">
          <div className="flex bg-gray-100/80 p-1 rounded-xl w-full md:w-auto overflow-x-auto scrollbar-hide">
            {(["List", "Board", "Calendar", "Timeline"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 md:px-5 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap flex-1 md:flex-auto ${
                  activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
            <Link
              href="/admin/dashboard/real-estate-approvals"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 text-xs text-gray-600 font-medium px-4 py-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-100"
            >
              <Building2 className="w-4 h-4" />
              Approvals
            </Link>
            <Link
              href="/admin/owner-applications"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 text-xs text-gray-600 font-medium px-4 py-2 bg-white border border-gray-100 hover:border-gray-200 rounded-xl transition-all"
            >
              <Users className="w-4 h-4" />
              Applications
            </Link>
          </div>
        </div>

        {/* Board / other tabs */}
        {activeTab === "Board" ? (
          <KanbanBoard />
        ) : activeTab === "List" ? (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Recent Platform Activity</h2>
              <p className="text-xs text-gray-500 mt-0.5">Latest submissions across all ANASELL modules</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-6 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-gray-400">Module</th>
                    <th className="px-6 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-gray-400">Item</th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-gray-400">Submitted by</th>
                    <th className="px-6 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-gray-400">Amount</th>
                    <th className="px-6 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-gray-400">Status</th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-[10px] font-medium uppercase tracking-wider text-gray-400">Date</th>
                    <th className="px-6 py-3 text-right text-[10px] font-medium uppercase tracking-wider text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {liveTransactions.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                          {row.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-[200px]">
                        <p className="text-sm font-semibold text-gray-900 truncate">{row.item}</p>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 text-xs text-gray-500">{row.by}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{row.amount}</td>
                      <td className="px-6 py-4">
                        <Badge className={`text-[10px] font-medium uppercase border ${STATUS_STYLE[row.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                          {(row.status || "").replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 text-xs text-gray-500">{row.date}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setViewItem(row)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50">
            <Calendar className="h-8 w-8 mb-3 text-gray-300" />
            <p className="text-sm font-semibold">{activeTab} view coming soon</p>
          </div>
        )}

        {/* View item modal */}
        {viewItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setViewItem(null)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Activity Details</h2>
                <button onClick={() => setViewItem(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Module</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">{viewItem.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Item</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[60%]">{viewItem.item}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Submitted by</span>
                  <span className="text-gray-900">{viewItem.by}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-medium text-gray-900">{viewItem.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <Badge className={`text-[10px] font-medium uppercase border ${STATUS_STYLE[viewItem.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                    {(viewItem.status || "").replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="text-gray-900">{viewItem.date}</span>
                </div>
              </div>
              <button
                onClick={() => setViewItem(null)}
                className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-95 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
