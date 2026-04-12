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
  const r = role?.toLowerCase()?.replace(/[_-\s]/g, "") ?? "";
  const isSuper = r === "superadmin" || r === "admin" || r.includes("admin");
  const isOwner = r === "owner" || r === "propertyowner" || r.includes("owner");
  const isCompany = r === "company" || r === "companyowner" || r.includes("company");

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

  if (isSuper) return "/admin/dashboard";
  if (isOwner) return "/owner/dashboard";
  if (isCompany) return "/company/dashboard";
  return "/user/dashboard";
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
          alt="Ansell auth background"
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
                <p className="text-[1.9rem] font-black tracking-[-0.06em]">Ansell</p>
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#10210f]/72">
                  Marketplace Hub
                </p>
              </div>
            </div>
          </Link>

          <div className="max-w-xl pb-2 text-[#10210f]">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-[#10210f]/72">
              Auth Space
            </p>
            <h1 className="text-[2rem] leading-[0.95] font-semibold tracking-[-0.06em]">
              Sign in and manage the Ansell marketplace with confidence.
            </h1>
            <p className="mt-5 max-w-lg leading-7 text-[#10210f]/78 text-sm">
              Clean auth flows for operations teams, sellers, and admins, with
              your primary green leading the experience.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto bg-[#080d08] px-5 py-8 sm:px-6 lg:min-h-0 lg:w-[42%] lg:px-8">
        <div className="relative w-full max-w-md overflow-hidden bg-[#0b120b] shadow-[0_30px_80px_-50px_rgba(0,0,0,0.85)]">
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
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent via-[#0b120b]/80 to-[#0b120b]" />
          </div>

          <div className="relative z-10 mx-auto -mt-16 flex w-full max-w-sm flex-col px-5 pb-8 pt-2 sm:px-7">
            <Link href="/" className="mb-6 flex justify-center">
              <div className="flex items-center gap-3">
                <div className="relative flex size-10 items-center justify-center">
                  <div className="absolute left-1 top-1 h-6 w-3 -skew-x-[20deg] rounded-sm bg-primary" />
                  <div className="absolute right-1 top-1 h-6 w-3 skew-x-[20deg] rounded-sm bg-primary/90" />
                </div>
                <div className="leading-none">
                  <p className="text-[1.6rem] font-black tracking-[-0.06em] text-white">Ansell</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-white/55">
                    Marketplace Hub
                  </p>
                </div>
              </div>
            </Link>

            <div className="mb-7 text-center">
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-[1.8rem]">
                Welcome back.
                <br />
                Access your workspace.
              </h2>
              <p className="mt-4 text-xs leading-6 text-white/60">
                Sign in with your email and password to continue.
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

            <p className="mt-6 text-center text-xs text-white/45">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Create one
              </Link>
            </p>
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
