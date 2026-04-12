"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api";
import { toast } from "sonner";

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  content_html?: string;
  category: string;
  tags?: string[];
  cover_image?: string;
  status: string;
  is_featured: boolean;
  is_trending: boolean;
  author_id?: string;
  author?: { id: string; first_name: string; last_name: string; email: string };
  author_name?: string;
  read_time_minutes?: number;
  views: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  [key: string]: unknown;
}

export interface Course {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  content?: string;
  category?: string;
  level?: string;
  duration_hours?: number;
  price?: number;
  currency?: string;
  thumbnail_url?: string;
  video_url?: string;
  instructor_name?: string;
  instructor_id?: string;
  status: string;
  is_featured: boolean;
  is_free: boolean;
  enrollments_count?: number;
  rating?: number;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface VideoAdvert {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  company_id?: string;
  company_name?: string;
  category?: string;
  duration_seconds?: number;
  status: string;
  is_featured: boolean;
  views: number;
  clicks?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface Enrollment {
  id: string;
  course_id: string;
  course?: Course;
  user_id: string;
  user?: { id: string; first_name: string; last_name: string; email: string };
  status: string;
  progress_percent?: number;
  completed_at?: string;
  created_at: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total_items: number;
  total_pages: number;
  page: number;
  page_size: number;
}

interface UseOptions {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  category?: string;
  course_id?: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("ansell_auth_token") : null;
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

// ── Articles ──────────────────────────────────────────────────────────

export function useAdminArticles(options: UseOptions = {}) {
  return useQuery({
    queryKey: ["admin", "articles", options],
    queryFn: async (): Promise<PaginatedResponse<Article>> => {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.page_size) params.set("page_size", String(options.page_size));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      if (options.category) params.set("category", options.category);
      const res = await fetch(`${buildApiUrl("admin/articles")}?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch articles");
      const json = await res.json();
      return { data: json.data ?? [], total_items: json.total_items ?? 0, total_pages: json.total_pages ?? 1, page: json.page ?? 1, page_size: json.page_size ?? 20 };
    },
  });
}

export function useAdminCreateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Article>): Promise<Article> => {
      const res = await fetch(buildApiUrl("admin/articles"), {
        method: "POST", headers: getAuthHeaders(), body: JSON.stringify(payload),
      });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to create article";
  if (text.includes("{")) {
    try { errMsg = JSON.parse(text).message || errMsg; } catch(e) {}
  } else if (text) {
    errMsg = text;
  }
  throw new Error(errMsg);
}
const json = await res.json();
      return json.data;
    },
    onSuccess: (newArticle) => {
      qc.setQueriesData({ queryKey: ["admin", "articles"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: [newArticle, ...old.data], total_items: (old.total_items || 0) + 1 };
      });
      qc.invalidateQueries({ queryKey: ["admin", "articles"] });
      toast.success("Article created successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAdminUpdateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Article> }): Promise<Article> => {
      const res = await fetch(buildApiUrl(`admin/articles/${id}`), {
        method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(payload),
      });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to update article";
  if (text.includes("{")) {
    try { errMsg = JSON.parse(text).message || errMsg; } catch(e) {}
  } else if (text) {
    errMsg = text;
  }
  throw new Error(errMsg);
}
const json = await res.json();
      return json.data;
    },
    onSuccess: (updated) => {
      qc.setQueriesData({ queryKey: ["admin", "articles"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((a: Article) => a.id === updated.id ? updated : a) };
      });
      qc.invalidateQueries({ queryKey: ["admin", "articles"] });
      toast.success("Article updated successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAdminDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(buildApiUrl(`admin/articles/${id}`), { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to delete article");
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "articles"] });
      qc.setQueriesData({ queryKey: ["admin", "articles"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.filter((a: Article) => a.id !== id), total_items: Math.max(0, (old.total_items || 1) - 1) };
      });
    },
    onSuccess: () => toast.success("Article deleted"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "articles"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "articles"] }),
  });
}

export function useAdminPublishArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Article> => {
      const res = await fetch(buildApiUrl(`admin/articles/${id}/publish`), { method: "PATCH", headers: getAuthHeaders() });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to publish";
  if (text.includes("{")) {
    try { errMsg = JSON.parse(text).message || errMsg; } catch(e) {}
  } else if (text) {
    errMsg = text;
  }
  throw new Error(errMsg);
}
const json = await res.json();
      return json.data;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "articles"] });
      qc.setQueriesData({ queryKey: ["admin", "articles"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((a: Article) => a.id === id ? { ...a, status: "published" } : a) };
      });
    },
    onSuccess: () => toast.success("Article published"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "articles"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "articles"] }),
  });
}

export function useAdminFeatureArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Article> => {
      const res = await fetch(buildApiUrl(`admin/articles/${id}/feature`), { method: "PATCH", headers: getAuthHeaders() });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to toggle feature";
  if (text.includes("{")) {
    try { errMsg = JSON.parse(text).message || errMsg; } catch(e) {}
  } else if (text) {
    errMsg = text;
  }
  throw new Error(errMsg);
}
const json = await res.json();
      return json.data;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "articles"] });
      qc.setQueriesData({ queryKey: ["admin", "articles"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((a: Article) => a.id === id ? { ...a, is_featured: !a.is_featured } : a) };
      });
    },
    onSuccess: () => toast.success("Featured status updated"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "articles"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "articles"] }),
  });
}

// ── Courses ───────────────────────────────────────────────────────────

export function useAdminCourses(options: UseOptions = {}) {
  return useQuery({
    queryKey: ["admin", "courses", options],
    queryFn: async (): Promise<PaginatedResponse<Course>> => {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.page_size) params.set("page_size", String(options.page_size));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      if (options.category) params.set("category", options.category);
      const res = await fetch(`${buildApiUrl("admin/courses")}?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch courses");
      const json = await res.json();
      return { data: json.data ?? [], total_items: json.total_items ?? 0, total_pages: json.total_pages ?? 1, page: json.page ?? 1, page_size: json.page_size ?? 20 };
    },
  });
}

export function useAdminCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Course>): Promise<Course> => {
      const res = await fetch(buildApiUrl("admin/courses"), {
        method: "POST", headers: getAuthHeaders(), body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        let errMsg = "Failed to create course";
        if (text.includes("{")) {
          try { 
            const p = JSON.parse(text);
            errMsg = p.error || p.message || errMsg;
          } catch(e) {}
        } else if (text) {
          errMsg = text;
        }
        throw new Error(errMsg);
      }
const json = await res.json();
      return json.data;
    },
    onSuccess: (newCourse) => {
      qc.setQueriesData({ queryKey: ["admin", "courses"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: [newCourse, ...old.data], total_items: (old.total_items || 0) + 1 };
      });
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      toast.success("Course created successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAdminUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Course> }): Promise<Course> => {
      const res = await fetch(buildApiUrl(`admin/courses/${id}`), {
        method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        let errMsg = "Failed to update course";
        if (text.includes("{")) {
          try { 
            const p = JSON.parse(text);
            errMsg = p.error || p.message || errMsg;
          } catch(e) {}
        } else if (text) {
          errMsg = text;
        }
        throw new Error(errMsg);
      }
const json = await res.json();
      return json.data;
    },
    onSuccess: (updated) => {
      qc.setQueriesData({ queryKey: ["admin", "courses"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((c: Course) => c.id === updated.id ? updated : c) };
      });
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      toast.success("Course updated successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAdminDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(buildApiUrl(`admin/courses/${id}`), { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to delete course");
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "courses"] });
      qc.setQueriesData({ queryKey: ["admin", "courses"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.filter((c: Course) => c.id !== id), total_items: Math.max(0, (old.total_items || 1) - 1) };
      });
    },
    onSuccess: () => toast.success("Course deleted"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "courses"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "courses"] }),
  });
}

