"use client";

import React, { useState, useEffect } from "react";
import {
  useAdminCourses, useAdminCreateCourse, useAdminUpdateCourse,
  useAdminDeleteCourse, useAdminPublishCourse, useAdminUnpublishCourse, type Course,
} from "@/hooks/use-admin-content";
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
  Search, MoreHorizontal, Edit, Trash2, PlusCircle, BookOpen,
  Send, Star, StarOff, Loader2, Video, Upload, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DeleteConfirmModal } from "@/components/shared/delete-confirm-modal";
import { MultiImageUpload } from "@/components/shared/multi-image-upload";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-blue-50 text-blue-700 border-blue-200",
  archived: "bg-gray-50 text-gray-600 border-gray-200",
};

const LEVELS = ["beginner", "intermediate", "advanced", "expert"];
const CATEGORIES = [
  "university_college", "scholarships", "telecom_ict", "banking_finance", 
  "agriculture_agribusiness", "construction_infrastructure", "healthcare_medical", 
  "vocational_skills", "other"
];

interface CourseFormData {
  title: string; description: string; category: string; level: string;
  duration_hours: string; price: string; currency: string; instructor_name: string;
  thumbnail_url: string; video_url: string; status: string;
  is_featured: boolean; is_free: boolean; institution_link: string;
}

const DEFAULT_FORM: CourseFormData = {
  title: "", description: "", category: "other", level: "beginner",
  duration_hours: "", price: "", currency: "USD", instructor_name: "",
  thumbnail_url: "", video_url: "", status: "draft", is_featured: false, is_free: false,
  institution_link: "",
};

