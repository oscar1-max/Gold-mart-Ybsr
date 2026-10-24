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
  original_price?: string|number;
  is_deal?: boolean;
  deal_end_at?: string;
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

const discoveryTabs = ["All", "⚡ Deals", "5-Star Rated", "Best Selling", "New Arrivals"];

const quickLinks = [
  { href: "/shop", icon: "🛍️", label: "Shop All", sub: "Browse every department", tone: "from-[#FFF8F2] to-[#FFFFFF] text-[#243B53]", border: "border-[#FFF8F2]" },
  { href: "/track-order", icon: "📦", label: "Track Order", sub: "Follow your purchases", tone: "from-[#FFF8F2] to-[#FFFFFF] text-[#243B53]", border: "border-[#FFF8F2]" },
  { href: "/order-protection", icon: "🛡️", label: "Buyer Protection", sub: "Get help with an order", tone: "from-[#FFF8F2] to-[#FFFFFF] text-[#FF6B00]", border: "border-[#FFF8F2]" },
  { href: "/help", icon: "🎧", label: "Help Centre", sub: "Answers and support", tone: "from-[#FFF8F2] to-[#FFF8F2] text-[#FF6B00]", border: "border-[#FFE9CC]" },
  { href: "/chat", icon: "💬", label: "Messages", sub: "Connect with sellers", tone: "from-[#FFF8F2] to-[#FFFFFF] text-[#FF6B00]", border: "border-[#FFF8F2]" },
];

