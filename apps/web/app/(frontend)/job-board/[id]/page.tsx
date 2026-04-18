"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Briefcase, MapPin, Clock, CheckCircle2, Calendar,
  Award, AlertCircle, Zap, Globe, Bookmark, Share2,
  FileText, ChevronRight, Download, Eye,
} from "lucide-react";
import type { Job } from "@/hooks/use-jobs";
import { formatDistanceToNow, format } from "date-fns";
import { buildApiUrl } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ─── Fetch single job ─────────────────────────────────────────────────────────

async function fetchJob(id: string): Promise<Job> {
  const res = await fetch(buildApiUrl(`jobs/${id}`));
  if (!res.ok) throw new Error("Job not found");
  const json = await res.json();
  return (json.data ?? json) as Job;
}

function useJob(id: string) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: () => fetchJob(id),
    enabled: !!id,
  });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 animate-pulse">
        <div className="h-4 w-28 rounded bg-gray-200 mb-6" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-40 rounded-xl bg-gray-200" />
            <div className="h-60 rounded-xl bg-gray-200" />
          </div>
          <div className="h-72 rounded-xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <AlertCircle className="mb-3 size-12 text-muted-foreground/30" />
      <h1 className="text-xl font-semibold">Job Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This job listing doesn&apos;t exist or has been removed.
      </p>
      <Link
        href="/job-board"
        className="mt-5 rounded bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
      >
        Browse Jobs
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: job, isLoading, isError } = useJob(id);
  const [saved, setSaved] = useState(false);
  const [logoError, setLogoError] = useState(false);

  if (isLoading) return <PageSkeleton />;
  if (isError || !job) return <NotFound />;

  const companyName = job.company_name || "Anasell";
  const initial = companyName.charAt(0).toUpperCase();
  const colors = ["bg-blue-500", "bg-purple-500", "bg-teal-500", "bg-amber-500", "bg-rose-500"];
  const logoBg = colors[companyName.length % colors.length];

  let logoSrc = job.company?.logo_url || (job as any).company_logo || (job as any).logo;
  if (!logoSrc && !logoError && companyName !== "Anasell") {
    const domain = companyName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() + ".com";
    logoSrc = `https://logo.clearbit.com/${domain}`;
  }

  const pdfUrl = job.pdf_url;
  const views = job.views;

  const postedAgo = job.created_at
    ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true })
    : "Recently";
  const deadline = job.deadline ? format(new Date(job.deadline), "dd MMM yyyy") : null;
  const deadlineExpired = job.deadline ? new Date(job.deadline) < new Date() : false;

  const salaryLabel =
    job.salary_min && job.salary_max
      ? `${job.salary_currency ?? "USD"} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`
      : job.salary_min
        ? `From ${job.salary_currency ?? "USD"} ${job.salary_min.toLocaleString()}`
        : "Competitive";

  const typeColorClass = job.job_type?.toLowerCase().includes("part")
    ? "bg-pink-50 text-pink-700"
    : job.job_type?.toLowerCase().includes("contract")
      ? "bg-blue-50 text-blue-700"
      : job.job_type?.toLowerCase().includes("freelance")
        ? "bg-amber-50 text-amber-700"
        : "bg-violet-50 text-violet-700";

  const descriptionLines = (job.description || "").split("\n").filter(Boolean);
  const requirementLines = (job.requirements || "").split("\n").filter(Boolean);

  const handleDownloadPdf = () => {
    if (!pdfUrl) {
      toast.info("No PDF available for this job listing.");
      return;
    }
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `${job.title.replace(/\s+/g, "-").toLowerCase()}.pdf`;
    a.target = "_blank";
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="size-3" />
          <Link href="/job-board" className="hover:text-foreground transition-colors">Jobs</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground truncate max-w-[150px] sm:max-w-[300px]">{job.title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 items-start">
          {/* ── Main ────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {/* Logo */}
                <div className={`size-16 rounded-xl flex items-center justify-center text-white font-semibold text-2xl shrink-0 overflow-hidden ${logoSrc && !logoError ? "bg-white border border-border/50" : logoBg}`}>
                  {logoSrc && !logoError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoSrc}
                      alt={companyName}
                      onError={() => setLogoError(true)}
                      className="h-full w-full object-contain p-1.5"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    initial
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {job.is_featured && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1 text-[10px] font-medium px-1.5 py-0">
                        <Zap className="size-2.5 fill-current" />Featured
                      </Badge>
                    )}
                    {job.job_type && (
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 border-transparent font-medium ${typeColorClass}`}>
                        {job.job_type}
                      </Badge>
                    )}
                    {deadlineExpired && (
                      <Badge variant="destructive" className="text-[10px] font-medium px-1.5 py-0">Expired</Badge>
                    )}
                  </div>

                  <h1 className="text-xl font-bold text-gray-900 leading-tight">{job.title}</h1>
                  <p className="mt-1.5 text-[13px] text-muted-foreground">
                    at{" "}
                    {job.company?.slug ? (
                      <Link href={`/companies/${job.company.slug}`} className="font-semibold text-primary hover:underline">
                        {companyName}
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground">{companyName}</span>
                    )}
                  </p>

                  <div className="mt-3.5 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {job.city && (
                      <span className="flex items-center gap-1.5"><MapPin className="size-3.5 shrink-0" />{job.city}</span>
                    )}
                    {job.category && (
                      <span className="flex items-center gap-1.5 text-primary"><Briefcase className="size-3.5 shrink-0" />{job.category}</span>
                    )}
                    {job.experience_level && (
                      <span className="flex items-center gap-1.5"><Award className="size-3.5 shrink-0" />{job.experience_level}</span>
                    )}
                    <span className="flex items-center gap-1.5"><Clock className="size-3.5 shrink-0" />Posted {postedAgo}</span>
                    {views != null && views > 0 && (
                      <span className="flex items-center gap-1.5"><Eye className="size-3.5 shrink-0" />{views.toLocaleString()} views</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action row */}
              <Separator className="my-4" />
              <div className="flex flex-wrap items-center gap-2">
                {pdfUrl && (
                  <Button
                    onClick={handleDownloadPdf}
                    size="sm"
                    className="gap-1.5 h-8 text-xs font-medium px-5 shadow-none"
                  >
                    <Download className="size-3.5" />
                    Download PDF
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs font-medium shadow-none"
                  onClick={() => {
                    setSaved((s) => !s);
                    toast(saved ? "Removed from saved" : "Job saved!");
                  }}
                >
                  <Bookmark className={`size-3.5 ${saved ? "fill-current text-primary" : ""}`} />
                  {saved ? "Saved" : "Save Job"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto size-8 p-0"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied to clipboard");
                  }}
                >
                  <Share2 className="size-3.5 text-muted-foreground" />
                  <span className="sr-only">Share</span>
                </Button>
              </div>
            </motion.div>

            {/* Description */}
            {job.description && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-sm"
              >
                <h2 className="text-[15px] font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                  <FileText className="size-4 text-muted-foreground" />
                  Job Description
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                  {descriptionLines.map((line, i) =>
                    line.startsWith("•") || line.startsWith("-") ? (
                      <li key={i} className="ml-4 text-[13px] mb-1">{line.replace(/^[•\-]\s*/, "")}</li>
                    ) : (
                      <p key={i} className="text-[13px] mb-2">{line}</p>
                    )
                  )}
                </div>
              </motion.div>
            )}

            {/* Requirements */}
            {job.requirements && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-sm"
              >
                <h2 className="text-[15px] font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-muted-foreground" />
                  Requirements
                </h2>
                <ul className="space-y-2">
                  {requirementLines.map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                      <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0 opacity-80" />
                      {line.replace(/^[•\-]\s*/, "")}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────── */}
          <aside className="space-y-5 sticky top-20 self-start">
            {/* Details card */}
            <motion.div
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-sm"
            >
              {/* Salary highlight */}
              <div className="mb-4 rounded flex flex-col items-center justify-center bg-primary/5 py-3 border border-primary/10">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 font-medium">Salary</p>
                <p className="text-[15px] font-semibold text-primary">{salaryLabel}</p>
              </div>

              {pdfUrl && (
                <Button
                  onClick={handleDownloadPdf}
                  className="w-full gap-1.5 h-9 text-xs mb-3 shadow-none"
                  size="sm"
                >
                  <Download className="size-3.5" />
                  Download Job PDF
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full gap-1.5 h-9 text-xs mb-4 shadow-none"
                size="sm"
                onClick={() => {
                  setSaved((s) => !s);
                  toast(saved ? "Removed from saved" : "Job saved!");
                }}
              >
                <Bookmark className={`size-3.5 ${saved ? "fill-current text-primary" : ""}`} />
                {saved ? "Saved" : "Save Job"}
              </Button>

              <Separator className="mb-4" />

              {/* Details grid */}
              <div className="space-y-3">
                {[
                  { label: "Job Type", value: job.job_type },
                  { label: "Experience", value: job.experience_level },
                  { label: "Career Level", value: job.career_level },
                  { label: "Category", value: job.category },
                  { label: "Location", value: job.city || job.location },
                ].map(({ label, value }) =>
                  value ? (
                    <div key={label} className="flex items-center justify-between text-[13px]">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground capitalize">{value}</span>
                    </div>
                  ) : null
                )}

                {deadline && (
                  <div className="flex items-center justify-between text-[13px] pt-1 border-t border-border/50">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="size-3.5" /> Deadline
                    </span>
                    <span className={`font-medium ${deadlineExpired ? "text-red-500" : "text-foreground"}`}>
                      {deadline}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Company card */}
            <motion.div
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-sm"
            >
              <h3 className="text-[13px] font-semibold text-gray-900 mb-3">About the Company</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className={`size-10 rounded text-white font-semibold text-lg flex flex-shrink-0 items-center justify-center overflow-hidden ${logoSrc && !logoError ? "bg-white border border-gray-100" : logoBg}`}>
                  {logoSrc && !logoError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoSrc} alt={companyName} className="h-full w-full object-contain p-1" referrerPolicy="no-referrer" />
                  ) : (
                    initial
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-gray-900 truncate">{companyName}</p>
                  {job.category && <p className="text-[11px] text-muted-foreground truncate">{job.category}</p>}
                </div>
              </div>
              {job.city && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {job.city}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Learn more about this employer and their open positions on Anasell.
              </p>
            </motion.div>

            {/* Share */}
            <div className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-sm">
              <p className="text-[13px] font-semibold text-gray-900 mb-3">Share this job</p>
              <div className="flex gap-2">
                {[
                  { label: "Copy link", icon: Share2 },
                  { label: "LinkedIn", icon: Globe },
                ].map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied!");
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded border border-border bg-gray-50 py-2 text-[11px] font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Icon className="size-3" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
