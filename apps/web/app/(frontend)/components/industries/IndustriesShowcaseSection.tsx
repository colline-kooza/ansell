"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Sparkle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  INDUSTRY_SHOWCASE_START_INDEX,
  industryShowcaseItems,
} from "./showcase-data";

const PROGRESS_THUMB_WIDTH = 16;

export function IndustriesShowcaseSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    containScroll: "trimSnaps",
    dragFree: false,
    loop: false,
    skipSnaps: false,
    startIndex: INDUSTRY_SHOWCASE_START_INDEX,
  });
  const [selectedIndex, setSelectedIndex] = useState(
    INDUSTRY_SHOWCASE_START_INDEX,
  );
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const syncCarouselState = useCallback(() => {
    if (!emblaApi) {
      return;
    }

    const progress = emblaApi.scrollProgress();

    setSelectedIndex(emblaApi.selectedScrollSnap());
    setScrollProgress(Number.isFinite(progress) ? progress : 0);
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    const frame = window.requestAnimationFrame(syncCarouselState);
    emblaApi.on("reInit", syncCarouselState);
    emblaApi.on("select", syncCarouselState);
    emblaApi.on("scroll", syncCarouselState);

    return () => {
      window.cancelAnimationFrame(frame);
      emblaApi.off("reInit", syncCarouselState);
      emblaApi.off("select", syncCarouselState);
      emblaApi.off("scroll", syncCarouselState);
    };
  }, [emblaApi, syncCarouselState]);

  const progressOffset = Math.min(
    Math.max(scrollProgress, 0),
    1,
  ) * (100 - PROGRESS_THUMB_WIDTH);

  return (
    <section className="overflow-hidden bg-white py-20 sm:py-2">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-6 lg:px-8">
        <div className="max-w-[840px]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.4 }}
            className="mb-5 flex items-center gap-2.5"
          >
            <Sparkle className="size-3 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Industries
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.45, delay: 0.06 }}
            className="text-[1.7rem] font-semibold leading-[1] tracking-[-0.045em] text-foreground sm:text-[2.25rem] lg:text-[2.2rem]"
          >
            Engineering Industry-specific Excellence
            <span className="block">With AI &amp; Innovation</span>
          </motion.h2>
        </div>

        <div className="mt-12" ref={emblaRef}>
          <div className="-ml-4 flex items-stretch lg:-ml-5">
            {industryShowcaseItems.map((industry, index) => {
              const isActive = index === selectedIndex;

              return (
                <div
                  key={industry.id}
                  className="min-w-0 shrink-0 grow-0 basis-[81%] pl-4 sm:basis-[27.75rem] lg:basis-[26rem] lg:pl-5 xl:basis-[25.1rem]"
                >
                  <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: 0.45, delay: index * 0.05 }}
                    className={cn(
                      "group relative h-[22.9rem] overflow-hidden rounded-[2rem] bg-[#241d1a] sm:h-[23.85rem] lg:h-[24.5rem]",
                      isActive
                        ? "shadow-[0_26px_70px_-38px_rgba(16,33,15,0.55)]"
                        : "shadow-[0_20px_60px_-42px_rgba(16,33,15,0.45)]",
                    )}
                  >
                    <Image
                      src={industry.image}
                      alt={industry.name}
                      fill
                      sizes="(max-width: 640px) 86vw, (max-width: 1280px) 31rem, 28.75rem"
                      className={cn(
                        "absolute inset-0 h-full w-full object-cover transition-transform duration-700",
                        isActive ? "scale-100" : "scale-[1.03]",
                      )}
                      style={{ objectPosition: industry.imagePosition ?? "center" }}
                    />
                    <div
                      className={cn(
                        "absolute inset-0 transition-colors duration-300",
                        isActive
                          ? "bg-[linear-gradient(180deg,rgba(17,12,10,0.44)_0%,rgba(17,12,10,0.2)_30%,rgba(17,12,10,0.68)_100%)]"
                          : "bg-[linear-gradient(180deg,rgba(17,12,10,0.52)_0%,rgba(17,12,10,0.4)_30%,rgba(17,12,10,0.76)_100%)]",
                      )}
                    />

                    <div className="relative z-10 flex h-full flex-col p-5 sm:p-5.5 lg:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="max-w-[12ch] text-[1.45rem] font-semibold leading-[1] tracking-[-0.035em] text-white sm:text-[1.65rem]">
                          {industry.name}
                        </h3>

                        <Link
                          href={industry.href}
                          className={cn(
                            "mt-1 flex size-10 shrink-0 items-center justify-center rounded-full border backdrop-blur-sm transition-colors",
                            isActive
                              ? "border-primary bg-primary text-foreground"
                              : "border-white/85 bg-black/10 text-white",
                          )}
                          aria-label={`Open ${industry.name}`}
                        >
                          <ArrowUpRight className="size-4" strokeWidth={2.25} />
                        </Link>
                      </div>

                      <div className="mt-5 flex max-w-[95%] flex-wrap gap-1.5">
                        {industry.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex rounded-2xl border border-white/80 bg-white/5 px-2.5 py-1.5 text-[0.78rem] font-medium leading-none text-white backdrop-blur-[2px]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-auto pt-4">
                        {isActive ? (
                          <Link
                            href={industry.href}
                            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-3 py-2 text-[0.86rem] font-semibold text-foreground shadow-[0_24px_60px_-28px_rgba(180,253,131,0.95)] transition-transform duration-200 hover:-translate-y-0.5"
                          >
                            <span>Explore</span>
                            <span className="flex h-7.5 w-9 items-center justify-center rounded-lg bg-white">
                              <ArrowRight
                                className="size-3 text-foreground"
                                strokeWidth={2.3}
                              />
                            </span>
                          </Link>
                        ) : (
                          <div aria-hidden className="h-[3.75rem]" />
                        )}
                      </div>
                    </div>
                  </motion.article>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10 flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canScrollPrev}
            className="flex size-11 items-center justify-center rounded-full border border-foreground bg-white text-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Previous industry"
          >
            <ArrowLeft className="size-4.5" strokeWidth={2.4} />
          </button>

          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canScrollNext}
            className="flex size-11 items-center justify-center rounded-full border border-foreground bg-white text-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Next industry"
          >
            <ArrowRight className="size-4.5" strokeWidth={2.4} />
          </button>

          <div className="relative ml-1 h-[2px] flex-1 overflow-hidden rounded-full bg-black/12">
            <motion.span
              className="absolute top-0 h-full rounded-full bg-foreground"
              style={{ width: `${PROGRESS_THUMB_WIDTH}%` }}
              animate={{ left: `${progressOffset}%` }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
