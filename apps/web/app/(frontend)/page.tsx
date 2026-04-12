"use client";

import { ArrowRight, Package, Search, TrendingUp, Users, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BusinessSolutionsSection } from "./components/business-solutions/BusinessSolutionsSection";
import { SolutionsSection } from "./components/solutions/SolutionsSection";
import { IndustriesSection } from "./components/industries/IndustriesSection";
import { IndustriesShowcaseSection } from "./components/industries/IndustriesShowcaseSection";
import { TrendingNewsSection } from "./components/news/TrendingNewsSection";
import { JobListingsSection } from "./components/jobs/JobListingsSection";
import { FeaturedCompaniesSection } from "./components/companies/FeaturedCompaniesSection";

const SEARCH_CATEGORIES = [
  { label: "Properties", value: "properties", href: "/real-estate" },
  { label: "Jobs", value: "jobs", href: "/job-board" },
  { label: "Tenders", value: "tenders", href: "/tenders" },
  { label: "Companies", value: "companies", href: "/companies" },
  { label: "Courses", value: "courses", href: "/courses" },
  { label: "News", value: "news", href: "/news" },
] as const;

type SearchCategory = (typeof SEARCH_CATEGORIES)[number]["value"];

const features = [
  { icon: Package, label: "Real Estate & Property", href: "/real-estate" },
  { icon: Users, label: "Jobs & Careers", href: "/job-board" },
  { icon: TrendingUp, label: "Public Tenders", href: "/tenders" },
  { icon: Zap, label: "Courses & Training", href: "/courses" },
] as const;

const heroWords = [
  "real estate.",
  "job board.",
  "tenders.",
  "digital hub.",
] as const;

export default function FrontendHomePage() {
  const [activeWord, setActiveWord] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<SearchCategory>("jobs");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveWord((current) => (current + 1) % heroWords.length);
    }, 2400);
    return () => window.clearInterval(interval);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const cat = SEARCH_CATEGORIES.find((c) => c.value === searchCategory);
    const base = cat?.href ?? "/job-board";
    const q = searchQuery.trim();
    router.push(q ? `${base}?search=${encodeURIComponent(q)}` : base);
  }

  return (
    <>
      <section className="relative flex min-h-[60svh] flex-col items-center justify-center overflow-hidden px-3 py-6 sm:px-6">
        {/* Background layers */}
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(180,253,131,0.18),transparent_70%)]" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(16,33,15,0.07) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(180,253,131,0.55),transparent_70%)]" />
        <div className="absolute -z-10 left-1/4 top-1/3 h-80 w-80 rounded-full bg-primary/12 blur-[6rem]" />
        <div className="absolute -z-10 right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-emerald-200/30 blur-[5rem]" />

        {/* Content */}
        <div className="flex w-full max-w-4xl flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/75 px-3 py-1.5 shadow-sm backdrop-blur-sm sm:px-4 sm:py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-[10px]">
              ANASELL — South Sudan Digital Hub — now live
            </span>
          </div>

          {/* Headline */}
          <h1 className="mt-5 w-full text-[1.65rem] font-semibold leading-[0.98] tracking-[-0.055em] text-foreground sm:mt-6 sm:text-[2.55rem] lg:text-[3rem]">
            South Sudan&apos;s one-stop hub for{" "}
            <span className="relative inline-flex min-w-[10ch] items-end justify-center px-2 align-bottom sm:min-w-[12ch]">
              <span aria-hidden className="invisible whitespace-nowrap">
                marketplace.
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={heroWords[activeWord]}
                  initial={{ y: "110%", opacity: 0, filter: "blur(8px)" }}
                  animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: "-110%", opacity: 0, filter: "blur(8px)" }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 z-10 flex items-end justify-center whitespace-nowrap text-primary"
                >
                  {heroWords[activeWord]}
                </motion.span>
              </AnimatePresence>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-1 -z-10 h-[0.22em] rounded-sm bg-primary/20"
              />
            </span>
          </h1>

          {/* Description */}
          <p className="mt-3 max-w-2xl text-[0.8rem] leading-[1.7] text-muted-foreground sm:mt-4 sm:text-[0.88rem]">
            Browse property listings, job openings, government tenders, training courses, verified companies, and the latest business news — all built for South Sudan.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="mt-7 flex w-full max-w-2xl flex-col gap-0 border border-border/40 bg-white shadow-sm sm:mt-9 sm:flex-row sm:items-stretch rounded-sm overflow-hidden"
          >
            {/* Category selector */}
            <div className="shrink-0 border-b border-border/40 sm:border-b-0 sm:border-r">
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value as SearchCategory)}
                className="h-full w-full bg-secondary/40 px-3 py-2.5 text-[0.78rem] font-medium text-foreground outline-none cursor-pointer sm:w-32 sm:px-4 sm:py-0"
              >
                {SEARCH_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Input */}
            <label className="flex flex-1 items-center gap-3 bg-secondary/40 px-4 py-3 sm:py-3.5">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${searchCategory}...`}
                className="w-full bg-transparent text-[0.85rem] text-foreground placeholder:text-muted-foreground/55 outline-none"
              />
            </label>

            {/* Submit */}
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 bg-primary px-6 py-3 text-[0.82rem] font-semibold text-primary-foreground transition hover:brightness-95 active:scale-[0.98] sm:py-0 sm:px-7"
            >
              Search
              <ArrowRight className="size-3.5" />
            </button>
          </form>

          {/* Feature pills */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {features.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-white/80 px-3 py-1.5 text-[11px] font-medium text-foreground shadow-sm backdrop-blur-sm hover:border-primary/40 hover:bg-white transition-colors"
              >
                <Icon className="size-3 text-primary" />
                {label}
              </a>
            ))}
          </div>

          {/* Divider + Stats */}
          <div className="mt-8 flex w-full max-w-sm items-center gap-4 sm:mt-12">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 sm:text-[10px]">
              trusted by businesses across South Sudan
            </span>
            <div className="h-px flex-1 bg-border/60" />
          </div>
          <div className="mt-4 grid w-full max-w-lg grid-cols-3 gap-2 sm:mt-6 sm:gap-4">
            {[
              { value: "1,247", label: "Active listings" },
              { value: "3,892", label: "Registered users" },
              { value: "23", label: "Live tenders" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-0.5">
                <span className="text-[1.5rem] font-semibold tracking-[-0.05em] text-foreground sm:text-[1.9rem]">
                  {s.value}
                </span>
                <span className="text-[10px] leading-4 text-muted-foreground sm:text-[11px]">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BusinessSolutionsSection />
      <FeaturedCompaniesSection />
      <JobListingsSection />
      <SolutionsSection />
      <IndustriesSection />
      <IndustriesShowcaseSection />
      <TrendingNewsSection />
    </>
  );
}
