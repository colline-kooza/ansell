import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

export interface JobApplication {
  id: string;
  job_id: string;
  user_id: string;
  job?: {
    id: string;
    title: string;
    company_name: string;
    city?: string;
    job_type?: string;
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
  };
  full_name: string;
  email: string;
  phone?: string;
  cover_letter?: string;
  resume_url?: string;
  status: "pending" | "reviewing" | "shortlisted" | "interview" | "offer" | "rejected" | "withdrawn";
  notes?: string;
  applied_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface ApplicationsResponse {
  data: JobApplication[];
  total_items: number;
  total_pages: number;
  page: number;
  page_size: number;
}

// ── Auth helper ────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("ansell_auth_token") : null;
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

// ── Fetch ──────────────────────────────────────────────────────────────────

async function fetchMyApplications(options: {
  page?: number;
  page_size?: number;
  status?: string;
}): Promise<ApplicationsResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set("page", String(options.page));
  if (options.page_size) params.set("page_size", String(options.page_size));
  if (options.status) params.set("status", options.status);

  const res = await fetch(
    `${buildApiUrl("user/job-applications")}?${params.toString()}`,
    { headers: getAuthHeaders() }
  );

  if (!res.ok) throw new Error(`Failed to fetch applications: ${res.status}`);

  const json = await res.json();
  return {
    data: json.data ?? [],
    total_items: json.total_items ?? json.total ?? 0,
    total_pages: json.total_pages ?? json.pages ?? 1,
    page: json.page ?? 1,
    page_size: json.page_size ?? 20,
  };
}

async function fetchAdminApplications(options: {
  page?: number;
  page_size?: number;
  status?: string;
  job_id?: string;
}): Promise<ApplicationsResponse> {
  const params = new URLSearchParams();
  if (options.page) params.set("page", String(options.page));
  if (options.page_size) params.set("page_size", String(options.page_size));
  if (options.status) params.set("status", options.status);
  if (options.job_id) params.set("job_id", options.job_id);

  const res = await fetch(
    `${buildApiUrl("admin/job-applications")}?${params.toString()}`,
    { headers: getAuthHeaders() }
  );

  if (!res.ok) throw new Error(`Failed to fetch applications: ${res.status}`);

  const json = await res.json();
  return {
    data: json.data ?? [],
    total_items: json.total_items ?? json.total ?? 0,
    total_pages: json.total_pages ?? json.pages ?? 1,
    page: json.page ?? 1,
    page_size: json.page_size ?? 20,
  };
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useMyJobApplications(
  options: { page?: number; page_size?: number; status?: string } = {}
) {
  return useQuery({
    queryKey: ["user", "job-applications", options],
    queryFn: () => fetchMyApplications(options),
    retry: false,
  });
}

export function useAdminJobApplications(
  options: {
    page?: number;
    page_size?: number;
    status?: string;
    job_id?: string;
  } = {}
) {
  return useQuery({
    queryKey: ["admin", "job-applications", options],
    queryFn: () => fetchAdminApplications(options),
  });
}

export function useWithdrawApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(buildApiUrl(`user/job-applications/${id}/withdraw`), {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to withdraw application");
      return res.json();
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["user", "job-applications"] });
      qc.setQueriesData({ queryKey: ["user", "job-applications"] }, (old: any) => {
        if (!old || !old.data) return old;
        return { ...old, data: old.data.map((app: any) => app.id === id ? { ...app, status: "withdrawn" } : app) };
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["user", "job-applications"] }),
  });
}

export function useUpdateApplicationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: JobApplication["status"];
      notes?: string;
    }) => {
      const res = await fetch(buildApiUrl(`admin/job-applications/${id}/status`), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onMutate: async ({ id, status, notes }) => {
      await qc.cancelQueries({ queryKey: ["admin", "job-applications"] });
      await qc.cancelQueries({ queryKey: ["user", "job-applications"] });
      const updateData = (old: any) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((app: any) => app.id === id ? { ...app, status, notes } : app)
        };
      };
      qc.setQueriesData({ queryKey: ["admin", "job-applications"] }, updateData);
      qc.setQueriesData({ queryKey: ["user", "job-applications"] }, updateData);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "job-applications"] });
      qc.invalidateQueries({ queryKey: ["user", "job-applications"] });
    },
  });
}
