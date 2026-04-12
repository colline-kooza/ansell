"use client";

import { use, useState, useRef } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Briefcase,
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  Award,
  AlertCircle,
  Send,
  Zap,
  Globe,
  Bookmark,
  Share2,
  FileText,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { Job } from "@/hooks/use-jobs";
import { formatDistanceToNow, format } from "date-fns";
import { buildApiUrl } from "@/lib/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiImageUpload } from "@/components/shared/multi-image-upload";

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

// ─── Apply mutation ───────────────────────────────────────────────────────────

interface ApplicationPayload {
  full_name: string;
  email: string;
  phone?: string;
  cover_letter: string;
  cv_url: string;
  linkedin_url?: string;
  portfolio_url?: string;
  years_of_experience?: number;
  current_job_title?: string;
}

function useApplyToJob(jobId: string) {
  return useMutation({
    mutationFn: async (payload: ApplicationPayload) => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("ansell_auth_token")
          : null;
      const res = await fetch(buildApiUrl(`jobs/${jobId}/apply`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      let json;
      try {
        json = await res.json();
      } catch (err) {
        json = {};
      }
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("You must be logged in to submit an application.");
        }
        if (res.status === 403) {
          throw new Error("You do not have permission to apply for this job.");
        }
        throw new Error(json.message || "Application failed. Please try again.");
      }
      return json;
    },
    onSuccess: () => toast.success("Application submitted successfully!"),
    onError: (e: Error) => {
      if (e.message.includes("logged in")) {
        toast.error("Authentication Required", {
          description: "Please sign in to your account to apply for jobs.",
        });
      } else if (e.message.includes("permission")) {
        toast.error("Access Denied", {
          description: "You do not have the required permissions to apply for this job.",
        });
      } else {
        toast.error("Submission Failed", {
          description: e.message,
        });
      }
    },
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

// ─── Inline Application Form ──────────────────────────────────────────────────

function ApplicationForm({
  job,
}: {
  job: Job;
}) {
  const { mutate: apply, isPending, isSuccess, reset } = useApplyToJob(job.id);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    years_experience: "",
    linkedin_url: "",
    portfolio_url: "",
    current_job_title: "",
    cover_letter: "",
    cv_urls: [] as string[],
  });

  const set = (key: keyof typeof form, val: any) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.cover_letter || form.cv_urls.length === 0) {
      toast.error("Please fill in all required fields and upload your CV.");
      return;
    }

    // Parse years_experience
    let yearsInt: number | undefined;
    if (form.years_experience) {
      const match = form.years_experience.match(/\d+/);
      if (match) yearsInt = parseInt(match[0]);
    }

    apply({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone || undefined,
      years_of_experience: yearsInt,
      linkedin_url: form.linkedin_url || undefined,
      portfolio_url: form.portfolio_url || undefined,
      current_job_title: form.current_job_title || undefined,
      cover_letter: form.cover_letter,
      cv_url: form.cv_urls[0],
    });
  };

  const handleReset = () => {
    reset();
    setForm({
      full_name: "",
      email: "",
      phone: "",
      years_experience: "",
      linkedin_url: "",
      portfolio_url: "",
      current_job_title: "",
      cover_letter: "",
      cv_urls: [],
    });
  };

  if (isSuccess) {
    return (
      <div className="rounded-xl border border-border bg-white p-5 sm:p-6 text-center shadow-sm">
        <div className="size-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3 mx-auto">
          <CheckCircle2 className="size-6 text-emerald-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Application Submitted!
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Your application for <span className="font-medium text-foreground">{job.title}</span> at <span className="font-medium text-foreground">{job.company_name || "Ansell"}</span> has been received.
        </p>
        <Button onClick={handleReset} variant="outline" className="mt-5 text-xs h-8 px-4">
          Submit Another Application
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-1.5">
          <Send className="size-4 text-primary" />
          Apply for this role
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          at <span className="font-medium text-foreground">{job.company_name || "Ansell"}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Personal Info */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">
            Personal Information
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-xs">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                placeholder="John Doe"
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+211 912 345 678"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="current_job_title" className="text-xs">Current Job Title</Label>
              <Input
                id="current_job_title"
                placeholder="Software Engineer"
                value={form.current_job_title}
                onChange={(e) => set("current_job_title", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="years_experience" className="text-xs">Years of Experience</Label>
              <Select
                value={form.years_experience}
                onValueChange={(v) => set("years_experience", v)}
              >
                <SelectTrigger id="years_experience" className="h-8 text-xs">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "0–1 years",
                    "1–3 years",
                    "3–5 years",
                    "5–10 years",
                    "10+ years",
                  ].map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Links */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">
            Links &amp; Portfolio
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="linkedin_url" className="text-xs">LinkedIn Profile</Label>
              <Input
                id="linkedin_url"
                type="url"
                placeholder="https://linkedin.com/in/..."
                value={form.linkedin_url}
                onChange={(e) => set("linkedin_url", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="portfolio_url" className="text-xs">Portfolio / Website</Label>
              <Input
                id="portfolio_url"
                type="url"
                placeholder="https://yoursite.com"
                value={form.portfolio_url}
                onChange={(e) => set("portfolio_url", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* CV Upload */}
        <div className="space-y-1.5">
          <Label className="text-xs">Resume / CV Document <span className="text-red-500">*</span></Label>
          <MultiImageUpload
            maxFiles={1}
            value={form.cv_urls}
            onChange={(urls) => set("cv_urls", urls)}
            className="mt-1.5"
          />
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Upload your resume/CV (PDF, DOCX, or Image)
          </p>
        </div>

        <Separator />

        {/* Cover Letter */}
        <div className="space-y-1.5">
          <Label htmlFor="cover_letter" className="text-xs">
            Cover Letter <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="cover_letter"
            rows={4}
            placeholder={`Tell ${job.company_name || "the employer"} why you're the perfect fit...`}
            value={form.cover_letter}
            onChange={(e) => set("cover_letter", e.target.value)}
            className="resize-none text-xs p-3 shadow-none border-border/60"
            required
          />
          <p className="text-[10px] text-muted-foreground">
            {form.cover_letter.length} characters
          </p>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto gap-2 h-9 text-xs px-6 shadow-none"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="size-3.5" />
                Submit Application
              </>
            )}
          </Button>
        </div>
      </form>
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
  
  const applyFormRef = useRef<HTMLDivElement>(null);

  if (isLoading) return <PageSkeleton />;
  if (isError || !job) return <NotFound />;

  const companyName = job.company_name || "Ansell";
  const initial = companyName.charAt(0).toUpperCase();
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-teal-500",
    "bg-amber-500",
    "bg-rose-500",
  ];
  const logoBg = colors[companyName.length % colors.length];

  // Logo – explicit field, company object, or Clearbit
  let logoSrc = job.company?.logo_url || (job as any).company_logo || (job as any).logo;
  if (!logoSrc && !logoError && companyName !== "Ansell") {
    const domain =
      companyName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() + ".com";
    logoSrc = `https://logo.clearbit.com/${domain}`;
  }

  const postedAgo = job.created_at
    ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true })
    : "Recently";
  const deadline = job.deadline
    ? format(new Date(job.deadline), "dd MMM yyyy")
    : null;
  const deadlineExpired = job.deadline
    ? new Date(job.deadline) < new Date()
    : false;

  const salaryLabel =
    job.salary_min && job.salary_max
      ? `${job.salary_currency ?? "USD"} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`
      : job.salary_min
        ? `From ${job.salary_currency ?? "USD"} ${job.salary_min.toLocaleString()}`
        : "Competitive";

  const typeColorClass = job.job_type?.toLowerCase().includes("part")
    ? "bg-pink-50 text-pink-700 font-medium"
    : job.job_type?.toLowerCase().includes("contract")
      ? "bg-blue-50 text-blue-700 font-medium"
      : job.job_type?.toLowerCase().includes("freelance")
        ? "bg-amber-50 text-amber-700 font-medium"
        : "bg-violet-50 text-violet-700 font-medium";

  const descriptionLines = (job.description || "").split("\n").filter(Boolean);
  const requirementLines = (job.requirements || "")
    .split("\n")
    .filter(Boolean);

  const scrollToApply = () => {
    applyFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="size-3" />
          <Link
            href="/job-board"
            className="hover:text-foreground transition-colors"
          >
            Jobs
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground truncate max-w-[150px] sm:max-w-[300px]">
            {job.title}
          </span>
        </nav>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 items-start">
          {/* ── Left / Main ────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {/* Logo */}
                <div
                  className={`size-16 rounded-xl flex items-center justify-center text-white font-semibold text-2xl shrink-0 overflow-hidden ${logoSrc && !logoError ? "bg-white border border-border/50" : logoBg}`}
                >
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
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20 gap-1 text-[10px] font-medium px-1.5 py-0"
                      >
                        <Zap className="size-2.5 fill-current" />
                        Featured
                      </Badge>
                    )}
                    {job.job_type && (
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 border-transparent ${typeColorClass}`}
                      >
                        {job.job_type}
                      </Badge>
                    )}
                    {deadlineExpired && (
                      <Badge variant="destructive" className="text-[10px] font-medium px-1.5 py-0">
                        Expired
                      </Badge>
                    )}
                  </div>

                  <h1 className="text-xl font-bold text-gray-900 leading-tight">
                    {job.title}
                  </h1>
                  <p className="mt-1.5 text-[13px] text-muted-foreground">
                    at{" "}
                    {job.company?.slug ? (
                      <Link
                        href={`/companies/${job.company.slug}`}
                        className="font-semibold text-primary hover:underline transition-all"
                      >
                        {companyName}
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground">
                        {companyName}
                      </span>
                    )}
                  </p>

                  <div className="mt-3.5 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {job.city && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0" />
                        {job.city}
                      </span>
                    )}
                    {job.category && (
                      <span className="flex items-center gap-1.5 text-primary">
                        <Briefcase className="size-3.5 shrink-0" />
                        {job.category}
                      </span>
                    )}
                    {job.experience_level && (
                      <span className="flex items-center gap-1.5">
                        <Award className="size-3.5 shrink-0" />
                        {job.experience_level}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5 shrink-0" />
                      Posted {postedAgo}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action row */}
              <Separator className="my-4" />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={scrollToApply}
                  disabled={deadlineExpired}
                  size="sm"
                  className="gap-1.5 h-8 text-xs font-medium px-5 shadow-none"
                >
                  <Send className="size-3.5" />
                  Apply Now
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs font-medium shadow-none"
                  onClick={() => {
                    setSaved((s) => !s);
                    toast(saved ? "Removed from saved" : "Job saved!");
                  }}
                >
                  <Bookmark
                    className={`size-3.5 ${saved ? "fill-current text-primary" : ""}`}
                  />
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
                      <li key={i} className="ml-4 text-[13px] mb-1">
                        {line.replace(/^[•\-]\s*/, "")}
                      </li>
                    ) : (
                      <p key={i} className="text-[13px] mb-2">
                        {line}
                      </p>
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

            {/* Inline Apply Form Section */}
            {!deadlineExpired && (
              <div id="apply-form" ref={applyFormRef} className="pt-2 pb-8">
                <ApplicationForm job={job} />
              </div>
            )}
          </div>

          {/* ── Sidebar ────────────────────────────────────────────── */}
          <aside className="space-y-5 sticky top-20 self-start">
            {/* Apply Card */}
            <motion.div
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-sm"
            >
              {/* Salary highlight */}
              <div className="mb-4 rounded flex flex-col items-center justify-center bg-primary/5 py-3 border border-primary/10">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 font-medium">
                  Salary
                </p>
                <p className="text-[15px] font-semibold text-primary">{salaryLabel}</p>
              </div>

              <Button
                onClick={scrollToApply}
                disabled={deadlineExpired}
                className="w-full gap-1.5 h-9 text-xs mb-3 shadow-none"
                size="sm"
              >
                <Send className="size-3.5" />
                Apply Now
              </Button>

              <Button
                variant="outline"
                className="w-full gap-1.5 h-9 text-xs mb-4 shadow-none"
                size="sm"
                onClick={() => {
                  setSaved((s) => !s);
                  toast(saved ? "Removed from saved" : "Job saved!");
                }}
              >
                <Bookmark
                  className={`size-3.5 ${saved ? "fill-current text-primary" : ""}`}
                />
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
                ].map(
                  ({ label, value }) =>
                    value && (
                      <div
                        key={label}
                        className="flex items-center justify-between text-[13px]"
                      >
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium text-foreground capitalize">
                          {value}
                        </span>
                      </div>
                    )
                )}

                {deadline && (
                  <div className="flex items-center justify-between text-[13px] pt-1 border-t border-border/50">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="size-3.5" /> Deadline
                    </span>
                    <span
                      className={`font-medium ${deadlineExpired ? "text-red-500" : "text-foreground"}`}
                    >
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
              <h3 className="text-[13px] font-semibold text-gray-900 mb-3">
                About the Company
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`size-10 rounded text-white font-semibold text-lg flex flex-shrink-0 items-center justify-center overflow-hidden ${logoSrc && !logoError ? "bg-white border border-gray-100" : logoBg}`}
                >
                  {logoSrc && !logoError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoSrc}
                      alt={companyName}
                      className="h-full w-full object-contain p-1"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    initial
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-gray-900 truncate">
                    {companyName}
                  </p>
                  {job.category && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {job.category}
                    </p>
                  )}
                </div>
              </div>
              {job.city && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {job.city}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Learn more about this employer and their open positions on
                ANASELL.
              </p>
            </motion.div>

            {/* Share */}
            <div className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-sm">
              <p className="text-[13px] font-semibold text-gray-900 mb-3">
                Share this job
              </p>
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
                    className="flex-1 flex items-center justify-center gap-1.5 rounded border border-border bg-gray-50 py-2 text-[11px] font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
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
