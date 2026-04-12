"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Sparkle } from "lucide-react";
import { solutionSections } from "./data";
import { SolutionsSidebar } from "./SolutionsSidebar";
import { SectionCard } from "./SectionCard";

export function SolutionsSection() {
  const [activeId, setActiveId] = useState(solutionSections[0].id);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll-based active state — single observer fires when section enters center band

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-section-id");
            if (id) setActiveId(id);
          }
        });
      },

      // Only fire when section crosses the middle 30% of the viewport

      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );

    solutionSections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div style={{ backgroundColor: "#f4f8fb" }}>
      {/* Section header */}
      <div className="pt-5 pb-12 px-4 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-2 mb-5"
        >
          <Sparkle className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-semibold tracking-[0.28em] text-muted-foreground uppercase">
            Solutions
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight text-foreground"
        >
          Full-Spectrum Of{" "}
          <span className="text-muted-foreground/70">AI-Powered Solutions</span>
          <br />
          Engineered For Global Impact
        </motion.h2>
      </div>

      {/* Two-column layout */}
      <div className="max-w-7xl mx-auto px-4 pb-28">
        <div className="flex gap-5 xl:gap-7" ref={containerRef}>
          {/* Sticky sidebar */}
          <SolutionsSidebar activeId={activeId} onItemClick={scrollToSection} />

          {/* Sections stack */}
          <div className="flex-1 min-w-0 space-y-5">
            {solutionSections.map((section, index) => (
              <SectionCard key={section.id} section={section} index={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
