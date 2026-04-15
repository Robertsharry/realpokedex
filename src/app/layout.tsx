import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { StoreHydration } from "@/components/providers/StoreHydration";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#dc2626" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1625" },
  ],
};

export const metadata: Metadata = {
  title: "RealPokedex - The Ultimate Pokemon Companion",
  description:
    "A free, feature-rich Pokedex with battle team builder, type matchup explorer, and more. Built by a dad and Claude for his sons.",
  keywords: ["pokedex", "pokemon", "team builder", "type chart"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RealPokedex",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          <StoreHydration>
            <Navbar />
            <main className="pokedex-body mx-auto w-full max-w-7xl flex-1 px-4 pb-20 pt-6 md:pb-6">
              {children}
            </main>
          </StoreHydration>
        </TooltipProvider>
      </body>
    </html>
  );
}
