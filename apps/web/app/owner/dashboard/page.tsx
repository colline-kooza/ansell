"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useOwnerPropertiesFull, useOwnerInquiries } from "@/hooks/use-properties";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, MessageSquare, TrendingUp, Eye, PlusCircle, ArrowRight,
  CheckCircle, Clock, XCircle, AlertCircle,
} from "lucide-react";
import { PropertyFormModal } from "@/components/real-estate/property-form-modal";
import { useState } from "react";
import { cn } from "@/lib/utils";

function StatCard({ label, value, sub, icon: Icon, color = "primary", isLoading }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType;
  color?: "primary" | "emerald" | "amber" | "blue" | "purple"; isLoading?: boolean;
}) {
  const styles = {
    primary: { gradient: "from-primary/5", border: "border-primary/10", text: "text-primary" },
    emerald: { gradient: "from-emerald-50", border: "border-emerald-100", text: "text-emerald-600" },
    amber: { gradient: "from-amber-50", border: "border-amber-100", text: "text-amber-600" },
    blue: { gradient: "from-blue-50", border: "border-blue-100", text: "text-blue-600" },
    purple: { gradient: "from-purple-50", border: "border-purple-100", text: "text-purple-600" },
  };
  const theme = styles[color];

  return (
    <Card className={cn("bg-gradient-to-br to-white shadow-sm border transition-all duration-300 hover:shadow-md", theme.gradient, theme.border)}>
      <CardContent className="p-4 pt-3.5 pb-3">
        <div className="flex items-center justify-between mb-2">
          <p className={cn("text-[11px] font-bold uppercase tracking-wider", theme.text)}>{label}</p>
          <Icon className={cn("h-4 w-4", theme.text)} />
        </div>
        <div className="flex items-baseline justify-between pt-1">
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <span className="text-2xl font-bold text-gray-900">{value}</span>
          )}
          {sub && <Badge className="bg-white/50 border-gray-100 text-gray-600 text-[10px] px-1.5 py-0 font-medium">{sub}</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: propData, isLoading: propsLoading } = useOwnerPropertiesFull({ page_size: 100 });
  const { data: inqData, isLoading: inqLoading } = useOwnerInquiries({ page_size: 100 });

  const properties = propData?.data ?? [];
  const inquiries = inqData?.data ?? [];

  const totalListings = properties.length;
  const activeListings = properties.filter(p => p.status === "active").length;
  const pendingListings = properties.filter(p => p.status === "pending_review").length;
  const rejectedListings = properties.filter(p => p.status === "rejected").length;
  const totalViews = properties.reduce((s, p) => s + (p.views || 0), 0);
  const unreadInquiries = inquiries.filter(i => !i.is_read).length;

  const recentListings = properties.slice(0, 5);
  const recentInquiries = inquiries.slice(0, 4);

  const STATUS_MAP: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
    active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
    pending_review: { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
    rejected: { label: "Rejected", cls: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
    draft: { label: "Draft", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: AlertCircle },
  };

  return (
    <div className="p-6 space-y-7">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">
            Good day, {user?.first_name}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here&rsquo;s an overview of your property portfolio
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          New Listing
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Listings" value={totalListings} icon={Building2} color="primary" isLoading={propsLoading} />
        <StatCard label="Active" value={activeListings} icon={CheckCircle} color="emerald" isLoading={propsLoading} sub="Listed & visible" />
        <StatCard label="Total Views" value={totalViews.toLocaleString()} icon={Eye} color="blue" isLoading={propsLoading} />
        <StatCard label="Inquiries" value={inquiries.length} sub={unreadInquiries > 0 ? `${unreadInquiries} unread` : "All read"} icon={MessageSquare} color="amber" isLoading={inqLoading} />
      </div>

      {/* Status breakdown */}
      {!propsLoading && totalListings > 0 && (
        <div className="grid grid-cols-12 gap-3 mt-4">
          <div className="col-span-12 sm:col-span-4">
             <Card className="bg-gradient-to-br from-amber-50 to-white shadow-sm border border-amber-100 transition-all h-full">
               <CardContent className="p-3.5 flex items-center gap-3">
                 <div className="h-8 w-8 rounded-lg bg-amber-100/50 flex items-center justify-center shrink-0">
                   <Clock className="h-4 w-4 text-amber-600" />
                 </div>
                 <div>
                   <p className="text-xl font-bold text-gray-900 leading-none">{pendingListings}</p>
                   <p className="text-[11px] font-medium text-amber-700 mt-1 uppercase tracking-wider">Awaiting Review</p>
                 </div>
               </CardContent>
             </Card>
          </div>
          <div className="col-span-12 sm:col-span-4">
             <Card className="bg-gradient-to-br from-emerald-50 to-white shadow-sm border border-emerald-100 transition-all h-full">
               <CardContent className="p-3.5 flex items-center gap-3">
                 <div className="h-8 w-8 rounded-lg bg-emerald-100/50 flex items-center justify-center shrink-0">
                   <CheckCircle className="h-4 w-4 text-emerald-600" />
                 </div>
                 <div>
                   <p className="text-xl font-bold text-gray-900 leading-none">{activeListings}</p>
                   <p className="text-[11px] font-medium text-emerald-700 mt-1 uppercase tracking-wider">Active Listings</p>
                 </div>
               </CardContent>
             </Card>
          </div>
          <div className="col-span-12 sm:col-span-4">
             <Card className="bg-gradient-to-br from-red-50 to-white shadow-sm border border-red-100 transition-all h-full">
               <CardContent className="p-3.5 flex items-center gap-3">
                 <div className="h-8 w-8 rounded-lg bg-red-100/50 flex items-center justify-center shrink-0">
                   <XCircle className="h-4 w-4 text-red-600" />
                 </div>
                 <div>
                   <p className="text-xl font-bold text-gray-900 leading-none">{rejectedListings}</p>
                   <p className="text-[11px] font-medium text-red-700 mt-1 uppercase tracking-wider">Rejected</p>
                 </div>
               </CardContent>
             </Card>
          </div>
        </div>
      )}

      {/* Two-col: Recent Listings + Recent Inquiries */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent listings */}
        <Card className="bg-white border-gray-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
            <div>
              <CardTitle className="text-sm font-bold text-gray-900">Recent Listings</CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">Your latest property listings</p>
            </div>
            <Link href="/owner/listings">
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-primary">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {propsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            ) : recentListings.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                <p className="text-sm text-gray-400 mb-3">No listings yet</p>
                <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                  <PlusCircle className="h-3.5 w-3.5" />Create Listing
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentListings.map((p) => {
                  const st = STATUS_MAP[p.status] ?? { label: p.status, cls: "bg-gray-50 text-gray-600 border-gray-200", icon: Building2 };
                  const Ico = st.icon;
                  return (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:border-gray-100 hover:bg-gray-50/50 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                          <Building2 className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{p.title}</p>
                          <p className="text-xs text-gray-400">{p.city} · {p.currency} {p.price.toLocaleString()}</p>
                        </div>
                      </div>
                      <Badge className={cn("text-[10px] border shrink-0 ml-2", st.cls)}>
                        <Ico className="h-2.5 w-2.5 mr-0.5" />{st.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent inquiries */}
        <Card className="bg-white border-gray-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
            <div>
              <CardTitle className="text-sm font-bold text-gray-900">Recent Inquiries</CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">Latest messages from potential clients</p>
            </div>
            <Link href="/owner/inquiries">
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-primary">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {inqLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            ) : recentInquiries.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                <p className="text-sm text-gray-400">No inquiries yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentInquiries.map((inq) => (
                  <div key={inq.id} className={cn("flex items-start gap-3 p-3 rounded-xl border transition-all", !inq.is_read ? "border-primary/20 bg-primary/5" : "border-gray-50 hover:border-gray-100 hover:bg-gray-50/50")}>
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-xs font-bold text-gray-500">
                      {inq.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">{inq.name}</p>
                        {!inq.is_read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{inq.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PropertyFormModal open={createOpen} onOpenChange={setCreateOpen} property={null} isAdmin={false} />
    </div>
  );
}
