"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Toaster, toast } from "sonner";

import { buildApiUrl } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { AuthUser } from "@/context/auth-context";
import { CategoryCarousel } from "@/components/auth/category-carousel";
import { getAuthenticatedHomeHref, isAdminRole, isCompanyRole, isOwnerRole } from "@/lib/pending-applications";

type LoginResponse = {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: AuthUser;
  };
  error?: string;
};

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

function getRoleRedirect(role: string, fallback: string): string {
  const isSuper = isAdminRole(role);
  const isOwner = isOwnerRole(role);
  const isCompany = isCompanyRole(role);

  // If there's a fallback, let's heavily sanitize it to avoid cross-role traps.
  if (fallback && fallback !== "/" && fallback !== "/dashboard" && fallback !== "/login") {
    const isOwnerRoute = fallback.startsWith("/owner");
    const isCompanyRoute = fallback.startsWith("/company");
    const isAdminRoute = fallback.startsWith("/admin");
    const isUserRoute = fallback.startsWith("/user");

    // Only allow traversing into specialized zones if they hold the appropriate role
    const validFallback = 
      (isOwnerRoute && isOwner) ||
      (isCompanyRoute && isCompany) ||
      (isAdminRoute && isSuper) ||
      (isUserRoute && !isOwner && !isCompany && !isSuper) ||
      (!isOwnerRoute && !isCompanyRoute && !isAdminRoute && !isUserRoute);

    if (validFallback) {
      return fallback;
    }
  }

  return getAuthenticatedHomeHref(role);
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") ?? "/";
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  async function handleEmailLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Enter your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(buildApiUrl("auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = (await response.json()) as LoginResponse;

      if (!response.ok || !result.success || !result.data) {
        toast.error(result.message || "Failed to sign in.");
        return;
      }

      login(result.data.token, result.data.user);

      toast.success("Signed in successfully.");
      router.push(getRoleRedirect(result.data.user.role, redirectUrl));
    } catch {
      toast.error("Unable to sign in right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col overflow-hidden bg-[#080d08] text-white lg:h-screen lg:flex-row">
      <Toaster position="top-center" richColors />

      {/* Left panel */}
      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:h-screen lg:w-[58%]">
        <Image
          src="https://picsum.photos/seed/ansell-auth-hero/1400/1800"
          alt="Anasell auth background"
          fill
          priority
          className="object-cover blur-[2px]"
          sizes="58vw"
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
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-[#10210f]/72">
              Auth Space
            </p>
            <CategoryCarousel />
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto bg-[#080d08] px-5 py-8 sm:px-6 lg:min-h-0 lg:w-[42%] lg:px-8">
        <div className="relative w-full max-w-md overflow-hidden bg-[#080d08] shadow-[0_30px_80px_-50px_rgba(0,0,0,0.85)]">
          <div className="relative w-full pt-6">
            <div className="grid w-full grid-cols-4 gap-2 px-4 opacity-55 sm:grid-cols-5 lg:grid-cols-4 lg:px-6">
              {backgroundImages.map((src, index) => {
                const row = Math.floor(index / 4);
                const col = index % 4;
                const staggerClass = row % 2 === 1 ? "translate-x-3" : "-translate-x-1";
                const verticalStagger =
                  (row + col) % 3 === 0
                    ? "translate-y-3"
                    : (row + col) % 3 === 1
                      ? "-translate-y-2"
                      : "translate-y-1";
                return (
                  <div
                    key={src}
                    className={`aspect-square overflow-hidden rounded-full bg-white/8 ${staggerClass} ${verticalStagger}`}
                  >
                    <Image src={src} alt="" width={160} height={160} className="h-full w-full object-cover" />
                  </div>
                );
              })}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent via-[#080d08]/80 to-[#080d08]" />
          </div>

          <div className="relative z-10 mx-auto -mt-16 flex w-full max-w-sm flex-col px-5 pb-8 pt-2 sm:px-7">
            <Link href="/" className="mb-6 flex justify-center">
              <div className="flex items-center gap-3">
                <div className="relative flex size-10 items-center justify-center">
                  <div className="absolute left-1 top-1 h-6 w-3 -skew-x-[20deg] rounded-sm bg-primary" />
                  <div className="absolute right-1 top-1 h-6 w-3 skew-x-[20deg] rounded-sm bg-primary/90" />
                </div>
                <div className="leading-none">
                  <p className="text-[1.6rem] font-black tracking-[-0.06em] text-white">Anasell</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-white/55">
                    All Opportunities. One Platform.
                  </p>
                </div>
              </div>
            </Link>

            <div className="mb-7 text-center">
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-[1.8rem]">
                Welcome back.
                <br />
                Your opportunities await.
              </h2>
              <p className="mt-4 text-xs leading-6 text-white/60">
                Sign in to access jobs, properties, tenders, and more.
              </p>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/45">
                  <Mail className="size-4.5" />
                </span>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-full border border-white/14 bg-[#161d16] px-12 py-4 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-primary"
                  required
                  disabled={!!isLoading}
                />
              </div>

              <div className="relative">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/45">
                  <Lock className="size-4.5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  className="w-full rounded-full border border-white/14 bg-[#161d16] px-12 py-4 pr-12 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-primary"
                  required
                  disabled={!!isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/45 hover:text-white/75"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-6 py-4 text-sm font-semibold text-[#10210f] transition-all hover:brightness-95 disabled:opacity-60"
              >
                <span>{isLoading ? "Signing in..." : "Sign In"}</span>
                {!isLoading && <ArrowRight className="size-4" />}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-xs text-white/55">
              <Link href="/" className="hover:text-white">
                Back to storefront
              </Link>
              <Link href="/forgot-password" className="hover:text-white">
                Forgot password?
              </Link>
            </div>

            <div className="mt-5 border-t border-white/10 pt-5 flex flex-col gap-2">
              <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1">
                New here? Choose how to get started
              </p>
              <Link
                href="/register"
                className="flex flex-col items-center gap-0.5 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-center transition hover:bg-primary/20 group"
              >
                <span className="text-xs font-semibold text-primary group-hover:text-primary">Create a Personal Account</span>
                <span className="text-[10px] text-primary/60">Browse jobs, properties, tenders &amp; more</span>
              </Link>
              <Link
                href="/become-owner"
                className="flex flex-col items-center gap-0.5 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-center transition hover:bg-white/10 group"
              >
                <span className="text-xs font-semibold text-white/70 group-hover:text-white">Become a Property Owner</span>
                <span className="text-[10px] text-white/35">List &amp; manage properties on the platform</span>
              </Link>
              <Link
                href="/become-company"
                className="flex flex-col items-center gap-0.5 rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-center transition hover:bg-white/10 group"
              >
                <span className="text-xs font-semibold text-white/70 group-hover:text-white">Register Your Company</span>
                <span className="text-[10px] text-white/35">Post jobs, tenders &amp; grow your business</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080d08] flex items-center justify-center text-white">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
