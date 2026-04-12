"use client";

import React, { useState } from 'react';
import Link from "next/link";
import { MapPin, DollarSign, Clock, Heart, Briefcase, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDistanceToNow } from "date-fns";
import type { Job } from "@/hooks/use-jobs";
import { useUserStore } from "@/stores/user-store";

interface JobCardProps {
  job: Job;
  view?: "list" | "grid"; // kept for backwards compatibility with the parent map
}

export default function JobCard({ job }: JobCardProps) {
  const { isFavoriteJob, toggleFavoriteJob } = useUserStore();
  const wishlisted = isFavoriteJob(job.id);
  const [imgError, setImgError] = useState(false);

  const postedAgo = job.created_at
    ? formatDistanceToNow(new Date(job.created_at), { addSuffix: true })
    : "Recently";

  const salaryLabel =
    job.salary_min && job.salary_max
      ? `${job.salary_currency ?? "USD"} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`
      : job.salary_min
        ? `From ${job.salary_currency ?? "USD"} ${job.salary_min.toLocaleString()}`
        : "Competitive";

  // Flexible check for a potential logo URL from the backend
  let logoUrl = job.company?.logo_url || (job as any).company_logo || (job as any).logo || (job as any).company_logo_url;
  
  // Fallback company name -> superadmin jobs often have no explicit company_name
  const companyName = job.company_name || "Ansell";
  
  // Fallback initial
  const initial = companyName.charAt(0).toUpperCase();

  // Try to guess logo if none exists and hasn't errored
  if (!logoUrl && !imgError && companyName !== "Ansell") {
    const domain = companyName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() + ".com";
    logoUrl = `https://logo.clearbit.com/${domain}`;
  }

  // Static bg color for fallback logo
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
  const colorIndex = companyName.length % colors.length;
  const logoBg = !logoUrl || imgError ? colors[colorIndex] : "bg-white border border-gray-100";

  // Determine type colors
  const type = job.job_type || "Full Time";
  const typeStyle = type.toLowerCase().includes('part') 
    ? 'bg-pink-50 text-pink-600' 
    : type.toLowerCase().includes('contract')
    ? 'bg-blue-50 text-blue-600'
    : 'bg-purple-50 text-purple-600';

  const isHot = (job as any).is_featured || false;
  // Use category or fallback to industry
  const category = (job as any).category_name || (job as any).category || "General";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-[#007456] hover:shadow-xl hover:shadow-gray-100 transition-all group relative"
    >
      {/* Invisible full-card link overlay */}
      <Link href={`/job-board/${job.id}`} className="absolute inset-0 z-10" aria-label={`View ${job.title}`} />
      
      <div className="flex flex-col md:flex-row md:items-center gap-5">
        {/* Logo */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden text-white font-bold text-lg ${logoBg} shrink-0 relative z-20`}>
          {logoUrl && !imgError ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={logoUrl} 
                alt={job.company_name || ""} 
                onError={() => setImgError(true)}
                className="w-full h-full object-contain p-2 bg-white" 
                referrerPolicy="no-referrer"
              />
            </>
          ) : (
            initial
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative z-20 pointer-events-none text-left">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-base font-bold text-gray-900 group-hover:text-[#007456] transition-colors truncate">
              {job.title}
            </h3>
            {isHot && <Zap className="w-3.5 h-3.5 text-red-500 fill-red-500 shrink-0" />}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3 truncate">
            <span>by {" "}
              {job.company?.slug || job.company_id ? (
                <Link 
                  href={`/companies/${job.company?.slug || job.company_id}`}
                  className="font-medium text-gray-900 hover:text-[#007456] hover:underline"
                >
                  {companyName}
                </Link>
              ) : (
                <span className="font-medium text-gray-900">{companyName}</span>
              )}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-[#007456] font-medium truncate">{category}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className={`px-2.5 py-0.5 rounded-full font-medium ${typeStyle}`}>
              {type}
            </span>
            {job.city && (
              <div className="flex items-center gap-1 text-gray-400">
                <MapPin className="w-3 h-3" />
                {job.city}
              </div>
            )}
            <div className="flex items-center gap-1 text-gray-400">
              <DollarSign className="w-3 h-3" />
              {salaryLabel}
            </div>
          </div>
        </div>

        {/* Meta / Actions */}
        <div className="flex flex-col items-end justify-between gap-3 relative z-20">
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-gray-300 hover:text-[#007456] transition-colors" title="Quick Apply">
              <Briefcase className="w-4.5 h-4.5" />
            </button>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavoriteJob(job.id); }}
              className={`p-1.5 transition-colors ${wishlisted ? 'text-red-500' : 'text-gray-300 hover:text-red-500'}`} 
              title="Save Job"
            >
              <Heart className={`w-4.5 h-4.5 ${wishlisted ? 'fill-current text-red-500' : ''}`} />
            </button>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0 whitespace-nowrap">
            <Clock className="w-3 h-3" />
            Posted {postedAgo}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
