"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────

export interface Property {
  id: string;
  owner_id: string;
  owner?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  title: string;
  description: string;
  category: string;
  price: number;
  price_period: string;
  currency: string;
  city: string;
  location: string;
  address: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  size_m2?: number | null;
  amenities: string; // JSON array string
  images: string;   // JSON array string
  is_featured: boolean;
  is_active: boolean;
  status: string;
  views: number;
  contact_phone: string;
  contact_email: string;
  review_note: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyInquiry {
  id: string;
  property_id: string;
  property?: Property;
  user_id?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total_items: number;
  total_pages: number;
  page: number;
  page_size: number;
}

interface UsePropertiesOptions {
  page?: number;
  page_size?: number;
  status?: string;
  category?: string;
  search?: string;
  city?: string;
  owner_id?: string;
}

interface CreatePropertyPayload {
  title: string;
  description?: string;
  category: string;
  price: number;
  price_period?: string;
  currency?: string;
  city?: string;
  location?: string;
  address?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  size_m2?: number | null;
  amenities?: string;
  images?: string;
  contact_phone?: string;
  contact_email?: string;
  is_featured?: boolean;
  is_active?: boolean;
  status?: string;
}

// ── Auth helper ──────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("ansell_auth_token") : null;
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

// ── Fetch helpers ────────────────────────────────────────────────────

async function fetchAdminProperties(options: UsePropertiesOptions): Promise<PaginatedResponse<Property>> {
  const params = new URLSearchParams();
  if (options.page) params.set("page", String(options.page));
  if (options.page_size) params.set("page_size", String(options.page_size));
  if (options.status) params.set("status", options.status);
  if (options.category) params.set("category", options.category);
  if (options.search) params.set("search", options.search);
  if (options.city) params.set("city", options.city);
  if (options.owner_id) params.set("owner_id", options.owner_id);

  const res = await fetch(`${buildApiUrl("admin/properties")}?${params}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch properties");
  const json = await res.json();
  // normalise: backend returns total_items / total_pages at top level
  return {
    data: json.data ?? [],
    total_items: json.total_items ?? json.total ?? 0,
    total_pages: json.total_pages ?? json.pages ?? 1,
    page: json.page ?? 1,
    page_size: json.page_size ?? 20,
  };
}

async function fetchOwnerProperties(options: UsePropertiesOptions): Promise<PaginatedResponse<Property>> {
  const params = new URLSearchParams();
  if (options.page) params.set("page", String(options.page));
  if (options.page_size) params.set("page_size", String(options.page_size));
  if (options.status) params.set("status", options.status);

  const res = await fetch(`${buildApiUrl("owner/properties")}?${params}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch properties");
  const json = await res.json();
  return {
    data: json.data ?? [],
    total_items: json.total_items ?? json.total ?? 0,
    total_pages: json.total_pages ?? json.pages ?? 1,
    page: json.page ?? 1,
    page_size: json.page_size ?? 20,
  };
}

// ── Public hook (use-properties.ts re-export pattern) ─────────────────

async function fetchPublicProperties(options: UsePropertiesOptions): Promise<PaginatedResponse<Property>> {
  const params = new URLSearchParams();
  if (options.page) params.set("page", String(options.page));
  if (options.page_size) params.set("page_size", String(options.page_size));
  if (options.category) params.set("category", options.category);
  if (options.search) params.set("search", options.search);
  if (options.city) params.set("city", options.city);

  const res = await fetch(`${buildApiUrl("properties")}?${params}`);
  if (!res.ok) throw new Error("Failed to fetch properties");
  const json = await res.json();
  return {
    data: json.data ?? [],
    total_items: json.total_items ?? json.total ?? 0,
    total_pages: json.total_pages ?? json.pages ?? 1,
    page: json.page ?? 1,
    page_size: json.page_size ?? 20,
  };
}

async function fetchPublicProperty(id: string): Promise<Property> {
  const res = await fetch(`${buildApiUrl(`properties/${id}`)}`);
  if (!res.ok) throw new Error("Failed to fetch property");
  const json = await res.json();
  return json.data as Property;
}

// ── Query Hooks ──────────────────────────────────────────────────────

export function useAdminPropertiesFull(options: UsePropertiesOptions = {}) {
  return useQuery({
    queryKey: ["admin", "properties-full", options],
    queryFn: () => fetchAdminProperties(options),
  });
}

export function useAdminProperties(options: UsePropertiesOptions = {}) {
  return useQuery({
    queryKey: ["admin", "properties", options],
    queryFn: () => fetchAdminProperties(options),
  });
}

export function useOwnerPropertiesFull(options: UsePropertiesOptions = {}) {
  return useQuery({
    queryKey: ["owner", "properties", options],
    queryFn: () => fetchOwnerProperties(options),
  });
}

export function usePublicProperties(options: UsePropertiesOptions = {}) {
  return useQuery({
    queryKey: ["public", "properties", options],
    queryFn: () => fetchPublicProperties(options),
  });
}

export function usePublicProperty(id: string) {
  return useQuery({
    queryKey: ["public", "property", id],
    queryFn: () => fetchPublicProperty(id),
    enabled: !!id,
  });
}

export function useProperties(options: UsePropertiesOptions = {}) {
  return usePublicProperties(options);
}

// ── Admin mutations ───────────────────────────────────────────────────

export function useAdminCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePropertyPayload): Promise<Property> => {
      const res = await fetch(buildApiUrl("admin/properties"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to create";
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
    onSuccess: (newProp) => {
      qc.setQueriesData({ queryKey: ["admin", "properties"] }, (old: any) => {
        if (!old || !old.data) return old;
        return { ...old, data: [newProp, ...old.data], total_items: (old.total_items || 0) + 1 };
      });
      qc.setQueriesData({ queryKey: ["admin", "properties-full"] }, (old: any) => {
        if (!old || !old.data) return old;
        return { ...old, data: [newProp, ...old.data], total_items: (old.total_items || 0) + 1 };
      });
      qc.invalidateQueries({ queryKey: ["admin", "properties"] });
      qc.invalidateQueries({ queryKey: ["admin", "properties-full"] });
      toast.success("Property created successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAdminUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CreatePropertyPayload> }): Promise<Property> => {
      const res = await fetch(buildApiUrl(`admin/properties/${id}`), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
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
    onSuccess: (updatedProp) => {
      const updateData = (old: any) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map((p: any) => p.id === updatedProp.id ? updatedProp : p) };
      };
      qc.setQueriesData({ queryKey: ["admin", "properties"] }, updateData);
      qc.setQueriesData({ queryKey: ["admin", "properties-full"] }, updateData);
      qc.invalidateQueries({ queryKey: ["admin", "properties"] });
      qc.invalidateQueries({ queryKey: ["admin", "properties-full"] });
      toast.success("Property updated successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAdminDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(buildApiUrl(`admin/properties/${id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || "Failed to delete");
      }
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["admin"] });
      qc.setQueriesData({ queryKey: ["admin", "properties"] }, (old: any) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.filter((p: any) => p.id !== id) };
      });
      qc.setQueriesData({ queryKey: ["admin", "properties-full"] }, (old: any) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.filter((p: any) => p.id !== id) };
      });
    },
    onSuccess: () => toast.success("Property deleted"),
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: ["admin", "properties"] });
      qc.invalidateQueries({ queryKey: ["admin", "properties-full"] });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "properties"] });
      qc.invalidateQueries({ queryKey: ["admin", "properties-full"] });
    }
  });
}

