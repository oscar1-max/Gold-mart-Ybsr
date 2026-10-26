import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function origin(host: string | null, protocol: string | null) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol === "https:" || (url.protocol === "http:" && url.hostname === "localhost")) return url.origin;
    } catch { /* Fall back to the deployment hostname. */ }
  }
  const safeHost = host && /^(?:[a-z0-9-]+\.)*[a-z0-9-]+(?::\d{1,5})?$/i.test(host) ? host : "localhost:3000";
  return `${safeHost.startsWith("localhost") ? "http" : protocol === "http" ? "http" : "https"}://${safeHost}`;
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const base = origin(h.get("host"), h.get("x-forwarded-proto"));
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/shop", "/categories", "/product/", "/help", "/privacy", "/terms", "/account-deletion"],
      disallow: [
        "/account", "/admin", "/seller", "/orders", "/checkout", "/cart",
        "/notifications", "/chat", "/support", "/order-protection", "/track-order",
        "/login", "/register", "/order-success", "/wishlist", "/become-seller",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
