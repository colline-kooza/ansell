"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api";
import { toast } from "sonner";
import type { Tender } from "./use-tenders";

export interface TenderBid {
  id: string;
  tender_id: string;
  tender?: Tender;
  bidder_id?: string;
  bidder?: { id: string; first_name: string; last_name: string; email: string };
  company_name?: string;
  company_id?: string;
  bid_amount?: number;
  currency?: string;
  proposal_url?: string;
  notes?: string;
  status: string;
  submitted_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  company_name: string;
  industry?: string;
  category?: string;
  description?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  document_url?: string;
  status: string;
  is_verified: boolean;
  user_id?: string;
  owner?: { id: string; first_name: string; last_name: string; email: string };
  created_at: string;
  updated_at: string;
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

// ── Admin Tenders ─────────────────────────────────────────────────────

export function useAdminTenders(options: { page?: number; page_size?: number; search?: string; status?: string; category?: string } = {}) {
  return useQuery({
    queryKey: ["admin", "tenders", options],
    queryFn: async (): Promise<PaginatedResponse<Tender>> => {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.page_size) params.set("page_size", String(options.page_size));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      if (options.category) params.set("category", options.category);
      const res = await fetch(`${buildApiUrl("admin/tenders")}?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch tenders");
      const json = await res.json();
      return { data: json.data ?? [], total_items: json.total_items ?? 0, total_pages: json.total_pages ?? 1, page: json.page ?? 1, page_size: json.page_size ?? 20 };
    },
  });
}

export function useAdminCreateTender() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Tender>): Promise<Tender> => {
      const res = await fetch(buildApiUrl("admin/tenders"), {
        method: "POST", headers: getAuthHeaders(), body: JSON.stringify(payload),
      });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to create tender";
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
    onSuccess: (newTender) => {
      qc.setQueriesData({ queryKey: ["admin", "tenders"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: [newTender, ...old.data], total_items: (old.total_items || 0) + 1 };
      });
      qc.invalidateQueries({ queryKey: ["admin", "tenders"] });
      toast.success("Tender created successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAdminUpdateTender() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Tender> }): Promise<Tender> => {
      const res = await fetch(buildApiUrl(`admin/tenders/${id}`), {
        method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(payload),
      });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to update tender";
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
      qc.setQueriesData({ queryKey: ["admin", "tenders"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((t: Tender) => t.id === updated.id ? updated : t) };
      });
      qc.invalidateQueries({ queryKey: ["admin", "tenders"] });
      toast.success("Tender updated successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAdminDeleteTender() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(buildApiUrl(`admin/tenders/${id}`), { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to delete tender");
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "tenders"] });
      qc.setQueriesData({ queryKey: ["admin", "tenders"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.filter((t: Tender) => t.id !== id), total_items: Math.max(0, (old.total_items || 1) - 1) };
      });
    },
    onSuccess: () => toast.success("Tender deleted"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "tenders"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "tenders"] }),
  });
}

export function useAdminApproveTender() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Tender> => {
      const res = await fetch(buildApiUrl(`admin/tenders/${id}/approve`), { method: "PATCH", headers: getAuthHeaders() });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to approve";
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
      await qc.cancelQueries({ queryKey: ["admin", "tenders"] });
      qc.setQueriesData({ queryKey: ["admin", "tenders"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((t: Tender) => t.id === id ? { ...t, status: "active" } : t) };
      });
    },
    onSuccess: () => toast.success("Tender approved"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "tenders"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "tenders"] }),
  });
}

export function useAdminRejectTender() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }): Promise<Tender> => {
      const res = await fetch(buildApiUrl(`admin/tenders/${id}/reject`), {
        method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to reject";
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
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ["admin", "tenders"] });
      qc.setQueriesData({ queryKey: ["admin", "tenders"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((t: Tender) => t.id === id ? { ...t, status: "rejected" } : t) };
      });
    },
    onSuccess: () => toast.success("Tender rejected"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "tenders"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "tenders"] }),
  });
}

export function useAdminFeatureTender() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Tender> => {
      const res = await fetch(buildApiUrl(`admin/tenders/${id}/feature`), { method: "PATCH", headers: getAuthHeaders() });
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
      await qc.cancelQueries({ queryKey: ["admin", "tenders"] });
      qc.setQueriesData({ queryKey: ["admin", "tenders"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((t: Tender) => t.id === id ? { ...t, is_featured: !t.is_featured } : t) };
      });
    },
    onSuccess: () => toast.success("Featured status updated"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "tenders"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "tenders"] }),
  });
}

// ── Bids ──────────────────────────────────────────────────────────────

export function useAdminTenderBids(options: { page?: number; page_size?: number; tender_id?: string; status?: string } = {}) {
  return useQuery({
    queryKey: ["admin", "tender-bids", options],
    queryFn: async (): Promise<PaginatedResponse<TenderBid>> => {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.page_size) params.set("page_size", String(options.page_size));
      if (options.tender_id) params.set("tender_id", options.tender_id);
      if (options.status) params.set("status", options.status);
      const res = await fetch(`${buildApiUrl("admin/tender-bids")}?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch tender bids");
      const json = await res.json();
      return { data: json.data ?? [], total_items: json.total_items ?? 0, total_pages: json.total_pages ?? 1, page: json.page ?? 1, page_size: json.page_size ?? 20 };
    },
  });
}

export function useAdminUpdateBidStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }): Promise<TenderBid> => {
      const res = await fetch(buildApiUrl(`admin/tender-bids/${id}/status`), {
        method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ status }),
      });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to update bid";
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
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["admin", "tender-bids"] });
      qc.setQueriesData({ queryKey: ["admin", "tender-bids"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((b: TenderBid) => b.id === id ? { ...b, status } : b) };
      });
    },
    onSuccess: () => toast.success("Bid status updated"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "tender-bids"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "tender-bids"] }),
  });
}

