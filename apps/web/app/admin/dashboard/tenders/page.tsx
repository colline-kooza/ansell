"use client";

import React, { useState, useEffect } from "react";
import {
  useAdminTenders, useAdminCreateTender, useAdminUpdateTender,
  useAdminDeleteTender, useAdminApproveTender, useAdminRejectTender, useAdminFeatureTender,
} from "@/hooks/use-admin-tenders";
import type { Tender } from "@/hooks/use-tenders";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, MoreHorizontal, Eye, Edit, Trash2, PlusCircle, FileText,
  CheckCircle, XCircle, Star, StarOff, Loader2, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DeleteConfirmModal } from "@/components/shared/delete-confirm-modal";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  open: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  closed: "bg-gray-50 text-gray-600 border-gray-200",
  draft: "bg-blue-50 text-blue-700 border-blue-200",
};

const TENDER_CATEGORIES = ["goods", "services", "construction", "consulting", "ict", "healthcare", "education", "other"];
const TENDER_TYPES = ["open", "restricted", "selective", "single_source", "request_for_proposals"];

interface TenderFormData {
  title: string;
  issuing_organisation: string;
  reference_number: string;
  category: string;
  tender_type: string;
  description: string;
  eligibility_criteria: string;
  required_documents: string;
  value_estimate: string;
  value_currency: string;
  city: string;
  submission_deadline: string;
  tender_open_date: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  weblink: string;
  status: string;
}

const DEFAULT_FORM: TenderFormData = {
  title: "", issuing_organisation: "", reference_number: "", category: "other",
  tender_type: "open", description: "", eligibility_criteria: "", required_documents: "",
  value_estimate: "", value_currency: "USD", city: "", submission_deadline: "",
  tender_open_date: "", contact_person: "", contact_email: "", contact_phone: "",
  weblink: "",
  status: "pending_review",
};

