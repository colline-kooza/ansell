"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useSubmitCompanyApplication } from "@/hooks/use-companies";
import { MultiImageUpload } from "@/components/shared/multi-image-upload";
import { buildApiUrl } from "@/lib/api";
import { FrontendNavbar } from "@/components/layout/frontend-navbar";
import { FrontendFooter } from "@/components/layout/frontend-footer";
import {
  ArrowRight, Check, MapPin, FileText, Building,
  Briefcase, Loader2, CheckCircle2, Globe, Phone,
  Mail, Home, Image as ImageIcon, Sparkles, AlertCircle, X,
  Eye, EyeOff, Lock, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast, Toaster } from "sonner";

const STEPS = [
  { id: 1, title: "Company Profile", description: "Basic company information", icon: Building },
  { id: 2, title: "Industry & Size", description: "Business sector details", icon: Briefcase },
  { id: 3, title: "Contact & Location", description: "How to reach you", icon: MapPin },
  { id: 4, title: "Branding", description: "Logo and company image", icon: ImageIcon },
  { id: 5, title: "Documents", description: "Supporting verification", icon: FileText },
  { id: 6, title: "Review & Submit", description: "Confirm your details", icon: Check },
];

const INDUSTRIES = [
  { value: "technology", label: "Technology & IT" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "construction", label: "Construction & Engineering" },
  { value: "finance", label: "Finance & Banking" },
  { value: "retail", label: "Retail & Commerce" },
  { value: "healthcare", label: "Healthcare & Medicine" },
  { value: "education", label: "Education & Training" },
  { value: "real_estate", label: "Real Estate" },
  { value: "logistics", label: "Logistics & Transport" },
  { value: "hospitality", label: "Hospitality & Tourism" },
  { value: "media", label: "Media & Communications" },
  { value: "energy", label: "Energy & Utilities" },
  { value: "agriculture", label: "Agriculture & Food" },
  { value: "government", label: "Government & NGO" },
  { value: "other", label: "Other" },
];

const COMPANY_SIZES = [
  { value: "1-10", label: "1–10 employees", desc: "Micro business" },
  { value: "11-50", label: "11–50 employees", desc: "Small business" },
  { value: "51-200", label: "51–200 employees", desc: "Medium company" },
  { value: "201-500", label: "201–500 employees", desc: "Large company" },
  { value: "500+", label: "500+ employees", desc: "Enterprise" },
];

interface FormData {
  company_name: string;
  description: string;
  industry: string;
  size: string;
  founded_year: string;
  website: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  logo_url: string;
  cover_image_url: string;
  document_url: string;
}

