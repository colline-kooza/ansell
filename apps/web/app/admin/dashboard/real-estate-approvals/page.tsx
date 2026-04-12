"use client";

import React, { useState } from "react";
import {
  useAdminPropertiesFull,
  useAdminApproveProperty,
  useAdminRejectProperty,
  type Property,
} from "@/hooks/use-properties";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Search, Building2, CheckCircle, XCircle, Eye, MapPin, Star,
  Loader2, Clock, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PropertyViewModal } from "@/components/real-estate/property-view-modal";

function parseImages(s: string | string[]): string[] {
  if (Array.isArray(s)) return s;
  try { return JSON.parse(s || "[]"); } catch { return []; }
}

type Tab = "pending_review" | "all";

export default function AdminRealEstateApprovalsPage() {
  const [tab, setTab] = useState<Tab>("pending_review");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const { data, isLoading } = useAdminPropertiesFull({
    page,
    page_size: 20,
    status: tab === "pending_review" ? "pending_review" : "",
    search,
  });

  const approveMutation = useAdminApproveProperty();
  const rejectMutation = useAdminRejectProperty();

  const properties = data?.data ?? [];
  const totalItems = data?.total_items ?? 0;
  const totalPages = data?.total_pages ?? 1;

  const pendingCount = properties.filter((p) => p.status === "pending_review").length;

  const openReject = (id: string) => {
    setRejectingId(id);
    setRejectNote("");
    setRejectOpen(true);
  };

  const confirmReject = () => {
    if (!rejectingId) return;
    rejectMutation.mutate(
      { id: rejectingId, review_note: rejectNote },
      { onSuccess: () => { setRejectOpen(false); setRejectingId(null); } }
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-gray-900">Property Approvals</h1>
          <p className="text-xs text-gray-500 mt-0.5">Review and approve owner-submitted listings</p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-sm px-3 py-1">
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            {pendingCount} pending
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
        {(["pending_review", "all"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={cn(
              "px-5 py-2 text-xs font-medium rounded-lg transition-all",
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t === "pending_review" ? "Pending Review" : "All Listings"}
          </button>
        ))}
      </div>

      {/* Search + Table */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold">
                {tab === "pending_review" ? "Listings Awaiting Review" : "All Listings"}
              </CardTitle>
              <CardDescription className="text-xs">{totalItems} listings</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Property</TableHead>
                  <TableHead className="font-semibold text-gray-700">Category</TableHead>
                  <TableHead className="font-semibold text-gray-700">Owner</TableHead>
                  <TableHead className="font-semibold text-gray-700">Submitted</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(6)].map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : properties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-14">
                      <CheckCircle className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                      <p className="text-sm text-gray-400">
                        {tab === "pending_review" ? "No pending listings — all done!" : "No listings found"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  properties.map((prop) => {
                    const images = parseImages(prop.images);
                    const isPending = prop.status === "pending_review";
                    return (
                      <TableRow key={prop.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-11 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                              {images[0] ? (
                                <img src={images[0]} alt={prop.title} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <Building2 className="h-4 w-4 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold text-gray-900 truncate max-w-[180px]">{prop.title}</p>
                              <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                                <MapPin className="h-2.5 w-2.5" />{prop.city || "—"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[11px] text-gray-600 capitalize">
                          {(prop.category || "").replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-[11px] text-gray-600">
                          {prop.owner ? `${prop.owner.first_name} ${prop.owner.last_name}` : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-gray-400">
                          {new Date(prop.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn("text-[9.5px] border font-semibold capitalize", {
                              "bg-amber-50 text-amber-700 border-amber-200": prop.status === "pending_review",
                              "bg-emerald-50 text-emerald-700 border-emerald-200": prop.status === "active",
                              "bg-red-50 text-red-700 border-red-200": prop.status === "rejected",
                              "bg-gray-50 text-gray-600 border-gray-200": !["pending_review","active","rejected"].includes(prop.status),
                            })}
                          >
                            {(prop.status || "pending_review").replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost" size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => { setViewingProperty(prop); setViewOpen(true); }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {isPending && (
                              <>
                                <Button
                                  variant="ghost" size="sm"
                                  className="h-8 px-3 text-emerald-700 hover:bg-emerald-50 text-xs font-medium"
                                  onClick={() => approveMutation.mutate(prop.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  {approveMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <><CheckCircle className="h-3.5 w-3.5 mr-1" />Approve</>
                                  )}
                                </Button>
                                <Button
                                  variant="ghost" size="sm"
                                  className="h-8 px-3 text-red-700 hover:bg-red-50 text-xs font-medium"
                                  onClick={() => openReject(prop.id)}
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                                </Button>
                              </>
                            )}
                          </div>
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

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={(v) => { setRejectOpen(v); if (!v) setRejectingId(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />Reject Listing
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. This will be visible to the owner.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="py-2">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">
              Review Note
            </label>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={4}
              placeholder="e.g. Photos are missing, price is not specified..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary focus:bg-white transition-colors resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Rejecting...</> : "Confirm Rejection"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View modal */}
      <PropertyViewModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        property={viewingProperty}
        isAdmin
      />
    </div>
  );
}
