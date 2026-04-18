"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  {
    title: "Career Development",
    desc: "Browse thousands of job openings from verified companies across South Sudan.",
    emoji: "💼",
    color: "from-emerald-600/30 to-emerald-800/20",
  },
  {
    title: "Prime Estates",
    desc: "Discover residential and commercial properties in prime South Sudan locations.",
    emoji: "🏠",
    color: "from-blue-600/30 to-blue-800/20",
  },
  {
    title: "Government Tenders",
    desc: "Access exclusive tender opportunities and submit competitive bids.",
    emoji: "📋",
    color: "from-amber-600/30 to-amber-800/20",
  },
  {
    title: "Courses & Training",
    desc: "Upskill with accredited courses from leading institutions nationwide.",
    emoji: "🎓",
    color: "from-purple-600/30 to-purple-800/20",
  },
  {
    title: "Business Directory",
    desc: "Connect with verified companies and grow your professional network.",
    emoji: "🏢",
    color: "from-rose-600/30 to-rose-800/20",
  },
  {
    title: "Video Adverts",
    desc: "Reach your audience with targeted video advertising campaigns.",
    emoji: "🎬",
    color: "from-cyan-600/30 to-cyan-800/20",
  },
  {
    title: "National ID Services",
    desc: "Apply for and track your South Sudan national identification documents.",
    emoji: "🪪",
    color: "from-orange-600/30 to-orange-800/20",
  },
  {
    title: "Supplier Network",
    desc: "Register as a supplier and access government procurement opportunities.",
    emoji: "🔗",
    color: "from-teal-600/30 to-teal-800/20",
  },
];

export function CategoryCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % CATEGORIES.length);
    }, 3200);
    return () => clearInterval(id);
  }, [paused]);

  const cat = CATEGORIES[current];

  return (
    <div
      className="relative select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Card */}
      <div
        key={current}
        className={cn(
          "relative overflow-hidden  p-7",
          // cat.color
        )}
        style={{ animation: "fadeSlideIn 0.5s ease forwards" }}
      >
        <style>{`
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateX(28px); }
            to   { opacity: 1; transform: translateX(0); }
          }
        `}</style>

        {/* Big emoji */}
        {/* <div className="mb-4 text-5xl">{cat.emoji}</div> */}

        <h3 className="text-[2rem] font-semibold leading-tight tracking-tight text-[#10210f]">
          {cat.title}
        </h3>
        <p className="mt-2 text-[15px] leading-relaxed text-[#10210f]/68">
          {cat.desc}
        </p>
{/*  */}
      </div>

      {/* Dot indicators */}
      <div className="mt-4 ml-3 flex items-center justify-center gap-1.5">
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
