"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Briefcase,
  ChevronDown,
  FileText,
  Film,
  GraduationCap,
  Home,
  LayoutDashboard,
  Landmark,
  LogIn,
  MapPin,
  Menu,
  Megaphone,
  Newspaper,
  Tag,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

// ─── Nav structure ─────────────────────────────────────────────────────────────

type NavLink = { label: string; href: string; icon: React.ElementType; description: string };

type NavItem = {
  label: string;
  href: string;
  megaMenu?: {
    title: string;
    description: string;
    links: NavLink[];
  };
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Trending",
    href: "/trending",
  },
  {
    label: "Real Estate",
    href: "/real-estate",
    megaMenu: {
      title: "Property Listings",
      description: "Browse rental, sale, and lease properties across South Sudan.",
      links: [
        { label: "All Properties", href: "/real-estate", icon: Home, description: "View all active listings" },
        { label: "Apartments", href: "/real-estate?category=apartment", icon: Building2, description: "City apartments & condos" },
        { label: "Land & Plots", href: "/real-estate?category=land", icon: MapPin, description: "Land for sale or lease" },
        { label: "Commercial", href: "/real-estate?category=commercial", icon: Landmark, description: "Offices & retail space" },
        { label: "List Property", href: "/become-owner", icon: ArrowRight, description: "Become a property owner" },
      ],
    },
  },
  {
    label: "Jobs",
    href: "/job-board",
    megaMenu: {
      title: "Job Board",
      description: "Find your next role or post opportunities for top talent.",
      links: [
        { label: "Browse Jobs", href: "/job-board", icon: Briefcase, description: "All active job listings" },
        { label: "NGO & Aid", href: "/job-board?category=NGO", icon: Users, description: "Humanitarian & development" },
        { label: "IT & Tech", href: "/job-board?category=IT+%26+Tech", icon: TrendingUp, description: "Technology roles" },
        { label: "Remote Jobs", href: "/job-board?city=Remote", icon: MapPin, description: "Work from anywhere" },
        { label: "Companies", href: "/companies", icon: Building2, description: "Browse hiring companies" },
      ],
    },
  },
  {
    label: "Tenders",
    href: "/tenders",
    megaMenu: {
      title: "Public Tenders",
      description: "Browse government and corporate procurement opportunities.",
      links: [
        { label: "All Tenders", href: "/tenders", icon: FileText, description: "Active procurement listings" },
        { label: "Government", href: "/tenders?category=government", icon: Landmark, description: "Public sector tenders" },
        { label: "NGO Tenders", href: "/tenders?category=ngo", icon: Users, description: "Aid & development contracts" },
        { label: "Trending News", href: "/trending", icon: TrendingUp, description: "News & market updates" },
      ],
    },
  },
  {
    label: "Courses",
    href: "/courses",
    megaMenu: {
      title: "Training & Courses",
      description: "Upskill with industry-relevant courses delivered online and in-person.",
      links: [
        { label: "All Courses", href: "/courses", icon: GraduationCap, description: "Browse all available courses" },
        { label: "Business", href: "/courses?category=business", icon: Briefcase, description: "Management & entrepreneurship" },
        { label: "Technology", href: "/courses?category=technology", icon: TrendingUp, description: "IT, software & data skills" },
        { label: "Agriculture", href: "/courses?category=agriculture", icon: Home, description: "Modern farming techniques" },
        { label: "Teach Here", href: "/courses/instruct", icon: BookOpen, description: "Share your expertise & earn" },
      ],
    },
  },
  {
    label: "Video Adverts",
    href: "/video-adverts",
    megaMenu: {
      title: "Video Advertising",
      description: "Promote your business or product to thousands of Ansell visitors daily.",
      links: [
        { label: "Browse Adverts", href: "/video-adverts", icon: Film, description: "Watch featured business videos" },
        { label: "Advertise Here", href: "/video-adverts/submit", icon: Megaphone, description: "Submit your video ad" },
        { label: "Companies", href: "/companies", icon: Building2, description: "Explore verified companies" },
        { label: "Trending", href: "/trending", icon: Newspaper, description: "Business & industry updates" },
      ],
    },
  },
  {
    label: "Companies",
    href: "/companies",
    megaMenu: {
      title: "Company Directory",
      description: "Discover verified businesses, employers, and organisations across South Sudan.",
      links: [
        { label: "All Companies", href: "/companies", icon: Building2, description: "Full company directory" },
        { label: "Technology", href: "/companies?sector=technology", icon: TrendingUp, description: "Tech & software companies" },
        { label: "Real Estate", href: "/companies?sector=real_estate", icon: Landmark, description: "Property developers" },
        { label: "NGO & Aid", href: "/companies?sector=ngo", icon: Users, description: "Humanitarian organisations" },
        { label: "Register Company", href: "/companies/register", icon: Tag, description: "List your company on Ansell" },
      ],
    },
  },
];

// ─── FrontendNavbar ────────────────────────────────────────────────────────────

