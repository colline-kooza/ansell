"use client";

import React, { useState } from "react";
import {
  useOwnerApplications,
  useApproveOwnerApplication,
  useRejectOwnerApplication,
  type OwnerApplication,
} from "@/hooks/use-owner-applications";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, CheckCircle, XCircle, Eye, Users, Clock, Loader2, Building2,
  Phone, MapPin, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

type FilterTab = "pending" | "approved" | "rejected" | "";

export default function AdminOwnerApplicationsPage() {
  const [filterStatus, setFilterStatus] = useState<FilterTab>("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewApp, setViewApp] = useState<OwnerApplication | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const { data, isLoading } = useOwnerApplications({
    page,
    page_size: 20,
    status: filterStatus || undefined,
  });

  const approveMutation = useApproveOwnerApplication();
  const rejectMutation = useRejectOwnerApplication();

  const applications = (data?.data ?? []).filter((app) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const name = `${app.user?.first_name ?? ""} ${app.user?.last_name ?? ""}`.toLowerCase();
    return (
      name.includes(s) ||
      app.business_name?.toLowerCase().includes(s) ||
      app.city?.toLowerCase().includes(s) ||
      app.user?.email?.toLowerCase().includes(s)
    );
  });

  const totalPages = data?.total_pages ?? 1;
  const totalItems = data?.total_items ?? 0;

  const openReject = (id: string) => {
    setRejectingId(id);
    setRejectNote("");
    setRejectOpen(true);
  };

  const confirmReject = () => {
    if (!rejectingId) return;
    rejectMutation.mutate(
      { id: rejectingId, review_note: rejectNote },
      { onSuccess: () => { setRejectOpen(false); setRejectingId(null); setViewApp(null); } }
    );
  };

  const tabs: { label: string; value: FilterTab }[] = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "All", value: "" },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Owner Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Review applications from users wanting to become property owners</p>
        </div>
      </div>

      {/* Tab filter */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit gap-0.5">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => { setFilterStatus(t.value); setPage(1); }}
            className={cn(
              "px-5 py-2 text-xs font-medium rounded-lg transition-all",
              filterStatus === t.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold">Applications</CardTitle>
              <CardDescription className="text-xs">{totalItems} total</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by name, business..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-lg border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Applicant</TableHead>
                  <TableHead className="font-semibold text-gray-700">Business</TableHead>
                  <TableHead className="font-semibold text-gray-700">Type</TableHead>
                  <TableHead className="font-semibold text-gray-700">City</TableHead>
                  <TableHead className="font-semibold text-gray-700">Applied</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(7)].map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-14">
                      <Users className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                      <p className="text-sm text-gray-400">No applications found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => (
                    <TableRow key={app.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                            {app.user?.first_name?.[0] ?? "?"}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {app.user?.first_name} {app.user?.last_name}
                            </p>
                            <p className="text-xs text-gray-400">{app.user?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-800">{app.business_name}</TableCell>
                      <TableCell className="text-sm text-gray-600 capitalize">{app.business_type}</TableCell>
                      <TableCell className="text-sm text-gray-500">{app.city || "—"}</TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {new Date(app.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs border font-medium capitalize", STATUS_STYLES[app.status] ?? "bg-gray-50 text-gray-600 border-gray-200")}>
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setViewApp(app)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {app.status === "pending" && (
                            <>
                              <Button
                                variant="ghost" size="sm"
                                className="h-8 px-3 text-emerald-700 hover:bg-emerald-50 text-xs font-medium"
                                onClick={() => approveMutation.mutate(app.id)}
                                disabled={approveMutation.isPending}
                              >
                                {approveMutation.isPending && approveMutation.variables === app.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <><CheckCircle className="h-3.5 w-3.5 mr-1" />Approve</>
                                )}
                              </Button>
                              <Button
                                variant="ghost" size="sm"
                                className="h-8 px-3 text-red-700 hover:bg-red-50 text-xs font-medium"
                                onClick={() => openReject(app.id)}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                              </Button>
                            </>
                          )}
                        </div>
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
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>Previous</Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Application Dialog */}
      <Dialog open={!!viewApp} onOpenChange={(v) => { if (!v) setViewApp(null); }}>
        {viewApp && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Owner Application
              </DialogTitle>
              <DialogDescription>Review the applicant's details below</DialogDescription>
            </DialogHeader>
            <Separator />
            <div className="space-y-4 py-2">
              {/* Applicant */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                  {viewApp.user?.first_name?.[0] ?? "?"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{viewApp.user?.first_name} {viewApp.user?.last_name}</p>
                  <p className="text-xs text-gray-500">{viewApp.user?.email}</p>
                  <Badge className={cn("mt-1 text-xs border", STATUS_STYLES[viewApp.status])}>{viewApp.status}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wide mb-1">Business Name</p>
                  <p className="text-sm font-semibold text-gray-900">{viewApp.business_name}</p>
                </div>
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wide mb-1">Business Type</p>
                  <p className="text-sm text-gray-700 capitalize">{viewApp.business_type}</p>
                </div>
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wide mb-1">Phone</p>
                  <p className="text-sm text-gray-700 flex items-center gap-1"><Phone className="h-3 w-3" />{viewApp.phone_number}</p>
                </div>
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wide mb-1">City</p>
                  <p className="text-sm text-gray-700 flex items-center gap-1"><MapPin className="h-3 w-3" />{viewApp.city || "—"}</p>
                </div>
              </div>

              {viewApp.description && (
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wide mb-1">Description</p>
                  <p className="text-sm text-gray-700">{viewApp.description}</p>
                </div>
              )}

              {viewApp.document_url && (
                <div className="p-3 rounded-xl border border-primary/20 bg-primary/5">
                  <p className="text-[10px] font-bold uppercase text-primary/70 tracking-wide mb-2">Supporting Document</p>
                  <img src={viewApp.document_url} alt="Document" className="rounded-lg max-h-48 w-auto object-contain" />
                </div>
              )}

              {viewApp.review_note && (
                <div className="p-3 rounded-xl border border-red-100 bg-red-50">
                  <p className="text-[10px] font-bold uppercase text-red-400 tracking-wide mb-1">Review Note</p>
                  <p className="text-sm text-red-700">{viewApp.review_note}</p>
                </div>
              )}
            </div>

            {viewApp.status === "pending" && (
              <>
                <Separator />
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => approveMutation.mutate(viewApp.id, { onSuccess: () => setViewApp(null) })}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => { openReject(viewApp.id); setViewApp(null); }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        )}
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={(v) => { setRejectOpen(v); if (!v) setRejectingId(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />Reject Application
            </DialogTitle>
            <DialogDescription>This note will be visible to the applicant.</DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="py-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">Reason for rejection</label>
            <textarea
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              rows={4}
              placeholder="e.g. Document not valid, business type unclear..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white transition resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject} disabled={rejectMutation.isPending}>
              {rejectMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Rejecting...</> : "Confirm Rejection"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
