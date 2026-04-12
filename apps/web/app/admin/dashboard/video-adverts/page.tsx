"use client";

import React, { useState, useEffect } from "react";
import {
  useAdminVideoAdverts, useAdminCreateVideoAdvert, useAdminUpdateVideoAdvert,
  useAdminDeleteVideoAdvert, useAdminFeatureVideoAdvert, type VideoAdvert,
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
  Search, MoreHorizontal, Edit, Trash2, PlusCircle, Video,
  Star, StarOff, Loader2, Play, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DeleteConfirmModal } from "@/components/shared/delete-confirm-modal";
import { MultiImageUpload } from "@/components/shared/multi-image-upload";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  inactive: "bg-gray-50 text-gray-600 border-gray-200",
  expired: "bg-red-50 text-red-700 border-red-200",
};

const CATEGORIES = ["real_estate", "jobs", "tenders", "technology", "finance", "retail", "health", "hospitality", "education", "general"];

interface AdvertFormData {
  title: string; description: string; video_url: string; thumbnail_url: string;
  company_name: string; category: string; status: string; is_featured: boolean;
  start_date: string; end_date: string;
}

const DEFAULT_FORM: AdvertFormData = {
  title: "", description: "", video_url: "", thumbnail_url: "",
  company_name: "", category: "general", status: "pending", is_featured: false,
  start_date: "", end_date: "",
};