// ── Suppliers ─────────────────────────────────────────────────────────

export function useAdminSuppliers(options: { page?: number; page_size?: number; search?: string; status?: string } = {}) {
  return useQuery({
    queryKey: ["admin", "suppliers", options],
    queryFn: async (): Promise<PaginatedResponse<Supplier>> => {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.page_size) params.set("page_size", String(options.page_size));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      const res = await fetch(`${buildApiUrl("admin/suppliers")}?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch suppliers");
      const json = await res.json();
      return { data: json.data ?? [], total_items: json.total_items ?? 0, total_pages: json.total_pages ?? 1, page: json.page ?? 1, page_size: json.page_size ?? 20 };
    },
  });
}

export function useAdminApproveSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Supplier> => {
      const res = await fetch(buildApiUrl(`admin/suppliers/${id}/approve`), { method: "PATCH", headers: getAuthHeaders() });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to approve supplier";
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
      await qc.cancelQueries({ queryKey: ["admin", "suppliers"] });
      qc.setQueriesData({ queryKey: ["admin", "suppliers"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((s: Supplier) => s.id === id ? { ...s, status: "active", is_verified: true } : s) };
      });
    },
    onSuccess: () => toast.success("Supplier approved"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "suppliers"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "suppliers"] }),
  });
}

export function useAdminRejectSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }): Promise<Supplier> => {
      const res = await fetch(buildApiUrl(`admin/suppliers/${id}/reject`), {
        method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to reject supplier";
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
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ["admin", "suppliers"] });
      qc.setQueriesData({ queryKey: ["admin", "suppliers"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((s: Supplier) => s.id === id ? { ...s, status: "rejected" } : s) };
      });
    },
    onSuccess: () => toast.success("Supplier rejected"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "suppliers"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "suppliers"] }),
  });
}

export function useAdminDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(buildApiUrl(`admin/suppliers/${id}`), { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to delete supplier");
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "suppliers"] });
      qc.setQueriesData({ queryKey: ["admin", "suppliers"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.filter((s: Supplier) => s.id !== id), total_items: Math.max(0, (old.total_items || 1) - 1) };
      });
    },
    onSuccess: () => toast.success("Supplier deleted"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "suppliers"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "suppliers"] }),
  });
}

export function useAdminSupplierApplications(options: { page?: number; page_size?: number; status?: string } = {}) {
  return useQuery({
    queryKey: ["admin", "supplier-applications", options],
    queryFn: async (): Promise<PaginatedResponse<Supplier>> => {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.page_size) params.set("page_size", String(options.page_size));
      if (options.status) params.set("status", options.status);
      const res = await fetch(`${buildApiUrl("admin/supplier-applications")}?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch supplier applications");
      const json = await res.json();
      return { data: json.data ?? [], total_items: json.total_items ?? 0, total_pages: json.total_pages ?? 1, page: json.page ?? 1, page_size: json.page_size ?? 20 };
    },
  });
}
