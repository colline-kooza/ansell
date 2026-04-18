"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { format } from "date-fns";
import { ArrowUp, ChevronRight, Clock, Newspaper, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useArticles,
  useArticleCategories,
  type Article,
} from "@/hooks/use-articles";
import { getArticleCategoryLabel } from "@/lib/article-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ─── Article Card ─────────────────────────────────────────────────────────────

function ArticleCard({ article, isFeatured }: { article: Article; isFeatured?: boolean }) {
  const categoryLabel = getArticleCategoryLabel(article.category);
  const date = format(new Date(article.published_at ?? article.created_at), "MMM d, yyyy");
  const authorName =
    `${article.author?.first_name ?? ""} ${article.author?.last_name ?? ""}`.trim() ||
    "Editorial";

  return (
    <Link href={`/news/${article.slug}`}>
      <article className="group flex gap-5 px-4 py-5 transition-colors hover:bg-gray-50/70">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-1.5 py-0.5 bg-primary/5 rounded">
              {categoryLabel}
            </span>
          </div>
          <h3
            className={`${
              isFeatured ? "text-[20px] leading-tight" : "text-[15px] leading-snug"
            } font-bold text-gray-900 group-hover:text-primary transition-colors`}
          >
            {article.title}
          </h3>
          {(isFeatured || article.excerpt) && (
            <p className={`line-clamp-2 text-[13px] leading-relaxed text-muted-foreground ${isFeatured ? "block" : "hidden sm:block"}`}>
              {article.excerpt}
            </p>
          )}
          <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground mt-1">
            <span className="font-semibold text-gray-700">{authorName}</span>
            <span>•</span>
            <span>{date}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {article.read_time_minutes} min read
            </span>
          </div>
        </div>

        <div className={`${isFeatured ? "h-40 w-60" : "h-20 w-32"} shrink-0 overflow-hidden rounded-xl border border-border shadow-sm`}>
          {article.cover_image_url ? (
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
             <div className="w-full h-full bg-muted flex items-center justify-center">
                 <Newspaper className="size-6 text-muted-foreground/40" />
             </div>
          )}
        </div>
      </article>
    </Link>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ArticleSkeleton({ isFeatured }: { isFeatured?: boolean }) {
  return (
    <div className="flex gap-5 px-4 py-5">
      <div className="flex flex-1 flex-col gap-2.5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className={isFeatured ? "h-14 w-4/5" : "h-10 w-4/5"} />
        <Skeleton className="h-4 w-1/3 mt-2" />
      </div>
      <Skeleton className={`${isFeatured ? "h-40 w-60" : "h-20 w-32"} shrink-0 rounded-xl`} />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function NewsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [activeCategory, setActiveCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  const categoriesQuery = useArticleCategories();
  const articlesQuery = useArticles({
    category: activeCategory !== "all" ? activeCategory : undefined,
    search: search || undefined, // use search in API if possible, else local
    sort: "latest",
    page,
    page_size: 10,
  });

  const categories = categoriesQuery.data ?? [];
  const articles = articlesQuery.data?.data ?? [];
  const meta = articlesQuery.data?.meta ?? { page: 1, pages: 1, total: 0 };
  
  // Filtering locally for search (simple)
  const filteredArticles = search 
    ? articles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()))
    : articles;

  const [featuredArticle, ...restArticles] = filteredArticles;

  const allTabs = [
    { value: "all", label: "All News" },
    ...categories.map((c) => ({ value: c.category, label: c.label })),
  ];

  function handleCategoryChange(value: string) {
    setActiveCategory(value);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 lg:px-8 sm:pt-20 pt-16">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
                <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                    <Link href="/" className="hover:text-foreground">Home</Link>
                    <ChevronRight className="size-3" />
                    <span className="text-foreground font-medium">News</span>
                </nav>
                <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                    Anasell <span className="text-primary italic">News</span>
                </h1>
                <p className="mt-2 text-[13px] text-muted-foreground max-w-md">
                    Stay updated with the latest headlines, government announcements, and local stories from across South Sudan.
                </p>
            </div>
            
            <div className="relative w-full max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Search articles..." 
                  className="pl-9 h-9 text-xs shadow-none border-border/60 bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Left Sidebar: Navigation ── */}
          <aside className="hidden w-48 shrink-0 lg:block">
            <div className="sticky top-28 space-y-6">
                <div>
                    <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                        Top Categories
                    </h2>
                    <div className="space-y-1">
                        {allTabs.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => handleCategoryChange(tab.value)}
                            className={`w-full group flex items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] transition-all ${
                            activeCategory === tab.value
                                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                                : "text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent hover:border-border"
                            }`}
                        >
                            {tab.label}
                            {activeCategory !== tab.value && (
                                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </button>
                        ))}
                    </div>
                </div>
                
                <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-5 border border-primary/10">
                    <h3 className="text-sm font-bold text-primary mb-2">Editor's Choice</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
                        Hand-picked stories and deep dives from our editorial team.
                    </p>
                    <Link href="/news?featured=true" className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
                        Browse Featured <ArrowUp className="size-2.5 rotate-45" />
                    </Link>
                </div>
            </div>
          </aside>

          {/* ── Main Feed ── */}
          <main className="min-w-0 flex-1">
            {/* Mobile Category chips */}
            <div className="mb-6 flex overflow-x-auto pb-2 lg:hidden gap-2 scrollbar-none">
              {allTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleCategoryChange(tab.value)}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-[12px] font-medium transition-colors ${
                    activeCategory === tab.value
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Container */}
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              {articlesQuery.isLoading ? (
                <div className="divide-y divide-border/50">
                  <ArticleSkeleton isFeatured />
                  {[...Array(4)].map((_, i) => <ArticleSkeleton key={i} />)}
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Search className="size-8 text-muted-foreground/40" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">No articles found</h3>
                  <p className="mt-1 text-sm text-muted-foreground max-w-xs mx-auto">
                    We couldn't find any articles matching your search or category choice.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-6 text-xs h-9" 
                    onClick={() => { setActiveCategory("all"); setSearch(""); }}
                  >
                      Clear filters
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {featuredArticle && (
                    <ArticleCard article={featuredArticle} isFeatured />
                  )}
                  {restArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!articlesQuery.isLoading && meta.pages > 1 && !search && (
                <div className="flex items-center justify-between border-t border-border/50 bg-gray-50/30 px-6 py-4">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Page <span className="text-foreground">{meta.page}</span> of {meta.pages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={meta.page <= 1}
                      onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="rounded-lg border border-border bg-white h-8 px-3 text-[11px] font-bold text-gray-600 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={meta.page >= meta.pages}
                      onClick={() => { setPage((p) => Math.min(meta.pages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="rounded-lg border border-border bg-white h-8 px-3 text-[11px] font-bold text-gray-600 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* ── Right Sidebar ── */}
          <aside className="hidden w-64 shrink-0 xl:block">
            <div className="sticky top-28 space-y-8">
              
              {/* Top Stories / Trending now */}
              <div>
                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                    Trending Now
                </h3>
                <div className="space-y-4">
                    {articles.slice(0, 3).map((a, idx) => (
                        <Link key={a.id} href={`/news/${a.slug}`} className="group block">
                            <div className="flex gap-3">
                                <span className="text-xl font-black text-gray-100 group-hover:text-primary/20 transition-colors">0{idx + 1}</span>
                                <div>
                                    <h4 className="text-[13px] font-bold text-gray-800 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                                        {a.title}
                                    </h4>
                                    <p className="text-[10px] text-muted-foreground mt-1">{getArticleCategoryLabel(a.category)}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
              </div>

              {/* Newsletter or CTA */}
              <div className="rounded-2xl border border-border p-5 bg-white">
                <p className="text-[13px] font-bold text-gray-900 mb-1">Stay Informed</p>
                <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
                    Get regular updates on the most important stories directly in your inbox.
                </p>
                <div className="space-y-2">
                    <Input placeholder="name@email.com" className="h-9 text-[11px] shadow-none bg-gray-50/50" />
                    <Button className="w-full h-9 text-[11px] font-bold shadow-none">Subscribe</Button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center justify-center w-full gap-2 rounded-xl border border-border bg-white py-2 text-[11px] font-bold text-gray-500 transition-all hover:bg-gray-50"
              >
                <ArrowUp size={12} />
                Back to top
              </button>

            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4f8fb] flex items-center justify-center"><Newspaper className="size-6 animate-pulse text-primary" /></div>}>
      <NewsContent />
    </Suspense>
  );
}
