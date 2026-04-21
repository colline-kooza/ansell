"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Building2, MessageSquare, Home, LogOut, Settings,
  ChevronRight, PanelLeft, Menu, Bell, Search, Clock, CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const OWNER_SECTIONS = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/owner/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Properties",
    items: [
      { label: "My Listings", href: "/owner/listings", icon: Building2 },
      { label: "Inquiries", href: "/owner/inquiries", icon: MessageSquare },
    ],
  },
];

function OptionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 px-3 text-[9.5px] font-bold uppercase tracking-[0.16em] text-gray-400">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavLeaf({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/owner/dashboard" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[12.5px] font-medium transition-all outline-none",
        isActive
          ? "bg-primary/[0.12] text-primary font-semibold"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </Link>
  );
}

function UserDropdown({ collapsed = false }: { collapsed?: boolean }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "O";
  const fullName = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "Owner";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn("flex items-center gap-2.5 rounded-xl p-2 transition-all hover:bg-gray-50 w-full outline-none", collapsed && "justify-center p-2")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary ring-2 ring-primary/5">
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-[12px] font-semibold text-gray-900">{fullName}</p>
                <p className="truncate text-[10px] text-gray-400 font-medium">{user?.email}</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={collapsed ? "right" : "top"} align="start" sideOffset={8} className="w-56 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl z-[100]">
        <div className="px-3 py-2.5 mb-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
              {initials}
            </div>
            <div className="min-w-0">
               <p className="text-[13px] font-semibold text-gray-900 truncate">{fullName}</p>
               <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
               <span className="inline-flex mt-1 items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wide">
                 Property Owner
               </span>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator className="bg-gray-100" />
        <DropdownMenuItem onClick={() => router.push("/")} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 cursor-pointer">
          <Home className="h-3.5 w-3.5" /> Storefront
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-100" />
        <DropdownMenuItem
          onClick={() => { logout(); router.replace("/login"); }}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 cursor-pointer font-medium"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarBody({ collapsed = false }: { collapsed?: boolean }) {
  const { logout } = useAuth();
  const router = useRouter();
  return (
    <div className="flex h-full flex-col bg-white">
      <div className={cn("flex h-14 items-center gap-2.5 border-b border-gray-100 px-5", collapsed && "px-0 justify-center")}>
        <Link href="/owner/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="relative flex size-6 items-center justify-center">
            <div className="absolute left-0.5 top-0.5 h-3.5 w-1.5 -skew-x-[20deg] rounded-sm bg-primary" />
            <div className="absolute right-0.5 top-0.5 h-3.5 w-1.5 skew-x-[20deg] rounded-sm bg-primary/80" />
          </div>
          {!collapsed && (
            <div className="leading-none">
              <p className="text-[14px] font-black tracking-[-0.05em] text-gray-900">Anasell</p>
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-primary/70">Property</p>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2 scrollbar-hide mt-1">
        {collapsed ? (
          <div className="space-y-0.5 mt-2">
            {OWNER_SECTIONS.map(s => s.items.map(item => (
              <li key={item.href} className="flex justify-center mb-0.5">
                 <Link href={item.href} title={item.label} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
                   <item.icon className="h-4 w-4" />
                 </Link>
              </li>
            )))}
          </div>
        ) : (
          <div>
            {OWNER_SECTIONS.map(section => (
              <OptionGroup key={section.title} title={section.title}>
                 {section.items.map(item => (
                   <NavLeaf key={item.href} {...item} />
                 ))}
              </OptionGroup>
            ))}
          </div>
        )}
      </nav>
      <div className={cn("border-t border-gray-100 p-2", collapsed && "flex flex-col items-center gap-1")}>
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-medium text-gray-500 hover:bg-gray-50 transition-colors mb-1">
            <Home className="h-3.5 w-3.5 shrink-0" /> Storefront
          </Link>
        )}
        <UserDropdown collapsed={collapsed} />
        <button
          onClick={() => { logout(); router.replace("/login"); }}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-medium text-red-600 hover:bg-red-50 transition-colors mt-1 outline-none",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </div>
  );
}

