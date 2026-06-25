import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/lib/constants";

/**
 * Global UI state that is not tied to a single feature: the active locale and
 * the admin sidebar open/closed state. Locale is persisted so a returning
 * visitor keeps their language. The actual i18n + <html dir> sync happens in
 * I18nProvider, which subscribes to this store.
 */
interface UiState {
  locale: Locale;
  sidebarOpen: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      locale: "en",
      sidebarOpen: false,
      setLocale: (locale) => set({ locale }),
      toggleLocale: () => set({ locale: get().locale === "en" ? "ps" : "en" }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
    }),
    { name: "mug-ui", partialize: (s) => ({ locale: s.locale }) }
  )
);
