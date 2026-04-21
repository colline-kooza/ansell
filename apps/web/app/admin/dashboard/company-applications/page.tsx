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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Eye, CheckCircle, XCircle, Loader2, Building,
  FileText, Mail, MapPin, Phone, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const EMPTY_VALUE = "-";

function isImageAsset(url?: string | null) {
  if (!url) return false;
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
}

function ReviewModal({
  app,
  open,
  onClose,
  rejectReason,
  onRejectReasonChange,
}: {
  app: CompanyApplication | null;
  open: boolean;
  onClose: () => void;
  rejectReason: string;
  onRejectReasonChange: (value: string) => void;
}) {
  const approveMutation = useAdminApproveCompanyApplication();
  const rejectMutation = useAdminRejectCompanyApplication();

  if (!app) return null;

  const applicant = app.applicant ?? app.user;
  const phone = app.phone_number || app.phone || EMPTY_VALUE;
  const reviewNote = app.review_note || app.reviewer_note;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-100">
          <DialogTitle className="text-base font-semibold">Review Application</DialogTitle>
          <DialogDescription>Submitted {format(new Date(app.created_at), "dd MMM yyyy, HH:mm")}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <div className="px-6 pt-4">
            <TabsList className="h-9 text-[13px]">
              <TabsTrigger value="overview" className="text-[13px]">Overview</TabsTrigger>
              <TabsTrigger value="contact" className="text-[13px]">Contact</TabsTrigger>
              <TabsTrigger value="documents" className="text-[13px]">Documents</TabsTrigger>
              <TabsTrigger value="review" className="text-[13px]">Review</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="max-h-[70vh]">
            <div className="px-6 py-4">
              <TabsContent value="overview" className="mt-0 space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  {app.logo_url ? (
                    <img src={app.logo_url} alt={app.company_name} className="h-14 w-14 object-contain rounded-xl border border-gray-200 bg-white p-2" />
                  ) : (
                    <div className="h-14 w-14 bg-gray-200 flex items-center justify-center rounded-xl"><Building className="h-6 w-6 text-gray-400" /></div>
                  )}
                  <div>
                    <p className="text-[15px] font-semibold text-gray-900">{app.company_name}</p>
                    <p className="text-[12px] text-gray-500">{app.industry || EMPTY_VALUE}</p>
                    <Badge className={cn("mt-1 text-[11px] border capitalize", STATUS_STYLES[app.status] ?? "")}>{app.status}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
                  {[
                    { label: "Company Type", value: app.company_type ? app.company_type.replace(/_/g, " ") : EMPTY_VALUE },
                    { label: "Industry", value: app.industry || EMPTY_VALUE },
                    { label: "City", value: app.city || EMPTY_VALUE },
                    { label: "Company Size", value: app.employee_count || EMPTY_VALUE },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-gray-800 font-medium">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">About the Company</p>
                  <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">{app.description || EMPTY_VALUE}</p>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="mt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
                  {[
                    { label: "Applicant", value: applicant ? `${applicant.first_name} ${applicant.last_name}` : EMPTY_VALUE, icon: Users },
                    { label: "Email", value: app.email || applicant?.email || EMPTY_VALUE, icon: Mail },
                    { label: "Phone", value: phone, icon: Phone },
                    { label: "City", value: app.city || EMPTY_VALUE, icon: MapPin },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="p-3 rounded-xl border border-gray-100 bg-white">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-gray-800 font-medium flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-gray-400" />
                        <span>{value}</span>
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
                  <div className="p-3 rounded-xl border border-gray-100 bg-white">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Website</p>
                    {app.website ? (
                      <a href={app.website} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline break-all">
                        {app.website}
                      </a>
                    ) : (
                      <p className="text-gray-800 font-medium">{EMPTY_VALUE}</p>
                    )}
                  </div>
                  <div className="p-3 rounded-xl border border-gray-100 bg-white">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Address</p>
                    <p className="text-gray-800 font-medium whitespace-pre-wrap">{app.address || EMPTY_VALUE}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="mt-0 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Company Logo</p>
                        <p className="text-sm text-gray-600">Brand image submitted with the application.</p>
                      </div>
                      {app.logo_url && (
                        <a href={app.logo_url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-primary hover:underline">
                          Open
                        </a>
                      )}
                    </div>
                    {app.logo_url ? (
                      <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-center min-h-52">
                        <img src={app.logo_url} alt={`${app.company_name} logo`} className="max-h-44 w-full object-contain" />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                        No logo uploaded.
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] text-primary/70 uppercase tracking-wide mb-1">Supporting Document</p>
                        <p className="text-sm text-gray-600">Verification file attached to the company application.</p>
                      </div>
                      {app.document_url && (
                        <a href={app.document_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-white px-3 py-2 text-[13px] font-medium text-primary hover:bg-primary/5">
                          <FileText className="h-3.5 w-3.5" />
                          Open file
                        </a>
                      )}
                    </div>
                    {app.document_url ? (
                      isImageAsset(app.document_url) ? (
                        <div className="rounded-xl border border-primary/10 bg-white p-4 flex items-center justify-center min-h-52">
                          <img src={app.document_url} alt="Supporting document" className="max-h-44 w-full object-contain" />
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-primary/20 bg-white p-6 text-center text-sm text-gray-600">
                          Preview is not available for this file type here. Use &quot;Open file&quot; to inspect the document.
                        </div>
                      )
                    ) : (
                      <div className="rounded-xl border border-dashed border-primary/20 bg-white p-6 text-center text-sm text-gray-500">
                        No supporting document uploaded.
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="review" className="mt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px]">
                  {[
                    { label: "Status", value: app.status ? app.status.replace(/_/g, " ") : EMPTY_VALUE },
                    { label: "Submitted", value: format(new Date(app.created_at), "dd MMM yyyy, HH:mm") },
                    { label: "Last Updated", value: format(new Date(app.updated_at), "dd MMM yyyy, HH:mm") },
                    { label: "Reviewed At", value: app.reviewed_at ? format(new Date(app.reviewed_at), "dd MMM yyyy, HH:mm") : EMPTY_VALUE },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-xl border border-gray-100 bg-white">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-gray-800 font-medium">{value}</p>
                    </div>
                  ))}
                </div>

                <div className={cn(
                  "p-3 rounded-xl border",
                  reviewNote ? "border-red-100 bg-red-50" : "border-gray-100 bg-gray-50/50"
                )}>
                  <p className={cn(
                    "text-[10px] uppercase tracking-wide mb-1 font-semibold",
                    reviewNote ? "text-red-400" : "text-gray-400"
                  )}>
                    Review Note
                  </p>
                  <p className={cn("text-[13px] whitespace-pre-wrap", reviewNote ? "text-red-700" : "text-gray-600")}>
                    {reviewNote || "No review note has been added yet."}
                  </p>
                </div>

                {app.status === "pending" && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <p className="text-[11px] text-gray-500 font-medium">Rejection reason (optional)</p>
                    <textarea
                      value={rejectReason}
                      onChange={e => onRejectReasonChange(e.target.value)}
                      rows={3}
                      placeholder="Reason for rejection..."
                      className="w-full text-[12px] border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:border-primary"
                    />
                  </div>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <Separator />
        <div className="px-6 py-4 flex justify-between gap-2">
          <Button size="sm" variant="outline" onClick={onClose} className="text-[13px]">Close</Button>
          {app.status === "pending" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
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
  const [rejectReason, setRejectReason] = useState("");

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
            {[{ value: "all", label: "All" }, { value: "pending", label: "Pending" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }].map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
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
                    <TableRow key={i}>
                      {[...Array(6)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                    </TableRow>
                  ))
                ) : apps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                      <Building className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  apps.map(app => {
                    const applicant = app.applicant ?? app.user;
                    return (
                      <TableRow key={app.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {app.logo_url ? (
                              <img src={app.logo_url} alt={app.company_name} className="h-6 w-6 object-contain border border-gray-100" />
                            ) : (
                              <div className="h-6 w-6 bg-gray-100 flex items-center justify-center"><Building className="h-3 w-3 text-gray-400" /></div>
                            )}
                            <span className="text-[13px] font-semibold text-gray-900">{app.company_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[13px] text-gray-600">
                          {applicant ? `${applicant.first_name} ${applicant.last_name}` : EMPTY_VALUE}
                        </TableCell>
                        <TableCell className="text-[13px] text-gray-500">{app.industry || EMPTY_VALUE}</TableCell>
                        <TableCell className="text-[13px] text-gray-500 whitespace-nowrap">{format(new Date(app.created_at), "dd MMM yyyy")}</TableCell>
                        <TableCell>
                          <Badge className={cn("text-[11px] border capitalize", STATUS_STYLES[app.status] ?? "")}>{app.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="h-7 gap-1 text-[12px]" onClick={() => { setRejectReason(""); setReviewingApp(app); setReviewOpen(true); }}>
                            <Eye className="h-3 w-3" />Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
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

      <ReviewModal
        app={reviewingApp}
        open={reviewOpen}
        rejectReason={rejectReason}
        onRejectReasonChange={setRejectReason}
        onClose={() => {
          setReviewOpen(false);
          setRejectReason("");
        }}
      />
    </div>
  );
}
