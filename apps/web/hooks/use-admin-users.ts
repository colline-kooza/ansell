"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api";
import { toast } from "sonner";

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
}

export interface NationalIdApplication {
  id: string;
  user_id: string;
  user?: User;
  national_id_number?: string;
  document_front_url?: string;
  document_back_url?: string;
  selfie_url?: string;
  status: string;
  reviewer_note?: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformStats {
  total_users: number;
  total_properties: number;
  total_jobs: number;
  total_companies: number;
  total_tenders: number;
  total_courses: number;
  total_articles: number;
  total_enrollments: number;
  pending_properties: number;
  pending_jobs: number;
  pending_companies: number;
  pending_owner_apps: number;
  pending_company_apps: number;
  active_video_adverts: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total_items: number;
  total_pages: number;
  page: number;
  page_size: number;
}

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("ansell_auth_token") : null;
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

// ── Users ──────────────────────────────────────────────────────────────

export function useAdminUsers(options: { page?: number; page_size?: number; search?: string; role?: string; status?: string } = {}) {
  return useQuery({
    queryKey: ["admin", "users", options],
    queryFn: async (): Promise<PaginatedResponse<User>> => {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.page_size) params.set("page_size", String(options.page_size));
      if (options.search) params.set("search", options.search);
      if (options.role) params.set("role", options.role);
      if (options.status) params.set("status", options.status);
      const res = await fetch(`${buildApiUrl("admin/users")}?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch users");
      const json = await res.json();
      return { data: json.data ?? [], total_items: json.total_items ?? 0, total_pages: json.total_pages ?? 1, page: json.page ?? 1, page_size: json.page_size ?? 20 };
    },
  });
}

export function useAdminUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }): Promise<User> => {
      const res = await fetch(buildApiUrl(`admin/users/${id}/role`), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.includes("{") ? JSON.parse(text).message : "Failed to update role");
      }
      const json = await res.json();
      return json.data;
    },
    onMutate: async ({ id, role }) => {
      await qc.cancelQueries({ queryKey: ["admin", "users"] });
      qc.setQueriesData({ queryKey: ["admin", "users"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((u: User) => u.id === id ? { ...u, role } : u) };
      });
    },
    onSuccess: () => toast.success("User role updated"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "users"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useAdminSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<User> => {
      const res = await fetch(buildApiUrl(`admin/users/${id}/suspend`), { 
        method: "PATCH", 
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: false })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.includes("{") ? JSON.parse(text).message : "Failed to suspend user");
      }
      const json = await res.json();
      return json.data;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "users"] });
      qc.setQueriesData({ queryKey: ["admin", "users"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((u: User) => u.id === id ? { ...u, is_active: false, status: "suspended" } : u) };
      });
    },
    onSuccess: () => toast.success("User suspended"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "users"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useAdminActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<User> => {
      const res = await fetch(buildApiUrl(`admin/users/${id}/suspend`), { 
        method: "PATCH", 
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: true })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.includes("{") ? JSON.parse(text).message : "Failed to activate user");
      }
      const json = await res.json();
      return json.data;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "users"] });
      qc.setQueriesData({ queryKey: ["admin", "users"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((u: User) => u.id === id ? { ...u, is_active: true, status: "active" } : u) };
      });
    },
    onSuccess: () => toast.success("User activated"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "users"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useAdminDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(buildApiUrl(`admin/users/${id}`), { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to delete user");
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "users"] });
      qc.setQueriesData({ queryKey: ["admin", "users"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.filter((u: User) => u.id !== id), total_items: Math.max(0, (old.total_items || 1) - 1) };
      });
    },
    onSuccess: () => toast.success("User deleted"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "users"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

// ── National ID ────────────────────────────────────────────────────────

export function useAdminNationalIdApplications(options: { page?: number; page_size?: number; status?: string } = {}) {
  return useQuery({
    queryKey: ["admin", "national-id", options],
    queryFn: async (): Promise<PaginatedResponse<NationalIdApplication>> => {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.page_size) params.set("page_size", String(options.page_size));
      if (options.status) params.set("status", options.status);
      const res = await fetch(`${buildApiUrl("admin/national-id/applications")}?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch national ID applications");
      const json = await res.json();
      return { data: json.data ?? [], total_items: json.total_items ?? 0, total_pages: json.total_pages ?? 1, page: json.page ?? 1, page_size: json.page_size ?? 20 };
    },
  });
}

export function useAdminApproveNationalId() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<NationalIdApplication> => {
      const res = await fetch(buildApiUrl(`admin/national-id/applications/${id}/status`), { 
        method: "PATCH", 
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: "approved" })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.includes("{") ? JSON.parse(text).message : "Failed to approve");
      }
      const json = await res.json();
      return json.data;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "national-id"] });
      qc.setQueriesData({ queryKey: ["admin", "national-id"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((a: NationalIdApplication) => a.id === id ? { ...a, status: "approved" } : a) };
      });
    },
    onSuccess: () => toast.success("National ID approved"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "national-id"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "national-id"] }),
  });
}

export function useAdminRejectNationalId() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }): Promise<NationalIdApplication> => {
      const res = await fetch(buildApiUrl(`admin/national-id/applications/${id}/status`), {
        method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ status: "rejected", reviewer_note: reason }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text.includes("{") ? JSON.parse(text).message : "Failed to reject");
      }
      const json = await res.json();
      return json.data;
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ["admin", "national-id"] });
      qc.setQueriesData({ queryKey: ["admin", "national-id"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((a: NationalIdApplication) => a.id === id ? { ...a, status: "rejected" } : a) };
      });
    },
    onSuccess: () => toast.success("National ID rejected"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "national-id"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "national-id"] }),
  });
}

// ── Platform Stats ─────────────────────────────────────────────────────

export function useAdminPlatformStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async (): Promise<PlatformStats> => {
      const res = await fetch(buildApiUrl("admin/stats"), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch stats");
      const json = await res.json();
      return json.data ?? json;
    },
    staleTime: 60_000,
  });
}