function AdvertFormModal({ open, onClose, advert }: { open: boolean; onClose: () => void; advert: VideoAdvert | null }) {
  const createMutation = useAdminCreateVideoAdvert();
  const updateMutation = useAdminUpdateVideoAdvert();
  const isEditing = !!advert;
  const [form, setForm] = useState<AdvertFormData>(
    advert ? {
      title: advert.title, 
      description: advert.description || "", 
      video_url: advert.video_url || "",
      thumbnail_url: advert.thumbnail_url || (advert as any).image_url || "", 
      company_name: advert.company_name || (advert as any).company?.name || "",
      category: advert.category || "general", 
      status: advert.status, 
      is_featured: advert.is_featured,
      start_date: advert.start_date ? advert.start_date.slice(0, 10) : "",
      end_date: advert.end_date ? advert.end_date.slice(0, 10) : "",
    } : DEFAULT_FORM
  );
  const initialThumbnail = advert 
    ? advert.thumbnail_url || (advert as any).image_url 
    : null;

  const [thumbnails, setThumbnails] = useState<string[]>(
    initialThumbnail ? [initialThumbnail] : []
  );
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState(advert?.video_url || "");

  useEffect(() => {
    if (open) {
      if (advert) {
        setForm({
          title: advert.title,
          description: advert.description || "",
          video_url: advert.video_url || "",
          thumbnail_url: advert.thumbnail_url || (advert as any).image_url || "",
          company_name: advert.company_name || (advert as any).company?.name || "",
          category: advert.category || "general",
          status: advert.status,
          is_featured: advert.is_featured,
          start_date: advert.start_date ? advert.start_date.slice(0, 10) : "",
          end_date: advert.end_date ? advert.end_date.slice(0, 10) : "",
        });
        setThumbnails((advert?.thumbnail_url || (advert as any)?.image_url) ? [advert.thumbnail_url || (advert as any).image_url] : []);
        setVideoUrl(advert?.video_url || "");
      } else {
        setForm(DEFAULT_FORM);
        setThumbnails([]);
        setVideoUrl("");
      }
    }
  }, [open, advert]);

  const set = (k: keyof AdvertFormData, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

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
      toast.success("Video uploaded to R2!");
    } catch {
      toast.error("Failed to upload video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    const coverURL = thumbnails[0];
    if (!videoUrl) { toast.error("Video is required"); return; }
    if (!coverURL) { toast.error("Thumbnail image is required"); return; }

    const payload = {
      ...form,
      video_url: videoUrl,
      thumbnail_url: coverURL,
      is_active: true
    };
    try {
      if (isEditing && advert) await updateMutation.mutateAsync({ id: advert.id, payload });
      else await createMutation.mutateAsync(payload);
      onClose();
    } catch {}
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="text-base font-semibold">{isEditing ? "Edit Video Advert" : "New Video Advert"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[72vh]">
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Title *</Label>
                <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Advert title" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Company Name</Label>
                <Input value={form.company_name} onChange={e => set("company_name", e.target.value)} placeholder="Company" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Category</Label>
                <Select value={form.category} onValueChange={v => set("category", v)}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{(c || "").replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{["pending","active","inactive","expired"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input type="checkbox" checked={form.is_featured} onChange={e => set("is_featured", e.target.checked)} className="rounded" />
                  <span className="text-[13px] text-gray-700">Featured</span>
                </label>
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Start Date</Label>
                <Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">End Date</Label>
                <Input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} className="h-9 text-[13px]" />
              </div>
              <div className="col-span-2">
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Description</Label>
                <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Advert description..." className="text-[13px] resize-none" />
              </div>
              <div className="col-span-2">
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Thumbnail Image</Label>
                <MultiImageUpload value={thumbnails} onChange={setThumbnails} maxFiles={1} maxSize={5} />
              </div>
              <div className="col-span-2">
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Video File * <span className="text-gray-400 font-normal">(uploaded to R2)</span></Label>
                {videoUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <Play className="h-5 w-5 text-emerald-600 shrink-0" />
                    <p className="text-[12px] text-gray-600 flex-1 truncate">{videoUrl}</p>
                    <Button variant="outline" size="sm" className="h-7 text-[12px]" onClick={() => setVideoUrl("")}>Remove</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="flex items-center justify-center gap-2 h-14 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                      {uploadingVideo ? (
                        <><Loader2 className="h-4 w-4 animate-spin text-primary" /><span className="text-[13px] text-gray-500">Uploading to R2...</span></>
                      ) : (
                        <><Upload className="h-4 w-4 text-gray-400" /><span className="text-[13px] text-gray-500">Click to upload video (MP4, max 500MB)</span></>
                      )}
                      <input type="file" className="hidden" accept="video/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f); }} disabled={uploadingVideo} />
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-gray-200" />
                      <span className="text-[11px] text-gray-400">or paste URL</span>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>
                    <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="Paste video URL (YouTube, Vimeo, R2...)" className="h-9 text-[13px]" />
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
            {isEditing ? "Save Changes" : "Create Advert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminVideoAdvertsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingAdvert, setEditingAdvert] = useState<VideoAdvert | null>(null);
  const [deletingAdvert, setDeletingAdvert] = useState<VideoAdvert | null>(null);

  const { data, isLoading } = useAdminVideoAdverts({ page, page_size: 20, search, status });
  const deleteMutation = useAdminDeleteVideoAdvert();
  const featureMutation = useAdminFeatureVideoAdvert();

  const adverts = data?.data ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalItems = data?.total_items ?? 0;

  const confirmDelete = () => {
    if (!deletingAdvert) return;
    deleteMutation.mutate(deletingAdvert.id, { onSuccess: () => { setDeleteOpen(false); setDeletingAdvert(null); } });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Video Adverts</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage platform video advertisements (R2-hosted)</p>
        </div>
        <Button onClick={() => { setEditingAdvert(null); setFormOpen(true); }} className="gap-2 text-[13px]">
          <PlusCircle className="h-4 w-4" />New Advert
        </Button>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search adverts..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 text-[13px]" />
        </div>
        <Select value={status || "all"} onValueChange={v => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[160px] text-[13px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {[{ v: "all", l: "All" }, { v: "active", l: "Active" }, { v: "pending", l: "Pending" }, { v: "inactive", l: "Inactive" }, { v: "expired", l: "Expired" }].map(s => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Video Adverts</CardTitle>
          <CardDescription className="text-xs">{totalItems} total</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Advert</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Company</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Category</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Views</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Dates</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? [...Array(4)].map((_, i) => (
                  <TableRow key={i}>{[...Array(7)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                )) : adverts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                      <Video className="h-10 w-10 mx-auto mb-2 text-gray-200" />No video adverts found
                    </TableCell>
                  </TableRow>
                ) : (
                  adverts.map(advert => (
                    <TableRow key={advert.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {advert.thumbnail_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={advert.thumbnail_url} alt={advert.title} className="h-8 w-12 object-cover border border-gray-100 shrink-0" />
                          ) : (
                            <div className="h-8 w-12 bg-gray-100 flex items-center justify-center shrink-0 rounded">
                              <Play className="h-3.5 w-3.5 text-gray-400" />
                            </div>
                          )}
                          <p className="text-[13px] font-semibold text-gray-900 max-w-[160px] truncate">{advert.title}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-500">{advert.company_name || "—"}</TableCell>
                      <TableCell className="text-[13px] text-gray-500 capitalize">{(advert.category || "").replace(/_/g," ") || "—"}</TableCell>
                      <TableCell className="text-[13px] text-gray-500">{advert.views || 0}</TableCell>
                      <TableCell className="text-[11px] text-gray-400">
                        {advert.start_date && <span>{format(new Date(advert.start_date), "dd MMM")}</span>}
                        {advert.end_date && <><br /><span>{format(new Date(advert.end_date), "dd MMM yyyy")}</span></>}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-[11px] border font-medium capitalize", STATUS_STYLES[advert.status] ?? "")}>{(advert.status || "pending").replace(/_/g, " ")}</Badge>
                        {advert.is_featured && <Badge className="ml-1 text-[11px] bg-yellow-50 text-yellow-700 border-yellow-200 border"><Star className="h-2.5 w-2.5 mr-0.5" />Featured</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs font-semibold">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setEditingAdvert(advert); setFormOpen(true); }}>
                              <Edit className="mr-2 h-4 w-4" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => featureMutation.mutate(advert.id)}>
                              {advert.is_featured ? <><StarOff className="mr-2 h-4 w-4" />Unfeature</> : <><Star className="mr-2 h-4 w-4" />Feature</>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => { setDeletingAdvert(advert); setDeleteOpen(true); }}>
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
      <AdvertFormModal key={editingAdvert ? editingAdvert.id : "new"} open={formOpen} onClose={() => setFormOpen(false)} advert={editingAdvert} />
      <DeleteConfirmModal open={deleteOpen} onOpenChange={v => { setDeleteOpen(v); if (!v) setDeletingAdvert(null); }} onConfirm={confirmDelete} title="Delete Video Advert" itemName={deletingAdvert?.title} isLoading={deleteMutation.isPending} />
    </div>
  );
}
