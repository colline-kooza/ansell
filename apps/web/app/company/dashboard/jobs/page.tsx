"use client";

import React, { useState, useEffect } from "react";
import {
  useCompanyJobs, useCompanyCreateJob, useCompanyUpdateJob,
  useCompanyDeleteJob,
} from "@/hooks/use-companies";
import type { Job } from "@/hooks/use-admin-jobs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, MoreHorizontal, Edit, Trash2, PlusCircle,
  Briefcase, MapPin, Loader2,
} from "lucide-react";
import { SingleFileUpload } from "@/components/shared/single-file-upload";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DeleteConfirmModal } from "@/components/shared/delete-confirm-modal";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  draft: "bg-blue-50 text-blue-700 border-blue-200",
  closed: "bg-gray-50 text-gray-600 border-gray-200",
};

const JOB_TYPES = ["full_time", "part_time", "contract", "internship", "remote", "hybrid"];
const EXPERIENCE_LEVELS = ["entry", "junior", "mid", "senior", "lead", "executive"];

interface FormData {
  title: string; company_name: string; city: string; location: string;
  job_type: string; experience_level: string;
  salary_min: string; salary_max: string; salary_currency: string;
  category: string; description: string; requirements: string;
  deadline: string; status: string; pdf_url: string;
}

const DEFAULT_FORM: FormData = {
  title: "", company_name: "", city: "", location: "",
  job_type: "full_time", experience_level: "mid",
  salary_min: "", salary_max: "", salary_currency: "USD",
  category: "", description: "", requirements: "", deadline: "", status: "draft", pdf_url: "",
};

