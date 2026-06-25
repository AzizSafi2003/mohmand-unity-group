"use client";

import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { ScrollText } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading, EmptyState, LoadingScreen } from "@/components/ui";
import { useUiStore } from "@/store/uiStore";
import { localized } from "@/lib/utils";

export default function LawsPage() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const laws = useQuery(api.laws.listPublic);

  return (
    <>
      <Navbar />
      <main className="container-page py-16">
        <SectionHeading eyebrow={t("nav.laws")} title={t("laws.title")} description={t("laws.subtitle")} />
        <div className="mt-10">
          {laws === undefined ? (
            <LoadingScreen />
          ) : laws.length === 0 ? (
            <EmptyState icon={<ScrollText className="h-8 w-8" />} title={t("laws.title")} description={t("laws.subtitle")} />
          ) : (
            <ol className="space-y-4">
              {laws.map((law, i) => (
                <Reveal key={law._id}>
                  <li className="surface-card flex gap-5 p-6">
                    <span className="nums shrink-0 text-3xl font-semibold text-brass">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold text-ink">{localized(law, "title", locale)}</h2>
                      <p className="mt-1.5 leading-relaxed text-ink-soft">{localized(law, "body", locale)}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
