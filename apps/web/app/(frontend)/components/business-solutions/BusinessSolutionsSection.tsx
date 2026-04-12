"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Briefcase,
  Building2,
  ChevronRight,
  GraduationCap,
  Newspaper,
  ScrollText,
  Sparkle,
  Store,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface CardData {
  title: string;
  summary: string;
  metric: string;
  visualLabel: string;
  icon: ReactNode;
  background: string;
  image: string;
  type?: string;
}

interface TabData {
  id: string;
  eyebrow: string;
  label: string;
  shortLabel: string;
  title: string;
  description: string;
  accent: string;
  accentSoft: string;
  href: string;
  icon: ReactNode;
  highlights: string[];
  cards: CardData[];
}

const TABS: TabData[] = [
  {
    id: "real-estate",
    eyebrow: "Property Listings",
    label: "Real Estate",
    shortLabel: "Real Estate",
    title: "Buy, rent, or lease property across South Sudan.",
    description:
      "Browse verified residential and commercial listings in Juba, Malakal, Wau, Bentiu, and beyond. From apartments and land to office spaces and commercial leases.",
    accent: "#b4fd83",
    accentSoft: "rgba(180,253,131,0.18)",
    href: "/real-estate",
    icon: <Building2 className="size-4.5" />,
    highlights: ["Residential", "Commercial", "Land for Sale"],
    cards: [
      {
        title: "Rentals",
        summary: "Furnished and unfurnished homes, apartments, and villas available for rent across SSD cities.",
        metric: "298 active listings",
        visualLabel: "For Rent",
        icon: <Building2 className="size-4" />,
        image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80",
        type: "rental",
        background:
          "linear-gradient(160deg, rgba(16,33,15,0.82) 0%, rgba(48,89,43,0.70) 42%, rgba(180,253,131,0.52) 100%)",
      },
      {
        title: "Land for Sale",
        summary: "Verified land plots in residential, commercial, and agricultural zones across South Sudan.",
        metric: "84 plots listed",
        visualLabel: "Land",
        icon: <Building2 className="size-4" />,
        image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80",
        type: "land",
        background:
          "linear-gradient(160deg, rgba(16,33,15,0.82) 0%, rgba(70,104,53,0.70) 44%, rgba(217,247,193,0.62) 100%)",
      },
      {
        title: "Commercial Leases",
        summary: "Office spaces, retail units, and warehouses available for lease in key business districts.",
        metric: "42 commercial spaces",
        visualLabel: "Commercial",
        icon: <Store className="size-4" />,
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80",
        type: "commercial",
        background:
          "linear-gradient(160deg, rgba(17,40,25,0.82) 0%, rgba(63,111,56,0.70) 40%, rgba(142,207,95,0.52) 100%)",
      },
      {
        title: "Apartments",
        summary: "Modern apartments in Juba, Malakal, and Wau with verified ownership and clear pricing.",
        metric: "127 apartments",
        visualLabel: "Apartments",
        icon: <Building2 className="size-4" />,
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80",
        type: "apartment",
        background:
          "linear-gradient(160deg, rgba(21,37,17,0.82) 0%, rgba(55,92,44,0.70) 45%, rgba(205,241,169,0.62) 100%)",
      },
    ],
  },
  {
    id: "job-board",
    eyebrow: "Career Opportunities",
    label: "Job Board",
    shortLabel: "Jobs",
    title: "Find jobs from NGOs, UN agencies, and private companies.",
    description:
      "Browse hundreds of open positions across humanitarian, government, and private sectors. From WFP and ICRC to NilePet and Juba Tech Hub — all in one place.",
    accent: "#63d6ff",
    accentSoft: "rgba(99,214,255,0.18)",
    href: "/job-board",
    icon: <Briefcase className="size-4.5" />,
    highlights: ["NGO & UN Roles", "Government Jobs", "Private Sector"],
    cards: [
      {
        title: "NGO & UN Jobs",
        summary: "Roles from WFP, ICRC, Save the Children, Medair, FAO, and Action Against Hunger in South Sudan.",
        metric: "97 active roles",
        visualLabel: "NGO / UN",
        icon: <Briefcase className="size-4" />,
        image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&q=80",
        background:
          "linear-gradient(160deg, rgba(12,34,43,0.82) 0%, rgba(14,98,126,0.70) 44%, rgba(99,214,255,0.52) 100%)",
      },
      {
        title: "Government Jobs",
        summary: "Vacancies from South Sudan ministries, constitutional bodies, and public institutions.",
        metric: "34 government posts",
        visualLabel: "Government",
        icon: <Briefcase className="size-4" />,
        image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&q=80",
        background:
          "linear-gradient(160deg, rgba(13,30,41,0.82) 0%, rgba(15,86,117,0.70) 46%, rgba(173,237,255,0.62) 100%)",
      },
      {
        title: "Private Sector",
        summary: "Opportunities from NilePet, Juba Tech Hub, Global Business Center, Shell South Sudan, and more.",
        metric: "87 private roles",
        visualLabel: "Private",
        icon: <Briefcase className="size-4" />,
        image: "https://images.unsplash.com/photo-1497366754035-f200581f7b6f?w=400&q=80",
        background:
          "linear-gradient(160deg, rgba(10,32,42,0.82) 0%, rgba(16,98,122,0.70) 40%, rgba(116,223,255,0.52) 100%)",
      },
      {
        title: "Upload Your CV",
        summary: "Create your candidate profile and get discovered by top employers across South Sudan.",
        metric: "4,718 applications made",
        visualLabel: "Candidates",
        icon: <Briefcase className="size-4" />,
        image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80",
        background:
          "linear-gradient(160deg, rgba(11,31,39,0.82) 0%, rgba(18,91,110,0.70) 44%, rgba(186,241,255,0.62) 100%)",
      },
    ],
  },
  {
    id: "tenders",
    eyebrow: "Procurement Opportunities",
    label: "Public Tenders",
    shortLabel: "Tenders",
    title: "Bid on government and NGO procurement tenders.",
    description:
      "Find open procurement tenders from South Sudan ministries, UN agencies, and INGOs. Register as a supplier and never miss a deadline.",
    accent: "#f2b94b",
    accentSoft: "rgba(242,185,75,0.18)",
    href: "/tenders",
    icon: <ScrollText className="size-4.5" />,
    highlights: ["Government Tenders", "NGO Procurement", "Supplier Registration"],
    cards: [
      {
        title: "Government Tenders",
        summary: "Open procurement from Ministry of Health, Roads & Bridges, Education, and other SSD bodies.",
        metric: "13 government tenders",
        visualLabel: "Government",
        icon: <ScrollText className="size-4" />,
        image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80",
        background:
          "linear-gradient(160deg, rgba(36,29,26,0.82) 0%, rgba(108,76,26,0.70) 44%, rgba(242,185,75,0.52) 100%)",
      },
      {
        title: "NGO Procurement",
        summary: "Tender opportunities from WFP, ICRC, Save the Children, FAO, and international agencies.",
        metric: "10 NGO tenders",
        visualLabel: "NGO / INGO",
        icon: <ScrollText className="size-4" />,
        image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&q=80",
        background:
          "linear-gradient(160deg, rgba(35,28,19,0.82) 0%, rgba(120,84,28,0.70) 46%, rgba(255,225,161,0.62) 100%)",
      },
      {
        title: "Total Open Value",
        summary: "USD 18.4M in procurement opportunities currently open for supplier expressions of interest.",
        metric: "USD 18.4M open",
        visualLabel: "Open Value",
        icon: <ScrollText className="size-4" />,
        image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80",
        background:
          "linear-gradient(160deg, rgba(31,25,20,0.82) 0%, rgba(98,69,35,0.70) 42%, rgba(236,196,111,0.62) 100%)",
      },
      {
        title: "Register as Supplier",
        summary: "Create your supplier profile, get deadline alerts, and submit bids directly on ANASELL.",
        metric: "412 registered suppliers",
        visualLabel: "Suppliers",
        icon: <Store className="size-4" />,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
        background:
          "linear-gradient(160deg, rgba(38,31,24,0.82) 0%, rgba(112,89,42,0.70) 48%, rgba(247,210,131,0.62) 100%)",
      },
    ],
  },
  {
    id: "courses",
    eyebrow: "Skills & Certification",
    label: "Courses & Training",
    shortLabel: "Courses",
    title: "Develop your skills with professional training in SSD.",
    description:
      "Find accredited courses, certifications, and vocational training programmes from universities, institutes, and professional bodies operating in South Sudan.",
    accent: "#37d8c0",
    accentSoft: "rgba(55,216,192,0.18)",
    href: "/courses",
    icon: <GraduationCap className="size-4.5" />,
    highlights: ["Certifications", "Technical Skills", "Business & Finance"],
    cards: [
      {
        title: "Certifications",
        summary: "Accredited programmes from University of Juba, Star Training Institute, and Nile Safety Academy.",
        metric: "84 courses live",
        visualLabel: "Certified",
        icon: <GraduationCap className="size-4" />,
        image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=80",
        background:
          "linear-gradient(160deg, rgba(12,34,29,0.82) 0%, rgba(16,103,89,0.70) 44%, rgba(55,216,192,0.52) 100%)",
      },
      {
        title: "Technical Skills",
        summary: "Engineering, construction safety, IT, and vocational training available in South Sudan.",
        metric: "28 technical courses",
        visualLabel: "Technical",
        icon: <GraduationCap className="size-4" />,
        image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&q=80",
        background:
          "linear-gradient(160deg, rgba(12,34,29,0.82) 0%, rgba(18,108,92,0.70) 48%, rgba(175,245,232,0.62) 100%)",
      },
      {
        title: "Business & Finance",
        summary: "Project management, financial management for NGOs, procurement, and entrepreneurship courses.",
        metric: "31 business courses",
        visualLabel: "Business",
        icon: <GraduationCap className="size-4" />,
        image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",
        background:
          "linear-gradient(160deg, rgba(14,32,29,0.82) 0%, rgba(21,95,83,0.70) 44%, rgba(98,226,205,0.52) 100%)",
      },
      {
        title: "2,341 Enrolled",
        summary: "Learners from Juba, Malakal, Wau, and beyond are upskilling through ANASELL Courses.",
        metric: "68% completion rate",
        visualLabel: "Learners",
        icon: <GraduationCap className="size-4" />,
        image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80",
        background:
          "linear-gradient(160deg, rgba(11,31,27,0.82) 0%, rgba(19,100,86,0.70) 44%, rgba(194,248,239,0.62) 100%)",
      },
    ],
  },
  {
    id: "companies",
    eyebrow: "Business Directory",
    label: "Companies",
    shortLabel: "Companies",
    title: "Discover verified businesses operating in South Sudan.",
    description:
      "A trusted directory of companies, NGOs, and government agencies active in South Sudan — complete with contact information, industry tags, and verified status.",
    accent: "#a78bfa",
    accentSoft: "rgba(167,139,250,0.18)",
    href: "/companies",
    icon: <Store className="size-4.5" />,
    highlights: ["Verified Businesses", "NGOs & INGOs", "Government Bodies"],
    cards: [
      {
        title: "Oil & Energy",
        summary: "NilePet Corporation, Shell South Sudan, and energy sector companies operating in SSD.",
        metric: "22 energy companies",
        visualLabel: "Energy",
        icon: <Store className="size-4" />,
        image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&q=80",
        background:
          "linear-gradient(160deg, rgba(20,15,35,0.82) 0%, rgba(60,40,110,0.70) 44%, rgba(167,139,250,0.52) 100%)",
      },
      {
        title: "Humanitarian Sector",
        summary: "WFP, ICRC, Save the Children, Medair, FAO, and 80+ INGOs verified on the platform.",
        metric: "84 NGOs listed",
        visualLabel: "NGOs",
        icon: <Store className="size-4" />,
        image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&q=80",
        background:
          "linear-gradient(160deg, rgba(18,13,33,0.82) 0%, rgba(55,38,100,0.70) 46%, rgba(196,181,255,0.62) 100%)",
      },
      {
        title: "Technology",
        summary: "Juba Tech Hub, Global Business Center, and emerging tech firms building digital South Sudan.",
        metric: "41 tech companies",
        visualLabel: "Technology",
        icon: <Store className="size-4" />,
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80",
        background:
          "linear-gradient(160deg, rgba(16,12,30,0.82) 0%, rgba(52,35,95,0.70) 40%, rgba(183,160,255,0.52) 100%)",
      },
      {
        title: "Verify Your Business",
        summary: "Get ANASELL-verified status and increase trust with clients, partners, and government bodies.",
        metric: "634 companies listed",
        visualLabel: "Get Verified",
        icon: <Store className="size-4" />,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
        background:
          "linear-gradient(160deg, rgba(14,11,28,0.82) 0%, rgba(48,34,88,0.70) 44%, rgba(214,205,255,0.62) 100%)",
      },
    ],
  },
  {
    id: "news",
    eyebrow: "Market Intelligence",
    label: "News & Updates",
    shortLabel: "News",
    title: "Stay informed on South Sudan business and policy news.",
    description:
      "Local business news, regulatory updates, tender announcements, and economic intelligence — curated for companies, investors, and professionals operating in South Sudan.",
    accent: "#fb923c",
    accentSoft: "rgba(251,146,60,0.18)",
    href: "/news",
    icon: <Newspaper className="size-4.5" />,
    highlights: ["Regulatory Updates", "Tender Alerts", "Market Intelligence"],
    cards: [
      {
        title: "Regulatory Updates",
        summary: "New policies from the Ministry of Finance, Ministry of Commerce, and South Sudan Revenue Authority.",
        metric: "12 articles this week",
        visualLabel: "Regulatory",
        icon: <Newspaper className="size-4" />,
        image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80",
        background:
          "linear-gradient(160deg, rgba(36,20,10,0.82) 0%, rgba(120,55,20,0.70) 44%, rgba(251,146,60,0.52) 100%)",
      },
      {
        title: "Tender Digest",
        summary: "Weekly roundup of new procurement tenders published by government bodies and NGOs across SSD.",
        metric: "Published every Monday",
        visualLabel: "Tenders",
        icon: <ScrollText className="size-4" />,
        image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&q=80",
        background:
          "linear-gradient(160deg, rgba(34,18,8,0.82) 0%, rgba(110,50,18,0.70) 46%, rgba(253,186,116,0.62) 100%)",
      },
      {
        title: "Business Intelligence",
        summary: "Market reports, sector analyses, and investment updates relevant to South Sudan's economy.",
        metric: "42,800 reads/month",
        visualLabel: "Intelligence",
        icon: <Newspaper className="size-4" />,
        image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80",
        background:
          "linear-gradient(160deg, rgba(32,16,6,0.82) 0%, rgba(100,45,16,0.70) 42%, rgba(254,215,170,0.62) 100%)",
      },
      {
        title: "Infrastructure News",
        summary: "Roads, energy, and construction project updates from the Ministry of Roads & Bridges and donors.",
        metric: "Latest from Juba",
        visualLabel: "Infrastructure",
        icon: <Newspaper className="size-4" />,
        image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80",
        background:
          "linear-gradient(160deg, rgba(30,14,4,0.82) 0%, rgba(95,40,14,0.70) 44%, rgba(255,228,196,0.62) 100%)",
      },
    ],
  },
];