function JobFormModal({ open, onClose, job }: { open: boolean; onClose: () => void; job: Job | null }) {
  const createMutation = useCompanyCreateJob();
  const updateMutation = useCompanyUpdateJob();
  const isEditing = !!job;
  const [pdfUploading, setPdfUploading] = useState(false);
  const [form, setForm] = useState<FormData>(
    job ? {
      title: job.title, company_name: job.company_name || "", city: job.city || "", location: job.location || "",
      job_type: job.job_type || "full_time", experience_level: job.experience_level || "mid",
      salary_min: job.salary_min ? String(job.salary_min) : "", salary_max: job.salary_max ? String(job.salary_max) : "",
      salary_currency: job.salary_currency || "USD", category: job.category || "",
      description: job.description || "", requirements: job.requirements || job.qualifications || "",
      deadline: job.deadline ? job.deadline.slice(0, 10) : "", status: job.status,
      pdf_url: job.pdf_url || (job as any).pdfUrl || (job as any).PdfUrl || "",
    } : DEFAULT_FORM
  );

  useEffect(() => {
    if (!open) return;

    if (job) {
      setForm({
        title: job.title,
        company_name: job.company_name || "",
        city: job.city || "",
        location: job.location || "",
        job_type: job.job_type || "full_time",
        experience_level: job.experience_level || "mid",
        salary_min: job.salary_min ? String(job.salary_min) : "",
        salary_max: job.salary_max ? String(job.salary_max) : "",
        salary_currency: job.salary_currency || "USD",
        category: job.category || "",
        description: job.description || "",
        requirements: job.requirements || job.qualifications || "",
        deadline: job.deadline ? job.deadline.slice(0, 10) : "",
        status: job.status || "draft",
        pdf_url: job.pdf_url || (job as any).pdfUrl || (job as any).PdfUrl || "",
      });
      return;
    }

    setForm(DEFAULT_FORM);
  }, [job, open]);

  const set = (k: keyof FormData, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.category.trim() || !form.city.trim() || !form.description.trim()) {
      toast.error("Title, category, city, and description are required");
      return;
    }

    const payload = {
      ...form,
      qualifications: form.requirements || "",
      salary_min: form.salary_min ? Number(form.salary_min) : undefined,
      salary_max: form.salary_max ? Number(form.salary_max) : undefined,
      deadline: form.deadline || undefined,
      pdf_url: form.pdf_url,
    };
    try {
      if (isEditing) await updateMutation.mutateAsync({ id: job.id, payload });
      else await createMutation.mutateAsync(payload as Partial<Job>);
      onClose();
    } catch {}
  };

  const isPending = createMutation.isPending || updateMutation.isPending || pdfUploading;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="text-base font-semibold">{isEditing ? "Edit Job" : "Post New Job"}</DialogTitle>
          <DialogDescription className="sr-only">
            Fill in the job details and optionally upload a PDF attachment.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Job Title *</Label>
                <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Software Engineer" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">City / Location</Label>
                <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Category</Label>
                <Input value={form.category} onChange={e => set("category", e.target.value)} placeholder="e.g. Technology" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Job Type</Label>
                <Select value={form.job_type} onValueChange={v => set("job_type", v)}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{JOB_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Experience Level</Label>
                <Select value={form.experience_level} onValueChange={v => set("experience_level", v)}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{EXPERIENCE_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Salary Min</Label>
                <Input type="number" value={form.salary_min} onChange={e => set("salary_min", e.target.value)} placeholder="0" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Salary Max</Label>
                <Input type="number" value={form.salary_max} onChange={e => set("salary_max", e.target.value)} placeholder="0" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Currency</Label>
                <Input value={form.salary_currency} onChange={e => set("salary_currency", e.target.value)} placeholder="USD" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Application Deadline</Label>
                <Input type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)} className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["draft", "pending_review"].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Job Description</Label>
                <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4} placeholder="Describe the role..." className="text-[13px] resize-none" />
              </div>
              <div className="col-span-2">
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Requirements</Label>
                <Textarea value={form.requirements} onChange={e => set("requirements", e.target.value)} rows={3} placeholder="List requirements..." className="text-[13px] resize-none" />
              </div>
              {/* PDF Upload */}
              <div className="col-span-2">
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Job PDF Document</Label>
                <SingleFileUpload
                  value={form.pdf_url}
                  onChange={(url) => set("pdf_url", url)}
                  onUploading={setPdfUploading}
                  maxSizeMb={10}
                  emptyTitle="Upload job attachment PDF"
                  emptyHint="PDF only, up to 10MB"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="px-6 py-4 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={onClose} className="text-[13px]">Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={isPending} className="text-[13px] gap-1.5">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {pdfUploading ? "Uploading PDF..." : isEditing ? "Save Changes" : "Post Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CompanyJobsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);

  const { data, isLoading } = useCompanyJobs({ page, page_size: 20, search, status });
  const deleteMutation = useCompanyDeleteJob();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("new") === "1") {
        setEditingJob(null);
        setFormOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const jobs = data?.data ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalItems = data?.total_items ?? 0;

  const confirmDelete = () => {
    if (!deletingJob) return;
    deleteMutation.mutate(deletingJob.id, { onSuccess: () => { setDeleteOpen(false); setDeletingJob(null); } });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Job Listings</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage your posted job openings</p>
        </div>
        <Button onClick={() => { setEditingJob(null); setFormOpen(true); }} className="gap-2 text-[13px]">
          <PlusCircle className="h-4 w-4" />Post Job
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search jobs..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 text-[13px]" />
        </div>
        <Select value={status || "all"} onValueChange={v => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[160px] text-[13px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {[{ v: "all", l: "All" }, { v: "draft", l: "Draft" }, { v: "pending_review", l: "Pending" }, { v: "active", l: "Active" }, { v: "closed", l: "Closed" }].map(s => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Your Jobs</CardTitle>
          <CardDescription className="text-xs">{totalItems} total listings</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Job Title</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Type</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Applications</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Deadline</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(4)].map((_, i) => <TableRow key={i}>{[...Array(6)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
                ) : jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                      <Briefcase className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                      <p>No jobs posted yet</p>
                      <Button onClick={() => setFormOpen(true)} variant="link" className="text-[13px] text-primary mt-1">Post your first job</Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map(job => (
                    <TableRow key={job.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900 max-w-[200px] truncate">{job.title}</p>
                          <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />{job.city || "Remote"}
                          </p>
                          {job.pdf_url && (
                            <p className="mt-1 text-[11px] font-medium text-primary">PDF attached</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-500 capitalize">{job.job_type?.replace(/_/g, " ") || "—"}</TableCell>
                      <TableCell className="text-[13px] text-gray-500">{job.applications_count || 0}</TableCell>
                      <TableCell className="text-[13px] text-gray-500 whitespace-nowrap">
                        {job.deadline ? format(new Date(job.deadline), "dd MMM yyyy") : "No deadline"}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-[11px] border capitalize", STATUS_STYLES[job.status] ?? "")}>{job.status?.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => { setEditingJob(job); setFormOpen(true); }}>
                              <Edit className="mr-2 h-4 w-4" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => { setDeletingJob(job); setDeleteOpen(true); }}>
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

      <JobFormModal open={formOpen} onClose={() => setFormOpen(false)} job={editingJob} />
      <DeleteConfirmModal open={deleteOpen} onOpenChange={v => { setDeleteOpen(v); if (!v) setDeletingJob(null); }} onConfirm={confirmDelete} title="Delete Job" itemName={deletingJob?.title} isLoading={deleteMutation.isPending} />
    </div>
  );
}
