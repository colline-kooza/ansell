"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft, Play, Eye, Calendar, Tag, Building2,
  ExternalLink, AlertCircle, CheckCircle2, Zap,
} from "lucide-react";
import { useVideoAdvert } from "@/hooks/use-video-adverts";
import { format } from "date-fns";

function Skeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-4 py-8">
      <div className="mb-4 h-4 w-28 rounded bg-gray-200" />
      <div className="aspect-video w-full rounded-2xl bg-gray-200 mb-6" />
      <div className="flex gap-4">
        <div className="size-12 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-3/4 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
          <div className="h-24 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <AlertCircle className="mb-4 size-12 text-muted-foreground/30" />
      <h1 className="text-xl font-bold">Advert Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">This video advert has been removed or doesn&apos;t exist.</p>
      <Link href="/video-adverts" className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground">
        Browse Adverts
      </Link>
    </div>
  );
}

export default function VideoAdvertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: advert, isLoading, isError } = useVideoAdvert(id);

  if (isLoading) return <Skeleton />;
  if (isError || !advert) return <NotFound />;

  const thumbnail = advert.thumbnail_url || `https://picsum.photos/seed/adv-${advert.id}/800/450`;
  const companyName = advert.company_name || "Ansell";
  const companyInitial = companyName.charAt(0).toUpperCase();
  const colors = ["bg-blue-500", "bg-purple-500", "bg-teal-500", "bg-amber-500", "bg-rose-500"];
  const logoBg = colors[companyName.length % colors.length];
  const duration = advert.duration_seconds
    ? `${Math.floor(advert.duration_seconds / 60)}:${String(advert.duration_seconds % 60).padStart(2, "0")}`
    : null;

  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/video-adverts" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />Back to Adverts
        </Link>

        {/* Video player area */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-lg mb-5 bg-black"
        >
          {advert.video_url ? (
            <video
              src={advert.video_url}
              poster={thumbnail}
              controls
              className="h-full w-full object-contain"
            />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbnail} alt={advert.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="rounded-full bg-white/90 p-5 shadow-xl">
                  <Play className="size-10 fill-current text-gray-900" />
                </div>
              </div>
            </>
          )}
          {advert.is_featured && (
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
              <Zap className="size-3 fill-current" />Featured
            </div>
          )}
          {duration && (
            <div className="absolute bottom-3 right-3 rounded bg-black/70 px-2 py-0.5 text-xs font-bold text-white">
              {duration}
            </div>
          )}
        </motion.div>

        {/* Info row */}
        <div className="flex items-start gap-4">
          {/* Company logo */}
          <div className={`size-12 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden ${logoBg}`}>
            {advert.company_logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={advert.company_logo} alt={companyName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : companyInitial}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-gray-900">{advert.title}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-semibold text-gray-700">
                <Building2 className="size-3.5" />{companyName}
                <CheckCircle2 className="size-3.5 fill-current text-emerald-500" />
              </span>
              {advert.category && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                  <Tag className="size-3" />{advert.category}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="size-3.5" />{(advert.views ?? 0).toLocaleString()} views
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" />
                {format(new Date(advert.created_at), "dd MMM yyyy")}
              </span>
            </div>

            {/* Description */}
            {advert.description && (
              <div className="mt-4 rounded-2xl border border-border bg-white p-5">
                <h2 className="mb-2 text-sm font-bold text-gray-900">About this Advert</h2>
                <p className="text-sm leading-7 text-gray-700 whitespace-pre-line">{advert.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Advertise CTA */}
        <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="text-sm font-bold text-gray-900">Want to advertise your business like this?</p>
          <p className="mt-1 text-xs text-muted-foreground">Reach thousands of Ansell users with your own video ad.</p>
          <Link
            href="/video-adverts/submit"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground"
          >
            Submit Your Ad <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
