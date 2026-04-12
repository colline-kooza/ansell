"use client";

import Image from "next/image";
import Link from "next/link";
import type { SVGProps, ReactNode } from "react";
import { ChevronDown, Mail, Phone } from "lucide-react";
import { motion } from "motion/react";

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
  "Food Delivery",
  "Healthcare",
  "Pickup & Delivery",
  "E-Commerce Delivery",
  "Taxi and Transportation",
  "Home Services",
  "Fitness",
  "Education",
  "Real Estate",
];

const services = [
  "Premium App Development Studio",
  "Mobile App Development Juba",
  "Mobile App Development New York",
  "Enterprise Software Development",
  "Smart Contract Development",
  "Fintech Development",
  "On-Demand Development",
  "UI/UX Design",
  "Web Development",
  "Growth & Marketing",
];

const marketplaces = [
  "Service",
  "Freelancer",
  "E-Commerce",
  "Peer-to-Peer",
  "Rental",
];

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
      <div className="relative overflow-hidden border-t border-border/60 bg-linear-to-b from-[#f6f8fb] via-[#eef3fa] to-[#edf3fb]">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(180,253,131,0.24),_transparent_60%)]" />
        <div className="absolute right-0 top-0 h-full w-[44%] bg-[radial-gradient(circle_at_top_right,_rgba(180,253,131,0.28),_transparent_62%)]" />
        <div className="absolute bottom-0 left-0 h-28 w-full bg-white/55 [clip-path:ellipse(76%_58%_at_50%_100%)] lg:h-32" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-12 xl:px-16">
          <div className="z-10">
            <span className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Contact Ansell
            </span>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.05em] text-foreground md:text-4xl">
              Let&apos;s fire up your business from Juba.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Team up with Ansell for a polished delivery experience across
              digital products, operations systems, and marketplace growth.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              {flags.map((flag) => (
                <div
                  key={flag.code}
                  className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white shadow-[0_12px_24px_-20px_rgba(16,33,15,0.35)]"
                  title={flag.name}
                >
                  <Image
                    src={`https://flagcdn.com/w80/${flag.code}.png`}
                    alt={flag.name}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>

            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mt-8"
            >
              <ChevronDown className="h-6 w-6 text-primary" />
            </motion.div>

            <div className="mt-8 space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Juba</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                  Ansell client experience hub, Juba, South Sudan.
                  <br />
                  Supporting product delivery, partner operations, and growth
                  strategy.
                </p>
              </div>

              <a
                href="mailto:business@ansellhub.com"
                className="flex items-center gap-3 text-sm text-foreground transition-colors hover:text-[#5e9a31]"
              >
                <Mail size={20} className="text-muted-foreground" />
                <span className="font-medium">business@ansellhub.com</span>
              </a>

              <a
                href="tel:+211000000000"
                className="flex items-center gap-3 text-sm text-foreground transition-colors hover:text-[#5e9a31]"
              >
                <Phone size={20} className="text-muted-foreground" />
                <span className="font-medium">+211-000-000-000</span>
              </a>
            </div>
          </div>

          {/* Large JUBA text */}
          <div className="relative hidden w-full overflow-hidden lg:block">
            <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 text-[10rem] font-bold tracking-[-0.08em] text-black/5 xl:text-[14rem]">
              JUBA
            </div>
          </div>
        </div>


      </div>

      <div className="bg-white px-6 pb-8 pt-8 md:px-10 lg:px-12 xl:px-16">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2 xl:grid-cols-[1fr_1fr_0.9fr_0.9fr_1.15fr]">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h4 className="mb-5 text-xl font-semibold text-foreground">
                {group.title}
              </h4>
              <ul className="space-y-3">
                {group.items.map((item) => (
                  <li key={item}>
                    <Link
                      href="/"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="space-y-5">
            <h4 className="text-xl font-semibold text-foreground">Follow Us</h4>
            <p className="text-sm text-muted-foreground">Stay connected with Ansell on social media for the latest listings, news and updates.</p>
            <div className="flex gap-3 mt-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.name}
                  className="flex h-6 w-6 items-center justify-center transition-transform hover:scale-110"
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
      </div>
    </footer>
  );
}
