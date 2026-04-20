"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft, Building2, Calendar, MapPin, Tag, FileText,
  Clock, Phone, Mail, User, Download, ExternalLink,
  CheckCircle2, AlertCircle, Info, Bookmark, Share2,
  ChevronRight, Globe, Zap,
} from "lucide-react";
import { useTender } from "@/hooks/use-tenders";
import { format, isPast } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isPast(d)) return 0;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-4 py-8">
      <div className="mb-5 h-4 w-32 rounded bg-gray-200" />
      <div className="h-64 w-full rounded-xl bg-gray-200 mb-5" />
      <div className="flex gap-5">
        <div className="flex-1 space-y-4">
          <div className="h-8 w-3/4 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
          <div className="h-32 w-full rounded bg-gray-200" />
        </div>
        <div className="w-72 hidden lg:block">
          <div className="h-80 rounded-xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <AlertCircle className="mb-3 size-12 text-muted-foreground/30" />
      <h1 className="text-xl font-semibold">Tender Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">This tender doesn&apos;t exist or has been removed.</p>
      <Link href="/tenders" className="mt-5 rounded bg-primary px-6 py-2 text-sm font-medium text-primary-foreground">
        Browse Tenders
      </Link>
    </div>
  );
}

function InfoBadge({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="size-3.5 text-primary" />
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-[13px] font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function TenderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: tender, isLoading, isError } = useTender(id);
  const [saved, setSaved] = useState(false);

  if (isLoading) return <Skeleton />;
  if (isError || !tender) return <NotFound />;

  const days = daysUntil(tender.submission_deadline);
  const isClosed = days === 0 || tender.status === "closed";
  const companyName = tender.issuing_organisation || "Anasell";
  const initial = companyName.charAt(0).toUpperCase();
  const colors = ["bg-blue-500", "bg-purple-500", "bg-teal-500", "bg-amber-500", "bg-rose-500"];
  const logoBg = colors[companyName.length % colors.length];

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="size-3" />
          <Link href="/tenders" className="hover:text-foreground transition-colors">Tenders</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground truncate max-w-[150px] sm:max-w-[300px]">{tender.title}</span>
        </nav>

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-white p-4 sm:p-5 mb-5 shadow-sm"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className={`size-16 rounded-xl flex items-center justify-center text-white font-semibold text-2xl shrink-0 ${logoBg}`}>
              {tender.company?.logo_url || tender.issuing_organisation_logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tender.company?.logo_url || tender.issuing_organisation_logo}
                  alt={companyName}
                  className="h-full w-full rounded-xl object-contain bg-white p-1.5"
                />
              ) : initial}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {tender.is_featured && (
                  <Badge variant="secondary" className="inline-flex flex-row items-center gap-1 bg-primary/10 px-1.5 py-0 border-transparent text-[10px] font-medium text-primary">
                    <Zap className="size-2.5 fill-current" />Featured
                  </Badge>
                )}
                {tender.status && (
                  <Badge variant="secondary" className={`px-1.5 py-0 border-transparent text-[10px] font-medium capitalize ${
                    tender.status === "active" ? "bg-emerald-50 text-emerald-700" :
                    tender.status === "closed" ? "bg-red-50 text-red-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {tender.status}
                  </Badge>
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-900 leading-snug">{tender.title}</h1>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                Issued by{" "}
                {tender.company?.slug ? (
                  <Link href={`/companies/${tender.company.slug}`} className="font-semibold text-primary hover:underline">
                    {companyName}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">{companyName}</span>
                )}
                {tender.reference_number && <span className="ml-1.5 text-xs text-muted-foreground">· {tender.reference_number}</span>}
              </p>

              <div className="mt-3.5 flex flex-wrap gap-2 text-[12px]">
                {tender.category && (
                  <span className="flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 font-medium text-blue-700 border border-blue-100/50">
                    <Tag className="size-3" />{tender.category}
                  </span>
                )}
                {tender.tender_type && (
                  <span className="flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 font-medium text-purple-700 border border-purple-100/50">
                    <FileText className="size-3" />{tender.tender_type}
                  </span>
                )}
                {tender.city && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="size-3" />{tender.city}
                  </span>
                )}
              </div>
            </div>

            {/* Deadline badge */}
            <div className={`shrink-0 flex flex-col items-center justify-center rounded-xl px-4 py-3 text-center ${
              isClosed ? "bg-red-50 border border-red-100" : days !== null && days <= 7 ? "bg-amber-50 border border-amber-100" : "bg-emerald-50 border border-emerald-100"
            }`}>
              <Clock className={`size-4 mb-0.5 ${isClosed ? "text-red-500" : days !== null && days <= 7 ? "text-amber-500" : "text-emerald-600"}`} />
              <p className={`text-lg font-bold ${isClosed ? "text-red-600" : days !== null && days <= 7 ? "text-amber-700" : "text-emerald-700"}`}>
                {isClosed ? "Closed" : `${days}d`}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                {isClosed ? "No longer active" : "Days remaining"}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col gap-5 lg:flex-row">
          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Dates */}
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-3 shadow-sm">
              {tender.submission_deadline && (
                <InfoBadge icon={Calendar} label="Submission Deadline" value={format(new Date(tender.submission_deadline), "dd MMM yyyy")} />
              )}
              {tender.tender_open_date && (
                <InfoBadge icon={CheckCircle2} label="Tender Open Date" value={format(new Date(tender.tender_open_date), "dd MMM yyyy")} />
              )}
              {tender.bid_opening_date && (
                <InfoBadge icon={Info} label="Bid Opening Date" value={format(new Date(tender.bid_opening_date), "dd MMM yyyy")} />
              )}
              {tender.value_estimate && (
                <InfoBadge icon={Tag} label="Estimated Value" value={`${tender.value_currency ?? "USD"} ${Number(tender.value_estimate).toLocaleString()}`} />
              )}
            </div>

            {/* Description */}
            {tender.description && (
              <div className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-sm">
                <h2 className="mb-2.5 text-[15px] font-semibold text-gray-900">About this Tender</h2>
                <p className="text-[13px] leading-relaxed text-gray-700 whitespace-pre-line">{tender.description}</p>
              </div>
            )}

            {/* Eligibility */}
            {tender.eligibility_criteria && (
              <div className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-sm">
                <h2 className="mb-2.5 text-[15px] font-semibold text-gray-900">Eligibility Criteria</h2>
                <p className="text-[13px] leading-relaxed text-gray-700 whitespace-pre-line">{tender.eligibility_criteria}</p>
              </div>
            )}

            {/* Required Docs */}
            {tender.required_documents && (
              <div className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-sm">
                <h2 className="mb-2.5 text-[15px] font-semibold text-gray-900">Required Documents</h2>
                <p className="text-[13px] leading-relaxed text-gray-700 whitespace-pre-line">{tender.required_documents}</p>
              </div>
            )}

            {/* How to Apply */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 shadow-sm">
              <h2 className="mb-2 text-[15px] font-semibold text-gray-900">How to Apply</h2>
              <p className="text-[13px] leading-relaxed text-gray-600">
                This tender is advertised on Anasell. To apply or express interest, contact the issuing organisation directly using the contact details provided, or visit their official website.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {tender.contact_email && (
                  <a
                    href={`mailto:${tender.contact_email}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[12px] font-semibold text-primary-foreground transition hover:brightness-105"
                  >
                    <Mail className="size-3.5" />Email the Issuer
                  </a>
                )}
                {tender.company?.slug && (
                  <Link
                    href={`/companies/${tender.company.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-[12px] font-semibold text-foreground transition hover:bg-muted"
                  >
                    <Building2 className="size-3.5" />View Company Profile
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-full shrink-0 lg:w-72">
            <div className="lg:sticky lg:top-20 space-y-4">
              {/* Actions card */}
              <div className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-sm">
                <Button
                  variant="outline"
                  className="w-full gap-1.5 h-9 text-xs mb-3 shadow-none"
                  size="sm"
                  onClick={() => {
                    setSaved((s) => !s);
                    toast(saved ? "Removed from saved" : "Tender saved!");
                  }}
                >
                  <Bookmark className={`size-3.5 ${saved ? "fill-current text-primary" : ""}`} />
                  {saved ? "Saved" : "Save Tender"}
                </Button>

                <Separator className="mb-4" />

                <h3 className="mb-3 text-[13px] font-semibold text-gray-900">Contact Information</h3>
                {tender.contact_person && (
                  <div className="mb-2 flex items-center gap-2 text-[13px]">
                    <User className="size-3.5 text-muted-foreground shrink-0" />
                    <span>{tender.contact_person}</span>
                  </div>
                )}
                {tender.contact_email && (
                  <a href={`mailto:${tender.contact_email}`} className="mb-2 flex items-center gap-2 text-[13px] text-primary hover:underline">
                    <Mail className="size-3.5 shrink-0" />
                    <span className="truncate">{tender.contact_email}</span>
                  </a>
                )}
                {tender.contact_phone && (
                  <a href={`tel:${tender.contact_phone}`} className="mb-2 flex items-center gap-2 text-[13px] text-primary hover:underline">
                    <Phone className="size-3.5 shrink-0" />
                    {tender.contact_phone}
                  </a>
                )}

                {tender.attachment_url && (
                  <a
                    href={tender.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded border border-border py-2 text-xs font-medium text-foreground transition hover:bg-muted shadow-none"
                  >
                    <Download className="size-3.5" />Download Documents
                  </a>
                )}
              </div>

              {/* Stats */}
              <div className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-sm">
                <div className="flex justify-between text-[13px] mb-2">
                  <span className="text-muted-foreground">Views</span>
                  <span className="font-medium">{tender.views ?? 0}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Posted</span>
                  <span className="font-medium text-[11px]">{format(new Date(tender.created_at), "dd MMM yyyy")}</span>
                </div>
              </div>

              {/* Share */}
              <div className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-sm">
                <p className="text-[13px] font-semibold text-gray-900 mb-3">Share this tender</p>
                <div className="flex gap-2">
                  {[
                    { label: "Copy link", icon: Share2 },
                    { label: "LinkedIn", icon: Globe },
                  ].map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Link copied!");
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded border border-border bg-gray-50 py-2 text-[11px] font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                      <Icon className="size-3" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
