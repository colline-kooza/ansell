"use client";

import React, { useState } from "react";
import { useAdminJobApplications, useAdminUpdateApplicationStatus, type JobApplication } from "@/hooks/use-admin-jobs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, MoreHorizontal, Eye, FileText, ExternalLink, Loader2,
  Clock, CheckCircle, XCircle, UserCheck, Calendar, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  reviewing: "bg-blue-50 text-blue-700 border-blue-200",
  shortlisted: "bg-purple-50 text-purple-700 border-purple-200",
  interview: "bg-indigo-50 text-indigo-700 border-indigo-200",
  offer: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  withdrawn: "bg-gray-50 text-gray-600 border-gray-200",
};

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "reviewing", label: "Reviewing" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

const UPDATE_STATUSES = ["reviewing", "shortlisted", "interview", "offer", "rejected"];

function ViewApplicationModal({ app, open, onClose }: { app: JobApplication | null; open: boolean; onClose: () => void }) {
  const updateMutation = useAdminUpdateApplicationStatus();

  if (!app) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-100">
          <DialogTitle className="text-base font-semibold">Application Details</DialogTitle>
          <p className="text-[12px] text-gray-400">Submitted {format(new Date(app.applied_at), "dd MMM yyyy, HH:mm")}</p>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh]">
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              {[
                { label: "Job Title", value: app.job?.title ?? "—" },
                { label: "Company", value: app.job?.company_name ?? "—" },
                { label: "Applicant", value: app.full_name },
                { label: "Email", value: app.email },
                { label: "Phone", value: app.phone || "—" },
                { label: "Status", value: <Badge className={cn("text-[11px] border", STATUS_STYLES[app.status] ?? "")}>{app.status}</Badge> },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                  <div className="text-gray-800 font-medium">{value as React.ReactNode}</div>
                </div>
              ))}
            </div>
            {app.cover_letter && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Cover Letter</p>
                <p className="text-[13px] text-gray-600 leading-relaxed">{app.cover_letter}</p>
              </div>
            )}
            {app.notes && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Reviewer Notes</p>
                <p className="text-[13px] text-gray-600 leading-relaxed">{app.notes}</p>
              </div>
            )}
            {app.cv_url && (
              <a href={app.cv_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[13px] text-primary hover:underline">
                <ExternalLink className="h-3.5 w-3.5" />Download CV
              </a>
            )}
            {/* Quick status update */}
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-2">Update Status</p>
              <div className="flex flex-wrap gap-1.5">
                {UPDATE_STATUSES.map(s => (
                  <Button
                    key={s}
                    size="sm"
                    variant={app.status === s ? "default" : "outline"}
                    className="h-7 text-[12px] capitalize"
                    disabled={updateMutation.isPending}
                    onClick={() => updateMutation.mutate({ id: app.id, status: s })}
                  >
                    {updateMutation.isPending && updateMutation.variables?.status === s ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : s}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end gap-2">
          <Button size="sm" onClick={onClose} className="text-[13px]">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminJobApplicationsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingApp, setViewingApp] = useState<JobApplication | null>(null);

  const { data, isLoading } = useAdminJobApplications({ page, page_size: 20, search, status });
  const apps = data?.data ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalItems = data?.total_items ?? 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Job Applications</h1>
        <p className="text-xs text-gray-500 mt-0.5">All job applications across the platform</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search applications..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 text-[13px]" />
        </div>
        <Select value={status || "all"} onValueChange={v => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[180px] text-[13px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s.value || "all"} value={s.value || "all"}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Applications</CardTitle>
          <CardDescription className="text-xs">{totalItems} total applications</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Applicant</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Job</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Company</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Applied</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>{[...Array(6)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : apps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                      <FileText className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  apps.map(app => (
                    <TableRow key={app.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900">{app.full_name}</p>
                          <p className="text-[11px] text-gray-400">{app.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-600 max-w-[150px] truncate">{app.job?.title ?? "—"}</TableCell>
                      <TableCell className="text-[13px] text-gray-500">{app.job?.company_name ?? "—"}</TableCell>
                      <TableCell className="text-[13px] text-gray-500 whitespace-nowrap">{format(new Date(app.applied_at), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[11px] border font-medium capitalize", STATUS_STYLES[app.status] ?? "")}>{app.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-[12px]" onClick={() => { setViewingApp(app); setViewOpen(true); }}>
                          <Eye className="h-3.5 w-3.5" />View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <ViewApplicationModal app={viewingApp} open={viewOpen} onClose={() => setViewOpen(false)} />
    </div>
  );
}