function TenderFormModal({ open, onClose, tender }: { open: boolean; onClose: () => void; tender: Tender | null }) {
  const createMutation = useAdminCreateTender();
  const updateMutation = useAdminUpdateTender();
  const isEditing = !!tender;
  const [form, setForm] = useState<TenderFormData>(
    tender ? {
      title: tender.title, 
      issuing_organisation: tender.issuing_organisation || (tender as any).organization || "",
      reference_number: tender.reference_number || "", 
      category: tender.category || "other",
      tender_type: tender.tender_type || "open", 
      description: tender.description || "",
      eligibility_criteria: tender.eligibility_criteria || "", 
      required_documents: tender.required_documents || "",
      value_estimate: tender.value_estimate ? String(tender.value_estimate) : "", 
      value_currency: tender.value_currency || "USD",
      city: tender.city || "", 
      submission_deadline: (tender.submission_deadline || (tender as any).deadline) ? (tender.submission_deadline || (tender as any).deadline).slice(0, 10) : "",
      tender_open_date: (tender.tender_open_date || (tender as any).open_date) ? (tender.tender_open_date || (tender as any).open_date).slice(0, 10) : "",
      contact_person: tender.contact_person || "", 
      contact_email: tender.contact_email || "",
      contact_phone: tender.contact_phone || "",
      weblink: tender.weblink || "",
      status: tender.status,
    } : DEFAULT_FORM
  );

  useEffect(() => {
    if (open) {
      if (tender) {
        setForm({
          title: tender.title,
          issuing_organisation: tender.issuing_organisation || (tender as any).organization || "",
          reference_number: tender.reference_number || "",
          category: tender.category || "other",
          tender_type: tender.tender_type || "open",
          description: tender.description || "",
          eligibility_criteria: tender.eligibility_criteria || "",
          required_documents: tender.required_documents || "",
          value_estimate: tender.value_estimate ? String(tender.value_estimate) : "",
          value_currency: tender.value_currency || "USD",
          city: tender.city || "",
          submission_deadline: (tender.submission_deadline || (tender as any).deadline) ? (tender.submission_deadline || (tender as any).deadline).slice(0, 10) : "",
          tender_open_date: (tender.tender_open_date || (tender as any).open_date) ? (tender.tender_open_date || (tender as any).open_date).slice(0, 10) : "",
          contact_person: tender.contact_person || "",
          contact_email: tender.contact_email || "",
          contact_phone: tender.contact_phone || "",
          weblink: tender.weblink || "",
          status: tender.status,
        });
      } else {
        setForm(DEFAULT_FORM);
      }
    }
  }, [open, tender]);

  const set = (k: keyof TenderFormData, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.issuing_organisation.trim()) {
      toast.error("Title and Issuing Organisation are required");
      return;
    }
    const payload = {
      ...form,
      value_estimate: form.value_estimate ? parseFloat(form.value_estimate) : 0,
      submission_deadline: form.submission_deadline ? new Date(form.submission_deadline).toISOString() : undefined,
      tender_open_date: form.tender_open_date ? new Date(form.tender_open_date).toISOString() : undefined,
      bid_opening_date: (form as any).bid_opening_date ? new Date((form as any).bid_opening_date).toISOString() : undefined,
    };
    if (!payload.submission_deadline) {
      toast.error("Submission deadline is required");
      return;
    }
    try {
      if (isEditing) await updateMutation.mutateAsync({ id: tender.id, payload });
      else await createMutation.mutateAsync(payload as Partial<Tender>);
      onClose();
    } catch {}
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="text-base font-semibold">{isEditing ? "Edit Tender" : "Create New Tender"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Tender Title *</Label>
                <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Tender title" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Issuing Organisation *</Label>
                <Input value={form.issuing_organisation} onChange={e => set("issuing_organisation", e.target.value)} placeholder="Organisation name" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Reference Number</Label>
                <Input value={form.reference_number} onChange={e => set("reference_number", e.target.value)} placeholder="REF/2024/001" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Category</Label>
                <Select value={form.category} onValueChange={v => set("category", v)}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{TENDER_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Tender Type</Label>
                <Select value={form.tender_type} onValueChange={v => set("tender_type", v)}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{TENDER_TYPES.map(t => <SelectItem key={t} value={t}>{(t || "").replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">City / Location</Label>
                <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Value Estimate</Label>
                <Input type="number" value={form.value_estimate} onChange={e => set("value_estimate", e.target.value)} placeholder="0" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Currency</Label>
                <Input value={form.value_currency} onChange={e => set("value_currency", e.target.value)} placeholder="USD" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Open Date</Label>
                <Input type="date" value={form.tender_open_date} onChange={e => set("tender_open_date", e.target.value)} className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Submission Deadline</Label>
                <Input type="date" value={form.submission_deadline} onChange={e => set("submission_deadline", e.target.value)} className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Contact Person</Label>
                <Input value={form.contact_person} onChange={e => set("contact_person", e.target.value)} placeholder="Name" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Contact Email</Label>
                <Input value={form.contact_email} onChange={e => set("contact_email", e.target.value)} placeholder="email@org.com" className="h-9 text-[13px]" />
              </div>
              <div className="col-span-2">
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Public Tender Web Link</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <Input value={form.weblink} onChange={e => set("weblink", e.target.value)} placeholder="https://example.com/tenders/notice" className="h-9 text-[13px] pl-9" />
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["pending_review", "active", "open", "closed", "rejected"].map(s => <SelectItem key={s} value={s}>{(s || "").replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Description</Label>
                <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Tender description..." className="text-[13px] resize-none" />
              </div>
              <div className="col-span-2">
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Eligibility Criteria</Label>
                <Textarea value={form.eligibility_criteria} onChange={e => set("eligibility_criteria", e.target.value)} rows={2} placeholder="Who can bid..." className="text-[13px] resize-none" />
              </div>
              <div className="col-span-2">
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Required Documents</Label>
                <Textarea value={form.required_documents} onChange={e => set("required_documents", e.target.value)} rows={2} placeholder="Documents to submit..." className="text-[13px] resize-none" />
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="px-6 py-4 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={onClose} className="text-[13px]">Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={isPending} className="text-[13px] gap-1.5">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Tender"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminTendersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingTender, setEditingTender] = useState<Tender | null>(null);
  const [deletingTender, setDeletingTender] = useState<Tender | null>(null);

  const { data, isLoading } = useAdminTenders({ page, page_size: 20, search, status });
  const deleteMutation = useAdminDeleteTender();
  const approveMutation = useAdminApproveTender();
  const rejectMutation = useAdminRejectTender();
  const featureMutation = useAdminFeatureTender();

  const tenders = data?.data ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalItems = data?.total_items ?? 0;

  const anyLoading = approveMutation.isPending || rejectMutation.isPending || featureMutation.isPending;

  const confirmDelete = () => {
    if (!deletingTender) return;
    deleteMutation.mutate(deletingTender.id, {
      onSuccess: () => { setDeleteOpen(false); setDeletingTender(null); },
    });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tenders</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage all procurement tenders</p>
        </div>
        <Button onClick={() => { setEditingTender(null); setFormOpen(true); }} className="gap-2 text-[13px]">
          <PlusCircle className="h-4 w-4" />Create Tender
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search tenders..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 text-[13px]" />
        </div>
        <Select value={status || "all"} onValueChange={v => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[180px] text-[13px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            {[{ v: "all", l: "All Statuses" }, { v: "pending_review", l: "Pending" }, { v: "active", l: "Active" }, { v: "closed", l: "Closed" }, { v: "rejected", l: "Rejected" }].map(s => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Tenders</CardTitle>
          <CardDescription className="text-xs">{totalItems} total tenders</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Tender</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Organisation</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Category</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Deadline</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Bids</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>{[...Array(7)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : tenders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                      <FileText className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                      No tenders found
                    </TableCell>
                  </TableRow>
                ) : (
                  tenders.map(tender => {
                    const isRowLoading =
                      (approveMutation.isPending && approveMutation.variables === tender.id) ||
                      (rejectMutation.isPending && rejectMutation.variables?.id === tender.id) ||
                      (featureMutation.isPending && featureMutation.variables === tender.id) ||
                      (deleteMutation.isPending && deletingTender?.id === tender.id);
                    return (
                      <TableRow key={tender.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <p className="text-[13px] font-semibold text-gray-900 max-w-[200px] truncate">{tender.title}</p>
                            <p className="text-[11px] text-gray-400">Ref: {tender.reference_number || "—"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-[13px] text-gray-600 max-w-[150px] truncate">{tender.issuing_organisation}</TableCell>
                        <TableCell className="text-[13px] text-gray-500 capitalize">{tender.category || "—"}</TableCell>
                        <TableCell className="text-[13px] text-gray-500 whitespace-nowrap">
                          {tender.submission_deadline ? format(new Date(tender.submission_deadline), "dd MMM yyyy") : "—"}
                        </TableCell>
                        <TableCell className="text-[13px] text-gray-500">{tender.bid_count || 0}</TableCell>
                        <TableCell>
                          <Badge className={cn("text-[11px] border font-medium capitalize", STATUS_STYLES[tender.status] ?? "")}>{(tender.status || "active").replace(/_/g," ")}</Badge>
                          {tender.is_featured && <Badge className="ml-1 text-[11px] bg-yellow-50 text-yellow-700 border-yellow-200 border"><Star className="h-2.5 w-2.5 mr-0.5" />Featured</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          {isRowLoading ? (
                            <div className="flex justify-end p-2"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={anyLoading}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel className="text-xs font-semibold">Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setEditingTender(tender); setFormOpen(true); }}>
                                  <Edit className="mr-2 h-4 w-4" />Edit Tender
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {tender.status !== "active" && tender.status !== "open" && (
                                  <DropdownMenuItem onClick={() => approveMutation.mutate(tender.id)}>
                                    <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                                    <span className="text-emerald-700">Approve</span>
                                  </DropdownMenuItem>
                                )}
                                {(tender.status === "active" || tender.status === "open") && (
                                  <DropdownMenuItem onClick={() => rejectMutation.mutate({ id: tender.id })}>
                                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                    <span className="text-red-700">Reject</span>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => featureMutation.mutate(tender.id)}>
                                  {tender.is_featured ? <><StarOff className="mr-2 h-4 w-4" />Remove Featured</> : <><Star className="mr-2 h-4 w-4" />Mark Featured</>}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => { setDeletingTender(tender); setDeleteOpen(true); }}>
                                  <Trash2 className="mr-2 h-4 w-4" />Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
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

      <TenderFormModal key={editingTender ? editingTender.id : "new"} open={formOpen} onClose={() => setFormOpen(false)} tender={editingTender} />
      <DeleteConfirmModal
        open={deleteOpen}
        onOpenChange={v => { setDeleteOpen(v); if (!v) setDeletingTender(null); }}
        onConfirm={confirmDelete}
        title="Delete Tender"
        itemName={deletingTender?.title}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
