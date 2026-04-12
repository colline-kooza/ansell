"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useMyJobApplications } from "@/hooks/use-job-applications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Briefcase, MapPin, Clock, Eye, CheckCircle, XCircle, AlertCircle, Calendar, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

const APPLICATION_STATUS: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  pending:      { label: "Pending",      cls: "bg-amber-50 text-amber-700 border-amber-200",    icon: Clock },
  reviewing:    { label: "Reviewing",    cls: "bg-blue-50 text-blue-700 border-blue-200",       icon: Eye },
  shortlisted:  { label: "Shortlisted",  cls: "bg-purple-50 text-purple-700 border-purple-200", icon: UserCheck },
  interview:    { label: "Interview",    cls: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: Calendar },
  offer:        { label: "Offer",        cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
  rejected:     { label: "Rejected",     cls: "bg-red-50 text-red-700 border-red-200",          icon: XCircle },
  withdrawn:    { label: "Withdrawn",    cls: "bg-gray-50 text-gray-600 border-gray-200",       icon: AlertCircle },
};

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

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/50">
              {headers.map((h) => (
                <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap">
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

export default function UserApplicationsPage() {
  const { user } = useAuth();
  const [viewApp, setViewApp] = useState<string | null>(null);
  
  const { data: applicationsData, isLoading: appsLoading } = useMyJobApplications({ page_size: 100 });
  const applications = applicationsData?.data ?? [];
  const viewedApp = applications.find((a) => a.id === viewApp) ?? null;

  return (
    <div className="px-4 md:px-6 pt-5 pb-12 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Applications</h1>
        <p className="text-xs text-gray-500 mt-1">Track the status of every position you've applied for</p>
      </div>

      {appsLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <EmptyState
            icon={Briefcase}
            text="You haven't applied for any jobs yet"
            action={
              <Link href="/job-board">
                <Button size="sm" className="text-xs gap-1 h-8">
                  <Briefcase className="h-3 w-3" /> Browse Job Board
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <DataTable headers={["Job", "Company", "Location", "Applied", "Status", ""]}>
          {applications.map((app) => {
            const st = APPLICATION_STATUS[app.status] ?? APPLICATION_STATUS.pending;
            const StIcon = st.icon;
            return (
              <tr
                key={app.id}
                className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                onClick={() => setViewApp(app.id)}
              >
                <td className="px-4 py-2.5 max-w-[200px]">
                  <p className="text-[12px] font-semibold text-gray-900 truncate">{app.job?.title ?? "—"}</p>
                  <p className="text-[10px] text-gray-400">{app.job?.job_type ?? ""}</p>
                </td>
                <td className="px-4 py-2.5 text-[11px] text-gray-600 whitespace-nowrap">{app.job?.company_name ?? "—"}</td>
                <td className="hidden md:table-cell px-4 py-2.5 text-[11px] text-gray-400 whitespace-nowrap">
                  {app.job?.city ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />{app.job.city}
                    </span>
                  ) : "—"}
                </td>
                <td className="hidden lg:table-cell px-4 py-2.5 text-[11px] text-gray-400 whitespace-nowrap">
                  {format(new Date(app.applied_at), "dd MMM yyyy")}
                </td>
                <td className="px-4 py-2.5">
                  <Badge className={cn("text-[9.5px] border px-1.5 py-0 gap-0.5 font-medium", st.cls)}>
                    <StIcon className="h-2.5 w-2.5" />{st.label}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-primary"
                    onClick={(e) => { e.stopPropagation(); setViewApp(app.id); }}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}

      {/* ── Application detail modal ── */}
      {viewedApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setViewApp(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-100 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-50">
              <div>
                <h2 className="text-[13px] font-bold text-gray-900">Application Details</h2>
                <p className="text-[10px] text-gray-400">Submitted {format(new Date(viewedApp.applied_at), "dd MMM yyyy")}</p>
              </div>
              <button
                onClick={() => setViewApp(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {/* Status banner */}
              {(() => {
                const st = APPLICATION_STATUS[viewedApp.status] ?? APPLICATION_STATUS.pending;
                const StIcon = st.icon;
                return (
                  <div className={cn("flex items-center gap-2.5 rounded-xl border px-3 py-2.5", st.cls)}>
                    <StIcon className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-[12px] font-bold">{st.label}</p>
                      <p className="text-[10px] opacity-75">Current application status</p>
                    </div>
                  </div>
                );
              })()}

              {/* Details rows */}
              {[
                { label: "Position", value: viewedApp.job?.title ?? "—" },
                { label: "Company", value: viewedApp.job?.company_name ?? "—" },
                { label: "Location", value: viewedApp.job?.city ?? "—" },
                { label: "Job Type", value: viewedApp.job?.job_type ?? "—" },
                { label: "Your Name", value: viewedApp.full_name },
                { label: "Your Email", value: viewedApp.email },
                { label: "Updated", value: format(new Date(viewedApp.updated_at), "dd MMM yyyy, HH:mm") },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start text-[12px]">
                  <span className="text-gray-400 shrink-0">{label}</span>
                  <span className="font-medium text-gray-900 text-right max-w-[55%] truncate">{value}</span>
                </div>
              ))}

              {viewedApp.cover_letter && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide font-semibold">Cover Letter</p>
                  <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-3">{viewedApp.cover_letter}</p>
                </div>
              )}

              {viewedApp.notes && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide font-semibold">Reviewer Notes</p>
                  <p className="text-[11px] text-gray-600 leading-relaxed">{viewedApp.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 pb-5 flex gap-2">
              {viewedApp.job?.id && (
                <Link href={`/job-board/${viewedApp.job.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1">
                    <ExternalLink className="h-3 w-3" /> View Job
                  </Button>
                </Link>
              )}
              <Button size="sm" onClick={() => setViewApp(null)} className="flex-1 h-8 text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
