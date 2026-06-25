"use client";

import { useTranslation } from "react-i18next";
import {
  Maximize2,
  Minimize2,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronsDownUp,
  ChevronsUpDown,
} from "lucide-react";
import { useFamilyTreeStore } from "@/store/familyTreeStore";
import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";

export function TreeToolbar({ allIds }: { allIds: string[] }) {
  const { t } = useTranslation();
  const {
    zoom,
    zoomIn,
    zoomOut,
    resetView,
    expandAll,
    collapseAll,
    fullscreen,
    setFullscreen,
    search,
    setSearch,
  } = useFamilyTreeStore();

  const btn =
    "grid h-9 w-9 place-items-center rounded-lg border border-sand bg-surface text-ink-soft transition-colors hover:border-pine/40 hover:text-pine";

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-sand bg-surface/80 p-2 backdrop-blur">
      <div className="relative">
        <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("tree.searchPlaceholder")}
          className="h-9 w-44 ps-8"
        />
      </div>

      <div className="mx-1 h-6 w-px bg-sand" />

      <button className={btn} onClick={zoomOut} aria-label={t("tree.zoomOut")}>
        <ZoomOut className="h-4 w-4" />
      </button>
      <span className="nums w-12 text-center text-xs font-medium text-ink-faint">
        {Math.round(zoom * 100)}%
      </span>
      <button className={btn} onClick={zoomIn} aria-label={t("tree.zoomIn")}>
        <ZoomIn className="h-4 w-4" />
      </button>
      <button className={btn} onClick={resetView} aria-label={t("tree.reset")}>
        <Maximize className="h-4 w-4" />
      </button>

      <div className="mx-1 h-6 w-px bg-sand" />

      <button className={btn} onClick={() => expandAll()} aria-label={t("tree.expandAll")}>
        <ChevronsUpDown className="h-4 w-4" />
      </button>
      <button className={btn} onClick={() => collapseAll(allIds)} aria-label={t("tree.collapseAll")}>
        <ChevronsDownUp className="h-4 w-4" />
      </button>

      <div className="mx-1 h-6 w-px bg-sand" />

      <button
        className={cn(btn, "w-auto gap-1.5 px-2.5 text-xs font-semibold")}
        onClick={() => setFullscreen(!fullscreen)}
      >
        {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        <span className="hidden sm:inline">{t("tree.fullscreen")}</span>
      </button>
    </div>
  );
}
