"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

type Product = {
  id: number;
  name: string;
  price: string | number;
  currency?: string | null;
  image_url?: string | null;
  category_name?: string | null;
  stock?: number | null;
};

const departments = [
  { name: "Phones", short: "Phones", icon: "📱", note: "Mobile essentials", tone: "from-[#FFF8F2] via-[#FFFFFF] to-[#FFFFFF]", accent: "bg-[#FFF8F2]" },
  { name: "Electronics", short: "Electronics", icon: "💻", note: "Smart everyday tech", tone: "from-[#FFF8F2] via-[#FFFFFF] to-white", accent: "bg-[#FFF8F2]" },
  { name: "Gaming", short: "Gaming", icon: "🎮", note: "Play, your way", tone: "from-[#FFF8F2] via-[#FFFFFF] to-white", accent: "bg-[#FFF8F2]" },
  { name: "Fashion", short: "Fashion", icon: "👕", note: "Refresh your wardrobe", tone: "from-[#FFF8F2] via-[#FFFFFF] to-white", accent: "bg-[#FFF8F2]" },
  { name: "Beauty & Cosmetics", short: "Beauty", icon: "💄", note: "Care & beauty finds", tone: "from-[#FFF8F2] via-[#FFFFFF] to-white", accent: "bg-[#FFF8F2]" },
  { name: "Groceries", short: "Groceries", icon: "🛒", note: "Everyday essentials", tone: "from-[#FFF8F2] via-[#FFFFFF] to-white", accent: "bg-[#FFF8F2]" },
  { name: "Home & Kitchen", short: "Home", icon: "🏠", note: "Spaces worth loving", tone: "from-[#FFF8F2] via-[#FFF8F2] to-white", accent: "bg-[#FFF8F2]" },
  { name: "Jewelry & Accessories", short: "Accessories", icon: "💎", note: "The little details", tone: "from-[#FFF8F2] via-[#FFFFFF] to-white", accent: "bg-[#FFF8F2]" },
] as const;

