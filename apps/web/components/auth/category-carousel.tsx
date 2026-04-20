"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  {
    title: "Find Your Next Career",
    desc: "Thousands of verified job openings across South Sudan — from NGOs and government to tech startups. Search by industry, location, or salary range and connect directly with top employers hiring today.",
    emoji: "💼",
    tag: "Job Board",
  },
  {
    title: "Discover Prime Properties",
    desc: "Browse apartments, land, commercial spaces, and more across Juba and beyond. Every listing is verified and directly linked to a registered owner. Find your perfect space and connect in minutes.",
    emoji: "🏠",
    tag: "Real Estate",
  },
  {
    title: "Access Public Tenders",
    desc: "Stay ahead of government and NGO procurement opportunities. Anasell aggregates tenders from official sources so your business never misses a bid. Browse active tenders and reach issuers directly.",
    emoji: "📋",
    tag: "Tenders",
  },
  {
    title: "Upskill with Top Courses",
    desc: "Explore accredited training programs from leading South Sudanese institutions. From vocational skills to university diplomas, find the course that elevates your career and connects you to employers.",
    emoji: "🎓",
    tag: "Courses & Training",
  },
  {
    title: "Grow Your Business Reach",
    desc: "List your company on South Sudan's most visited business directory. Get discovered by thousands of buyers, partners, and job seekers every day. Verified badges build trust and drive real enquiries.",
    emoji: "🏢",
    tag: "Company Directory",
  },
  {
    title: "Advertise with Impact",
    desc: "Reach the right audience with video ads that play directly on the Anasell platform. Showcase your brand to thousands of active South Sudanese users daily — at a fraction of traditional media costs.",
    emoji: "🎬",
    tag: "Video Advertising",
  },
];

export function CategoryCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % CATEGORIES.length);
    }, 4000);
    return () => clearInterval(id);
  }, [paused]);

  const cat = CATEGORIES[current];

  return (
    <div
      className="relative select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        key={current}
        className="relative overflow-hidden p-7"
        style={{ animation: "fadeSlideIn 0.45s ease forwards" }}
      >
        <style>{`
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateX(24px); }
            to   { opacity: 1; transform: translateX(0); }
          }
        `}</style>

        <span className="mb-4 inline-block rounded-full bg-[#10210f]/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#10210f]/70">
          {cat.tag}
        </span>

        <h3 className="mt-2 text-[2rem] font-bold leading-tight tracking-tight text-[#10210f]">
          {cat.title}
        </h3>
        <p className="mt-3 text-[14px] leading-[1.75] text-[#10210f]/65">
          {cat.desc}
        </p>
      </div>

      {/* Dot indicators */}
      <div className="mt-4 ml-7 flex items-center gap-1.5">
        {CATEGORIES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            className={cn(
              "rounded-full transition-all duration-300",
              i === current
                ? "h-2 w-7 bg-[#10210f]"
                : "h-1.5 w-1.5 bg-[#10210f]/28 hover:bg-[#10210f]/50"
            )}
          />
        ))}
      </div>
    </div>
  );
}
