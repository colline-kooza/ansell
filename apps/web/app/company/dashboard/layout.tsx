"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useMyCompany } from "@/hooks/use-companies";
import {
  LayoutDashboard, Building, Briefcase, Users, BarChart3, Settings,
  ChevronDown, Home, LogOut, ShieldCheck, PanelLeft, Menu, Search,
  Bell, ChevronRight, PlusCircle, Globe, FileText, UserPlus,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

/* ── Types ──────────────────────────────────────────────────────── */
interface NavItemDef {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}
interface SectionDef { title: string; items: NavItemDef[] }

/* ── Navigation Tree ────────────────────────────────────────────── */
const SECTIONS: SectionDef[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/company/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Recruitment",
    items: [
      { label: "Job Listings", href: "/company/dashboard/jobs", icon: Briefcase },
      { label: "Applicants", href: "/company/dashboard/applications", icon: Users },
      { label: "Post New Job", href: "/company/dashboard/jobs?new=1", icon: PlusCircle },
    ],
  },
  {
    title: "Organization",
    items: [
      { label: "Company Profile", href: "/company/dashboard/profile", icon: Building },
      { label: "Account Settings", href: "/company/dashboard/settings", icon: Settings },
    ],
  },
];

/* ── Sidebar sub-components ─────────────────────────────────────── */
function SectionLabel({ title }: { title: string }) {
  return (
    <p className="mt-5 mb-1 px-3 text-[9.5px] font-bold uppercase tracking-[0.16em] text-gray-400">
      {title}
    </p>
  );
}

function NavLeaf({ href, label, icon: Icon, depth = 0 }: {
  href: string; label: string; icon?: React.ElementType; depth?: number;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/company/dashboard" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[12.5px] font-medium transition-all outline-none",
        depth > 0 && "pl-7",
        isActive
          ? "bg-primary/[0.12] text-primary font-semibold"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      {label}
    </Link>
  );
}

function NavGroup({ item }: { item: NavItemDef }) {
  const pathname = usePathname();
  const isAnyChildActive = item.children?.some(
    (c) => pathname === c.href || pathname.startsWith(c.href),
  );
  const [open, setOpen] = useState(!!isAnyChildActive);
  const Icon = item.icon;

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-[7px] text-[12.5px] font-medium transition-all outline-none",
          isAnyChildActive
            ? "bg-primary/[0.1] text-primary font-semibold"
            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
        )}
      >
        <span className="flex items-center gap-2.5">
          <Icon className="h-3.5 w-3.5 shrink-0" />
          {item.label}
        </span>
        <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && item.children && (
        <div className="mt-0.5 space-y-0.5 ml-[18px] pl-3 border-l border-gray-100">
          {item.children.map((c) => (
            <NavLeaf key={c.href} href={c.href} label={c.label} depth={1} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── User Dropdown ──────────────────────────────────────────────── */
function UserDropdown({ collapsed = false }: { collapsed?: boolean }) {
  const { user, logout } = useAuth();
  const { data: company } = useMyCompany();
  const router = useRouter();

  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "C";
  const fullName = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "Owner";

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2.5 rounded-xl p-2 transition-all hover:bg-gray-50 w-full outline-none",
            collapsed && "justify-center p-2",
          )}
        >
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary ring-2 ring-primary/5">
            {initials}
            {company?.is_verified && (
              <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-0.5">
                <ShieldCheck className="h-2.5 w-2.5 text-blue-500 fill-blue-500/10" />
              </div>
            )}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-[12px] font-semibold text-gray-900">{fullName}</p>
                <p className="truncate text-[10px] text-gray-400 font-medium">{company?.company_name || user?.email}</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={collapsed ? "right" : "top"}
        align="start"
        sideOffset={8}
        className="w-56 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl z-[100]"
      >
        <div className="px-3 py-2.5 mb-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate">{fullName}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
              <span className="inline-flex mt-1 items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wide">
                Company Owner
              </span>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-gray-100" />
        <DropdownMenuItem onClick={() => router.push("/company/dashboard")} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 cursor-pointer">
          <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/company/dashboard/profile")} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 cursor-pointer">
          <Building className="h-3.5 w-3.5" /> Company Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/")} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 cursor-pointer">
          <Home className="h-3.5 w-3.5" /> Storefront
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-100" />
        <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 cursor-pointer font-medium">
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── Sidebar body ───────────────────────────────────────────────── */
function SidebarBody({ collapsed = false }: { collapsed?: boolean }) {
  const { data: company } = useMyCompany();
  const { logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Brand */}
      <div className={cn("flex h-14 items-center gap-2.5 border-b border-gray-100 px-5", collapsed && "px-0 justify-center")}>
        <Link href="/company/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="relative flex size-6 items-center justify-center">
            <div className="absolute left-0.5 top-0.5 h-3.5 w-1.5 -skew-x-[20deg] rounded-sm bg-primary" />
            <div className="absolute right-0.5 top-0.5 h-3.5 w-1.5 skew-x-[20deg] rounded-sm bg-primary/80" />
          </div>
          {!collapsed && (
            <div className="leading-none">
              <p className="text-[14px] font-black tracking-[-0.05em] text-gray-900">Anasell</p>
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-primary/70">Company</p>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 scrollbar-hide">
        <ul className="space-y-0.5">
          {SECTIONS.map((section) => (
            <React.Fragment key={section.title}>
              {!collapsed && <SectionLabel title={section.title} />}
              {section.items.map((item) =>
                item.children ? (
                  collapsed ? (
                    <Link key={item.label} href={item.children[0].href} title={item.label}
                      className="flex h-9 w-9 mx-auto items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
                      <item.icon className="h-4 w-4" />
                    </Link>
                  ) : <NavGroup key={item.label} item={item} />
                ) : collapsed ? (
                  <li key={item.href} className="flex justify-center">
                    <Link href={item.href!} title={item.label}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
                      <item.icon className="h-4 w-4" />
                    </Link>
                  </li>
                ) : (
                  <NavLeaf key={item.href} href={item.href!} label={item.label} icon={item.icon} />
                ),
              )}
            </React.Fragment>
          ))}
        </ul>
      </nav>

      {/* Bottom */}
      <div className={cn("border-t border-gray-100 p-2 space-y-1", collapsed && "flex flex-col items-center gap-1 space-y-0")}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-medium text-gray-500 hover:bg-gray-50 transition-colors">
            <Home className="h-3.5 w-3.5 shrink-0" /> Storefront
          </Link>
        )}
        <UserDropdown collapsed={collapsed} />
        <button
          onClick={handleLogout}
          title="Sign out"
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-medium text-red-600 hover:bg-red-50 transition-colors outline-none",
            collapsed && "justify-center p-2"
          )}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </div>
  );
}

