"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Search, Building2, MapPin, Calendar, Tag, ChevronRight,
  Clock, Zap, FileText, ArrowRight, X, Filter, SlidersHorizontal,
} from "lucide-react";
import { CompanyRegisterBanner } from "@/components/shared/company-register-banner";
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
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTenders, useTenderCategories, type Tender } from "@/hooks/use-tenders";
import { formatDistanceToNow, format, isPast } from "date-fns";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isPast(d)) return 0;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

function urgencyColor(days: number | null) {
  if (days === null) return "";
  if (days <= 3) return "text-red-600 bg-red-50";
  if (days <= 7) return "text-amber-600 bg-amber-50";
  return "text-emerald-700 bg-emerald-50";
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function TendersHero({
  query,
  location,
  category,
  setQuery,
  setLocation,
  setCategory,
  onSearch,
  categories,
}: {
  query: string;
  location: string;
  category: string;
  setQuery: (v: string) => void;
  setLocation: (v: string) => void;
  setCategory: (v: string) => void;
  onSearch: () => void;
  categories: { category: string; count: number }[];
}) {
  return (
    <section className="py-10 px-4 bg-white border-b border-border/50 relative">
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(180,253,131,0.18),transparent_70%)] pointer-events-none" />
      <div className="max-w-7xl mx-auto text-center relative z-10">
        <motion.div
           initial={{ opacity: 0, y: -10 }}
           animate={{ opacity: 1, y: 0 }}
           className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary shadow-sm"
        >
          <Zap className="size-3.5 fill-primary" />
          South Sudan Procurement Hub
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold text-foreground mb-6"
        >
          Open <span className="text-primary">Tenders</span> &amp; Bids
        </motion.h1>

        {/* Search bar matching Job Board style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative mx-auto mt-7 flex max-w-2xl items-center rounded-md bg-white p-1.5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-border/50"
        >
          <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search properties, jobs, tenders, companies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="w-full flex-1 border-0 bg-transparent px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={onSearch}
            className="group flex shrink-0 items-center gap-1.5 rounded bg-[#b4fd83] px-6 py-2.5 text-[13px] font-semibold text-[#003B2B] transition-colors hover:bg-[#a3eb72]"
          >
            Search
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TENDER_TYPES = [
  { label: "Open Tender", value: "Open" },
  { label: "Restricted", value: "Restricted" },
  { label: "RFQ", value: "RFQ" },
  { label: "RFP", value: "RFP" },
  { label: "EOI", value: "EOI" },
];

const CITIES = ["Juba", "Wau", "Malakal", "Torit", "Yambio", "Bentiu", "Bor"];

// ─── Tender Card ──────────────────────────────────────────────────────────────

function TenderCard({ tender, index }: { tender: Tender; index: number }) {
  const [imgError, setImgError] = useState(false);
  const days = daysUntil(tender.submission_deadline);
  const urgencyClass = urgencyColor(days);
  const companyName = tender.issuing_organisation || "Ansell";
  const initial = companyName.charAt(0).toUpperCase();

  // Try to use provided logo, or guess via clearbit
  let logoSrc = tender.company?.logo_url || tender.issuing_organisation_logo;
  if (!logoSrc && !imgError && companyName !== "Ansell") {
    const domain = companyName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() + ".com";
    logoSrc = `https://logo.clearbit.com/${domain}`;
  }

  const colors = ["bg-blue-500", "bg-purple-500", "bg-teal-500", "bg-amber-500", "bg-rose-500"];
  const logoBg = !logoSrc || imgError ? colors[companyName.length % colors.length] : "bg-white border border-gray-100";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      className="group relative rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-gray-100"
    >
      <Link href={`/tenders/${tender.id}`} className="absolute inset-0 z-10" aria-label={tender.title} />

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Logo */}
        <div className={`size-12 shrink-0 rounded-xl flex items-center justify-center overflow-hidden text-white font-bold text-lg relative z-20 ${logoBg}`}>
          {logoSrc && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt={companyName}
              onError={() => setImgError(true)}
              className="h-full w-full object-contain bg-white p-1.5 rounded-xl"
              referrerPolicy="no-referrer"
            />
          ) : (
            initial
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h3 className="text-[15px] font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
              {tender.title}
            </h3>
            {tender.is_featured && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary shrink-0">
                Featured
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-3">
            by <span className="font-semibold text-gray-800">{companyName}</span>
            {tender.reference_number && (
              <span className="ml-2 text-xs text-gray-400">· Ref: {tender.reference_number}</span>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {tender.category && (
              <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-medium text-blue-700">
                <Tag className="size-3" />{tender.category}
              </span>
            )}
            {tender.tender_type && (
              <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 font-medium text-purple-700">
                <FileText className="size-3" />{tender.tender_type}
              </span>
            )}
            {tender.city && (
              <span className="flex items-center gap-1 text-gray-500">
                <MapPin className="size-3" />{tender.city}
              </span>
            )}
            {tender.value_estimate && (
              <span className="font-semibold text-gray-800">
                {tender.value_currency ?? "USD"} {Number(tender.value_estimate).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Meta / actions */}
        <div className="flex flex-col items-end gap-2 relative z-20 shrink-0">
          {days !== null ? (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${urgencyClass}`}>
              <Clock className="size-3" />
              {days === 0 ? "Closed" : `${days}d left`}
            </span>
          ) : null}
          {tender.submission_deadline && (
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <Calendar className="size-3" />
              {format(new Date(tender.submission_deadline), "dd MMM yyyy")}
            </p>
          )}
          <p className="text-[11px] text-gray-400">{tender.bid_count} bids</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function FilterSidebar({
  selectedCategory, setSelectedCategory,
  selectedTypes, setSelectedTypes,
  selectedCity, setSelectedCity,
  closingSoon, setClosingSoon,
  onReset,
  categories,
}: {
  selectedCategory: string; setSelectedCategory: (v: string) => void;
  selectedTypes: string[]; setSelectedTypes: (v: string[]) => void;
  selectedCity: string; setSelectedCity: (v: string) => void;
  closingSoon: boolean; setClosingSoon: (v: boolean) => void;
  onReset: () => void;
  categories: { category: string; count: number }[];
}) {
  const toggleType = (t: string) =>
    setSelectedTypes(
      selectedTypes.includes(t)
        ? selectedTypes.filter((x) => x !== t)
        : [...selectedTypes, t]
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Filter className="size-3.5" />Filters
        </h2>
        <button onClick={onReset} className="text-[11px] font-medium text-primary hover:underline">Reset all</button>
      </div>

      {/* Closing soon toggle */}
      <label className="flex cursor-pointer items-center gap-2.5">
        <div
          onClick={() => setClosingSoon(!closingSoon)}
          className={`relative h-5 w-9 rounded-full transition-colors ${closingSoon ? "bg-primary" : "bg-gray-200"}`}
        >
          <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${closingSoon ? "translate-x-4" : "translate-x-0.5"}`} />
        </div>
        <span className="text-xs font-medium text-foreground">Closing Soon (&lt;7 days)</span>
      </label>

      {/* Category */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Category</h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedCategory("")}
              className={`w-full text-left px-2 py-1.5 text-xs rounded-lg transition-colors ${!selectedCategory ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted"}`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(cat.category === selectedCategory ? "" : cat.category)}
                className={`flex w-full items-center justify-between px-2 py-1.5 text-xs rounded-lg transition-colors ${selectedCategory === cat.category ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted"}`}
              >
                <span>{cat.category}</span>
                <span className="text-[10px] text-muted-foreground">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tender Type */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Tender Type</h3>
        <div className="space-y-2">
          {TENDER_TYPES.map((t) => {
            const checked = selectedTypes.includes(t.value);
            return (
              <label key={t.value} className="flex cursor-pointer items-center gap-2" onClick={() => toggleType(t.value)}>
                <div className={`flex size-3.5 items-center justify-center rounded border shrink-0 transition-colors ${checked ? "border-primary bg-primary" : "border-border"}`}>
                  {checked && <div className="size-1.5 rounded-sm bg-white" />}
                </div>
                <span className={`text-xs ${checked ? "font-medium text-foreground" : "text-muted-foreground"}`}>{t.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* City */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Location</h3>
        <div className="space-y-1">
          <button
            onClick={() => setSelectedCity("")}
            className={`w-full text-left px-2 py-1.5 text-xs rounded-lg transition-colors ${!selectedCity ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            All Locations
          </button>
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city === selectedCity ? "" : city)}
              className={`flex w-full items-center gap-1.5 px-2 py-1.5 text-xs rounded-lg transition-colors ${selectedCity === city ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted"}`}
            >
              <MapPin className="size-3 shrink-0" />{city}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

function TendersContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [query, setQuery] = useState(initialSearch);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [closingSoon, setClosingSoon] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const s = searchParams.get("search") || "";
    setQuery(s);
    setSearchQuery(s);
  }, [searchParams]);

  const { data, isLoading } = useTenders({
    search: searchQuery || undefined,
    category: selectedCategory || undefined,
    tender_type: selectedTypes.length === 1 ? selectedTypes[0] : undefined,
    city: selectedCity || undefined,
    closing_soon: closingSoon || undefined,
    status: "active",
    page,
    page_size: 10,
  });

  const { data: categories } = useTenderCategories();

  useEffect(() => { setPage(1); }, [selectedCategory, selectedTypes, selectedCity, closingSoon]);

  const tenders = data?.data ?? [];
  const total = data?.total_items ?? 0;
  const totalPages = data?.total_pages ?? 1;

  const handleSearch = () => { setSearchQuery(query); setPage(1); };
  const handleReset = () => {
    setQuery(""); setSearchQuery(""); setSelectedCategory("");
    setSelectedTypes([]); setSelectedCity(""); setClosingSoon(false); setPage(1);
  };

  const activeFilterCount = [selectedCategory, selectedCity, closingSoon ? "1" : "", ...selectedTypes].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      <TendersHero
        query={query}
        setQuery={setQuery}
        category={selectedCategory}
        setCategory={setSelectedCategory}
        location={selectedCity}
        setLocation={setSelectedCity}
        onSearch={handleSearch}
        categories={categories ?? []}
      />

      {/* Sticky type filter bar */}
      <div className="sticky top-0 z-30 border-b border-border/50 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-3 py-2 sm:px-6 lg:px-8 [scrollbar-width:none]">
          {["All", "Open", "Restricted", "RFQ", "RFP", "EOI"].map((type) => (
            <button
              key={type}
              onClick={() =>
                type === "All"
                  ? setSelectedTypes([])
                  : setSelectedTypes(selectedTypes.includes(type) ? selectedTypes.filter((x) => x !== type) : [type])
              }
              className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                (type === "All" && !selectedTypes.length) || selectedTypes.includes(type)
                  ? "border-foreground bg-foreground text-white"
                  : "border-border bg-white text-foreground hover:border-foreground/60"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        {/* Secondary filter row */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {/* Desktop inline filters */}
          <div className="hidden sm:flex flex-wrap items-center gap-2">
            {(categories ?? []).length > 0 && (
              <Select value={selectedCategory || "all"} onValueChange={(v) => { setSelectedCategory(v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className="h-8 w-[150px] text-xs border-border/60 bg-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c.category} value={c.category} className="text-xs">{c.category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={selectedCity || "all"} onValueChange={(v) => { setSelectedCity(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-8 w-[130px] text-xs border-border/60 bg-white">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Locations</SelectItem>
                {CITIES.map((city) => (
                  <SelectItem key={city} value={city} className="text-xs">{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <label className="flex cursor-pointer items-center gap-2">
              <div
                onClick={() => setClosingSoon(!closingSoon)}
                className={`relative h-5 w-9 rounded-full transition-colors ${closingSoon ? "bg-primary" : "bg-gray-200"}`}
              >
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${closingSoon ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <span className="text-xs font-medium">Closing Soon</span>
            </label>

            {activeFilterCount > 0 && (
              <button onClick={handleReset} className="flex items-center gap-1 text-[11px] font-medium text-red-500 hover:underline">
                <X className="size-3" /> Clear ({activeFilterCount})
              </button>
            )}
          </div>

          {/* Mobile: Sheet drawer */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="sm:hidden flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium shadow-sm">
                <SlidersHorizontal className="size-3.5" />
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
                <SheetTitle className="text-left text-sm">Filter Tenders</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 pt-4 pb-4">
                {(categories ?? []).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Category</p>
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => setSelectedCategory("")} className={`rounded-full border px-3 py-1 text-xs font-medium ${!selectedCategory ? "border-foreground bg-foreground text-white" : "border-border bg-white"}`}>All</button>
                      {(categories ?? []).map((c) => (
                        <button key={c.category} onClick={() => setSelectedCategory(c.category === selectedCategory ? "" : c.category)} className={`rounded-full border px-3 py-1 text-xs font-medium ${selectedCategory === c.category ? "border-foreground bg-foreground text-white" : "border-border bg-white"}`}>{c.category}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Location</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setSelectedCity("")} className={`rounded-full border px-3 py-1 text-xs font-medium ${!selectedCity ? "border-foreground bg-foreground text-white" : "border-border bg-white"}`}>All</button>
                    {CITIES.map((city) => (
                      <button key={city} onClick={() => setSelectedCity(city === selectedCity ? "" : city)} className={`rounded-full border px-3 py-1 text-xs font-medium ${selectedCity === city ? "border-foreground bg-foreground text-white" : "border-border bg-white"}`}>{city}</button>
                    ))}
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2.5">
                  <div onClick={() => setClosingSoon(!closingSoon)} className={`relative h-5 w-9 rounded-full transition-colors ${closingSoon ? "bg-primary" : "bg-gray-200"}`}>
                    <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${closingSoon ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-xs font-medium">Closing Soon (&lt;7 days)</span>
                </label>
                <Button variant="outline" size="sm" className="w-full" onClick={handleReset}>Reset Filters</Button>
              </div>
            </SheetContent>
          </Sheet>

          <p className="ml-auto text-xs text-muted-foreground">
            <strong className="text-foreground">{total}</strong> tenders
          </p>
        </div>

        {/* List */}
        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            : tenders.length > 0
            ? tenders.map((tender, i) => <TenderCard key={tender.id} tender={tender} index={i} />)
            : (
              <div className="rounded-xl border border-dashed border-border bg-white py-14 text-center">
                <Building2 className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                <p className="text-sm font-semibold text-foreground">No tenders match your filters</p>
                <button onClick={handleReset} className="mt-4 rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground">
                  Reset Filters
                </button>
              </div>
            )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-muted"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-muted"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        <CompanyRegisterBanner />
      </div>
    </div>
  );
}

export default function TendersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4f8fb] flex items-center justify-center"><Zap className="size-6 animate-pulse text-primary" /></div>}>
      <TendersContent />
    </Suspense>
  );
}
