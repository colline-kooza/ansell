"use client";

import { motion } from "motion/react";
import { solutionSections } from "./data";

interface SolutionsSidebarProps {
  activeId: string;
  onItemClick: (id: string) => void;
}

export function SolutionsSidebar({ activeId, onItemClick }: SolutionsSidebarProps) {
  return (
    <aside className="hidden lg:block w-72 xl:w-80 shrink-0">
      <div className="sticky top-28 bg-white border border-border/50 shadow-sm px-6 py-8 space-y-6 rounded-sm">
        {solutionSections.map((item, idx) => {
          const isActive = item.id === activeId;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + idx * 0.06, duration: 0.4 }}
              onClick={() => onItemClick(item.id)}
              className={`group text-left w-full transition-all duration-300 ${
                isActive ? "opacity-100" : "opacity-35 hover:opacity-65"
              }`}
            >
              <div className="flex items-baseline gap-1 mb-1">
                <span
                  className={`text-lg font-bold tracking-tight transition-colors duration-300 ${
                    isActive ? "text-primary" : "text-foreground"
                  }`}
                >
                  CB
                </span>
                <span className="text-lg font-semibold tracking-tight text-foreground">
                  {item.sidebarName}
                </span>
              </div>
              <p
                className={`text-xs font-medium tracking-wide leading-tight transition-colors duration-300 ${
                  isActive ? "text-muted-foreground" : "text-muted-foreground/60"
                }`}
              >
                {item.tagline}
              </p>

              {/* Active indicator bar */}
              <div className="mt-2 h-px w-0 bg-primary transition-all duration-500 group-hover:w-8 data-[active=true]:w-8"
                data-active={isActive}
              />
            </motion.button>
          );
        })}
      </div>
    </aside>
  );
}
