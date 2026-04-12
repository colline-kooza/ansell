"use client";

import { useState, useEffect } from "react";
import { Search, Briefcase, ArrowRight, SlidersHorizontal, X } from "lucide-react";
import { CompanyRegisterBanner } from "@/components/shared/company-register-banner";
import { useJobs } from "@/hooks/use-jobs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import JobCard from "./components/JobCard";
import JobList from "./components/JobList";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const JOB_TYPE_OPTIONS = [
  { label: "All Types", value: "" },
  { label: "Full Time", value: "Full-time" },
  { label: "Part Time", value: "Part-time" },
  { label: "Contract", value: "Contract" },
  { label: "Freelance", value: "Freelance" },
  { label: "Internship", value: "Internship" },
];

const EXPERIENCE_OPTIONS = [
  { label: "All Levels", value: "" },
  { label: "Entry Level", value: "Entry Level" },
  { label: "Mid Level", value: "Mid Level" },
  { label: "Senior Level", value: "Senior Level" },
  { label: "Director / Executive", value: "Director/Executive" },
];

const SALARY_MIN_OPTIONS = [
  { label: "Min Salary", value: "" },
  { label: "$100", value: "100" },
  { label: "$500", value: "500" },
  { label: "$1,000", value: "1000" },
  { label: "$3,000", value: "3000" },
];

const SALARY_MAX_OPTIONS = [
  { label: "Max Salary", value: "" },
  { label: "$2,000", value: "2000" },
  { label: "$5,000", value: "5000" },
  { label: "$10,000", value: "10000" },
  { label: "$20,000+", value: "20000" },
];

// ─── Horizontal filter bar (desktop & tablet) ───────────────────────────────

interface FilterBarProps {
  jobType: string;
  setJobType: (v: string) => void;
  experience: string;
  setExperience: (v: string) => void;
  salaryMin: string;
  setSalaryMin: (v: string) => void;
  salaryMax: string;
  setSalaryMax: (v: string) => void;
  onReset: () => void;
  activeCount: number;
}

