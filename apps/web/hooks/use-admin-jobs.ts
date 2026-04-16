"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api";
import { toast } from "sonner";

export interface Job {
  id: string;
  title: string;
  description?: string;
  requirements?: string;
  qualifications?: string;
  company_id?: string;
  company_name: string;
  company_logo?: string;
  city?: string;
  location?: string;
  job_type?: string;
  experience_level?: string;
  career_level?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  category?: string;
  status: string;
  is_featured: boolean;
  is_active: boolean;
  deadline?: string;
  pdf_url?: string;
  views: number;
  applications_count?: number;
  created_at: string;
  updated_at: string;
  company?: {
    id: string;
    company_name: string;
    slug?: string;
    logo_url?: string;
  };
  posted_by?: { id: string; first_name: string; last_name: string; email: string };
  [key: string]: unknown;
}

export interface JobApplication {
  id: string;
  job_id: string;
  job?: Job;
  user_id: string;
  applicant?: { id: string; first_name: string; last_name: string; email: string };
  full_name: string;
  email: string;
  phone?: string;
  cover_letter?: string;
  cv_url?: string;
  status: string;
  notes?: string;
  applied_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total_items: number;
  total_pages: number;
  page: number;
  page_size: number;
}

interface UseJobsOptions {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  category?: string;
  company_id?: string;
  job_id?: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("ansell_auth_token") : null;
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

// ── Query hooks ───────────────────────────────────────────────────────

export function useAdminJobs(options: UseJobsOptions = {}) {
  return useQuery({
    queryKey: ["admin", "jobs", options],
    queryFn: async (): Promise<PaginatedResponse<Job>> => {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.page_size) params.set("page_size", String(options.page_size));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      if (options.category) params.set("category", options.category);
      if (options.company_id) params.set("company_id", options.company_id);
      const res = await fetch(`${buildApiUrl("admin/jobs")}?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const json = await res.json();
      return {
        data: json.data ?? [],
        total_items: json.total_items ?? 0,
        total_pages: json.total_pages ?? 1,
        page: json.page ?? 1,
        page_size: json.page_size ?? 20,
      };
    },
  });
}

export function useAdminJobApplications(options: UseJobsOptions = {}) {
  return useQuery({
    queryKey: ["admin", "job-applications", options],
    queryFn: async (): Promise<PaginatedResponse<JobApplication>> => {
      const params = new URLSearchParams();
      if (options.page) params.set("page", String(options.page));
      if (options.page_size) params.set("page_size", String(options.page_size));
      if (options.search) params.set("search", options.search);
      if (options.status) params.set("status", options.status);
      if (options.job_id) params.set("job_id", options.job_id);
      const res = await fetch(`${buildApiUrl("admin/job-applications")}?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch job applications");
      const json = await res.json();
      return {
        data: json.data ?? [],
        total_items: json.total_items ?? 0,
        total_pages: json.total_pages ?? 1,
        page: json.page ?? 1,
        page_size: json.page_size ?? 20,
      };
    },
  });
}

// ── Admin job mutations ───────────────────────────────────────────────

export function useAdminCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Job>): Promise<Job> => {
      const res = await fetch(buildApiUrl("admin/jobs"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
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
      qc.setQueriesData({ queryKey: ["admin", "jobs"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: [newJob, ...old.data], total_items: (old.total_items || 0) + 1 };
      });
      qc.invalidateQueries({ queryKey: ["admin", "jobs"] });
      toast.success("Job created successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAdminUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Job> }): Promise<Job> => {
      const res = await fetch(buildApiUrl(`admin/jobs/${id}`), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
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
      qc.setQueriesData({ queryKey: ["admin", "jobs"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((j: Job) => j.id === updated.id ? updated : j) };
      });
      qc.invalidateQueries({ queryKey: ["admin", "jobs"] });
      toast.success("Job updated successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAdminDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(buildApiUrl(`admin/jobs/${id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete job");
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "jobs"] });
      qc.setQueriesData({ queryKey: ["admin", "jobs"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.filter((j: Job) => j.id !== id), total_items: Math.max(0, (old.total_items || 1) - 1) };
      });
    },
    onSuccess: () => toast.success("Job deleted"),
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: ["admin", "jobs"] });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "jobs"] }),
  });
}

export function useAdminApproveJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Job> => {
      const res = await fetch(buildApiUrl(`admin/jobs/${id}/approve`), {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to approve job";
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
      await qc.cancelQueries({ queryKey: ["admin", "jobs"] });
      qc.setQueriesData({ queryKey: ["admin", "jobs"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((j: Job) => j.id === id ? { ...j, status: "active" } : j) };
      });
    },
    onSuccess: () => toast.success("Job approved and set to active"),
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: ["admin", "jobs"] });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "jobs"] }),
  });
}

export function useAdminRejectJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }): Promise<Job> => {
      const res = await fetch(buildApiUrl(`admin/jobs/${id}/reject`), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to reject job";
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
      await qc.cancelQueries({ queryKey: ["admin", "jobs"] });
      qc.setQueriesData({ queryKey: ["admin", "jobs"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((j: Job) => j.id === id ? { ...j, status: "rejected" } : j) };
      });
    },
    onSuccess: () => toast.success("Job rejected"),
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: ["admin", "jobs"] });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "jobs"] }),
  });
}

export function useAdminFeatureJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Job> => {
      const res = await fetch(buildApiUrl(`admin/jobs/${id}/feature`), {
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
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin", "jobs"] });
      qc.setQueriesData({ queryKey: ["admin", "jobs"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((j: Job) => j.id === id ? { ...j, is_featured: !j.is_featured } : j) };
      });
    },
    onSuccess: () => toast.success("Featured status updated"),
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: ["admin", "jobs"] });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "jobs"] }),
  });
}

export function useAdminUpdateApplicationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }): Promise<JobApplication> => {
      const res = await fetch(buildApiUrl(`admin/job-applications/${id}/status`), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) {
  const text = await res.text();
  let errMsg = "Failed to update status";
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
      await qc.cancelQueries({ queryKey: ["admin", "job-applications"] });
      qc.setQueriesData({ queryKey: ["admin", "job-applications"] }, (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: old.data.map((a: JobApplication) => a.id === id ? { ...a, status, notes } : a) };
      });
    },
    onSuccess: () => toast.success("Application status updated"),
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: ["admin", "job-applications"] });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin", "job-applications"] }),
  });
}
