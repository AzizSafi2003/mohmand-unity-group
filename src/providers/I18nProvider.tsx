"use client";

import { ReactNode, useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n/config";
import { useUiStore } from "@/store/uiStore";
import { isRtl } from "@/lib/utils";

/**
 * Keeps three things in sync: the persisted locale (uiStore), the i18next
 * instance, and the <html lang/dir> attributes that drive RTL layout and the
 * Pashto font. Changing the language anywhere updates all of them.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useUiStore((s) => s.locale);

  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
    const html = document.documentElement;
    html.setAttribute("lang", locale);
    html.setAttribute("dir", isRtl(locale) ? "rtl" : "ltr");
  }, [locale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