function FilterBar({
  jobType, setJobType,
  experience, setExperience,
  salaryMin, setSalaryMin,
  salaryMax, setSalaryMax,
  onReset,
  activeCount,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={jobType || "all"} onValueChange={(v) => setJobType(v === "all" ? "" : v)}>
        <SelectTrigger className="h-8 w-[130px] text-xs border-border/60 bg-white">
          <SelectValue placeholder="Job Type" />
        </SelectTrigger>
        <SelectContent>
          {JOB_TYPE_OPTIONS.map((o) => (
            <SelectItem key={o.value || "all"} value={o.value || "all"} className="text-xs">{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={experience || "all"} onValueChange={(v) => setExperience(v === "all" ? "" : v)}>
        <SelectTrigger className="h-8 w-[140px] text-xs border-border/60 bg-white">
          <SelectValue placeholder="Experience" />
        </SelectTrigger>
        <SelectContent>
          {EXPERIENCE_OPTIONS.map((o) => (
            <SelectItem key={o.value || "all"} value={o.value || "all"} className="text-xs">{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={salaryMin || "all"} onValueChange={(v) => setSalaryMin(v === "all" ? "" : v)}>
        <SelectTrigger className="h-8 w-[120px] text-xs border-border/60 bg-white">
          <SelectValue placeholder="Min Salary" />
        </SelectTrigger>
        <SelectContent>
          {SALARY_MIN_OPTIONS.map((o) => (
            <SelectItem key={o.value || "all"} value={o.value || "all"} className="text-xs">{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={salaryMax || "all"} onValueChange={(v) => setSalaryMax(v === "all" ? "" : v)}>
        <SelectTrigger className="h-8 w-[120px] text-xs border-border/60 bg-white">
          <SelectValue placeholder="Max Salary" />
        </SelectTrigger>
        <SelectContent>
          {SALARY_MAX_OPTIONS.map((o) => (
            <SelectItem key={o.value || "all"} value={o.value || "all"} className="text-xs">{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {activeCount > 0 && (
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-[11px] font-medium text-red-500 hover:underline"
        >
          <X className="size-3" /> Clear ({activeCount})
        </button>
      )}
    </div>
  );
}

// ─── Mobile filter content ────────────────────────────────────────────────────

function MobileFilters({
  jobType, setJobType,
  experience, setExperience,
  salaryMin, setSalaryMin,
  salaryMax, setSalaryMax,
  onReset,
}: Omit<FilterBarProps, "activeCount">) {
  return (
    <div className="space-y-6 pt-4 pb-4">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Job Type</p>
        <Select value={jobType || "all"} onValueChange={(v) => setJobType(v === "all" ? "" : v)}>
          <SelectTrigger className="h-9 text-sm border-border/60">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {JOB_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value || "all"} value={o.value || "all"}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Experience Level</p>
        <Select value={experience || "all"} onValueChange={(v) => setExperience(v === "all" ? "" : v)}>
          <SelectTrigger className="h-9 text-sm border-border/60">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            {EXPERIENCE_OPTIONS.map((o) => (
              <SelectItem key={o.value || "all"} value={o.value || "all"}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Salary Range</p>
        <div className="grid grid-cols-2 gap-2">
          <Select value={salaryMin || "all"} onValueChange={(v) => setSalaryMin(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm border-border/60">
              <SelectValue placeholder="Min" />
            </SelectTrigger>
            <SelectContent>
              {SALARY_MIN_OPTIONS.map((o) => (
                <SelectItem key={o.value || "all"} value={o.value || "all"}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={salaryMax || "all"} onValueChange={(v) => setSalaryMax(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm border-border/60">
              <SelectValue placeholder="Max" />
            </SelectTrigger>
            <SelectContent>
              {SALARY_MAX_OPTIONS.map((o) => (
                <SelectItem key={o.value || "all"} value={o.value || "all"}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button variant="outline" size="sm" className="w-full" onClick={onReset}>
        Reset Filters
      </Button>
    </div>
  );
}

// ─── Page body (needs search params) ─────────────────────────────────────────

function JobBoardContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";

  const [query, setQuery] = useState(initialSearch);
  const [jobType, setJobType] = useState("");
  const [experience, setExperience] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    setQuery(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => { setPage(1); }, [jobType, experience, salaryMin, salaryMax]);

  const { data, isLoading, refetch } = useJobs({
    search: query || undefined,
    job_type: jobType || undefined,
    experience_level: experience || undefined,
    salary_min: salaryMin || undefined,
    salary_max: salaryMax || undefined,
    page,
    page_size: 10,
    status: "active",
  });

  const jobs = data?.data ?? [];
  const totalJobs = data?.total_items ?? 0;
  const totalPages = data?.total_pages ?? 1;

  const activeFilterCount = [jobType, experience, salaryMin, salaryMax].filter(Boolean).length;

  const handleSearch = () => { setPage(1); refetch(); };
  const handleClearAll = () => {
    setQuery(""); setJobType(""); setExperience("");
    setSalaryMin(""); setSalaryMax(""); setPage(1);
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Hero */}
      <section className="relative border-b border-border/50 bg-white px-3 py-8 sm:px-6 sm:py-10">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(180,253,131,0.18),transparent_70%)]" />
        <div className="mx-auto max-w-7xl">
          <h1 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            Find Your <span className="text-primary">Dream</span> Jobs
          </h1>
          <div className="mt-5 mx-auto flex max-w-2xl items-center overflow-hidden rounded-md border border-border/50 bg-white shadow-sm">
            <Search className="ml-3 size-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search jobs by title, company, or category..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 border-0 bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={handleSearch}
              className="flex shrink-0 items-center gap-1.5 bg-primary px-5 py-3 text-[13px] font-semibold text-primary-foreground transition hover:brightness-95"
            >
              Search <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
        {/* Filter toolbar */}
        <div className="mb-5 flex items-center justify-between gap-3">
          {/* Desktop: inline filters */}
          <div className="hidden sm:block">
            <FilterBar
              jobType={jobType} setJobType={setJobType}
              experience={experience} setExperience={setExperience}
              salaryMin={salaryMin} setSalaryMin={setSalaryMin}
              salaryMax={salaryMax} setSalaryMax={setSalaryMax}
              onReset={handleClearAll}
              activeCount={activeFilterCount}
            />
          </div>

          {/* Mobile: drawer trigger */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <button className="sm:hidden flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium shadow-sm">
                <SlidersHorizontal className="size-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto pt-10 pb-10 px-6">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-left text-sm">Filter Jobs</SheetTitle>
              </SheetHeader>
              <MobileFilters
                jobType={jobType} setJobType={setJobType}
                experience={experience} setExperience={setExperience}
                salaryMin={salaryMin} setSalaryMin={setSalaryMin}
                salaryMax={salaryMax} setSalaryMax={setSalaryMax}
                onReset={handleClearAll}
              />
            </SheetContent>
          </Sheet>

          {/* Total count */}
          <p className="ml-auto text-xs text-muted-foreground">
            <strong className="text-foreground">{totalJobs}</strong> jobs found
          </p>
        </div>

        {/* Job list */}
        <JobList
          jobs={jobs}
          totalJobs={totalJobs}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onPageChange={setPage}
          onClearFilters={handleClearAll}
        />

        <CompanyRegisterBanner />
      </div>
    </div>
  );
}

// ─── Entry point wrapped in Suspense for useSearchParams ─────────────────────

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
