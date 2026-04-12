"use client";

import React, { useState } from "react";
import {
  useAdminNationalIdApplications, useAdminApproveNationalId, useAdminRejectNationalId,
  type NationalIdApplication,
} from "@/hooks/use-admin-users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, CheckCircle, XCircle, Loader2, ShieldCheck, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

function ReviewModal({ app, open, onClose }: { app: NationalIdApplication | null; open: boolean; onClose: () => void }) {
  const approveMutation = useAdminApproveNationalId();
  const rejectMutation = useAdminRejectNationalId();
  const [rejectReason, setRejectReason] = useState("");

  if (!app) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-100">
          <DialogTitle className="text-base font-semibold">National ID Review</DialogTitle>
          <p className="text-[12px] text-gray-400">Submitted {format(new Date(app.created_at), "dd MMM yyyy, HH:mm")}</p>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh]">
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn("text-[11px] border capitalize", STATUS_STYLES[app.status] ?? "")}>{app.status}</Badge>
              {app.national_id_number && (
                <span className="text-[12px] text-gray-600 font-mono">ID: {app.national_id_number}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              {[
                { label: "Applicant", value: app.user ? `${app.user.first_name} ${app.user.last_name}` : "—" },
                { label: "Email", value: app.user?.email || "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-gray-800 font-medium">{value}</p>
                </div>
              ))}
            </div>

            {/* Document Images */}
            <div className="space-y-3">
              {app.document_front_url && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Document Front</p>
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={app.document_front_url} alt="Document Front" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
                    <a href={app.document_front_url} target="_blank" rel="noopener noreferrer"
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center bg-white/90 rounded shadow text-gray-600 hover:text-primary">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              )}
              {app.document_back_url && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Document Back</p>
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={app.document_back_url} alt="Document Back" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
                    <a href={app.document_back_url} target="_blank" rel="noopener noreferrer"
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center bg-white/90 rounded shadow text-gray-600 hover:text-primary">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              )}
              {app.selfie_url && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Selfie</p>
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={app.selfie_url} alt="Selfie" className="h-32 w-32 object-cover rounded-full border border-gray-200" />
                  </div>
                </div>
              )}
            </div>

            {app.reviewer_note && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Reviewer Note</p>
                <p className="text-[13px] text-gray-600">{app.reviewer_note}</p>
              </div>
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
              <Button size="sm" variant="outline"
                className="text-[13px] text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                disabled={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate({ id: app.id, reason: rejectReason }, { onSuccess: onClose })}>
                {rejectMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                Reject
              </Button>
              <Button size="sm" className="text-[13px] gap-1.5"
                disabled={approveMutation.isPending}
                onClick={() => approveMutation.mutate(app.id, { onSuccess: onClose })}>
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

export default function AdminNationalIdPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("pending");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewingApp, setReviewingApp] = useState<NationalIdApplication | null>(null);

  const { data, isLoading } = useAdminNationalIdApplications({ page, page_size: 20, status });
  const apps = data?.data ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalItems = data?.total_items ?? 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">National ID Verifications</h1>
        <p className="text-xs text-gray-500 mt-0.5">Review identity verification submissions</p>
      </div>
      <div className="flex gap-3">
        <Select value={status || "all"} onValueChange={v => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[180px] text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[{ v: "all", l: "All" }, { v: "pending", l: "Pending" }, { v: "approved", l: "Approved" }, { v: "rejected", l: "Rejected" }].map(s => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Verification Queue</CardTitle>
          <CardDescription className="text-xs">{totalItems} applications</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Applicant</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">ID Number</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Documents</TableHead>
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
                      <ShieldCheck className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  apps.map(app => (
                    <TableRow key={app.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900">
                            {app.user ? `${app.user.first_name} ${app.user.last_name}` : "—"}
                          </p>
                          <p className="text-[11px] text-gray-400">{app.user?.email || ""}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] font-mono text-gray-600">{app.national_id_number || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {app.document_front_url && <span className="text-[11px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Front</span>}
                          {app.document_back_url && <span className="text-[11px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Back</span>}
                          {app.selfie_url && <span className="text-[11px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Selfie</span>}
                        </div>
                      </TableCell>
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
