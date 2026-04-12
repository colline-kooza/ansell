"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowUp, ChevronRight, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useArticles,
  useArticleCategories,
  type Article,
} from "@/hooks/use-articles";
import { getArticleCategoryLabel } from "@/lib/article-utils";

// ─── Article Card ─────────────────────────────────────────────────────────────

function ArticleCard({ article, isFeatured }: { article: Article; isFeatured?: boolean }) {
  const categoryLabel = getArticleCategoryLabel(article.category);
  const date = format(new Date(article.published_at ?? article.created_at), "MMM d, yyyy");
  const authorName =
    `${article.author?.first_name ?? ""} ${article.author?.last_name ?? ""}`.trim() ||
    "Editorial";

  return (
    <Link href={`/news/${article.slug}`}>
      <article className="group flex gap-4 px-4 py-4 transition-colors hover:bg-gray-50/70">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
            {categoryLabel}
          </span>
          <h3
            className={`${
              isFeatured ? "text-[18px] leading-snug" : "text-[14px] leading-snug"
            } font-semibold text-gray-900 group-hover:text-gray-700`}
          >
            {article.title}
          </h3>
          {isFeatured && article.excerpt ? (
            <p className="line-clamp-2 text-[13px] leading-relaxed text-gray-500">
              {article.excerpt}
            </p>
          ) : null}
          <div className="flex items-center gap-2 text-[12px] text-gray-400">
            <span className="font-medium text-gray-500">{authorName}</span>
            <span>·</span>
            <span>{date}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock size={11} className="shrink-0" />
              {article.read_time_minutes} min
            </span>
          </div>
        </div>

        <div className={`${isFeatured ? "h-36 w-52" : "h-20 w-28"} shrink-0 overflow-hidden rounded-md bg-gray-100`}>
          {article.cover_image_url ? (
            <img
              src={article.cover_image_url}
              alt={article.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : null}
        </div>
      </article>
    </Link>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ArticleSkeleton({ isFeatured }: { isFeatured?: boolean }) {
  return (
    <div className="flex gap-4 px-4 py-4">
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className={isFeatured ? "h-12 w-4/5" : "h-8 w-4/5"} />
        {isFeatured ? <Skeleton className="h-3.5 w-full" /> : null}
        <Skeleton className="h-2.5 w-1/3" />
      </div>
      <Skeleton className={`${isFeatured ? "h-36 w-52" : "h-20 w-28"} shrink-0 rounded-md`} />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TrendingPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [page, setPage] = useState(1);

  const categoriesQuery = useArticleCategories();
  const articlesQuery = useArticles({
    category: activeCategory !== "all" ? activeCategory : undefined,
    sort: "latest",
    page,
    page_size: 8,
  });

  const categories = categoriesQuery.data ?? [];
  const articles = articlesQuery.data?.data ?? [];
  const meta = articlesQuery.data?.meta ?? { page: 1, pages: 1, total: 0 };
  const [featuredArticle, ...restArticles] = articles;

  const allTabs = [
    { value: "all", label: "All" },
    ...categories.map((c) => ({ value: c.category, label: c.label })),
  ];

  function handleCategoryChange(value: string) {
    setActiveCategory(value);
    setPage(1);
  }

  const sectionTitle =
    activeCategory === "all" ? "Trending" : getArticleCategoryLabel(activeCategory);

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-7">

          {/* ── Left sidebar ── */}
          <aside className="hidden w-40 shrink-0 lg:block">
            <nav className="sticky top-24">
              <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Categories
              </p>
              <div className="space-y-px">
                {allTabs.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => handleCategoryChange(tab.value)}
                    className={`w-full rounded px-2 py-1.5 text-left text-[13px] transition-colors ${
                      activeCategory === tab.value
                        ? "bg-white font-medium text-gray-900 ring-1 ring-gray-200"
                        : "font-normal text-gray-500 hover:bg-white/60 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </nav>
          </aside>

          {/* ── Main feed ── */}
          <main className="min-w-0 flex-1">
            <div className="mb-5">
              <p className="mb-0.5 text-[11px] font-medium uppercase tracking-widest text-gray-400">
                Feed
              </p>
              <h1 className="text-[20px] font-semibold tracking-tight text-gray-900">
                {sectionTitle}
              </h1>
            </div>

            {/* Category chips */}
            <div className="mb-4 flex flex-wrap gap-1.5">
              {allTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleCategoryChange(tab.value)}
                  className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
                    activeCategory === tab.value
                      ? "border-gray-800 bg-gray-800 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Article container — single card with dividers */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              {articlesQuery.isLoading ? (
                <div className="divide-y divide-gray-100">
                  <ArticleSkeleton isFeatured />
                  <ArticleSkeleton />
                  <ArticleSkeleton />
                  <ArticleSkeleton />
                </div>
              ) : articles.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <p className="text-sm font-medium text-gray-600">
                    No articles in this category yet.
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Check back later or browse another category.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {featuredArticle ? (
                    <ArticleCard article={featuredArticle} isFeatured />
                  ) : null}
                  {restArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!articlesQuery.isLoading && meta.pages > 1 ? (
                <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                  <span className="text-xs text-gray-400">
                    Page {meta.page} of {meta.pages} · {meta.total} articles
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={meta.page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded border border-gray-200 bg-white px-3 py-1 text-[12px] text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={meta.page >= meta.pages}
                      onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                      className="rounded border border-gray-200 bg-white px-3 py-1 text-[12px] text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </main>

          {/* ── Right sidebar ── */}
          <aside className="hidden w-48 shrink-0 xl:block">
            <div className="sticky top-24 flex flex-col gap-5">

              <div>
                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Browse
                </p>
                <div className="space-y-px">
                  {allTabs.slice(0, 8).map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => handleCategoryChange(tab.value)}
                      className={`w-full rounded px-2 py-1.5 text-left text-[13px] transition-colors ${
                        activeCategory === tab.value
                          ? "font-medium text-gray-900"
                          : "font-normal text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="divide-y divide-gray-100">
                  <Link
                    href="/news"
                    className="group flex items-center justify-between px-3 py-2.5 text-[12px] text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                  >
                    All articles
                    <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500" />
                  </Link>
                  <Link
                    href="/news?sort=popular"
                    className="group flex items-center justify-between px-3 py-2.5 text-[12px] text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                  >
                    Most popular
                    <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500" />
                  </Link>
                  <Link
                    href="/news?featured=true"
                    className="group flex items-center justify-between px-3 py-2.5 text-[12px] text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                  >
                    Featured stories
                    <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500" />
                  </Link>
                </div>
              </div>

              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
              >
                Back to top
                <ArrowUp size={13} className="text-gray-400" />
              </button>

            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
