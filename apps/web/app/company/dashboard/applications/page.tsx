"use client";

import React, { useState } from "react";
import { useCompanyJobApplications, useCompanyUpdateApplicationStatus } from "@/hooks/use-companies";
import type { JobApplication } from "@/hooks/use-admin-jobs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Eye, FileText, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  reviewing: "bg-blue-50 text-blue-700 border-blue-200",
  shortlisted: "bg-purple-50 text-purple-700 border-purple-200",
  interview: "bg-indigo-50 text-indigo-700 border-indigo-200",
  offer: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_PIPELINE = ["reviewing", "shortlisted", "interview", "offer", "rejected"];

function ApplicationModal({ app, open, onClose }: { app: JobApplication | null; open: boolean; onClose: () => void }) {
  const updateMutation = useCompanyUpdateApplicationStatus();
  const [notes, setNotes] = useState(app?.notes || "");

  if (!app) return null;

  const handleUpdate = (status: string) => {
    updateMutation.mutate({ id: app.id, status, notes }, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-100">
          <DialogTitle className="text-base font-semibold">Application — {app.full_name}</DialogTitle>
          <p className="text-[12px] text-gray-400">Applied {format(new Date(app.applied_at), "dd MMM yyyy, HH:mm")}</p>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh]">
          <div className="px-6 py-4 space-y-4">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              <Badge className={cn("text-[11px] border capitalize", STATUS_STYLES[app.status] ?? "")}>{app.status}</Badge>
              <span className="text-[12px] text-gray-400">for</span>
              <span className="text-[12px] font-semibold text-gray-700">{app.job?.title || "—"}</span>
            </div>

            {/* Applicant details */}
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              {[
                { label: "Full Name", value: app.full_name },
                { label: "Email", value: app.email },
                { label: "Phone", value: app.phone || "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-gray-800 font-medium">{value}</p>
                </div>
              ))}
            </div>

            {app.cover_letter && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Cover Letter</p>
                <p className="text-[13px] text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">{app.cover_letter}</p>
              </div>
            )}

            {app.cv_url && (
              <a href={app.cv_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-[13px] text-primary hover:underline">
                <ExternalLink className="h-3.5 w-3.5" />View / Download CV
              </a>
            )}

            {/* Notes */}
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1.5">Internal Notes</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Add internal notes about this applicant..."
                className="w-full text-[12px] border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:border-primary"
              />
            </div>

            {/* Pipeline actions */}
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-2">Move to Stage</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_PIPELINE.map(s => (
                  <Button key={s} size="sm"
                    variant={app.status === s ? "default" : "outline"}
                    className="h-7 text-[12px] capitalize"
                    disabled={updateMutation.isPending}
                    onClick={() => handleUpdate(s)}>
                    {updateMutation.isPending && updateMutation.variables?.status === s
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : s}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onClose} className="text-[13px]">Close</Button>
          {notes !== app.notes && (
            <Button size="sm" onClick={() => updateMutation.mutate({ id: app.id, status: app.status, notes }, { onSuccess: onClose })} className="text-[13px]">
              Save Notes
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CompanyApplicationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingApp, setViewingApp] = useState<JobApplication | null>(null);

  const { data, isLoading } = useCompanyJobApplications();

  const allApps = data?.data ?? [];
  const filtered = allApps.filter(a => {
    const matchSearch = !search ||
      a.full_name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      (a.job?.title || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Group summary
  const pipeline = [
    { label: "Pending", key: "pending", color: "text-amber-600", bg: "from-amber-50", border: "border-amber-100", iconColor: "text-amber-600" },
    { label: "Reviewing", key: "reviewing", color: "text-blue-600", bg: "from-blue-50", border: "border-blue-100", iconColor: "text-blue-600" },
    { label: "Shortlisted", key: "shortlisted", color: "text-purple-600", bg: "from-purple-50", border: "border-purple-100", iconColor: "text-purple-600" },
    { label: "Interview", key: "interview", color: "text-indigo-600", bg: "from-indigo-50", border: "border-indigo-100", iconColor: "text-indigo-600" },
    { label: "Offer", key: "offer", color: "text-emerald-600", bg: "from-emerald-50", border: "border-emerald-100", iconColor: "text-emerald-600" },
    { label: "Rejected", key: "rejected", color: "text-red-500", bg: "from-red-50", border: "border-red-100", iconColor: "text-red-600" },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Applications</h1>
        <p className="text-xs text-gray-500 mt-0.5">Review and manage all job applications</p>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-12 gap-3 mb-2">
        {pipeline.map(({ label, key, color, bg, border, iconColor }) => {
          const count = allApps.filter(a => a.status === key).length;
          const isActive = statusFilter === key;
          
          return (
            <div key={key} className="col-span-6 sm:col-span-4 lg:col-span-2">
              <button 
                onClick={() => setStatusFilter(isActive ? "" : key)}
                className={cn(
                  "w-full text-left transition-all duration-200 outline-none",
                  isActive ? "ring-2 ring-primary ring-offset-1 rounded-xl" : "hover:-translate-y-0.5"
                )}
              >
                <Card className={cn("bg-gradient-to-br to-white shadow-sm border transition-all h-full", bg, border)}>
                  <CardContent className="p-3">
                    <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-1", iconColor)}>{label}</p>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold text-gray-900">{count}</span>
                    </div>
                  </CardContent>
                </Card>
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search applicants..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-[13px]" />
        </div>
        <Select value={statusFilter || "all"} onValueChange={v => setStatusFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="h-9 w-[160px] text-[13px]"><SelectValue placeholder="All Stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {pipeline.map(p => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Applications</CardTitle>
          <CardDescription className="text-xs">{filtered.length} of {allApps.length} total</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Applicant</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Job Applied</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">CV</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Date</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Stage</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => <TableRow key={i}>{[...Array(6)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                      <FileText className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(app => (
                    <TableRow key={app.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900">{app.full_name}</p>
                          <p className="text-[11px] text-gray-400">{app.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-600 max-w-[160px] truncate">{app.job?.title || "—"}</TableCell>
                      <TableCell>
                        {app.cv_url ? (
                          <a href={app.cv_url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-primary hover:underline flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />View CV
                          </a>
                        ) : (
                          <span className="text-[12px] text-gray-400">No CV</span>
                        )}
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-500 whitespace-nowrap">{format(new Date(app.applied_at), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[11px] border capitalize", STATUS_STYLES[app.status] ?? "")}>{app.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="h-7 gap-1 text-[12px]"
                          onClick={() => { setViewingApp(app); setViewOpen(true); }}>
                          <Eye className="h-3 w-3" />Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ApplicationModal app={viewingApp} open={viewOpen} onClose={() => setViewOpen(false)} />
    </div>
  );
}
