"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";
const LOW_STOCK_LIMIT = 5;

type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: string | number;
  currency?: string | null;
  image_url?: string | null;
  category_name?: string | null;
  stock: number;
  is_active?: boolean;
};

type StockFilter = "all" | "in-stock" | "low-stock" | "out-of-stock";
type SortOption = "name-asc" | "name-desc" | "stock-asc" | "stock-desc";

function getStock(product: Product): number {
  const value = Number(product.stock);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function stockStatus(product: Product): StockFilter {
  const quantity = getStock(product);
  if (quantity === 0) return "out-of-stock";
  if (quantity <= LOW_STOCK_LIMIT) return "low-stock";
  return "in-stock";
}

function formatPrice(price: string | number, currency?: string | null) {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return "Price unavailable";

  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const code = (currency || "NGN").toUpperCase();
  const symbols: Record<string, string> = {
    USD: "$",
    NGN: "₦",
    EUR: "€",
    GBP: "£",
  };
  return symbols[code] ? `${symbols[code]}${formatted}` : `${code} ${formatted}`;
}

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [listingFilter, setListingFilter] = useState<"active" | "removed">("active");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const requestController = useRef<AbortController | null>(null);

  const loadProducts = useCallback(async () => {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("goldmart_token");
      if (!token) {
        throw new Error("Please sign in to access your seller products.");
      }

      const response = await fetch(`${API_URL}/api/seller/products`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: controller.signal,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load seller products.");
      }
      if (!controller.signal.aborted) {
        setProducts(Array.isArray(data.products) ? data.products : []);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : "Unable to load products.");
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
    return () => requestController.current?.abort();
  }, [loadProducts]);

  const activeProducts = useMemo(() => products.filter(p => p.is_active !== false), [products]);
  const removedProducts = useMemo(() => products.filter(p => p.is_active === false), [products]);
  const listedProducts = listingFilter === "active" ? activeProducts : removedProducts;

  async function setListing(product: Product, restore: boolean) {
    if (busyId !== null) return;
    if (!restore && !window.confirm(`Remove ${product.name} from the public GoldMart shop? Past orders will remain saved.`)) return;
    setBusyId(product.id);
    setActionError("");
    try {
      const token = localStorage.getItem("goldmart_token");
      if (!token) throw new Error("Sign in to manage products.");
      const response = await fetch(`${API_URL}/api/seller/products/${product.id}${restore ? "/restore" : ""}`, {method: restore ? "PATCH" : "DELETE",headers:{Authorization:`Bearer ${token}`,Accept:"application/json"}});
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to update listing.");
      setProducts(previous => previous.map(p => p.id === product.id ? {...p,is_active:restore} : p));
    } catch (err) {setActionError(err instanceof Error ? err.message : "Unable to update listing.");}
    finally {setBusyId(null);}
  }

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          listedProducts
            .map((product) => product.category_name?.trim())
            .filter((name): name is string => Boolean(name))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [listedProducts]
  );

  const summary = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    for (const product of activeProducts) {
      const status = stockStatus(product);
      if (status === "in-stock") inStock++;
      if (status === "low-stock") lowStock++;
      if (status === "out-of-stock") outOfStock++;
    }
    return { inStock, lowStock, outOfStock };
  }, [activeProducts]);

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = listedProducts.filter((product) => {
      const matchesSearch =
        !term ||
        [product.name, product.description, product.category_name]
          .some((value) => (value || "").toLowerCase().includes(term));
      const matchesCategory =
        categoryFilter === "all" || product.category_name === categoryFilter;
      const matchesStock =
        stockFilter === "all" || stockStatus(product) === stockFilter;
      return matchesSearch && matchesCategory && matchesStock;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "stock-asc") return getStock(a) - getStock(b);
      if (sortBy === "stock-desc") return getStock(b) - getStock(a);
      const comparison = a.name.localeCompare(b.name);
      return sortBy === "name-desc" ? -comparison : comparison;
    });
  }, [listedProducts, search, categoryFilter, stockFilter, sortBy]);

  const filterOptions: { value: StockFilter; title: string; count: number }[] = [
    { value: "all", title: "All products", count: listedProducts.length },
    { value: "in-stock", title: "In stock", count: summary.inStock },
    { value: "low-stock", title: "Low stock", count: summary.lowStock },
    { value: "out-of-stock", title: "Out of stock", count: summary.outOfStock },
  ];

  function resetFilters() {
    setSearch("");
    setCategoryFilter("all");
    setStockFilter("all");
    setSortBy("name-asc");
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] pb-28 text-[#1A3C32]">
      <div className="h-1 bg-gradient-to-r from-[#1A3C32] via-[#F7F7F5] to-[#D4AF37]" />

      <header className="border-b border-[#F7F7F5] bg-white/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-2xl font-black tracking-tight" aria-label="GoldMart Home">
            Gold<span className="text-[#D4AF37]">Mart</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/seller" className="rounded-full border border-[#F7F7F5] px-4 py-2.5 text-xs font-bold hover:border-[#D4AF37] sm:text-sm">
              ← Dashboard
            </Link>
            <Link href="/shop" className="rounded-full bg-[#0A1F1A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1A3C32] sm:text-sm">
              Buyer Store
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#0A1F1A_0%,#1A3C32_50%,#D4AF37_100%)] px-5 py-8 text-white shadow-[0_16px_45px_rgba(23,25,29,0.12)] sm:px-9 sm:py-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-60 w-60 rounded-full border border-[#D4AF37]/25" />
          <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F7F7F5]">GoldMart • Seller Centre</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">My Products</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#F7F7F5]">Manage your listings, find products quickly, and stay ahead of low inventory.</p>
            </div>
            <Link href="/seller/products/new" className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-extrabold text-[#0A1F1A] transition hover:bg-[#F7F7F5]">
              + Add Product
            </Link>
          </div>
        </section>

        {error && (
          <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
            <p className="font-black">Could not load your products</p>
            <p className="mt-1 text-sm">{error}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => void loadProducts()} className="rounded-full bg-[#0A1F1A] px-5 py-2.5 text-sm font-bold text-white">Try Again</button>
              <Link href="/login" className="rounded-full border border-red-300 px-5 py-2.5 text-sm font-bold">Sign In</Link>
            </div>
          </div>
        )}

        <section className="mt-9" aria-label="Inventory summary">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1A3C32]">Your inventory</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Stock Overview</h2>
            </div>
            <button type="button" disabled={loading} onClick={() => void loadProducts()} className="rounded-full border border-[#F5E6A3] bg-white px-5 py-2.5 text-sm font-bold text-[#0A1F1A] hover:bg-[#F7F7F5] disabled:opacity-50">
              {loading ? "Loading..." : "↻ Refresh Products"}
            </button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {filterOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setStockFilter(item.value)}
                disabled={loading || Boolean(error)}
                aria-pressed={stockFilter === item.value}
                className={`rounded-[22px] border p-4 text-left shadow-sm transition sm:p-5 ${stockFilter === item.value ? "border-[#D4AF37] bg-[#F7F7F5]" : "border-[#F7F7F5] bg-white hover:border-[#D4AF37]"} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <p className="text-xs font-bold text-[#D4AF37] sm:text-sm">{item.title}</p>
                <p className="mt-2 text-2xl font-black sm:text-3xl">{loading || error ? "—" : item.count}</p>
                <p className="mt-1 text-xs text-[#1A3C32]">{stockFilter === item.value ? "Selected" : "View products →"}</p>
              </button>
            ))}
          </div>
          {!loading && !error && summary.lowStock + summary.outOfStock > 0 && (
            <p role="status" className="mt-4 rounded-2xl border border-[#F5E6A3] bg-[#F7F7F5] px-4 py-3 text-sm text-[#D4AF37]">
              Inventory reminder: {summary.lowStock} low-stock and {summary.outOfStock} out-of-stock listing(s). Low stock means 1–{LOW_STOCK_LIMIT} units remaining.
            </p>
          )}
        </section>

        {!error && (
          <section className="mt-9 rounded-[24px] border border-[#F7F7F5] bg-white p-4 shadow-sm sm:p-6" aria-label="Product search and filters">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_200px]">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Search products</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, category, description..."
                  className="w-full rounded-xl border border-[#F7F7F5] bg-[#FFFFFF] px-4 py-3 text-sm outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Category</span>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="w-full rounded-xl border border-[#F7F7F5] bg-[#FFFFFF] px-4 py-3 text-sm outline-none focus:border-[#D4AF37]">
                  <option value="all">All categories</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Sort products</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} className="w-full rounded-xl border border-[#F7F7F5] bg-[#FFFFFF] px-4 py-3 text-sm outline-none focus:border-[#D4AF37]">
                  <option value="name-asc">Name: A–Z</option>
                  <option value="name-desc">Name: Z–A</option>
                  <option value="stock-asc">Stock: Low to High</option>
                  <option value="stock-desc">Stock: High to Low</option>
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#F7F7F5] pt-4">
              <p className="text-sm text-[#D4AF37]" aria-live="polite">
                {loading ? "Loading products..." : error ? "Products unavailable" : `Showing ${visibleProducts.length} of ${listedProducts.length} products`}
              </p>
              <button type="button" onClick={resetFilters} className="text-sm font-bold text-[#1A3C32] hover:underline">Clear Filters</button>
            </div>
          </section>
        )}

        {!loading && !error && <div className="mt-6 flex flex-wrap items-center gap-3 rounded-[22px] border border-[#F7F7F5] bg-white p-3"><button type="button" onClick={() => {setListingFilter("active");resetFilters();}} className={`rounded-xl px-5 py-3 text-sm font-black ${listingFilter==="active"?"bg-[#1A3C32] text-white":"bg-[#F7F7F5] text-[#1A3C32]"}`}>Live products ({activeProducts.length})</button><button type="button" onClick={() => {setListingFilter("removed");resetFilters();}} className={`rounded-xl px-5 py-3 text-sm font-black ${listingFilter==="removed"?"bg-[#1A3C32] text-white":"bg-[#F7F7F5] text-[#1A3C32]"}`}>Removed ({removedProducts.length})</button></div>}
        {actionError && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">{actionError}</p>}

        {loading && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading products">
            {[1, 2, 3].map((number) => (
              <div key={number} className="animate-pulse overflow-hidden rounded-[22px] border border-[#F7F7F5] bg-white">
                <div className="h-52 bg-[#F7F7F5]" />
                <div className="space-y-3 p-5"><div className="h-4 w-3/4 rounded bg-[#F7F7F5]" /><div className="h-4 w-1/2 rounded bg-[#F7F7F5]" /></div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && listedProducts.length === 0 && (
          <section className="mt-6 rounded-[24px] border border-[#F7F7F5] bg-white px-5 py-12 text-center">
            <p className="text-5xl">📦</p>
            <h2 className="mt-4 text-xl font-black">Your store is ready for its first product</h2>
            <p className="mt-2 text-sm text-[#D4AF37]">Add a product to start building your GoldMart catalogue.</p>
            <Link href="/seller/products/new" className="mt-6 inline-flex rounded-full bg-[#0A1F1A] px-6 py-3 text-sm font-bold text-white hover:bg-[#1A3C32]">Add Product →</Link>
          </section>
        )}

        {!loading && !error && listedProducts.length > 0 && visibleProducts.length === 0 && (
          <section className="mt-6 rounded-[24px] border border-[#F7F7F5] bg-white px-5 py-12 text-center">
            <h2 className="text-xl font-black">No matching products</h2>
            <p className="mt-2 text-sm text-[#D4AF37]">Try another search or clear your filters.</p>
            <button type="button" onClick={resetFilters} className="mt-5 rounded-full bg-[#0A1F1A] px-6 py-3 text-sm font-bold text-white">Show All Products</button>
          </section>
        )}

        {!loading && !error && visibleProducts.length > 0 && (
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Seller product listings">
            {visibleProducts.map((product) => {
              const status = stockStatus(product);
              const badgeStyle = status === "out-of-stock"
                ? "bg-red-50 text-red-700 border-red-200"
                : status === "low-stock"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200";
              const badgeText = status === "out-of-stock"
                ? "Out of stock"
                : status === "low-stock"
                  ? "Low stock"
                  : "In stock";

              return (
                <article key={product.id} className="overflow-hidden rounded-[22px] border border-[#F7F7F5] bg-white shadow-sm transition hover:border-[#D4AF37] hover:shadow-md">
                  <div className="relative h-56 bg-[#F7F7F5]">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image_url} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl" aria-label="No product image">📦</div>
                    )}
                    <span className={`absolute right-3 top-3 rounded-full border px-3 py-1 text-xs font-bold shadow-sm ${badgeStyle}`}>{badgeText}</span>
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#1A3C32]">{product.category_name || "Uncategorized"}</p>
                    <h2 className="mt-2 line-clamp-2 text-lg font-black">{product.name}</h2>
                    {product.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#D4AF37]">{product.description}</p>}
                    <div className="mt-5 flex items-end justify-between gap-3 border-t border-[#F7F7F5] pt-4">
                      <div>
                        <p className="text-xs text-[#D4AF37]">Listed price</p>
                        <p className="mt-1 text-xl font-black text-[#1A3C32]">{formatPrice(product.price, product.currency)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#D4AF37]">Units in stock</p>
                        <p className="mt-1 text-xl font-black">{getStock(product)}</p>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button type="button" disabled={busyId !== null} onClick={() => void setListing(product, product.is_active === false)} className={`rounded-full px-4 py-3 text-sm font-bold disabled:opacity-50 ${product.is_active === false ? "bg-[#F7F7F5] text-[#1A3C32]" : "bg-[#F7F7F5] text-[#9A503F]"}`}>{busyId===product.id ? "Saving..." : product.is_active===false ? "Restore listing" : "Remove from store"}</button>
                      <Link href={`/seller/products/${product.id}/edit`} className="flex-1 rounded-full border border-[#F5E6A3] px-4 py-3 text-center text-sm font-bold hover:bg-[#FFFFFF]">Edit Product</Link>
                      <Link href="/shop" className="flex-1 rounded-full bg-[#0A1F1A] px-4 py-3 text-center text-sm font-bold text-white hover:bg-[#1A3C32]">View Store</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
        <p className="mt-8 text-center text-xs text-[#D4AF37]">GoldMart Seller Centre · Products and stock are loaded from your seller account</p>
      </div>
    </main>
  );
}
