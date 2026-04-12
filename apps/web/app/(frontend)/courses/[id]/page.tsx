"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft, Play, Clock, Users, Star, Award, CheckCircle2,
  BookOpen, Globe, Tag, AlertCircle, ChevronRight,
} from "lucide-react";
import { useCourse } from "@/hooks/use-courses";

function Skeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-4 py-8">
      <div className="mb-4 h-4 w-28 rounded bg-gray-200" />
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-4">
          <div className="aspect-video w-full rounded-2xl bg-gray-200" />
          <div className="h-8 w-3/4 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
          <div className="h-28 rounded bg-gray-200" />
        </div>
        <div className="hidden w-72 lg:block space-y-3">
          <div className="h-72 rounded-2xl bg-gray-200" />
          <div className="h-12 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <AlertCircle className="mb-4 size-12 text-muted-foreground/30" />
      <h1 className="text-xl font-bold">Course Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">This course has been removed or doesn&apos;t exist.</p>
      <Link href="/courses" className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground">
        Browse Courses
      </Link>
    </div>
  );
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: course, isLoading, isError } = useCourse(id);

  if (isLoading) return <Skeleton />;
  if (isError || !course) return <NotFound />;

  const thumbnail = course.thumbnail_url || `https://picsum.photos/seed/course-${course.id}/800/450`;
  const instructorAvatar = course.instructor_avatar || `https://picsum.photos/seed/inst-${course.id}/80/80`;
  const duration = course.duration_hours ? `${course.duration_hours} hours` : null;

  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/courses" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />Back to Courses
        </Link>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left column */}
          <div className="flex-1 min-w-0">
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-sm mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbnail} alt={course.title} className="h-full w-full object-cover" />
              {course.preview_video_url && (
                <a
                  href={course.preview_video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black/30 transition hover:bg-black/40"
                >
                  <div className="rounded-full bg-white/90 p-4 shadow-xl">
                    <Play className="size-8 fill-current text-gray-900" />
                  </div>
                </a>
              )}
              {course.is_featured && (
                <div className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  Featured
                </div>
              )}
              {course.level && (
                <div className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                  {course.level}
                </div>
              )}
            </div>

            {/* Title block */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                {course.category && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    <Tag className="size-3" />{course.category}
                  </span>
                )}
                {course.language && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Globe className="size-3" />{course.language}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black leading-snug text-gray-900">{course.title}</h1>

              {/* Rating row */}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {course.rating && (
                  <span className="flex items-center gap-1">
                    <span className="font-bold text-amber-600">{Number(course.rating).toFixed(1)}</span>
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    {course.reviews_count && <span>({course.reviews_count} reviews)</span>}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="size-4" />{(course.enrolled_count ?? 0).toLocaleString()} students
                </span>
                {duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-4" />{duration}
                  </span>
                )}
              </div>

              {/* Instructor */}
              <div className="mt-4 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={instructorAvatar} alt={course.instructor_name ?? "Instructor"} className="size-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{course.instructor_name ?? "Ansell Expert"}</p>
                  <p className="text-xs text-muted-foreground">Course Instructor</p>
                </div>
                <CheckCircle2 className="size-4 fill-current text-emerald-500 ml-1" />
              </div>

              {/* Description */}
              {course.description && (
                <div className="mt-6 rounded-2xl border border-border bg-white p-5">
                  <h2 className="mb-3 font-bold text-gray-900">About this Course</h2>
                  <p className="text-sm leading-7 text-gray-700 whitespace-pre-line">{course.description}</p>
                </div>
              )}

              {/* Instructor bio */}
              {course.instructor_bio && (
                <div className="mt-4 rounded-2xl border border-border bg-white p-5">
                  <h2 className="mb-2 font-bold text-gray-900">About the Instructor</h2>
                  <p className="text-sm leading-7 text-gray-700">{course.instructor_bio}</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right sidebar */}
          <div className="w-full shrink-0 lg:w-72">
            <div className="lg:sticky lg:top-28 space-y-4">
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                {/* Price */}
                {course.price !== undefined && course.price !== null ? (
                  <div className="mb-4 text-center">
                    <p className="text-3xl font-black text-gray-900">
                      {course.currency ?? "SSP"} {Number(course.price).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">One-time payment</p>
                  </div>
                ) : (
                  <div className="mb-4 text-center">
                    <p className="text-2xl font-black text-emerald-600">Free</p>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md"
                >
                  Enroll Now
                  <ChevronRight className="inline size-4 ml-1" />
                </motion.button>

                <div className="mt-4 space-y-2.5">
                  {duration && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1"><Clock className="size-3.5" />Duration</span>
                      <span className="font-semibold">{duration}</span>
                    </div>
                  )}
                  {course.level && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1"><BookOpen className="size-3.5" />Level</span>
                      <span className="font-semibold">{course.level}</span>
                    </div>
                  )}
                  {course.language && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1"><Globe className="size-3.5" />Language</span>
                      <span className="font-semibold">{course.language}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1"><Users className="size-3.5" />Enrolled</span>
                    <span className="font-semibold">{(course.enrolled_count ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {course.tags && (
                <div className="rounded-2xl border border-border bg-white p-4">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {course.tags.split(",").map((tag) => (
                      <span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-foreground">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
