"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRight, ArrowDown, Megaphone, ScrollText, Sparkles, Users } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Reveal } from "@/components/shared/Reveal";
import { Button, Card, CardBody, Badge, SectionHeading, EmptyState } from "@/components/ui";
import { useUiStore } from "@/store/uiStore";
import { localized } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { currentSolarYear } from "@/lib/afghan-calendar";

type Section = {
  section: string;
  title?: string;
  titlePs?: string;
  subtitle?: string;
  subtitlePs?: string;
  body?: string;
  bodyPs?: string;
  data?: unknown;
};

export default function HomePage() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const year = currentSolarYear();

  const sections = useQuery(api.homepage.getAll) as Section[] | undefined;
  const stats = useQuery(api.stats.publicStats, { solarYear: year });
  const announcements = useQuery(api.announcements.listPublic);
  const laws = useQuery(api.laws.listPublic);

  const get = (key: string) => sections?.find((s) => s.section === key);
  const field = (key: string, f: "title" | "subtitle" | "body", fallback: string) => {
    const row = get(key);
    return row ? localized(row, f, locale) || fallback : fallback;
  };

  const objectives = ((get("objectives")?.data as { items?: string[]; itemsPs?: string[] } | undefined) ?? {});
  const objectiveItems =
    (locale === "ps" ? objectives.itemsPs : objectives.items) ??
    objectives.items ?? [
      t("home.objectivesFallback1", "Maintain an accurate, living record of every family and its lineage."),
      t("home.objectivesFallback2", "Organise monthly contributions fairly and transparently."),
      t("home.objectivesFallback3", "Support members in need through a shared community fund."),
      t("home.objectivesFallback4", "Preserve Pashtun heritage, customs, and the bonds between generations."),
    ];

  return (
    <>
      <Navbar />
      <main>
        {/* ---------------------------------------------------------------- HERO */}
        <section className="relative overflow-hidden">
          <div
            className="kilim-watermark pointer-events-none absolute -right-24 top-0 h-full w-[55%] opacity-[0.05]"
            aria-hidden
          />
          <div className="container-page relative grid gap-12 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
            <div className="animate-fade-up">
              <span className="eyebrow mb-5">
                <Sparkles className="h-3.5 w-3.5" /> {t("common.appName")}
              </span>
              <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[1.04] tracking-tight text-ink">
                {field("hero", "title", t("home.heroTitle"))}
              </h1>
              <h1>
                {field("hero", "title", t("home.greetings"))}
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
                {field("hero", "subtitle", t("home.heroSubtitle"))}
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <SignedOut>
                  <SignUpButton mode="modal">
                    <Button size="lg">
                      {t("home.registerCta")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <Link href={ROUTES.dashboard}>
                    <Button size="lg">
                      {t("nav.dashboard")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Button>
                  </Link>
                </SignedIn>
                <Link href="#about">
                  <Button variant="outline" size="lg">
                    {t("home.explore")} <ArrowDown className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* lineage motif: three generations, echoing the logo */}
            <div className="relative hidden items-center justify-center lg:flex">
              <LineageMotif />
            </div>
          </div>
          <div className="kilim-rule" aria-hidden />
        </section>

        {/* --------------------------------------------------------------- STATS */}
        <section className="bg-surface-sunken">
          <div className="container-page grid grid-cols-2 gap-6 py-10 sm:grid-cols-3">
            <Stat label={t("home.statFamilies")} value={stats?.families} />
            <Stat label={t("home.statMembers")} value={stats?.members} />
            <Stat
              label={t("home.statContributions")}
              value={stats?.collectedThisYear}
              suffix=" AFN"
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </section>

        {/* --------------------------------------------------------------- ABOUT */}
        <section id="about" className="container-page py-20">
          <Reveal className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <SectionHeading
              eyebrow={t("nav.home")}
              title={field("about", "title", t("home.aboutTitle", "A digital home for our extended family"))}
            />
            <p className="text-lg leading-relaxed text-ink-soft">
              {field(
                "about",
                "body",
                t(
                  "home.aboutBody",
                  "The Mohmand Unity Group brings every household into one connected record — from the eldest grandparents to the newest children. We keep our family trees, organise our shared contributions, and make community decisions on a foundation of clear, honest information."
                )
              )}
            </p>
          </Reveal>
        </section>

        {/* --------------------------------------------------- MISSION + VISION */}
        <section className="container-page grid gap-6 pb-8 md:grid-cols-2">
          <Reveal>
            <Card className="h-full">
              <CardBody className="p-7">
                <span className="eyebrow mb-3">{t("home.missionTitle")}</span>
                <p className="text-lg leading-relaxed text-ink">
                  {field(
                    "mission",
                    "body",
                    t("home.missionBody", "To unite the Mohmand families through trust, mutual support, and a transparent system that serves every generation.")
                  )}
                </p>
              </CardBody>
            </Card>
          </Reveal>
          <Reveal delay={0.08}>
            <Card className="h-full">
              <CardBody className="p-7">
                <span className="eyebrow mb-3">{t("home.visionTitle")}</span>
                <p className="text-lg leading-relaxed text-ink">
                  {field(
                    "vision",
                    "body",
                    t("home.visionBody", "A connected, self-reliant community where heritage is preserved, every family is counted, and no member stands alone.")
                  )}
                </p>
              </CardBody>
            </Card>
          </Reveal>
        </section>

        {/* ---------------------------------------------------------- OBJECTIVES */}
        <section className="container-page py-16">
          <Reveal>
            <SectionHeading eyebrow={t("nav.home")} title={t("home.objectivesTitle")} align="center" />
          </Reveal>
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
            {objectiveItems.map((item: string, i: number) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="flex items-start gap-3 rounded-2xl border border-sand/70 bg-surface p-5">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 rotate-45 place-items-center rounded-md bg-pine-100">
                    <span className="-rotate-45 text-xs font-bold text-pine">{i + 1}</span>
                  </span>
                  <p className="text-sm leading-relaxed text-ink-soft">{item}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------- ANNOUNCEMENTS */}
        <section className="container-page py-12">
          <Reveal>
            <div className="mb-8 flex items-end justify-between gap-4">
              <SectionHeading eyebrow={<><Megaphone className="h-3.5 w-3.5" /> {t("nav.announcements")}</>} title={t("home.latestAnnouncements")} />
              <Link href={ROUTES.announcements} className="link-underline whitespace-nowrap text-sm font-semibold text-pine">
                {t("announcements.title")} →
              </Link>
            </div>
          </Reveal>
          {announcements && announcements.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {announcements.slice(0, 3).map((a) => (
                <Reveal key={a._id}>
                  <Card className="h-full">
                    <CardBody className="p-6">
                      {a.isPinned && <Badge tone="brass" className="mb-3">{t("announcements.pinned")}</Badge>}
                      <h3 className="text-lg font-semibold text-ink">{localized(a, "title", locale)}</h3>
                      <p className="mt-2 line-clamp-3 text-sm text-ink-faint">{localized(a, "body", locale)}</p>
                    </CardBody>
                  </Card>
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Megaphone className="h-8 w-8" />} title={t("announcements.noneTitle")} description={t("announcements.noneBody")} />
          )}
        </section>

        {/* --------------------------------------------------------------- LAWS */}
        <section className="container-page py-12">
          <Reveal>
            <div className="mb-8 flex items-end justify-between gap-4">
              <SectionHeading eyebrow={<><ScrollText className="h-3.5 w-3.5" /> {t("nav.laws")}</>} title={t("laws.title")} description={t("laws.subtitle")} />
              <Link href={ROUTES.laws} className="link-underline whitespace-nowrap text-sm font-semibold text-pine">
                {t("laws.title")} →
              </Link>
            </div>
          </Reveal>
          {laws && laws.length > 0 ? (
            <ol className="space-y-3">
              {laws.slice(0, 5).map((law, i) => (
                <Reveal key={law._id}>
                  <li className="flex gap-4 rounded-2xl border border-sand/70 bg-surface p-5">
                    <span className="nums text-2xl font-semibold text-brass">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="font-semibold text-ink">{localized(law, "title", locale)}</h3>
                      <p className="mt-1 text-sm text-ink-faint">{localized(law, "body", locale)}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          ) : (
            <EmptyState icon={<ScrollText className="h-8 w-8" />} title={t("laws.title")} description={t("laws.subtitle")} />
          )}
        </section>

        {/* ------------------------------------------------------------ CONTACT */}
        <section className="container-page py-16">
          <Reveal>
            <div className="overflow-hidden rounded-2xl bg-pine text-parchment">
              <div className="kilim-rule" aria-hidden />
              <div className="grid gap-8 p-8 sm:grid-cols-2 sm:p-12">
                <div>
                  <h2 className="font-display text-3xl font-semibold">{t("home.contactTitle")}</h2>
                  <p className="mt-3 max-w-md text-parchment/75">
                    {t("home.contactBody", "Questions about joining, contributions, or your family record? Reach out and a community administrator will help.")}
                  </p>
                </div>
                <div className="flex flex-col justify-center gap-2 text-sm">
                  <p className="flex items-center gap-2"><Users className="h-4 w-4 text-brass-soft" /> info@mohmandunity.org</p>
                  <p className="text-parchment/70">Nangarhar, Afghanistan</p>
                  <SignedOut>
                    <SignUpButton mode="modal">
                      <Button variant="secondary" className="mt-4 w-fit">{t("home.registerCta")}</Button>
                    </SignUpButton>
                  </SignedOut>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}

/* ----------------------------------------------------------------- partials */

function Stat({
  label,
  value,
  suffix = "",
  className = "",
}: {
  label: string;
  value: number | undefined;
  suffix?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="nums text-4xl font-semibold text-pine sm:text-5xl">
        {value === undefined ? "—" : value.toLocaleString()}
        {value !== undefined && suffix && <span className="text-2xl text-brass">{suffix}</span>}
      </div>
      <div className="mt-1 text-sm font-medium uppercase tracking-wider text-ink-faint">{label}</div>
    </div>
  );
}

/** Decorative lineage diagram (purely visual) echoing the brand mark. */
function LineageMotif() {
  return (
    <svg viewBox="0 0 320 320" className="h-full max-h-[360px] w-full max-w-[360px]">
      <defs>
        <linearGradient id="ln" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1E4D3B" />
          <stop offset="1" stopColor="#2F6B4F" />
        </linearGradient>
      </defs>
      <path d="M160 20 300 160 160 300 20 160Z" fill="none" stroke="#E0DAC9" strokeWidth="2" />
      <path d="M160 60 260 160 160 260 60 160Z" fill="none" stroke="#B8893B" strokeWidth="1" opacity="0.6" />
      {/* edges */}
      <g stroke="url(#ln)" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M160 235 V190" />
        <path d="M160 190 C120 175 110 150 100 128" />
        <path d="M160 190 C200 175 210 150 220 128" />
        <path d="M100 128 V100" />
        <path d="M220 128 V100" />
      </g>
      {/* nodes */}
      <g fill="#1E4D3B">
        <circle cx="160" cy="240" r="9" />
      </g>
      <g fill="#2F6B4F">
        <circle cx="100" cy="124" r="7" />
        <circle cx="220" cy="124" r="7" />
      </g>
      <g fill="#B8893B">
        <circle cx="100" cy="96" r="6" />
        <circle cx="220" cy="96" r="6" />
        <circle cx="160" cy="186" r="6" />
      </g>
    </svg>
  );
}
