"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  DollarSign,
  Clock,
  Zap,
  Eye,
  ExternalLink,
} from "lucide-react";
import { motion } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import type { Job } from "@/hooks/use-jobs";
import { toast } from "sonner";

interface JobCardProps {
  job: Job;
  index?: number;
}

export default function JobCard({ job, index = 0 }: JobCardProps) {
  const [imgError, setImgError] = useState(false);
  const router = useRouter();

  const postedAgo = job.created_at
    ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true })
    : "Recently";

  const salaryLabel =
    job.salary_min && job.salary_max
      ? `${job.salary_currency ?? "USD"} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
      : job.salary_min
        ? `From ${job.salary_currency ?? "USD"} ${job.salary_min.toLocaleString()}`
        : "Competitive";

  let logoUrl =
    job.company?.logo_url ||
    (job as any).company_logo ||
    (job as any).logo ||
    (job as any).company_logo_url;
  const companyName = job.company_name || "Ansell";
  const initial = companyName.charAt(0).toUpperCase();

  if (!logoUrl && !imgError && companyName !== "Ansell") {
    const domain = companyName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() + ".com";
    logoUrl = `https://logo.clearbit.com/${domain}`;
  }

  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
  ];
  const logoBg =
    !logoUrl || imgError
      ? colors[companyName.length % colors.length]
      : "border border-gray-100 bg-white";

  const type = job.job_type || "Full Time";
  const typeStyle = type.toLowerCase().includes("part")
    ? "bg-pink-50 text-pink-700"
    : type.toLowerCase().includes("contract")
      ? "bg-blue-50 text-blue-700"
      : type.toLowerCase().includes("freelance")
        ? "bg-amber-50 text-amber-700"
        : "bg-purple-50 text-purple-700";

  const isHot = (job as any).is_featured || false;
  const category = (job as any).category_name || (job as any).category || "General";
  const pdfUrl = job.pdf_url || (job as any).pdfUrl || (job as any).PdfUrl;
  const views = job.views;

  const handlePdfDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!pdfUrl) {
      router.push(`/job-board/${job.id}`);
      return;
    }

    const toastId = toast.loading("Preparing PDF...");
    try {
      // Get a short-lived signed GET URL to avoid R2 private bucket 401s
      const signRes = await fetch(`/api/upload/signed?url=${encodeURIComponent(pdfUrl)}`);
      const signData = await signRes.json();
      const downloadUrl = signData.url ?? pdfUrl;

      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = blobUrl;
      a.download = `${job.title.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      a.remove();
      toast.success("PDF downloaded", { id: toastId });
    } catch (error) {
      console.error("PDF download error:", error);
      toast.error("Failed to download PDF", { id: toastId });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      onClick={handlePdfDownload}
      className="group relative cursor-pointer rounded-2xl border border-gray-100 bg-white p-2.5 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-gray-100 sm:p-4"
    >
      <div className="relative z-10 flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:gap-4 pointer-events-none">
        <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-4">
          <div
            className={`flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-lg font-bold text-white sm:size-12 ${logoBg}`}
          >
            {logoUrl && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
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
              <h3 className="line-clamp-2 text-[17px] font-bold text-gray-900 transition-colors group-hover:text-primary sm:line-clamp-1 sm:text-[17px]">
                {job.title}
              </h3>
              {isHot && <Zap className="size-3 shrink-0 fill-red-500 text-red-500" />}
            </div>

            <p className="mb-1.5 text-xs leading-4 text-gray-500 sm:mb-2 sm:text-sm">
              by <span className="font-semibold text-gray-800">{companyName}</span>
              {category && <span className="ml-2 text-[10px] text-primary sm:text-xs">• {category}</span>}
            </p>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[10px] sm:gap-x-3 sm:gap-y-2 sm:text-xs">
              <span className={`rounded-full px-2.5 py-0.5 font-medium ${typeStyle}`}>
                {type}
              </span>
              {job.city && (
                <span className="flex items-center gap-1 text-gray-500">
                  <MapPin className="size-3" />
                  {job.city}
                </span>
              )}
              <span className="flex items-center gap-1 text-gray-500">
                <DollarSign className="size-3" />
                {salaryLabel}
              </span>
              {views != null && views > 0 && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Eye className="size-3" />
                  {views.toLocaleString()} views
                </span>
              )}
              <span className="flex items-center gap-1 text-gray-400">
                <Clock className="size-3" />
                Posted {postedAgo}
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full shrink-0 items-center justify-end gap-2 border-t border-gray-100 pt-2 sm:pt-3 md:w-auto md:border-t-0 md:pt-0 pointer-events-auto">
          <Link
            href={`/job-board/${job.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <ExternalLink className="size-3" />
            <span>View Details</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
