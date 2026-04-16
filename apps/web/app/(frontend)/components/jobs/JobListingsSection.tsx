"use client";

import Link from "next/link";
import { ArrowRight, Briefcase, MapPin, Clock, Building2, Loader2, Download } from "lucide-react";
import { useJobs } from "@/hooks/use-jobs";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

function JobSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between animate-pulse">
      <div className="flex items-start gap-3">
        <div className="size-9 shrink-0 rounded-lg bg-gray-100" />
        <div className="space-y-2">
          <div className="h-3.5 w-40 rounded bg-gray-200" />
          <div className="h-2.5 w-28 rounded bg-gray-100" />
        </div>
      </div>
      <div className="h-5 w-16 rounded-full bg-gray-100" />
    </div>
  );
}

export function JobListingsSection() {
  const { data, isLoading } = useJobs({ page_size: 5, status: "active" });
  const jobs = data?.data ?? [];

  return (
    <section className="py-8 sm:py-16 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-3 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Job Board
            </p>
            <h2 className="mt-1.5 text-[1.5rem] font-semibold tracking-[-0.05em] text-foreground sm:text-[1.8rem]">
              Latest opportunities
            </h2>
          </div>
          <Link
            href="/job-board"
            className="hidden items-center gap-1.5 text-sm font-medium text-primary hover:underline sm:flex"
          >
            Browse all jobs
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <JobSkeleton key={i} />)
            : jobs.length === 0
            ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-12 text-center">
                <Briefcase className="mb-3 size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No job listings available right now.</p>
                <Link href="/job-board" className="mt-3 text-sm font-medium text-primary hover:underline">
                  Browse all jobs
                </Link>
              </div>
            )
            : jobs.map((job) => (
              <div
                key={job.id}
                onClick={async () => {
                  if (job.pdf_url) {
                    try {
                      const response = await fetch(job.pdf_url);
                      if (!response.ok) throw new Error("Network error when downloading PDF");
                      const blob = await response.blob();
                      
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.style.display = "none";
                      a.href = url;
                      a.download = `${job.title.replace(/\s+/g, "-").toLowerCase()}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      
                      window.URL.revokeObjectURL(url);
                      a.remove();
                    } catch (error) {
                      console.error("PDF download blob error:", error);
                      const a = document.createElement("a");
                      a.href = job.pdf_url;
                      a.target = "_blank";
                      a.rel = "noreferrer noopener";
                      a.download = `${job.title.replace(/\s+/g, "-").toLowerCase()}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                    }
                  }
                }}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border border-border bg-white p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between",
                  job.pdf_url && "cursor-pointer"
                )}
              >
                <div className="flex min-w-0 items-start gap-3 pointer-events-none">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    {job.company?.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={job.company.logo_url} alt="" className="size-9 rounded-lg object-cover" />
                    ) : (
                      <Building2 className="size-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {job.title}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{job.company?.company_name ?? job.company_name}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-2.5" />
                        {job.city || "South Sudan"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-2.5" />
                        {job.created_at
                          ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true })
                          : "Recently"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-end">
                  <Link
                    href={`/job-board/${job.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-semibold text-primary hover:underline underline-offset-4"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Link
            href="/job-board"
            className="sm:hidden text-sm font-medium text-primary hover:underline"
          >
            View all jobs →
          </Link>
          <Link
            href="/job-board"
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-medium text-foreground transition-shadow hover:shadow-md"
          >
            View all job listings
            <ArrowRight className="size-3.5 text-primary" />
          </Link>
        </div>
      </div>
    </section>
  );
}
