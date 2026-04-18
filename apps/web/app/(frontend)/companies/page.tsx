"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search, MapPin, Users, Globe, Briefcase, ArrowRight, Building2,
  CheckCircle2, Eye, X, Factory, Landmark, Heart, Leaf, Truck,
  Code, ShoppingBag, HeartHandshake, SlidersHorizontal, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CompanyRegisterBanner } from "@/components/shared/company-register-banner";
import { usePublicCompanies, type Company } from "@/hooks/use-companies";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import { motion } from "motion/react";
import { buildApiUrl } from "@/lib/api";

// ─── Data ──────────────────────────────────────────────────────────────────────

const COMPANY_SECTORS = [
  { label: "All", value: "all", icon: Building2 },
  { label: "Technology", value: "technology", icon: Code },
  { label: "Real Estate", value: "real_estate", icon: Landmark },
  { label: "Agriculture", value: "agriculture", icon: Leaf },
  { label: "NGO", value: "ngo", icon: HeartHandshake },
  { label: "Trade & Retail", value: "retail", icon: ShoppingBag },
  { label: "Construction", value: "construction", icon: Factory },
  { label: "Logistics", value: "logistics", icon: Truck },
  { label: "Finance", value: "finance", icon: Briefcase },
  { label: "Healthcare", value: "healthcare", icon: Heart },
];

// ─── Track view on mount ──────────────────────────────────────────────────────

function useTrackCompanyView(companyId: string | undefined) {
  useEffect(() => {
    if (!companyId) return;
    fetch(buildApiUrl(`companies/${companyId}/view`), { method: "POST" }).catch(() => {});
  }, [companyId]);
}

// ─── Company List Card ─────────────────────────────────────────────────────────

