"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  GraduationCap,
  Home,
  MapPin,
  Package,
  Search,
  Tag,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useJobs } from "@/hooks/use-jobs";
import { useProperties } from "@/hooks/use-properties";
import { useTenders } from "@/hooks/use-tenders";
import { useCourses } from "@/hooks/use-courses";
import { usePublicCompanies } from "@/hooks/use-companies";
import { PropertyListCard } from "@/app/(frontend)/real-estate/components/PropertyList";

const SEARCH_CATEGORIES = [
  { label: "Properties", value: "properties", href: "/real-estate" },
  { label: "Jobs", value: "jobs", href: "/job-board" },
  { label: "Tenders", value: "tenders", href: "/tenders" },
  { label: "Companies", value: "companies", href: "/companies" },
  { label: "Courses", value: "courses", href: "/courses" },
] as const;

type SearchCategory = (typeof SEARCH_CATEGORIES)[number]["value"];

const features = [
  { icon: Package, label: "Real Estate", href: "/real-estate" },
  { icon: Users, label: "Jobs & Careers", href: "/job-board" },
  { icon: TrendingUp, label: "Public Tenders", href: "/tenders" },
  { icon: Zap, label: "Courses", href: "/courses" },
] as const;

const heroWords = ["real estate.", "job board.", "tenders.", "digital hub."] as const;

const cardShellClass =
  "group overflow-hidden rounded-[1.1rem] border border-[#e6ecd9] bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)] transition-all hover:border-primary/30 hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)] sm:rounded-2xl sm:border-gray-100 sm:p-0 sm:shadow-none sm:hover:border-primary/40 sm:hover:shadow-lg sm:hover:shadow-gray-100";

function SectionHeader({
  icon: Icon,
  title,
  href,
}: {
  icon: React.ElementType;
  title: string;
  href: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between sm:mb-5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 sm:size-9">
          <Icon className="size-4 text-primary sm:size-4.5" />
        </div>
        <h2 className="text-[15px] font-bold text-gray-900 sm:text-base">{title}</h2>
      </div>
      <Link
        href={href}
        className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-black transition-colors hover:text-black/70 sm:text-[11px]"
      >
        View All <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}

function MetaPill({
  icon: Icon,
  label,
  className,
}: {
  icon: React.ElementType;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${className ?? "bg-slate-50 text-slate-600"}`}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}

function CardActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[10px] font-semibold text-primary-foreground transition hover:brightness-105 active:scale-[0.98] sm:px-3.5 sm:text-[11px]"
    >
      {label}
      <ChevronRight className="size-3.5" />
    </Link>
  );
}

function ThumbFrame({
  href,
  children,
  className = "",
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex size-[54px] shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border border-gray-100 shadow-sm sm:size-[60px] ${className}`}
    >
      {children}
    </Link>
  );
}

function DesktopSidePanel({
  href,
  badge,
  className,
  children,
}: {
  href: string;
  badge: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`relative hidden shrink-0 items-center justify-center overflow-hidden sm:flex sm:w-36 lg:w-40 ${className}`}
    >
      {children}
      <span className="absolute left-3 top-3 rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
        {badge}
      </span>
    </Link>
  );
}

