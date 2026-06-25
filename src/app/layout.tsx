import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Fraunces, Inter, Vazirmatn } from "next/font/google";
import { AppProviders } from "@/providers/AppProviders";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Arabic-script face for Pashto (RTL). Loads the arabic subset.
const pashto = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-ps",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mohmand Unity Group",
    template: "%s · Mohmand Unity Group",
  },
  description:
    "A bilingual community platform for the Mohmand family network: family trees, members, monthly contributions, and transparent financial reporting.",
  applicationName: "Mohmand Unity Group",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#1E4D3B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${display.variable} ${sans.variable} ${pashto.variable}`}
    >
      <body className="font-sans">
        <ClerkProvider>
          <AppProviders>{children}</AppProviders>
        </ClerkProvider>
      </body>
    </html>
  );
}