export function BusinessSolutionsSection() {
  const [activeTabId, setActiveTabId] = useState(TABS[0].id);
  const activeTab = TABS.find((tab) => tab.id === activeTabId) ?? TABS[0];

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(244,248,251,0.98)_100%)] py-20">
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(180,253,131,0.18),transparent_70%)]" />
      <div className="absolute left-[-8rem] top-28 h-48 w-48 rounded-full bg-primary/10 blur-[7rem]" />
      <div className="absolute right-[-6rem] top-16 h-44 w-44 rounded-full bg-emerald-200/25 blur-[6rem]" />

      <div className="relative mx-auto max-w-7xl px-4">
        {/* Section header */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-5 inline-flex items-center gap-2 rounded-sm border border-border/20 bg-white/80 px-4 py-2"
          >
            <Sparkle className="size-3 text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Platform Modules
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 }}
            className="text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl"
          >
            Six Modules, One Platform
            <span
              className="block transition-colors duration-500"
              style={{ color: activeTab.accent }}
            >
              Built for South Sudan
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12 }}
            className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted-foreground"
          >
            ANASELL brings together Real Estate, Jobs, Tenders, Courses, Companies, and News
            into one trusted digital hub for South Sudan.
          </motion.p>
        </div>

        {/* Tab selectors */}
        <div className="mt-12 flex overflow-x-auto border border-border/15 scrollbar-hide sm:grid sm:grid-cols-2 xl:grid-cols-6 items-stretch">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id)}
                className={cn(
                  "group relative shrink-0 w-[240px] sm:w-auto overflow-hidden px-4 py-5 text-left transition-all duration-300",
                  "border-r border-border/15 last:border-r-0",
                  isActive
                    ? "rounded-sm bg-foreground"
                    : "bg-white/70 hover:bg-white",
                )}
              >
                <div className="relative flex items-start gap-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm transition-colors duration-300"
                    style={
                      isActive
                        ? { backgroundColor: tab.accent, color: "#10210f" }
                        : { backgroundColor: tab.accentSoft, color: tab.accent }
                    }
                  >
                    {tab.icon}
                  </span>

                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-[9px] font-semibold uppercase tracking-[0.22em] transition-colors duration-300",
                        isActive ? "text-white/40" : "text-muted-foreground",
                      )}
                    >
                      {tab.eyebrow}
                    </p>
                    <h3
                      className={cn(
                        "mt-1 text-xs font-semibold leading-tight transition-colors duration-300",
                        isActive ? "text-white" : "text-foreground",
                      )}
                    >
                      {tab.shortLabel}
                    </h3>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content panel */}
        <div className="border border-t-0 border-border/15 bg-white p-5 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {/* Panel header */}
              <div className="flex flex-col gap-6 border-b border-border/15 pb-8 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div
                    className="inline-flex items-center gap-2 rounded-sm px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground"
                    style={{ backgroundColor: activeTab.accentSoft }}
                  >
                    <span
                      className="h-1.5 w-1.5"
                      style={{ backgroundColor: activeTab.accent }}
                    />
                    {activeTab.eyebrow}
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-[1.75rem]">
                    {activeTab.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                    {activeTab.description}
                  </p>
                </div>

                <div className="rounded-sm border border-border/15 bg-secondary/20 p-5 lg:w-[22rem]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Browse By Category
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {activeTab.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="rounded-sm border border-border/25 bg-white px-3 py-1.5 text-[11px] font-medium text-foreground"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                  <a
                    href={activeTab.href}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-foreground transition hover:text-muted-foreground"
                  >
                    Browse all {activeTab.label}
                    <ArrowRight className="size-4" />
                  </a>
                </div>
              </div>

              {/* Cards grid */}
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {activeTab.cards.map((card, index) => (
                  <motion.article
                    key={card.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 + index * 0.05, duration: 0.26 }}
                    whileHover={{ y: -3 }}
                    className="group overflow-hidden rounded-sm border border-border/15 bg-card"
                  >
                    {/* Card visual */}
                    <div className="relative aspect-[1.3] overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card.image}
                        alt=""
                        aria-hidden
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div
                        className="absolute inset-0"
                        style={{ backgroundImage: card.background }}
                      />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_40%)]" />

                      <div className="relative flex h-full flex-col justify-between p-4 text-white">
                        <div className="flex items-start justify-between gap-3">
                          <span className="inline-flex rounded-sm border border-white/15 bg-black/16 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/88 backdrop-blur-sm">
                            {card.visualLabel}
                          </span>
                          <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-white/15 bg-white/10 backdrop-blur-sm">
                            {card.icon}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          <div className="h-px w-full bg-white/14" />
                          <div className="inline-flex rounded-sm border border-white/14 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/82 backdrop-blur-sm">
                            {card.metric}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="px-3 pb-3 pt-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold leading-tight text-foreground">
                            {card.title}
                          </h4>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {card.summary}
                          </p>
                        </div>
                        <span
                          className="mt-1 h-2 w-2 shrink-0"
                          style={{ backgroundColor: activeTab.accent }}
                        />
                      </div>

                      <a
                        href={card.type ? `${activeTab.href}?type=${card.type}` : activeTab.href}
                        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-sm border border-border/40 bg-white px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground transition hover:border-foreground hover:bg-foreground hover:text-white"
                      >
                        Browse {activeTab.shortLabel}
                        <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                      </a>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
