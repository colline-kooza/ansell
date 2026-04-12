"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check, ChevronLeft, ChevronRight, CloudUpload, Camera,
  User, FileText, MapPin, Phone, X, Loader2,
} from "lucide-react";
import { useUploadImage } from "@/hooks/use-upload";
import { buildApiUrl } from "@/lib/api";
import { toast } from "sonner";
import Webcam from "react-webcam";

// ─── Stepper ──────────────────────────────────────────────────────────────────

const STEPS = [
  { id: "personal", label: "Personal Info" },
  { id: "contact", label: "Contact" },
  { id: "nextofkin", label: "Next of Kin" },
  { id: "documents", label: "Documents" },
  { id: "review", label: "Review" },
];

function Stepper({ current }: { current: number }) {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <div className="relative flex justify-between">
        {/* Base line */}
        <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200 -z-10" />
        {/* Progress line */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500 -z-10"
          style={{ width: `${(current / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((step, idx) => {
          const done = idx < current;
          const active = idx === current;
          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-white ${
                  done ? "bg-primary border-primary" : active ? "border-primary" : "border-gray-200"
                }`}
              >
                {done ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : active ? (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                ) : null}
              </div>
              <span
                className={`mt-2 text-[10px] font-medium text-center uppercase tracking-tight max-w-[70px] ${
                  active ? "text-primary font-bold" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition ${props.className ?? ""}`}
    />
  );
}

function Select({
  options, ...props
}: { options: {label: string; value: string}[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:border-primary/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition appearance-none"
    >
      <option value="">Select…</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ─── Upload Card ──────────────────────────────────────────────────────────────

function UploadCard({
  title, description, value, onChange,
}: { title: string; description?: string; value?: string; onChange: (url: string) => void }) {
  const { mutateAsync: upload, isPending } = useUploadImage();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      const result = await upload(file);
      onChange(result.data.url);
      toast.success("File uploaded!");
    } catch {
      toast.error("Upload failed");
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-6 text-center transition-all hover:border-primary/50 hover:bg-primary/5"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {isPending ? (
        <Loader2 className="size-8 animate-spin text-primary" />
      ) : value ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="uploaded" className="mb-3 max-h-28 rounded-lg object-contain" />
          <p className="text-xs font-semibold text-emerald-600">✓ Uploaded</p>
        </>
      ) : (
        <>
          <CloudUpload className="mb-4 size-10 text-gray-300" />
          <p className="text-sm font-bold text-gray-700">{title}</p>
          {description && <p className="mt-1 max-w-[200px] text-xs text-gray-400">{description}</p>}
        </>
      )}
    </div>
  );
}

// ─── Selfie Camera ────────────────────────────────────────────────────────────

function SelfieCard({ value, onChange }: { value?: string; onChange: (url: string) => void }) {
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const { mutateAsync: upload, isPending } = useUploadImage();

  const captureAndUpload = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;
    // Convert data URL to blob then File
    const res = await fetch(imageSrc);
    const blob = await res.blob();
    const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
    try {
      const result = await upload(file);
      onChange(result.data.url);
      setShowCamera(false);
      toast.success("Selfie captured!");
    } catch {
      toast.error("Upload failed");
    }
  }, [upload, onChange]);

  return (
    <div className="min-h-[200px] rounded-2xl border-2 border-dashed border-gray-200 bg-white overflow-hidden">
      {showCamera ? (
        <div className="flex flex-col items-center gap-3 p-4">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full max-w-xs rounded-xl"
            videoConstraints={{ facingMode: "user" }}
          />
          <div className="flex gap-2">
            <button
              onClick={captureAndUpload}
              disabled={isPending}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
              {isPending ? "Uploading..." : "Capture"}
            </button>
            <button onClick={() => setShowCamera(false)} className="rounded-full border border-border px-4 py-2 text-sm">
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : value ? (
        <div className="flex flex-col items-center gap-3 p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="selfie" className="max-h-36 rounded-xl object-contain" />
          <button onClick={() => setShowCamera(true)} className="text-xs text-primary hover:underline">Retake</button>
        </div>
      ) : (
        <button
          onClick={() => setShowCamera(true)}
          className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-3 p-6"
        >
          <Camera className="size-10 text-gray-300" />
          <p className="text-sm font-bold text-gray-700">Take a Selfie</p>
          <p className="text-xs text-gray-400 max-w-[200px]">Take a clear selfie for identity verification</p>
        </button>
      )}
    </div>
  );
}

