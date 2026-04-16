"use client";

import React, { useState, useEffect } from "react";
import {
  useAdminJobs, useAdminDeleteJob, useAdminApproveJob,
  useAdminRejectJob, useAdminFeatureJob, useAdminCreateJob, useAdminUpdateJob,
  type Job,
} from "@/hooks/use-admin-jobs";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, MoreHorizontal, Eye, Edit, Trash2, PlusCircle, Briefcase,
  CheckCircle, XCircle, Star, StarOff, MapPin, Loader2, Building,
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

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending_review", label: "Pending Review" },
  { value: "active", label: "Active" },
  { value: "rejected", label: "Rejected" },
  { value: "draft", label: "Draft" },
  { value: "closed", label: "Closed" },
];

const JOB_TYPES = ["full_time", "part_time", "contract", "internship", "remote", "hybrid"];
const EXPERIENCE_LEVELS = ["entry", "junior", "mid", "senior", "lead", "executive"];

interface JobFormData {
  title: string;
  company_name: string;
  city: string;
  location: string;
  job_type: string;
  experience_level: string;
  salary_min: string;
  salary_max: string;
  salary_currency: string;
  category: string;
  description: string;
  requirements: string;
  deadline: string;
  status: string;
  pdf_url: string;
}

const DEFAULT_FORM: JobFormData = {
  title: "", company_name: "", city: "", location: "",
  job_type: "full_time", experience_level: "mid",
  salary_min: "", salary_max: "", salary_currency: "USD",
  category: "", description: "", requirements: "", deadline: "", status: "pending_review", pdf_url: "",
};

