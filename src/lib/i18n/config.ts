import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import ps from "./locales/ps.json";

/**
 * i18next setup. English is the default + fallback; Pashto is RTL.
 * Initialised once on the client (see src/providers/I18nProvider.tsx).
 * DB-backed overrides from the `translations` table can be merged at runtime
 * via i18n.addResourceBundle(locale, "translation", overrides, true, true).
 */
export const defaultNS = "translation";

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ps: { translation: ps },
      },
      fallbackLng: "en",
      supportedLngs: ["en", "ps"],
      defaultNS,
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
      },
    });
}

export default i18n;
