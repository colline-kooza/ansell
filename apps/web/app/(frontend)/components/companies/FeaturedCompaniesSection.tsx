"use client";

import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, MapPin, Users } from "lucide-react";
import { usePublicCompanies } from "@/hooks/use-companies";

function CompanySkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/50 bg-white shadow-sm animate-pulse">
      <div className="h-16 bg-gray-100" />
      <div className="p-4 pt-6 relative">
        <div className="absolute -top-6 left-4 size-10 rounded-lg border-2 border-white bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-200 mb-2" />
        <div className="h-3 w-1/2 rounded bg-gray-100 mb-4" />
        <div className="h-8 w-full rounded bg-gray-50" />
      </div>
    </div>
  );
}

export function FeaturedCompaniesSection() {
  const { data, isLoading } = usePublicCompanies({ page_size: 4 });
  const companies = data?.data ?? [];

  return (
    <section className="py-8 sm:py-16 bg-white">
      <div className="mx-auto max-w-6xl px-3 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Directory
            </p>
            <h2 className="mt-1.5 text-[1.5rem] font-semibold tracking-[-0.05em] text-foreground sm:text-[1.8rem]">
              Featured Companies
            </h2>
          </div>
          <Link
            href="/companies"
            className="hidden items-center gap-1.5 text-sm font-medium text-primary hover:underline sm:flex"
          >
            Explore all companies
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 sm:gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <CompanySkeleton key={i} />)
            : companies.length === 0
            ? (
              <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
                <Building2 className="mb-3 size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No companies found.</p>
              </div>
            )
            : companies.map((company) => (
              <div key={company.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-white shadow-sm transition-all hover:shadow-md">
                <Link href={`/companies/${company.slug || company.id}`} className="absolute inset-0 z-10" />
                
                <div className="h-16 bg-gradient-to-br from-secondary to-secondary/30" />
                
                <div className="p-4 pt-7 relative">
                  <div className="absolute -top-7 left-3">
                    <div className="flex size-11 items-center justify-center overflow-hidden rounded-lg border-2 border-white bg-white shadow-sm">
                      {company.logo_url ? (
                        <img src={company.logo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="size-5 text-muted-foreground/40" />
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                    {company.company_name}
                  </h3>
                  
                  <div className="mt-1 flex flex-col gap-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-2.5" /> Juba, South Sudan
                    </span>
                    <span className="flex items-center gap-1">
                       <CheckCircle2 className="size-2.5 text-emerald-500 fill-emerald-100" /> Verified Partner
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[10px]">
                     <span className="font-semibold text-primary">{company.jobs_count || 0} Open Jobs</span>
                     <ArrowRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            href="/companies"
            className="flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-medium text-foreground"
          >
            Explore all companies
            <ArrowRight className="size-3.5 text-primary" />
          </Link>
        </div>
      </div>
    </section>
  );
}
