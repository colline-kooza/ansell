"use client";

import React, { useState } from "react";
import { useAdminTenderBids, useAdminUpdateBidStatus, type TenderBid } from "@/hooks/use-admin-tenders";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Eye, Loader2, FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  shortlisted: "bg-purple-50 text-purple-700 border-purple-200",
  awarded: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  withdrawn: "bg-gray-50 text-gray-600 border-gray-200",
};

const UPDATE_STATUSES = ["pending", "shortlisted", "awarded", "rejected"];

function ViewBidModal({ bid, open, onClose }: { bid: TenderBid | null; open: boolean; onClose: () => void }) {
  const updateMutation = useAdminUpdateBidStatus();
  if (!bid) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-100">
          <DialogTitle className="text-base font-semibold">Bid Details</DialogTitle>
          <p className="text-[12px] text-gray-400">Submitted {format(new Date(bid.submitted_at), "dd MMM yyyy, HH:mm")}</p>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh]">
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              {[
                { label: "Tender", value: bid.tender?.title ?? "—" },
                { label: "Bidder", value: bid.company_name || (bid.bidder ? `${bid.bidder.first_name} ${bid.bidder.last_name}` : "—") },
                { label: "Bid Amount", value: bid.bid_amount ? `${bid.currency} ${bid.bid_amount.toLocaleString()}` : "—" },
                { label: "Status", value: <Badge className={cn("text-[11px] border capitalize", STATUS_STYLES[bid.status] ?? "")}>{bid.status}</Badge> },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                  <div className="text-gray-800 font-medium">{value as React.ReactNode}</div>
                </div>
              ))}
            </div>
            {bid.notes && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-[13px] text-gray-600 leading-relaxed">{bid.notes}</p>
              </div>
            )}
            {bid.proposal_url && (
              <a href={bid.proposal_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[13px] text-primary hover:underline">
                <ExternalLink className="h-3.5 w-3.5" />View Proposal Document
              </a>
            )}
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-2">Update Status</p>
              <div className="flex flex-wrap gap-1.5">
                {UPDATE_STATUSES.map(s => (
                  <Button key={s} size="sm" variant={bid.status === s ? "default" : "outline"}
                    className="h-7 text-[12px] capitalize" disabled={updateMutation.isPending}
                    onClick={() => updateMutation.mutate({ id: bid.id, status: s })}>
                    {updateMutation.isPending && updateMutation.variables?.status === s ? <Loader2 className="h-3 w-3 animate-spin" /> : s}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
          <Button size="sm" onClick={onClose} className="text-[13px]">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminTenderBidsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingBid, setViewingBid] = useState<TenderBid | null>(null);

  const { data, isLoading } = useAdminTenderBids({ page, page_size: 20, status });
  const bids = data?.data ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalItems = data?.total_items ?? 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tender Bids</h1>
        <p className="text-xs text-gray-500 mt-0.5">All bid submissions across tenders</p>
      </div>
      <div className="flex gap-3">
        <Select value={status || "all"} onValueChange={v => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[180px] text-[13px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            {[{ v: "all", l: "All Statuses" }, { v: "pending", l: "Pending" }, { v: "shortlisted", l: "Shortlisted" }, { v: "awarded", l: "Awarded" }, { v: "rejected", l: "Rejected" }].map(s => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Bids</CardTitle>
          <CardDescription className="text-xs">{totalItems} total bids</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Tender</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Bidder</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Bid Amount</TableHead>
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
                ) : bids.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                      <FileText className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                      No bids found
                    </TableCell>
                  </TableRow>
                ) : (
                  bids.map(bid => (
                    <TableRow key={bid.id} className="hover:bg-gray-50">
                      <TableCell className="text-[13px] font-medium text-gray-900 max-w-[180px] truncate">{bid.tender?.title ?? "—"}</TableCell>
                      <TableCell className="text-[13px] text-gray-600">{bid.company_name || (bid.bidder ? `${bid.bidder.first_name} ${bid.bidder.last_name}` : "—")}</TableCell>
                      <TableCell className="text-[13px] text-gray-500">{bid.bid_amount ? `${bid.currency} ${bid.bid_amount.toLocaleString()}` : "—"}</TableCell>
                      <TableCell className="text-[13px] text-gray-500 whitespace-nowrap">{format(new Date(bid.submitted_at), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[11px] border capitalize", STATUS_STYLES[bid.status] ?? "")}>{bid.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-[12px]" onClick={() => { setViewingBid(bid); setViewOpen(true); }}>
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
      <ViewBidModal bid={viewingBid} open={viewOpen} onClose={() => setViewOpen(false)} />
    </div>
  );
}
