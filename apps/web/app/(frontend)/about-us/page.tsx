"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Building2, Briefcase, Home, GraduationCap, FileText, Users,
  MapPin, Phone, Mail, MessageCircle, ArrowRight, CheckCircle2,
} from "lucide-react";

const CONTACT_PHONE = "+211 922 031 601";

const pillars = [
  { icon: Home, title: "Real Estate", desc: "Browse verified property listings across South Sudan — rentals, land, apartments, and commercial space." },
  { icon: Briefcase, title: "Job Board", desc: "Discover career opportunities in NGOs, government, private sector, and international organisations." },
  { icon: FileText, title: "Public Tenders", desc: "Access government and corporate procurement opportunities in a transparent, easy-to-search format." },
  { icon: GraduationCap, title: "Courses & Training", desc: "Find advertised courses from universities, vocational institutions, and training centres." },
  { icon: Building2, title: "Company Directory", desc: "Discover verified businesses operating in South Sudan across every industry." },
  { icon: Users, title: "Video Advertising", desc: "Promote your brand to thousands of Anasell visitors through targeted video adverts." },
];

const values = [
  { title: "Transparency", desc: "We verify businesses and listings before they go live, ensuring users always get reliable information." },
  { title: "Accessibility", desc: "Built for South Sudan first — optimised for local infrastructure and connectivity." },
  { title: "Opportunity", desc: "Every feature on Anasell is designed to connect people with opportunities that improve their lives." },
];

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-[#f4f8fb]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50 bg-white px-4 py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(180,253,131,0.18),transparent_70%)]" />
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary"
          >
            <Building2 className="size-3" />
            About Anasell
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            All Opportunities.{" "}
            <span className="text-primary">One Platform.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base"
          >
            Anasell is South Sudan&apos;s premier digital marketplace — built to connect people and businesses with
            real estate, jobs, tenders, courses, and more. One platform, every opportunity.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <Link href="/companies" className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-95">
              Explore Companies <ArrowRight className="size-4" />
            </Link>
            <Link href="/become-company" className="inline-flex items-center gap-2 rounded-sm border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted">
              Register Your Company
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Our Mission</p>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Connecting South Sudan&apos;s economy through technology
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Anasell was founded with a simple mission: make it easy for everyone in South Sudan to access opportunities.
              Whether you&apos;re a job seeker, an entrepreneur, a property hunter, or an institution looking to advertise
              courses — Anasell is the single destination for all of it.
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              We believe that transparency, verification, and accessibility are the foundations of a thriving digital economy.
              Our platform rigorously verifies companies and listings before they go live, so you can trust what you see.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-xl border border-border/50 bg-white p-4 shadow-sm ${i === 2 ? "sm:col-span-2" : ""}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">{v.title}</h3>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="border-t border-border/50 bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">What We Offer</p>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Everything in one place</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-xl border border-border/50 bg-[#f8fbfe] p-5"
                >
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <h3 className="mb-1.5 text-sm font-bold text-foreground">{p.title}</h3>
                  <p className="text-xs leading-5 text-muted-foreground">{p.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border/50 bg-white p-8 shadow-sm text-center">
          <MapPin className="mx-auto mb-3 size-8 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Get in Touch</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Have a question or want to partner with Anasell? Reach us directly — we&apos;re available on phone and WhatsApp.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              <Phone className="size-4 text-primary" />
              {CONTACT_PHONE}
            </a>
            <a
              href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-95"
            >
              <MessageCircle className="size-4" />
              WhatsApp Us
            </a>
            <a
              href="mailto:business@ansellhub.com"
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              <Mail className="size-4 text-primary" />
              business@ansellhub.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
