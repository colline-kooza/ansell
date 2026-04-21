"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowRight, Eye, EyeOff, Mail, Lock, User, Phone, ShieldCheck, RefreshCw } from "lucide-react";
import { Toaster, toast } from "sonner";

import { buildApiUrl } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { AuthUser } from "@/context/auth-context";
import { CategoryCarousel } from "@/components/auth/category-carousel";
import { getAuthenticatedHomeHref, isAdminRole, isCompanyRole, isOwnerRole } from "@/lib/pending-applications";

type RegisterResponse = {
  success: boolean;
  message: string;
  data?: { token: string; user: AuthUser };
  error?: string;
};

function getRoleRedirect(role: string, fallback: string): string {
  const isSuper = isAdminRole(role);
  const isOwner = isOwnerRole(role);
  const isCompany = isCompanyRole(role);

  if (fallback && fallback !== "/" && fallback !== "/dashboard" && fallback !== "/login") {
    const isOwnerRoute = fallback.startsWith("/owner");
    const isCompanyRoute = fallback.startsWith("/company");
    const isAdminRoute = fallback.startsWith("/admin");

    const validFallback =
      (isOwnerRoute && isOwner) ||
      (isCompanyRoute && isCompany) ||
      (isAdminRoute && isSuper) ||
      (!isOwnerRoute && !isCompanyRoute && !isAdminRoute &&
        !(fallback.startsWith("/user/dashboard") && (isOwner || isCompany || isSuper)));

    if (validFallback) return fallback;
  }

  return getAuthenticatedHomeHref(role);
}

// ── Step 1: Registration form ─────────────────────────────────────────────────