function JobFormModal({
  open, onClose, job,
}: { open: boolean; onClose: () => void; job: Job | null }) {
  const createMutation = useAdminCreateJob();
  const updateMutation = useAdminUpdateJob();
  const isEditing = !!job;
  const [form, setForm] = useState<JobFormData>(
    job ? {
      title: job.title || "", 
      company_name: job.company_name || job.company?.company_name || "",
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
      status: job.status || "pending_review",
      pdf_url: job.pdf_url || "",
    } : DEFAULT_FORM
  );

  useEffect(() => {
    if (open) {
      if (job) {
        setForm({
          title: job.title || "",
          company_name: job.company_name || job.company?.company_name || "",
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
          status: job.status || "pending_review",
          pdf_url: job.pdf_url || "",
        });
      } else {
        setForm(DEFAULT_FORM);
      }
    }
  }, [open, job]);

  const set = (k: keyof JobFormData, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.category.trim() || !form.city.trim() || !form.description.trim()) {
      toast.error("Title, category, city, and description are required");
      return;
    }
    const payload = {
      ...form,
      qualifications: form.requirements || "",
      application_deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      salary_min: form.salary_min ? parseFloat(form.salary_min) : undefined,
      salary_max: form.salary_max ? parseFloat(form.salary_max) : undefined,
      pdf_url: form.pdf_url,
      is_active: true
    };
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: job.id, payload: payload as any });
      } else {
        await createMutation.mutateAsync(payload as any);
      }
      onClose();
    } catch {}
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

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
                <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Senior Software Engineer" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Company Name *</Label>
                <Input value={form.company_name} onChange={e => set("company_name", e.target.value)} placeholder="Company" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Category</Label>
                <Input value={form.category} onChange={e => set("category", e.target.value)} placeholder="e.g. Technology" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">City</Label>
                <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Location / Address</Label>
                <Input value={form.location} onChange={e => set("location", e.target.value)} placeholder="Location" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Job Type</Label>
                <Select value={form.job_type} onValueChange={v => set("job_type", v)}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{JOB_TYPES.map(t => <SelectItem key={t} value={t}>{(t || "").replace("_", " ")}</SelectItem>)}</SelectContent>
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
                    {STATUS_OPTIONS.filter(s => s.value).map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
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
              <div className="col-span-2">
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Job PDF Document</Label>
                <SingleFileUpload
                  value={form.pdf_url}
                  onChange={(url) => set("pdf_url", url)}
                  maxSizeMb={10}
                  emptyTitle="Upload job attachment PDF"
                  emptyHint="PDF only, up to 10MB"
                />
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="px-6 py-4 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={onClose} className="text-[13px]">Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={isPending} className="text-[13px] gap-1.5">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEditing ? "Save Changes" : "Post Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViewJobModal({ job, open, onClose }: { job: Job | null; open: boolean; onClose: () => void }) {
  if (!job) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-gray-100">
          <DialogTitle className="text-base font-semibold">{job.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Review the selected job listing details.
          </DialogDescription>
          <p className="text-[12px] text-gray-400">{job.company_name} · {job.city}</p>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh]">
          <div className="px-6 py-4 space-y-3 text-[13px]">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Status", value: <Badge className={cn("text-[11px] border", STATUS_STYLES[job.status] ?? "")}>{(job.status || "").replace(/_/g," ")}</Badge> },
                { label: "Job Type", value: job.job_type?.replace(/_/g," ") || "—" },
                { label: "Experience", value: job.experience_level || "—" },
                { label: "Category", value: job.category || "—" },
                { label: "Salary", value: job.salary_min ? `${job.salary_currency} ${job.salary_min.toLocaleString()}${job.salary_max ? ` – ${job.salary_max.toLocaleString()}` : ""}` : "—" },
                { label: "Deadline", value: job.deadline ? format(new Date(job.deadline), "dd MMM yyyy") : "—" },
                { label: "Views", value: job.views || 0 },
                { label: "Applications", value: job.applications_count || 0 },
                { label: "Posted", value: format(new Date(job.created_at), "dd MMM yyyy") },
                { label: "Featured", value: job.is_featured ? "Yes" : "No" },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{label}</span>
                  <span className="text-gray-800 font-medium">{value as React.ReactNode}</span>
                </div>
              ))}
            </div>
            {job.description && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">Description</p>
                <p className="text-gray-600 leading-relaxed text-[13px]">{job.description}</p>
              </div>
            )}
            {job.requirements && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">Requirements</p>
                <p className="text-gray-600 leading-relaxed text-[13px]">{job.requirements}</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="px-6 py-3 border-t border-gray-100">
          <Button size="sm" onClick={onClose} className="text-[13px]">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminJobsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);

  const { data, isLoading } = useAdminJobs({ page, page_size: 20, search, status });
  const deleteMutation = useAdminDeleteJob();
  const approveMutation = useAdminApproveJob();
  const rejectMutation = useAdminRejectJob();
  const featureMutation = useAdminFeatureJob();

  const jobs = data?.data ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalItems = data?.total_items ?? 0;

  const handleCreate = () => { setEditingJob(null); setFormOpen(true); };
  const handleEdit = (j: Job) => { setEditingJob(j); setFormOpen(true); };
  const handleView = (j: Job) => { setViewingJob(j); setViewOpen(true); };
  const handleDelete = (j: Job) => { setDeletingJob(j); setDeleteOpen(true); };
  const confirmDelete = () => {
    if (!deletingJob) return;
    deleteMutation.mutate(deletingJob.id, {
      onSuccess: () => { setDeleteOpen(false); setDeletingJob(null); },
    });
  };

  const anyLoading = approveMutation.isPending || rejectMutation.isPending || featureMutation.isPending;

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">All Jobs</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage all job listings on the platform</p>
        </div>
        <Button onClick={handleCreate} className="gap-2 text-[13px]">
          <PlusCircle className="h-4 w-4" />
          Post Job
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9 text-[13px]"
          />
        </div>
        <Select value={status || "all"} onValueChange={v => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[180px] text-[13px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s.value || "all"} value={s.value || "all"}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Job Listings</CardTitle>
              <CardDescription className="text-xs">{totalItems} total jobs</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Job</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Company</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Type</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Salary</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Views</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Posted</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(8)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                    </TableRow>
                  ))
                ) : jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                      <Briefcase className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                      No jobs found
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map(job => {
                    const isRowLoading =
                      (approveMutation.isPending && approveMutation.variables === job.id) ||
                      (rejectMutation.isPending && rejectMutation.variables?.id === job.id) ||
                      (featureMutation.isPending && featureMutation.variables === job.id) ||
                      (deleteMutation.isPending && deletingJob?.id === job.id);
                    return (
                      <TableRow key={job.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell>
                          <div>
                            <p className="text-[13px] font-semibold text-gray-900 max-w-[180px] truncate">{job.title}</p>
                            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />{job.city || "—"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-gray-100 flex items-center justify-center shrink-0">
                              <Building className="h-3 w-3 text-gray-400" />
                            </div>
                            <span className="text-[13px] text-gray-600 max-w-[120px] truncate">{job.company_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[13px] text-gray-600 capitalize">{job.job_type?.replace(/_/g, " ") || "—"}</TableCell>
                        <TableCell className="text-[13px] text-gray-600">
                          {job.salary_min ? `${job.salary_currency} ${job.salary_min.toLocaleString()}` : "—"}
                        </TableCell>
                        <TableCell className="text-[13px] text-gray-500">{job.views || 0}</TableCell>
                        <TableCell className="text-[13px] text-gray-500 whitespace-nowrap">{format(new Date(job.created_at), "dd MMM yyyy")}</TableCell>
                        <TableCell>
                          <Badge className={cn("text-[11px] border font-medium capitalize", STATUS_STYLES[job.status] ?? "bg-gray-50 text-gray-600 border-gray-200")}>
                            {(job.status || "active").replace(/_/g, " ")}
                          </Badge>
                          {job.is_featured && (
                            <Badge className="ml-1 text-[11px] border bg-yellow-50 text-yellow-700 border-yellow-200">
                              <Star className="h-2.5 w-2.5 mr-0.5" />Featured
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isRowLoading ? (
                            <div className="flex justify-end p-2">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            </div>
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
                                <DropdownMenuItem onClick={() => handleView(job)}>
                                  <Eye className="mr-2 h-4 w-4" />View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(job)}>
                                  <Edit className="mr-2 h-4 w-4" />Edit Job
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {job.status !== "active" && (
                                  <DropdownMenuItem onClick={() => approveMutation.mutate(job.id)}>
                                    <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                                    <span className="text-emerald-700">Approve</span>
                                  </DropdownMenuItem>
                                )}
                                {job.status === "active" && (
                                  <DropdownMenuItem onClick={() => rejectMutation.mutate({ id: job.id })}>
                                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                    <span className="text-red-700">Reject</span>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => featureMutation.mutate(job.id)}>
                                  {job.is_featured ? <><StarOff className="mr-2 h-4 w-4" />Remove Featured</> : <><Star className="mr-2 h-4 w-4" />Mark Featured</>}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(job)}>
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
              <p className="text-xs text-gray-500">Page {page} of {totalPages} · {totalItems} jobs</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <JobFormModal key={editingJob ? editingJob.id : "new"} open={formOpen} onClose={() => setFormOpen(false)} job={editingJob} />
      <ViewJobModal open={viewOpen} onClose={() => setViewOpen(false)} job={viewingJob} />
      <DeleteConfirmModal
        open={deleteOpen}
        onOpenChange={v => { setDeleteOpen(v); if (!v) setDeletingJob(null); }}
        onConfirm={confirmDelete}
        title="Delete Job"
        itemName={deletingJob?.title}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
