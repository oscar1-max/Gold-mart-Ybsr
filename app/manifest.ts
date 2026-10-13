
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",

    name: "GoldMart - Premium Marketplace",

    short_name: "GoldMart",

    description:
      "Discover and shop products on GoldMart, a premium online marketplace connecting buyers and sellers.",

    start_url: "/",

    scope: "/",

    display: "standalone",

    background_color: "#FAF8F3",

    theme_color: "#17191D",

    icons: [
      {
        src: "/images/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
