"use client";

import React, { useState } from "react";
import {
  useAdminCompanyApplications, useAdminApproveCompanyApplication,
  useAdminRejectCompanyApplication, type CompanyApplication,
} from "@/hooks/use-companies";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Eye, CheckCircle, XCircle, Loader2, Building, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

function ReviewModal({ app, open, onClose }: { app: CompanyApplication | null; open: boolean; onClose: () => void }) {
  const approveMutation = useAdminApproveCompanyApplication();
  const rejectMutation = useAdminRejectCompanyApplication();
  const [rejectReason, setRejectReason] = useState("");

  if (!app) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-100">
          <DialogTitle className="text-base font-semibold">Review Application</DialogTitle>
          <p className="text-[12px] text-gray-400">Submitted {format(new Date(app.created_at), "dd MMM yyyy, HH:mm")}</p>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh]">
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {app.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={app.logo_url} alt={app.company_name} className="h-12 w-12 object-contain border border-gray-200" />
              ) : (
                <div className="h-12 w-12 bg-gray-200 flex items-center justify-center rounded"><Building className="h-5 w-5 text-gray-400" /></div>
              )}
              <div>
                <p className="text-[14px] font-semibold text-gray-900">{app.company_name}</p>
                <Badge className={cn("text-[11px] border mt-0.5", STATUS_STYLES[app.status] ?? "")}>{app.status}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              {[
                { label: "Applicant", value: app.applicant ? `${app.applicant.first_name} ${app.applicant.last_name}` : "—" },
                { label: "Email", value: app.email || app.applicant?.email || "—" },
                { label: "Industry", value: app.industry || "—" },
                { label: "Phone", value: app.phone || "—" },
                { label: "City", value: app.city || "—" },
                { label: "Website", value: app.website || "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-gray-800 font-medium truncate">{value}</p>
                </div>
              ))}
            </div>
            {app.description && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">About the Company</p>
                <p className="text-[13px] text-gray-600 leading-relaxed">{app.description}</p>
              </div>
            )}
            {app.document_url && (
              <a href={app.document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[13px] text-primary hover:underline">
                <Globe className="h-3.5 w-3.5" />View Supporting Document
              </a>
            )}
            {app.status === "pending" && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <p className="text-[11px] text-gray-500 font-medium">Rejection reason (optional)</p>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={2}
                  placeholder="Reason for rejection..."
                  className="w-full text-[12px] border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:border-primary"
                />
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="px-6 py-3 border-t border-gray-100 flex justify-between gap-2">
          <Button size="sm" variant="outline" onClick={onClose} className="text-[13px]">Close</Button>
          {app.status === "pending" && (
            <div className="flex gap-2">
              <Button
                size="sm" variant="outline"
                className="text-[13px] text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                disabled={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate({ id: app.id, reason: rejectReason }, { onSuccess: onClose })}
              >
                {rejectMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                Reject
              </Button>
              <Button
                size="sm"
                className="text-[13px] gap-1.5"
                disabled={approveMutation.isPending}
                onClick={() => approveMutation.mutate(app.id, { onSuccess: onClose })}
              >
                {approveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                Approve
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCompanyApplicationsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("pending");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewingApp, setReviewingApp] = useState<CompanyApplication | null>(null);

  const { data, isLoading } = useAdminCompanyApplications({ page, page_size: 20, search, status });
  const apps = data?.data ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalItems = data?.total_items ?? 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Company Applications</h1>
        <p className="text-xs text-gray-500 mt-0.5">Review and approve incoming company registrations</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search applications..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 text-[13px]" />
        </div>
        <Select value={status || "all"} onValueChange={v => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[180px] text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[{ value: "all", label: "All" }, { value: "pending", label: "Pending" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }].map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Applications Queue</CardTitle>
          <CardDescription className="text-xs">{totalItems} applications</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Company</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Applicant</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Industry</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Submitted</TableHead>
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
                      <Building className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  apps.map(app => (
                    <TableRow key={app.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {app.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={app.logo_url} alt={app.company_name} className="h-6 w-6 object-contain border border-gray-100" />
                          ) : (
                            <div className="h-6 w-6 bg-gray-100 flex items-center justify-center"><Building className="h-3 w-3 text-gray-400" /></div>
                          )}
                          <span className="text-[13px] font-semibold text-gray-900">{app.company_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-600">
                        {app.applicant ? `${app.applicant.first_name} ${app.applicant.last_name}` : "—"}
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-500">{app.industry || "—"}</TableCell>
                      <TableCell className="text-[13px] text-gray-500 whitespace-nowrap">{format(new Date(app.created_at), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[11px] border capitalize", STATUS_STYLES[app.status] ?? "")}>{app.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="h-7 gap-1 text-[12px]" onClick={() => { setReviewingApp(app); setReviewOpen(true); }}>
                          <Eye className="h-3 w-3" />Review
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
      <ReviewModal app={reviewingApp} open={reviewOpen} onClose={() => setReviewOpen(false)} />
    </div>
  );
}