function OwnerNavbar({ onToggleCollapse }: { onToggleCollapse: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const crumbs = pathname.replace("/owner", "").split("/").filter(Boolean)
    .map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()));

  return (
    <header className={cn("sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-gray-100 bg-white px-4 transition-shadow", scrolled && "shadow-sm")}>
      <div className="flex items-center gap-3">
        <button onClick={onToggleCollapse} className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors outline-none">
          <PanelLeft className="h-4 w-4" />
        </button>
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
              <Menu className="h-4.5 w-4.5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[260px] border-none">
            <div className="h-full"><SidebarBody /></div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-1.5 text-sm">
          <Link href="/owner/dashboard" className="text-gray-400 hover:text-gray-700 font-medium">Owner</Link>
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
          <Search className="absolute left-3 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <input type="text" placeholder="Search..." className="h-9 w-[200px] rounded-xl bg-gray-50 pl-9 pr-4 text-[13px] outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
        </div>

        {/* Role badge */}
        <span className="hidden sm:inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 uppercase tracking-wider shrink-0">
          {user?.role?.replace(/_/g, " ") || "Property Owner"}
        </span>

        {/* Home button */}
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shrink-0"
        >
          <Home className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Home</span>
        </Link>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        <UserDropdown />
      </div>
    </header>
  );
}

function PendingApplicationScreen({ name }: { name?: string }) {
  const { logout } = useAuth();
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="mb-6 flex justify-center">
          <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="h-10 w-10 text-amber-600" />
          </div>
        </div>
        <div className="text-center mb-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-600">Application Status</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Under Review</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-2">
            Hi{name ? ` ${name}` : ""}! Your property owner application has been received and is being reviewed by our team.
          </p>
          <p className="text-gray-400 text-xs leading-relaxed">
            This usually takes <strong className="text-gray-600">1-3 business days</strong>. Owner access stays locked until an admin approves your application.
          </p>
        </div>
        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Application Status
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <span className="text-gray-500">Current state</span>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Awaiting admin approval</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-gray-500">Access</span>
              <span className="text-right font-medium text-gray-800">Owner features unlock only after approval</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-gray-500">What to do now</span>
              <span className="text-right font-medium text-gray-800">Please wait for review and check back later</span>
            </div>
          </div>
        </div>
        <div className="space-y-2.5">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:brightness-110 transition-all"
          >
            <Home className="h-4 w-4" /> Back to Home
          </Link>
          <button
            onClick={() => { logout(); router.replace("/login"); }}
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-4 py-2.5">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          Application submitted - awaiting admin approval
        </div>
      </div>
    </div>
  );
}

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hasPendingApp, setHasPendingApp] = useState(false);
  const pathname = usePathname();
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();

  const r = user?.role?.toLowerCase()?.replace(/[_-\s]/g, "") ?? "";
  const isEligible = r === "owner" || r === "propertyowner" || r === "superadmin" || r === "admin" || r.includes("admin");

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!isEligible) {
      const flag = localStorage.getItem("ansell_pending_owner_application");
      setHasPendingApp(!!flag);
      // Still try to refresh in case role was just updated
      refreshUser().then((updated) => {
        const ur = updated?.role?.toLowerCase()?.replace(/[_-\s]/g, "") ?? "";
        if (ur === "owner" || ur === "propertyowner") {
          localStorage.removeItem("ansell_pending_owner_application");
          setHasPendingApp(false);
        }
      });
    } else {
      // Eligible — clear any stale pending flag
      localStorage.removeItem("ansell_pending_owner_application");
    }
  }, [user, isLoading, isEligible, router, pathname, refreshUser]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500 animate-pulse">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  if (!isEligible && hasPendingApp) return <PendingApplicationScreen name={user.first_name} />;
  if (!isEligible) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className={cn("hidden lg:flex flex-col h-screen fixed left-0 top-0 bottom-0 z-40 border-r border-gray-100 bg-white transition-all duration-200", collapsed ? "w-14" : "w-[220px]")}>
        <div className={cn("flex h-14 items-center border-b border-gray-100 px-3 shrink-0", collapsed ? "justify-center" : "gap-2.5")}>
          {!collapsed && (
            <Link href="/owner/dashboard" className="flex items-center gap-2.5">
              <div className="relative flex size-7 items-center justify-center">
                <div className="absolute left-0.5 top-0.5 h-4 w-2 -skew-x-[20deg] rounded-sm bg-primary" />
                <div className="absolute right-0.5 top-0.5 h-4 w-2 skew-x-[20deg] rounded-sm bg-primary/90" />
              </div>
              <div className="leading-none">
                <p className="text-[14px] font-black tracking-[-0.06em] text-foreground">Anasell</p>
                <p className="text-[8px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Owner Portal</p>
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
        <div className="flex-1 min-h-0"><SidebarBody collapsed={collapsed} /></div>
      </aside>

      <div className={cn("flex flex-col flex-1 min-w-0 transition-all duration-200", collapsed ? "lg:pl-14" : "lg:pl-[220px]")}>
        <OwnerNavbar onToggleCollapse={() => setCollapsed((c) => !c)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}` }} />
    </div>
  );
}
