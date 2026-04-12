"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useSubmitCompanyApplication } from "@/hooks/use-companies";
import { MultiImageUpload } from "@/components/shared/multi-image-upload";
import {
  ArrowRight, Check, MapPin, FileText, Building,
  Briefcase, Loader2, CheckCircle2, Globe, Phone,
  Mail, Home, Users, Image as ImageIcon,
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

const DEFAULT_FORM: FormData = {
  company_name: "", description: "", industry: "", size: "",
  founded_year: "", website: "", email: "", phone: "",
  city: "", address: "", logo_url: "", cover_image_url: "", document_url: "",
};

// ── Field component ────────────────────────────────────────────────────

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

export default function BecomeCompanyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const submitMutation = useSubmitCompanyApplication();

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [logoImages, setLogoImages] = useState<string[]>([]);
  const [coverImages, setCoverImages] = useState<string[]>([]);
  const [docImages, setDocImages] = useState<string[]>([]);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);

  const update = (key: keyof FormData, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!form.company_name.trim()) { toast.error("Company name is required"); return false; }
    }
    if (step === 2) {
      if (!form.industry) { toast.error("Please select an industry"); return false; }
      if (!form.size) { toast.error("Please select a company size"); return false; }
    }
    if (step === 3) {
      if (!form.city.trim()) { toast.error("City is required"); return false; }
      if (!form.address.trim()) { toast.error("Address is required"); return false; }
      if (!form.phone.trim()) { toast.error("Phone number is required"); return false; }
      if (!form.email.trim() && !user?.email) { toast.error("Email is required"); return false; }
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

  const handleSubmit = async () => {
    if (!form.company_name || !form.phone || !form.city || !form.address || logoImages.length === 0 || docImages.length === 0) {
      toast.error("Please fill all required fields and upload logo/documents");
      return;
    }
    if (!form.email && !user?.email) {
      toast.error("Company email is required");
      return;
    }
    try {
      await submitMutation.mutateAsync({
        company_name: form.company_name,
        company_type: "Limited",
        description: form.description || "N/A",
        industry: form.industry,
        city: form.city,
        address: form.address,
        phone_number: form.phone,
        email: form.email || user?.email || "",
        website: form.website || undefined,
        logo_url: logoImages[0] || undefined,
        document_url: docImages[0] || undefined,
        employee_count: form.size || "1-10",
      } as any);
      setSubmitted(true);
    } catch {
      // error handled by hook
    }
  };

  // ── Submitted State ──────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#080d08] flex items-center justify-center px-5 [font-family:var(--font-poppins)]">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center animate-in zoom-in duration-500">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Application Submitted!</h1>
          <p className="text-white/60 text-[13px] leading-6 mb-8">
            Your company registration application has been received. Our team will review it
            within 1–3 business days and notify you of the decision. Once approved,
            you'll gain access to your company portal and can start posting jobs and tenders.
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
              Sign in to check status
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const reviewRows = [
    { label: "Company Name", value: form.company_name || "—" },
    { label: "Industry", value: INDUSTRIES.find(i => i.value === form.industry)?.label || "—" },
    { label: "Company Size", value: form.size || "—" },
    { label: "Founded", value: form.founded_year || "—" },
    { label: "Phone", value: form.phone || "—" },
    { label: "Email", value: form.email || "—" },
    { label: "Website", value: form.website || "—" },
    { label: "City", value: form.city || "—" },
    { label: "Logo", value: logoImages.length > 0 ? "Uploaded" : "Not provided" },
    { label: "Document", value: docImages.length > 0 ? "Uploaded" : "Not provided" },
  ];

  return (
    <div className="min-h-screen bg-[#080d08] text-white flex flex-col [font-family:var(--font-poppins)] selection:bg-primary/30">

      {/* ── Logo Header ── */}
      <div className="w-full flex justify-center pt-10 pb-6 lg:pt-12 lg:pb-8 animate-in fade-in slide-in-from-top-4 duration-700">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="relative flex size-8 items-center justify-center">
            <div className="absolute left-0.5 top-0.5 h-5 w-2 -skew-x-[20deg] rounded-sm bg-primary" />
            <div className="absolute right-0.5 top-0.5 h-5 w-2 skew-x-[20deg] rounded-sm bg-primary/80" />
          </div>
          <div className="leading-none">
            <p className="text-[1.5rem] font-black tracking-[-0.06em] text-white">Ansell</p>
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-primary/70">Company Portal</p>
          </div>
        </Link>
      </div>

      {/* ── Main Container ── */}
      <div className="flex-1 flex flex-col items-center px-4 pb-16 w-full">
        <div className="w-full max-w-[580px]">
          <div className="animate-in fade-in zoom-in-[0.98] duration-500">
            <div className="p-4 sm:px-6">
              {/* Progress & Header */}
              <div className="mb-8 text-center flex flex-col items-center">
                {/* Step dots */}
                <div className="flex gap-1.5 mb-5">
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
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-primary/80 mb-1.5">
                  Step {step} of {STEPS.length}
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">{STEPS[step - 1].title}</h1>
                <p className="text-[13px] font-medium text-white/50">{STEPS[step - 1].description}</p>
              </div>

              {/* ── Step Content ── */}
              <div className="min-h-[280px]">

                {/* Step 1: Company Profile */}
                {step === 1 && (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Contact Person</label>
                        <div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] font-medium text-white/60">
                          {user ? `${user.first_name} ${user.last_name}` : "Not signed in"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Account Email</label>
                        <div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] font-medium text-white/60 truncate">
                          {user?.email || "Not signed in"}
                        </div>
                      </div>
                    </div>
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
                    {!user && (
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-[13px] text-amber-400 flex items-start gap-2.5">
                        <span className="text-lg">⚠️</span>
                        <span>
                          Please{" "}
                          <Link href="/login?redirect=/become-company" className="underline font-bold text-amber-300">
                            sign in
                          </Link>{" "}
                          first to submit your company application.
                        </span>
                      </div>
                    )}
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
                            placeholder="+256 700 000 000"
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
                          placeholder="e.g. Kampala"
                          className={cn(inputCls, "pl-10")}
                        />
                      </div>
                    </Field>
                    <Field label="Physical Address">
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) => update("address", e.target.value)}
                        placeholder="e.g. Plot 25, Kampala Road"
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
                      <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Company Logo</p>
                      <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                        <MultiImageUpload value={logoImages} onChange={setLogoImages} maxFiles={1} maxSize={5} />
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
                        <MultiImageUpload value={coverImages} onChange={setCoverImages} maxFiles={1} maxSize={10} />
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
                        This significantly speeds up the approval process.
                      </p>
                    </div>
                    <div>
                      <div className="space-y-3">
                        {[
                          "Business Registration Certificate (CAC, RoC, etc.)",
                          "Company TIN / Tax Registration",
                          "Director ID / Passport",
                          "Operating License",
                        ].map(doc => (
                          <div key={doc} className="flex items-center gap-2 text-[12px] text-white/40">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary/50 shrink-0" />
                            {doc}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-5 border border-white/10 shadow-inner">
                      <MultiImageUpload value={docImages} onChange={setDocImages} maxFiles={3} maxSize={10} />
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
                    {/* Logo preview */}
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
                            (value === "Uploaded" || value === "3 documents") ? "text-primary" : "text-white"
                          )}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-[12px] font-medium text-primary/90 leading-normal flex items-start gap-2.5">
                      <div className="mt-0.5">⚡</div>
                      <div>
                        After submission, our admin team will review your application within 1–3 business days.
                        Once approved, your company account will be activated and you'll gain access to the
                        Company Portal to post jobs, tenders, and manage applications.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Footer Actions ── */}
            <div className="pt-6 px-4 sm:px-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 mt-2">
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
                    disabled={submitMutation.isPending}
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
                    disabled={submitMutation.isPending || !user}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-primary text-[13px] font-bold text-primary-foreground hover:brightness-110 active:scale-95 shadow-sm shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</>
                    ) : (
                      <><Check className="h-4 w-4" />Submit Application</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
