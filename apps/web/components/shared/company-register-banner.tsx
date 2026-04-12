import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";

export function CompanyRegisterBanner() {
  return (
    <div className="mt-12 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-emerald-50 p-8">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
          <Building2 className="size-7 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-foreground">Register Your Company</h3>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            Join hundreds of businesses listed on Ansell. Get verified, post jobs, and reach thousands of professionals.
          </p>
        </div>
        <Link href="/become-company" className="shrink-0 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-95 flex items-center gap-1.5">
          Register Now <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
