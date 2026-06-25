"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { RequireApproved } from "@/components/shared/Guards";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TreeToolbar } from "@/features/family-tree/components/TreeToolbar";
import { FamilyTree } from "@/features/family-tree/components/FamilyTree";
import { useFamilyTreeStore } from "@/store/familyTreeStore";
import { useUiStore } from "@/store/uiStore";
import { Select, Spinner, SectionHeading } from "@/components/ui";
import { localized, cn } from "@/lib/utils";

export default function FamilyTreePage() {
  return (
    <RequireApproved>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <TreeWorkspace />
        </main>
        <Footer />
      </div>
    </RequireApproved>
  );
}

function TreeWorkspace() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const fullscreen = useFamilyTreeStore((s) => s.fullscreen);
  const resetStore = useFamilyTreeStore((s) => s.reset);

  const families = useQuery(api.families.list, {});
  const [familyId, setFamilyId] = useState<Id<"families"> | null>(null);

  // Default to the first available family once loaded.
  useEffect(() => {
    if (families && families.length > 0 && !familyId) {
      setFamilyId(families[0]._id);
    }
  }, [families, familyId]);

  // Reset zoom/pan/collapse when switching families.
  useEffect(() => {
    resetStore();
  }, [familyId, resetStore]);

  const graph = useQuery(
    api.relationships.getFamilyGraph,
    familyId ? { familyId } : "skip"
  );

  const allIds = useMemo(() => graph?.members.map((m) => m._id) ?? [], [graph]);

  if (families === undefined) {
    return (
      <div className="container-page grid min-h-[60vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (families.length === 0) {
    return (
      <div className="container-page py-16">
        <SectionHeading eyebrow={t("nav.familyTree")} title={t("tree.empty")} />
      </div>
    );
  }

  const canvas =
    graph === undefined ? (
      <div className="grid h-full min-h-[60vh] place-items-center rounded-2xl border border-sand bg-surface/60">
        <Spinner />
      </div>
    ) : (
      <FamilyTree members={graph.members} edges={graph.edges} />
    );

  return (
    <section
      className={cn(
        fullscreen
          ? "fixed inset-0 z-50 flex flex-col gap-3 bg-parchment p-3"
          : "container-page flex flex-col gap-4 py-8"
      )}
    >
      {!fullscreen && (
        <SectionHeading
          eyebrow={t("nav.familyTree")}
          title={t("tree.title")}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Members only ever have one family, so the selector is most useful for admins. */}
          {families.length > 1 ? (
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <span className="font-medium">{t("tree.selectFamily")}</span>
              <Select
                value={familyId ?? ""}
                onChange={(e) => setFamilyId(e.target.value as Id<"families">)}
                className="h-9 w-56"
              >
                {families.map((f) => (
                  <option key={f._id} value={f._id}>
                    {localized(f, "name", locale)}
                  </option>
                ))}
              </Select>
            </label>
          ) : (
            <h2 className="font-display text-xl text-ink">
              {families[0] && localized(families[0], "name", locale)}
            </h2>
          )}
        </div>
        <TreeToolbar allIds={allIds} />
      </div>

      <div className={cn(fullscreen ? "min-h-0 flex-1" : "h-[68vh]")}>{canvas}</div>
    </section>
  );
}
