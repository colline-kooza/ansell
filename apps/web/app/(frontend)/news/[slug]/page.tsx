"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  Clock, Share2, MessageCircle, Bookmark, ChevronLeft, 
  ChevronRight, Newspaper, User, Calendar, Tag, ArrowLeft, ArrowRight,
  X, Globe, Link as LinkIcon
} from "lucide-react";
import { useArticle, useArticles } from "@/hooks/use-articles";
import { getArticleCategoryLabel } from "@/lib/article-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Rendering Helpers ──────────────────────────────────────────────────────

function ArticleSkeleton() {
  return (
    <div className="mx-auto max-w-[700px] px-4 py-24 space-y-6 animate-pulse">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="space-y-1.5 slice-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-16" />
          </div>
      </div>
      <Skeleton className="h-[350px] w-full rounded-xl" />
      <div className="space-y-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4 pt-12">
      <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Newspaper className="size-8 text-muted-foreground/30" />
      </div>
      <h1 className="text-xl font-bold text-gray-900">Article Missing</h1>
      <p className="mt-2 text-[13px] text-muted-foreground max-w-sm">
        We couldn't find the article you're looking for. It may have been moved or deleted.
      </p>
      <Link href="/news" className="mt-8">
        <Button variant="default" className="gap-2 px-6 h-9 text-xs font-bold">
            <ArrowLeft className="size-3.5" /> Back to Newsroom
        </Button>
      </Link>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: article, isLoading, isError } = useArticle(slug);
  const { data: relatedQuery } = useArticles({
      category: article?.category,
      page_size: 4
  });
  
  const [copied, setCopied] = useState(false);

  if (isLoading) return <ArticleSkeleton />;
  if (isError || !article) return <NotFound />;

  const categoryLabel = getArticleCategoryLabel(article.category);
  const date = format(new Date(article.published_at ?? article.created_at), "MMM d, yyyy");
  const authorName = `${article.author?.first_name ?? ""} ${article.author?.last_name ?? ""}`.trim() || "Ansell Editorial";

  const handleCopyLink = () => {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
  };

  const relatedArticles = relatedQuery?.data?.filter(a => a.id !== article.id) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Floating Toolbar (Desktop) */}
      <div className="fixed left-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3.5 z-40">
          <button 
            onClick={handleCopyLink}
            className="size-9 rounded-full border border-border bg-white flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm text-gray-400 hover:text-primary"
          >
              <LinkIcon className="size-3.5" />
          </button>
          <button className="size-9 rounded-full border border-border bg-white flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm text-gray-400 hover:text-primary">
              <X className="size-3.5" />
          </button>
          <button className="size-9 rounded-full border border-border bg-white flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm text-gray-400 hover:text-primary">
              <Globe className="size-3.5" />
          </button>
      </div>

      <div className="mx-auto max-w-[1100px] px-4 md:px-8 pt-20 pb-20">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Main Article Content */}
          <article className="flex-1 min-w-0">
            {/* Header */}
            <header className="mb-8">
               <nav className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-5">
                    <Link href="/news" className="hover:text-primary transition-colors">Newsroom</Link>
                    <ChevronRight className="size-2.5" />
                    <span className="font-semibold text-primary/80">{categoryLabel}</span>
                </nav>

                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 leading-tight mb-4">
                    {article.title}
                </h1>

                {article.excerpt && (
                  <p className="text-[13px] border-l-2 border-primary/20 pl-4 py-0.5 text-muted-foreground leading-relaxed mb-5 font-medium italic">
                      {article.excerpt}
                  </p>
                )}

                <div className="flex items-center justify-between gap-4 py-4 border-y border-border/40">
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-slate-50 flex items-center justify-center text-primary font-bold border border-border/50 text-[10px]">
                            {authorName.charAt(0)}
                        </div>
                        <div>
                            <p className="text-[12px] font-bold text-gray-900 leading-none">{authorName}</p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                                <span>{date}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><Clock size={10} /> {article.read_time_minutes} min</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                         <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1.5 font-bold hover:bg-gray-50" onClick={handleCopyLink}>
                            <Share2 className="size-3" /> Share
                         </Button>
                         <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1.5 font-bold hover:bg-gray-50">
                            <Bookmark className="size-3" /> Save
                         </Button>
                    </div>
                </div>
            </header>

            {/* Cover Image */}
            <div className="mb-10">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border/50 bg-slate-50">
                    {article.cover_image_url ? (
                        <img 
                          src={article.cover_image_url} 
                          alt={article.title} 
                          className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center">
                            <Newspaper className="size-12 text-muted-foreground/10" />
                        </div>
                    )}
                </div>
                {Boolean(article.image_caption) && (
                    <p className="mt-2.5 text-[11px] text-center text-muted-foreground italic scale-95 origin-center">
                        {String(article.image_caption)}
                    </p>
                )}
            </div>

            {/* Content Body */}
            <div className="max-w-[700px] mx-auto">
                <div 
                  className="prose prose-sm prose-slate max-w-none 
                    prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-gray-900
                    prose-p:text-[13px] md:prose-p:text-[13.5px] prose-p:leading-relaxed prose-p:text-gray-600
                    prose-a:text-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-gray-900 prose-strong:font-bold
                    prose-blockquote:border-l-2 prose-blockquote:border-primary/40 prose-blockquote:bg-slate-50/50 prose-blockquote:px-4 prose-blockquote:py-0.5 prose-blockquote:rounded-r-lg prose-blockquote:italic
                    prose-img:rounded-lg prose-img:border prose-img:border-border/40
                  "
                  dangerouslySetInnerHTML={{ __html: article.content || "" }}
                />

                {/* Tags or Meta footer */}
                <div className="mt-12 pt-8 border-t border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex flex-wrap gap-1.5">
                        {typeof article.tags === 'string' && article.tags ? article.tags.split(',').map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="px-2 py-0.5 text-[10px] font-bold bg-slate-50 text-slate-500 hover:bg-slate-100 border-none shadow-none">
                                #{tag.trim()}
                            </Badge>
                        )) : (
                            <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-bold bg-primary/5 text-primary border-none shadow-none">
                                #News
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Author Bio Section */}
                <div className="mt-10 p-6 rounded-2xl bg-slate-50/50 border border-border/40 flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
                    <div className="size-14 rounded-xl bg-white shadow-sm border border-border/40 flex items-center justify-center text-lg font-bold text-primary shrink-0 opacity-80">
                        {authorName.charAt(0)}
                    </div>
                    <div>
                        <h4 className="text-[14px] font-bold text-gray-800 mb-1.5">Written by {authorName}</h4>
                        <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
                            Reporting on development, public policy, and corporate governance. Committed to providing verified stories for the community.
                        </p>
                        <div className="flex items-center justify-center sm:justify-start gap-4">
                             <Link href="/news" className="text-[11px] font-bold text-primary hover:underline">All posts</Link>
                             <Separator orientation="vertical" className="h-2.5" />
                             <Link href="#" className="text-[11px] font-bold text-primary hover:underline">Follow</Link>
                        </div>
                    </div>
                </div>
            </div>
          </article>

          {/* Sidebar (Desktop) */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-10">
               {/* Relevant News */}
               <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-5 pl-2 border-l-2 border-primary/40">
                    Latest in category
                  </h3>
                  <div className="space-y-5">
                      {relatedArticles.length > 0 ? relatedArticles.map((rel) => (
                          <Link key={rel.id} href={`/news/${rel.slug}`} className="group block">
                              <div className="flex gap-4">
                                  <div className="size-14 rounded-lg overflow-hidden shrink-0 border border-border/40 bg-slate-50">
                                      <img src={rel.cover_image_url || "/placeholder.png"} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                  </div>
                                  <div className="min-w-0">
                                      <h4 className="text-[12px] font-bold text-gray-700 leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-0.5 font-sans">
                                          {rel.title}
                                      </h4>
                                      <p className="text-[10px] text-muted-foreground">
                                          {format(new Date(rel.published_at ?? rel.created_at), "MMM d")}
                                      </p>
                                  </div>
                              </div>
                          </Link>
                      )) : (
                          <div className="text-[12px] text-muted-foreground italic px-2">No related articles.</div>
                      )}
                  </div>
               </div>

               {/* Ansell Spotlight / AD */}
               <div className="rounded-2xl bg-slate-900 px-6 py-8 text-white relative overflow-hidden group shadow-lg">
                   <div className="absolute top-0 right-0 size-24 bg-primary/20 blur-3xl -mr-12 -mt-12" />
                   <Badge variant="outline" className="text-[8px] border-white/10 text-white/40 mb-3 px-1.5 tracking-widest font-bold">INFO</Badge>
                   <h3 className="text-base font-bold mb-2">Build your presence on Ansell.</h3>
                   <p className="text-[10px] text-gray-400 leading-relaxed mb-5">
                       Register your company to list jobs, tenders, and reach thousands of users.
                   </p>
                   <Link href="/become-company" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:gap-2 transition-all">
                       Get Started <ArrowRight className="size-3" />
                   </Link>
               </div>

               <Link href="/news" className="block">
                  <Button variant="outline" className="w-full h-10 rounded-xl gap-2 font-bold text-[11px] border-border/60 hover:bg-slate-50 text-slate-500">
                      <ArrowLeft className="size-3.5" /> Newsroom
                  </Button>
               </Link>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
