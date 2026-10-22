"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AddToCartButton from "../components/AddToCartButton";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

type User = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
};

type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: string | number;
  currency?: string | null;
  image_url?: string | null;
  category_name?: string | null;
  stock: number;
  rating?: number;
  sold_count?: number;
};

const categories = [
  { icon: "📱", name: "Phones", value: "Phones" },
  { icon: "💻", name: "Electronics", value: "Electronics" },
  { icon: "🎮", name: "Gaming", value: "Gaming" },
  { icon: "👕", name: "Fashion", value: "Fashion" },
  { icon: "💄", name: "Beauty", value: "Beauty & Cosmetics" },
  { icon: "🛒", name: "Groceries", value: "Groceries" },
  { icon: "🏡", name: "Home", value: "Home & Kitchen" },
  { icon: "💎", name: "Jewelry", value: "Jewelry & Accessories" },
];

const discoveryTabs = ["All", "5-Star Rated", "Best Selling", "New Arrivals"];

const quickLinks = [
  { href: "/shop", icon: "🛍️", label: "Shop All", sub: "Browse every department", tone: "from-[#DDEDF0] to-[#F2FAF9] text-[#285965]", border: "border-[#C5DEE3]" },
  { href: "/track-order", icon: "📦", label: "Track Order", sub: "Follow your purchases", tone: "from-[#E1EFE7] to-[#F3FBF6] text-[#34634B]", border: "border-[#C7E2D2]" },
  { href: "/order-protection", icon: "🛡️", label: "Buyer Protection", sub: "Get help with an order", tone: "from-[#EEE4F3] to-[#FAF6FC] text-[#715287]", border: "border-[#DDCDE8]" },
  { href: "/help", icon: "🎧", label: "Help Centre", sub: "Answers and support", tone: "from-[#F8E7D9] to-[#FFF8F0] text-[#92613C]", border: "border-[#EED6BF]" },
  { href: "/chat", icon: "💬", label: "Messages", sub: "Connect with sellers", tone: "from-[#E1E7F8] to-[#F4F6FC] text-[#465E94]", border: "border-[#CEDAF1]" },
];

const cardClass =
  "group overflow-hidden rounded-[20px] border border-[#E9E2D6] bg-white shadow-[0_5px_22px_rgba(23,25,29,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D5BE98] hover:shadow-[0_12px_28px_rgba(23,25,29,0.09)]";

function formatPrice(price: string | number, currency?: string | null) {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return "0.00";

  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  switch (currency?.toUpperCase()) {
    case "USD":
      return `$${formatted}`;
    case "EUR":
      return `€${formatted}`;
    case "GBP":
      return `£${formatted}`;
    case "NGN":
      return `₦${formatted}`;
    default:
      return formatted;
  }
}

