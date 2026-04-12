"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Search, Play, BookOpen, Clock,
  Star, Award, CheckCircle2, X, TrendingUp, Globe,
  Briefcase, Code, Palette, BarChart3, HeartHandshake, Leaf,
  GraduationCap, Users, Loader2,
} from "lucide-react";
import { useCourses, useCourseCategories, type Course } from "@/hooks/use-courses";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";

// ─── Hero ─────────────────────────────────────────────────────────────────────

const HERO_IMAGES = Array.from({ length: 12 }, (_, i) => `https://picsum.photos/seed/course-bg-${i}/400/300`);

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Business: Briefcase, Technology: Code, Agriculture: Leaf, Design: Palette,
  Finance: BarChart3, Development: TrendingUp, "NGO & Aid": HeartHandshake,
  Language: Globe, default: BookOpen,
};

function CoursesHero() {
  return (
    <div className="relative w-full h-[220px] md:h-[280px] overflow-hidden rounded-2xl bg-black">
      <div className="absolute inset-0 flex opacity-40">
        <div className="flex animate-marquee shrink-0">
          {[...HERO_IMAGES, ...HERO_IMAGES].map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="h-full shrink-0 object-cover" style={{ width: 200 }} />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-t from-black/60 to-transparent text-white">
        <span className="mb-2 text-[10px] font-medium opacity-90 md:text-xs">South Sudan&apos;s Leading Platform</span>
        <div className="mb-3 flex items-center gap-2">
          <div className="rounded-xl bg-primary p-1.5 md:p-2">
            <GraduationCap className="size-5 fill-current text-primary-foreground md:size-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight md:text-4xl">Ansell Courses</h1>
        </div>
        <p className="mb-5 max-w-sm text-center text-xs font-medium opacity-80 md:text-[13px]">
          Master in-demand skills with expert-led online and in-person training.
        </p>
      </div>
      <button className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/30 md:flex">
        <ChevronLeft className="size-5" />
      </button>
      <button className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/30 md:flex">
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({ course }: { course: Course }) {
  const thumbnail = course.thumbnail_url || `https://picsum.photos/seed/course-${course.id}/640/360`;
  const instructorAvatar = course.instructor_avatar || `https://picsum.photos/seed/inst-${course.id}/80/80`;
  const duration = course.duration_hours ? `${course.duration_hours} hrs` : null;

  return (
    <Link href={`/courses/${course.id}`} className="flex cursor-pointer flex-col gap-2.5 group">
      <div className="relative aspect-video overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnail}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="rounded-full bg-white/90 p-2.5 shadow-lg">
            <Play className="size-5 fill-current text-gray-900" />
          </div>
        </div>
        {duration && (
          <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {duration}
          </div>
        )}
        {course.is_featured && (
          <div className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            Featured
          </div>
        )}
      </div>

      <div className="flex gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={instructorAvatar}
          alt={course.instructor_name ?? "Instructor"}
          className="size-9 shrink-0 rounded-full object-cover"
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-gray-900 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          <div className="flex flex-col text-[11px] font-medium text-gray-500">
            <div className="flex items-center gap-1">
              <span>{course.instructor_name ?? "Ansell Expert"}</span>
              <CheckCircle2 className="size-3 fill-current text-emerald-500" />
            </div>
            <div className="flex items-center gap-1">
              <Users className="size-3" />
              <span>{(course.enrolled_count ?? 0).toLocaleString()} enrolled</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {course.rating && (
                <>
                  <span className="text-amber-600 font-bold">{Number(course.rating).toFixed(1)}</span>
                  <Star className="size-3 fill-amber-400 text-amber-400" />
                  {course.reviews_count && <span>({course.reviews_count})</span>}
                </>
              )}
              {course.price !== undefined && course.price !== null && (
                <span className="ml-1 font-semibold text-foreground">
                  {course.currency ?? "SSP"} {Number(course.price).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CourseSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-2.5">
      <div className="aspect-video w-full rounded-xl bg-gray-200" />
      <div className="flex gap-2.5">
        <div className="size-9 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-4/5 rounded bg-gray-200" />
          <div className="h-3 w-3/5 rounded bg-gray-200" />
          <div className="h-3 w-2/5 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const LEVELS = ["All Levels", "Beginner", "Intermediate", "Advanced"];

function CourseSidebar({
  category, setCategory, level, setLevel, onReset,
  apiCategories,
}: {
  category: string; setCategory: (v: string) => void;
  level: string; setLevel: (v: string) => void;
  onReset: () => void;
  apiCategories: { category: string; count: number }[];
}) {
  const allCategories = [
    { label: "All", value: "all" },
    ...apiCategories.map((c) => ({ label: c.category, value: c.category })),
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Filters</h2>
        <button type="button" onClick={onReset} className="text-[11px] font-medium text-primary hover:underline">Reset</button>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Category</h3>
        <div className="space-y-0.5">
          {allCategories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.label] ?? CATEGORY_ICONS.default;
            return (
              <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] transition-colors ${category === cat.value ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <Icon className="size-3.5 shrink-0" />{cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Level</h3>
        <div className="space-y-1.5">
          {LEVELS.map((lv) => {
            const active = level === lv;
            return (
              <label key={lv} className="flex cursor-pointer items-center gap-2" onClick={() => setLevel(lv)}>
                <div className={`flex size-3.5 items-center justify-center rounded border transition-colors ${active ? "border-primary bg-primary" : "border-border"}`}>
                  {active && <div className="size-1.5 rounded-sm bg-primary-foreground" />}
                </div>
                <span className={`text-xs ${active ? "font-medium text-foreground" : "text-muted-foreground"}`}>{lv}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl bg-primary/10 p-4 text-center">
        <Award className="mx-auto mb-2 size-6 text-primary" />
        <p className="text-xs font-semibold text-foreground">Teach on Ansell</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Share your expertise & earn income.</p>
        <button className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground transition hover:brightness-95">Start Teaching</button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function CoursesContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState("All Levels");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const s = searchParams.get("search") || "";
    setSearch(s);
    setDebouncedSearch(s);
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [category, level, debouncedSearch]);

  const { data, isLoading } = useCourses({
    search: debouncedSearch || undefined,
    category: category === "all" ? undefined : category,
    level: level === "All Levels" ? undefined : level,
    page,
    page_size: 12,
  });

  const { data: categoriesData } = useCourseCategories();

  const courses = data?.data ?? [];
  const totalPages = data?.total_pages ?? 1;
  const total = data?.total_items ?? 0;

  const handleReset = () => { setCategory("all"); setLevel("All Levels"); setSearch(""); setPage(1); };

  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <CoursesHero />
      </div>

      {/* Search + filter strip */}
      <div className="bg-white border-b border-border/40">
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {/* Mobile filter drawer */}
              <Sheet>
                <SheetTrigger asChild>
                  <button className="lg:hidden flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium shadow-sm">
                    <SlidersHorizontal className="size-3.5" />
                    Filters
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto pt-10 pb-10 px-6">
                  <SheetHeader className="mb-4">
                    <SheetTitle className="text-left text-sm">Filter Courses</SheetTitle>
                  </SheetHeader>
                  <CourseSidebar
                    category={category} setCategory={setCategory}
                    level={level} setLevel={setLevel}
                    onReset={handleReset}
                    apiCategories={categoriesData ?? []}
                  />
                </SheetContent>
              </Sheet>

              <div className="relative flex items-center rounded-md border border-border/50 bg-white shadow-sm">
                <Search className="ml-3 size-4 shrink-0 text-muted-foreground" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search courses..."
                  className="w-full flex-1 border-0 bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground min-w-0 w-44 sm:w-56" />
                {search && <button onClick={() => setSearch("")} className="mr-2.5"><X className="size-3.5 text-muted-foreground hover:text-foreground" /></button>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
              {[{ label: "All", value: "all" }, ...(categoriesData ?? []).map((c) => ({ label: c.category, value: c.category }))].slice(0, 8).map((cat) => (
                <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${category === cat.value ? "border-foreground bg-foreground text-white" : "border-border bg-white text-foreground hover:border-foreground/60"}`}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-8 items-start lg:flex-row">
          <aside className="hidden lg:block w-full shrink-0 lg:w-52 sticky top-20 self-start max-h-[calc(100vh-5.5rem)] overflow-y-auto pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <CourseSidebar
              category={category} setCategory={setCategory}
              level={level} setLevel={setLevel}
              onReset={handleReset}
              apiCategories={categoriesData ?? []}
            />
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-baseline gap-2">
                <h2 className="text-base font-bold text-gray-900">
                  {category === "all" ? "All Courses" : category}
                </h2>
                <span className="text-sm font-medium text-gray-500">{total} found</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex size-8 items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronLeft className="size-5 text-gray-400" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex size-8 items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronRight className="size-5 text-gray-600" />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <CourseSkeleton key={i} />)}
              </div>
            ) : courses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-white py-14 text-center">
                <GraduationCap className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                <p className="text-sm font-semibold text-foreground">No courses match your filters</p>
                <button onClick={handleReset} className="mt-4 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Reset Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {courses.map((course) => <CourseCard key={course.id} course={course} />)}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border px-4 py-2 text-xs font-medium disabled:opacity-30 hover:bg-muted">Previous</button>
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg border px-4 py-2 text-xs font-medium disabled:opacity-30 hover:bg-muted">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 28s linear infinite;
          width: max-content;
          display: flex;
        }
      `}</style>
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
