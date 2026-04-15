"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  Package,
  Pill,
  Settings,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/stock", label: "Stock Control", icon: Boxes },
  { href: "/master-data", label: "Master Data", icon: UsersRound },
  { href: "/forecasts", label: "Forecasts", icon: ClipboardList },
  { href: "/rollforward", label: "Rollforward", icon: TrendingUp },
  { href: "/po-suggest", label: "PO Suggest", icon: Lightbulb },
  { href: "/po", label: "PO Management", icon: Package },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isItemActive(href: string) {
    return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  }

  const currentItem = NAV_ITEMS.find((item) => isItemActive(item.href));

  function handleLogout() {
    document.cookie = "session_pin=; Max-Age=0; path=/";
    window.location.href = "/login";
  }

  const navContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border/80 px-5 pb-5 pt-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-sky-700 shadow-md">
            <Pill className="size-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/68">
              ICT-PO
            </p>
            <p className="mt-1 text-base font-semibold text-sidebar-foreground">
              Supply planning workspace
            </p>
          </div>
        </div>

        <p className="mt-4 max-w-[16rem] text-sm leading-6 text-sidebar-foreground/58">
          Sales, stock, and purchase order monitoring for healthcare operations.
        </p>
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4" aria-label="Primary navigation">
        <div className="mb-3 px-2">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/62">
            Navigation
          </p>
          <p className="mt-2 text-sm text-sidebar-foreground/54">
            Current page: <span className="font-medium text-sidebar-foreground">{currentItem?.label ?? "Dashboard"}</span>
          </p>
        </div>

        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex min-h-11 items-center gap-3 rounded-xl border px-3.5 py-3 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/55",
                  isActive
                    ? "border-sidebar-ring/35 border-l-2 border-l-sky-400 bg-sidebar-primary/15 text-sidebar-foreground"
                    : "border-transparent text-sidebar-foreground/72 hover:border-sidebar-border/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    isActive
                      ? "text-sidebar-foreground"
                      : "text-sidebar-foreground/46 group-hover:text-sidebar-accent-foreground"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-sidebar-border/80 px-3 pb-3 pt-3">
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Logout from application"
          className="group flex min-h-11 w-full items-center gap-3 rounded-xl border border-transparent px-3.5 py-3 text-sm font-medium text-sidebar-foreground/68 transition-colors duration-200 hover:border-sidebar-border/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/55"
        >
          <LogOut className="size-4 shrink-0 text-sidebar-foreground/45 group-hover:text-sidebar-accent-foreground" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden shrink-0 lg:sticky lg:top-0 lg:flex lg:min-h-dvh lg:w-[276px] lg:px-4 lg:py-4">
        <div className="flex min-h-full w-full flex-col rounded-[24px] border border-sidebar-border/85 bg-sidebar text-sidebar-foreground shadow-[0_20px_44px_-32px_rgba(2,6,23,0.72)]">
          {navContent}
        </div>
      </aside>

      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-sidebar-border/80 bg-sidebar px-4 backdrop-blur lg:hidden">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/68">
            ICT-PO
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-sidebar-foreground">
            {currentItem?.label ?? "Dashboard"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          className="rounded-lg p-2.5 text-sidebar-foreground/72 transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/55"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-sky-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[min(84vw,308px)] p-3 transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col rounded-[22px] border border-sidebar-border/85 bg-sidebar text-sidebar-foreground shadow-[0_24px_50px_-28px_rgba(2,6,23,0.78)]">
          {navContent}
        </div>
      </div>
    </>
  );
}
