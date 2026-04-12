"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api";
import { toast } from "sonner";

export interface OwnerApplication {
  id: string;
  user_id: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
  business_name: string;
  business_type: string; // individual | agency | developer | company
  phone_number: string;
  address: string;
  city: string;
  description: string;
  document_url: string;
  status: "pending" | "approved" | "rejected";
  review_note: string;
  reviewed_by?: string;
  reviewed_at?: string;
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

interface UseOwnerApplicationsOptions {
  page?: number;
  page_size?: number;
  status?: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("ansell_auth_token") : null;
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

async function fetchOwnerApplications(opts: UseOwnerApplicationsOptions): Promise<PaginatedResponse<OwnerApplication>> {
  const params = new URLSearchParams();
  if (opts.page) params.set("page", String(opts.page));
  if (opts.page_size) params.set("page_size", String(opts.page_size));
  if (opts.status) params.set("status", opts.status);

  const res = await fetch(`${buildApiUrl("admin/owner-applications")}?${params}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch applications");
  const json = await res.json();
  return {
    data: json.data ?? [],
    total_items: json.total_items ?? json.total ?? 0,
    total_pages: json.total_pages ?? json.pages ?? 1,
    page: json.page ?? 1,
    page_size: json.page_size ?? 20,
  };
}

export function useOwnerApplications(options: UseOwnerApplicationsOptions = {}) {
  return useQuery({
    queryKey: ["owner-applications", options],
    queryFn: () => fetchOwnerApplications(options),
  });
}

export function useApproveOwnerApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(buildApiUrl(`admin/owner-applications/${id}/approve`), {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
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
      return json.data as OwnerApplication;
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["owner-applications"] });
      qc.setQueriesData({ queryKey: ["owner-applications"] }, (old: any) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map((app: any) => app.id === id ? { ...app, status: "approved" } : app) };
      });
    },
    onSuccess: () => toast.success("Application approved — user role upgraded to Property Owner"),
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: ["owner-applications"] });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["owner-applications"] });
    },
  });
}

export function useRejectOwnerApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, review_note }: { id: string; review_note?: string }) => {
      const res = await fetch(buildApiUrl(`admin/owner-applications/${id}/reject`), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ review_note }),
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
      return json.data as OwnerApplication;
    },
    onMutate: async ({ id, review_note }) => {
      await qc.cancelQueries({ queryKey: ["owner-applications"] });
      qc.setQueriesData({ queryKey: ["owner-applications"] }, (old: any) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map((app: any) => app.id === id ? { ...app, status: "rejected", review_note } : app) };
      });
    },
    onSuccess: () => toast.success("Application rejected"),
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: ["owner-applications"] });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["owner-applications"] });
    },
  });
}

// ── Submit owner application (user-facing onboarding) ────────────────

export interface OwnerApplicationPayload {
  business_name: string;
  business_type: string;
  phone_number: string;
  address?: string;
  city?: string;
  description?: string;
  document_url?: string;
}

export function useSubmitOwnerApplication() {
  return useMutation({
    mutationFn: async (payload: OwnerApplicationPayload): Promise<OwnerApplication> => {
      const res = await fetch(buildApiUrl("owner/apply"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to submit application";
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
    onSuccess: () => {
      toast.success("Application submitted! We'll review it shortly.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
