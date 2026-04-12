"use client";

import React, { useState } from "react";
import {
  useAdminArticles, useAdminCreateArticle, useAdminUpdateArticle,
  useAdminDeleteArticle, useAdminPublishArticle, useAdminFeatureArticle,
  type Article,
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
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, MoreHorizontal, Edit, Trash2, PlusCircle, Newspaper,
  Send, Star, StarOff, Loader2, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DeleteConfirmModal } from "@/components/shared/delete-confirm-modal";
import { RichEditor } from "@/components/shared/rich-editor";
import { MultiImageUpload } from "@/components/shared/multi-image-upload";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-blue-50 text-blue-700 border-blue-200",
  archived: "bg-gray-50 text-gray-600 border-gray-200",
};

const CATEGORIES = ["business", "politics", "sports", "technology", "health", "entertainment", "education", "general", "real_estate", "jobs", "tenders"];

interface ArticleFormData {
  title: string;
  excerpt: string;
  content_html: string;
  category: string;
  cover_image: string;
  author_name: string;
  status: string;
  is_featured: boolean;
  is_trending: boolean;
  tags: string;
}

const DEFAULT_FORM: ArticleFormData = {
  title: "", excerpt: "", content_html: "", category: "general",
  cover_image: "", author_name: "", status: "draft", is_featured: false, is_trending: false, tags: "",
};

