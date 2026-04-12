"use client";

import { useQuery } from "@tanstack/react-query";
import { buildApiUrl } from "@/lib/api";

export interface Course {
  id: string;
  title: string;
  description?: string;
  instructor_name?: string;
  instructor_bio?: string;
  instructor_avatar?: string;
  category?: string;
  level?: string;
  price?: number;
  currency?: string;
  duration_hours?: number;
  thumbnail_url?: string;
  preview_video_url?: string;
  is_featured: boolean;
  is_active: boolean;
  enrolled_count: number;
  views: number;
  rating?: number;
  reviews_count?: number;
  language?: string;
  tags?: string;
  status?: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface CoursesResponse {
  data: Course[];
  total_items: number;
  total_pages: number;
  page: number;
  page_size: number;
}

export interface CourseCategory {
  category: string;
  count: number;
}

interface UseCoursesOptions {
  search?: string;
  category?: string;
  level?: string;
  is_featured?: boolean;
  page?: number;
  page_size?: number;
}

async function fetchCourses(options: UseCoursesOptions): Promise<CoursesResponse> {
  const params = new URLSearchParams();
  if (options.search) params.set("search", options.search);
  if (options.category) params.set("category", options.category);
  if (options.level) params.set("level", options.level);
  if (options.is_featured) params.set("is_featured", "true");
  if (options.page) params.set("page", String(options.page));
  if (options.page_size) params.set("page_size", String(options.page_size));

  const res = await fetch(`${buildApiUrl("courses")}?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch courses");
  const json = await res.json();
  return {
    data: json.data ?? [],
    total_items: json.total_items ?? 0,
    total_pages: json.total_pages ?? 1,
    page: json.page ?? 1,
    page_size: json.page_size ?? 20,
  };
}

async function fetchCourse(id: string): Promise<Course> {
  const res = await fetch(buildApiUrl(`courses/${id}`));
  if (!res.ok) throw new Error("Course not found");
  const json = await res.json();
  return json.data as Course;
}

async function fetchCourseCategories(): Promise<CourseCategory[]> {
  const res = await fetch(buildApiUrl("courses/categories"));
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data ?? []) as CourseCategory[];
}

export function useCourses(options: UseCoursesOptions = {}) {
  return useQuery({
    queryKey: ["courses", options],
    queryFn: () => fetchCourses(options),
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ["course", id],
    queryFn: () => fetchCourse(id),
    enabled: !!id,
  });
}

export function useCourseCategories() {
  return useQuery({
    queryKey: ["course-categories"],
    queryFn: fetchCourseCategories,
  });
}
