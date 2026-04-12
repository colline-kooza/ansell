"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  Users,
  Globe,
  Briefcase,
  ArrowRight,
  Building2,
  CheckCircle2,
  Star,
  X,
  Factory,
  Landmark,
  Heart,
  Leaf,
  Truck,
  Code,
  ShoppingBag,
  HeartHandshake,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CompanyRegisterBanner } from "@/components/shared/company-register-banner";
import { usePublicCompanies, type Company } from "@/hooks/use-companies";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

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

// ─── Company Card ─────────────────────────────────────────────────────────────

function CompanyCard({ company }: { company: Company }) {
  // Generate a consistent light background from seed
  const palettes = [
    "from-emerald-50 to-green-100",
    "from-sky-50 to-blue-100",
    "from-amber-50 to-yellow-100",
    "from-rose-50 to-pink-100",
    "from-violet-50 to-purple-100",
    "from-teal-50 to-cyan-100",
  ];
  const palette = palettes[company.company_name.length % palettes.length];
  const foundedYear = new Date(company.created_at).getFullYear();

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <Link href={`/companies/${company.slug || company.id}`} className="absolute inset-0 z-10" />
      
      {/* Top banner */}
      <div className={`relative h-20 bg-gradient-to-br ${palette}`}>
        {/* Logo */}
        <div className="absolute -bottom-6 left-5">
          <div className="flex size-14 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow-md">
            {company.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logo_url}
                alt={company.company_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="size-6 text-muted-foreground/40" />
            )}
          </div>
        </div>

        {/* Verified badge */}
        {company.is_verified && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shadow-sm backdrop-blur-sm">
            <CheckCircle2 className="size-3 text-emerald-500" />
            Verified
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5 pt-9">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[14px] font-bold text-gray-900 leading-tight">{company.company_name}</h3>
            <div className="flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-amber-600">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              4.8
            </div>
          </div>

          <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {company.city || "South Sudan"}
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3" />
              {company.employee_count || "10-50"}
            </span>
            <span>Est. {foundedYear}</span>
          </div>
        </div>

        <p className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
          {company.description || "Leading company in South Sudan providing quality services."}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {company.industry?.split(",").map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {tag.trim()}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-border/40 pt-3 relative z-20">
          <span className="text-[11px] text-muted-foreground">
            <strong className="text-foreground">{company.jobs_count || 0}</strong> open jobs
          </span>
          <Link href={`/companies/${company.slug || company.id}`} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground transition hover:brightness-95">
            View Profile
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// ─── Content ──────────────────────────────────────────────────────────────────
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
    page_size: 12,
  });

  const companies = data?.data ?? [];
  const totalItems = data?.total_items ?? 0;

  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      {/* Header */}
      <div className="border-b border-border/60 bg-white">
        <div className="mx-auto max-w-7xl px-3 py-7 sm:px-6 sm:py-10 lg:px-8">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(180,253,131,0.18),transparent_70%)]" />

          <div className="mb-1 flex items-center gap-2">
            <Building2 className="size-3.5 text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Directory
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Companies in South Sudan
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            Discover verified businesses, employers, and organizations operating across South Sudan.
          </p>

          {/* Search + stats row */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search companies, sectors, cities..."
                className="w-full rounded-sm border border-border/60 bg-white py-2.5 pl-9 pr-8 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <X className="size-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span><strong className="text-foreground">{totalItems}</strong> companies found</span>
              {!isLoading && (
                <span><strong className="text-foreground">{companies.filter(c => c.is_verified).length}</strong> verified in this view</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sector filter chips / Drawer */}
      <div className="sticky top-0 z-30 border-b border-border/40 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center justify-between gap-3">
            {/* Desktop: horizontal list */}
            <div className="hidden items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-hide sm:flex">
              {COMPANY_SECTORS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setIndustry(s.value)}
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

            {/* Mobile: Drawer trigger */}
            <div className="flex flex-1 items-center gap-2 sm:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium shadow-sm">
                    <SlidersHorizontal className="size-3.5" />
                    Sectors
                    {industry !== "all" && (
                      <span className="flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                        1
                      </span>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto pt-10 pb-10 px-6">
                  <SheetHeader className="mb-4">
                    <SheetTitle className="text-left text-sm">Filter by Sector</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 pt-4 pb-4">
                    <div className="grid grid-cols-2 gap-2">
                       {COMPANY_SECTORS.map((s) => {
                         const Icon = s.icon;
                         return (
                           <button
                             key={s.value}
                             onClick={() => { setIndustry(s.value); setPage(1); }}
                             className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${
                               industry === s.value
                                 ? "border-primary bg-primary/5 ring-1 ring-primary"
                                 : "border-border bg-white"
                             }`}
                           >
                              <Icon className={cn("size-4", industry === s.value ? "text-primary" : "text-muted-foreground")} />
                              <span className={cn("text-xs font-medium", industry === s.value ? "text-primary-foreground text-foreground" : "text-foreground")}>{s.label}</span>
                           </button>
                         )
                       })}
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => { setIndustry("all"); setPage(1); }}>
                      Clear Filter
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              
              <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 [scrollbar-width:none]">
                 {COMPANY_SECTORS.filter(s => s.value === industry).map(s => (
                    <span key={s.value} className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary">
                       {s.label}
                    </span>
                 ))}
              </div>
            </div>
            
            <div className="ml-auto text-xs text-muted-foreground sm:hidden">
               {totalItems} items
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <strong className="text-foreground">{companies.length}</strong> compan{companies.length !== 1 ? "ies" : "y"}
            {industry !== "all" ? ` in ${industry}` : ""}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
             {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-white border border-border/50 animate-pulse" />
             ))}
          </div>
        ) : companies.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}

        {/* Register CTA */}
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
