"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const INDUSTRIES = [
  { name: "Real Estate", emoji: "🏠", description: "Browse verified property listings across South Sudan.", href: "/real-estate" },
  { name: "Job Board", emoji: "💼", description: "Find career opportunities with leading employers.", href: "/job-board" },
  { name: "Government Tenders", emoji: "📋", description: "Access public procurement opportunities.", href: "/tenders" },
  { name: "Training & Courses", emoji: "🎓", description: "Upskill with accredited local training programmes.", href: "/courses" },
  { name: "Companies Directory", emoji: "🏢", description: "Explore verified businesses operating in South Sudan.", href: "/companies" },
  { name: "Business News", emoji: "📰", description: "Stay informed with the latest market intelligence.", href: "/news" },
];

export function IndustriesSection() {
  return (
    <section className="py-8 sm:py-16 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-3 sm:px-6">
        <div className="mb-8 sm:mb-10 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Platform Modules
          </p>
          <h2 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.05em] text-foreground sm:text-[2rem]">
            Everything South Sudan needs, in one place.
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {INDUSTRIES.map((industry) => (
            <Link
              key={industry.name}
              href={industry.href}
              className="group rounded-xl border border-border bg-white p-4 sm:p-5 transition-all hover:shadow-md hover:border-primary/30"
            >
              <span className="text-2xl sm:text-3xl">{industry.emoji}</span>
              <h3 className="mt-3 text-sm font-semibold text-foreground sm:text-base">
                {industry.name}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {industry.description}
              </p>
              <span className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Explore <ArrowRight className="size-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
