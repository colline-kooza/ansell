"use client";

import React from "react";
import Link from "next/link";
import { useMyCompany, useCompanyJobs } from "@/hooks/use-companies";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase, Building, PlusCircle,
  Eye, TrendingUp, Globe, Phone, Mail, ShieldCheck, MapPin,
  AlertCircle, ChevronRight, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  closed: "bg-gray-50 text-gray-600 border-gray-200",
};

export default function CompanyDashboardPage() {
  const { user } = useAuth();
  const { data: company, isLoading: companyLoading } = useMyCompany();
  const { data: jobsData, isLoading: jobsLoading } = useCompanyJobs({ page: 1, page_size: 5 });

  const jobs = jobsData?.data ?? [];

  if (companyLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-12 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="col-span-12 sm:col-span-6 lg:col-span-3"><Skeleton className="h-28 w-full" /></div>)}
        </div>
      </div>
    );
  }

  if (!company) return null;

  const stats = [
    { label: "Active Jobs", value: jobsData?.total_items ?? 0, icon: Briefcase, color: "blue", gradient: "from-blue-50", border: "border-blue-100", textColor: "text-blue-600" },
    { label: "Profile Views", value: company.views ?? 0, icon: Eye, color: "purple", gradient: "from-purple-50", border: "border-purple-100", textColor: "text-purple-600" },
  ];

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">
            Welcome back, <span className="text-primary">{user?.first_name || "Owner"}</span>! 🏢
          </h1>
          <p className="text-[13px] text-gray-500 mt-1 max-w-xl">
            Manage your company profile, post job vacancies, and track applicant progress across ANASELL.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Button asChild variant="outline" size="sm" className="bg-white border-gray-200 text-[13px] shadow-sm">
             <Link href="/companies"><Globe className="h-3.5 w-3.5 mr-2 text-gray-400" />Public Profile</Link>
           </Button>
           <Button asChild size="sm" className="text-[13px] shadow-sm gap-1.5">
             <Link href="/company/dashboard/jobs?new=1"><PlusCircle className="h-3.5 w-3.5" />Post Job</Link>
           </Button>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-12 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className="col-span-12 sm:col-span-6 lg:col-span-3">
            <Card className={cn("bg-gradient-to-br to-white shadow-sm border transition-all duration-300 hover:shadow-md", stat.gradient, stat.border)}>
              <CardContent className="p-4 pt-3.5 pb-3">
                <div className="flex items-center justify-between mb-2">
                   <p className={cn("text-[11px] font-bold uppercase tracking-wider", stat.textColor)}>{stat.label}</p>
                   <stat.icon className={cn("h-4 w-4", stat.textColor)} />
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</span>
                  <Badge className="bg-white/50 border-gray-100 text-gray-600 text-[10px] px-1.5 py-0 font-medium">Tracking</Badge>
                </div>
                <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  Live statistics
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Area */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Active Job Warning */}
          {!company.is_active && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-100 rounded-xl animate-in fade-in slide-in-from-top-4 duration-500">
               <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
               <div className="flex-1">
                 <p className="text-[14px] font-bold text-amber-900">Application Under Review</p>
                 <p className="text-[12px] text-amber-600 mt-0.5 leading-relaxed">
                   Your company application is currently being reviewed by our administrative team. 
                   While in review, you can still finalize your profile and prepare draft listings.
                 </p>
               </div>
               <Button variant="ghost" size="sm" className="text-amber-700 hover:bg-amber-100">Dismiss</Button>
            </div>
          )}

          {/* Recent Jobs */}
          <Card className="bg-white border-gray-100 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between bg-gray-50/50 border-b border-gray-100">
              <div>
                <CardTitle className="text-[14px] font-bold">Recent Job Postings</CardTitle>
                <CardDescription className="text-[11px]">Last 5 active listings</CardDescription>
              </div>
              <Link href="/company/dashboard/jobs" className="text-[12px] text-primary font-semibold hover:underline flex items-center gap-1.5">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {jobsLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Briefcase className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-[13px] font-semibold text-gray-900">No active jobs yet</p>
                  <p className="text-[12px] text-gray-500 mt-1 max-w-[240px] mx-auto">Start recruiting by posting your first job opening.</p>
                  <Button asChild size="sm" variant="link" className="mt-2 text-primary font-bold">
                    <Link href="/company/dashboard/jobs?new=1">Post a Job now</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {jobs.map(job => (
                    <div key={job.id} className="group flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-white transition-colors border border-transparent group-hover:border-blue-100">
                           <Briefcase className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-gray-900 truncate group-hover:text-primary transition-colors">{job.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                             <span className="flex items-center gap-1 text-[11px] text-gray-400"><MapPin className="h-3 w-3" />{job.city || "Juba"}</span>
                             <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium capitalize"><Clock className="h-3 w-3 text-gray-300" />{job.job_type?.replace(/_/g, " ")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="text-right hidden sm:block">
                            <p className="text-[12px] font-bold text-gray-900">{job.applications_count || 0}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Applicants</p>
                         </div>
                         <Badge className={cn("text-[10px] border capitalize px-2 h-5", STATUS_STYLES[job.status] ?? "")}>
                           {job.status?.replace(/_/g, " ")}
                         </Badge>
                         <Link href={`/company/dashboard/jobs`} className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-primary hover:border hover:border-gray-100">
                            <ChevronRight className="h-4 w-4" />
                         </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card className="bg-white border-gray-100 shadow-sm overflow-hidden">
             <CardHeader className="pb-3 bg-gray-50/50 border-b border-gray-100">
                <CardTitle className="text-[14px] font-bold">Company Profile</CardTitle>
             </CardHeader>
             <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-4 mb-2">
                  <div className="h-16 w-16 rounded-xl border-2 border-white bg-white shadow-sm ring-1 ring-gray-100 flex items-center justify-center overflow-hidden">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt={company.company_name} className="h-full w-full object-contain p-1" />
                    ) : (
                      <Building className="h-6 w-6 text-gray-200" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 truncate max-w-[160px]">{company.company_name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge className={cn("text-[10px] px-1.5 h-4.5 capitalize border", company.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100")}>
                        {company.is_active ? "Active" : "Reviewing"}
                      </Badge>
                      {company.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    { icon: MapPin, label: company.city || "South Sudan", sub: "Location" },
                    { icon: Phone, label: company.phone_number || "—", sub: "Phone" },
                    { icon: Mail, label: company.email || "—", sub: "Contact Email" },
                    { icon: Globe, label: company.website ? company.website.replace(/^https?:\/\//, "") : "Set website", link: company.website, sub: "Website" },
                  ].map(({ icon: Icon, label, link, sub }) => (
                    <div key={sub} className="group flex items-start gap-3">
                      <div className="h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                        <Icon className="h-3.5 w-3.5 text-gray-400 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1">
                         <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">{sub}</p>
                         {link ? (
                            <a href={link} target="_blank" rel="noopener noreferrer" className="text-[12.5px] font-medium text-gray-700 hover:text-primary transition-colors truncate block">{label}</a>
                         ) : (
                            <p className="text-[12.5px] font-medium text-gray-600 truncate">{label}</p>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button asChild variant="outline" size="sm" className="w-full mt-2 h-9 text-[12px] font-bold border-gray-200">
                  <Link href="/company/dashboard/profile">Edit Full Profile</Link>
                </Button>
             </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="bg-primary/5 border-primary/10 shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="h-8 w-8 bg-primary/20 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <h4 className="text-[13px] font-bold text-primary">Owner Tip</h4>
              </div>
              <p className="text-[11.5px] text-primary/80 leading-relaxed font-medium">
                Verified companies receive 3x more professional applications. Ensure your profile is 100% complete to increase trust.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
