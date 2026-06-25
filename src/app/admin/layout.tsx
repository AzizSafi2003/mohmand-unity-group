"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users2,
  UserPlus,
  CircleCheckBig,
  Wallet,
  Scale,
  Megaphone,
  Home,
  FileText,
  Activity,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { RequireAdmin } from "@/components/shared/Guards";
import { Logo } from "@/components/shared/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";

const NAV = [
  { href: ROUTES.admin.root, key: "dashboard.title", icon: LayoutDashboard, exact: true },
  { href: ROUTES.admin.families, key: "families.title", icon: Users2 },
  { href: ROUTES.admin.members, key: "members.title", icon: UserPlus },
  { href: ROUTES.admin.approvals, key: "admin.approvals", icon: CircleCheckBig },
  { href: ROUTES.admin.contributions, key: "payments.title", icon: Wallet },
  { href: ROUTES.admin.laws, key: "laws.title", icon: Scale },
  { href: ROUTES.admin.announcements, key: "announcements.title", icon: Megaphone },
  { href: ROUTES.admin.homepage, key: "admin.homepage", icon: Home },
  { href: ROUTES.admin.reports, key: "admin.reports", icon: FileText },
  { href: ROUTES.admin.logs, key: "admin.logs", icon: Activity },
  { href: ROUTES.admin.settings, key: "admin.settings", icon: Settings },
] as const;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAdmin>
      <AdminShell>{children}</AdminShell>
    </RequireAdmin>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen bg-parchment">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 z-40 w-64 shrink-0 border-e border-sand bg-surface transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sand px-4">
          <Link href={ROUTES.home} onClick={() => setSidebarOpen(false)}>
            <Logo className="h-8" />
          </Link>
          <button
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint hover:bg-parchment-deep lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1 p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(item.href, "exact" in item ? item.exact : false)
                  ? "bg-pine text-surface shadow-sm"
                  : "text-ink-soft hover:bg-parchment-deep hover:text-ink"
              )}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              <span className="truncate">{t(item.key)}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Backdrop on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-sand bg-surface/80 px-4 backdrop-blur lg:px-6">
          <button
            className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-parchment-deep lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="hidden font-display text-lg text-ink lg:block">{t("nav.admin")}</span>
          <div className="ms-auto flex items-center gap-3">
            <LanguageSwitcher />
            <Link href={ROUTES.home} className="text-sm font-medium text-ink-soft hover:text-pine">
              {t("nav.home")}
            </Link>
            <UserButton afterSignOutUrl={ROUTES.home} />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
