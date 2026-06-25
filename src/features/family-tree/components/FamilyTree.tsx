"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { useFamilyTreeStore } from "@/store/familyTreeStore";
import { useUiStore } from "@/store/uiStore";
import { localized, cn, formatDateTime } from "@/lib/utils";
import { EmptyState } from "@/components/ui";
import { useFamilyTreeLayout } from "../hooks/useFamilyTree";
import { MemberNode } from "./MemberNode";
import type { RelationshipDoc, TreeConnector, TreeMemberDoc } from "../types";

/**
 * Renders the family tree onto a pannable / zoomable stage.
 *
 * Layout maths live entirely in `useFamilyTreeLayout` (a pure transform of
 * members + edges). This component is the *view*: it positions nodes with CSS
 * transforms, draws connectors in an SVG layer behind them, and wires up
 * drag-to-pan. Zoom / collapse / search / fullscreen all flow through the
 * Zustand store so the toolbar stays decoupled.
 */
export function FamilyTree({
  members,
  edges,
}: {
  members: TreeMemberDoc[];
  edges: RelationshipDoc[];
}) {
  const { t } = useTranslation();
  const layout = useFamilyTreeLayout(members, edges);

  const zoom = useFamilyTreeStore((s) => s.zoom);
  const offset = useFamilyTreeStore((s) => s.offset);
  const setOffset = useFamilyTreeStore((s) => s.setOffset);
  const selectedId = useFamilyTreeStore((s) => s.selectedId);
  const select = useFamilyTreeStore((s) => s.select);

  const viewportRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const [grabbing, setGrabbing] = useState(false);

  // Centre the tree horizontally on first paint / when the tree size changes.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp || layout.width === 0) return;
    const centred = (vp.clientWidth - layout.width) / 2;
    setOffset({ x: Math.max(centred, 24), y: 32 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout.width, layout.height]);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    // Let clicks on a node (button) through — only pan from empty canvas.
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    setGrabbing(true);
    viewportRef.current?.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    setOffset({
      x: drag.current.originX + (e.clientX - drag.current.startX),
      y: drag.current.originY + (e.clientY - drag.current.startY),
    });
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    drag.current.active = false;
    setGrabbing(false);
    viewportRef.current?.releasePointerCapture?.(e.pointerId);
  }

  if (layout.nodes.length === 0) {
    return (
      <div className="grid min-h-[60vh] place-items-center rounded-2xl border border-sand bg-surface/60">
        <EmptyState title={t("tree.empty")} />
      </div>
    );
  }

  const selected = layout.nodes.find((n) => n.member._id === selectedId)?.member;

  return (
    <div
      ref={viewportRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      className={cn(
        "relative h-full w-full select-none overflow-hidden rounded-2xl border border-sand bg-parchment kilim-watermark",
        grabbing ? "cursor-grabbing" : "cursor-grab"
      )}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          width: layout.width,
          height: layout.height,
        }}
      >
        <ConnectorLayer connectors={layout.connectors} width={layout.width} height={layout.height} />
        {layout.nodes.map((node) => (
          <MemberNode key={node.member._id} node={node} />
        ))}
      </div>

      {selected && <SelectedPanel member={selected} onClose={() => select(null)} />}
    </div>
  );
}

/** SVG layer: orthogonal parent links + straight spouse links, behind nodes. */
function ConnectorLayer({
  connectors,
  width,
  height,
}: {
  connectors: TreeConnector[];
  width: number;
  height: number;
}) {
  return (
    <svg
      className="pointer-events-none absolute left-0 top-0"
      width={width}
      height={height}
      aria-hidden
    >
      {connectors.map((c) => {
        if (c.kind === "spouse") {
          return (
            <line
              key={c.id}
              x1={c.from.x}
              y1={c.from.y}
              x2={c.to.x}
              y2={c.to.y}
              stroke="#B8893B"
              strokeWidth={2}
              strokeDasharray="4 3"
            />
          );
        }
        const midY = c.from.y + (c.to.y - c.from.y) / 2;
        return (
          <path
            key={c.id}
            d={`M ${c.from.x} ${c.from.y} V ${midY} H ${c.to.x} V ${c.to.y}`}
            fill="none"
            stroke="#3E7E63"
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}

/** Floating detail card for the selected member. */
function SelectedPanel({ member, onClose }: { member: TreeMemberDoc; onClose: () => void }) {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const name = `${localized(member, "firstName", locale)} ${localized(member, "lastName", locale)}`.trim();
  const rows: Array<[string, string | undefined]> = [
    [t("members.maritalStatus"), member.maritalStatus],
    [t("members.gender"), member.gender],
    [t("members.phone"), member.phone],
    [t("members.occupation"), member.occupation],
    [t("members.address"), member.address],
    [t("members.dateOfBirth"), member.dateOfBirth],
  ];
  return (
    <div className="absolute bottom-4 start-4 z-20 w-64 rounded-xl border border-sand bg-surface/95 p-4 shadow-lift backdrop-blur">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-display text-lg leading-tight text-ink">{name || "—"}</h4>
        <button
          onClick={onClose}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-ink-faint hover:bg-sand/60 hover:text-ink"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <dl className="mt-2 space-y-1 text-sm">
        {rows
          .filter(([, v]) => !!v)
          .map(([label, v]) => (
            <div key={label} className="flex justify-between gap-3">
              <dt className="text-ink-faint">{label}</dt>
              <dd className="truncate text-end capitalize text-ink-soft">{v}</dd>
            </div>
          ))}
        {member.dateOfDeath && (
          <div className="flex justify-between gap-3">
            <dt className="text-ink-faint">✝</dt>
            <dd className="text-ink-soft">{member.dateOfDeath}</dd>
          </div>
        )}
      </dl>
      <p className="mt-2 text-[11px] text-ink-faint">
        {t("common.edit")} · {formatDateTime(member.updatedAt)}
      </p>
    </div>
  );
}
