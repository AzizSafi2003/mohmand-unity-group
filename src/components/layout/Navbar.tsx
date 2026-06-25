"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ShieldCheck } from "lucide-react";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Logo } from "@/components/shared/Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "@/components/ui";
import { ROUTES } from "@/lib/constants";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isAdmin, isApproved } = useCurrentUser();

  const links = [
    { href: ROUTES.home, label: t("nav.home") },
    { href: ROUTES.laws, label: t("nav.laws") },
    { href: ROUTES.announcements, label: t("nav.announcements") },
    ...(isApproved
      ? [
          { href: ROUTES.familyTree, label: t("nav.familyTree") },
          { href: ROUTES.dashboard, label: t("nav.dashboard") },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-sand/70 bg-parchment/85 backdrop-blur-md">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link href={ROUTES.home} aria-label="Mohmand Unity Group home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === l.href ? "text-pine" : "text-ink-soft hover:text-ink"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" />

          <SignedIn>
            {isAdmin && (
              <Link href={ROUTES.admin.root} className="hidden sm:block">
                <Button variant="outline" size="sm">
                  <ShieldCheck className="h-4 w-4" />
                  {t("nav.admin")}
                </Button>
              </Link>
            )}
            <UserButton
              afterSignOutUrl="/"
              appearance={{ elements: { avatarBox: "h-9 w-9" } }}
            />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">{t("common.signIn")}</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm" className="hidden sm:inline-flex">{t("common.signUp")}</Button>
            </SignUpButton>
          </SignedOut>

          <button
            className="rounded-lg p-2 text-ink md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            className="border-t border-sand/70 bg-parchment md:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="container-page flex flex-col gap-1 py-3">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-surface"
                >
                  {l.label}
                </Link>
              ))}
              <SignedIn>
                {isAdmin && (
                  <Link
                    href={ROUTES.admin.root}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-pine"
                  >
                    {t("nav.admin")}
                  </Link>
                )}
              </SignedIn>
              <div className="px-3 pt-2">
                <LanguageSwitcher />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
