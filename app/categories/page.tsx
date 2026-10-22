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
  { name: "Phones", short: "Phones", icon: "📱", note: "Mobile essentials", tone: "from-[#E8EAF7] via-[#F2F1FC] to-[#FCFAFF]", accent: "bg-[#E2E5F7]" },
  { name: "Electronics", short: "Electronics", icon: "💻", note: "Smart everyday tech", tone: "from-[#E2EFF2] via-[#F1F9F8] to-white", accent: "bg-[#DDEDEF]" },
  { name: "Gaming", short: "Gaming", icon: "🎮", note: "Play, your way", tone: "from-[#ECE4F6] via-[#F7F2FB] to-white", accent: "bg-[#EEE4F7]" },
  { name: "Fashion", short: "Fashion", icon: "👕", note: "Refresh your wardrobe", tone: "from-[#F6E7E5] via-[#FCF4F1] to-white", accent: "bg-[#F5E5E4]" },
  { name: "Beauty & Cosmetics", short: "Beauty", icon: "💄", note: "Care & beauty finds", tone: "from-[#F9E7EF] via-[#FEF5F7] to-white", accent: "bg-[#F8E4ED]" },
  { name: "Groceries", short: "Groceries", icon: "🛒", note: "Everyday essentials", tone: "from-[#E5F1E9] via-[#F4FAF5] to-white", accent: "bg-[#E0F0E5]" },
  { name: "Home & Kitchen", short: "Home", icon: "🏠", note: "Spaces worth loving", tone: "from-[#FAEBD6] via-[#FDF6EB] to-white", accent: "bg-[#F8E9D0]" },
  { name: "Jewelry & Accessories", short: "Accessories", icon: "💎", note: "The little details", tone: "from-[#E5ECF5] via-[#F4F7FC] to-white", accent: "bg-[#E5EBF5]" },
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

  function representativeImage(name: string) {
    return products.find((p) =>
      p.image_url && (p.category_name || "").trim().toLowerCase() === name.toLowerCase()
    )?.image_url || null;
  }

  function submitSearch() {
    const query = search.trim();
    router.push(query ? `/shop?search=${encodeURIComponent(query)}` : "/shop");
  }

  return (
    <main className="min-h-screen bg-[#F8F8F6] pb-32 text-[#20252C] md:pb-14">
      <header className="border-b border-[#E9E8E2] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="shrink-0 text-[23px] font-black tracking-[-0.055em]">
            Gold<span className="text-[#B18D57]">Mart</span><span className="ml-1 align-top text-xs text-[#C3A576]">✦</span>
          </Link>
          <Link href="/shop" className="rounded-full border border-[#D9DAD6] px-4 py-2 text-xs font-bold transition hover:bg-[#F7F4EE]">
            Shop all <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
          <form onSubmit={(event) => { event.preventDefault(); submitSearch(); }} role="search"
            className="mx-auto flex h-12 max-w-3xl items-center gap-2 rounded-full border border-[#E1DFD8] bg-[#F7F7F4] pl-4 pr-1.5 focus-within:border-[#B99869] focus-within:ring-2 focus-within:ring-[#E5D8C2]">
            <span aria-hidden="true">⌕</span>
            <input type="search" aria-label="Search GoldMart products" placeholder="Search products, brands and more"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Link href="/visual-search" aria-label="Search using an image" className="rounded-full px-2 py-1 text-xl hover:bg-white">📷</Link>
            <button type="submit" className="rounded-full bg-[#20282F] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#426A62]">Search</button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 pt-5 sm:px-6 sm:pt-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.19em] text-[#A07B4A]">Explore the marketplace</p>
            <h1 className="mt-1 text-2xl font-black tracking-[-0.04em] sm:text-4xl">Shop by category</h1>
          </div>
          <span className="text-xs font-medium text-[#777B7A]">Discover your next favorite find</span>
        </div>

        <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-5">
          <aside aria-label="Category departments" className="self-start overflow-hidden rounded-[22px] border border-[#E6E7E4] bg-white shadow-[0_6px_20px_rgba(20,30,40,0.04)]">
            <div className="border-b border-[#F0EEE9] px-3 py-4 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#A07B4A] sm:px-5">
              Departments
            </div>
            <nav aria-label="Choose a department" className="og-scrollbar max-h-[65vh] overflow-y-auto py-2">
              <button type="button" onClick={() => setSelected("All")} aria-pressed={selected === "All"}
                className={`flex w-full flex-col items-center gap-1.5 border-l-[3px] px-2 py-3 text-center transition sm:flex-row sm:gap-3 sm:px-4 sm:text-left ${selected === "All" ? "border-[#B99560] bg-[#F8F2E8] text-[#24282E]" : "border-transparent text-[#656B70] hover:bg-[#F7F7F5]"}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F1E8D8] text-lg">✦</span>
                <span className="text-[10px] font-bold leading-4 sm:text-sm">All departments</span>
              </button>
              {departments.map((item) => (
                <button key={item.name} type="button" onClick={() => setSelected(item.name)} aria-pressed={selected === item.name}
                  className={`flex w-full flex-col items-center gap-1.5 border-l-[3px] px-2 py-3 text-center transition sm:flex-row sm:gap-3 sm:px-4 sm:text-left ${selected === item.name ? "border-[#B99560] bg-[#F8F2E8] text-[#24282E]" : "border-transparent text-[#656B70] hover:bg-[#F7F7F5]"}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg ${item.accent}`}>{item.icon}</span>
                  <span className="break-words text-[10px] font-bold leading-4 sm:text-sm">{item.short}</span>
                </button>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 space-y-5">
            <section className={`relative overflow-hidden rounded-[23px] bg-gradient-to-br ${active?.tone || "from-[#E9E5F1] via-[#EFF4F1] to-[#FCFAF6]"} p-4 sm:rounded-[27px] sm:p-8`}>
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full border-[28px] border-white/40" aria-hidden="true" />
              <div className="relative">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#816745]">The GoldMart edit</p>
                <h2 className="mt-2 max-w-md text-xl font-black tracking-tight sm:text-3xl">
                  {active ? active.name : "Discover something wonderful."}
                </h2>
                <p className="mt-2 max-w-sm text-xs leading-5 text-[#565C5E] sm:text-sm">
                  {active ? active.note : "From everyday essentials to special finds, explore the departments that fit your life."}
                </p>
                <Link href={shopLink(selected)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#20282F] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#3B665D]">
                  {active ? "Shop this category" : "Shop all products"} <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </section>

            <section className="rounded-[23px] border border-[#E6E7E4] bg-white p-3 shadow-[0_6px_20px_rgba(20,30,40,0.035)] sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-black tracking-tight sm:text-xl">Explore departments</h3>
                  <p className="mt-1 text-[11px] text-[#777B7A]">Choose one to browse products</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {departments.map((item) => {
                  const picture = representativeImage(item.name);
                  return (
                    <Link key={item.name} href={shopLink(item.name)}
                      className="group flex min-w-0 flex-col items-center rounded-2xl p-2 text-center transition hover:bg-[#F8F8F5]">
                      <span className={`relative flex aspect-square w-full max-w-[115px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${item.tone} ring-1 ring-[#EAE9E4] transition group-hover:-translate-y-1 group-hover:ring-[#C7A675]`}>
                        {picture ? (
                          <Image src={picture} alt="" fill sizes="115px" className="object-cover" />
                        ) : (
                          <span className="text-[38px] sm:text-[45px]" aria-hidden="true">{item.icon}</span>
                        )}
                      </span>
                      <span className="mt-2 text-[11px] font-bold leading-4 sm:text-xs">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[23px] border border-[#E6E7E4] bg-white p-3 shadow-[0_6px_20px_rgba(20,30,40,0.035)] sm:p-6">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#997948]">Finds worth exploring</p>
                  <h3 className="mt-1 text-lg font-black sm:text-2xl">{selected === "All" ? "Latest marketplace finds" : `Discover ${active?.short || selected}`}</h3>
                </div>
                <Link href={shopLink(selected)} className="text-xs font-bold text-[#856434] hover:underline">View all ↗</Link>
              </div>
              {loading ? (
                <div aria-label="Loading products" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="animate-pulse overflow-hidden rounded-xl bg-[#F7F7F4]"><div className="aspect-square bg-[#EBEAE4]" /><div className="h-14 p-3" /></div>)}
                </div>
              ) : visible.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {visible.map((product) => (
                    <Link key={product.id} href={`/product/${product.id}`} className="group overflow-hidden rounded-2xl border border-[#EBEBE7] bg-white transition hover:border-[#C2A776] hover:shadow-md">
                      <div className="relative aspect-square bg-[#F6F6F3]">
                        {product.image_url ? <Image src={product.image_url} alt={product.name} fill sizes="(max-width: 640px) 36vw, 180px" className="object-cover transition group-hover:scale-[1.03]" />
                          : <span className="flex h-full items-center justify-center text-3xl" aria-hidden="true">🛍️</span>}
                      </div>
                      <div className="p-3">
                        <p className="line-clamp-2 min-h-9 text-xs font-semibold leading-[18px]">{product.name}</p>
                        <p className="mt-2 break-words text-sm font-black">{formatPrice(product.price, product.currency)}</p>
                        <span className="mt-2 inline-block text-[11px] font-bold text-[#527B70]">View product ↗</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-[#F8F7F3] px-4 py-9 text-center">
                  <span className="text-3xl" aria-hidden="true">🛍️</span>
                  <p className="mt-3 text-sm font-bold">{loadError ? "Products aren't loading right now" : "No products listed in this department yet"}</p>
                  <p className="mt-1 text-xs text-[#71767A]">Explore the shop for more options.</p>
                  <Link href="/shop" className="mt-4 inline-flex rounded-full border border-[#D4C2A4] bg-white px-4 py-2 text-xs font-bold">Browse shop ↗</Link>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
