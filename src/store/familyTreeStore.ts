import { create } from "zustand";

/**
 * Interaction state for the family-tree canvas. Kept in Zustand (not React
 * state) so toolbar buttons, the canvas, and the search box can all read and
 * mutate it without prop-drilling — exactly the brief's requirement.
 */
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2.2;
const ZOOM_STEP = 0.2;

interface FamilyTreeState {
  zoom: number;
  offset: { x: number; y: number };
  collapsed: Set<string>; // member ids whose descendants are hidden
  selectedId: string | null;
  search: string;
  fullscreen: boolean;

  zoomIn: () => void;
  zoomOut: () => void;
  setZoom: (z: number) => void;
  resetView: () => void;
  setOffset: (offset: { x: number; y: number }) => void;

  toggleCollapsed: (id: string) => void;
  collapseAll: (ids: string[]) => void;
  expandAll: () => void;

  select: (id: string | null) => void;
  setSearch: (q: string) => void;
  setFullscreen: (v: boolean) => void;
  reset: () => void;
}

const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(z.toFixed(2))));

export const useFamilyTreeStore = create<FamilyTreeState>((set, get) => ({
  zoom: 1,
  offset: { x: 0, y: 0 },
  collapsed: new Set<string>(),
  selectedId: null,
  search: "",
  fullscreen: false,

  zoomIn: () => set({ zoom: clampZoom(get().zoom + ZOOM_STEP) }),
  zoomOut: () => set({ zoom: clampZoom(get().zoom - ZOOM_STEP) }),
  setZoom: (z) => set({ zoom: clampZoom(z) }),
  resetView: () => set({ zoom: 1, offset: { x: 0, y: 0 } }),
  setOffset: (offset) => set({ offset }),

  toggleCollapsed: (id) =>
    set((s) => {
      const next = new Set(s.collapsed);
      next.has(id) ? next.delete(id) : next.add(id);
      return { collapsed: next };
    }),
  collapseAll: (ids) => set({ collapsed: new Set(ids) }),
  expandAll: () => set({ collapsed: new Set<string>() }),

  select: (selectedId) => set({ selectedId }),
  setSearch: (search) => set({ search }),
  setFullscreen: (fullscreen) => set({ fullscreen }),
  reset: () =>
    set({
      zoom: 1,
      offset: { x: 0, y: 0 },
      collapsed: new Set<string>(),
      selectedId: null,
      search: "",
      fullscreen: false,
    }),
}));