function ArticleFormModal({ open, onClose, article }: { open: boolean; onClose: () => void; article: Article | null }) {
  const createMutation = useAdminCreateArticle();
  const updateMutation = useAdminUpdateArticle();
  const isEditing = !!article;
  const [form, setForm] = useState<ArticleFormData>(
    article ? {
      title: article.title, 
      excerpt: article.excerpt || (article as any).summary || "", 
      content_html: article.content_html || article.content || (article as any).body || "",
      category: article.category, 
      cover_image: article.cover_image || article.cover_image_url || (article as any).image_url || "", 
      author_name: article.author_name || (article as any).author?.first_name ? `${(article as any).author.first_name} ${(article as any).author.last_name}` : "",
      status: article.status, 
      is_featured: article.is_featured, 
      is_trending: article.is_trending,
      tags: Array.isArray(article.tags) ? article.tags.join(", ") : "",
    } : DEFAULT_FORM
  );
  const initialImage = article
    ? article.cover_image || article.cover_image_url || (article as any).image_url
    : null;

  const [coverImages, setCoverImages] = useState<string[]>(
    initialImage ? [initialImage] : []
  );

  const set = (k: keyof ArticleFormData, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.content_html.trim()) { toast.error("Content is required"); return; }
    
    // Use the state from MultiImageUpload
    const coverURL = coverImages[0];
    if (!coverURL) { toast.error("Cover image is required"); return; }

    const payload = {
      title: form.title.trim(),
      excerpt: (form.excerpt || form.title).slice(0, 300),
      content: form.content_html,
      category: form.category,
      cover_image_url: coverURL,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      is_featured: form.is_featured,
      is_published: form.status === "published"
    };

    try {
      if (isEditing && article) {
        await updateMutation.mutateAsync({ id: article.id, payload: payload as any });
      } else {
        await createMutation.mutateAsync(payload as any);
      }
      onClose();
    } catch {}
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="text-base font-semibold">{isEditing ? "Edit Article" : "New Article"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh]">
          <div className="px-6 py-4 space-y-4">
            <div>
              <Label className="text-[11px] text-gray-500 mb-1.5 block">Title *</Label>
              <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Article title..." className="h-9 text-[13px]" />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500 mb-1.5 block">Excerpt / Summary</Label>
              <Input value={form.excerpt} onChange={e => set("excerpt", e.target.value)} placeholder="Brief summary shown in listings..." className="h-9 text-[13px]" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Category</Label>
                <Select value={form.category} onValueChange={v => set("category", v)}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{(c || "").replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Author Name</Label>
                <Input value={form.author_name} onChange={e => set("author_name", e.target.value)} placeholder="Author" className="h-9 text-[13px]" />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500 mb-1.5 block">Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["draft", "published", "archived"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-[11px] text-gray-500 mb-1.5 block">Tags (comma separated)</Label>
              <Input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="e.g. property, market, nairobi" className="h-9 text-[13px]" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={e => set("is_featured", e.target.checked)} className="rounded" />
                <span className="text-[13px] text-gray-700">Featured Article</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_trending} onChange={e => set("is_trending", e.target.checked)} className="rounded" />
                <span className="text-[13px] text-gray-700">Trending</span>
              </label>
            </div>
            <div>
              <Label className="text-[11px] text-gray-500 mb-1.5 block">Cover Image</Label>
              <MultiImageUpload value={coverImages} onChange={setCoverImages} maxFiles={1} maxSize={5} />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500 mb-1.5 block">Content</Label>
              <RichEditor
                value={form.content_html}
                onChange={html => set("content_html", html)}
                placeholder="Write article content here..."
                className="border-gray-200"
              />
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="px-6 py-4 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={onClose} className="text-[13px]">Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={isPending} className="text-[13px] gap-1.5">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Article"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminArticlesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);

  const { data, isLoading } = useAdminArticles({ page, page_size: 20, search, status, category });
  const deleteMutation = useAdminDeleteArticle();
  const publishMutation = useAdminPublishArticle();
  const featureMutation = useAdminFeatureArticle();

  const articles = data?.data ?? [];
  const totalPages = data?.total_pages ?? 1;
  const totalItems = data?.total_items ?? 0;

  const confirmDelete = () => {
    if (!deletingArticle) return;
    deleteMutation.mutate(deletingArticle.id, { onSuccess: () => { setDeleteOpen(false); setDeletingArticle(null); } });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Articles & News</h1>
          <p className="text-xs text-gray-500 mt-0.5">Create and manage news articles</p>
        </div>
        <Button onClick={() => { setEditingArticle(null); setFormOpen(true); }} className="gap-2 text-[13px]">
          <PlusCircle className="h-4 w-4" />New Article
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search articles..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9 text-[13px]" />
        </div>
        <Select value={category || "all"} onValueChange={v => { setCategory(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[160px] text-[13px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{(c || "").replace(/_/g," ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status || "all"} onValueChange={v => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[150px] text-[13px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {[{ v: "all", l: "All Statuses" }, { v: "published", l: "Published" }, { v: "draft", l: "Draft" }, { v: "archived", l: "Archived" }].map(s => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Articles</CardTitle>
          <CardDescription className="text-xs">{totalItems} total articles</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Article</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Category</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Author</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Views</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Created</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px]">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-[12px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>{[...Array(7)].map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : articles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                      <Newspaper className="h-10 w-10 mx-auto mb-2 text-gray-200" />No articles found
                    </TableCell>
                  </TableRow>
                ) : (
                  articles.map(article => (
                    <TableRow key={article.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {article.cover_image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={article.cover_image} alt={article.title} className="h-8 w-12 object-cover border border-gray-100 shrink-0" />
                          )}
                          <div>
                            <p className="text-[13px] font-semibold text-gray-900 max-w-[220px] truncate">{article.title}</p>
                            <p className="text-[11px] text-gray-400 truncate">{article.excerpt || "—"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[11px] capitalize">{article.category}</Badge></TableCell>
                      <TableCell className="text-[13px] text-gray-500">{article.author_name || "—"}</TableCell>
                      <TableCell className="text-[13px] text-gray-500">{article.views || 0}</TableCell>
                      <TableCell className="text-[13px] text-gray-500 whitespace-nowrap">{format(new Date(article.created_at), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[11px] border font-medium capitalize", STATUS_STYLES[article.status] ?? "")}>{(article.status || "draft").replace(/_/g, " ")}</Badge>
                        {article.is_featured && <Badge className="ml-1 text-[11px] bg-yellow-50 text-yellow-700 border-yellow-200 border"><Star className="h-2.5 w-2.5 mr-0.5" />Featured</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel className="text-xs font-semibold">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setEditingArticle(article); setFormOpen(true); }}>
                              <Edit className="mr-2 h-4 w-4" />Edit
                            </DropdownMenuItem>
                            {article.status !== "published" && (
                              <DropdownMenuItem onClick={() => publishMutation.mutate(article.id)}>
                                <Send className="mr-2 h-4 w-4 text-emerald-600" />
                                <span className="text-emerald-700">Publish</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => featureMutation.mutate(article.id)}>
                              {article.is_featured ? <><StarOff className="mr-2 h-4 w-4" />Unfeature</> : <><Star className="mr-2 h-4 w-4" />Feature</>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => { setDeletingArticle(article); setDeleteOpen(true); }}>
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

      <ArticleFormModal key={editingArticle ? editingArticle.id : "new"} open={formOpen} onClose={() => setFormOpen(false)} article={editingArticle} />
      <DeleteConfirmModal open={deleteOpen} onOpenChange={v => { setDeleteOpen(v); if (!v) setDeletingArticle(null); }} onConfirm={confirmDelete} title="Delete Article" itemName={deletingArticle?.title} isLoading={deleteMutation.isPending} />
    </div>
  );
}