function JobCard({ job, index }: { job: import("@/hooks/use-jobs").Job; index: number }) {
  const href = `/job-board/${job.id}`;
  const logo = job.company?.logo_url;
  const name = job.company?.company_name || job.company_name;
  const initial = name ? name[0].toUpperCase() : "J";
  const colors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-rose-500"];
  const bg = !logo ? colors[(name?.length ?? 1) % colors.length] : "bg-gray-50";
  const pdfUrl = job.pdf_url;

  const handlePdfDownload = async (e: React.MouseEvent) => {
    if (!pdfUrl) return;
    const toastId = toast.loading("Preparing PDF...");
    try {
      const signRes = await fetch(`/api/upload/signed?url=${encodeURIComponent(pdfUrl)}`);
      const signData = await signRes.json();
      const downloadUrl = signData.url ?? pdfUrl;
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = blobUrl;
      a.download = `${job.title.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      a.remove();
      toast.success("PDF downloaded", { id: toastId });
    } catch {
      toast.error("Failed to download PDF", { id: toastId });
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      onClick={handlePdfDownload}
      className={`${cardShellClass} ${pdfUrl ? "cursor-pointer" : ""}`}
    >
      {/* Mobile */}
      <div className="sm:hidden pointer-events-none">
        <div className="flex items-start gap-3">
          <div className={`flex size-[54px] shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border border-gray-100 shadow-sm ${logo ? "bg-gray-50" : bg}`}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={name} className="h-full w-full object-contain p-2" />
            ) : (
              <span className="text-base font-bold text-white">{initial}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-[13px] font-bold leading-[1.15] text-gray-900">
              {job.title}
            </h3>
            <p className="mt-1 truncate text-[11px] text-gray-500">
              by <span className="font-semibold text-gray-700">{name}</span>
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {job.job_type && (
                <MetaPill icon={Briefcase} label={job.job_type.replace(/_/g, " ")} className="bg-primary/10 text-primary" />
              )}
              {job.city && <MetaPill icon={MapPin} label={job.city} />}
              {(job.views ?? 0) > 0 && (
                <MetaPill icon={Eye} label={`${(job.views ?? 0).toLocaleString()} views`} />
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock3 className="size-3" />
                {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
              </span>
              <span className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                <CardActionLink href={href} label="View" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden sm:flex sm:flex-row sm:items-stretch pointer-events-none">
        <div className="relative hidden shrink-0 items-center justify-center overflow-hidden sm:flex sm:w-36 lg:w-40 bg-gradient-to-br from-slate-100 via-white to-slate-50">
          <div className={`flex size-14 items-center justify-center overflow-hidden rounded-2xl font-bold text-lg text-white shadow-sm ${logo ? "border border-gray-100 bg-gray-50" : bg}`}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={name} className="h-full w-full object-contain p-2" />
            ) : (
              initial
            )}
          </div>
          <span className="absolute left-3 top-3 rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
            Hiring
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-2 p-3.5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Job opening</p>
            <h3 className="mt-0.5 line-clamp-1 text-[13px] font-bold text-gray-900 lg:text-[14px]">
              {job.title}
            </h3>
            <p className="truncate text-[11px] text-gray-500">{name}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              {job.city && (
                <span className="flex items-center gap-1"><MapPin className="size-3" />{job.city}</span>
              )}
              {job.job_type && <span className="capitalize">{job.job_type.replace(/_/g, " ")}</span>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            {(job.views ?? 0) > 0 && (
              <span className="flex items-center gap-1"><Eye className="size-3" />{(job.views ?? 0).toLocaleString()} views</span>
            )}
            <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end justify-center gap-2 border-l border-gray-100 px-3.5 py-3.5 lg:min-w-[110px] pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          <div className="text-right">
            <p className="text-[12px] font-bold text-gray-900">Apply now</p>
            <p className="text-[10px] text-muted-foreground">New opportunity</p>
          </div>
          <CardActionLink href={href} label="View" />
        </div>
      </div>
    </motion.article>
  );
}

function TenderCard({
  tender,
  index,
}: {
  tender: import("@/hooks/use-tenders").Tender;
  index: number;
}) {
  const href = `/tenders/${tender.id}`;
  const deadline = tender.submission_deadline ? new Date(tender.submission_deadline) : null;
  const isPast = deadline ? deadline < new Date() : false;
  const deadlineLabel = deadline ? deadline.toLocaleDateString() : "No deadline";

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      className={cardShellClass}
    >
      <div className="sm:hidden">
        <div className="flex items-start gap-3">
          <ThumbFrame href={href} className="bg-gradient-to-br from-blue-100 via-white to-cyan-50">
            <FileText className="size-6 text-blue-600" />
          </ThumbFrame>

          <div className="min-w-0 flex-1">
            <Link href={href} className="block">
              <h3 className="line-clamp-2 text-[13px] font-bold leading-[1.15] text-gray-900 transition-colors hover:text-primary">
                {tender.title}
              </h3>
            </Link>
            <p className="mt-1 truncate text-[11px] text-gray-500">
              by <span className="font-semibold text-gray-700">{tender.issuing_organisation}</span>
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {tender.category && (
                <MetaPill icon={Tag} label={tender.category} className="bg-blue-50 text-blue-700" />
              )}
              <MetaPill
                icon={Clock3}
                label={isPast ? "Closed" : "Open"}
                className={isPast ? "bg-red-50 text-red-600" : "bg-violet-50 text-violet-600"}
              />
              {tender.city && <MetaPill icon={MapPin} label={tender.city} />}
              {(tender.views ?? 0) > 0 && (
                <MetaPill icon={Eye} label={`${tender.views.toLocaleString()} views`} />
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3" />
                  {deadlineLabel}
                </span>
              </div>
              <CardActionLink href={href} label="View" />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden sm:flex sm:flex-row sm:items-stretch">
        <DesktopSidePanel href={href} badge="Tender" className="bg-gradient-to-br from-blue-50 via-white to-cyan-50">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <FileText className="size-6" />
          </div>
        </DesktopSidePanel>

        <div className="flex flex-1 flex-col justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Open bid</p>
            <Link href={href} className="block">
              <h3 className="mt-1 line-clamp-2 text-[13px] font-bold text-gray-900 transition-colors hover:text-primary lg:text-[14px]">
                {tender.title}
              </h3>
            </Link>
            <p className="mt-1 truncate text-[11px] text-gray-500">{tender.issuing_organisation}</p>
          </div>

          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            {tender.category && (
              <span className="flex items-center gap-1">
                <Tag className="size-3" />
                {tender.category}
              </span>
            )}
            <span className={`flex items-center gap-1 ${isPast ? "text-red-500" : "text-emerald-600"}`}>
              <Clock3 className="size-3" />
              Closes {deadlineLabel}
            </span>
            {(tender.views ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="size-3" />
                {tender.views.toLocaleString()} views
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end justify-center gap-2 border-l border-gray-100 px-4 py-4 lg:min-w-[124px]">
          <div className="text-right">
            <p className="text-[12px] font-bold text-gray-900">{isPast ? "Closed" : "Open"}</p>
            <p className="text-[10px] text-muted-foreground">Procurement</p>
          </div>
          <CardActionLink href={href} label="View" />
        </div>
      </div>
    </motion.article>
  );
}

function CourseCard({
  course,
  index,
}: {
  course: import("@/hooks/use-courses").Course;
  index: number;
}) {
  const href = `/courses/${course.id}`;
  const colors = ["bg-blue-500", "bg-teal-500", "bg-amber-500", "bg-rose-500", "bg-emerald-500"];
  const providerName = course.instructor_name || "Institution";
  const bg = colors[providerName.length % colors.length];
  const [imgError, setImgError] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      className={cardShellClass}
    >
      <div className="sm:hidden">
        <div className="flex items-start gap-3">
          <ThumbFrame href={href} className={course.thumbnail_url && !imgError ? "bg-gray-50" : bg}>
            {course.thumbnail_url && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.thumbnail_url}
                alt={course.title}
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-base font-bold text-white">{providerName[0]?.toUpperCase()}</span>
            )}
          </ThumbFrame>

          <div className="min-w-0 flex-1">
            <Link href={href} className="block">
              <h3 className="line-clamp-2 text-[13px] font-bold leading-[1.15] text-gray-900 transition-colors hover:text-primary">
                {course.title}
              </h3>
            </Link>
            <p className="mt-1 truncate text-[11px] text-gray-500">
              by <span className="font-semibold text-gray-700">{providerName}</span>
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {course.category && (
                <MetaPill
                  icon={GraduationCap}
                  label={course.category.replace(/_/g, " ")}
                  className="bg-amber-50 text-amber-700"
                />
              )}
              {(course.views ?? 0) > 0 && (
                <MetaPill icon={Eye} label={`${(course.views ?? 0).toLocaleString()} views`} />
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-[10px] text-muted-foreground">Training program</div>
              <CardActionLink href={href} label="Open" />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden sm:flex sm:flex-row sm:items-stretch">
        <DesktopSidePanel
          href={href}
          badge="Course"
          className={course.thumbnail_url && !imgError ? "bg-gray-50" : "bg-gradient-to-br from-amber-50 via-white to-orange-50"}
        >
          {course.thumbnail_url && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnail_url}
              alt={course.title}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className={`flex size-14 items-center justify-center rounded-2xl font-bold text-lg text-white shadow-sm ${bg}`}>
              {providerName[0]?.toUpperCase()}
            </div>
          )}
        </DesktopSidePanel>

        <div className="flex flex-1 flex-col justify-between gap-3 p-4">
          <div className="min-w-0">
            {(course.views ?? 0) > 0 && (
              <span className="mb-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                <Eye className="size-3" />
                {(course.views ?? 0).toLocaleString()} views
              </span>
            )}
            <Link href={href} className="block">
              <h3 className="line-clamp-2 text-[13px] font-bold text-gray-900 transition-colors hover:text-primary lg:text-[14px]">
                {course.title}
              </h3>
            </Link>
            <p className="mt-1 truncate text-[11px] text-gray-500">by {providerName}</p>
          </div>

          {course.category && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <GraduationCap className="size-3" />
              {course.category.replace(/_/g, " ")}
            </span>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end justify-center gap-2 border-l border-gray-100 px-4 py-4 lg:min-w-[124px]">
          <div className="text-right">
            <p className="text-[12px] font-bold text-gray-900">Learn more</p>
            <p className="text-[10px] text-muted-foreground">Training</p>
          </div>
          <CardActionLink href={href} label="Open" />
        </div>
      </div>
    </motion.article>
  );
}

function CompanyCard({
  company,
  index,
}: {
  company: import("@/hooks/use-companies").Company;
  index: number;
}) {
  const href = `/companies/${company.slug || company.id}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      className={cardShellClass}
    >
      <div className="sm:hidden">
        <div className="flex items-start gap-3">
          <ThumbFrame href={href} className="bg-gray-50">
            {company.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo_url} alt={company.company_name} className="h-full w-full object-contain p-2" />
            ) : (
              <Building2 className="size-6 text-gray-300" />
            )}
          </ThumbFrame>

          <div className="min-w-0 flex-1">
            <Link href={href} className="block">
              <h3 className="line-clamp-2 text-[13px] font-bold leading-[1.15] text-gray-900 transition-colors hover:text-primary">
                {company.company_name}
              </h3>
            </Link>
            <p className="mt-1 truncate text-[11px] text-gray-500">
              {company.industry || "General"}
              {company.city ? ` - ${company.city}` : ""}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {company.is_verified && (
                <MetaPill icon={Building2} label="Verified" className="bg-emerald-50 text-emerald-700" />
              )}
              {(company.views ?? 0) > 0 && (
                <MetaPill icon={Eye} label={`${company.views} views`} />
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-[10px] text-muted-foreground">{company.jobs_count || 0} open jobs</div>
              <CardActionLink href={href} label="Visit" />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden sm:flex sm:flex-row sm:items-stretch">
        <DesktopSidePanel href={href} badge={company.is_verified ? "Verified" : "Company"} className="bg-gradient-to-br from-emerald-50 via-white to-lime-50">
          <div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {company.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo_url} alt={company.company_name} className="h-full w-full object-contain p-2" />
            ) : (
              <Building2 className="size-6 text-gray-300" />
            )}
          </div>
        </DesktopSidePanel>

        <div className="flex flex-1 flex-col justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              {company.is_verified && (
                <span className="text-[10px] font-semibold text-emerald-600">Verified business</span>
              )}
              {(company.views ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Eye className="size-3" />
                  {company.views}
                </span>
              )}
            </div>
            <Link href={href} className="block">
              <h3 className="line-clamp-1 text-[13px] font-bold text-gray-900 transition-colors hover:text-primary lg:text-[14px]">
                {company.company_name}
              </h3>
            </Link>
            <p className="mt-1 truncate text-[11px] text-gray-500">
              {company.industry || "General"}
              {company.city ? ` - ${company.city}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span>Company profile</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end justify-center gap-2 border-l border-gray-100 px-4 py-4 lg:min-w-[124px]">
          <div className="text-right">
            <p className="text-[12px] font-bold text-gray-900">{company.jobs_count || 0} open jobs</p>
            <p className="text-[10px] text-muted-foreground">Directory</p>
          </div>
          <CardActionLink href={href} label="Visit" />
        </div>
      </div>
    </motion.article>
  );
}

function CardSkeleton() {
  return (
    <div className={`${cardShellClass} animate-pulse pointer-events-none`}>
      <div className="sm:hidden">
        <div className="flex items-start gap-3">
          <div className="size-[54px] shrink-0 rounded-[1rem] bg-gray-100" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3.5 w-3/4 rounded-full bg-gray-100" />
            <div className="h-2.5 w-1/2 rounded-full bg-gray-100" />
            <div className="mt-3 flex gap-2">
              <div className="h-5 w-16 rounded-full bg-gray-100" />
              <div className="h-5 w-14 rounded-full bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
      <div className="hidden sm:flex sm:flex-row sm:items-stretch">
        <div className="hidden sm:block sm:w-36 lg:w-40 bg-gray-50 rounded-l-2xl" />
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="h-2.5 w-1/4 rounded-full bg-gray-100" />
          <div className="h-3.5 w-3/4 rounded-full bg-gray-100" />
          <div className="h-2.5 w-1/2 rounded-full bg-gray-100" />
        </div>
        <div className="flex flex-col items-end justify-center gap-2 border-l border-gray-100 px-4 py-4 lg:min-w-[124px]">
          <div className="h-3 w-16 rounded-full bg-gray-100" />
          <div className="h-6 w-14 rounded-full bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

function SectionSkeletons({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}

function ListingsFeed() {
  const { data: jobsData, isLoading: jobsLoading } = useJobs({ page_size: 10 });
  const { data: propertiesData, isLoading: propertiesLoading } = useProperties({ page_size: 8 });
  const { data: tendersData, isLoading: tendersLoading } = useTenders({ page_size: 10 });
  const { data: coursesData, isLoading: coursesLoading } = useCourses({ page_size: 10 });
  const { data: companiesData, isLoading: companiesLoading } = usePublicCompanies({ page_size: 10 });

  const jobs = jobsData?.data ?? [];
  const properties = propertiesData?.data ?? [];
  const tenders = tendersData?.data ?? [];
  const courses = coursesData?.data ?? [];
  const companies = companiesData?.data ?? [];

  const isAnyLoading = jobsLoading || propertiesLoading || tendersLoading || coursesLoading || companiesLoading;
  const hasAny = jobs.length + properties.length + tenders.length + courses.length + companies.length > 0;
  if (!isAnyLoading && !hasAny) return null;

  return (
    <div className="mx-auto max-w-7xl px-3 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col items-center text-center sm:mb-12">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5">
          <TrendingUp className="size-3.5 text-primary" />
          <span className="text-[11px] font-bold tracking-widest text-primary" style={{ fontVariant: "all-small-caps" }}>
            Trending Now
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          What&apos;s Trending on Anasell
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          The latest listings across jobs, properties, tenders, courses, and companies in South Sudan.
        </p>
      </div>

      <div className="space-y-14 sm:space-y-16">
        {(jobsLoading || jobs.length > 0) && (
          <section>
            <SectionHeader icon={Briefcase} title="Trending Jobs" href="/job-board" />
            {jobsLoading ? (
              <SectionSkeletons count={4} />
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {jobs.slice(0, 6).map((job, i) => (
                  <JobCard key={job.id} job={job} index={i} />
                ))}
              </div>
            )}
          </section>
        )}

        {(propertiesLoading || properties.length > 0) && (
          <section>
            <SectionHeader icon={Home} title="Trending Properties" href="/real-estate" />
            {propertiesLoading ? (
              <SectionSkeletons count={4} />
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {properties.slice(0, 6).map((prop, i) => (
                  <PropertyListCard key={prop.id} property={prop} index={i} compact />
                ))}
              </div>
            )}
          </section>
        )}

        {(tendersLoading || tenders.length > 0) && (
          <section>
            <SectionHeader icon={FileText} title="Active Tenders" href="/tenders" />
            {tendersLoading ? (
              <SectionSkeletons count={4} />
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {tenders.slice(0, 6).map((tender, i) => (
                  <TenderCard key={tender.id} tender={tender} index={i} />
                ))}
              </div>
            )}
          </section>
        )}

        {(coursesLoading || courses.length > 0) && (
          <section>
            <SectionHeader icon={GraduationCap} title="Advertised Courses" href="/courses" />
            {coursesLoading ? (
              <SectionSkeletons count={4} />
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {courses.slice(0, 6).map((course, i) => (
                  <CourseCard key={course.id} course={course} index={i} />
                ))}
              </div>
            )}
          </section>
        )}

        {(companiesLoading || companies.length > 0) && (
          <section>
            <SectionHeader icon={Building2} title="Featured Companies" href="/companies" />
            {companiesLoading ? (
              <SectionSkeletons count={4} />
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {companies.slice(0, 6).map((company, i) => (
                  <CompanyCard key={company.id} company={company} index={i} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default function FrontendHomePage() {
  const [activeWord, setActiveWord] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<SearchCategory>("jobs");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveWord((current) => (current + 1) % heroWords.length);
    }, 2400);

    return () => window.clearInterval(interval);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const cat = SEARCH_CATEGORIES.find((item) => item.value === searchCategory);
    const base = cat?.href ?? "/job-board";
    const q = searchQuery.trim();
    router.push(q ? `${base}?search=${encodeURIComponent(q)}` : base);
  }

  return (
    <div className="bg-[#f4f8fb]">
      <section className="relative flex min-h-[60svh] flex-col items-center justify-center overflow-hidden bg-white px-3 py-6 sm:px-6">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(180,253,131,0.18),transparent_70%)]" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(16,33,15,0.07) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(180,253,131,0.55),transparent_70%)]" />
        <div className="absolute -z-10 left-1/4 top-1/3 h-80 w-80 rounded-full bg-primary/12 blur-[6rem]" />
        <div className="absolute -z-10 right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-emerald-200/30 blur-[5rem]" />

        <div className="flex w-full max-w-4xl flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/75 px-3 py-1.5 shadow-sm backdrop-blur-sm sm:px-4 sm:py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-[9px] font-semibold tracking-[0.18em] text-muted-foreground sm:text-[10px]">
              <span className="normal-case">Anasell</span>
              {" - SOUTH SUDAN DIGITAL HUB - NOW LIVE"}
            </span>
          </div>

          <h1 className="mt-5 w-full text-[1.65rem] font-semibold leading-[0.98] tracking-[-0.055em] text-foreground sm:mt-6 sm:text-[2.55rem] lg:text-[3rem]">
            South Sudan&apos;s one-stop hub for{" "}
            <span className="relative inline-flex min-w-[10ch] items-end justify-center px-2 align-bottom sm:min-w-[12ch]">
              <span aria-hidden className="invisible whitespace-nowrap">
                marketplace.
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={heroWords[activeWord]}
                  initial={{ y: "110%", opacity: 0, filter: "blur(8px)" }}
                  animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: "-110%", opacity: 0, filter: "blur(8px)" }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 z-10 flex items-end justify-center whitespace-nowrap text-primary"
                >
                  {heroWords[activeWord]}
                </motion.span>
              </AnimatePresence>
              <span aria-hidden className="absolute inset-x-0 bottom-1 -z-10 h-[0.22em] rounded-sm bg-primary/20" />
            </span>
          </h1>

          <p className="mt-3 max-w-2xl text-[0.8rem] leading-[1.7] text-muted-foreground sm:mt-4 sm:text-[0.88rem]">
            Browse property listings, job openings, government tenders, training courses, verified companies - all built for South Sudan.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-7 flex w-full max-w-2xl flex-col overflow-hidden rounded-sm border border-border/40 bg-white shadow-sm sm:mt-9 sm:flex-row sm:items-stretch"
          >
            <div className="shrink-0 border-b border-border/40 sm:border-b-0 sm:border-r">
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value as SearchCategory)}
                className="h-full w-full cursor-pointer bg-secondary/40 px-3 py-2.5 text-[0.78rem] font-medium text-foreground outline-none sm:w-32 sm:px-4 sm:py-0"
              >
                {SEARCH_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex flex-1 items-center gap-3 bg-secondary/40 px-4 py-3 sm:py-3.5">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${searchCategory}...`}
                className="w-full bg-transparent text-[0.85rem] text-foreground outline-none placeholder:text-muted-foreground/55"
              />
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 bg-primary px-6 py-3 text-[0.82rem] font-semibold text-primary-foreground transition hover:brightness-95 active:scale-[0.98] sm:px-7 sm:py-0"
            >
              Search <ArrowRight className="size-3.5" />
            </button>
          </form>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {features.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-white/80 px-3 py-1.5 text-[11px] font-medium text-foreground shadow-sm backdrop-blur-sm transition-colors hover:border-primary/40 hover:bg-white"
              >
                <Icon className="size-3 text-primary" />
                {label}
              </a>
            ))}
          </div>

          <div className="mt-8 flex w-full max-w-sm items-center gap-4 sm:mt-12">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 sm:text-[10px]">
              trusted by businesses across South Sudan
            </span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          <div className="mt-4 grid w-full max-w-lg grid-cols-3 gap-2 sm:mt-6 sm:gap-4">
            {[
              { value: "1,247", label: "Active listings" },
              { value: "3,892", label: "Registered users" },
              { value: "23", label: "Live tenders" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-0.5">
                <span className="text-[1.5rem] font-semibold tracking-[-0.05em] text-foreground sm:text-[1.9rem]">
                  {stat.value}
                </span>
                <span className="text-[10px] leading-4 text-muted-foreground sm:text-[11px]">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ListingsFeed />
    </div>
  );
}
