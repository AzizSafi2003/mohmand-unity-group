"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { ROUTES } from "@/lib/constants";

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 bg-pine-800 text-parchment">
      <div className="kilim-rule" aria-hidden />
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="text-parchment [&_*]:!text-parchment">
            <Logo className="[&_span]:!text-parchment" />
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-parchment/70">
            {t("home.heroSubtitle")}
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brass-soft">
            {t("nav.home")}
          </h4>
          <ul className="space-y-2 text-sm text-parchment/75">
            <li><Link className="hover:text-brass-soft" href={ROUTES.laws}>{t("nav.laws")}</Link></li>
            <li><Link className="hover:text-brass-soft" href={ROUTES.announcements}>{t("nav.announcements")}</Link></li>
            <li><Link className="hover:text-brass-soft" href={ROUTES.dashboard}>{t("nav.dashboard")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brass-soft">
            {t("home.contactTitle")}
          </h4>
          <ul className="space-y-2.5 text-sm text-parchment/75">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-brass-soft" /> info@mohmandunity.org</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-brass-soft" /> +93 70 000 0000</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brass-soft" /> Nangarhar, Afghanistan</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-parchment/15">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-parchment/60 sm:flex-row">
          <p>© {year} Mohmand Unity Group. {t("common.appName")}.</p>
          <p>{t("home.heroTitle")}</p>
        </div>
      </div>
    </footer>
  );
}