function formatPrice(price: string | number, currency?: string | null) {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return "Price unavailable";
  const code = String(currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: code,
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

function shopLink(category: string) {
  return category === "All"
    ? "/shop"
    : `/shop?category=${encodeURIComponent(category)}`;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [selected, setSelected] = useState("All");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function getProducts() {
      try {
        const response = await fetch(`${API_URL}/api/products`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        const body = await response.json();
        if (!response.ok || !body.success || !Array.isArray(body.products)) {
          throw new Error("Products unavailable");
        }
        if (!controller.signal.aborted) setProducts(body.products);
      } catch {
        if (!controller.signal.aborted) setLoadError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void getProducts();
    return () => controller.abort();
  }, []);

  const active = departments.find((item) => item.name === selected);
  const visible = useMemo(() => {
    const matching = selected === "All"
      ? products
      : products.filter((p) => (p.category_name || "").trim().toLowerCase() === selected.toLowerCase());
    return matching.filter((p) => p.id && p.name).slice(0, 12);
  }, [products, selected]);

  function submitSearch() {
    const query = search.trim();
    router.push(query ? `/shop?search=${encodeURIComponent(query)}` : "/shop");
  }

  return (
    <main className="gm-categories-page min-h-screen bg-[#FFFFFF] pb-32 text-[#14263D] md:pb-14">
      <header className="border-b border-[#FFF8F2] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="shrink-0 text-[23px] font-black tracking-[-0.055em]">
            Gold<span className="text-[#FF6B00]">Mart</span><span className="ml-1 align-top text-xs text-[#FF6B00]">✦</span>
          </Link>
          <Link href="/shop" className="rounded-full border border-[#FFF8F2] px-4 py-2 text-xs font-bold transition hover:bg-[#FFF8F2]">
            Shop all <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
          <form onSubmit={(event) => { event.preventDefault(); submitSearch(); }} role="search"
            className="mx-auto flex h-12 max-w-3xl items-center gap-2 rounded-full border border-[#FFF8F2] bg-[#FFFFFF] pl-4 pr-1.5 focus-within:border-[#FF6B00] focus-within:ring-2 focus-within:ring-[#FFF8F2]">
            <span aria-hidden="true">⌕</span>
            <input type="search" aria-label="Search GoldMart products" placeholder="Search products, brands and more"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Link href="/visual-search" aria-label="Search using an image" className="rounded-full px-2 py-1 text-xl hover:bg-white">📷</Link>
            <button type="submit" className="rounded-full bg-[#14263D] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#243B53]">Search</button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 pt-5 sm:px-6 sm:pt-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.19em] text-[#FF6B00]">Explore the marketplace</p>
            <h1 className="mt-1 text-2xl font-black tracking-[-0.04em] sm:text-4xl">Shop by category</h1>
          </div>
          <span className="text-xs font-medium text-[#FF6B00]">Discover your next favorite find</span>
        </div>

        <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-5">
          <aside aria-label="Category departments" className="self-start overflow-hidden rounded-[22px] border border-[#FFF8F2] bg-white shadow-[0_6px_20px_rgba(20,30,40,0.04)]">
            <div className="border-b border-[#FFF8F2] px-3 py-4 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#FF6B00] sm:px-5">
              Departments
            </div>
            <nav aria-label="Choose a department" className="og-scrollbar max-h-[65vh] overflow-y-auto py-2">
              <button type="button" onClick={() => setSelected("All")} aria-pressed={selected === "All"}
                className={`flex w-full flex-col items-center gap-1.5 border-l-[3px] px-2 py-3 text-center transition sm:flex-row sm:gap-3 sm:px-4 sm:text-left ${selected === "All" ? "border-[#FF6B00] bg-[#FFF8F2] text-[#14263D]" : "border-transparent text-[#FF6B00] hover:bg-[#FFFFFF]"}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF8F2] text-lg">✦</span>
                <span className="text-[10px] font-bold leading-4 sm:text-sm">All departments</span>
              </button>
              {departments.map((item) => (
                <button key={item.name} type="button" onClick={() => setSelected(item.name)} aria-pressed={selected === item.name}
                  className={`flex w-full flex-col items-center gap-1.5 border-l-[3px] px-2 py-3 text-center transition sm:flex-row sm:gap-3 sm:px-4 sm:text-left ${selected === item.name ? "border-[#FF6B00] bg-[#FFF8F2] text-[#14263D]" : "border-transparent text-[#FF6B00] hover:bg-[#FFFFFF]"}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg ${item.accent}`}>{item.icon}</span>
                  <span className="break-words text-[10px] font-bold leading-4 sm:text-sm">{item.short}</span>
                </button>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 space-y-5">
            <section className={`relative overflow-hidden rounded-[23px] bg-gradient-to-br ${active?.tone || "from-[#FFF8F2] via-[#FFF8F2] to-[#FFFFFF]"} p-4 sm:rounded-[27px] sm:p-8`}>
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full border-[28px] border-white/40" aria-hidden="true" />
              <div className="relative">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#FF6B00]">The GoldMart edit</p>
                <h2 className="mt-2 max-w-md text-xl font-black tracking-tight sm:text-3xl">
                  {active ? active.name : "Discover something wonderful."}
                </h2>
                <p className="mt-2 max-w-sm text-xs leading-5 text-[#243B53] sm:text-sm">
                  {active ? active.note : "From everyday essentials to special finds, explore the departments that fit your life."}
                </p>
                <Link href={shopLink(selected)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#14263D] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#243B53]">
                  {active ? "Shop this category" : "Shop all products"} <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </section>

            <section className="rounded-[23px] border border-[#FFF8F2] bg-white p-3 shadow-[0_6px_20px_rgba(20,30,40,0.035)] sm:p-6">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#FF6B00]">Finds worth exploring</p>
                  <h3 className="mt-1 text-lg font-black sm:text-2xl">{selected === "All" ? "Latest marketplace finds" : `Discover ${active?.short || selected}`}</h3>
                </div>
                <Link href={shopLink(selected)} className="text-xs font-bold text-[#FF6B00] hover:underline">View all ↗</Link>
              </div>
              {loading ? (
                <div aria-label="Loading products" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="animate-pulse overflow-hidden rounded-xl bg-[#FFFFFF]"><div className="aspect-square bg-[#FFF8F2]" /><div className="h-14 p-3" /></div>)}
                </div>
              ) : visible.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {visible.map((product) => (
                    <Link key={product.id} href={`/product/${product.id}`} className="group overflow-hidden rounded-2xl border border-[#FFF8F2] bg-white transition hover:border-[#FF6B00] hover:shadow-md">
                      <div className="relative aspect-square bg-[#FFFFFF]">
                        {product.image_url ? <Image src={product.image_url} alt={product.name} fill sizes="(max-width: 640px) 36vw, 180px" className="object-cover transition group-hover:scale-[1.03]" />
                          : <span className="flex h-full items-center justify-center text-3xl" aria-hidden="true">🛍️</span>}
                      </div>
                      <div className="p-3">
                        <p className="line-clamp-2 min-h-9 text-xs font-semibold leading-[18px]">{product.name}</p>
                        <p className="mt-2 break-words text-sm font-black">{formatPrice(product.price, product.currency)}</p>
                        <span className="mt-2 inline-block text-[11px] font-bold text-[#FF6B00]">View product ↗</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-[#FFFFFF] px-4 py-9 text-center">
                  <span className="text-3xl" aria-hidden="true">🛍️</span>
                  <p className="mt-3 text-sm font-bold">{loadError ? "Products aren't loading right now" : "No products listed in this department yet"}</p>
                  <p className="mt-1 text-xs text-[#FF6B00]">Explore the shop for more options.</p>
                  <Link href="/shop" className="mt-4 inline-flex rounded-full border border-[#FFE9CC] bg-white px-4 py-2 text-xs font-bold">Browse shop ↗</Link>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
