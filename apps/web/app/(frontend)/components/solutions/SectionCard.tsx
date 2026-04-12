"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { SolutionSection } from "./data";

interface SectionCardProps {
  section: SolutionSection;
  index: number;
}

export function SectionCard({ section, index }: SectionCardProps) {
  return (
    <section
      id={section.id}
      data-section-id={section.id}
      className="scroll-mt-24 rounded-sm "
    >
      <div className="px-10 xl:px-14 py-14 shadow-sm border border-border/40 bg-card">
        {/* Header row */}
        <div className="flex items-start justify-between mb-10">
          <div className="max-w-lg">
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="text-2xl md:text-[1.75rem] font-semibold tracking-tight text-foreground mb-3 leading-snug"
            >
              {section.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.12 }}
              className="text-sm text-muted-foreground leading-relaxed"
            >
              {section.description}
            </motion.p>
          </div>

          {/* Arrow CTA */}
          <motion.a
            href={section.href}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            className="shrink-0 ml-6 w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/30 hover:shadow-primary/50 transition-shadow duration-300"
            aria-label={`Learn more about ${section.title}`}
          >
            <ArrowRight className="w-4.5 h-4.5 text-primary-foreground" strokeWidth={2.2} />
          </motion.a>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {section.features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 + idx * 0.08 }}
              className="flex items-start gap-3"
            >
              {/* Icon box */}
              <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-foreground shadow-sm">
                {feature.icon}
              </div>
              <p className="text-[12.5px] font-medium text-foreground/80 leading-snug pt-1">
                {feature.title}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-border/70 mb-8" />

        {/* Services grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-0">
          {section.services.map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.15 + idx * 0.06 }}
              className={`group flex flex-col items-center text-center px-3 py-5 cursor-pointer transition-all duration-300 hover:bg-primary/8 rounded-xl ${
                idx > 0 ? "border-l border-border/50" : ""
              }`}
            >
              <div className="mb-4 text-muted-foreground/60 group-hover:text-foreground transition-colors duration-300">
                {service.icon}
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors duration-300 leading-tight">
                {service.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
