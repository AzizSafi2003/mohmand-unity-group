"use client";

import { ReactNode, useMemo } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

/**
 * Wires Clerk (authentication) to Convex (data). Convex queries/mutations that
 * call `requireUser`/`requireAdmin` rely on the Clerk identity forwarded here
 * via ConvexProviderWithClerk. The Clerk JWT template named "convex" must exist
 * (see DEVELOPER_GUIDE.md → "Wiring Clerk to Convex").
 */
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // Created once per browser session.
  const convex = useMemo(() => {
    if (!convexUrl) {
      // Surfaced clearly in dev rather than failing with a cryptic error.
      throw new Error(
        "NEXT_PUBLIC_CONVEX_URL is not set. Copy .env.example to .env.local and run `npx convex dev`."
      );
    }
    return new ConvexReactClient(convexUrl);
  }, []);

  if (!publishableKey) {
    throw new Error(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. Add your Clerk keys to .env.local."
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#1E4D3B",
          colorText: "#14201A",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-sans)",
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

// `dark` is imported to keep the option available for a future theme toggle.
void dark;
