"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Clock3 } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui";
import { ROUTES } from "@/lib/constants";

export default function PendingApprovalPage() {
  const { t } = useTranslation();
  return (
    <main className="grid min-h-screen place-items-center bg-parchment px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-16 w-16 rotate-45 place-items-center rounded-2xl bg-brass/15">
          <Clock3 className="h-8 w-8 -rotate-45 text-brass-dark" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-ink">{t("auth.pendingTitle")}</h1>
        <p className="mt-3 leading-relaxed text-ink-faint">{t("auth.pendingBody")}</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href={ROUTES.home}>
            <Button variant="outline">{t("common.back")}</Button>
          </Link>
          <SignOutButton>
            <Button variant="ghost">{t("common.signOut")}</Button>
          </SignOutButton>
        </div>
      </div>
    </main>
  );
}
