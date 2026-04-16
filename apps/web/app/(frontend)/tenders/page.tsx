"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Building2,
  MapPin,
  Calendar,
  Tag,
  Clock,
  Zap,
  FileText,
  Eye,
} from "lucide-react";
import { CompanyRegisterBanner } from "@/components/shared/company-register-banner";
import { Button } from "@/components/ui/button";
import { useTenders, type Tender } from "@/hooks/use-tenders";
import { format, isPast } from "date-fns";

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isPast(d)) return 0;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

function urgencyColor(days: number | null) {
  if (days === null) return "";
  if (days <= 3) return "bg-red-50 text-red-600";
  if (days <= 7) return "bg-amber-50 text-amber-600";
  return "bg-emerald-50 text-emerald-700";
}

function TenderCard({ tender, index }: { tender: Tender; index: number }) {
  const [imgError, setImgError] = useState(false);
  const days = daysUntil(tender.submission_deadline);
  const urgencyClass = urgencyColor(days);
  const companyName = tender.issuing_organisation || "Ansell";
  const initial = companyName.charAt(0).toUpperCase();

  let logoSrc = tender.company?.logo_url || tender.issuing_organisation_logo;
  if (!logoSrc && !imgError && companyName !== "Ansell") {
    const domain = companyName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() + ".com";
    logoSrc = `https://logo.clearbit.com/${domain}`;
  }

  const colors = ["bg-blue-500", "bg-purple-500", "bg-teal-500", "bg-amber-500", "bg-rose-500"];
  const logoBg =
    !logoSrc || imgError
      ? colors[companyName.length % colors.length]
      : "border border-gray-100 bg-white";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      className="group relative rounded-2xl border border-gray-100 bg-white p-3 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-gray-100 sm:p-5"
    >
      <Link href={`/tenders/${tender.id}`} className="absolute inset-0 z-10" aria-label={tender.title} />

      <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-4">
          <div
            className={`relative z-20 flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-lg font-bold text-white sm:size-12 ${logoBg}`}
          >
            {logoSrc && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoSrc}
                alt={companyName}
                onError={() => setImgError(true)}
                className="h-full w-full rounded-xl bg-white p-1.5 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              initial
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-start gap-1.5">
              <h3 className="line-clamp-2 text-[15px] font-bold text-gray-900 transition-colors group-hover:text-primary sm:line-clamp-1 sm:text-base">
                {tender.title}
              </h3>
              {tender.is_featured && (
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary">
                  Featured
                </span>
              )}
            </div>

            <p className="mb-1.5 text-xs leading-4 text-gray-500 sm:mb-2 sm:text-sm">
              by <span className="font-semibold text-gray-800">{companyName}</span>
              {tender.reference_number && (
                <span className="ml-2 text-[9px] text-gray-400 sm:text-xs">• Ref: {tender.reference_number}</span>
              )}
            </p>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[9px] sm:gap-x-3 sm:gap-y-2 sm:text-xs">
              {tender.category && (
                <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-medium text-blue-700">
                  <Tag className="size-3" />
                  {tender.category}
                </span>
              )}
              {tender.tender_type && (
                <span className="flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 font-medium text-purple-700">
                  <FileText className="size-3" />
                  {tender.tender_type}
                </span>
              )}
              {tender.city && (
                <span className="flex items-center gap-1 text-gray-500">
                  <MapPin className="size-3" />
                  {tender.city}
                </span>
              )}
              {tender.value_estimate && (
                <span className="font-semibold text-gray-800">
                  {tender.value_currency ?? "USD"} {Number(tender.value_estimate).toLocaleString()}
                </span>
              )}
              {(tender.views ?? 0) > 0 && (
                <span className="hidden items-center gap-1 text-gray-400 sm:flex">
                  <Eye className="size-3" />
                  {tender.views.toLocaleString()} views
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-1.5 border-t border-gray-100 pt-2 sm:pt-3 md:w-auto md:flex-col md:items-end md:justify-start md:border-t-0 md:pt-0">
          {days !== null ? (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${urgencyClass}`}>
              <Clock className="size-2.5" />
              {days === 0 ? "Closed" : `${days}d left`}
            </span>
          ) : null}
          {tender.submission_deadline && (
            <p className="flex items-center gap-1 text-[10px] text-gray-400">
              <Calendar className="size-2.5" />
              {format(new Date(tender.submission_deadline), "dd MMM")}
            </p>
          )}
          <p className="text-[10px] text-gray-400">{tender.bid_count} bids</p>
        </div>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
      <div className="flex gap-3 sm:gap-4">
        <div className="size-11 shrink-0 rounded-xl bg-gray-200 sm:size-12" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-gray-200" />
          <div className="h-3 w-1/2 rounded bg-gray-200" />
          <div className="mt-3 flex gap-2">
            <div className="h-5 w-20 rounded-full bg-gray-200" />
            <div className="h-5 w-24 rounded-full bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TendersContent() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useTenders({
    status: "active",
    page,
    page_size: 15,
  });

  const tenders = data?.data ?? [];
  const total = data?.total_items ?? 0;
  const totalPages = data?.total_pages ?? 1;

  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      <section className="border-b border-border/50 bg-white px-4 py-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,rgba(180,253,131,0.18),transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary shadow-sm"
          >
            <Zap className="size-3 fill-primary" />
            South Sudan Procurement Hub
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-2 text-2xl font-bold text-foreground md:text-3xl"
          >
            Open <span className="text-primary">Tenders</span> &amp; Bids
          </motion.h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <strong className="text-foreground">{total}</strong> active tenders available
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : tenders.length > 0
              ? tenders.map((tender, i) => <TenderCard key={tender.id} tender={tender} index={i} />)
              : (
                <div className="rounded-xl border border-dashed border-border bg-white py-14 text-center">
                  <Building2 className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                  <p className="text-sm font-semibold text-foreground">No active tenders at the moment</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Check back soon for new procurement opportunities.
                  </p>
                </div>
              )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="mt-10">
          <CompanyRegisterBanner />
        </div>
      </div>
    </div>
  );
}

export default function TendersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f4f8fb]">
          <Zap className="size-6 animate-pulse text-primary" />
        </div>
      }
    >
      <TendersContent />
    </Suspense>
  );
}
