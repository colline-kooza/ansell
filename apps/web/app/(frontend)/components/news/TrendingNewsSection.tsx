"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Newspaper } from "lucide-react";
import { useArticles } from "@/hooks/use-articles";
import { formatDistanceToNow } from "date-fns";

function NewsSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white animate-pulse">
      <div className="aspect-[16/9] w-full bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-16 rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-4 w-3/4 rounded bg-gray-100" />
        <div className="h-2.5 w-20 rounded bg-gray-100" />
      </div>
    </div>
  );
}

export function TrendingNewsSection() {
  const { data, isLoading } = useArticles({ sort: "latest", page_size: 3 });
  const articles = data?.data ?? [];

  return (
    <section className="py-8 sm:py-16">
      <div className="mx-auto max-w-6xl px-3 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Latest News
            </p>
            <h2 className="mt-1.5 text-[1.5rem] font-semibold tracking-[-0.05em] text-foreground sm:text-[1.8rem]">
              Trending in South Sudan
            </h2>
          </div>
          <Link
            href="/news"
            className="hidden items-center gap-1.5 text-sm font-medium text-primary hover:underline sm:flex"
          >
            View all news
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <NewsSkeleton key={i} />)
            : articles.length === 0
            ? (
              <div className="col-span-3 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-12 text-center">
                <Newspaper className="mb-3 size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No articles available yet.</p>
              </div>
            )
            : articles.map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.slug}`}
                className="group overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={article.cover_image_url || `https://picsum.photos/seed/${article.id}/640/400`}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(min-width: 768px) 33vw, 100vw"
                  />
                  <div className="absolute left-3 top-3">
                    <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-primary-foreground capitalize">
                      {article.category}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                    {article.title}
                  </h3>
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {article.read_time_minutes > 0
                      ? `${article.read_time_minutes} min read`
                      : article.published_at
                      ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
                      : "Recently"}
                  </div>
                </div>
              </Link>
            ))}
        </div>

        <div className="mt-6 sm:hidden">
          <Link href="/news" className="text-sm font-medium text-primary hover:underline">
            View all news →
          </Link>
        </div>
      </div>
    </section>
  );
}
