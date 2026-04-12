"use client";

import React from "react";
import { useUserStore } from "@/stores/user-store";
import { useArticleCategories } from "@/hooks/use-articles";
import { CheckCircle, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  business:     "from-blue-50 border-blue-100 text-blue-700",
  politics:     "from-purple-50 border-purple-100 text-purple-700",
  sports:       "from-emerald-50 border-emerald-100 text-emerald-700",
  technology:   "from-cyan-50 border-cyan-100 text-cyan-700",
  health:       "from-red-50 border-red-100 text-red-700",
  entertainment: "from-pink-50 border-pink-100 text-pink-700",
  education:    "from-amber-50 border-amber-100 text-amber-700",
  general:      "from-gray-50 border-gray-100 text-gray-700",
};

export default function UserNewsPreferencesPage() {
  const { newsPreferences, toggleNewsPreference } = useUserStore();
  const { data: categoriesData } = useArticleCategories();
  const categories = categoriesData ?? [];

  return (
    <div className="px-4 md:px-6 pt-5 pb-12 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">News Preferences</h1>
        <p className="text-xs text-gray-500 mt-1">Choose the categories you want to follow</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {["Business", "Politics", "Sports", "Technology", "Health", "Entertainment", "Education", "General"].map((cat) => {
          const slug = cat.toLowerCase();
          const selected = newsPreferences.includes(slug);
          const colorCls = CATEGORY_COLORS[slug] ?? CATEGORY_COLORS.general;
          return (
            <button
              key={slug}
              onClick={() => toggleNewsPreference(slug)}
              className={cn(
                "relative flex flex-col items-start gap-2 rounded-xl border p-4 bg-gradient-to-br transition-all text-left",
                selected
                  ? `${colorCls} ring-2 ring-primary/30 shadow-sm`
                  : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
              )}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-[12px] font-semibold capitalize">{cat}</span>
                <div className={cn(
                  "h-4 w-4 rounded-full border-2 transition-all flex items-center justify-center",
                  selected ? "border-primary bg-primary" : "border-gray-200 bg-white"
                )}>
                  {selected && <CheckCircle className="h-2.5 w-2.5 text-white fill-white" />}
                </div>
              </div>
              <Newspaper className="h-4 w-4 opacity-40" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
