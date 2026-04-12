"use client";

import React from "react";
import Link from "next/link";
import { useUserStore } from "@/stores/user-store";
import { useJobs } from "@/hooks/use-jobs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Briefcase, MapPin, DollarSign, Trash2 } from "lucide-react";

function EmptyState({ icon: Icon, text, action }: { icon: React.ElementType; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 mb-3">
        <Icon className="h-5 w-5 text-gray-300" />
      </div>
      <p className="text-[12px] text-gray-400 mb-3">{text}</p>
      {action}
    </div>
  );
}

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/50">
              {headers.map((h) => (
                <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export default function UserSavedJobsPage() {
  const { favoriteJobIds, toggleFavoriteJob } = useUserStore();
  
  const { data: jobsData, isLoading: jobsLoading } = useJobs({ page_size: 100 });
  const allJobs = jobsData?.data ?? [];
  const savedJobs = allJobs.filter((j) => favoriteJobIds.includes(j.id));

  return (
    <div className="px-4 md:px-6 pt-5 pb-12 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Saved Jobs</h1>
        <p className="text-xs text-gray-500 mt-1">Job positions you've bookmarked for later</p>
      </div>

      {jobsLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      ) : savedJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <EmptyState
            icon={Briefcase}
            text={favoriteJobIds.length === 0 ? "No saved jobs. Click the heart icon on any job card." : "Your saved jobs couldn't be loaded."}
            action={
              <Link href="/job-board">
                <Button size="sm" variant="outline" className="text-xs gap-1 h-8">
                  <Briefcase className="h-3 w-3" /> Browse Job Board
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <DataTable headers={["#", "Position", "Company", "Location", "Type", "Salary", ""]}>
          {savedJobs.map((j, i) => {
            const salaryLabel =
              j.salary_min && j.salary_max
                ? `${j.salary_currency ?? "USD"} ${j.salary_min.toLocaleString()}–${j.salary_max.toLocaleString()}`
                : j.salary_min
                ? `From ${j.salary_min.toLocaleString()}`
                : "Competitive";
            return (
              <tr key={j.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-2.5 text-[11px] text-gray-400 w-8">{i + 1}</td>
                <td className="px-4 py-2.5 max-w-[180px]">
                  <p className="text-[12px] font-semibold text-gray-900 truncate">{j.title}</p>
                  {j.career_level && <p className="text-[10px] text-gray-400">{j.career_level}</p>}
                </td>
                <td className="px-4 py-2.5 text-[11px] text-gray-600 whitespace-nowrap">{j.company_name}</td>
                <td className="hidden md:table-cell px-4 py-2.5 text-[11px] text-gray-400 whitespace-nowrap">
                  {j.city ? <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{j.city}</span> : "—"}
                </td>
                <td className="hidden lg:table-cell px-4 py-2.5">
                  {j.job_type && (
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[9.5px] font-semibold text-purple-700">{j.job_type}</span>
                  )}
                </td>
                <td className="hidden lg:table-cell px-4 py-2.5 text-[11px] text-gray-600 whitespace-nowrap">
                  <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5 text-gray-400" />{salaryLabel}</span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/job-board/${j.id}`}>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-primary">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                    <button
                      onClick={() => toggleFavoriteJob(j.id)}
                      className="h-6 w-6 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors rounded"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