export function useAdminPublishCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Course> => {
      const res = await fetch(buildApiUrl(`admin/courses/${id}/publish`), { method: "PATCH", headers: getAuthHeaders() });
      if (!res.ok) {
        const text = await res.text();
        let errMsg = "Failed to publish";
        if (text.includes("{")) {
          try { errMsg = JSON.parse(text).message || errMsg; } catch(e) {}
        } else if (text) {
          errMsg = text;
        }
        throw new Error(errMsg);
      }
      const json = await res.json();
      return json.data;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "courses"] });
      qc.setQueriesData({ queryKey: ["admin", "courses"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((c: Course) => c.id === id ? { ...c, status: "active" } : c) };
      });
    },
    onSuccess: () => toast.success("Course published"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "courses"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "courses"] }),
  });
}

export function useAdminUnpublishCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Course> => {
      const res = await fetch(buildApiUrl(`admin/courses/${id}/unpublish`), { method: "PATCH", headers: getAuthHeaders() });
      if (!res.ok) {
        const text = await res.text();
        let errMsg = "Failed to unpublish";
        if (text.includes("{")) {
          try { errMsg = JSON.parse(text).message || errMsg; } catch(e) {}
        } else if (text) {
          errMsg = text;
        }
        throw new Error(errMsg);
      }
      const json = await res.json();
      return json.data;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "courses"] });
      qc.setQueriesData({ queryKey: ["admin", "courses"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((c: Course) => c.id === id ? { ...c, status: "draft" } : c) };
      });
    },
    onSuccess: () => toast.success("Course unpublished"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "courses"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "courses"] }),
  });
}

