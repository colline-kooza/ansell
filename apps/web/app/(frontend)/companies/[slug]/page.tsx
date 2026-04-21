"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Building2,
  MapPin,
  Users,
  Globe,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  ChevronRight,
  Star,
  CheckCircle2,
  ExternalLink,
  Info,
  ArrowRight,
  Zap,
  Tag,
  Clock,
  Eye,
  Search,
  AlertCircle
} from "lucide-react";
import { usePublicCompany } from "@/hooks/use-companies";
import { useJobs } from "@/hooks/use-jobs";
import { useTenders } from "@/hooks/use-tenders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { type LucideIcon } from "lucide-react";

// ─── Skeletons ─────────────────────────────────────────────────────────────────

function CompanyPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 animate-pulse">
      <div className="h-4 w-32 bg-gray-200 rounded mb-6" />
      <div className="h-64 bg-gray-200 rounded-2xl mb-8" />
      <div className="flex gap-8">
        <div className="flex-1 space-y-6">
          <div className="h-10 w-1/2 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
        <div className="w-80 space-y-6 hidden lg:block">
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Info Item ────────────────────────────────────────────────────────────────

function InfoItem({ icon: Icon, label, value, href }: { icon: LucideIcon; label: string; value?: string; href?: string }) {
  if (!value) return null;
  
  const content = (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="size-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-[13px] font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:bg-slate-50 transition-colors rounded-lg -m-2 p-2">
        {content}
      </a>
    );
  }

  return <div className="p-2">{content}</div>;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CompanyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: company, isLoading, isError } = usePublicCompany(slug);

  // Fetch Jobs related to this company
  const { data: jobsData, isLoading: jobsLoading } = useJobs({
    company_id: company?.id,
    page_size: 5,
    enabled: !!company?.id,
  });

  // Fetch Tenders related to this company
  const { data: tendersData, isLoading: tendersLoading } = useTenders({
    company_id: company?.id,
    page_size: 5,
    enabled: !!company?.id,
  });

  if (isLoading) return <CompanyPageSkeleton />;
  
  if (isError || !company) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
        <AlertCircle className="size-12 text-muted-foreground/30 mb-4" />
        <h1 className="text-xl font-bold">Company Not Found</h1>
        <p className="text-muted-foreground mt-2 max-w-md">The company you are looking for doesn&apos;t exist or has been removed from our platform.</p>
        <Button asChild className="mt-8">
          <Link href="/companies">Explore Companies</Link>
        </Button>
      </div>
    );
  }

  const jobs = jobsData?.data ?? [];
  const tenders = tendersData?.data ?? [];

  return (
    <div className="min-h-screen bg-[#f8fbfe]">
      {/* Header / Banner Area */}
      <div className="relative">
        <div className="h-48 w-full bg-gradient-to-r from-slate-900 via-slate-800 to-primary/20 sm:h-64">
           {company.cover_image_url && (
             <img src={company.cover_image_url} alt="" className="h-full w-full object-cover opacity-50" />
           )}
        </div>
        
        <div className="mx-auto max-w-6xl px-4">
          <div className="relative -mt-12 flex flex-col items-start gap-6 sm:-mt-20 sm:flex-row sm:items-end sm:justify-between">
            {/* Logo */}
            <div className="relative">
              <div className="flex size-28 items-center justify-center overflow-hidden rounded-lg border border-white bg-white shadow-sm sm:size-32">
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.company_name} className="h-full w-full object-contain p-2" />
                ) : (
                  <Building2 className="size-12 text-muted-foreground/20" />
                )}
              </div>
              {company.is_verified && (
                <div className="absolute -right-1.5 -top-1.5 rounded-full bg-white p-0.5 shadow-sm">
                  <CheckCircle2 className="size-5 text-emerald-500 fill-white" />
                </div>
              )}
            </div>

            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[9px] uppercase font-medium tracking-wider">
                  {company.industry || "General"}
                </Badge>
                {company.is_active && (
                   <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                     <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                     Active Member
                   </div>
                )}
              </div>
              <h1 className="text-lg font-bold text-gray-900 sm:text-xl tracking-tight leading-none mb-2">{company.company_name}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-400 font-medium">
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="size-4 text-primary/60" />
                  {company.city || "South Sudan"}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Globe className="size-4 text-primary/60" />
                  {company.website?.replace(/^https?:\/\//, "") || "Official Website"}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Users className="size-4 text-primary/60" />
                  {company.employee_count || "10-50 Employees"}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pb-2">
              {company.website ? (
                <a
                  href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
                >
                  <Globe className="size-4" />
                  Visit Website
                </a>
              ) : null}
              <Button variant="outline" size="icon" className="group border-slate-200" asChild>
                <a href={`mailto:${company.email}`} title="Email company">
                  <ExternalLink className="size-4 group-hover:text-primary transition-colors" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column */}
          <div className="space-y-8 lg:col-span-8">
            {/* Navigation Tabs (Simulated) */}
            <div className="flex items-center gap-6 border-b border-border/40 pb-0.5 overflow-x-auto whitespace-nowrap scrollbar-hide">
              {['Overview', 'Open Jobs', 'Tenders', 'Culture'].map((tab, i) => (
                <button 
                  key={tab} 
                  className={`relative pb-2.5 text-[13px] font-semibold transition-colors ${i === 0 ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {tab}
                  {i === 0 && <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary" />}
                </button>
              ))}
            </div>

            {/* About Section */}
            <section>
              <h2 className="text-[14px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Info className="size-3.5 text-primary" />
                About {company.company_name}
              </h2>
              <div className="rounded-lg border border-border/40 bg-white p-4 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
                <p className="text-[15px] leading-relaxed text-gray-600 whitespace-pre-line">
                  {company.description || `${company.company_name} is a leading organization in South Sudan, committed to excellence and professional service delivery. They specialize in ${company.industry || "various sectors"} and are a key player in the regional economy.`}
                </p>
                
                {company.industry && (
                  <div className="mt-8 flex flex-wrap gap-2">
                    {company.industry.split(',').map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-50 border border-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-600">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Jobs Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[14px] font-semibold text-gray-900 flex items-center gap-2">
                  <Briefcase className="size-3.5 text-primary" />
                  Latest Openings
                </h2>
                <Link href="/job-board" className="text-[10px] font-semibold text-primary flex items-center gap-1 hover:underline uppercase tracking-wider">
                  View All <ArrowRight className="size-3" />
                </Link>
              </div>

              {jobsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                </div>
              ) : jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <Link 
                      key={job.id} 
                      href={`/job-board/${job.id}`}
                      className="group block rounded-lg border border-border/40 bg-white p-3.5 transition-all hover:border-primary/20 hover:shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors truncate">{job.title}</h3>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3.5" /> Juba
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="size-3.5" /> Full-time
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-emerald-600">
                              <Zap className="size-3.5" /> High priority
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/40 bg-white/40 py-10 text-center">
                   <Briefcase className="size-8 text-muted-foreground/20 mx-auto mb-3" />
                   <p className="text-[13px] font-medium text-muted-foreground">No current job openings</p>
                </div>
              )}
            </section>

            {/* Tenders Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[14px] font-semibold text-gray-900 flex items-center gap-2">
                  <Tag className="size-3.5 text-primary" />
                  Active Tenders
                </h2>
                <Link href="/tenders" className="text-[10px] font-semibold text-primary flex items-center gap-1 hover:underline uppercase tracking-wider">
                  View All <ArrowRight className="size-3" />
                </Link>
              </div>

              {tendersLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                </div>
              ) : tenders.length > 0 ? (
                <div className="space-y-4">
                  {tenders.map((tender) => (
                    <Link 
                      key={tender.id} 
                      href={`/tenders/${tender.id}`}
                      className="group block rounded-lg border border-border/40 bg-white p-3.5 transition-all hover:border-primary/20 hover:shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors truncate">{tender.title}</h3>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Tag className="size-3.5 text-blue-500" /> {tender.category}
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-red-500">
                              <Calendar className="size-3.5" /> Closes: {tender.submission_deadline ? new Date(tender.submission_deadline).toLocaleDateString() : 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="size-3.5" /> {(tender.views ?? 0).toLocaleString()} views
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/60 bg-white/50 py-12 text-center">
                   <Tag className="size-10 text-muted-foreground/20 mx-auto mb-3" />
                   <p className="text-sm font-medium text-muted-foreground">No active tenders at the moment</p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-6 lg:col-span-4">
            {/* Contact & Info */}
            <div className="rounded-lg border border-border/40 bg-white p-4 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
              <h3 className="text-[11px] font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-tight text-muted-foreground/80">
                Company Details
              </h3>
              
              <div className="space-y-1">
                <InfoItem icon={Globe} label="Website" value={company.website} href={company.website} />
                <Separator className="my-2 bg-slate-50" />
                <InfoItem icon={Mail} label="Email Address" value={company.email} href={`mailto:${company.email}`} />
                <Separator className="my-2 bg-slate-50" />
                <InfoItem icon={Phone} label="Phone Number" value={company.phone_number} href={`tel:${company.phone_number}`} />
                <Separator className="my-2 bg-slate-50" />
                <InfoItem icon={MapPin} label="Location" value={`${company.address || ""}, ${company.city || "South Sudan"}`} />
                <Separator className="my-2 bg-slate-50" />
                <InfoItem icon={Users} label="Company Size" value={company.employee_count} />
                <Separator className="my-2 bg-slate-50" />
                <InfoItem icon={Clock} label="Member Since" value={company.created_at ? new Date(company.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "N/A"} />
              </div>

              <Button variant="outline" className="w-full mt-6 group font-semibold border-slate-200 text-xs h-9">
                Message Company
                <ChevronRight className="size-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>

            {/* Verification & Trust */}
            <div className="rounded-xl bg-slate-900 p-6 text-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 size-32 bg-primary/20 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/30 transition-colors" />
               <div className="relative z-10">
                 <div className="size-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6">
                    <CheckCircle2 className="size-6 text-primary" />
                 </div>
                 <h3 className="text-lg font-bold mb-2 leading-tight">Verified Business Identity</h3>
                 <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                   {company.company_name} has completed our identity verification process and is a trusted member of the Anasell community.
                 </p>
                 <Link href="/id-verification" className="inline-flex items-center gap-2 text-[10px] font-bold text-primary hover:gap-3 transition-all uppercase tracking-widest">
                    Verification Policy <ArrowRight className="size-3.5" />
                 </Link>
               </div>
            </div>

            {/* Help / Reporting */}
            <div className="rounded-2xl border border-dashed border-border/80 p-6 text-center">
              <p className="text-xs text-muted-foreground mb-4">Is something wrong with this company profile?</p>
              <button className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors">
                Report this Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
