import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "../components/CartProvider";

export const metadata: Metadata = {
  title: "GoldMart | Premium Marketplace",
  description:
    "GoldMart is a modern marketplace connecting buyers and sellers with secure shopping experiences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
