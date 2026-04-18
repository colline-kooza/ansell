"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Search, Play, Eye,
  CheckCircle2, X, TrendingUp, Megaphone, Zap, Film,
  Building2, ShoppingBag, Landmark, BookOpen, Truck,
  HeartHandshake, Tag,
} from "lucide-react";
import { useVideoAdverts, useVideoCategories, type VideoAdvert } from "@/hooks/use-video-adverts";

// ─── Hero ─────────────────────────────────────────────────────────────────────

const HERO_IMAGES = Array.from({ length: 12 }, (_, i) => `https://picsum.photos/seed/advert-bg-${i + 20}/400/300`);

function AdvertsHero() {
  return (
    <div className="relative w-full h-[220px] md:h-[280px] overflow-hidden rounded-2xl bg-black">
      <div className="absolute inset-0 flex opacity-35">
        <div className="flex animate-marquee-adv shrink-0">
          {[...HERO_IMAGES, ...HERO_IMAGES].map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="h-full shrink-0 object-cover" style={{ width: 200 }} />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-t from-black/65 to-transparent text-white">
        <span className="mb-2 text-[10px] font-medium opacity-80 md:text-xs">Promote Your Business</span>
        <div className="mb-3 flex items-center gap-2">
          <div className="rounded-xl bg-primary p-1.5 md:p-2">
            <Megaphone className="size-5 text-primary-foreground md:size-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight md:text-4xl">Video Adverts</h1>
        </div>
        <p className="mb-5 max-w-sm text-center text-xs font-medium opacity-75 md:text-[13px]">
          Reach thousands of Anasell visitors with targeted video advertising.
        </p>
      </div>
      <button className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/30 md:flex">
        <ChevronLeft className="size-5" />
      </button>
      <button className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/30 md:flex">
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

// ─── Advert Card ──────────────────────────────────────────────────────────────

function AdvertCard({ advert }: { advert: VideoAdvert }) {
  const thumbnail = advert.thumbnail_url || `https://picsum.photos/seed/adv-${advert.id}/640/360`;
  const companyName = advert.company_name || "Anasell";
  const companyInitial = companyName.charAt(0).toUpperCase();
  const colors = ["bg-blue-500", "bg-purple-500", "bg-teal-500", "bg-amber-500", "bg-rose-500"];
  const logoBg = colors[companyName.length % colors.length];
  const duration = advert.duration_seconds
    ? `${Math.floor(advert.duration_seconds / 60)}:${String(advert.duration_seconds % 60).padStart(2, "0")}`
    : null;

  return (
    <Link href={`/video-adverts/${advert.id}`} className="group flex cursor-pointer flex-col gap-2.5">
      <div className="relative aspect-video overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnail}
          alt={advert.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="rounded-full bg-white/90 p-2.5 shadow-lg">
            <Play className="size-5 fill-current text-gray-900" />
          </div>
        </div>
        {duration && (
          <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {duration}
          </div>
        )}
        {advert.is_featured && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            <Zap className="size-2.5" />Featured
          </div>
        )}
        {advert.category && (
          <div className="absolute right-2 top-2 rounded-full border border-white/20 bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {advert.category}
          </div>
        )}
      </div>

      <div className="flex gap-2.5">
        <div className={`size-9 shrink-0 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden ${logoBg}`}>
          {advert.company_logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={advert.company_logo} alt={companyName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : companyInitial}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-gray-900 group-hover:text-primary transition-colors">
            {advert.title}
          </h3>
          <div className="flex flex-col text-[11px] font-medium text-gray-500">
            <div className="flex items-center gap-1">
              <span>{companyName}</span>
              <CheckCircle2 className="size-3 fill-current text-emerald-500" />
            </div>
            <div className="flex items-center gap-1">
              <Eye className="size-3" />
              <span>{(advert.views ?? 0).toLocaleString()} views</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function AdvertSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-2.5">
      <div className="aspect-video w-full rounded-xl bg-gray-200" />
      <div className="flex gap-2.5">
        <div className="size-9 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-4/5 rounded bg-gray-200" />
          <div className="h-3 w-3/5 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Business: Building2, Products: ShoppingBag, "Real Estate": Landmark,
  Education: BookOpen, NGO: HeartHandshake, Logistics: Truck,
  Promotions: Tag, default: Film,
};

function AdvertSidebar({
  category, setCategory, onReset, apiCategories,
}: {
  category: string; setCategory: (v: string) => void;
  onReset: () => void;
  apiCategories: { category: string; count: number }[];
}) {
  const allCats = [
    { label: "All", value: "all" },
    ...apiCategories.map((c) => ({ label: c.category, value: c.category })),
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Filters</h2>
        <button type="button" onClick={onReset} className="text-[11px] font-medium text-primary hover:underline">Reset</button>
      </div>
      <div className="space-y-1.5">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Category</h3>
        <div className="space-y-0.5">
          {allCats.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.label] ?? CATEGORY_ICONS.default;
            return (
              <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] transition-colors ${category === cat.value ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <Icon className="size-3.5 shrink-0" />{cat.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
        <TrendingUp className="mx-auto mb-2 size-6 text-primary" />
        <p className="text-xs font-semibold text-foreground">Advertise Here</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Reach 100K+ monthly visitors.</p>
        <button className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground transition hover:brightness-95">Submit Your Ad</button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VideoAdvertsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [category, debouncedSearch]);

  const { data, isLoading } = useVideoAdverts({
    search: debouncedSearch || undefined,
    category: category === "all" ? undefined : category,
    page,
    page_size: 12,
  });
  const { data: categoriesData } = useVideoCategories();

  const adverts = data?.data ?? [];
  const total = data?.total_items ?? 0;
  const totalPages = data?.total_pages ?? 1;

  const handleReset = () => { setCategory("all"); setSearch(""); setPage(1); };

  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <AdvertsHero />
      </div>

      {/* Search + filter strip */}
      <div className="bg-white border-b border-border/40">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex w-full max-w-[22rem] sm:max-w-md items-center rounded-md bg-white p-1 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-border/50">
              <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search properties, jobs, tenders, companies..."
                className="w-full flex-1 border-0 bg-transparent px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-0" />
              {search && <button onClick={() => setSearch("")} className="mr-2.5"><X className="size-3.5 text-muted-foreground hover:text-foreground" /></button>}
              <button className="group flex shrink-0 items-center gap-1 rounded bg-[#b4fd83] px-3.5 py-1.5 text-xs font-semibold text-[#003B2B] transition-colors hover:bg-[#a3eb72]">
                Search
              </button>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
              {[{ label: "All", value: "all" }, ...(categoriesData ?? []).map((c) => ({ label: c.category, value: c.category }))].slice(0, 8).map((cat) => (
                <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${category === cat.value ? "border-foreground bg-foreground text-white" : "border-border bg-white text-foreground hover:border-foreground/60"}`}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 items-start lg:flex-row">
          <aside className="w-full shrink-0 lg:w-52 sticky top-20 self-start max-h-[calc(100vh-5.5rem)] overflow-y-auto pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <AdvertSidebar category={category} setCategory={setCategory} onReset={handleReset} apiCategories={categoriesData ?? []} />
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-baseline gap-2">
                <h2 className="text-base font-bold text-gray-900">
                  {category === "all" ? "All Video Adverts" : category}
                </h2>
                <span className="text-sm font-medium text-gray-500">{total} found</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  className="flex size-8 items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-30">
                  <ChevronLeft className="size-5 text-gray-400" />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="flex size-8 items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-30">
                  <ChevronRight className="size-5 text-gray-600" />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <AdvertSkeleton key={i} />)}
              </div>
            ) : adverts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-white py-14 text-center">
                <Film className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                <p className="text-sm font-semibold text-foreground">No adverts found</p>
                <button onClick={handleReset} className="mt-4 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Reset Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {adverts.map((advert) => <AdvertCard key={advert.id} advert={advert} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes marquee-adv {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-adv {
          animation: marquee-adv 30s linear infinite;
          width: max-content;
          display: flex;
        }
      `}</style>
    </div>
  );
}
