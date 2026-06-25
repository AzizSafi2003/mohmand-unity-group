"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui";
import { ROUTES } from "@/lib/constants";

export default function UnauthorizedPage() {
  const { t } = useTranslation();
  return (
    <main className="grid min-h-screen place-items-center bg-parchment px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-16 w-16 rotate-45 place-items-center rounded-2xl bg-clay/12">
          <ShieldAlert className="h-8 w-8 -rotate-45 text-clay" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-ink">{t("auth.unauthorizedTitle")}</h1>
        <p className="mt-3 text-ink-faint">{t("auth.unauthorizedBody")}</p>
        <Link href={ROUTES.home} className="mt-8 inline-block">
          <Button>{t("common.back")}</Button>
        </Link>
      </div>
    </main>
  );
}
