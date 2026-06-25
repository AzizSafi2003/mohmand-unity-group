"use client";

import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { I18nProvider } from "./I18nProvider";
import { LenisProvider } from "./LenisProvider";

/**
 * Single client boundary that composes every provider, mounted once in the
 * root layout. Order matters: Clerk/Convex outermost (auth + data), then i18n,
 * then presentation concerns (smooth scroll, toasts).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConvexClientProvider>
      <I18nProvider>
        <LenisProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#14201A",
                color: "#FBFAF5",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                fontFamily: "var(--font-sans)",
              },
              success: { iconTheme: { primary: "#B8893B", secondary: "#14201A" } },
            }}
          />
        </LenisProvider>
      </I18nProvider>
    </ConvexClientProvider>
  );
}