export function useAdminApproveProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Property> => {
      const res = await fetch(buildApiUrl(`admin/properties/${id}/approve`), {
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
      return json.data;
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["admin"] });
      const updateData = (old: any) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map((p: any) => p.id === id ? { ...p, status: "active" } : p) };
      };
      qc.setQueriesData({ queryKey: ["admin", "properties"] }, updateData);
      qc.setQueriesData({ queryKey: ["admin", "properties-full"] }, updateData);
    },
    onSuccess: () => toast.success("Property approved and set to active"),
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: ["admin", "properties"] });
      qc.invalidateQueries({ queryKey: ["admin", "properties-full"] });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "properties"] });
      qc.invalidateQueries({ queryKey: ["admin", "properties-full"] });
    }
  });
}

export function useAdminRejectProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, review_note }: { id: string; review_note?: string }): Promise<Property> => {
      const res = await fetch(buildApiUrl(`admin/properties/${id}/reject`), {
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
      return json.data;
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ["admin"] });
      const updateData = (old: any) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map((p: any) => p.id === id ? { ...p, status: "rejected" } : p) };
      };
      qc.setQueriesData({ queryKey: ["admin", "properties"] }, updateData);
      qc.setQueriesData({ queryKey: ["admin", "properties-full"] }, updateData);
    },
    onSuccess: () => toast.success("Property rejected"),
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: ["admin", "properties"] });
      qc.invalidateQueries({ queryKey: ["admin", "properties-full"] });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "properties"] });
      qc.invalidateQueries({ queryKey: ["admin", "properties-full"] });
    }
  });
}

