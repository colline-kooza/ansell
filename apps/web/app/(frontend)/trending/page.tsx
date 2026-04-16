"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Clock, TrendingUp, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";
import {
  useArticles,
  useArticleCategories,
  type Article,
} from "@/hooks/use-articles";
import { getArticleCategoryLabel } from "@/lib/article-utils";
import { Button } from "@/components/ui/button";

function ArticleCard({ article, isFeatured }: { article: Article; isFeatured?: boolean }) {
  const categoryLabel = getArticleCategoryLabel(article.category);
  const date = format(new Date(article.published_at ?? article.created_at), "MMM d, yyyy");
  const authorName =
    `${article.author?.first_name ?? ""} ${article.author?.last_name ?? ""}`.trim() ||
    "Editorial";
  const views = (article as any).views as number | undefined;

  return (
    <Link href={`/news/${article.slug}`}>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="group relative rounded-2xl border border-gray-100 bg-white p-2.5 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-gray-100 sm:p-4"
      >
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Thumbnail */}
          <div
            className={`${isFeatured ? "size-16 sm:h-24 sm:w-36" : "size-14 sm:h-16 sm:w-24"} shrink-0 overflow-hidden rounded-xl border border-border bg-gray-100`}
          >
            {article.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.cover_image_url}
                alt={article.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            ) : null}
          </div>

          {/* Content */}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="w-fit rounded bg-primary/5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
              {categoryLabel}
            </span>
            <h3
              className={`font-bold text-gray-900 transition-colors group-hover:text-primary ${
                isFeatured
                  ? "line-clamp-2 text-[17px] leading-snug sm:text-[18px]"
                  : "line-clamp-2 text-[17px] leading-snug sm:line-clamp-1"
              }`}
            >
              {article.title}
            </h3>
            {isFeatured && article.excerpt && (
              <p className="hidden line-clamp-1 text-[12px] leading-relaxed text-gray-500 sm:block">
                {article.excerpt}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
              <span className="font-semibold text-gray-700">{authorName}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{date}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {article.read_time_minutes} min read
              </span>
              {views != null && views > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Eye size={11} />
                    {views.toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

function ArticleSkeleton({ isFeatured }: { isFeatured?: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-2.5 sm:p-4">
      <div className="flex items-start gap-3 sm:gap-4">
        <Skeleton
          className={`${isFeatured ? "size-16 sm:h-24 sm:w-36" : "size-14 sm:h-16 sm:w-24"} shrink-0 rounded-xl`}
        />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className={isFeatured ? "h-10 w-4/5" : "h-7 w-4/5"} />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}

export default function TrendingPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [page, setPage] = useState(1);

  const categoriesQuery = useArticleCategories();
  const articlesQuery = useArticles({
    category: activeCategory !== "all" ? activeCategory : undefined,
    sort: "latest",
    page,
    page_size: 10,
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

  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      <section className="relative border-b border-border/50 bg-white px-4 py-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,rgba(180,253,131,0.18),transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary shadow-sm"
          >
            <TrendingUp className="size-3" />
            Trending Now
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-2 text-2xl font-bold text-foreground md:text-3xl"
          >
            Latest <span className="text-primary">News</span> &amp; Stories
          </motion.h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stay informed with the latest from South Sudan and beyond.
          </p>
        </div>
      </section>

      <div className="sticky top-0 z-30 border-b border-border/50 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-3 py-2 sm:px-6 lg:px-8 [scrollbar-width:none]">
          {allTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleCategoryChange(tab.value)}
              className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                activeCategory === tab.value
                  ? "border-foreground bg-foreground text-white"
                  : "border-border bg-white text-foreground hover:border-foreground/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="space-y-3">
          {articlesQuery.isLoading ? (
            <>
              <ArticleSkeleton isFeatured />
              {[...Array(4)].map((_, i) => (
                <ArticleSkeleton key={i} />
              ))}
            </>
          ) : articles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white py-14 text-center">
              <TrendingUp className="mx-auto mb-3 size-10 text-muted-foreground/30" />
              <p className="text-sm font-semibold text-foreground">No articles in this category yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Check back later or browse another category.
              </p>
            </div>
          ) : (
            <>
              {featuredArticle && <ArticleCard article={featuredArticle} isFeatured />}
              {restArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </>
          )}

          {!articlesQuery.isLoading && meta.pages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-muted-foreground">
                Page {meta.page} of {meta.pages} • {meta.total} articles
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={meta.page >= meta.pages}
                  onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
