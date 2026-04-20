"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MessageCircle } from "lucide-react";

const CONTACT_PHONE = "+211 922 031 601";
const CONTACT_WHATSAPP = "tel:+211922031601";
const CONTACT_PHONE_HREF = "tel:+211922031601";

const footerGroups = [
  {
    title: "Marketplace",
    items: [
      { label: "Real Estate", href: "/real-estate" },
      { label: "Job Board", href: "/job-board" },
      { label: "Public Tenders", href: "/tenders" },
      { label: "Courses & Training", href: "/courses" },
      { label: "Video Adverts", href: "/video-adverts" },
      { label: "Companies Directory", href: "/companies" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About Anasell", href: "/about-us" },
      { label: "Register Your Company", href: "/become-company" },
      { label: "List a Property", href: "/become-owner" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "All Properties", href: "/real-estate" },
      { label: "Browse Jobs", href: "/job-board" },
      { label: "Browse Tenders", href: "/tenders" },
      { label: "Browse Courses", href: "/courses" },
      { label: "Browse Companies", href: "/companies" },
    ],
  },
];

const flags = [
  { code: "ss", name: "South Sudan" },
  { code: "ug", name: "Uganda" },
  { code: "ke", name: "Kenya" },
  { code: "rw", name: "Rwanda" },
  { code: "ae", name: "UAE" },
];

const socialLinks = [
  {
    name: "Facebook",
    href: "https://facebook.com",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg",
  },
  {
    name: "X (Twitter)",
    href: "https://x.com",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg",
  },
  {
    name: "Instagram",
    href: "https://instagram.com",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg",
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
  },
];

export function FrontendFooter() {
  return (
    <footer className="w-full bg-white text-[#333]">
      {/* Contact strip */}
      <div className="relative overflow-hidden border-t border-border/60 bg-linear-to-b from-[#f6f8fb] via-[#eef3fa] to-[#edf3fb]">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(180,253,131,0.20),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 h-16 w-full bg-white/55 [clip-path:ellipse(76%_58%_at_50%_100%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-4 md:px-10 md:py-5 lg:px-12 xl:px-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: brand + tagline */}
            <div className="z-10 min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Contact Anasell
              </span>
              <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.04em] text-foreground md:text-2xl">
                All Opportunities. One Platform.
              </h2>
              <p className="mt-1.5 max-w-lg text-sm leading-6 text-muted-foreground">
                South Sudan&apos;s digital hub for real estate, jobs, tenders, courses, and verified businesses.
              </p>
            </div>

            {/* Right: flags + contacts */}
            <div className="z-10 flex shrink-0 flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {flags.map((flag) => (
                  <div
                    key={flag.code}
                    className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white shadow-[0_8px_16px_-12px_rgba(16,33,15,0.3)]"
                    title={flag.name}
                  >
                    <Image
                      src={`https://flagcdn.com/w80/${flag.code}.png`}
                      alt={flag.name}
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href="mailto:business@ansellhub.com"
                  className="flex items-center gap-2 text-xs text-foreground transition-colors hover:text-primary"
                >
                  <Mail size={14} className="text-muted-foreground" />
                  <span className="font-medium">business@ansellhub.com</span>
                </a>
                <a
                  href={CONTACT_PHONE_HREF}
                  className="flex items-center gap-2 text-xs text-foreground transition-colors hover:text-primary"
                >
                  <Phone size={14} className="text-muted-foreground" />
                  <span className="font-medium">{CONTACT_PHONE}</span>
                </a>
                <a
                  href={CONTACT_WHATSAPP}
                  className="flex items-center gap-2 text-xs text-foreground transition-colors hover:text-primary"
                >
                  <MessageCircle size={14} className="text-muted-foreground" />
                  <span className="font-medium">WhatsApp: {CONTACT_PHONE}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Links grid */}
      <div className="bg-white px-6 pb-3 pt-4 md:px-10 lg:px-12 xl:px-16">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr]">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-foreground">
                {group.title}
              </h4>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="line-clamp-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Follow Us */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-foreground">Follow Us</h4>
            <p className="hidden text-[11px] leading-4 text-muted-foreground sm:block">
              Stay connected for the latest listings and updates.
            </p>
            <div className="flex gap-2.5">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.name}
                  className="flex h-4 w-4 items-center justify-center transition-transform hover:scale-110"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={social.logoUrl}
                    alt={`${social.name} Logo`}
                    className="h-full w-full object-contain"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Contact Us */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-foreground">Contact Us</h4>
            <div className="space-y-1.5">
              <a
                href={CONTACT_PHONE_HREF}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <Phone size={11} />
                {CONTACT_PHONE}
              </a>
              <a
                href={CONTACT_WHATSAPP}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <MessageCircle size={11} />
                WhatsApp Available
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mx-auto mt-4 max-w-7xl border-t border-border/40 pt-2">
          <p className="text-center text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Anasell. All rights reserved. &nbsp;|&nbsp;{" "}
            <Link href="/about-us" className="hover:text-foreground transition-colors">About Us</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
