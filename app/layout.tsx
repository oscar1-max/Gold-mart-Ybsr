import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