function CourseFormModal({ open, onClose, course }: { open: boolean; onClose: () => void; course: Course | null }) {
  const createMutation = useAdminCreateCourse();
  const updateMutation = useAdminUpdateCourse();
  const isEditing = !!course;
  const [form, setForm] = useState<CourseFormData>(
    course ? {
      title: course.title,
      description: course.description || course.content || "",
      category: course.category || "other",
      level: course.level || "beginner",
      duration_hours: course.duration_hours ? String(course.duration_hours) : "",
      price: course.price ? String(course.price) : "",
      currency: course.currency || "USD",
      instructor_name: course.instructor_name || (course as any).instructor?.first_name ? `${(course as any).instructor.first_name} ${(course as any).instructor.last_name}` : "",
      thumbnail_url: course.thumbnail_url || (course as any).image_url || "",
      video_url: course.video_url || "",
      status: course.status,
      is_featured: course.is_featured,
      is_free: course.is_free,
      institution_link: (course as any).institution_link || "",
    } : DEFAULT_FORM
  );
  const initialThumbnail = course 
    ? course.thumbnail_url || (course as any).image_url 
    : null;

  const [thumbnails, setThumbnails] = useState<string[]>(
    initialThumbnail ? [initialThumbnail] : []
  );
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState(course?.video_url || "");

  useEffect(() => {
    if (open) {
      if (course) {
        setForm({
          title: course.title,
          description: course.description || course.content || "",
          category: course.category || "other",
          level: (course as any).level || "beginner",
          duration_hours: course.duration_hours ? String(course.duration_hours) : "",
          price: course.price ? String(course.price) : "",
          currency: course.currency || "USD",
          instructor_name: course.instructor_name || (course as any).instructor?.first_name ? `${(course as any).instructor.first_name} ${(course as any).instructor.last_name}` : "",
          thumbnail_url: course.thumbnail_url || (course as any).image_url || "",
          video_url: course.video_url || "",
          status: course.status,
          is_featured: course.is_featured,
          is_free: course.is_free,
          institution_link: (course as any).institution_link || "",
        });
        setThumbnails((course?.thumbnail_url || (course as any)?.image_url) ? [course.thumbnail_url || (course as any).image_url] : []);
        setVideoUrl(course?.video_url || "");
      } else {
        setForm(DEFAULT_FORM);
        setThumbnails([]);
        setVideoUrl("");
      }
    }
  }, [open, course]);

  const set = (k: keyof CourseFormData, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const handleVideoUpload = async (file: File) => {
    if (!file.type.startsWith("video/")) { toast.error("Please select a valid video file"); return; }
    if (file.size > 500 * 1024 * 1024) { toast.error("Video must be < 500MB"); return; }
    setUploadingVideo(true);
    try {
      const signRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
      });
      const { presignedUrl, publicUrl } = await signRes.json();
      await fetch(presignedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setVideoUrl(publicUrl);
      set("video_url", publicUrl);
      toast.success("Video uploaded!");
    } catch {
      toast.error("Failed to upload video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    const payload = {
      ...form,
      provider: form.instructor_name || "Anasell",
      duration: form.duration_hours ? `${form.duration_hours} hours` : "N/A",
      thumbnail_url: thumbnails[0] || "",
      video_url: videoUrl || "",
      price: form.price ? Number(form.price) : 0,
      institution_link: form.institution_link || "",
    };
    try {
      if (isEditing && course) await updateMutation.mutateAsync({ id: course.id, payload: payload as any });
      else await createMutation.mutateAsync(payload as any);
      onClose();
    } catch {}
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="text-base font-semibold">{isEditing ? "Edit Course" : "Create New Course"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[72vh]">
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Title *</Label>
                <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Course title" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Category</Label>
                <Select value={form.category} onValueChange={v => set("category", v)}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{(c || "").replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Level</Label>
                <Select value={form.level} onValueChange={v => set("level", v)}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Duration (hours)</Label>
                <Input type="number" value={form.duration_hours} onChange={e => set("duration_hours", e.target.value)} placeholder="e.g. 10" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Price</Label>
                <Input type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="0" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Currency</Label>
                <Input value={form.currency} onChange={e => set("currency", e.target.value)} placeholder="e.g. USD" maxLength={10} className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Instructor</Label>
                <Input value={form.instructor_name} onChange={e => set("instructor_name", e.target.value)} placeholder="Instructor name" className="h-9 text-[13px]" />
              </div>
              <div className="col-span-2">
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Institution Link (enrollment URL)</Label>
                <Input value={form.institution_link} onChange={e => set("institution_link", e.target.value)} placeholder="https://institution.edu/apply" className="h-9 text-[13px]" type="url" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{["draft","active","archived"].map(s => <SelectItem key={s} value={s}>{s === "active" ? "published" : s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_free} onChange={e => set("is_free", e.target.checked)} className="rounded" />
                  <span className="text-[13px] text-gray-700">Free Course</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={e => set("is_featured", e.target.checked)} className="rounded" />
                  <span className="text-[13px] text-gray-700">Featured</span>
                </label>
              </div>
              <div className="col-span-2">
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Description</Label>
                <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Course description..." className="text-[13px] resize-none" />
              </div>
              <div className="col-span-2">
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Thumbnail Image</Label>
                <MultiImageUpload value={thumbnails} onChange={setThumbnails} maxFiles={1} maxSize={5} />
              </div>
              <div className="col-span-2">
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Course Video</Label>
                {videoUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Video className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-[12px] text-gray-600 flex-1 truncate">{videoUrl}</p>
                    <Button variant="outline" size="sm" className="h-7 text-[12px]" onClick={() => setVideoUrl("")}>Remove</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 h-10 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                      {uploadingVideo ? <><Loader2 className="h-4 w-4 animate-spin text-primary" /> Uploading...</> : <><Upload className="h-4 w-4 text-gray-400" /> <span className="text-[13px] text-gray-500">Upload video file (MP4, WebM)</span></>}
                      <input type="file" className="hidden" accept="video/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f); }} />
                    </label>
                    <span className="text-[12px] text-gray-400">or</span>
                    <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="Paste video URL" className="h-9 text-[13px] flex-1" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="px-6 py-4 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={onClose} className="text-[13px]">Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={isPending || uploadingVideo} className="text-[13px] gap-1.5">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCoursesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

  const { data, isLoading } = useAdminCourses({ page, page_size: 20, search, status });
  const deleteMutation = useAdminDeleteCourse();
  const publishMutation = useAdminPublishCourse();
  const unpublishMutation = useAdminUnpublishCourse();

  const courses = data?.data ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalItems = data?.total_items ?? 0;

  const confirmDelete = () => {
    if (!deletingCourse) return;
    deleteMutation.mutate(deletingCourse.id, { onSuccess: () => { setDeleteOpen(false); setDeletingCourse(null); } });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Courses</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage online learning courses with video content</p>
        </div>
        <Button onClick={() => { setEditingCourse(null); setFormOpen(true); }} className="gap-2 text-[13px]">
          <PlusCircle className="h-4 w-4" />New Course
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search courses..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 text-[13px]" />
        </div>
        <Select value={status || "all"} onValueChange={v => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[160px] text-[13px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {[{ v: "all", l: "All" }, { v: "draft", l: "Draft" }, { v: "active", l: "Active" }, { v: "archived", l: "Archived" }].map(s => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Courses</CardTitle>
          <CardDescription className="text-xs">{totalItems} total</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Course</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Category</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Level</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Price</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Enrollments</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? [...Array(5)].map((_, i) => (
                  <TableRow key={i}>{[...Array(7)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                )) : courses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                      <BookOpen className="h-10 w-10 mx-auto mb-2 text-gray-200" />No courses found
                    </TableCell>
                  </TableRow>
                ) : courses.map(course => (
                  <TableRow key={course.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {course.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={course.thumbnail_url} alt={course.title} className="h-8 w-12 object-cover border border-gray-100 shrink-0" />
                        ) : (
                          <div className="h-8 w-12 bg-gray-100 flex items-center justify-center shrink-0"><BookOpen className="h-3.5 w-3.5 text-gray-400" /></div>
                        )}
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900 max-w-[180px] truncate">{course.title}</p>
                          <p className="text-[11px] text-gray-400">{course.instructor_name || "—"} {course.video_url ? "· 🎬 Video" : ""}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[13px] text-gray-500 capitalize">{(course.category || "").replace(/_/g," ") || "—"}</TableCell>
                    <TableCell className="text-[13px] text-gray-500 capitalize">{course.level || "—"}</TableCell>
                    <TableCell className="text-[13px] text-gray-500">{course.is_free ? "Free" : course.price ? `${course.currency} ${course.price}` : "—"}</TableCell>
                    <TableCell className="text-[13px] text-gray-500">{course.enrollments_count || 0}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-[11px] border font-medium capitalize", STATUS_STYLES[course.status] ?? "")}>{(course.status || "draft").replace(/_/g, " ")}</Badge>
                      {course.is_featured && <Badge className="ml-1 text-[11px] bg-yellow-50 text-yellow-700 border-yellow-200 border"><Star className="h-2.5 w-2.5 mr-0.5" />Featured</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel className="text-xs font-semibold">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setEditingCourse(course); setFormOpen(true); }}>
                            <Edit className="mr-2 h-4 w-4" />Edit
                          </DropdownMenuItem>
                          {course.status !== "active" ? (
                             <DropdownMenuItem onClick={() => publishMutation.mutate(course.id)}>
                               <Send className="mr-2 h-4 w-4 text-emerald-600" /><span className="text-emerald-700">Publish</span>
                             </DropdownMenuItem>
                           ) : (
                             <DropdownMenuItem onClick={() => unpublishMutation.mutate(course.id)}>
                               <XCircle className="mr-2 h-4 w-4 text-amber-600" /><span className="text-amber-700">Unpublish</span>
                             </DropdownMenuItem>
                           )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => { setDeletingCourse(course); setDeleteOpen(true); }}>
                            <Trash2 className="mr-2 h-4 w-4" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
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
      <CourseFormModal key={editingCourse ? editingCourse.id : "new"} open={formOpen} onClose={() => setFormOpen(false)} course={editingCourse} />
      <DeleteConfirmModal open={deleteOpen} onOpenChange={v => { setDeleteOpen(v); if (!v) setDeletingCourse(null); }} onConfirm={confirmDelete} title="Delete Course" itemName={deletingCourse?.title} isLoading={deleteMutation.isPending} />
    </div>
  );
}
