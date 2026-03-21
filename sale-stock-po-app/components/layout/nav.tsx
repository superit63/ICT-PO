"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/",           label: "Dashboard",     icon: "📊" },
  { href: "/forecasts",  label: "Forecasts",     icon: "📋" },
  { href: "/rollforward",label: "Rollforward",   icon: "📈" },
  { href: "/po-suggest", label: "PO Suggest",    icon: "🔧" },
  { href: "/po",         label: "PO Management", icon: "📦" },
  { href: "/settings",   label: "Settings",      icon: "⚙️" },
];

export function Nav() {
  const pathname = usePathname();

  async function handleLogout() {
    document.cookie = "session_pin=; Max-Age=0; path=/";
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="flex h-14 items-center px-4 gap-6">
        <div className="flex items-center gap-2 font-semibold text-slate-800 shrink-0">
          <span className="text-lg">💊</span>
          <span className="hidden sm:inline">Sale-Stock-PO</span>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto flex-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0",
                pathname === item.href
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <span>{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="text-sm text-slate-500 hover:text-slate-800 transition-colors shrink-0"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