export function useAdminFeatureProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Property> => {
      const res = await fetch(buildApiUrl(`admin/properties/${id}/feature`), {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
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
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["admin"] });
      const updateData = (old: any) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map((p: any) => p.id === id ? { ...p, is_featured: !p.is_featured } : p) };
      };
      qc.setQueriesData({ queryKey: ["admin", "properties"] }, updateData);
      qc.setQueriesData({ queryKey: ["admin", "properties-full"] }, updateData);
    },
    onSuccess: () => toast.success("Property feature status updated"),
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: ["admin", "properties"] });
      qc.invalidateQueries({ queryKey: ["admin", "properties-full"] });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "properties"] });
      qc.invalidateQueries({ queryKey: ["admin", "properties-full"] });
    }
  });
}

// ── Owner mutations ───────────────────────────────────────────────────

export function useOwnerCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePropertyPayload): Promise<Property> => {
      const res = await fetch(buildApiUrl("owner/properties"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to create";
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
    onSuccess: (newProp) => {
      qc.setQueriesData({ queryKey: ["owner", "properties"] }, (old: any) => {
        if (!old || !old.data) return old;
        return { ...old, data: [newProp, ...old.data], total_items: (old.total_items || 0) + 1 };
      });
      qc.invalidateQueries({ queryKey: ["owner", "properties"] });
      toast.success("Property submitted for review!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useOwnerUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CreatePropertyPayload> }): Promise<Property> => {
      const res = await fetch(buildApiUrl(`owner/properties/${id}`), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
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
    onSuccess: (updatedProp) => {
      qc.setQueriesData({ queryKey: ["owner", "properties"] }, (old: any) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map((p: any) => p.id === updatedProp.id ? updatedProp : p) };
      });
      qc.invalidateQueries({ queryKey: ["owner", "properties"] });
      toast.success("Property updated successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useOwnerDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(buildApiUrl(`owner/properties/${id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || "Failed to delete");
      }
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["owner"] });
      qc.setQueriesData({ queryKey: ["owner", "properties"] }, (old: any) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.filter((p: any) => p.id !== id) };
      });
    },
    onSuccess: () => toast.success("Property deleted"),
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: ["owner", "properties"] });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["owner", "properties"] });
    }
  });
}

// ── Inquiries ─────────────────────────────────────────────────────────

export function useOwnerInquiries(options: { page?: number; page_size?: number } = {}) {
  return useQuery({
    queryKey: ["owner", "inquiries", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.page_size) params.set("page_size", String(options.page_size));
      const res = await fetch(`${buildApiUrl("owner/inquiries")}?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch inquiries");
      const json = await res.json();
      return { data: (json.data ?? []) as PropertyInquiry[], total_items: json.total_items ?? 0 };
    },
  });
}

export function useAdminInquiries(options: { page?: number; page_size?: number; property_id?: string } = {}) {
  return useQuery({
    queryKey: ["admin", "inquiries", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.page_size) params.set("page_size", String(options.page_size));
      if (options.property_id) params.set("property_id", options.property_id);
      const res = await fetch(`${buildApiUrl("admin/inquiries")}?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch inquiries");
      const json = await res.json();
      return { data: (json.data ?? []) as PropertyInquiry[], total_items: json.total_items ?? 0 };
    },
  });
}

export function useMarkInquiryRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(buildApiUrl(`owner/inquiries/${id}/read`), {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["owner", "inquiries"] });
      qc.setQueriesData({ queryKey: ["owner", "inquiries"] }, (old: any) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map((i: any) => i.id === id ? { ...i, is_read: true } : i) };
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["owner", "inquiries"] }),
  });
}
