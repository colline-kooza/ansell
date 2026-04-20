"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  LayoutDashboard,
  LogIn,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";

const NAV_LINKS = [
  { label: "Real Estate", href: "/real-estate" },
  { label: "Jobs", href: "/job-board" },
  { label: "Tenders", href: "/tenders" },
  { label: "Courses", href: "/courses" },
  { label: "Video Adverts", href: "/video-adverts" },
  { label: "Companies", href: "/companies" },
];

export function FrontendNavbar() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const r = user?.role?.toLowerCase()?.replace(/[_-\s]/g, "") ?? "";
  const dashboardHref =
    r === "superadmin" || r === "admin" || r.includes("admin")
      ? "/admin/dashboard"
      : r === "owner" || r === "propertyowner"
      ? "/owner/dashboard"
      : r === "company" || r === "companyowner"
      ? "/company/dashboard"
      : "/user/dashboard";

  return (
    <nav className="fixed inset-x-0 top-0 z-50 w-full border-b border-border/70 bg-white/98 backdrop-blur-sm">
      {/* Top bar */}
      <div className="relative mx-auto flex h-20 w-full max-w-[1380px] items-center px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="relative flex size-11 items-center justify-center">
            <div className="absolute left-1 top-1 h-[26px] w-3 -skew-x-[20deg] rounded-sm bg-primary" />
            <div className="absolute right-1 top-1 h-[26px] w-3 skew-x-[20deg] rounded-sm bg-primary/85" />
          </div>
          <div className="leading-none">
            <p className="text-[1.75rem] font-black tracking-[-0.06em] text-foreground">Anasell</p>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.05em] text-muted-foreground whitespace-nowrap">
              All Opportunities. One Platform.
            </p>
          </div>
        </Link>

        {/* Desktop nav — centered */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="inline-flex items-center whitespace-nowrap rounded-lg px-3 py-2 text-[0.84rem] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right CTA */}
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

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-y-auto border-t border-border bg-white lg:hidden"
            style={{ maxHeight: "calc(100svh - 5rem)" }}
          >
            <div className="px-4 py-3 sm:px-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center border-b border-border py-3.5 text-[1rem] font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              <div className="py-5">
                {!isLoading && (
                  isAuthenticated ? (
                    <Link
                      href={dashboardHref}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20"
                    >
                      <LayoutDashboard className="size-4" />View Dashboard
                    </Link>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20"
                    >
                      <LogIn className="size-4" />Sign In
                    </Link>
                  )
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