function CompanyCard({ company, index }: { company: Company; index: number }) {
  const foundedYear = new Date(company.created_at).getFullYear();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      className="group relative rounded-2xl border border-gray-100 bg-white p-3 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-gray-100 sm:p-4"
    >
      <Link href={`/companies/${company.slug || company.id}`} className="absolute inset-0 z-10" aria-label={company.company_name} />

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Logo */}
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50 relative z-20">
          {company.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logo_url} alt={company.company_name} className="h-full w-full object-contain p-1" />
          ) : (
            <Building2 className="size-6 text-muted-foreground/30" />
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h3 className="text-[15px] font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
              {company.company_name}
            </h3>
            {company.is_verified && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shrink-0">
                <CheckCircle2 className="size-3 text-emerald-500" /> Verified
              </span>
            )}
          </div>

          {company.industry && (
            <p className="text-sm text-gray-500 mb-2">
              <span className="font-medium text-gray-700">{company.industry}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {company.city && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />{company.city}
              </span>
            )}
            {company.employee_count && (
              <span className="flex items-center gap-1">
                <Users className="size-3" />{company.employee_count}
              </span>
            )}
            {company.website && (
              <span className="flex items-center gap-1">
                <Globe className="size-3" />
                {company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </span>
            )}
            <span>Est. {foundedYear}</span>
            {(company.jobs_count ?? 0) > 0 && (
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Briefcase className="size-3" />
                {company.jobs_count} open job{(company.jobs_count ?? 0) !== 1 ? "s" : ""}
              </span>
            )}
            {(company.views ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-gray-400">
                <Eye className="size-3" />{(company.views ?? 0).toLocaleString()} views
              </span>
            )}
          </div>

          {company.description && (
            <p className="mt-2 text-xs leading-5 text-muted-foreground line-clamp-2">{company.description}</p>
          )}
        </div>

        {/* CTA */}
        <div className="flex shrink-0 items-center relative z-20">
          <span className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-[12px] font-semibold text-primary">
            <ChevronRight className="size-3.5" />
            View Profile
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CompanySkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-4">
      <div className="flex gap-4">
        <div className="size-12 rounded-xl bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/5 rounded bg-gray-200" />
          <div className="h-3 w-1/3 rounded bg-gray-200" />
          <div className="flex gap-2 mt-2">
            <div className="h-4 w-16 rounded-full bg-gray-200" />
            <div className="h-4 w-20 rounded-full bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page Content ─────────────────────────────────────────────────────────────

function CompaniesContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialIndustry = searchParams.get("industry") || "all";

  const [search, setSearch] = useState(initialSearch);
  const [industry, setIndustry] = useState(initialIndustry);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setIndustry(searchParams.get("industry") || "all");
  }, [searchParams]);

  const { data, isLoading } = usePublicCompanies({
    search: search || undefined,
    industry: industry === "all" ? undefined : industry,
    page,
    page_size: 15,
  });

  const companies = data?.data ?? [];
  const totalItems = data?.total_items ?? 0;
  const totalPages = data?.total_pages ?? 1;

  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      {/* Header */}
      <section className="relative border-b border-border/50 bg-white px-4 py-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,rgba(180,253,131,0.18),transparent_70%)]" />
        <div className="mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary shadow-sm"
          >
            <Building2 className="size-3" />
            Company Directory
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-2 text-2xl font-bold text-foreground md:text-3xl"
          >
            Companies in <span className="text-primary">South Sudan</span>
          </motion.h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <strong className="text-foreground">{totalItems}</strong> verified businesses found
          </p>

          {/* Search */}
          <div className="mt-5 relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search companies, sectors, cities..."
              className="w-full rounded-sm border border-border/60 bg-white py-2.5 pl-9 pr-8 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X className="size-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Sector filter */}
      <div className="sticky top-0 z-30 border-b border-border/40 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center justify-between gap-3">
            <div className="hidden items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-hide sm:flex">
              {COMPANY_SECTORS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => { setIndustry(s.value); setPage(1); }}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                      industry === s.value
                        ? "border-foreground bg-foreground text-white"
                        : "border-border bg-white text-foreground hover:border-foreground/60"
                    }`}
                  >
                    <Icon className="size-3" />
                    {s.label}
                  </button>
                );
              })}
            </div>

            {/* Mobile drawer */}
            <div className="flex flex-1 items-center gap-2 sm:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium shadow-sm">
                    <SlidersHorizontal className="size-3.5" />
                    Sectors
                    {industry !== "all" && (
                      <span className="flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">1</span>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto pt-10 pb-10 px-6">
                  <SheetHeader className="mb-4">
                    <SheetTitle className="text-left text-sm">Filter by Sector</SheetTitle>
                  </SheetHeader>
                  <div className="grid grid-cols-2 gap-2 py-4">
                    {COMPANY_SECTORS.map((s) => {
                      const Icon = s.icon;
                      return (
                        <button
                          key={s.value}
                          onClick={() => { setIndustry(s.value); setPage(1); }}
                          className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${
                            industry === s.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-white"
                          }`}
                        >
                          <Icon className={cn("size-4", industry === s.value ? "text-primary" : "text-muted-foreground")} />
                          <span className={cn("text-xs font-medium", industry === s.value ? "text-foreground" : "text-foreground")}>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => { setIndustry("all"); setPage(1); }}>Clear Filter</Button>
                </SheetContent>
              </Sheet>
            </div>

            <div className="ml-auto text-xs text-muted-foreground">
              {totalItems} companies
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <CompanySkeleton key={i} />)
            : companies.length > 0
            ? companies.map((company, i) => <CompanyCard key={company.id} company={company} index={i} />)
            : (
              <div className="rounded-xl border border-dashed border-border bg-white py-16 text-center">
                <Building2 className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                <p className="text-sm font-semibold text-foreground">No companies found</p>
                <p className="mt-1 text-xs text-muted-foreground">Try a different search or sector.</p>
                <button
                  onClick={() => { setSearch(""); setIndustry("all"); }}
                  className="mt-4 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
                >
                  Reset Filters
                </button>
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

        <CompanyRegisterBanner />
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4f8fb] flex items-center justify-center font-medium text-xs text-muted-foreground animate-pulse">Loading Directory...</div>}>
      <CompaniesContent />
    </Suspense>
  );
}
