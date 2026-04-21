"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Building2, Briefcase, FileText, Users, Video,
  BookOpen, ChevronDown, Home, LogOut, Settings,
  ClipboardList, CheckSquare, Building, Truck, Trophy,
  ShieldCheck, BarChart3, PanelLeft, Menu, Search, Bell,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

/* ── Types ──────────────────────────────────────────────────────── */
interface NavItemDef {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}
interface SectionDef { title: string; items: NavItemDef[] }

/* ── Navigation tree ────────────────────────────────────────────── */
const SECTIONS: SectionDef[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Real Estate",
    items: [
      { label: "All Listings", href: "/admin/dashboard/real-estate-listings", icon: Building2 },
      { label: "Approvals", href: "/admin/dashboard/real-estate-approvals", icon: CheckSquare },
      { label: "Owner Apps", href: "/admin/dashboard/owner-applications", icon: ClipboardList },
      { label: "Inquiries", href: "/admin/dashboard/inquiries", icon: FileText },
    ],
  },
  {
    title: "Jobs & Companies",
    items: [
      { label: "All Jobs", href: "/admin/dashboard/jobs", icon: Briefcase },
      {
        label: "Companies", icon: Building,
        children: [
          { label: "All Companies", href: "/admin/dashboard/companies" },
          { label: "Applications", href: "/admin/dashboard/company-applications" },
        ],
      },
    ],
  },
  {
    title: "Tenders",
    items: [
      { label: "All Tenders", href: "/admin/dashboard/tenders", icon: Trophy },
    ],
  },
  {
    title: "Suppliers",
    items: [
      { label: "All Suppliers", href: "/admin/dashboard/suppliers", icon: Truck },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Courses", href: "/admin/dashboard/courses", icon: BookOpen },
      { label: "Video Adverts", href: "/admin/dashboard/video-adverts", icon: Video },
    ],
  },
  {
    title: "Users & Identity",
    items: [
      { label: "All Users", href: "/admin/dashboard/users", icon: Users },
      { label: "Roles & Access", href: "/admin/dashboard/roles", icon: ShieldCheck },
    ],
  },
  {
    title: "Analytics",
    items: [{ label: "Platform Stats", href: "/admin/dashboard/stats", icon: BarChart3 }],
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
  const isActive = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[12.5px] font-medium transition-all",
        depth > 0 && "pl-7",
        isActive
          ? "bg-primary/[0.12] text-primary font-semibold"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
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
          "flex w-full items-center justify-between rounded-lg px-3 py-[7px] text-[12.5px] font-medium transition-all",
          isAnyChildActive
            ? "bg-primary/[0.1] text-primary font-semibold"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
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
  const router = useRouter();

  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "A";
  const fullName = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "Admin";

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2.5 rounded-xl p-2 transition-all hover:bg-gray-100 w-full",
            collapsed && "justify-center p-2",
          )}
        >
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary ring-2 ring-primary/10">
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-[12px] font-semibold text-gray-900">{fullName}</p>
                <p className="truncate text-[10px] text-gray-400">{user?.email}</p>
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
        className="w-56 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl"
      >
        {/* User info header */}
        <div className="px-3 py-2.5 mb-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate">{fullName}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
              <span className="inline-flex mt-0.5 items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wide">
                {user?.role?.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-gray-100" />

        <DropdownMenuItem
          onClick={() => router.push("/admin/dashboard")}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          Dashboard
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push("/admin/dashboard/settings")}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          <Settings className="h-3.5 w-3.5" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push("/")}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          <Home className="h-3.5 w-3.5" />
          Back to Storefront
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-100" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 cursor-pointer font-medium"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── Sidebar body (shared between desktop + mobile sheet) ───────── */
function SidebarBody({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex h-full flex-col bg-white">
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 scrollbar-hide">
        <ul className="space-y-0.5">
          {SECTIONS.map((section) => (
            <React.Fragment key={section.title}>
              {!collapsed && <SectionLabel title={section.title} />}
              {section.items.map((item) =>
                item.children ? (
                  collapsed ? (
                    <Link
                      key={item.label}
                      href={item.children[0].href}
                      title={item.label}
                      className="flex h-9 w-9 mx-auto items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                    >
                      <item.icon className="h-4 w-4" />
                    </Link>
                  ) : (
                    <NavGroup key={item.label} item={item} />
                  )
                ) : collapsed ? (
                  <li key={item.href} className="flex justify-center">
                    <Link
                      href={item.href!}
                      title={item.label}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                    >
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

      {/* Bottom: storefront link + user */}
      <div className={cn("border-t border-gray-100 p-2", collapsed && "flex flex-col items-center gap-1")}>
        {!collapsed && (
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors mb-1"
          >
            <Home className="h-3.5 w-3.5 shrink-0" />
            Back to Storefront
          </Link>
        )}
        <UserDropdown collapsed={collapsed} />
      </div>
    </div>
  );
}

/* ── Navbar ─────────────────────────────────────────────────────── */
function AdminNavbar({ onToggleCollapse }: { onToggleCollapse: () => void }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Build breadcrumb from pathname
  const crumbs = pathname
    .replace("/admin/dashboard", "")
    .split("/")
    .filter(Boolean)
    .map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()));

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-gray-100 bg-white px-4 transition-shadow",
        scrolled && "shadow-sm",
      )}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Toggle sidebar (desktop) */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        {/* Mobile: Sheet trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
              <Menu className="h-4.5 w-4.5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[260px] border-none">
            {/* Mobile brand */}
            <div className="flex h-14 items-center gap-2.5 border-b border-gray-100 px-4">
              <div className="relative flex size-7 items-center justify-center">
                <div className="absolute left-0.5 top-0.5 h-4 w-2 -skew-x-[20deg] rounded-sm bg-primary" />
                <div className="absolute right-0.5 top-0.5 h-4 w-2 skew-x-[20deg] rounded-sm bg-primary/90" />
              </div>
              <div className="leading-none">
                <p className="text-[14px] font-black tracking-[-0.06em]">Anasell</p>
                <p className="text-[8px] font-semibold uppercase tracking-[0.3em] text-gray-400">Admin</p>
              </div>
            </div>
            <div className="h-[calc(100vh-3.5rem)]">
              <SidebarBody />
            </div>
          </SheetContent>
        </Sheet>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-gray-700 transition-colors font-medium">
            Admin
          </Link>
          {crumbs.map((crumb: string, i: number) => (
            <React.Fragment key={i}>
              <ChevronRight className="h-3 w-3 text-gray-300" />
              <span className={cn("font-medium", i === crumbs.length - 1 ? "text-gray-900" : "text-gray-400")}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search anything..."
            className="h-9 w-[200px] lg:w-[260px] rounded-xl bg-gray-50 pl-9 pr-4 text-[13px] text-gray-700 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Role badge */}
        <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary uppercase tracking-wider shrink-0">
          {user?.role?.replace(/_/g, " ") || "Admin"}
        </span>

        {/* Home button */}
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shrink-0"
        >
          <Home className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Home</span>
        </Link>

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary border-2 border-white" />
        </button>

        {/* User dropdown in navbar */}
        <UserDropdown />
      </div>
    </header>
  );
}

/* ── Layout ─────────────────────────────────────────────────────── */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const r = user?.role?.toLowerCase()?.replace(/[_-\s]/g, "") ?? "";
  const isAdmin = r === "admin" || r === "superadmin" || r.includes("admin");

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!isAdmin) {
      toast.error("Access Denied: You do not have admin permissions.");
      if (r === "owner" || r === "propertyowner") {
        router.replace("/owner/dashboard");
      } else if (r === "company" || r === "companyowner") {
        router.replace("/company/dashboard");
      } else {
        router.replace("/user/dashboard");
      }
      return;
    }
  }, [user, isLoading, isAdmin, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Verifying Session</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Fixed Sidebar (desktop) ───────────────────────── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen fixed left-0 top-0 bottom-0 z-40 border-r border-gray-100 bg-white transition-all duration-200",
          collapsed ? "w-14" : "w-[220px]",
        )}
      >
        {/* Brand */}
        <div className={cn("flex h-14 items-center border-b border-gray-100 px-3 shrink-0", collapsed ? "justify-center" : "gap-2.5")}>
          {!collapsed && (
            <Link href="/admin/dashboard" className="flex items-center gap-2.5">
              <div className="relative flex size-7 items-center justify-center">
                <div className="absolute left-0.5 top-0.5 h-4 w-2 -skew-x-[20deg] rounded-sm bg-primary" />
                <div className="absolute right-0.5 top-0.5 h-4 w-2 skew-x-[20deg] rounded-sm bg-primary/90" />
              </div>
              <div className="leading-none">
                <p className="text-[14px] font-black tracking-[-0.06em] text-foreground">Anasell</p>
                <p className="text-[8px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Admin</p>
              </div>
            </Link>
          )}
          {collapsed && (
            <div className="relative flex size-7 items-center justify-center">
              <div className="absolute left-0.5 top-0.5 h-4 w-2 -skew-x-[20deg] rounded-sm bg-primary" />
              <div className="absolute right-0.5 top-0.5 h-4 w-2 skew-x-[20deg] rounded-sm bg-primary/90" />
            </div>
          )}
        </div>

        {/* Nav body */}
        <div className="flex-1 min-h-0">
          <SidebarBody collapsed={collapsed} />
        </div>
      </aside>

      {/* ── Content area (offset by sidebar width) ───────── */}
      <div
        className={cn(
          "flex flex-col flex-1 min-w-0 transition-all duration-200",
          collapsed ? "lg:pl-14" : "lg:pl-[220px]",
        )}
      >
        <AdminNavbar onToggleCollapse={() => setCollapsed((c) => !c)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}`,
      }} />
    </div>
  );
}
