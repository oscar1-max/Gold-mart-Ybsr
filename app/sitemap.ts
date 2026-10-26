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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const base = origin(h.get("host"), h.get("x-forwarded-proto"));
  const publicPaths = ["/", "/shop", "/categories", "/help", "/privacy", "/terms", "/account-deletion"];
  const entries: MetadataRoute.Sitemap = publicPaths.map(path => ({
    url: base + path,
    changeFrequency: path === "/" || path === "/shop" ? "daily" : "monthly",
    priority: path === "/" ? 1 : path === "/shop" ? 0.9 : 0.5,
  }));

  // Product pages are public. Never add private user, order, seller or admin URLs.
  try {
    const response = await fetch("https://goldmart-backend-yoxc.onrender.com/api/products", {
      signal: AbortSignal.timeout(4500),
      cache: "no-store",
    });
    if (!response.ok) return entries;
    const data = (await response.json()) as { products?: Array<{ id?: number | string }> };
    if (!Array.isArray(data.products)) return entries;
    const ids = new Set<string>();
    for (const product of data.products.slice(0, 5000)) {
      const id = String(product.id ?? "");
      if (/^[1-9]\d*$/.test(id)) ids.add(id);
    }
    for (const id of ids) entries.push({
      url: `${base}/product/${id}`,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  } catch { /* Static public pages remain discoverable during backend downtime. */ }
  return entries;
}
