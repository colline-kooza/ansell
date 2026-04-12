"use client";

import { useQuery } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api";

export interface VideoAdvert {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  thumbnail_url?: string;
  company_name?: string;
  company_logo?: string;
  category?: string;
  duration_seconds?: number;
  is_featured: boolean;
  is_active: boolean;
  views: number;
  status?: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface VideoCategory {
  category: string;
  count: number;
}

interface VideoAdvertsResponse {
  data: VideoAdvert[];
  total_items: number;
  total_pages: number;
  page: number;
  page_size: number;
}

interface UseVideoAdvertsOptions {
  search?: string;
  category?: string;
  is_featured?: boolean;
  page?: number;
  page_size?: number;
}

async function fetchVideoAdverts(options: UseVideoAdvertsOptions): Promise<VideoAdvertsResponse> {
  const params = new URLSearchParams();
  if (options.search) params.set("search", options.search);
  if (options.category) params.set("category", options.category);
  if (options.is_featured) params.set("is_featured", "true");
  if (options.page) params.set("page", String(options.page));
  if (options.page_size) params.set("page_size", String(options.page_size));

  const res = await fetch(`${buildApiUrl("video-adverts")}?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch video adverts");
  const json = await res.json();
  return {
    data: json.data ?? [],
    total_items: json.total_items ?? 0,
    total_pages: json.total_pages ?? 1,
    page: json.page ?? 1,
    page_size: json.page_size ?? 20,
  };
}

async function fetchVideoAdvert(id: string): Promise<VideoAdvert> {
  const res = await fetch(buildApiUrl(`video-adverts/${id}`));
  if (!res.ok) throw new Error("Video advert not found");
  const json = await res.json();
  return json.data as VideoAdvert;
}

async function fetchVideoCategories(): Promise<VideoCategory[]> {
  const res = await fetch(buildApiUrl("video-adverts/categories"));
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data ?? []) as VideoCategory[];
}

export function useVideoAdverts(options: UseVideoAdvertsOptions = {}) {
  return useQuery({
    queryKey: ["video-adverts", options],
    queryFn: () => fetchVideoAdverts(options),
  });
}

export function useVideoAdvert(id: string) {
  return useQuery({
    queryKey: ["video-advert", id],
    queryFn: () => fetchVideoAdvert(id),
    enabled: !!id,
  });
}

export function useVideoCategories() {
  return useQuery({
    queryKey: ["video-categories"],
    queryFn: fetchVideoCategories,
  });
}
