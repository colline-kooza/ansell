"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api";

export interface Tender {
  id: string;
  posted_by_id: string;
  company_id?: string;
  issuing_organisation: string;
  issuing_organisation_logo?: string;
  title: string;
  reference_number?: string;
  description?: string;
  category?: string;
  tender_type?: string;
  value_estimate?: number;
  value_currency?: string;
  city?: string;
  location?: string;
  eligibility_criteria?: string;
  required_documents?: string;
  submission_deadline?: string;
  tender_open_date?: string;
  bid_opening_date?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  attachment_url?: string;
  is_featured: boolean;
  status: string;
  is_active: boolean;
  bid_count: number;
  views: number;
  created_at: string;
  updated_at: string;
  company?: {
    id: string;
    company_name: string;
    slug: string;
    logo_url?: string;
  };
}

export interface TenderCategory {
  category: string;
  count: number;
}

interface TendersResponse {
  data: Tender[];
  total_items: number;
  total_pages: number;
  page: number;
  page_size: number;
}

interface UseTendersOptions {
  search?: string;
  category?: string;
  tender_type?: string;
  city?: string;
  status?: string;
  issuing_organisation?: string;
  is_featured?: boolean;
  closing_soon?: boolean;
  page?: number;
  page_size?: number;
  enabled?: boolean;
}

async function fetchTenders(options: UseTendersOptions): Promise<TendersResponse> {
  const params = new URLSearchParams();
  if (options.search) params.set("search", options.search);
  if (options.category) params.set("category", options.category);
  if (options.tender_type) params.set("tender_type", options.tender_type);
  if (options.city) params.set("city", options.city);
  if (options.status) params.set("status", options.status);
  if (options.is_featured) params.set("is_featured", "true");
  if (options.closing_soon) params.set("closing_soon", "true");
  if (options.issuing_organisation) params.set("issuing_organisation", options.issuing_organisation);
  if (options.page) params.set("page", String(options.page));
  if (options.page_size) params.set("page_size", String(options.page_size));

  const res = await fetch(`${buildApiUrl("tenders")}?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch tenders");
  const json = await res.json();
  return {
    data: json.data ?? [],
    total_items: json.total_items ?? 0,
    total_pages: json.total_pages ?? 1,
    page: json.page ?? 1,
    page_size: json.page_size ?? 20,
  };
}

async function fetchTender(id: string): Promise<Tender> {
  const res = await fetch(buildApiUrl(`tenders/${id}`));
  if (!res.ok) throw new Error("Tender not found");
  const json = await res.json();
  return json.data as Tender;
}

async function fetchTenderCategories(): Promise<TenderCategory[]> {
  const res = await fetch(buildApiUrl("tenders/categories"));
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data ?? []) as TenderCategory[];
}

export function useTenders(options: UseTendersOptions = {}) {
  const { enabled = true, ...fetchOptions } = options;
  return useQuery({
    queryKey: ["tenders", fetchOptions],
    queryFn: () => fetchTenders(fetchOptions),
    enabled,
  });
}

export function useTender(id: string) {
  return useQuery({
    queryKey: ["tender", id],
    queryFn: () => fetchTender(id),
    enabled: !!id,
  });
}

export function useTenderCategories() {
  return useQuery({
    queryKey: ["tender-categories"],
    queryFn: fetchTenderCategories,
  });
}