function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const rating = Number(product.rating || 0);
  const available = Number(product.stock) > 0;

  return (
    <article className={`${cardClass} ${compact ? "min-w-[180px] max-w-[180px] shrink-0" : "min-w-0"}`}>
      <Link href={`/product/${product.id}`} className="block" aria-label={`View ${product.name}`}>
        <div className="relative aspect-square overflow-hidden bg-[#F6F3EE]">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes={compact ? "180px" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
              className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl" aria-hidden="true">
              🛍️
            </div>
          )}
          {!available && (
            <span className="absolute left-2 top-2 rounded-full bg-[#17191D]/90 px-2.5 py-1 text-[10px] font-bold text-white">
              Sold out
            </span>
          )}
        </div>
      </Link>

      <div className="p-3 sm:p-4">
        {product.category_name && (
          <p className="mb-1 truncate text-[10px] font-bold uppercase tracking-[0.1em] text-[#96713D]">
            {product.category_name}
          </p>
        )}
        <Link href={`/product/${product.id}`}>
          <h3 className="line-clamp-2 min-h-[38px] text-[13px] font-semibold leading-[19px] text-[#17191D] sm:text-sm">
            {product.name}
          </h3>
        </Link>
        <p className="mt-2 break-words text-[15px] font-black tracking-tight text-[#17191D] sm:text-lg">
          {formatPrice(product.price, product.currency)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#746F67]">
          <span>⭐ {Number.isFinite(rating) ? rating.toFixed(1) : "0.0"}</span>
          <span aria-hidden="true">•</span>
          <span>{available ? "In stock" : "Unavailable"}</span>
        </div>
        {!compact && (
          <div className="mt-3">
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                stock: product.stock,
                currency: product.currency || "USD",
              }}
              disabled={!available}
            />
          </div>
        )}
      </div>
    </article>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    const savedUser = localStorage.getItem("goldmart_user");
    if (!savedUser) return;
    try {
      const parsed: User = JSON.parse(savedUser);
      setUser(parsed && typeof parsed === "object" ? parsed : null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadProducts() {
      try {
        setLoadingProducts(true);
        setProductsError(false);
        const response = await fetch(`${API_URL}/api/products`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load products");
        }
        if (!controller.signal.aborted) {
          setProducts(Array.isArray(data.products) ? data.products : []);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("GoldMart products error:", error);
          setProductsError(true);
          setProducts([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoadingProducts(false);
      }
    }
    void loadProducts();
    return () => controller.abort();
  }, []);

  function handleSearch() {
    const query = search.trim();
    window.location.href = query
      ? `/shop?search=${encodeURIComponent(query)}`
      : "/shop";
  }

  const displayedProducts = useMemo(() => {
    let result = [...products];

    if (activeTab === "5-Star Rated") {
      result = result.filter((product) => Number(product.rating || 0) >= 5);
    } else if (activeTab === "Best Selling") {
      result.sort((a, b) => Number(b.sold_count || 0) - Number(a.sold_count || 0));
    } else if (activeTab === "New Arrivals") {
      // Product IDs are used as a provisional recency signal.
      result.sort((a, b) => Number(b.id) - Number(a.id));
    }
    return result;
  }, [products, activeTab]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F8F8F6] pb-24 text-[#17191D] md:pb-0">
      {/* TOP BAR + MOBILE SEARCH */}
      <header className="sticky top-0 z-50 border-b border-[#EBE4D9] bg-white/95 shadow-[0_3px_16px_rgba(23,25,29,0.035)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="shrink-0 text-[23px] font-black tracking-[-0.055em]" aria-label="GoldMart home">
            Gold<span className="text-[#B08A50]">Mart</span><span className="ml-1 align-top text-[10px] text-[#C5A46D]">✦</span>
          </Link>
          <nav aria-label="Desktop navigation" className="hidden items-center gap-6 text-sm font-semibold text-[#59554E] md:flex">
            <Link href="/shop" className="hover:text-[#96713D]">Shop</Link>
            <Link href="/categories" className="hover:text-[#96713D]">Categories</Link>
            <Link href="/track-order" className="hover:text-[#96713D]">Track Order</Link>
            <Link href="/help" className="hover:text-[#96713D]">Help</Link>
          </nav>
          <div className="flex items-center gap-2">
            {user && (
              <Link href="/notifications" aria-label="Notifications" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EBE4D9] bg-[#FAF8F3] text-lg transition hover:border-[#C5A46D]">🔔</Link>
            )}
            <Link href={user ? "/account" : "/login"} aria-label="Account" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EBE4D9] bg-[#FAF8F3] text-lg transition hover:border-[#C5A46D]">👤</Link>
            <Link href="/cart" aria-label="Cart" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EBE4D9] bg-[#FAF8F3] text-lg transition hover:border-[#C5A46D]">🛒</Link>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 pb-3 sm:px-6">
          <form
            onSubmit={(event) => { event.preventDefault(); handleSearch(); }}
            className="flex h-12 items-center gap-2 overflow-hidden rounded-full border border-[#D8CAB4] bg-[#FAF8F3] pl-4 pr-1.5 transition focus-within:border-[#96713D] focus-within:ring-2 focus-within:ring-[#C5A46D]/15"
            role="search"
          >
            <span className="text-lg" aria-hidden="true">⌕</span>
            <input
              type="search"
              aria-label="Search products"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products and more..."
              className="min-w-0 flex-1 bg-transparent text-sm text-[#17191D] outline-none placeholder:text-[#8A847A]"
            />
            <Link href="/visual-search" aria-label="Visual search" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg hover:bg-white">📷</Link>
            <button type="submit" aria-label="Search" className="flex h-9 w-10 shrink-0 items-center justify-center rounded-full bg-[#17191D] text-lg text-white transition hover:bg-[#96713D]">⌕</button>
          </form>
        </div>
      </header>

      {/* Premium service shortcuts — all link to the original working pages */}
      <section aria-label="GoldMart shopping shortcuts" className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9B7951]">Everything at your fingertips</p><h2 className="mt-1 text-lg font-black sm:text-xl">Explore GoldMart</h2></div>
          <Link href="/categories" className="text-xs font-bold text-[#81633C] hover:underline">All categories ↗</Link>
        </div>
        <nav className="og-scrollbar flex gap-3 overflow-x-auto pb-3 lg:grid lg:grid-cols-5" aria-label="Shopping and support">
          {quickLinks.map(item => (
            <Link key={item.href} href={item.href}
              className={`group flex min-w-[177px] flex-1 flex-col justify-between overflow-hidden rounded-[22px] border bg-gradient-to-br p-4 shadow-[0_7px_20px_rgba(20,40,50,0.035)] transition duration-200 hover:-translate-y-1 hover:shadow-lg sm:min-w-[194px] ${item.tone} ${item.border}`}>
              <span className="flex items-center justify-between"><span className="text-[29px]" aria-hidden="true">{item.icon}</span><span className="text-lg transition group-hover:translate-x-1" aria-hidden="true">↗</span></span>
              <span className="mt-6"><span className="block text-sm font-black">{item.label}</span><span className="mt-1 block text-[11px] font-medium opacity-75">{item.sub}</span></span>
            </Link>
          ))}
        </nav>
      </section>

      {/* INTRO BANNER */}
      <section className="border-b border-[#EFE7DA] bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-4 py-2.5 text-[11px] font-semibold text-[#6C6255] sm:justify-center sm:text-xs">
          <span className="shrink-0">✦ Curated shopping</span>
          <span className="text-[#D0B48A]" aria-hidden="true">•</span>
          <span className="shrink-0">📦 Order updates</span>
          <span className="text-[#D0B48A]" aria-hidden="true">•</span>
          <span className="shrink-0">🛡️ Buyer support</span>
        </div>
      </section>

      {/* LUXURY HERO */}
      <section className="mx-auto max-w-7xl px-4 pb-5 pt-5 sm:px-6 sm:pt-7 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-[30px] bg-[linear-gradient(120deg,#1A2932_0%,#304D4C_53%,#695138_100%)] px-6 pb-8 pt-10 text-white shadow-[0_18px_42px_rgba(23,25,29,0.14)] sm:px-10 sm:py-14 lg:px-16 lg:py-20">
          <div className="pointer-events-none absolute -right-20 -top-32 h-[340px] w-[340px] rounded-full border border-[#C5A46D]/25 sm:right-0" />
          <div className="pointer-events-none absolute -right-10 -top-20 h-[230px] w-[230px] rounded-full border border-[#C5A46D]/30" />
          <div className="pointer-events-none absolute bottom-[-110px] right-[-85px] h-[290px] w-[290px] rounded-full bg-[#C5A46D]/15 blur-3xl" />
          <div className="pointer-events-none absolute right-8 top-24 hidden text-[125px] font-black leading-none text-[#C5A46D]/15 lg:block" aria-hidden="true">GM</div>
          <div className="relative z-10 max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#E9D9BB] sm:text-xs">THE GOLDMART EXPERIENCE</p>
            <h1 className="mt-3 max-w-xl text-[34px] font-black leading-[1.08] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              Discover more.<br /><span className="text-[#F1D2A1]">Love every find.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#DED8CE] sm:text-base">
              Find products you'll love, browse by department, and keep your orders, messages and account together in one easy place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/shop" className="inline-flex items-center justify-center rounded-full bg-[#C5A46D] px-6 py-3 text-sm font-extrabold text-[#17191D] transition hover:bg-[#E9D9BB]">Explore the Shop →</Link>
              <Link href="/categories" className="inline-flex items-center justify-center rounded-full border border-[#8D816D] px-6 py-3 text-sm font-bold text-white transition hover:border-[#E9D9BB]">Browse Categories</Link>
              <Link href="/orders" className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20">My Orders ↗</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY RAIL */}
      <section className="mx-auto max-w-7xl px-4 pb-5 sm:px-6 lg:px-8">
        <div className="rounded-[24px] border border-[#EAE3D9] bg-white px-4 pb-5 pt-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#96713D]">Find your style</p>
              <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Explore your interests</h2>
            </div>
            <Link href="/categories" className="shrink-0 text-xs font-bold text-[#96713D] hover:underline sm:text-sm">View All →</Link>
          </div>
          <div className="og-scrollbar mt-5 grid grid-cols-4 gap-3 sm:grid-cols-8 sm:gap-4">
            {categories.map((category) => (
              <Link key={category.name} href={`/shop?category=${encodeURIComponent(category.value)}`} className="group flex min-w-0 flex-col items-center gap-2 text-center">
                <span className="flex h-[64px] w-full max-w-20 items-center justify-center rounded-[20px] border border-[#EAE3D9] bg-[linear-gradient(135deg,#E9EFF1,#F4E8DB)] text-[29px] transition group-hover:-translate-y-0.5 group-hover:border-[#C5A46D] group-hover:bg-[#F3E8D5] sm:h-20">{category.icon}</span>
                <span className="text-[11px] font-bold text-[#47433E] sm:text-xs">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* EDITORIAL DISCOVERY CARDS */}
      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 pb-6 sm:gap-5 sm:px-6 lg:px-8">
        <Link href="/shop?sort=new" className="group relative flex min-h-[156px] flex-col justify-between overflow-hidden rounded-[23px] border border-[#E7D8C0] bg-[linear-gradient(135deg,#FAE7DC,#F6F0E4)] p-4 transition hover:-translate-y-0.5 hover:shadow-lg sm:min-h-[195px] sm:p-6">
          <span className="pointer-events-none absolute -right-8 -top-9 h-32 w-32 rounded-full border-[20px] border-white/40" />
          <span className="relative text-2xl" aria-hidden="true">✦</span>
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#916C38]">Just discovered</p>
            <h3 className="mt-1 text-lg font-black tracking-tight sm:text-2xl">New Arrivals</h3>
            <span className="mt-2 inline-block text-xs font-bold text-[#75552F]">Explore products →</span>
          </div>
        </Link>
        <Link href="/shop" className="group relative flex min-h-[156px] flex-col justify-between overflow-hidden rounded-[23px] bg-[linear-gradient(135deg,#354C5E,#232C35)] p-4 text-white transition hover:-translate-y-0.5 hover:shadow-lg sm:min-h-[195px] sm:p-6">
          <span className="pointer-events-none absolute -right-6 -top-11 h-36 w-36 rounded-full border-[20px] border-[#C5A46D]/15" />
          <span className="relative text-2xl" aria-hidden="true">◈</span>
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#D6B780]">Discover GoldMart</p>
            <h3 className="mt-1 text-lg font-black tracking-tight sm:text-2xl">Shop All</h3>
            <span className="mt-2 inline-block text-xs font-bold text-[#E3CA9F]">Browse collection →</span>
          </div>
        </Link>
      </section>

      {/* Curated category tiles link to existing filters; no fabricated offers */}
      <section aria-label="Featured departments" className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#997547]">Curated for you</p><h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Discover your next favorite</h2></div>
          <Link href="/categories" className="text-xs font-bold text-[#7E6139] hover:underline">All categories ↗</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {name:"Fashion finds",category:"Fashion",icon:"✿",tone:"bg-[linear-gradient(135deg,#F7E1E2,#FFF7F3)] text-[#653E46]"},
            {name:"Tech essentials",category:"Electronics",icon:"◈",tone:"bg-[linear-gradient(135deg,#DCECF0,#F2F9FC)] text-[#31525F]"},
            {name:"Home favorites",category:"Home & Kitchen",icon:"⌂",tone:"bg-[linear-gradient(135deg,#E8F0DE,#FAF9EC)] text-[#4E6340]"},
            {name:"Beauty edits",category:"Beauty & Cosmetics",icon:"✦",tone:"bg-[linear-gradient(135deg,#F3E1F4,#FBF6FF)] text-[#765080]"},
          ].map((item) => (
            <Link key={item.category} href={`/shop?category=${encodeURIComponent(item.category)}`}
              className={`group relative flex min-h-[145px] flex-col justify-between overflow-hidden rounded-[22px] border border-white/70 p-4 shadow-[0_7px_20px_rgba(23,25,29,0.035)] transition hover:-translate-y-1 hover:shadow-md sm:p-5 ${item.tone}`}>
              <span className="pointer-events-none absolute -right-4 -top-12 text-[110px] opacity-15" aria-hidden="true">{item.icon}</span>
              <span className="relative text-xs font-bold uppercase tracking-wider">GoldMart picks</span>
              <span className="relative"><span className="block text-lg font-black sm:text-xl">{item.name}</span><span className="mt-1 block text-xs font-bold">Explore category ↗</span></span>
            </Link>
          ))}
        </div>
      </section>

      {/* PRODUCT DISCOVERY */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.19em] text-[#96713D]">The marketplace</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Trending across GoldMart</h2>
          </div>
          <Link href="/shop" className="shrink-0 text-xs font-bold text-[#96713D] hover:underline sm:text-sm">Shop All →</Link>
        </div>
        <div role="tablist" aria-label="Explore products" className="og-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
          {discoveryTabs.map((tab) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition sm:text-sm ${activeTab === tab ? "border-[#17191D] bg-[#17191D] text-white" : "border-[#E6DCCD] bg-white text-[#5D564D] hover:border-[#C5A46D]"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4" aria-label="Loading products">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="animate-pulse overflow-hidden rounded-[20px] border border-[#EAE3D9] bg-white">
                <div className="aspect-square bg-[#EEE9DF]" />
                <div className="space-y-3 p-4">
                  <div className="h-3 w-4/5 rounded-full bg-[#EEE9DF]" />
                  <div className="h-4 w-1/2 rounded-full bg-[#EEE9DF]" />
                  <div className="h-9 rounded-full bg-[#EEE9DF]" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="rounded-[22px] border border-[#EAE3D9] bg-white px-5 py-12 text-center">
            <span className="text-4xl" aria-hidden="true">🛍️</span>
            <h3 className="mt-3 text-lg font-black">{productsError ? "Products unavailable right now" : "No products found"}</h3>
            <p className="mt-2 text-sm text-[#746F67]">{productsError ? "Please try again in a moment." : "Browse the shop or choose another filter."}</p>
            <Link href="/shop" className="mt-5 inline-flex rounded-full bg-[#17191D] px-6 py-3 text-sm font-bold text-white hover:bg-[#96713D]">Visit Shop →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {displayedProducts.slice(0, 12).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!loadingProducts && displayedProducts.length > 12 && (
          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#96713D]">Keep exploring</p>
                <h2 className="mt-1 text-xl font-black sm:text-2xl">More to Discover</h2>
              </div>
              <Link href="/shop" className="text-xs font-bold text-[#96713D] hover:underline">View All →</Link>
            </div>
            <div className="og-scrollbar flex gap-3 overflow-x-auto pb-3">
              {displayedProducts.slice(12, 20).map((product) => (
                <ProductCard key={product.id} product={product} compact />
              ))}
            </div>
          </section>
        )}
      </section>

      {/* CUSTOMER ASSISTANCE */}
      <section className="mx-auto max-w-7xl px-4 pb-7 sm:px-6 lg:px-8">
        <div className="rounded-[25px] border border-[#E7D9C4] bg-[#F1E7D6] p-5 sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#96713D]">Shopping with confidence</p>
          <h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">Here when you need us.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#676056]">Explore order updates, submit a buyer-protection request or find answers in the Help Centre.</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Link href="/track-order" className="rounded-2xl border border-[#E8DACA] bg-white p-4 transition hover:border-[#C5A46D]">
              <span className="text-2xl">📦</span><p className="mt-2 text-sm font-black">Track an Order</p><p className="mt-1 text-xs text-[#746F67]">See your order status</p>
            </Link>
            <Link href="/order-protection" className="rounded-2xl border border-[#E8DACA] bg-white p-4 transition hover:border-[#C5A46D]">
              <span className="text-2xl">🛡️</span><p className="mt-2 text-sm font-black">Buyer Protection</p><p className="mt-1 text-xs text-[#746F67]">Get help with a purchase</p>
            </Link>
            <Link href="/help" className="col-span-2 rounded-2xl border border-[#E8DACA] bg-white p-4 transition hover:border-[#C5A46D] sm:col-span-1">
              <span className="text-2xl">💬</span><p className="mt-2 text-sm font-black">Help Centre</p><p className="mt-1 text-xs text-[#746F67]">Helpful answers and guides</p>
            </Link>
          </div>
        </div>
      </section>

      {/* SELLER CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[25px] bg-[#17191D] p-6 text-white sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-[#C5A46D]/25" />
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D6B780]">Sell with GoldMart</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Have products to sell?</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#D8D4CA]">Manage your products and reach customers from your seller dashboard.</p>
            <Link href="/seller" className="mt-5 inline-flex rounded-full bg-[#C5A46D] px-6 py-3 text-sm font-extrabold text-[#17191D] transition hover:bg-[#E9D9BB]">Explore Selling →</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#EAE2D7] bg-white px-5 pb-10 pt-9 text-center md:pb-12">
        <Link href="/" className="text-2xl font-black tracking-[-0.05em]">Gold<span className="text-[#B08A50]">Mart</span></Link>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#746F67]">Discover products, manage orders and connect with sellers in one place.</p>
        <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 text-xs font-semibold text-[#625B50]">
          <Link href="/shop" className="hover:text-[#96713D]">Shop</Link>
          <Link href="/categories" className="hover:text-[#96713D]">Categories</Link>
          <Link href="/orders" className="hover:text-[#96713D]">My Orders</Link>
          <Link href="/account" className="hover:text-[#96713D]">My Account</Link>
          <Link href="/seller" className="hover:text-[#96713D]">Sell on GoldMart</Link>
          <Link href="/help" className="hover:text-[#96713D]">Help Centre</Link>
          <Link href="/track-order" className="hover:text-[#96713D]">Track Order</Link>
          <Link href="/order-protection" className="hover:text-[#96713D]">Buyer Protection</Link>
        </div>
        <p className="mt-6 border-t border-[#F0ECE5] pt-5 text-[11px] text-[#8A847A]">© {new Date().getFullYear()} GoldMart. All rights reserved.</p>
      </footer>


    </main>
  );
}
