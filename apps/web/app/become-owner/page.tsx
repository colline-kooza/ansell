"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useSubmitOwnerApplication } from "@/hooks/use-owner-applications";
import { MultiImageUpload } from "@/components/shared/multi-image-upload";
import {
  ArrowRight, ArrowLeft, Check, MapPin, FileText,
  User, Briefcase, Loader2, CheckCircle2, Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast, Toaster } from "sonner";

const STEPS = [
  { id: 1, title: "Your Profile", description: "Tell us about yourself", icon: User },
  { id: 2, title: "Business Info", description: "Your business details", icon: Briefcase },
  { id: 3, title: "Location", description: "Where are you based?", icon: MapPin },
  { id: 4, title: "Documents", description: "Supporting documents", icon: FileText },
  { id: 5, title: "Review", description: "Confirm & submit", icon: Check },
];

const BUSINESS_TYPES = [
  { value: "individual", label: "Individual Agent", desc: "Independent real estate agent" },
  { value: "agency", label: "Real Estate Agency", desc: "Licensed property agency" },
  { value: "developer", label: "Property Developer", desc: "Land developer & builder" },
  { value: "company", label: "Corporate Company", desc: "Commercial real estate firm" },
];

interface FormData {
  business_name: string;
  business_type: string;
  phone_number: string;
  address: string;
  city: string;
  description: string;
  document_url: string;
}

