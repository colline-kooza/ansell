"use client";

import React from "react";
import Link from "next/link";
import { useUserStore } from "@/stores/user-store";
import { usePublicProperties } from "@/hooks/use-properties";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Building2, MapPin, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PROPERTY_STATUS: Record<string, { label: string; cls: string }> = {
  active:         { label: "Active",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending_review: { label: "Pending",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
  rejected:       { label: "Rejected", cls: "bg-red-50 text-red-700 border-red-200" },
  inactive:       { label: "Inactive", cls: "bg-gray-50 text-gray-600 border-gray-200" },
};

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

export default function UserSavedPropertiesPage() {
  const { favoritePropertyIds, toggleFavoriteProperty } = useUserStore();
  
  const { data: propertiesData, isLoading: propertiesLoading } = usePublicProperties({ page_size: 100 });
  const allProperties = propertiesData?.data ?? [];
  const savedProperties = allProperties.filter((p) => favoritePropertyIds.includes(p.id));

  return (
    <div className="px-4 md:px-6 pt-5 pb-12 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Saved Properties</h1>
        <p className="text-xs text-gray-500 mt-1">Real estate listings you've marked as favourite</p>
      </div>

      {propertiesLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      ) : savedProperties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <EmptyState
            icon={Building2}
            text={favoritePropertyIds.length === 0 ? "No saved properties. Use the heart icon on any listing." : "Your saved properties couldn't be loaded."}
            action={
              <Link href="/real-estate">
                <Button size="sm" variant="outline" className="text-xs gap-1 h-8">
                  <Building2 className="h-3 w-3" /> Browse Real Estate
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <DataTable headers={["#", "Property", "Location", "Price", "Type", "Status", ""]}>
          {savedProperties.map((p, i) => {
            const images = (() => { try { return JSON.parse(p.images) as string[]; } catch { return [] as string[]; } })();
            const thumb = images[0];
            const st = PROPERTY_STATUS[p.status] ?? { label: p.status, cls: "bg-gray-50 text-gray-600 border-gray-200" };
            return (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-2.5 text-[11px] text-gray-400 w-8">{i + 1}</td>
                <td className="px-4 py-2.5 max-w-[180px]">
                  <div className="flex items-center gap-2">
                    {thumb ? (
                      <img src={thumb} alt="" className="h-7 w-7 rounded object-cover shrink-0" />
                    ) : (
                      <div className="h-7 w-7 rounded bg-primary/5 flex items-center justify-center shrink-0">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <p className="text-[12px] font-semibold text-gray-900 truncate">{p.title}</p>
                  </div>
                </td>
                <td className="hidden md:table-cell px-4 py-2.5 text-[11px] text-gray-500 whitespace-nowrap">
                  <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5 text-gray-400" />{p.city}</span>
                </td>
                <td className="px-4 py-2.5 text-[11px] font-semibold text-gray-900 whitespace-nowrap">
                  {p.currency} {p.price.toLocaleString()}<span className="text-gray-400 font-normal">/{p.price_period}</span>
                </td>
                <td className="hidden lg:table-cell px-4 py-2.5">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9.5px] font-semibold text-primary">{p.category}</span>
                </td>
                <td className="px-4 py-2.5">
                  <Badge className={cn("text-[9.5px] border px-1.5 py-0", st.cls)}>{st.label}</Badge>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/real-estate/${p.id}`}>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-primary">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                    <button
                      onClick={() => toggleFavoriteProperty(p.id)}
                      className="h-6 w-6 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors rounded"
                      title="Remove"
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