export function FrontendNavbar() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Determine dashboard role path
  const r = user?.role?.toLowerCase()?.replace(/[_-\s]/g, "") ?? "";
  const dashboardHref =
    r === "superadmin" || r === "admin" || r.includes("admin")
      ? "/admin/dashboard"
      : r === "owner" || r === "propertyowner"
      ? "/owner/dashboard"
      : r === "company" || r === "companyowner"
      ? "/company/dashboard"
      : "/user/dashboard";

  // Close mega menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveTab(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeItem = NAV_ITEMS.find((n) => n.label === activeTab);

  return (
    <nav
      ref={navRef}
      className="fixed inset-x-0 top-0 z-50 w-full border-b border-border/70 bg-white/98 backdrop-blur-sm"
      onMouseLeave={() => setActiveTab(null)}
    >
      {/* Top bar */}
      <div className="relative mx-auto flex h-20 w-full max-w-[1380px] items-center px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="relative flex size-11 items-center justify-center">
            <div className="absolute left-1 top-1 h-[26px] w-3 -skew-x-[20deg] rounded-sm bg-primary" />
            <div className="absolute right-1 top-1 h-[26px] w-3 skew-x-[20deg] rounded-sm bg-primary/85" />
          </div>
          <div className="leading-none">
            <p className="text-[1.75rem] font-black tracking-[-0.06em] text-foreground">Ansell</p>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Opportunity Central
            </p>
          </div>
        </Link>

        {/* Desktop nav — centered */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex">
          {NAV_ITEMS.map((item) => (
            <NavButton
              key={item.label}
              item={item}
              isActive={activeTab === item.label}
              onMouseEnter={() => setActiveTab(item.label)}
            />
          ))}
        </div>

        {/* Right CTA — auth aware */}
        <div className="ml-auto hidden items-center gap-3 lg:flex">
          {!isLoading && (
            isAuthenticated ? (
              <Link
                href={dashboardHref}
                className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-[0.84rem] font-semibold text-primary-foreground transition hover:brightness-95"
              >
                <LayoutDashboard className="size-4" />
                View Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-[0.86rem] font-bold text-primary-foreground transition hover:brightness-105 shadow-md shadow-primary/20"
              >
                <LogIn className="size-4" />
                Sign In
              </Link>
            )
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((v) => !v)}
          className="ml-auto flex size-11 items-center justify-center rounded-xl border border-border bg-card text-foreground lg:hidden"
          aria-label="Toggle navigation"
        >
          {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* ── Desktop mega menu — hover only ── */}
      <AnimatePresence mode="wait">
        {activeTab && activeItem?.megaMenu ? (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute inset-x-0 top-full hidden border-b border-border/60 bg-white shadow-lg lg:block"
          >
            <div className="mx-auto grid max-w-[1380px] grid-cols-[0.85fr_1.15fr] gap-10 px-8 py-8">
              {/* Left */}
              <div className="max-w-sm pt-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {activeTab}
                </p>
                <h2 className="mt-2.5 text-[1.65rem] font-semibold leading-[1.08] tracking-[-0.04em] text-foreground">
                  {activeItem.megaMenu.title}
                </h2>
                <p className="mt-3 text-[0.84rem] leading-6 text-muted-foreground">
                  {activeItem.megaMenu.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {activeItem.megaMenu.links.slice(0, 3).map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setActiveTab(null)}
                      className="rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-medium text-foreground transition hover:bg-primary/10 hover:border-primary/40"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right link cards */}
              <div className="grid grid-cols-2 gap-2.5">
                {activeItem.megaMenu.links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group flex items-start gap-3 rounded-xl border border-border/60 bg-white px-4 py-3.5 transition-colors hover:bg-muted hover:border-border"
                      onClick={() => setActiveTab(null)}
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition group-hover:bg-primary/20">
                        <Icon className="size-4 text-primary" />
                      </span>
                      <div>
                        <p className="text-[13px] font-semibold text-foreground">{link.label}</p>
                        <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{link.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {isMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-y-auto border-t border-border bg-white lg:hidden"
            style={{ maxHeight: "calc(100svh - 5rem)" }}
          >
            <div className="px-4 py-3 sm:px-6">
              {NAV_ITEMS.map((item) => {
                const isExpanded = mobileExpanded === item.label;
                return (
                  <div key={item.label} className="border-b border-border">
                    <div className="flex items-center justify-between">
                      {/* Direct link on the label */}
                      <Link
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex-1 py-3.5 text-[1rem] font-semibold text-foreground"
                      >
                        {item.label}
                      </Link>
                      {item.megaMenu && (
                        <button
                          type="button"
                          onClick={() => setMobileExpanded((v) => (v === item.label ? null : item.label))}
                          className="px-2 py-3.5"
                        >
                          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-200", isExpanded ? "rotate-180" : "")} />
                        </button>
                      )}
                    </div>

                    <AnimatePresence initial={false}>
                      {isExpanded && item.megaMenu ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-1 gap-1 pb-4">
                            {item.megaMenu.links.map((link) => {
                              const Icon = link.icon;
                              return (
                                <Link
                                  key={link.href}
                                  href={link.href}
                                  onClick={() => { setIsMenuOpen(false); setMobileExpanded(null); }}
                                  className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                >
                                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                                    <Icon className="size-3.5 text-primary" />
                                  </span>
                                  <div>
                                    <span className="font-medium text-foreground">{link.label}</span>
                                    <span className="ml-2 text-[11px] text-muted-foreground">{link.description}</span>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* Mobile Auth CTA */}
              <div className="py-5">
                {!isLoading && (
                  isAuthenticated ? (
                    <Link href={dashboardHref} onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
                      <LayoutDashboard className="size-4" />View Dashboard
                    </Link>
                  ) : (
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">
                      <LogIn className="size-4" />Sign In
                    </Link>
                  )
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </nav>
  );
}

// ─── NavButton ─────────────────────────────────────────────────────────────────

function NavButton({ item, isActive, onMouseEnter }: { item: NavItem; isActive: boolean; onMouseEnter: () => void }) {
  return (
    <div onMouseEnter={onMouseEnter} className="relative">
      <Link
        href={item.href}
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-[0.84rem] font-medium transition-colors",
          isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        {item.label}
        {item.megaMenu && (
          <ChevronDown className={cn("size-3.5 transition-transform duration-200", isActive ? "rotate-180" : "")} />
        )}
      </Link>
    </div>
  );
}
