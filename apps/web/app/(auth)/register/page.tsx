"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowRight, Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { Toaster, toast } from "sonner";

import { buildApiUrl } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { AuthUser } from "@/context/auth-context";
import { CategoryCarousel } from "@/components/auth/category-carousel";



type RegisterResponse = {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: AuthUser;
  };
  error?: string;
};

function getRoleRedirect(role: string, fallback: string): string {
  const r = role?.toLowerCase()?.replace(/[_-\s]/g, "") ?? "";
  const isSuper = r === "superadmin" || r === "admin" || r.includes("admin");
  const isOwner = r === "owner" || r === "propertyowner";
  const isCompany = r === "company" || r === "companyowner";

  if (fallback && fallback !== "/" && fallback !== "/dashboard" && fallback !== "/login") {
    const isOwnerRoute = fallback.startsWith("/owner");
    const isCompanyRoute = fallback.startsWith("/company");
    const isAdminRoute = fallback.startsWith("/admin");

    const validFallback = 
      (isOwnerRoute && isOwner) ||
      (isCompanyRoute && isCompany) ||
      (isAdminRoute && isSuper) ||
      (!isOwnerRoute && !isCompanyRoute && !isAdminRoute && !(fallback.startsWith("/user/dashboard") && (isOwner || isCompany || isSuper)));

    if (validFallback) {
      return fallback;
    }
  }

  if (isSuper) return "/admin/dashboard";
  if (isOwner) return "/owner/dashboard";
  if (isCompany) return "/company/dashboard";
  return "/user/dashboard";
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") ?? "/";
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
  });

  function set(field: keyof typeof formData) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormData((p) => ({ ...p, [field]: e.target.value }));
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

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

      login(result.data.token, result.data.user);

      toast.success("Account created! Welcome to Anasell.");
      router.push(getRoleRedirect(result.data.user.role, redirectUrl));
    } catch {
      toast.error("Unable to create account right now. Please try again.");
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
          src="https://picsum.photos/seed/ansell-reg-hero/1400/1800"
          alt="Anasell register background"
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
              Join Anasell
            </p>
            <CategoryCarousel />
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto bg-[#080d08] px-5 py-8 sm:px-6 lg:min-h-0 lg:w-[42%] lg:px-8">
        <div className="relative w-full max-w-md overflow-hidden bg-[#0b120b] shadow-[0_30px_80px_-50px_rgba(0,0,0,0.85)]">
          <div className="relative z-10 mx-auto flex w-full max-w-sm flex-col px-5 pb-8 pt-8 sm:px-7">
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

            <div className="mb-7 text-center">
              <h2 className="text-3xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-[1.8rem]">
                Create your account.
                <br />
                Join the marketplace.
              </h2>
              <p className="mt-4 text-xs leading-6 text-white/60">
                Register to access jobs, properties, tenders and more.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-3">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45">
                    <User className="size-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="First name"
                    value={formData.first_name}
                    onChange={set("first_name")}
                    className="w-full rounded-full border border-white/14 bg-[#161d16] px-10 py-4 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-primary"
                    required
                    disabled={!!isLoading}
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Last name"
                    value={formData.last_name}
                    onChange={set("last_name")}
                    className="w-full rounded-full border border-white/14 bg-[#161d16] px-4 py-4 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-primary"
                    required
                    disabled={!!isLoading}
                  />
                </div>
              </div>

              <div className="relative">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/45">
                  <Mail className="size-4.5" />
                </span>
                <input
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={set("email")}
                  className="w-full rounded-full border border-white/14 bg-[#161d16] px-12 py-4 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-primary"
                  required
                  disabled={!!isLoading}
                />
              </div>

              <div className="relative">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/45">
                  <Phone className="size-4.5" />
                </span>
                <input
                  type="tel"
                  placeholder="Phone number (optional)"
                  value={formData.phone}
                  onChange={set("phone")}
                  className="w-full rounded-full border border-white/14 bg-[#161d16] px-12 py-4 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-primary"
                  disabled={!!isLoading}
                />
              </div>

              <div className="relative">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/45">
                  <Lock className="size-4.5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password (min 8 characters)"
                  value={formData.password}
                  onChange={set("password")}
                  className="w-full rounded-full border border-white/14 bg-[#161d16] px-12 py-4 pr-12 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-primary"
                  required
                  minLength={8}
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
                <span>{isLoading ? "Creating account..." : "Create Account"}</span>
                {!isLoading && <ArrowRight className="size-4" />}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-xs text-white/55">
              <Link href="/" className="hover:text-white">
                Back to storefront
              </Link>
            </div>

            <p className="mt-6 text-center text-xs text-white/45">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>

            <p className="mt-4 text-center text-xs leading-relaxed text-white/30">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
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
