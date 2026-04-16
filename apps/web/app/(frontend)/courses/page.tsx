"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen, GraduationCap, MapPin, Clock, Eye,
  Zap, Tag, Calendar, ChevronRight,
} from "lucide-react";
import { useCourses, useCourseCategories, type Course } from "@/hooks/use-courses";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { formatDistanceToNow } from "date-fns";

// ─── Course Card (tender-style) ───────────────────────────────────────────────

function CourseCard({ course, index }: { course: Course; index: number }) {
  const [imgError, setImgError] = useState(false);
  const thumbnail = course.thumbnail_url;
  const providerName = course.instructor_name || "Ansell Academy";
  const initial = providerName.charAt(0).toUpperCase();
  const colors = ["bg-blue-500", "bg-purple-500", "bg-teal-500", "bg-amber-500", "bg-rose-500", "bg-emerald-500"];
  const logoBg = !thumbnail || imgError ? colors[providerName.length % colors.length] : "bg-white border border-gray-100";
  const postedAgo = (course as any).created_at
    ? formatDistanceToNow(new Date((course as any).created_at), { addSuffix: true })
    : null;
  const views = (course as any).views as number | undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      className="group relative rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-gray-100"
    >
      <Link href={`/courses/${course.id}`} className="absolute inset-0 z-10" aria-label={course.title} />

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Provider avatar / thumbnail */}
        <div className={`size-12 shrink-0 rounded-xl flex items-center justify-center overflow-hidden text-white font-bold text-lg relative z-20 ${logoBg}`}>
          {thumbnail && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail}
              alt={course.title}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover rounded-xl"
            />
          ) : (
            initial
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h3 className="text-[15px] font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
              {course.title}
            </h3>
            {course.is_featured && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary shrink-0">
                Featured
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-3">
            by <span className="font-semibold text-gray-800">{providerName}</span>
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {course.category && (
              <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-medium text-blue-700">
                <Tag className="size-3" />{course.category}
              </span>
            )}
            {(course as any).level && (
              <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 font-medium text-purple-700">
                <GraduationCap className="size-3" />{(course as any).level}
              </span>
            )}
            {(course as any).city && (
              <span className="flex items-center gap-1 text-gray-500">
                <MapPin className="size-3" />{(course as any).city}
              </span>
            )}
            {course.duration_hours != null && (
              <span className="flex items-center gap-1 text-gray-500">
                <Clock className="size-3" />{course.duration_hours} hrs
              </span>
            )}
            {views != null && views > 0 && (
              <span className="flex items-center gap-1 text-gray-400">
                <Eye className="size-3" />{views.toLocaleString()} views
              </span>
            )}
            {postedAgo && (
              <span className="flex items-center gap-1 text-gray-400">
                <Calendar className="size-3" />{postedAgo}
              </span>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="flex shrink-0 items-center relative z-20">
          <span className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-[12px] font-semibold text-primary">
            <ChevronRight className="size-3.5" />
            View Details
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CourseSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex gap-4">
        <div className="size-12 rounded-xl bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-gray-200" />
          <div className="h-3 w-1/2 rounded bg-gray-200" />
          <div className="flex gap-2 mt-3">
            <div className="h-5 w-20 rounded-full bg-gray-200" />
            <div className="h-5 w-24 rounded-full bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function CoursesContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [category, setCategory] = useState(initialCategory);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCourses({
    category: category === "all" ? undefined : category,
    page,
    page_size: 15,
  });

  const { data: categoriesData } = useCourseCategories();

  const courses = data?.data ?? [];
  const total = data?.total_items ?? 0;
  const totalPages = data?.total_pages ?? 1;

  const allCategories = [
    { label: "All Courses", value: "all" },
    ...(categoriesData ?? []).map((c) => ({ label: c.category, value: c.category })),
  ];

  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      {/* Page header */}
      <section className="relative border-b border-border/50 bg-white px-4 py-8">
        <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,rgba(180,253,131,0.18),transparent_70%)] pointer-events-none" />
        <div className="mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary shadow-sm"
          >
            <GraduationCap className="size-3" />
            Course Listings
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-2 text-2xl font-bold text-foreground md:text-3xl"
          >
            Advertised <span className="text-primary">Courses</span>
          </motion.h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <strong className="text-foreground">{total}</strong> courses currently advertised
          </p>
        </div>
      </section>

      {/* Category tab strip */}
      <div className="sticky top-0 z-30 border-b border-border/50 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-3 py-2 sm:px-6 lg:px-8 [scrollbar-width:none]">
          {allCategories.slice(0, 10).map((cat) => (
            <button
              key={cat.value}
              onClick={() => { setCategory(cat.value); setPage(1); }}
              className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                category === cat.value
                  ? "border-foreground bg-foreground text-white"
                  : "border-border bg-white text-foreground hover:border-foreground/60"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <CourseSkeleton key={i} />)
            : courses.length > 0
            ? courses.map((course, i) => <CourseCard key={course.id} course={course} index={i} />)
            : (
              <div className="rounded-xl border border-dashed border-border bg-white py-14 text-center">
                <BookOpen className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                <p className="text-sm font-semibold text-foreground">No courses advertised yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Check back soon for new course listings.</p>
              </div>
            )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-8 text-xs">Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="h-8 text-xs">Next</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4f8fb] flex items-center justify-center"><GraduationCap className="size-6 animate-pulse text-primary" /></div>}>
      <CoursesContent />
    </Suspense>
  );
}