/* ── Navbar ─────────────────────────────────────────────────────── */
function DashboardNavbar({ onToggleCollapse }: { onToggleCollapse: () => void }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const crumbs = pathname.replace("/company/dashboard", "").split("/").filter(Boolean).map(s => s.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()));

  return (
    <header className={cn("sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-gray-100 bg-white px-4 transition-shadow", scrolled && "shadow-sm")}>
      <div className="flex items-center gap-3">
        <button onClick={onToggleCollapse} className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors outline-none">
          <PanelLeft className="h-4 w-4" />
        </button>
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 outline-none">
              <Menu className="h-4.5 w-4.5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[260px] border-none">
            <SidebarBody />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-1.5 text-sm">
          <Link href="/company/dashboard" className="text-gray-400 hover:text-gray-700 transition-colors font-medium">Dashboard</Link>
          {crumbs.map((crumb: string, i: number) => (
            <React.Fragment key={i}>
              <ChevronRight className="h-3 w-3 text-gray-300" />
              <span className={cn("font-medium", i === crumbs.length - 1 ? "text-gray-900" : "text-gray-400")}>{crumb}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-gray-400" />
          <input type="text" placeholder="Global search..." className="h-8 w-48 rounded-lg border-none bg-gray-50 pl-8 text-[11px] focus:ring-1 focus:ring-primary/20" />
        </div>
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}

/* ── Main Layout ────────────────────────────────────────────────── */
export default function CompanyDashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const r = user?.role?.toLowerCase()?.replace(/[_-\s]/g, "") ?? "";
  const isEligible = r === "company" || r === "companyowner" || r === "superadmin" || r === "admin" || r.includes("admin");

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!isEligible) {
      refreshUser().then(updatedUser => {
        const ur = updatedUser?.role?.toLowerCase()?.replace(/[_-\s]/g, "") ?? "";
        if (!(ur === "company" || ur === "companyowner" || ur.includes("admin"))) {
          toast.error("Access Denied: You do not have company owner permissions.");
          if (ur === "owner" || ur === "propertyowner") {
            router.replace("/owner/dashboard");
          } else {
            router.replace("/user/dashboard");
          }
        }
      });
    }
  }, [user, isLoading, isEligible, router, pathname, refreshUser]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
          <p className="text-[13px] font-medium text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user || !isEligible) return null;

  return (
    <div className="flex min-h-screen bg-[#FDFEFE]">
      <aside className={cn("sticky top-0 hidden h-screen border-r border-gray-100 bg-white transition-all duration-300 lg:block shrink-0", collapsed ? "w-[64px]" : "w-[260px]")}>
        <SidebarBody collapsed={collapsed} />
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <DashboardNavbar onToggleCollapse={() => setCollapsed(!collapsed)} />
        <div className="flex-1 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return <BarChart3 className={cn("animate-pulse", className)} />;
}