// ─── Form Data ────────────────────────────────────────────────────────────────

const SOUTH_SUDAN_STATES = [
  "Central Equatoria", "Eastern Equatoria", "Western Equatoria",
  "Jonglei", "Unity", "Upper Nile", "Warrap", "Northern Bahr el Ghazal",
  "Western Bahr el Ghazal", "Lakes"
];

interface FormData {
  first_name: string; middle_name: string; last_name: string;
  date_of_birth: string; gender: string; nationality: string;
  place_of_birth: string; state_of_origin: string; county_of_origin: string;
  marital_status: string; occupation: string;
  phone_number: string; email: string; current_address: string;
  current_city: string; current_state: string;
  next_of_kin_name: string; next_of_kin_relationship: string;
  next_of_kin_phone: string; next_of_kin_address: string;
  passport_photo_url: string; birth_certificate_url: string;
  proof_of_residence_url: string; id_type: string;
}

const INITIAL: FormData = {
  first_name: "", middle_name: "", last_name: "",
  date_of_birth: "", gender: "", nationality: "South Sudanese",
  place_of_birth: "", state_of_origin: "", county_of_origin: "",
  marital_status: "", occupation: "",
  phone_number: "", email: "", current_address: "",
  current_city: "", current_state: "",
  next_of_kin_name: "", next_of_kin_relationship: "",
  next_of_kin_phone: "", next_of_kin_address: "",
  passport_photo_url: "", birth_certificate_url: "",
  proof_of_residence_url: "", id_type: "national_id",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IDVerificationPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");

  const set = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 0) {
      if (!form.first_name.trim()) { toast.error("First name is required"); return false; }
      if (!form.last_name.trim()) { toast.error("Last name is required"); return false; }
      if (!form.date_of_birth) { toast.error("Date of birth is required"); return false; }
      if (!form.gender) { toast.error("Gender is required"); return false; }
      if (!form.marital_status) { toast.error("Marital status is required"); return false; }
      if (!form.place_of_birth.trim()) { toast.error("Place of birth is required"); return false; }
      if (!form.state_of_origin) { toast.error("State of origin is required"); return false; }
      if (!form.county_of_origin.trim()) { toast.error("County of origin is required"); return false; }
    }
    if (currentStep === 1) {
      if (!form.phone_number.trim()) { toast.error("Phone number is required"); return false; }
      if (!form.current_address.trim()) { toast.error("Current address is required"); return false; }
      if (!form.current_city.trim()) { toast.error("Current city is required"); return false; }
      if (!form.current_state) { toast.error("Current state is required"); return false; }
    }
    if (currentStep === 2) {
      if (!form.next_of_kin_name.trim()) { toast.error("Next of kin name is required"); return false; }
      if (!form.next_of_kin_relationship) { toast.error("Next of kin relationship is required"); return false; }
      if (!form.next_of_kin_phone.trim()) { toast.error("Next of kin phone number is required"); return false; }
    }
    if (currentStep === 3) {
      if (!form.passport_photo_url) { toast.error("Passport photo is required"); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    // Final safety check for all required fields
    if (!form.first_name.trim() || !form.last_name.trim()) { toast.error("Name is required"); return; }
    if (!form.phone_number.trim() || !form.current_address.trim() || !form.current_city.trim()) { 
      toast.error("Contact information is incomplete"); 
      return; 
    }
    if (!form.next_of_kin_name.trim() || !form.next_of_kin_phone.trim()) { 
      toast.error("Next of kin details are incomplete"); 
      return; 
    }
    if (!form.passport_photo_url) { toast.error("Identity document photo is missing"); return; }

    setIsSubmitting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("ansell_auth_token") : null;
      const res = await fetch(buildApiUrl("national-id/apply"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Submission failed");
      setReferenceNumber(json.data?.reference_number ?? "");
      setSubmitted(true);
      toast.success(json.message || "Application submitted!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md text-center"
        >
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100">
            <Check className="size-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Application Submitted!</h1>
          <p className="mt-2 text-gray-500">Your National ID application has been received.</p>
          {referenceNumber && (
            <div className="mt-4 rounded-2xl bg-white px-6 py-4 shadow-sm border border-border">
              <p className="text-xs text-muted-foreground">Reference Number</p>
              <p className="text-xl font-black text-primary tracking-wider">{referenceNumber}</p>
              <p className="mt-1 text-xs text-muted-foreground">Save this for tracking your application</p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  const steps = [
    /* Step 0: Personal Info */
    <div key="personal" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="First Name" required>
        <Input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} placeholder="e.g. John" />
      </Field>
      <Field label="Middle Name">
        <Input value={form.middle_name} onChange={(e) => set("middle_name", e.target.value)} placeholder="Optional" />
      </Field>
      <Field label="Last Name" required>
        <Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} placeholder="e.g. Deng" />
      </Field>
      <Field label="Date of Birth" required>
        <Input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
      </Field>
      <Field label="Gender" required>
        <Select
          value={form.gender}
          onChange={(e) => set("gender", e.target.value)}
          options={[{ label: "Male", value: "male" }, { label: "Female", value: "female" }, { label: "Other", value: "other" }]}
        />
      </Field>
      <Field label="Marital Status" required>
        <Select
          value={form.marital_status}
          onChange={(e) => set("marital_status", e.target.value)}
          options={["Single", "Married", "Divorced", "Widowed"].map((v) => ({ label: v, value: v.toLowerCase() }))}
        />
      </Field>
      <Field label="Place of Birth" required>
        <Input value={form.place_of_birth} onChange={(e) => set("place_of_birth", e.target.value)} placeholder="City or Town" />
      </Field>
      <Field label="State of Origin" required>
        <Select
          value={form.state_of_origin}
          onChange={(e) => set("state_of_origin", e.target.value)}
          options={SOUTH_SUDAN_STATES.map((s) => ({ label: s, value: s }))}
        />
      </Field>
      <Field label="County of Origin" required>
        <Input value={form.county_of_origin} onChange={(e) => set("county_of_origin", e.target.value)} placeholder="e.g. Juba County" />
      </Field>
      <Field label="Occupation">
        <Input value={form.occupation} onChange={(e) => set("occupation", e.target.value)} placeholder="e.g. Teacher" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="ID Type">
          <Select
            value={form.id_type}
            onChange={(e) => set("id_type", e.target.value)}
            options={[
              { label: "National ID", value: "national_id" },
              { label: "Birth Certificate", value: "birth_certificate" },
            ]}
          />
        </Field>
      </div>
    </div>,

    /* Step 1: Contact */
    <div key="contact" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Phone Number" required>
        <Input type="tel" value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} placeholder="+211 ..." />
      </Field>
      <Field label="Email">
        <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Current Address" required>
          <Input value={form.current_address} onChange={(e) => set("current_address", e.target.value)} placeholder="Street / Quarter" />
        </Field>
      </div>
      <Field label="Current City" required>
        <Input value={form.current_city} onChange={(e) => set("current_city", e.target.value)} placeholder="e.g. Juba" />
      </Field>
      <Field label="Current State" required>
        <Select
          value={form.current_state}
          onChange={(e) => set("current_state", e.target.value)}
          options={SOUTH_SUDAN_STATES.map((s) => ({ label: s, value: s }))}
        />
      </Field>
    </div>,

    /* Step 2: Next of Kin */
    <div key="nextofkin" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Full Name" required>
        <Input value={form.next_of_kin_name} onChange={(e) => set("next_of_kin_name", e.target.value)} placeholder="Next of kin name" />
      </Field>
      <Field label="Relationship" required>
        <Select
          value={form.next_of_kin_relationship}
          onChange={(e) => set("next_of_kin_relationship", e.target.value)}
          options={["Father", "Mother", "Sibling", "Spouse", "Child", "Other"].map((v) => ({ label: v, value: v.toLowerCase() }))}
        />
      </Field>
      <Field label="Phone Number" required>
        <Input type="tel" value={form.next_of_kin_phone} onChange={(e) => set("next_of_kin_phone", e.target.value)} placeholder="+211 ..." />
      </Field>
      <Field label="Address">
        <Input value={form.next_of_kin_address} onChange={(e) => set("next_of_kin_address", e.target.value)} placeholder="Address" />
      </Field>
    </div>,

    /* Step 3: Documents */
    <div key="documents" className="space-y-6">
      <div className="rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-700">
        <strong>Important:</strong> All photos must be clear, well-lit, and show all text. Accepted formats: JPG, PNG, PDF (max 10MB).
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">Passport Photo <span className="text-red-500">*</span></p>
          <SelfieCard value={form.passport_photo_url} onChange={(url) => set("passport_photo_url", url)} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">Birth Certificate</p>
          <UploadCard
            title="Upload Birth Certificate"
            description=".jpg or .pdf, more than 500KB or 300DPI"
            value={form.birth_certificate_url}
            onChange={(url) => set("birth_certificate_url", url)}
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">Proof of Residence</p>
          <UploadCard
            title="Upload Proof of Residence"
            description="Utility bill, lease, or official letter"
            value={form.proof_of_residence_url}
            onChange={(url) => set("proof_of_residence_url", url)}
          />
        </div>
      </div>
    </div>,

    /* Step 4: Review */
    <div key="review" className="space-y-4">
      <div className="rounded-2xl border border-border bg-white p-5 space-y-3">
        <h3 className="font-bold text-gray-900">Personal Information</h3>
        <ReviewRow label="Full Name" value={`${form.first_name} ${form.middle_name} ${form.last_name}`.trim()} />
        <ReviewRow label="Date of Birth" value={form.date_of_birth} />
        <ReviewRow label="Gender" value={form.gender} />
        <ReviewRow label="State of Origin" value={form.state_of_origin} />
        <ReviewRow label="County" value={form.county_of_origin} />
        <ReviewRow label="Marital Status" value={form.marital_status} />
      </div>
      <div className="rounded-2xl border border-border bg-white p-5 space-y-3">
        <h3 className="font-bold text-gray-900">Contact Details</h3>
        <ReviewRow label="Phone" value={form.phone_number} />
        <ReviewRow label="Email" value={form.email || "—"} />
        <ReviewRow label="City" value={form.current_city} />
        <ReviewRow label="State" value={form.current_state} />
      </div>
      <div className="rounded-2xl border border-border bg-white p-5 space-y-3">
        <h3 className="font-bold text-gray-900">Next of Kin</h3>
        <ReviewRow label="Name" value={form.next_of_kin_name} />
        <ReviewRow label="Relationship" value={form.next_of_kin_relationship} />
        <ReviewRow label="Phone" value={form.next_of_kin_phone} />
      </div>
      <div className="rounded-2xl border border-border bg-white p-5">
        <h3 className="mb-3 font-bold text-gray-900">Uploaded Documents</h3>
        <div className="flex flex-wrap gap-4">
          {form.passport_photo_url && (
            <div className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.passport_photo_url} alt="passport" className="h-20 w-20 rounded-xl object-cover border" />
              <p className="mt-1 text-[10px] text-muted-foreground">Photo</p>
            </div>
          )}
          {form.birth_certificate_url && (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl border bg-muted text-xs font-semibold text-center text-muted-foreground">
              Birth Cert ✓
            </div>
          )}
          {form.proof_of_residence_url && (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl border bg-muted text-xs font-semibold text-center text-muted-foreground">
              Residence ✓
            </div>
          )}
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="border-b border-border/50 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 pt-24">
          <h1 className="text-center text-lg font-black text-gray-900 uppercase tracking-tight">
            National ID Application
          </h1>
          <Stepper current={step} />
        </div>
      </div>

      {/* Step content */}
      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-black text-gray-900 uppercase">{STEPS[step].label}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Step {step + 1} of {STEPS.length}</p>
            </div>
            {steps[step]}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 rounded-full bg-gray-100 px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 transition hover:bg-gray-200 disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />Previous
          </button>

          {step < STEPS.length - 1 ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-lg"
            >
              Next Step<ChevronRight className="size-4" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={isSubmitting || !form.first_name || !form.last_name || !form.passport_photo_url}
              className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-lg disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm border-b border-border/40 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold capitalize">{value}</span>
    </div>
  );
}
