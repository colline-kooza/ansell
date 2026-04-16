"use client";

import { Briefcase, LayoutGrid, LayoutList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Job } from "@/hooks/use-jobs";
import JobCard from "./JobCard";

interface JobListProps {
  jobs: Job[];
  totalJobs: number;
  isLoading: boolean;
  page: number;
  totalPages: number;
  viewMode: "list" | "grid";
  onViewModeChange: (mode: "list" | "grid") => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
}

export default function JobList({
  jobs,
  totalJobs,
  isLoading,
  page,
  totalPages,
  viewMode,
  onViewModeChange,
  onPageChange,
  onClearFilters,
}: JobListProps) {
  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">
          {isLoading ? (
            <Skeleton className="h-4 w-32 inline-block" />
          ) : (
            <>
              <span className="font-semibold text-foreground">
                {totalJobs.toLocaleString()}
              </span>{" "}
              {totalJobs === 1 ? "job" : "jobs"} found
            </>
          )}
        </span>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={`flex items-center justify-center rounded-md p-1.5 transition-colors ${
              viewMode === "list"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="List view"
          >
            <LayoutList className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            className={`flex items-center justify-center rounded-md p-1.5 transition-colors ${
              viewMode === "grid"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Grid view"
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 gap-4"
              : "space-y-3"
          }
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center">
          <Briefcase className="mb-4 size-10 text-muted-foreground/30" />
          <p className="text-base font-semibold text-foreground">
            No jobs match your filters
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Try adjusting your search terms or filters.
          </p>
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-4 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 gap-4 sm:grid-cols-2"
                : "space-y-3"
            }
          >
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                  className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
