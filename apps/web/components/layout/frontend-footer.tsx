"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";

type FooterLinkGroup = {
  title: string;
  items: string[];
};

type SocialLink = {
  name: string;
  logoUrl: string;
  href: string;
};

type Flag = {
  code: string;
  name: string;
};

const industries = [
  "Healthcare",
  "Real Estate",
  "Education",
  "Home Services",
];

const services = [
  "Premium App Development Studio",
  "Enterprise Software Development",
  "Web Development",
  "UI/UX Design",
];

const marketplaces = ["Service", "E-Commerce", "Rental"];

const quickLinks = ["Portfolio", "Why Choose Us", "How We Work"];

const flags: Flag[] = [
  { code: "ss", name: "South Sudan" },
  { code: "ug", name: "Uganda" },
  { code: "ke", name: "Kenya" },
  { code: "rw", name: "Rwanda" },
  { code: "ae", name: "UAE" },
];

const footerGroups: FooterLinkGroup[] = [
  { title: "Industries", items: industries },
  { title: "Services", items: services },
  { title: "Marketplace", items: marketplaces },
  { title: "Quick Links", items: quickLinks },
];

const socialLinks: SocialLink[] = [
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
  {
    name: "YouTube",
    href: "https://youtube.com",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg",
  },
];

export function FrontendFooter() {
  return (
    <footer className="w-full bg-white text-[#333]">
      {/* Contact strip */}
      <div className="relative overflow-hidden border-t border-border/60 bg-linear-to-b from-[#f6f8fb] via-[#eef3fa] to-[#edf3fb]">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,_rgba(180,253,131,0.20),_transparent_60%)]" />
        <div className="absolute bottom-0 left-0 h-16 w-full bg-white/55 [clip-path:ellipse(76%_58%_at_50%_100%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-3 md:px-10 md:py-4 lg:px-12 xl:px-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: brand + tagline */}
            <div className="z-10 min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Contact Ansell
              </span>
              <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.04em] text-foreground md:text-2xl">
                Let&apos;s fire up your business from Juba.
              </h2>
              <p className="mt-1.5 max-w-lg text-sm leading-6 text-muted-foreground">
                Team up with Ansell for a polished delivery experience across
                digital products, operations systems, and marketplace growth.
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
                  className="flex items-center gap-2 text-xs text-foreground transition-colors hover:text-[#5e9a31]"
                >
                  <Mail size={14} className="text-muted-foreground" />
                  <span className="font-medium">business@ansellhub.com</span>
                </a>
                <a
                  href="tel:+211000000000"
                  className="flex items-center gap-2 text-xs text-foreground transition-colors hover:text-[#5e9a31]"
                >
                  <Phone size={14} className="text-muted-foreground" />
                  <span className="font-medium">+211-000-000-000</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Links grid */}
      <div className="bg-white px-6 pb-3 pt-3 md:px-10 lg:px-12 xl:px-16">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-[0.95fr_1fr_0.8fr_0.8fr_1fr]">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground">
                {group.title}
              </h4>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item}>
                    <Link
                      href="/"
                      className="line-clamp-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="space-y-1.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-foreground">Follow Us</h4>
            <p className="hidden text-[11px] leading-4 text-muted-foreground sm:block">
              Stay connected with Ansell for the latest listings and updates.
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
        </div>

        {/* Bottom bar */}
        <div className="mx-auto mt-3 max-w-7xl border-t border-border/40 pt-2">
          <p className="text-center text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Ansell Hub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
