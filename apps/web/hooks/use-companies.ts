"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api";
import { toast } from "sonner";

export interface Company {
  id: string;
  company_name: string;
  slug: string;
  description?: string;
  industry?: string;
  company_type?: string;
  employee_count?: string;
  website?: string;
  email?: string;
  phone_number?: string;
  city?: string;
  address?: string;
  logo_url?: string;
  cover_image_url?: string;
  is_verified: boolean;
  is_active: boolean;
  is_featured?: boolean;
  jobs_count?: number;
  tenders_count?: number;
  views?: number;
  owner_id?: string;
  status: string;
  size?: string;
  phone?: string;
  founded_year?: string | number;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface CompanyApplication {
  id: string;
  company_name: string;
  industry?: string;
  description?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  document_url?: string;
  status: string;
  reviewer_note?: string;
  user_id: string;
  applicant?: { id: string; first_name: string; last_name: string; email: string };
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

interface UseCompaniesOptions {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  industry?: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("ansell_auth_token") : null;
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

// ── Admin queries ─────────────────────────────────────────────────────

export function useAdminCompanies(options: UseCompaniesOptions = {}) {
  return useQuery({
    queryKey: ["admin", "companies", options],
    queryFn: async (): Promise<PaginatedResponse<Company>> => {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.page_size) params.set("page_size", String(options.page_size));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      if (options.industry) params.set("industry", options.industry);
      const res = await fetch(`${buildApiUrl("admin/companies")}?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch companies");
      const json = await res.json();
      return { data: json.data ?? [], total_items: json.total_items ?? 0, total_pages: json.total_pages ?? 1, page: json.page ?? 1, page_size: json.page_size ?? 20 };
    },
  });
}

export function useAdminCompanyApplications(options: UseCompaniesOptions = {}) {
  return useQuery({
    queryKey: ["admin", "company-applications", options],
    queryFn: async (): Promise<PaginatedResponse<CompanyApplication>> => {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.page_size) params.set("page_size", String(options.page_size));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      const res = await fetch(`${buildApiUrl("admin/company-applications")}?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch company applications");
      const json = await res.json();
      return { data: json.data ?? [], total_items: json.total_items ?? 0, total_pages: json.total_pages ?? 1, page: json.page ?? 1, page_size: json.page_size ?? 20 };
    },
  });
}

// ── Company portal queries ─────────────────────────────────────────────

export function useMyCompany() {
  return useQuery({
    queryKey: ["company", "my"],
    queryFn: async (): Promise<Company | null> => {
      const res = await fetch(buildApiUrl("company-owner/company"), { headers: getAuthHeaders() });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? null;
    },
  });
}

// ── Admin mutations ────────────────────────────────────────────────────

export function useAdminApproveCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Company> => {
      const res = await fetch(buildApiUrl(`admin/companies/${id}/approve`), { method: "PATCH", headers: getAuthHeaders() });
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
      await qc.cancelQueries({ queryKey: ["admin", "companies"] });
      qc.setQueriesData({ queryKey: ["admin", "companies"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((c: Company) => c.id === id ? { ...c, status: "active", is_verified: true } : c) };
      });
    },
    onSuccess: () => toast.success("Company approved"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "companies"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "companies"] }),
  });
}

export function useAdminRejectCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }): Promise<Company> => {
      const res = await fetch(buildApiUrl(`admin/companies/${id}/reject`), {
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
      await qc.cancelQueries({ queryKey: ["admin", "companies"] });
      qc.setQueriesData({ queryKey: ["admin", "companies"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((c: Company) => c.id === id ? { ...c, status: "rejected" } : c) };
      });
    },
    onSuccess: () => toast.success("Company rejected"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "companies"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "companies"] }),
  });
}

export function useAdminDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(buildApiUrl(`admin/companies/${id}`), { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to delete company");
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "companies"] });
      qc.setQueriesData({ queryKey: ["admin", "companies"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.filter((c: Company) => c.id !== id), total_items: Math.max(0, (old.total_items || 1) - 1) };
      });
    },
    onSuccess: () => toast.success("Company deleted"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "companies"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "companies"] }),
  });
}

export function useAdminFeatureCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Company> => {
      const res = await fetch(buildApiUrl(`admin/companies/${id}/feature`), { method: "PATCH", headers: getAuthHeaders() });
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
      await qc.cancelQueries({ queryKey: ["admin", "companies"] });
      qc.setQueriesData({ queryKey: ["admin", "companies"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((c: Company) => c.id === id ? { ...c, is_featured: !c.is_featured } : c) };
      });
    },
    onSuccess: () => toast.success("Featured status updated"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "companies"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "companies"] }),
  });
}

export function useAdminApproveCompanyApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<CompanyApplication> => {
      const res = await fetch(buildApiUrl(`admin/company-applications/${id}/approve`), { method: "PATCH", headers: getAuthHeaders() });
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
      await qc.cancelQueries({ queryKey: ["admin", "company-applications"] });
      qc.setQueriesData({ queryKey: ["admin", "company-applications"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((a: CompanyApplication) => a.id === id ? { ...a, status: "approved" } : a) };
      });
    },
    onSuccess: () => toast.success("Company application approved"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "company-applications"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "company-applications"] }),
  });
}

