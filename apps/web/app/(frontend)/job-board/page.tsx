"use client";

import { useState } from "react";
import { Briefcase, Zap } from "lucide-react";
import { CompanyRegisterBanner } from "@/components/shared/company-register-banner";
import { useJobs } from "@/hooks/use-jobs";
import { Button } from "@/components/ui/button";
import JobCard from "./components/JobCard";
import { Suspense } from "react";
import { motion } from "motion/react";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
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

// ─── Page body ────────────────────────────────────────────────────────────────

function JobBoardContent() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useJobs({
    page,
    page_size: 15,
    status: "active",
  });

  const jobs = data?.data ?? [];
  const totalJobs = data?.total_items ?? 0;
  const totalPages = data?.total_pages ?? 1;

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
            <Briefcase className="size-3" />
            Job Listings
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-2 text-2xl font-bold text-foreground md:text-3xl"
          >
            Available <span className="text-primary">Jobs</span>
          </motion.h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <strong className="text-foreground">{totalJobs}</strong> positions currently advertised
          </p>
        </div>
      </section>

      {/* Job list */}
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : jobs.length > 0
            ? jobs.map((job, i) => <JobCard key={job.id} job={job} index={i} />)
            : (
              <div className="rounded-xl border border-dashed border-border bg-white py-14 text-center">
                <Briefcase className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                <p className="text-sm font-semibold text-foreground">No job listings available right now</p>
                <p className="mt-1 text-xs text-muted-foreground">Check back soon for new opportunities.</p>
              </div>
            )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10">
          <CompanyRegisterBanner />
        </div>
      </div>
    </div>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export default function JobBoardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Briefcase className="size-6 animate-pulse text-primary" />
        </div>
      }
    >
      <JobBoardContent />
    </Suspense>
  );
}
