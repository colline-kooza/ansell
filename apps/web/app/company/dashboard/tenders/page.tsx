"use client";

import React, { useEffect, useState } from "react";
import {
  useCompanyTenders,
  useCompanyCreateTender,
  useCompanyUpdateTender,
  useCompanyDeleteTender,
  useMyCompany,
} from "@/hooks/use-companies";
import type { Tender } from "@/hooks/use-tenders";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Eye,
  FileText,
  Globe,
  Loader2,
  MapPin,
  MoreHorizontal,
  PlusCircle,
  Search,
  Tag,
  Trash2,
  Edit,
} from "lucide-react";
import { DeleteConfirmModal } from "@/components/shared/delete-confirm-modal";
import { SingleFileUpload } from "@/components/shared/single-file-upload";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  open: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
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
  attachment_url: string;
  status: string;
}

const DEFAULT_FORM: TenderFormData = {
  title: "",
  issuing_organisation: "",
  reference_number: "",
  category: "other",
  tender_type: "open",
  description: "",
  eligibility_criteria: "",
  required_documents: "",
  value_estimate: "",
  value_currency: "USD",
  city: "",
  submission_deadline: "",
  tender_open_date: "",
  contact_person: "",
  contact_email: "",
  contact_phone: "",
  weblink: "",
  attachment_url: "",
  status: "draft",
};