export function useAdminRejectCompanyApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }): Promise<CompanyApplication> => {
      const res = await fetch(buildApiUrl(`admin/company-applications/${id}/reject`), {
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
      await qc.cancelQueries({ queryKey: ["admin", "company-applications"] });
      qc.setQueriesData({ queryKey: ["admin", "company-applications"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((a: CompanyApplication) => a.id === id ? { ...a, status: "rejected" } : a) };
      });
    },
    onSuccess: () => toast.success("Company application rejected"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin", "company-applications"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "company-applications"] }),
  });
}

// ── Company portal mutations ────────────────────────────────────────────

export function useSubmitCompanyApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CompanyApplication>): Promise<CompanyApplication> => {
      const res = await fetch(buildApiUrl("company/apply"), {
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
      qc.invalidateQueries({ queryKey: ["company"] });
      toast.success("Application submitted successfully!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCompanyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Company>): Promise<Company> => {
      const res = await fetch(buildApiUrl("company-owner/company"), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to update profile";
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
      qc.setQueryData(["company", "my"], updated);
      toast.success("Profile updated successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Company job management ─────────────────────────────────────────────

export function useCompanyJobs(options: UseCompaniesOptions = {}) {
  return useQuery({
    queryKey: ["company", "jobs", options],
    queryFn: async (): Promise<PaginatedResponse<import("./use-admin-jobs").Job>> => {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.page_size) params.set("page_size", String(options.page_size));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      const res = await fetch(`${buildApiUrl("company-owner/jobs")}?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch company jobs");
      const json = await res.json();
      return { data: json.data ?? [], total_items: json.total_items ?? 0, total_pages: json.total_pages ?? 1, page: json.page ?? 1, page_size: json.page_size ?? 20 };
    },
  });
}

export function useCompanyCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<import("./use-admin-jobs").Job>): Promise<import("./use-admin-jobs").Job> => {
      const res = await fetch(buildApiUrl("company-owner/jobs"), {
        method: "POST", headers: getAuthHeaders(), body: JSON.stringify(payload),
      });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to create job";
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
    onSuccess: (newJob) => {
      qc.setQueriesData({ queryKey: ["company", "jobs"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: [newJob, ...old.data], total_items: (old.total_items || 0) + 1 };
      });
      qc.invalidateQueries({ queryKey: ["company", "jobs"] });
      toast.success("Job posted successfully!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCompanyUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<import("./use-admin-jobs").Job> }): Promise<import("./use-admin-jobs").Job> => {
      const res = await fetch(buildApiUrl(`company-owner/jobs/${id}`), {
        method: "PUT", headers: getAuthHeaders(), body: JSON.stringify(payload),
      });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to update job";
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
      qc.setQueriesData({ queryKey: ["company", "jobs"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((j: any) => j.id === updated.id ? updated : j) };
      });
      qc.invalidateQueries({ queryKey: ["company", "jobs"] });
      toast.success("Job updated successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCompanyDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(buildApiUrl(`company-owner/jobs/${id}`), { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to delete job");
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["company", "jobs"] });
      qc.setQueriesData({ queryKey: ["company", "jobs"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.filter((j: any) => j.id !== id), total_items: Math.max(0, (old.total_items || 1) - 1) };
      });
    },
    onSuccess: () => toast.success("Job deleted"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["company", "jobs"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["company", "jobs"] }),
  });
}

export function useCompanyJobApplications(jobId?: string) {
  return useQuery({
    queryKey: ["company", "job-applications", jobId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page_size", "100");
      if (jobId) params.set("job_id", jobId);
      const res = await fetch(`${buildApiUrl("company-owner/applications")}?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch applications");
      const json = await res.json();
      return { data: (json.data ?? []) as import("./use-admin-jobs").JobApplication[], total_items: json.total_items ?? 0 };
    },
  });
}

export function useCompanyUpdateApplicationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const res = await fetch(buildApiUrl(`company-owner/applications/${id}/status`), {
        method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ status, notes }),
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
    onMutate: async ({ id, status, notes }) => {
      await qc.cancelQueries({ queryKey: ["company", "job-applications"] });
      qc.setQueriesData({ queryKey: ["company", "job-applications"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((a: any) => a.id === id ? { ...a, status, notes } : a) };
      });
    },
    onSuccess: () => toast.success("Application status updated"),
    onError: (e: Error) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["company", "job-applications"] }); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["company", "job-applications"] }),
  });
}
// ── Public queries ────────────────────────────────────────────────────

export function usePublicCompanies(options: UseCompaniesOptions = {}) {
  return useQuery({
    queryKey: ["public", "companies", options],
    queryFn: async (): Promise<PaginatedResponse<Company>> => {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.page_size) params.set("page_size", String(options.page_size));
      if (options.search) params.set("search", options.search);
      if (options.industry) params.set("industry", options.industry);
      const res = await fetch(`${buildApiUrl("companies")}?${params}`);
      if (!res.ok) throw new Error("Failed to fetch companies");
      const json = await res.json();
      return { 
        data: json.data ?? [], 
        total_items: json.total_items ?? 0, 
        total_pages: json.total_pages ?? 1, 
        page: json.page ?? 1, 
        page_size: json.page_size ?? 20 
      };
    },
  });
}

export function usePublicCompany(slug: string) {
  return useQuery({
    queryKey: ["public", "company", slug],
    queryFn: async (): Promise<Company> => {
      const res = await fetch(buildApiUrl(`companies/${slug}`));
      if (!res.ok) throw new Error("Company not found");
      const json = await res.json();
      return json.data;
    },
    enabled: !!slug,
  });
}
