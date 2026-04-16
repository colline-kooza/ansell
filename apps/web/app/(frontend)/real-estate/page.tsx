"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { PropertyGrid } from "./components/PropertyGrid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useProperties } from "@/hooks/use-properties";
import { getListMeta } from "@/lib/api-utils";
import {
  PROPERTY_CATEGORY_OPTIONS,
  PROPERTY_CATEGORY_LABELS,
} from "@/lib/real-estate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type CategoryValue = (typeof PROPERTY_CATEGORY_OPTIONS)[number]["value"];

function useDebouncedValue<T>(value: T, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);
  return debouncedValue;
}

// Additional filter options
const CITY_OPTIONS = [
  { label: "All Cities", value: "" },
  { label: "Juba", value: "Juba" },
  { label: "Malakal", value: "Malakal" },
  { label: "Wau", value: "Wau" },
  { label: "Bentiu", value: "Bentiu" },
  { label: "Yei", value: "Yei" },
];

function RealEstateContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const searchParam = searchParams.get("search") ?? "";

  const [category, setCategory] = useState<CategoryValue>(
    (typeParam as CategoryValue) || "all"
  );
  const [search, setSearch] = useState(searchParam);
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setCity(searchParams.get("city") || "");
    const type = searchParams.get("type");
    if (type && PROPERTY_CATEGORY_OPTIONS.some((opt) => opt.value === type)) {
      setCategory(type as CategoryValue);
    } else if (type === "all") {
      setCategory("all");
    }
  }, [searchParams]);

  const debouncedSearch = useDebouncedValue(search, 400);
  const propertiesQuery = useProperties({
    category: category === "all" ? undefined : category,
    search: debouncedSearch || undefined,
    // @ts-ignore — city filter extended
    city: city || undefined,
    page,
    page_size: 12,
  });

  const properties = propertiesQuery.data?.data ?? [];
  const meta = getListMeta(propertiesQuery.data);
  const featuredCount = properties.filter((p) => p.is_featured).length;
  const cityCoverage = new Set(properties.map((p) => p.city)).size;

  const activeFilterCount = [
    category !== "all" ? category : "",
    city,
  ].filter(Boolean).length;

  const handleReset = () => {
    setCategory("all");
    setCity("");
    setSearch("");
    setPage(1);
  };

  const filterContent = (
    <div className="space-y-6 pt-4 pb-4">
      {/* Category */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Property Type</p>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setCategory(opt.value); setPage(1); setDrawerOpen(false); }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                category === opt.value
                  ? "border-foreground bg-foreground text-white"
                  : "border-border bg-white text-foreground hover:border-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* City */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">City</p>
        <Select value={city || "all"} onValueChange={(v) => { setCity(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 text-sm border-border/60">
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            {CITY_OPTIONS.map((o) => (
              <SelectItem key={o.value || "all"} value={o.value || "all"}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="outline" size="sm" className="w-full" onClick={handleReset}>
          Reset Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Filter bar */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {/* Category pills — always show horizontally */}
          <div className="hidden flex-wrap gap-1.5 sm:flex">
            {PROPERTY_CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setCategory(opt.value); setPage(1); }}
                className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                  category === opt.value
                    ? "border-foreground bg-foreground text-white"
                    : "border-border bg-white text-foreground hover:border-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* City filter — desktop */}
          <div className="hidden sm:block">
            <Select value={city || "all"} onValueChange={(v) => { setCity(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="h-7 w-[120px] border-border/60 bg-white text-xs">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                {CITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value || "all"} value={o.value || "all"} className="text-xs">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mobile: filter drawer trigger */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
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
                <SheetTitle className="text-left text-sm">Filter Properties</SheetTitle>
              </SheetHeader>
              {filterContent}
            </SheetContent>
          </Sheet>

          {activeFilterCount > 0 && (
            <button
              onClick={handleReset}
              className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-red-500 hover:underline"
            >
              <X className="size-3" /> Clear filters
            </button>
          )}

          {/* Search + stats */}
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:block">
              <strong className="text-foreground">{meta.total}</strong> listings
            </span>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search..."
                className="h-8 w-36 border-border/60 bg-white pl-8 text-xs sm:w-48"
              />
            </div>
          </div>
        </div>

        {/* Stats row — mobile */}
        <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground sm:hidden">
          <span><strong className="text-foreground">{meta.total}</strong> listings</span>
          <span><strong className="text-foreground">{featuredCount}</strong> featured</span>
          <span><strong className="text-foreground">{cityCoverage}</strong> cities</span>
        </div>

        {/* Results */}
        {propertiesQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2.5">
                <Skeleton className="aspect-[16/10] sm:aspect-square rounded-xl" />
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <>
            <PropertyGrid properties={properties} />
            {meta.pages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Page {meta.page} of {meta.pages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setPage((c) => Math.max(1, c - 1))}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={meta.page >= meta.pages} onClick={() => setPage((c) => Math.min(meta.pages, c + 1))}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <Card className="rounded-xl border border-dashed bg-white px-6 py-14 text-center shadow-none">
            <p className="text-base font-semibold text-foreground">No listings found</p>
            <p className="mx-auto mt-1.5 max-w-xl text-xs leading-6 text-muted-foreground">
              Try another category or search term.
            </p>
            <button onClick={handleReset} className="mt-4 text-sm font-medium text-primary hover:underline">Clear filters</button>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function RealEstatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f4f8fb] flex items-center justify-center">
        <div className="animate-pulse text-primary font-medium text-sm">Loading...</div>
      </div>
    }>
      <RealEstateContent />
    </Suspense>
  );
}