interface Credentials {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

const DEFAULT_FORM: FormData = {
  company_name: "", description: "", industry: "", size: "",
  founded_year: "", website: "", email: "", phone: "",
  city: "", address: "", logo_url: "", cover_image_url: "", document_url: "",
};

const INVALID_COMPANY_NAME_PATTERN =
  /^(test|testing|demo|sample|fake|invalid|none|na|n\/a|null|undefined|company|my company|abc|asdf|qwerty)$/i;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getClientReviewError({
  form,
  effectiveEmail,
  logoImages,
  docImages,
}: {
  form: FormData;
  effectiveEmail: string;
  logoImages: string[];
  docImages: string[];
}) {
  const companyName = form.company_name.trim();
  const description = form.description.trim();
  const email = effectiveEmail.trim();
  const phone = form.phone.trim();
  const city = form.city.trim();
  const address = form.address.trim();
  const website = form.website.trim();

  if (companyName.length < 3) return "Company name must be at least 3 characters long.";
  if (INVALID_COMPANY_NAME_PATTERN.test(companyName)) return "Please enter the real company name instead of a placeholder.";
  if (!form.industry) return "Please select your industry before submitting.";
  if (!form.size) return "Please select your company size before submitting.";
  if (description.length < 12) return "Add a more meaningful company description before submitting.";
  if (!city) return "City is required before the application can be reviewed.";
  if (!address) return "Physical address is required before the application can be reviewed.";
  if (!phone || phone.replace(/[^\d]/g, "").length < 7) return "Enter a valid phone number before submitting.";
  if (!email) return "Company email is required before submitting.";
  if (!isValidEmail(email)) return "Enter a valid company email address before submitting.";
  if (website && !isValidHttpUrl(website)) return "Website must be a valid http or https URL.";
  if (logoImages.length === 0) return "Please upload a company logo before submitting.";
  if (docImages.length === 0) return "Please upload at least one verification document before submitting.";
  if (docImages.some((url) => !isValidHttpUrl(url))) return "One or more document links are invalid. Please re-upload.";
  return null;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-[13px] font-medium text-white placeholder:text-white/30 outline-none focus:border-primary focus:bg-white/10 transition-all";
const textareaCls = "w-full rounded-xl border border-white/10 bg-white/5 p-4 text-[13px] font-medium text-white placeholder:text-white/30 outline-none focus:border-primary focus:bg-white/10 transition-all resize-none";

function AIAnalysisDialog({
  state,
  reason,
  onClose,
}: {
  state: "idle" | "loading" | "approved" | "rejected";
  reason: string;
  onClose: () => void;
}) {
  if (state === "idle") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={state !== "loading" ? onClose : undefined} />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1410] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <div className="h-1 w-full bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
        {state !== "loading" && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="flex flex-col items-center px-6 pb-8 pt-6 text-center">
          <div className="relative mb-5">
            {state === "loading" && (
              <>
                <div className="absolute inset-0 -m-4 rounded-full border border-primary/20 animate-ping" />
                <div className="absolute inset-0 -m-2 rounded-full border border-primary/15 animate-pulse" />
              </>
            )}
            <div className={`relative flex h-20 w-20 items-center justify-center rounded-full border-2 ${
              state === "loading" ? "border-primary/40 bg-primary/10" :
              state === "approved" ? "border-emerald-400/40 bg-emerald-500/10" :
              "border-red-400/40 bg-red-500/10"
            }`}>
              <svg viewBox="0 0 64 64" fill="none" className="h-10 w-10" xmlns="http://www.w3.org/2000/svg">
                <rect x="12" y="16" width="40" height="32" rx="8" fill={state === "approved" ? "#22c55e" : state === "rejected" ? "#ef4444" : "currentColor"} className={state === "loading" ? "text-primary" : ""} opacity="0.15" />
                <rect x="12" y="16" width="40" height="32" rx="8" stroke={state === "approved" ? "#22c55e" : state === "rejected" ? "#ef4444" : "currentColor"} className={state === "loading" ? "text-primary" : ""} strokeWidth="2" />
                <circle cx="24" cy="30" r="4" fill={state === "approved" ? "#22c55e" : state === "rejected" ? "#ef4444" : "currentColor"} className={state === "loading" ? "text-primary" : ""} opacity={state === "loading" ? "0.9" : "1"} />
                <circle cx="40" cy="30" r="4" fill={state === "approved" ? "#22c55e" : state === "rejected" ? "#ef4444" : "currentColor"} className={state === "loading" ? "text-primary" : ""} opacity={state === "loading" ? "0.9" : "1"} />
                {state === "approved" ? (
                  <path d="M22 40 Q32 46 42 40" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                ) : state === "rejected" ? (
                  <path d="M22 44 Q32 38 42 44" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                ) : (
                  <rect x="22" y="40" width="20" height="2.5" rx="1.25" fill="currentColor" className="text-primary" />
                )}
                <line x1="32" y1="16" x2="32" y2="8" stroke="currentColor" className={state === "loading" ? "text-primary" : state === "approved" ? "[color:#22c55e]" : "[color:#ef4444]"} strokeWidth="2" strokeLinecap="round" />
                <circle cx="32" cy="6" r="2.5" fill={state === "approved" ? "#22c55e" : state === "rejected" ? "#ef4444" : "currentColor"} className={state === "loading" ? "text-primary" : ""} />
              </svg>
              {state === "loading" && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full">
                  <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-primary animate-spin" />
                </div>
              )}
            </div>
          </div>
          <div className="mb-1 flex items-center gap-1.5">
            <Sparkles className={`h-3.5 w-3.5 ${state === "approved" ? "text-emerald-400" : state === "rejected" ? "text-red-400" : "text-primary"}`} />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Anasell AI</span>
          </div>
          <h3 className="mt-2 text-[17px] font-bold text-white">
            {state === "loading" ? "Analysing your application…" :
             state === "approved" ? "Application Approved!" : "Action Required"}
          </h3>
          <p className={`mt-2 text-[13px] leading-relaxed ${
            state === "loading" ? "text-white/50" :
            state === "approved" ? "text-emerald-400/80" : "text-red-400/80"
          }`}>
            {state === "loading"
              ? "Checking your company details, documents, and contact information. This takes a few seconds."
              : reason || (state === "approved" ? "Your details look great. Submitting your application now." : "Please review the feedback above.")}
          </p>
          {state === "loading" && (
            <div className="mt-4 flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}
          {state !== "loading" && (
            <button
              type="button"
              onClick={onClose}
              className={`mt-5 w-full rounded-xl px-5 py-3 text-[13px] font-bold transition-all active:scale-95 ${
                state === "approved" ? "bg-emerald-500 text-white hover:brightness-110" : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              {state === "approved" ? "Continue" : "Go back and fix"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BecomeCompanyPage() {
  const { user, login } = useAuth();
  const submitMutation = useSubmitCompanyApplication();

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [logoImages, setLogoImages] = useState<string[]>([]);
  const [coverImages, setCoverImages] = useState<string[]>([]);
  const [docImages, setDocImages] = useState<string[]>([]);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [aiState, setAiState] = useState<"idle" | "loading" | "approved" | "rejected">("idle");
  const [aiReason, setAiReason] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [creds, setCreds] = useState<Credentials>({
    first_name: "", last_name: "", email: "", password: "",
  });

  const resetAiFeedback = () => {
    if (aiState !== "loading") { setAiState("idle"); setAiReason(""); }
  };

  const updateCred = (k: keyof Credentials, v: string) =>
    setCreds((p) => ({ ...p, [k]: v }));

  const update = (key: keyof FormData, value: string) => {
    resetAiFeedback();
    setForm((p) => ({ ...p, [key]: value }));
  };

  const updateLogoImages = (value: string[]) => { resetAiFeedback(); setLogoImages(value); };
  const updateCoverImages = (value: string[]) => { resetAiFeedback(); setCoverImages(value); };
  const updateDocImages = (value: string[]) => { resetAiFeedback(); setDocImages(value); };

  // The email to use for the application — prefer the form company email, else fall back to account email
  const effectiveEmail = form.email || (user ? user.email : creds.email) || "";
  const contactName = user
    ? `${user.first_name} ${user.last_name}`
    : creds.first_name || creds.last_name
    ? `${creds.first_name} ${creds.last_name}`.trim()
    : "—";

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!form.company_name.trim()) { toast.error("Company name is required"); return false; }
      if (!user) {
        if (!creds.first_name.trim() || !creds.last_name.trim()) { toast.error("Full name is required"); return false; }
        if (!creds.email.trim() || !isValidEmail(creds.email)) { toast.error("A valid email address is required"); return false; }
        if (creds.password.length < 8) { toast.error("Password must be at least 8 characters"); return false; }
      }
    }
    if (step === 2) {
      if (!form.industry) { toast.error("Please select an industry"); return false; }
      if (!form.size) { toast.error("Please select a company size"); return false; }
    }
    if (step === 3) {
      if (!form.city.trim()) { toast.error("City is required"); return false; }
      if (!form.address.trim()) { toast.error("Address is required"); return false; }
      if (!form.phone.trim()) { toast.error("Phone number is required"); return false; }
      if (!form.email.trim() && !effectiveEmail) { toast.error("Email is required"); return false; }
    }
    if (step === 4) {
      if (logoImages.length === 0) { toast.error("Please upload a company logo"); return false; }
    }
    if (step === 5) {
      if (docImages.length === 0) { toast.error("Please upload verification documents"); return false; }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(6, s + 1));
  };
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const doSubmit = async () => {
    await submitMutation.mutateAsync({
      company_name: form.company_name,
      company_type: "Limited",
      description: form.description || "N/A",
      industry: form.industry,
      city: form.city,
      address: form.address,
      phone_number: form.phone,
      email: effectiveEmail,
      website: form.website || undefined,
      logo_url: logoImages[0] || undefined,
      document_url: docImages[0] || undefined,
      employee_count: form.size || "1-10",
    } as any);
    setSubmitted(true);
  };

  const handleSubmit = async () => {
    const clientReviewError = getClientReviewError({ form, effectiveEmail, logoImages, docImages });
    if (clientReviewError) {
      setAiState("rejected");
      setAiReason(clientReviewError);
      toast.error(clientReviewError);
      return;
    }

    setSubmitting(true);
    setAiState("loading");
    try {
      if (!user) {
        const regRes = await fetch(buildApiUrl("auth/register"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: creds.first_name,
            last_name: creds.last_name,
            email: creds.email,
            password: creds.password,
          }),
        });
        const regData = await regRes.json();
        if (!regRes.ok || !regData.success || !regData.data) {
          setAiState("rejected");
          setAiReason(regData.message || "Failed to create account. Email may already be registered.");
          toast.error(regData.message || "Failed to create account.");
          setSubmitting(false);
          return;
        }
        login(regData.data.token, regData.data.user);
      }

      // AI analysis
      const res = await fetch("/api/analyze-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.company_name,
          industry: form.industry,
          description: form.description,
          city: form.city,
          address: form.address,
          phone: form.phone,
          email: effectiveEmail,
          website: form.website,
          size: form.size,
          document_urls: docImages,
        }),
      });
      if (!res.ok) throw new Error("AI review request failed");

      const analysis = await res.json();
      const reviewReason = typeof analysis?.reason === "string" ? analysis.reason : "";
      const wasBypassed = /skipped|unavailable|manual review/i.test(reviewReason);

      setAiReason(reviewReason);
      if (analysis?.approved === true && !wasBypassed) {
        setAiState("approved");
        await doSubmit();
      } else {
        setAiState("rejected");
        if (wasBypassed) {
          setAiReason("AI review is unavailable right now. Submission stopped instead of bypassing validation.");
          toast.error("AI review is unavailable. Submission was stopped.");
        } else if (reviewReason) {
          toast.error(reviewReason);
        }
      }
    } catch {
      setAiState("rejected");
      setAiReason("AI review could not be completed, so the application was not submitted.");
      toast.error("Could not complete AI review. Application was not submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <>
        <FrontendNavbar />
        <div className="min-h-screen bg-[#080d08] flex items-center justify-center px-5 pt-20 [font-family:var(--font-poppins)]">
          <div className="max-w-md w-full text-center">
            <div className="mb-6 flex justify-center">
              <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center animate-in zoom-in duration-500">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Application Submitted!</h1>
            <p className="text-white/60 text-[13px] leading-6 mb-4">
              Your company registration application has been received. Our team will review it
              within 1–3 business days and notify you of the decision.
            </p>
            <p className="text-white/50 text-[12px] leading-relaxed mb-8">
              {user
                ? "Once approved, you'll gain full access to your company portal and can start posting jobs and tenders."
                : `Once approved, log in with ${effectiveEmail || creds.email} and access your company dashboard immediately — no extra verification needed.`}
            </p>
            <div className="space-y-3">
              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-5 py-3.5 text-[14px] font-bold text-primary-foreground hover:brightness-110 active:scale-95 transition-all"
              >
                <Home className="h-4 w-4" />
                Back to Storefront
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/20 px-5 py-3.5 text-[14px] font-medium text-white/70 hover:text-white hover:border-white/40 hover:bg-white/5 active:scale-95 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
        <FrontendFooter />
      </>
    );
  }

  const reviewRows = [
    { label: "Contact Person", value: contactName },
    { label: "Company Name", value: form.company_name || "—" },
    { label: "Industry", value: INDUSTRIES.find(i => i.value === form.industry)?.label || "—" },
    { label: "Company Size", value: form.size || "—" },
    { label: "Founded", value: form.founded_year || "—" },
    { label: "Phone", value: form.phone || "—" },
    { label: "Email", value: effectiveEmail || "—" },
    { label: "Website", value: form.website || "—" },
    { label: "City", value: form.city || "—" },
    { label: "Logo", value: logoImages.length > 0 ? "Uploaded" : "Not provided" },
    { label: "Document", value: docImages.length > 0 ? "Uploaded" : "Not provided" },
  ];

  const isPending = submitting || submitMutation.isPending || aiState === "loading";

  return (
    <>
      <FrontendNavbar />
      <Toaster position="top-center" richColors />
      <AIAnalysisDialog state={aiState} reason={aiReason} onClose={() => { setAiState("idle"); setAiReason(""); }} />

      <div className="min-h-screen bg-[#080d08] text-white flex flex-col [font-family:var(--font-poppins)] selection:bg-primary/30 pt-20">
        <div className="flex-1 flex flex-col items-center px-4 pb-16 pt-10 w-full">
          <div className="w-full max-w-[580px]">

            {/* Page title */}
            <div className="mb-8 text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-primary/80 mb-3">Company Registration</p>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Register Your Company</h1>
              <p className="text-[13px] text-white/50">Get discovered by thousands of South Sudanese buyers, partners, and job seekers every day.</p>
            </div>

            <div className="animate-in fade-in zoom-in-[0.98] duration-500">
              {/* Progress */}
              <div className="mb-8 flex flex-col items-center">
                <div className="flex gap-1.5 mb-4">
                  {STEPS.map((s) => (
                    <div
                      key={s.id}
                      className={cn(
                        "h-1 rounded-full transition-all duration-500",
                        step === s.id ? "w-8 bg-primary" : step > s.id ? "w-4 bg-primary/40" : "w-2 bg-white/10"
                      )}
                    />
                  ))}
                </div>
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-primary/80 mb-1">
                  Step {step} of {STEPS.length}
                </p>
                <h2 className="text-xl font-bold tracking-tight text-white mb-1">{STEPS[step - 1].title}</h2>
                <p className="text-[13px] font-medium text-white/50">{STEPS[step - 1].description}</p>
              </div>

              {/* Step Content */}
              <div className="min-h-[280px] px-0 sm:px-2">

                {/* Step 1: Company Profile */}
                {step === 1 && (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    {user ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Contact Person</label>
                          <div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] font-medium text-white/60">
                            {user.first_name} {user.last_name}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Account Email</label>
                          <div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] font-medium text-white/60 truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-[12px] text-primary/90 leading-relaxed">
                          <p className="font-bold mb-1">Set your login credentials</p>
                          These will be your <span className="font-bold">permanent login details</span>. After admin approval your account is activated automatically — no email verification needed.
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                              First Name <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                              <input
                                type="text"
                                value={creds.first_name}
                                onChange={(e) => updateCred("first_name", e.target.value)}
                                placeholder="e.g. John"
                                className={cn(inputCls, "pl-10")}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                              Last Name <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={creds.last_name}
                              onChange={(e) => updateCred("last_name", e.target.value)}
                              placeholder="e.g. Deng"
                              className={inputCls}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                            Login Email <span className="text-red-400">*</span>
                            <span className="ml-1 normal-case font-normal text-white/25">— you'll use this to sign in</span>
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                            <input
                              type="email"
                              value={creds.email}
                              onChange={(e) => updateCred("email", e.target.value)}
                              placeholder="e.g. john@example.com"
                              className={cn(inputCls, "pl-10")}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                            Password <span className="text-red-400">*</span>
                            <span className="ml-1 normal-case font-normal text-white/25">— min 8 characters</span>
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                            <input
                              type={showPassword ? "text" : "password"}
                              value={creds.password}
                              onChange={(e) => updateCred("password", e.target.value)}
                              placeholder="Choose a strong password"
                              className={cn(inputCls, "pl-10 pr-11")}
                              minLength={8}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((p) => !p)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    <Field label="Company / Organisation Name" required>
                      <input
                        type="text"
                        value={form.company_name}
                        onChange={(e) => update("company_name", e.target.value)}
                        placeholder="e.g. Acme Corporation Ltd"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Company Description">
                      <textarea
                        value={form.description}
                        onChange={(e) => update("description", e.target.value)}
                        rows={4}
                        placeholder="What does your company do? Products, services, mission..."
                        className={textareaCls}
                      />
                    </Field>
                    <Field label="Year Founded">
                      <input
                        type="number"
                        value={form.founded_year}
                        onChange={(e) => update("founded_year", e.target.value)}
                        placeholder="e.g. 2010"
                        min="1800" max={new Date().getFullYear()}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                )}

                {/* Step 2: Industry & Size */}
                {step === 2 && (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    <Field label="Industry / Sector" required>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {INDUSTRIES.map((ind) => (
                          <button
                            key={ind.value}
                            type="button"
                            onClick={() => update("industry", ind.value)}
                            className={cn(
                              "text-left rounded-xl border px-3.5 py-2.5 transition-all duration-200 outline-none",
                              form.industry === ind.value
                                ? "border-primary bg-primary/10 scale-[0.98]"
                                : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                            )}
                          >
                            <p className={cn("text-[13px] font-semibold", form.industry === ind.value ? "text-primary" : "text-white")}>
                              {ind.label}
                            </p>
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="Company Size" required>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {COMPANY_SIZES.map((sz) => (
                          <button
                            key={sz.value}
                            type="button"
                            onClick={() => update("size", sz.value)}
                            className={cn(
                              "text-left rounded-xl border p-3.5 transition-all duration-200 outline-none",
                              form.size === sz.value
                                ? "border-primary bg-primary/10 scale-[0.98]"
                                : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                            )}
                          >
                            <p className={cn("text-[13px] font-semibold", form.size === sz.value ? "text-primary" : "text-white")}>{sz.label}</p>
                            <p className="text-[11px] text-white/40 mt-0.5">{sz.desc}</p>
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>
                )}

                {/* Step 3: Contact & Location */}
                {step === 3 && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Phone Number" required>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => update("phone", e.target.value)}
                            placeholder="+211 922 000 000"
                            className={cn(inputCls, "pl-10")}
                          />
                        </div>
                      </Field>
                      <Field label="Company Email">
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                            placeholder="contact@company.com"
                            className={cn(inputCls, "pl-10")}
                          />
                        </div>
                      </Field>
                    </div>
                    <Field label="Company Website">
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <input
                          type="url"
                          value={form.website}
                          onChange={(e) => update("website", e.target.value)}
                          placeholder="https://www.company.com"
                          className={cn(inputCls, "pl-10")}
                        />
                      </div>
                    </Field>
                    <Field label="City / Town" required>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <input
                          type="text"
                          value={form.city}
                          onChange={(e) => update("city", e.target.value)}
                          placeholder="e.g. Juba"
                          className={cn(inputCls, "pl-10")}
                        />
                      </div>
                    </Field>
                    <Field label="Physical Address" required>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) => update("address", e.target.value)}
                        placeholder="e.g. Plot 25, Juba Road"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                )}

                {/* Step 4: Branding */}
                {step === 4 && (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
                      <p className="text-[13px] font-bold text-primary mb-1">Company Branding</p>
                      <p className="text-[12px] text-white/60 leading-normal">
                        Upload your company logo and cover image. These will be displayed on your public company profile.
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Company Logo <span className="text-red-400">*</span></p>
                      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                        <MultiImageUpload value={logoImages} onChange={updateLogoImages} maxFiles={1} maxSize={5} />
                        {logoImages.length > 0 && (
                          <p className="text-[12px] font-bold text-primary mt-3 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />Logo uploaded
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Cover Image <span className="text-white/30 normal-case font-normal">(optional)</span></p>
                      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                        <MultiImageUpload value={coverImages} onChange={updateCoverImages} maxFiles={1} maxSize={10} />
                        {coverImages.length > 0 && (
                          <p className="text-[12px] font-bold text-primary mt-3 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />Cover uploaded
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Documents */}
                {step === 5 && (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
                      <p className="text-[13px] font-bold text-primary mb-1">Verification Documents <span className="font-normal text-primary/70">(Recommended)</span></p>
                      <p className="text-[12px] text-white/60 leading-normal">
                        Upload a business registration certificate, tax ID, or any document that proves your company's legitimacy.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {["Business Registration Certificate", "Company TIN / Tax Registration", "Director ID / Passport", "Operating License"].map(doc => (
                        <div key={doc} className="flex items-center gap-2 text-[12px] text-white/40">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/50 shrink-0" />
                          {doc}
                        </div>
                      ))}
                    </div>
                    <div className="bg-white/5 rounded-xl p-5 border border-white/10 shadow-inner">
                      <MultiImageUpload value={docImages} onChange={updateDocImages} maxFiles={3} maxSize={10} />
                      {docImages.length > 0 && (
                        <p className="text-[12px] font-bold text-primary mt-3 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {docImages.length} document{docImages.length > 1 ? "s" : ""} ready
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 6: Review */}
                {step === 6 && (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    {logoImages.length > 0 && (
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logoImages[0]} alt="Logo" className="h-12 w-12 object-contain border border-white/10 rounded" />
                        <div>
                          <p className="text-[13px] font-bold text-white">{form.company_name}</p>
                          <p className="text-[12px] text-white/40">{INDUSTRIES.find(i => i.value === form.industry)?.label}</p>
                        </div>
                      </div>
                    )}
                    <div className="rounded-xl border border-white/10 bg-white/5 divide-y divide-white/5 overflow-hidden">
                      {reviewRows.map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center px-5 py-3 hover:bg-white/[0.02] transition-colors">
                          <span className="text-[11px] text-white/40 font-bold uppercase tracking-wider">{label}</span>
                          <span className={cn(
                            "text-[13px] font-semibold text-right max-w-[60%] truncate",
                            value === "Uploaded" ? "text-primary" : "text-white"
                          )}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                    {!user && creds.email && (
                      <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">Your Login Credentials After Approval</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-white/40 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Login Email</span>
                          <span className="text-[13px] font-bold text-primary">{creds.email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-white/40 flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Password</span>
                          <span className="text-[13px] font-bold text-white/60">{"•".repeat(Math.min(creds.password.length, 10))}</span>
                        </div>
                        <p className="text-[11px] text-white/30 pt-1 border-t border-white/5">Use these to sign in at <span className="text-primary/70">/login</span> once an admin approves your application</p>
                      </div>
                    )}
                    <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-[12px] font-medium text-primary/90 leading-normal flex items-start gap-2.5">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div>
                        {user
                          ? "Anasell AI will review your application before submission. Admin final review takes 1–3 business days."
                          : "Anasell AI reviews first, then admin approval. Once approved, your account is immediately activated with the credentials above."}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-6 px-0 sm:px-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 mt-2">
                <div className="w-full sm:w-auto text-center sm:text-left">
                  {step === 1 && (
                    <span className="text-[12px] font-medium text-white/40">
                      Already registered?{" "}
                      <Link href="/login" className="text-primary hover:text-primary/80 font-bold transition-colors">
                        Sign in directly
                      </Link>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={isPending}
                      className="flex-1 sm:flex-none flex items-center justify-center h-11 px-5 rounded-xl border border-white/10 text-[13px] font-bold text-white hover:bg-white/5 transition-all disabled:opacity-40"
                    >
                      Back
                    </button>
                  )}
                  {step < 6 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-primary text-[13px] font-bold text-primary-foreground hover:brightness-110 active:scale-95 shadow-sm shadow-primary/20 transition-all"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isPending}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-primary text-[13px] font-bold text-primary-foreground hover:brightness-110 active:scale-95 shadow-sm shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {aiState === "loading" ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />AI Reviewing…</>
                      ) : submitMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</>
                      ) : (
                        <><Sparkles className="h-4 w-4" />Submit Application</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FrontendFooter />
    </>
  );
}
