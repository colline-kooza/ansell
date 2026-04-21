"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useSubmitOwnerApplication } from "@/hooks/use-owner-applications";
import { MultiImageUpload } from "@/components/shared/multi-image-upload";
import { buildApiUrl } from "@/lib/api";
import { FrontendNavbar } from "@/components/layout/frontend-navbar";
import { FrontendFooter } from "@/components/layout/frontend-footer";
import {
  ArrowRight, ArrowLeft, Check, MapPin, FileText,
  User, Briefcase, Loader2, CheckCircle2, Home,
  Eye, EyeOff, Lock, Mail,
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

interface Credentials {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

const inputCls =
  "w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-[13px] font-medium text-white placeholder:text-white/30 outline-none focus:border-primary focus:bg-white/10 transition-all";

export default function OwnerOnboardingPage() {
  const { user, login } = useAuth();
  const submitMutation = useSubmitOwnerApplication();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [docImages, setDocImages] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const [creds, setCreds] = useState<Credentials>({
    first_name: "", last_name: "", email: "", password: "",
  });

  const [form, setForm] = useState<FormData>({
    business_name: "",
    business_type: "individual",
    phone_number: "",
    address: "",
    city: "",
    description: "",
    document_url: "",
  });

  const updateCred = (k: keyof Credentials, v: string) =>
    setCreds((p) => ({ ...p, [k]: v }));
  const update = (key: keyof FormData, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const displayName = user
    ? `${user.first_name} ${user.last_name}`
    : creds.first_name || creds.last_name
    ? `${creds.first_name} ${creds.last_name}`.trim()
    : "—";
  const displayEmail = user?.email || creds.email || "—";

  const [validatingEmail, setValidatingEmail] = useState(false);

  async function verifyEmailDomain(email: string): Promise<string | null> {
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return "Invalid email format.";
    const disposable = [
      "mailinator.com","guerrillamail.com","10minutemail.com","tempmail.com","yopmail.com",
      "sharklasers.com","guerrillamailblock.com","throwam.com","maildrop.cc","trashmail.com",
      "fakeinbox.com","dispostable.com","spamgourmet.com","mytemp.email","temp-mail.org",
      "example.com","test.com","sample.com","fake.com","invalid.com",
    ];
    if (disposable.includes(domain)) return "Disposable or example email addresses are not allowed.";
    try {
      const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`);
      if (res.ok) {
        const data = await res.json();
        if (!data.Answer || data.Answer.length === 0) {
          return `The email domain "${domain}" does not appear to be a valid mail domain.`;
        }
      }
    } catch {
      // network issue — don't block, fall through
    }
    return null;
  }

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!form.business_name.trim()) { toast.error("Business name is required"); return false; }
      if (!user) {
        if (!creds.first_name.trim() || !creds.last_name.trim()) {
          toast.error("Full name is required"); return false;
        }
        if (!creds.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(creds.email)) {
          toast.error("A valid email address is required"); return false;
        }
        if (creds.password.length < 8) {
          toast.error("Password must be at least 8 characters"); return false;
        }
      }
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

  const nextStep = async () => {
    if (!validateStep()) return;
    // Async email domain check on step 1 for new users
    if (step === 1 && !user && creds.email) {
      setValidatingEmail(true);
      const emailErr = await verifyEmailDomain(creds.email);
      setValidatingEmail(false);
      if (emailErr) { toast.error(emailErr); return; }
    }
    setStep((s) => Math.min(5, s + 1));
  };

  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    if (!form.business_name || !form.phone_number || !form.city || docImages.length === 0) {
      toast.error("Please fill all required fields and upload supporting documents");
      return;
    }

    setSubmitting(true);
    try {
      // Register account if not logged in
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
          toast.error(regData.message || "Failed to create account. Email may already be registered.");
          return;
        }
        // Store token so the mutation's getAuthHeaders() picks it up from localStorage
        login(regData.data.token, regData.data.user);
      }

      await submitMutation.mutateAsync({
        ...form,
        document_url: docImages[0] || "",
      });
      localStorage.setItem("ansell_pending_owner_application", "true");
      toast.success("Application submitted! Our team will review it within 1–3 business days.");
      router.push("/");
    } catch {
      // mutation onError already shows toast
    } finally {
      setSubmitting(false);
    }
  };

  const isPending = submitting || submitMutation.isPending;

  return (
    <>
      <FrontendNavbar />
      <Toaster position="top-center" richColors />

      <div className="min-h-screen bg-[#080d08] text-white flex flex-col [font-family:var(--font-poppins)] selection:bg-primary/30 pt-20">

        {/* ── Main Centered Container ── */}
        <div className="flex-1 flex flex-col items-center px-4 pb-16 pt-10 w-full">
          <div className="w-full max-w-[560px]">

            {/* Page title */}
            <div className="mb-8 text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-primary/80 mb-3">Property Owner Application</p>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Become a Property Owner</h1>
              <p className="text-[13px] text-white/50">List your properties and reach thousands of South Sudanese buyers and renters.</p>
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
              <div className="min-h-[260px] px-0 sm:px-2">

                {/* Step 1: Profile */}
                {step === 1 && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    {user ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Full Name</label>
                          <div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] font-medium text-white/60">
                            {user.first_name} {user.last_name}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Email Address</label>
                          <div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[13px] font-medium text-white/60 truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-[12px] text-primary/90 leading-relaxed">
                          <p className="font-bold mb-1">Set your login credentials</p>
                          These will be your <span className="font-bold">permanent login details</span> once an admin approves your application.
                          No email verification needed — approval activates your account instantly.
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                              First Name <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={creds.first_name}
                              onChange={(e) => updateCred("first_name", e.target.value)}
                              placeholder="e.g. John"
                              className={inputCls}
                            />
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

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                        Business / Agency Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.business_name}
                        onChange={(e) => update("business_name", e.target.value)}
                        placeholder="e.g. Kinyua Properties Ltd"
                        className={inputCls}
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Business Info */}
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
                        className={inputCls}
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

                {/* Step 3: Location */}
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
                        placeholder="e.g. Juba"
                        className={inputCls}
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
                        className={inputCls}
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Documents */}
                {step === 4 && (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    <div className="rounded-xl bg-primary/10 border border-primary/20 p-4">
                      <p className="text-[13px] font-bold text-primary mb-1">Supporting Document</p>
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

                {/* Step 5: Review */}
                {step === 5 && (
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    <div className="rounded-xl border border-white/10 bg-white/5 divide-y divide-white/5 overflow-hidden">
                      {[
                        { label: "Name", value: displayName },
                        { label: "Email", value: displayEmail },
                        { label: "Business", value: form.business_name || "—" },
                        { label: "Type", value: BUSINESS_TYPES.find(b => b.value === form.business_type)?.label || "—" },
                        { label: "Phone", value: form.phone_number || "—" },
                        { label: "Location", value: `${form.city}${form.address ? `, ${form.address}` : ""}` || "—" },
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

                    {!user && creds.email && (
                      <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">Your Login Credentials After Approval</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-white/40 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</span>
                          <span className="text-[13px] font-bold text-primary">{creds.email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-white/40 flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Password</span>
                          <span className="text-[13px] font-bold text-white/60">{"•".repeat(Math.min(creds.password.length, 10))}</span>
                        </div>
                      </div>
                    )}
                    <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-[12px] font-medium text-primary/90 leading-normal flex items-start gap-2.5">
                      <div className="mt-0.5">⚡</div>
                      <div>
                        {user
                          ? "After submission, our admin team will review your application. You can track the application status while you wait, and owner features unlock only after approval."
                          : `Account will be created with ${displayEmail}. After admin approval, sign in with those credentials to view your application status and use owner features once approved.`}
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
                      disabled={isPending}
                      className="flex-1 sm:flex-none flex items-center justify-center h-11 px-5 rounded-xl border border-white/10 text-[13px] font-bold text-white hover:bg-white/5 transition-all disabled:opacity-40"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                    </button>
                  )}

                  {step < 5 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={validatingEmail}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-primary text-[13px] font-bold text-primary-foreground hover:brightness-110 active:scale-95 shadow-sm shadow-primary/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {validatingEmail ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Verifying email…</>
                      ) : (
                        <>Continue <ArrowRight className="h-4 w-4" /></>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isPending}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-primary text-[13px] font-bold text-primary-foreground hover:brightness-110 active:scale-95 shadow-sm shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Submitting</>
                      ) : (
                        <><Check className="h-4 w-4" /> Submit Application</>
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