export default function OwnerOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const submitMutation = useSubmitOwnerApplication();

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [docImages, setDocImages] = useState<string[]>([]);
  const [form, setForm] = useState<FormData>({
    business_name: "",
    business_type: "individual",
    phone_number: "",
    address: "",
    city: "",
    description: "",
    document_url: "",
  });

  const update = (key: keyof FormData, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!form.business_name.trim()) { toast.error("Business name is required"); return false; }
    }
    if (step === 2) {
      if (!form.business_type) { toast.error("Please select a business type"); return false; }
      if (!form.phone_number.trim()) { toast.error("Phone number is required"); return false; }
    }
    if (step === 3) {
      if (!form.city.trim()) { toast.error("City is required"); return false; }
    }
    if (step === 4) {
      if (docImages.length === 0) { toast.error("Please upload your ID or business registration document"); return false; }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(5, s + 1));
  };

  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    if (!form.business_name || !form.phone_number || !form.city || docImages.length === 0) {
      toast.error("Please fill all required fields and upload supporting documents");
      return;
    }
    try {
      await submitMutation.mutateAsync({
        ...form,
        document_url: docImages[0] || "",
      });
      setSubmitted(true);
    } catch {
      // error handled by hook
    }
  };

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
            Your property owner application has been received. Our team will review it
            within 1–3 business days and notify you of the decision. Once approved,
            you'll have full access to your owner dashboard.
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
              Sign In to Check Status
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <p className="text-[1.5rem] font-black tracking-[-0.06em] text-white">Anasell</p>
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-primary/70">Real Estate</p>
          </div>
        </Link>
      </div>

      {/* ── Main Centered Container ── */}
      <div className="flex-1 flex flex-col items-center px-4 pb-16 w-full">
        <div className="w-full max-w-[560px]">
          
          {/* Removed background box to make it flush and clean */}
          <div className="animate-in fade-in zoom-in-[0.98] duration-500">
            
            {/* Body */}
            <div className="p-4 sm:px-6">
              {/* Progress & Header */}
              <div className="mb-8 text-center flex flex-col items-center">
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

              {/* Dynamic Step Content */}
              <div className="min-h-[260px]">
                {/* ── Step 1: Profile ── */}
                {step === 1 && (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                          Full Name
                        </label>
                        <div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] font-medium text-white/60">
                          {user ? `${user.first_name} ${user.last_name}` : "Not signed in"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                          Email Address
                        </label>
                        <div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] font-medium text-white/60 truncate">
                          {user?.email || "Not signed in"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5 mt-2">
                        Business / Agency Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.business_name}
                        onChange={(e) => update("business_name", e.target.value)}
                        placeholder="e.g. Kinyua Properties Ltd"
                        className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-[13px] font-medium text-white placeholder:text-white/30 outline-none focus:border-primary focus:bg-white/10 transition-all"
                      />
                    </div>

                    {!user && (
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 mt-3 text-[13px] text-amber-400 flex items-start gap-2.5">
                        <span className="text-lg">⚠️</span>
                        <span>
                          Please{" "}
                          <Link href="/login?redirect=/become-owner" className="underline font-bold text-amber-300">
                            sign in
                          </Link>{" "}
                          first to submit your owner application.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Step 2: Business Info ── */}
                {step === 2 && (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-2">
                        Business Type <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {BUSINESS_TYPES.map((bt) => (
                          <button
                            key={bt.value}
                            type="button"
                            onClick={() => update("business_type", bt.value)}
                            className={cn(
                              "text-left rounded-xl border p-3.5 transition-all duration-200 outline-none",
                              form.business_type === bt.value
                                ? "border-primary bg-primary/10 scale-[0.98]"
                                : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                            )}
                          >
                            <p className={cn("text-[13px] font-semibold", form.business_type === bt.value ? "text-primary" : "text-white")}>
                              {bt.label}
                            </p>
                            <p className="text-[11px] text-white/40 mt-0.5 line-clamp-1">{bt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        value={form.phone_number}
                        onChange={(e) => update("phone_number", e.target.value)}
                        placeholder="+211 922 000 000"
                        className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-[13px] font-medium text-white placeholder:text-white/30 outline-none focus:border-primary focus:bg-white/10 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                        Business Description
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) => update("description", e.target.value)}
                        rows={3}
                        placeholder="Brief description of your property business..."
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-[13px] font-medium text-white placeholder:text-white/30 outline-none focus:border-primary focus:bg-white/10 transition-all resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* ── Step 3: Location ── */}
                {step === 3 && (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                        City / Town <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => update("city", e.target.value)}
                        placeholder="e.g. Kampala"
                        className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-[13px] font-medium text-white placeholder:text-white/30 outline-none focus:border-primary focus:bg-white/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                        Physical Address
                      </label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) => update("address", e.target.value)}
                        placeholder="e.g. Plot 25, Bombo Road"
                        className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-[13px] font-medium text-white placeholder:text-white/30 outline-none focus:border-primary focus:bg-white/10 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* ── Step 4: Documents ── */}
                {step === 4 && (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
                      <p className="text-[13px] font-bold text-primary mb-1">Supporting Document (Optional)</p>
                      <p className="text-[12px] text-white/60 leading-normal">
                        Upload a business registration certificate, agent license, or any 
                        document that verifies your identity/business. This helps with faster approval.
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-5 border border-white/10 shadow-inner">
                      <MultiImageUpload
                        value={docImages}
                        onChange={setDocImages}
                        maxFiles={1}
                        maxSize={10}
                      />
                      {docImages.length > 0 && (
                        <p className="text-[12px] font-bold text-primary mt-3 flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Document ready to submit
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Step 5: Review ── */}
                {step === 5 && (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    <div className="rounded-xl border border-white/10 bg-white/5 divide-y divide-white/5 overflow-hidden">
                      {[
                        { label: "Name", value: user ? `${user.first_name} ${user.last_name}` : "—" },
                        { label: "Email", value: user?.email || "—" },
                        { label: "Business", value: form.business_name || "—" },
                        { label: "Type", value: BUSINESS_TYPES.find(b => b.value === form.business_type)?.label || "—" },
                        { label: "Phone", value: form.phone_number || "—" },
                        { label: "Location", value: `${form.city}${form.address ? `, ${form.address}` : ''}` || "—" },
                        { label: "Verification", value: docImages.length > 0 ? "Document Uploaded" : "None provided" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center px-5 py-3 hover:bg-white/[0.02] transition-colors">
                          <span className="text-[11px] text-white/40 font-bold uppercase tracking-wider">{label}</span>
                          <span className={cn(
                            "text-[13px] font-semibold text-right max-w-[60%] truncate",
                            label === "Verification" && value === "Document Uploaded" ? "text-primary" : "text-white"
                          )}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-[12px] font-medium text-primary/90 leading-normal flex items-start gap-2.5">
                      <div className="mt-0.5">⚡</div>
                      <div>
                        After submission, our admin team will review your application. Once approved, your account role will be upgraded and you'll gain access to the dedicated Owner Dashboard.
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
                    Already an owner?{" "}
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

                {step < 5 ? (
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
                      <><Loader2 className="h-4 w-4 animate-spin" /> Submitting</>
                    ) : (
                      <><Check className="h-4 w-4" /> Submit</>
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