export function useAdminEnrollments(options: UseOptions = {}) {
  return useQuery({
    queryKey: ["admin", "enrollments", options],
    queryFn: async (): Promise<PaginatedResponse<Enrollment>> => {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.page_size) params.set("page_size", String(options.page_size));
      if (options.search) params.set("search", options.search);
      if (options.course_id) params.set("course_id", options.course_id);
      const res = await fetch(`${buildApiUrl("admin/enrollments")}?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch enrollments");
      const json = await res.json();
      return { data: json.data ?? [], total_items: json.total_items ?? 0, total_pages: json.total_pages ?? 1, page: json.page ?? 1, page_size: json.page_size ?? 20 };
    },
  });
}

// ── Video Adverts ─────────────────────────────────────────────────────

export function useAdminVideoAdverts(options: UseOptions = {}) {
  return useQuery({
    queryKey: ["admin", "video-adverts", options],
    queryFn: async (): Promise<PaginatedResponse<VideoAdvert>> => {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.page_size) params.set("page_size", String(options.page_size));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      const res = await fetch(`${buildApiUrl("admin/video-adverts")}?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch video adverts");
      const json = await res.json();
      return { data: json.data ?? [], total_items: json.total_items ?? 0, total_pages: json.total_pages ?? 1, page: json.page ?? 1, page_size: json.page_size ?? 20 };
    },
  });
}

export function useAdminCreateVideoAdvert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<VideoAdvert>): Promise<VideoAdvert> => {
      const res = await fetch(buildApiUrl("admin/video-adverts"), {
        method: "POST", headers: getAuthHeaders(), body: JSON.stringify(payload),
      });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to create video advert";
  if (text.includes("{")) {
    try { errMsg = JSON.parse(text).message || errMsg; } catch(e) {}
  } else if (text) {
    errMsg = text;
  }
  throw new Error(errMsg);
}
const json = await res.json();
      return json.data;
    },
    onSuccess: (newAdvert) => {
      qc.setQueriesData({ queryKey: ["admin", "video-adverts"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: [newAdvert, ...old.data], total_items: (old.total_items || 0) + 1 };
      });
      qc.invalidateQueries({ queryKey: ["admin", "video-adverts"] });
      toast.success("Video advert created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAdminUpdateVideoAdvert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<VideoAdvert> }): Promise<VideoAdvert> => {
      const res = await fetch(buildApiUrl(`admin/video-adverts/${id}`), {
        method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(payload),
      });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to update";
  if (text.includes("{")) {
    try { errMsg = JSON.parse(text).message || errMsg; } catch(e) {}
  } else if (text) {
    errMsg = text;
  }
  throw new Error(errMsg);
}
const json = await res.json();
      return json.data;
    },
    onSuccess: (updated) => {
      qc.setQueriesData({ queryKey: ["admin", "video-adverts"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((v: VideoAdvert) => v.id === updated.id ? updated : v) };
      });
      qc.invalidateQueries({ queryKey: ["admin", "video-adverts"] });
      toast.success("Video advert updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAdminDeleteVideoAdvert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(buildApiUrl(`admin/video-adverts/${id}`), { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to delete video advert");
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "video-adverts"] });
      qc.setQueriesData({ queryKey: ["admin", "video-adverts"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.filter((v: VideoAdvert) => v.id !== id), total_items: Math.max(0, (old.total_items || 1) - 1) };
      });
    },
    onSuccess: () => toast.success("Video advert deleted"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "video-adverts"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "video-adverts"] }),
  });
}

export function useAdminFeatureVideoAdvert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<VideoAdvert> => {
      const res = await fetch(buildApiUrl(`admin/video-adverts/${id}/feature`), { method: "PATCH", headers: getAuthHeaders() });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to toggle feature";
  if (text.includes("{")) {
    try { errMsg = JSON.parse(text).message || errMsg; } catch(e) {}
  } else if (text) {
    errMsg = text;
  }
  throw new Error(errMsg);
}
const json = await res.json();
      return json.data;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "video-adverts"] });
      qc.setQueriesData({ queryKey: ["admin", "video-adverts"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((v: VideoAdvert) => v.id === id ? { ...v, is_featured: !v.is_featured } : v) };
      });
    },
    onSuccess: () => toast.success("Featured status updated"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "video-adverts"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "video-adverts"] }),
  });
}