function TenderFormModal({ open, onClose, tender }: { open: boolean; onClose: () => void; tender: Tender | null }) {
  const { data: company } = useMyCompany();
  const createMutation = useCompanyCreateTender();
  const updateMutation = useCompanyUpdateTender();
  const isEditing = !!tender;
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [form, setForm] = useState<TenderFormData>(DEFAULT_FORM);
  const statusOptions = Array.from(new Set(["draft", "pending_review", ...(tender?.status && !["draft", "pending_review"].includes(tender.status) ? [tender.status] : [])]));

  useEffect(() => {
    if (!open) return;

    if (tender) {
      setForm({
        title: tender.title,
        issuing_organisation: tender.issuing_organisation || company?.company_name || "",
        reference_number: tender.reference_number || "",
        category: tender.category || "other",
        tender_type: tender.tender_type || "open",
        description: tender.description || "",
        eligibility_criteria: tender.eligibility_criteria || "",
        required_documents: tender.required_documents || "",
        value_estimate: tender.value_estimate ? String(tender.value_estimate) : "",
        value_currency: tender.value_currency || "USD",
        city: tender.city || "",
        submission_deadline: tender.submission_deadline ? tender.submission_deadline.slice(0, 10) : "",
        tender_open_date: tender.tender_open_date ? tender.tender_open_date.slice(0, 10) : "",
        contact_person: tender.contact_person || "",
        contact_email: tender.contact_email || "",
        contact_phone: tender.contact_phone || "",
        weblink: tender.weblink || "",
        attachment_url: tender.attachment_url || "",
        status: tender.status || "draft",
      });
      return;
    }

    setForm({
      ...DEFAULT_FORM,
      issuing_organisation: company?.company_name || "",
      contact_email: company?.email || "",
      contact_phone: company?.phone_number || "",
      city: company?.city || "",
    });
  }, [company?.city, company?.company_name, company?.email, company?.phone_number, open, tender]);

  const set = (key: keyof TenderFormData, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.issuing_organisation.trim() || !form.description.trim() || !form.category.trim() || !form.city.trim()) {
      toast.error("Title, organisation, description, category, and city are required");
      return;
    }
    if (!form.submission_deadline) {
      toast.error("Submission deadline is required");
      return;
    }

    const payload = {
      ...form,
      value_estimate: form.value_estimate ? parseFloat(form.value_estimate) : undefined,
      submission_deadline: new Date(form.submission_deadline).toISOString(),
      tender_open_date: form.tender_open_date ? new Date(form.tender_open_date).toISOString() : undefined,
    };

    try {
      if (tender) {
        await updateMutation.mutateAsync({ id: tender.id, payload });
      } else {
        await createMutation.mutateAsync(payload as Partial<Tender>);
      }
      onClose();
    } catch {}
  };

  const isPending = createMutation.isPending || updateMutation.isPending || attachmentUploading;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="text-base font-semibold">{isEditing ? "Edit Tender" : "Create Tender"}</DialogTitle>
          <DialogDescription className="sr-only">
            Add or edit a tender for your company, including the public tender link and supporting document.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[72vh]">
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="mb-1.5 block text-[11px] text-gray-500">Tender Title *</Label>
                <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Tender title" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] text-gray-500">Issuing Organisation *</Label>
                <Input value={form.issuing_organisation} onChange={(e) => set("issuing_organisation", e.target.value)} placeholder="Company or organisation name" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] text-gray-500">Reference Number</Label>
                <Input value={form.reference_number} onChange={(e) => set("reference_number", e.target.value)} placeholder="REF/2026/001" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] text-gray-500">Category</Label>
                <Select value={form.category} onValueChange={(value) => set("category", value)}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{TENDER_CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] text-gray-500">Tender Type</Label>
                <Select value={form.tender_type} onValueChange={(value) => set("tender_type", value)}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{TENDER_TYPES.map((item) => <SelectItem key={item} value={item}>{item.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] text-gray-500">City / Location</Label>
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] text-gray-500">Value Estimate</Label>
                <Input type="number" value={form.value_estimate} onChange={(e) => set("value_estimate", e.target.value)} placeholder="0" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] text-gray-500">Currency</Label>
                <Input value={form.value_currency} onChange={(e) => set("value_currency", e.target.value)} placeholder="USD" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] text-gray-500">Open Date</Label>
                <Input type="date" value={form.tender_open_date} onChange={(e) => set("tender_open_date", e.target.value)} className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] text-gray-500">Submission Deadline *</Label>
                <Input type="date" value={form.submission_deadline} onChange={(e) => set("submission_deadline", e.target.value)} className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] text-gray-500">Contact Person</Label>
                <Input value={form.contact_person} onChange={(e) => set("contact_person", e.target.value)} placeholder="Name" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] text-gray-500">Contact Email</Label>
                <Input value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} placeholder="name@company.com" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] text-gray-500">Contact Phone</Label>
                <Input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} placeholder="+211 ..." className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="mb-1.5 block text-[11px] text-gray-500">Status</Label>
                <Select value={form.status} onValueChange={(value) => set("status", value)}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((item) => (
                      <SelectItem key={item} value={item}>{item.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block text-[11px] text-gray-500">Public Tender Web Link</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <Input value={form.weblink} onChange={(e) => set("weblink", e.target.value)} placeholder="https://example.com/tenders/notice" className="h-9 pl-9 text-[13px]" />
                </div>
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block text-[11px] text-gray-500">Tender Description</Label>
                <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="Describe the tender scope..." className="resize-none text-[13px]" />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block text-[11px] text-gray-500">Eligibility Criteria</Label>
                <Textarea value={form.eligibility_criteria} onChange={(e) => set("eligibility_criteria", e.target.value)} rows={3} placeholder="Who can apply..." className="resize-none text-[13px]" />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block text-[11px] text-gray-500">Required Documents</Label>
                <Textarea value={form.required_documents} onChange={(e) => set("required_documents", e.target.value)} rows={3} placeholder="List the required submission documents..." className="resize-none text-[13px]" />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block text-[11px] text-gray-500">Tender Document</Label>
                <SingleFileUpload
                  value={form.attachment_url}
                  onChange={(value) => set("attachment_url", value)}
                  onUploading={setAttachmentUploading}
                  maxSizeMb={10}
                  emptyTitle="Upload tender attachment"
                  emptyHint="PDF only, up to 10MB"
                />
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="border-t border-gray-100 px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose} className="text-[13px]">Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={isPending} className="gap-1.5 text-[13px]">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {attachmentUploading ? "Uploading..." : isEditing ? "Save Changes" : "Create Tender"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CompanyTendersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingTender, setEditingTender] = useState<Tender | null>(null);
  const [deletingTender, setDeletingTender] = useState<Tender | null>(null);

  const { data, isLoading } = useCompanyTenders({ page, page_size: 20, search, status });
  const deleteMutation = useCompanyDeleteTender();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("new") === "1") {
      setEditingTender(null);
      setFormOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const tenders = data?.data ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalItems = data?.total_items ?? 0;

  const confirmDelete = () => {
    if (!deletingTender) return;
    deleteMutation.mutate(deletingTender.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setDeletingTender(null);
      },
    });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Company Tenders</h1>
          <p className="mt-0.5 text-xs text-gray-500">Create, update, and track tenders published by your company</p>
        </div>
        <Button onClick={() => { setEditingTender(null); setFormOpen(true); }} className="gap-2 text-[13px]">
          <PlusCircle className="h-4 w-4" />Create Tender
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search tenders..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-9 pl-9 text-[13px]" />
        </div>
        <Select value={status || "all"} onValueChange={(value) => { setStatus(value === "all" ? "" : value); setPage(1); }}>
          <SelectTrigger className="h-9 w-[170px] text-[13px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {[{ value: "all", label: "All" }, { value: "draft", label: "Draft" }, { value: "pending_review", label: "Pending" }, { value: "active", label: "Active" }, { value: "closed", label: "Closed" }].map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Your Tenders</CardTitle>
          <CardDescription className="text-xs">{totalItems} total tenders</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-hidden border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="text-[12px] font-semibold text-gray-700">Tender</TableHead>
                  <TableHead className="text-[12px] font-semibold text-gray-700">Category</TableHead>
                  <TableHead className="text-[12px] font-semibold text-gray-700">Deadline</TableHead>
                  <TableHead className="text-[12px] font-semibold text-gray-700">Views</TableHead>
                  <TableHead className="text-[12px] font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="text-right text-[12px] font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(4)].map((_, index) => (
                    <TableRow key={index}>{[...Array(6)].map((__, cellIndex) => <TableCell key={cellIndex}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : tenders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-gray-400">
                      <FileText className="mx-auto mb-2 h-10 w-10 text-gray-200" />
                      <p>No tenders created yet</p>
                      <Button onClick={() => setFormOpen(true)} variant="link" className="mt-1 text-[13px] text-primary">Create your first tender</Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  tenders.map((tender) => (
                    <TableRow key={tender.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="max-w-[240px] truncate text-[13px] font-semibold text-gray-900">{tender.title}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{tender.city || "No city"}</span>
                            {tender.weblink && <span className="flex items-center gap-1 text-primary"><Globe className="h-3 w-3" />Web link</span>}
                            {tender.attachment_url && <span className="flex items-center gap-1 text-primary"><FileText className="h-3 w-3" />Attachment</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-500 capitalize">
                        <span className="inline-flex items-center gap-1">
                          <Tag className="h-3.5 w-3.5 text-gray-400" />
                          {tender.category || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-[13px] text-gray-500">
                        {tender.submission_deadline ? (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {format(new Date(tender.submission_deadline), "dd MMM yyyy")}
                          </span>
                        ) : "N/A"}
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5 text-gray-400" />
                          {(tender.views ?? 0).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("border text-[11px] capitalize", STATUS_STYLES[tender.status] ?? "")}>
                          {(tender.status || "draft").replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => { setEditingTender(tender); setFormOpen(true); }}>
                              <Edit className="mr-2 h-4 w-4" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => { setDeletingTender(tender); setDeleteOpen(true); }}>
                              <Trash2 className="mr-2 h-4 w-4" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>Previous</Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TenderFormModal open={formOpen} onClose={() => setFormOpen(false)} tender={editingTender} />
      <DeleteConfirmModal
        open={deleteOpen}
        onOpenChange={(value) => { setDeleteOpen(value); if (!value) setDeletingTender(null); }}
        onConfirm={confirmDelete}
        title="Delete Tender"
        itemName={deletingTender?.title}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
