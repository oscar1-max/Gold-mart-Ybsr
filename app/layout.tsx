
import type { Metadata, Viewport } from "next";
import "./globals.css";

import { CartProvider } from "../components/CartProvider";
import GlobalNavigation from "../components/GlobalNavigation";
import RegisterServiceWorker from "../components/RegisterServiceWorker";
import CommerceShell from "../components/CommerceShell";

export const metadata: Metadata = {
  title: {
    default: "GoldMart | Premium Marketplace",
    template: "%s | GoldMart",
  },

  description:
    "Discover and shop products on GoldMart, a premium online marketplace connecting buyers and sellers.",

  applicationName: "GoldMart",

  manifest: "/manifest.webmanifest",

  appleWebApp: {
    capable: true,
    title: "GoldMart",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#17191D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <CommerceShell>{children}</CommerceShell>

          <GlobalNavigation />
          <RegisterServiceWorker />
        </CartProvider>
      </body>
    </html>
  );
}
