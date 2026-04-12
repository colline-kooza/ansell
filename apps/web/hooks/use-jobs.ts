import { useQuery } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api";

export interface Job {
  id: string;
  title: string;
  company_name: string;
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
  created_at: string;
  deadline?: string;
  description?: string;
  requirements?: string;
  is_featured?: boolean;
  company_id?: string;
  company?: {
    id: string;
    company_name: string;
    slug: string;
    logo_url?: string;
  };
  [key: string]: unknown;
}

interface JobsResponse {
  data: Job[];
  total_items: number;
  total_pages: number;
  page: number;
  page_size: number;
}

interface UseJobsOptions {
  search?: string;
  city?: string;
  category?: string;
  job_type?: string;
  experience_level?: string;
  career_level?: string;
  salary_min?: string;
  salary_max?: string;
  status?: string;
  company_id?: string;
  page?: number;
  page_size?: number;
  enabled?: boolean;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ansell_auth_token");
}

async function fetchJobs(options: UseJobsOptions): Promise<JobsResponse> {
  const params = new URLSearchParams();

  if (options.search) params.set("search", options.search);
  if (options.city) params.set("city", options.city);
  if (options.category) params.set("category", options.category);
  if (options.job_type) params.set("job_type", options.job_type);
  if (options.experience_level)
    params.set("experience_level", options.experience_level);
  if (options.career_level) params.set("career_level", options.career_level);
  if (options.salary_min) params.set("salary_min", options.salary_min);
  if (options.salary_max) params.set("salary_max", options.salary_max);
  if (options.status) params.set("status", options.status);
  if (options.company_id) params.set("company_id", options.company_id);
  if (options.page) params.set("page", String(options.page));
  if (options.page_size) params.set("page_size", String(options.page_size));

  const token = getAuthToken();
  const response = await fetch(
    `${buildApiUrl("jobs")}?${params.toString()}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch jobs: ${response.status}`);
  }

  return response.json() as Promise<JobsResponse>;
}

export function useJobs(options: UseJobsOptions = {}) {
  const { enabled = true, ...fetchOptions } = options;
  return useQuery({
    queryKey: ["jobs", fetchOptions],
    queryFn: () => fetchJobs(fetchOptions),
    enabled,
  });
}