function RegistrationForm({
  onSuccess,
}: {
  onSuccess: (email: string, token: string, user: AuthUser) => void;
}) {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") ?? "/";

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", email: "", password: "", phone: "",
  });

  function set(field: keyof typeof formData) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormData((p) => ({ ...p, [field]: e.target.value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl("auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = (await response.json()) as RegisterResponse;
      if (!response.ok || !result.success || !result.data) {
        toast.error(result.message || "Failed to create account.");
        return;
      }

      // Send OTP
      const otpRes = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      if (!otpRes.ok) {
        const otpData = await otpRes.json().catch(() => null);
        toast.error(otpData?.message || "Account created but could not send verification email. Please contact support.");
      }

      onSuccess(formData.email, result.data.token, result.data.user);
    } catch {
      toast.error("Unable to create account right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="mb-7 text-center">
        <h2 className="text-3xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-[1.8rem]">
          Create your account.
          <br />
          Join the marketplace.
        </h2>
        <p className="mt-4 text-xs leading-6 text-white/60">
          Access jobs, properties, tenders, courses and more across South Sudan.
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45">
              <User className="size-4" />
            </span>
            <input
              type="text" placeholder="First name" value={formData.first_name} onChange={set("first_name")}
              className="w-full rounded-full border border-white/14 bg-[#161d16] px-10 py-4 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-primary"
              required disabled={isLoading}
            />
          </div>
          <div className="relative">
            <input
              type="text" placeholder="Last name" value={formData.last_name} onChange={set("last_name")}
              className="w-full rounded-full border border-white/14 bg-[#161d16] px-4 py-4 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-primary"
              required disabled={isLoading}
            />
          </div>
        </div>

        <div className="relative">
          <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/45">
            <Mail className="size-4.5" />
          </span>
          <input
            type="email" placeholder="Email address" value={formData.email} onChange={set("email")}
            className="w-full rounded-full border border-white/14 bg-[#161d16] px-12 py-4 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-primary"
            required disabled={isLoading}
          />
        </div>

        <div className="relative">
          <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/45">
            <Phone className="size-4.5" />
          </span>
          <input
            type="tel" placeholder="Phone number (optional)" value={formData.phone} onChange={set("phone")}
            className="w-full rounded-full border border-white/14 bg-[#161d16] px-12 py-4 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-primary"
            disabled={isLoading}
          />
        </div>

        <div className="relative">
          <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/45">
            <Lock className="size-4.5" />
          </span>
          <input
            type={showPassword ? "text" : "password"} placeholder="Password (min 8 characters)"
            value={formData.password} onChange={set("password")}
            className="w-full rounded-full border border-white/14 bg-[#161d16] px-12 py-4 pr-12 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-primary"
            required minLength={8} disabled={isLoading}
          />
          <button
            type="button" onClick={() => setShowPassword((p) => !p)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/45 hover:text-white/75"
          >
            {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
          </button>
        </div>

        <button
          type="submit" disabled={isLoading}
          className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-6 py-4 text-sm font-semibold text-[#10210f] transition-all hover:brightness-95 disabled:opacity-60"
        >
          <span>{isLoading ? "Creating account..." : "Create Account"}</span>
          {!isLoading && <ArrowRight className="size-4" />}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-xs text-white/55">
        <Link href="/" className="hover:text-white">Back to storefront</Link>
      </div>

      <p className="mt-6 text-center text-xs text-white/45">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">Sign in</Link>
      </p>

      <div className="mt-5 border-t border-white/10 pt-5 flex flex-col gap-2">
        <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1">
          Register your business
        </p>
        <Link
          href="/become-owner"
          className="flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 py-2.5 text-xs font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          List a Property — Become an Owner
        </Link>
        <Link
          href="/become-company"
          className="flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 py-2.5 text-xs font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          Register Your Company
        </Link>
      </div>

      <p className="mt-4 text-center text-xs leading-relaxed text-white/30">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>
    </>
  );
}

// ── Step 2: OTP verification ──────────────────────────────────────────────────

function OtpVerification({
  email,
  token,
  user,
}: {
  email: string;
  token: string;
  user: AuthUser;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") ?? "/";
  const { login } = useAuth();

  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit code.");
      return;
    }
    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Invalid code. Please try again.");
        return;
      }
      login(token, user);
      toast.success("Email verified! Welcome to Anasell.");
      router.push(getRoleRedirect(user.role, redirectUrl));
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    try {
      const resendResponse = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const resendData = await resendResponse.json().catch(() => null);
      if (!resendResponse.ok) {
        toast.error(resendData?.message || "Could not resend. Please try again.");
        return;
      }
      toast.success("New code sent to your email.");
    } catch {
      toast.error("Could not resend. Please try again.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="text-center">
      <div className="mb-6 flex justify-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/15">
          <ShieldCheck className="size-8 text-primary" />
        </div>
      </div>
      <h2 className="text-[1.6rem] font-semibold tracking-tight text-white">Check your email</h2>
      <p className="mt-3 text-xs leading-6 text-white/55">
        We sent a 6-digit code to <span className="text-white font-medium">{email}</span>.<br />
        Enter it below to verify your account.
      </p>

      <form onSubmit={handleVerify} className="mt-7 space-y-3">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="w-full rounded-full border border-white/14 bg-[#161d16] px-6 py-4 text-center text-lg font-bold tracking-[0.3em] text-white placeholder:text-white/25 outline-none transition-colors focus:border-primary"
          disabled={isVerifying}
        />
        <button
          type="submit"
          disabled={isVerifying || otp.length < 6}
          className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-6 py-4 text-sm font-semibold text-[#10210f] transition-all hover:brightness-95 disabled:opacity-60"
        >
          {isVerifying ? "Verifying..." : "Verify Email"}
          {!isVerifying && <ArrowRight className="size-4" />}
        </button>
      </form>

      <button
        type="button"
        onClick={handleResend}
        disabled={isResending}
        className="mt-4 inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`size-3.5 ${isResending ? "animate-spin" : ""}`} />
        {isResending ? "Sending..." : "Resend code"}
      </button>
    </div>
  );
}

// ── Page shell ────────────────────────────────────────────────────────────────

function RegisterContent() {
  const [step, setStep] = useState<"register" | "verify">("register");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingToken, setPendingToken] = useState("");
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);

  const backgroundImages = [
    "https://picsum.photos/seed/ansell-auth-a/320/320",
    "https://picsum.photos/seed/ansell-auth-b/320/320",
    "https://picsum.photos/seed/ansell-auth-c/320/320",
    "https://picsum.photos/seed/ansell-auth-d/320/320",
    "https://picsum.photos/seed/ansell-auth-e/320/320",
    "https://picsum.photos/seed/ansell-auth-f/320/320",
    "https://picsum.photos/seed/ansell-auth-g/320/320",
    "https://picsum.photos/seed/ansell-auth-h/320/320",
  ];

  function handleRegistrationSuccess(email: string, token: string, user: AuthUser) {
    setPendingEmail(email);
    setPendingToken(token);
    setPendingUser(user);
    setStep("verify");
  }

  return (
    <div className="flex min-h-screen w-full flex-col overflow-hidden bg-[#080d08] text-white lg:h-screen lg:flex-row">
      <Toaster position="top-center" richColors />

      {/* Left panel */}
      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:h-screen lg:w-[58%]">
        <Image
          src="https://picsum.photos/seed/ansell-reg-hero/1400/1800"
          alt="Anasell register background"
          fill priority className="object-cover blur-[2px]" sizes="58vw"
        />
        <div className="absolute inset-0 bg-linear-to-br from-primary/92 via-primary/72 to-[#10210f]/74" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(16,33,15,0.45),_transparent_34%)]" />
        <div className="relative flex h-full w-full flex-col justify-between px-10 py-10 xl:px-14 xl:py-12">
          <Link href="/" className="w-fit">
            <div className="flex items-center gap-3">
              <div className="relative flex size-12 items-center justify-center">
                <div className="absolute left-1 top-1 h-7 w-3 -skew-x-[20deg] rounded-sm bg-[#10210f]" />
                <div className="absolute right-1 top-1 h-7 w-3 skew-x-[20deg] rounded-sm bg-[#10210f]/88" />
              </div>
              <div className="leading-none text-[#10210f]">
                <p className="text-[1.9rem] font-black tracking-[-0.06em]">Anasell</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#10210f]/72">
                  All Opportunities. One Platform.
                </p>
              </div>
            </div>
          </Link>
          <div className="max-w-xl pb-2">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-[#10210f]/72">Join Anasell</p>
            <CategoryCarousel />
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto bg-[#080d08] px-5 py-8 sm:px-6 lg:min-h-0 lg:w-[42%] lg:px-8">
        <div className="relative w-full max-w-md overflow-hidden bg-[#080d08] shadow-[0_30px_80px_-50px_rgba(0,0,0,0.85)]">
          {step === "register" && (
            <div className="relative w-full pt-6">
              <div className="grid w-full grid-cols-4 gap-2 px-4 opacity-55 sm:grid-cols-5 lg:grid-cols-4 lg:px-6">
                {backgroundImages.map((src, index) => {
                  const row = Math.floor(index / 4);
                  const col = index % 4;
                  const staggerClass = row % 2 === 1 ? "translate-x-3" : "-translate-x-1";
                  const verticalStagger =
                    (row + col) % 3 === 0 ? "translate-y-3" : (row + col) % 3 === 1 ? "-translate-y-2" : "translate-y-1";
                  return (
                    <div key={src} className={`aspect-square overflow-hidden rounded-full bg-white/8 ${staggerClass} ${verticalStagger}`}>
                      <Image src={src} alt="" width={160} height={160} className="h-full w-full object-cover" />
                    </div>
                  );
                })}
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent via-[#080d08]/80 to-[#080d08]" />
            </div>
          )}

          <div className={`relative z-10 mx-auto flex w-full max-w-sm flex-col px-5 pb-8 sm:px-7 ${step === "register" ? "-mt-16 pt-2" : "pt-8"}`}>
            <Link href="/" className="mb-6 flex justify-center">
              <div className="flex items-center gap-3">
                <div className="relative flex size-10 items-center justify-center">
                  <div className="absolute left-1 top-1 h-6 w-3 -skew-x-[20deg] rounded-sm bg-primary" />
                  <div className="absolute right-1 top-1 h-6 w-3 skew-x-[20deg] rounded-sm bg-primary/90" />
                </div>
                <div className="leading-none">
                  <p className="text-[1.6rem] font-black tracking-[-0.06em] text-white">Anasell</p>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/55 whitespace-nowrap">
                    All Opportunities. One Platform.
                  </p>
                </div>
              </div>
            </Link>

            {step === "register" ? (
              <RegistrationForm onSuccess={handleRegistrationSuccess} />
            ) : (
              pendingUser && (
                <OtpVerification email={pendingEmail} token={pendingToken} user={pendingUser} />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#080d08] text-white">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