const cardClass =
  "group overflow-hidden rounded-[20px] border border-[#FFF8F2] bg-white shadow-[0_5px_22px_rgba(23,25,29,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FFE9CC] hover:shadow-[0_12px_28px_rgba(23,25,29,0.09)]";

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
        <div className="relative aspect-square overflow-hidden bg-[#FFF8F2]">
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
            <span className="absolute left-2 top-2 rounded-full bg-[#14263D]/90 px-2.5 py-1 text-[10px] font-bold text-white">
              Sold out
            </span>
          )}
        </div>
      </Link>

      <div className="p-3 sm:p-4">
        {product.category_name && (
          <p className="mb-1 truncate text-[10px] font-bold uppercase tracking-[0.1em] text-[#FF6B00]">
            {product.category_name}
          </p>
        )}
        <Link href={`/product/${product.id}`}>
          <h3 className="line-clamp-2 min-h-[38px] text-[13px] font-semibold leading-[19px] text-[#14263D] sm:text-sm">
            {product.name}
          </h3>
        </Link>
        <p className="mt-2 break-words text-[15px] font-black tracking-tight text-[#14263D] sm:text-lg">
          {formatPrice(product.price, product.currency)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#FF6B00]">
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

    if (activeTab === "⚡ Deals") {
      result = result.filter(product => product.is_deal === true);
    } else if (activeTab === "5-Star Rated") {
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
    <main className="gm-marketplace-home min-h-screen overflow-x-hidden bg-[#FFFFFF] pb-24 text-[#14263D] md:pb-0">
      {/* TOP BAR + MOBILE SEARCH */}
      <header className="gm-shop-header sticky top-0 z-50 border-b border-[#FFF8F2] bg-white/95 shadow-[0_3px_16px_rgba(23,25,29,0.035)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="shrink-0 text-[23px] font-black tracking-[-0.055em]" aria-label="GoldMart home">
            Gold<span className="text-[#FF6B00]">Mart</span><span className="ml-1 align-top text-[10px] text-[#FF6B00]">✦</span>
          </Link>
          <nav aria-label="Desktop navigation" className="hidden items-center gap-6 text-sm font-semibold text-[#243B53] md:flex">
            <Link href="/shop" className="hover:text-[#FF6B00]">Shop</Link>
            <Link href="/track-order" className="hover:text-[#FF6B00]">Track Order</Link>
            <Link href="/help" className="hover:text-[#FF6B00]">Help</Link>
          </nav>
          <div className="flex items-center gap-2">
            {user && (
              <Link href="/notifications" aria-label="Notifications" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#FFF8F2] bg-[#FFFFFF] text-lg transition hover:border-[#FF6B00]">🔔</Link>
            )}
            <Link href={user ? "/account" : "/login"} aria-label="Account" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#FFF8F2] bg-[#FFFFFF] text-lg transition hover:border-[#FF6B00]">👤</Link>
            <Link href="/cart" aria-label="Cart" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#FFF8F2] bg-[#FFFFFF] text-lg transition hover:border-[#FF6B00]">🛒</Link>
          </div>
        </div>

      </header>


      {/* Picture 10: living-room editorial shop hero; existing search and product logic preserved. */}
      <div className="gm-stuffuss-shell">
        <section className="gm-stuffuss-hero" aria-label="GoldMart store inspiration">
          <p>THE GOLDMART SHOWROOM</p>
          <h1>Shop</h1>
          <p>GIVE ALL YOU NEED</p>
        </section>
        <section className="gm-stuffuss-overlay" aria-label="Quick product search">
          <div><h2>Give All You Need</h2><p>Find something special from GoldMart sellers.</p></div>
          <form role="search" onSubmit={(event) => {event.preventDefault();handleSearch();}}>
            <input type="search" aria-label="Search the marketplace" placeholder="Search on GoldMart" value={search} onChange={(event)=>setSearch(event.target.value)}/>
            <Link href="/visual-search" aria-label="Visual search" className="gm-stuffuss-camera" title="Search using a photo">📷</Link><button type="submit">Search</button>
          </form>
        </section>
        <section className="gm-stuffuss-market">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="gm-stuffuss-market-grid">
              <aside className="gm-stuffuss-sidebar">
                <h3>Category</h3>
                <nav aria-label="Explore departments">
                  {categories.map(item=><Link key={item.value} href={`/shop?category=${encodeURIComponent(item.value)}`}><span aria-hidden="true">{item.icon}</span>{item.name}</Link>)}
                </nav>
              </aside>
              <div className="gm-stuffuss-market-content">
                {/* PRODUCT DISCOVERY */}
                      <section className="gm-home-products pb-8">
                        <div className="mb-4 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.19em] text-[#FF6B00]">The marketplace</p>
                            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Discover what’s worth exploring</h2>
                          </div>
                          <Link href="/shop" className="shrink-0 text-xs font-bold text-[#FF6B00] hover:underline sm:text-sm">Shop All →</Link>
                        </div>
                        <div role="tablist" aria-label="Explore products" className="og-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
                          {discoveryTabs.map((tab) => (
                            <button
                              type="button"
                              role="tab"
                              aria-selected={activeTab === tab}
                              key={tab}
                              onClick={() => setActiveTab(tab)}
                              className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition sm:text-sm ${activeTab === tab ? "border-[#14263D] bg-[#14263D] text-white" : "border-[#FFF8F2] bg-white text-[#243B53] hover:border-[#FF6B00]"}`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>
                
                        {loadingProducts ? (
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4" aria-label="Loading products">
                            {[1, 2, 3, 4].map((item) => (
                              <div key={item} className="animate-pulse overflow-hidden rounded-[20px] border border-[#FFF8F2] bg-white">
                                <div className="aspect-square bg-[#FFF8F2]" />
                                <div className="space-y-3 p-4">
                                  <div className="h-3 w-4/5 rounded-full bg-[#FFF8F2]" />
                                  <div className="h-4 w-1/2 rounded-full bg-[#FFF8F2]" />
                                  <div className="h-9 rounded-full bg-[#FFF8F2]" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : displayedProducts.length === 0 ? (
                          <div className="rounded-[22px] border border-[#FFF8F2] bg-white px-5 py-12 text-center">
                            <span className="text-4xl" aria-hidden="true">🛍️</span>
                            <h3 className="mt-3 text-lg font-black">{productsError ? "Products unavailable right now" : "No products found"}</h3>
                            <p className="mt-2 text-sm text-[#FF6B00]">{productsError ? "Please try again in a moment." : "Browse the shop or choose another filter."}</p>
                            <Link href="/shop" className="mt-5 inline-flex rounded-full bg-[#14263D] px-6 py-3 text-sm font-bold text-white hover:bg-[#FF6B00]">Visit Shop →</Link>
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
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF6B00]">Keep exploring</p>
                                <h2 className="mt-1 text-xl font-black sm:text-2xl">More to Discover</h2>
                              </div>
                              <Link href="/shop" className="text-xs font-bold text-[#FF6B00] hover:underline">View All →</Link>
                            </div>
                            <div className="og-scrollbar flex gap-3 overflow-x-auto pb-3">
                              {displayedProducts.slice(12, 20).map((product) => (
                                <ProductCard key={product.id} product={product} compact />
                              ))}
                            </div>
                          </section>
                        )}
                      </section>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* CUSTOMER ASSISTANCE */}
      <section className="mx-auto max-w-7xl px-4 pb-7 sm:px-6 lg:px-8">
        <div className="rounded-[25px] border border-[#FFF8F2] bg-[#FFF8F2] p-5 sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF6B00]">Shopping with confidence</p>
          <h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">Here when you need us.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#243B53]">Explore order updates, submit a buyer-protection request or find answers in the Help Centre.</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Link href="/track-order" className="rounded-2xl border border-[#FFF8F2] bg-white p-4 transition hover:border-[#FF6B00]">
              <span className="text-2xl">📦</span><p className="mt-2 text-sm font-black">Track an Order</p><p className="mt-1 text-xs text-[#FF6B00]">See your order status</p>
            </Link>
            <Link href="/order-protection" className="rounded-2xl border border-[#FFF8F2] bg-white p-4 transition hover:border-[#FF6B00]">
              <span className="text-2xl">🛡️</span><p className="mt-2 text-sm font-black">Buyer Protection</p><p className="mt-1 text-xs text-[#FF6B00]">Get help with a purchase</p>
            </Link>
            <Link href="/help" className="col-span-2 rounded-2xl border border-[#FFF8F2] bg-white p-4 transition hover:border-[#FF6B00] sm:col-span-1">
              <span className="text-2xl">💬</span><p className="mt-2 text-sm font-black">Help Centre</p><p className="mt-1 text-xs text-[#FF6B00]">Helpful answers and guides</p>
            </Link>
          </div>
        </div>
      </section>

      {/* SELLER CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[25px] bg-[#14263D] p-6 text-white sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-[#FF6B00]/25" />
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFE9CC]">Sell with GoldMart</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Have products to sell?</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#FFF8F2]">Manage your products and reach customers from your seller dashboard.</p>
            <Link href="/seller" className="mt-5 inline-flex rounded-full bg-[#FF6B00] px-6 py-3 text-sm font-extrabold text-[#14263D] transition hover:bg-[#FFF8F2]">Explore Selling →</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#FFF8F2] bg-white px-5 pb-10 pt-9 text-center md:pb-12">
        <Link href="/" className="text-2xl font-black tracking-[-0.05em]">Gold<span className="text-[#FF6B00]">Mart</span></Link>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#FF6B00]">Discover products, manage orders and connect with sellers in one place.</p>
        <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 text-xs font-semibold text-[#243B53]">
          <Link href="/shop" className="hover:text-[#FF6B00]">Shop</Link>
          <Link href="/categories" className="hover:text-[#FF6B00]">Categories</Link>
          <Link href="/orders" className="hover:text-[#FF6B00]">My Orders</Link>
          <Link href="/account" className="hover:text-[#FF6B00]">My Account</Link>
          <Link href="/seller" className="hover:text-[#FF6B00]">Sell on GoldMart</Link>
          <Link href="/help" className="hover:text-[#FF6B00]">Help Centre</Link>
          <Link href="/track-order" className="hover:text-[#FF6B00]">Track Order</Link>
          <Link href="/order-protection" className="hover:text-[#FF6B00]">Buyer Protection</Link>
        </div>
        <p className="mt-6 border-t border-[#FFF8F2] pt-5 text-[11px] text-[#FF6B00]">© {new Date().getFullYear()} GoldMart. All rights reserved.</p>
      </footer>


    </main>
  );
}
