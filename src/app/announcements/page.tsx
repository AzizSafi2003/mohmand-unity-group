"use client";

import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Megaphone, Pin } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/shared/Reveal";
import { Badge, SectionHeading, EmptyState, LoadingScreen } from "@/components/ui";
import { useUiStore } from "@/store/uiStore";
import { localized, formatDateTime } from "@/lib/utils";

export default function AnnouncementsPage() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const items = useQuery(api.announcements.listPublic);

  return (
    <>
      <Navbar />
      <main className="container-page py-16">
        <SectionHeading eyebrow={t("nav.announcements")} title={t("announcements.title")} />
        <div className="mt-10 space-y-5">
          {items === undefined ? (
            <LoadingScreen />
          ) : items.length === 0 ? (
            <EmptyState icon={<Megaphone className="h-8 w-8" />} title={t("announcements.noneTitle")} description={t("announcements.noneBody")} />
          ) : (
            items.map((a) => (
              <Reveal key={a._id}>
                <article className="surface-card p-6">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    {a.isPinned && (
                      <Badge tone="brass"><Pin className="h-3 w-3" /> {t("announcements.pinned")}</Badge>
                    )}
                    <time className="text-xs text-ink-faint">{formatDateTime(a.publishedAt, locale === "ps" ? "fa-AF" : "en-US")}</time>
                  </div>
                  <h2 className="text-xl font-semibold text-ink">{localized(a, "title", locale)}</h2>
                  <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-soft">{localized(a, "body", locale)}</p>
                </article>
              </Reveal>
            ))
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
