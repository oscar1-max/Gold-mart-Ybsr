"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

type Product = {
  id: number;
  name: string;
  price: string | number;
  currency?: string | null;
  stock: number;
  image_url?: string | null;
};

type SellerStats = {
  products: number;
  orders: number;
  sales: string | number;
};

type SellerReview = {
  id: number;
  rating: number;
  review?: string | null;
  created_at: string;
  buyer_name?: string | null;
};

type SellerRating = {
  review_count: number;
  average_rating: number;
};

function formatPrice(price: string | number, currency?: string | null) {
  const amount = Number(price);
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = safe.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  switch (currency?.toUpperCase()) {
    case "EUR": return `€${formatted}`;
    case "GBP": return `£${formatted}`;
    case "NGN": return `₦${formatted}`;
    default: return `$${formatted}`;
  }
}

function reviewDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

const shortcuts = [
  {
    title: "My Products",
    description: "Manage your inventory and listings",
    icon: "📦",
    href: "/seller/products",
  },
  {
    title: "Add Product",
    description: "Create your next product listing",
    icon: "✦",
    href: "/seller/products/new",
  },
  {
    title: "Customer Orders",
    description: "Review and fulfil new orders",
    icon: "🚚",
    href: "/seller/orders",
  },
];

export default function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<SellerStats>({
    products: 0,
    orders: 0,
    sales: 0,
  });
  const [rating, setRating] = useState<SellerRating>({
    review_count: 0,
    average_rating: 0,
  });
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");
        setReviewError("");

        const token = localStorage.getItem("goldmart_token");
        const savedUser = localStorage.getItem("goldmart_user");

        if (!token || !savedUser) {
          window.location.href = "/login";
          return;
        }

        let sellerId: number;
        try {
          const user = JSON.parse(savedUser);
          sellerId = Number(user?.id);
        } catch {
          localStorage.removeItem("goldmart_user");
          window.location.href = "/login";
          return;
        }

        if (!Number.isInteger(sellerId) || sellerId < 1) {
          throw new Error("Could not determine seller ID.");
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        };

        // Core dashboard data is loaded independently of reviews.
        // A temporary reviews issue must not hide products or sales.
        const [productsResponse, statsResponse, reviewsResult] =
          await Promise.all([
            fetch(`${API_URL}/api/seller/products`, {
              headers,
              cache: "no-store",
              signal: controller.signal,
            }),
            fetch(`${API_URL}/api/seller/stats`, {
              headers,
              cache: "no-store",
              signal: controller.signal,
            }),
            fetch(`${API_URL}/api/reviews/seller/${sellerId}`, {
              headers,
              cache: "no-store",
              signal: controller.signal,
            }).then(async (response) => {
              const data = await response.json();
              if (!response.ok || !data.success) {
                throw new Error(data.message || "Could not load reviews.");
              }
              return data;
            }).then(
              (data) => ({ ok: true as const, data }),
              () => ({ ok: false as const })
            ),
          ]);

        const productsData = await productsResponse.json();
        const statsData = await statsResponse.json();

        if (!productsResponse.ok || !productsData.success) {
          throw new Error(productsData.message || "Failed to load products.");
        }
        if (!statsResponse.ok || !statsData.success) {
          throw new Error(statsData.message || "Failed to load statistics.");
        }

        if (controller.signal.aborted) return;

        setProducts(
          Array.isArray(productsData.products) ? productsData.products : []
        );
        setStats({
          products: Number(statsData.stats?.products) || 0,
          orders: Number(statsData.stats?.orders) || 0,
          sales: Number(statsData.stats?.sales) || 0,
        });

        if (reviewsResult.ok) {
          setRating({
            review_count: Number(reviewsResult.data.rating?.review_count) || 0,
            average_rating: Number(reviewsResult.data.rating?.average_rating) || 0,
          });
          setReviews(
            Array.isArray(reviewsResult.data.reviews)
              ? reviewsResult.data.reviews
              : []
          );
        } else {
          setReviewError("Customer reviews are temporarily unavailable.");
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : "Failed to load dashboard."
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadDashboard();
    return () => controller.abort();
  }, []);

  async function handleSwitchToBuyer() {
    if (switching) return;
    try {
      setSwitching(true);
      setError("");
      const token = localStorage.getItem("goldmart_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/switch-role`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.user) {
        throw new Error(data.message || "Failed to switch to buyer mode.");
      }
      localStorage.setItem("goldmart_user", JSON.stringify(data.user));
      if (data.token) localStorage.setItem("goldmart_token", data.token);
      window.location.href = "/";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to switch to buyer mode."
      );
      setSwitching(false);
    }
  }

  const averageRating = Number(rating.average_rating) || 0;
  const salesDisplay = loading
    ? "—"
    : `₦${Number(stats.sales).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

  return (
    <main className="min-h-screen bg-[#FAF8F3] pb-16 text-[#17191D]">
      {/* A discreet gold accent rather than bright yellow everywhere. */}
      <div className="h-1 bg-gradient-to-r from-[#96713D] via-[#E9D9BB] to-[#C5A46D]" />

      <header className="border-b border-[#E8E1D5] bg-white/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-2xl font-black tracking-tight" aria-label="GoldMart Home">
            Gold<span className="text-[#B08A50]">Mart</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/account" className="rounded-full border border-[#E8E1D5] px-4 py-2.5 text-xs font-bold transition hover:border-[#C5A46D] sm:text-sm">
              My Account
            </Link>
            <button
              type="button"
              onClick={handleSwitchToBuyer}
              disabled={switching}
              className="rounded-full bg-[#17191D] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#96713D] disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:text-sm"
            >
              {switching ? "Switching..." : "🛍️ Switch to Buyer"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        {/* Luxury dark welcome panel */}
        <section className="relative overflow-hidden rounded-[28px] bg-[#17191D] px-5 py-8 text-white shadow-[0_16px_45px_rgba(23,25,29,0.12)] sm:px-9 sm:py-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-60 w-60 rounded-full border border-[#C5A46D]/25" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-3 -top-12 h-44 w-44 rounded-full border border-[#C5A46D]/15" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E9D9BB]">GoldMart • Seller Centre</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Your Store, Beautifully Managed.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#E1DDD6] sm:text-base">
                An elegant space to manage your products, customer orders, sales and reviews.
              </p>
            </div>
            <Link href="/seller/products/new" className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#C5A46D] px-6 py-3 text-sm font-extrabold text-[#17191D] transition hover:bg-[#E9D9BB]">
              + Add New Product <span aria-hidden="true" className="ml-2">→</span>
            </Link>
          </div>
        </section>

        {error && (
          <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            <p className="font-bold">Something went wrong</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* KPI cards: same live statistics as before. */}
        <section className="mt-9" aria-label="Store overview">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#96713D]">At a glance</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Store Overview</h2>
            </div>
            <Link href="/seller/orders" className="text-sm font-bold text-[#96713D] hover:underline">Manage Orders →</Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <Link href="/seller/products" className="group rounded-[22px] border border-[#E8E1D5] bg-white p-4 shadow-[0_5px_20px_rgba(23,25,29,0.035)] transition hover:-translate-y-0.5 hover:border-[#C5A46D] hover:shadow-md sm:p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5F1E9] text-xl">📦</span>
              <p className="mt-4 text-xs font-semibold text-[#74716B] sm:text-sm">Total Products</p>
              <p className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{loading ? "—" : stats.products}</p>
              <p className="mt-2 text-xs font-bold text-[#96713D]">See products →</p>
            </Link>
            <Link href="/seller/orders" className="group rounded-[22px] border border-[#E8E1D5] bg-white p-4 shadow-[0_5px_20px_rgba(23,25,29,0.035)] transition hover:-translate-y-0.5 hover:border-[#C5A46D] hover:shadow-md sm:p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5F1E9] text-xl">🛍️</span>
              <p className="mt-4 text-xs font-semibold text-[#74716B] sm:text-sm">Orders</p>
              <p className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{loading ? "—" : stats.orders}</p>
              <p className="mt-2 text-xs font-bold text-[#96713D]">View orders →</p>
            </Link>
            <div className="rounded-[22px] border border-[#E8E1D5] bg-white p-4 shadow-[0_5px_20px_rgba(23,25,29,0.035)] sm:p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5F1E9] text-xl">💰</span>
              <p className="mt-4 text-xs font-semibold text-[#74716B] sm:text-sm">Recorded Sales</p>
              <p className="mt-1 break-words text-xl font-black tracking-tight sm:text-2xl">{salesDisplay}</p>
              <p className="mt-2 text-xs text-[#74716B]">Completed / non-cancelled</p>
            </div>
            <div className="rounded-[22px] border border-[#E8E1D5] bg-white p-4 shadow-[0_5px_20px_rgba(23,25,29,0.035)] sm:p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5F1E9] text-xl">⭐</span>
              <p className="mt-4 text-xs font-semibold text-[#74716B] sm:text-sm">Store Rating</p>
              <p className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{loading ? "—" : averageRating > 0 ? `${averageRating.toFixed(1)} / 5` : "—"}</p>
              <p className="mt-2 text-xs text-[#74716B]">{loading ? "Loading reviews..." : `${rating.review_count} ${rating.review_count === 1 ? "review" : "reviews"}`}</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#74716B]">Sales figures are displayed in the currency used by the existing seller-statistics dashboard (₦). They are not a payout balance.</p>
        </section>

        {/* Store management shortcuts */}
        <section className="mt-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#96713D]">Manage your business</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Store Management</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shortcuts.map((item) => (
              <Link key={item.href} href={item.href} className="group flex items-start gap-4 rounded-[22px] border border-[#E8E1D5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#C5A46D] hover:shadow-md sm:p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F5F1E9] text-2xl">{item.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-black">{item.title}</span>
                  <span className="mt-1 block text-sm leading-5 text-[#74716B]">{item.description}</span>
                  <span className="mt-2 block text-xs font-bold text-[#96713D]">Open →</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Product previews */}
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#96713D]">Your inventory</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Your Products</h2>
            </div>
            <Link href="/seller/products" className="text-sm font-bold text-[#96713D] hover:underline">View All →</Link>
          </div>

          {loading ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="animate-pulse overflow-hidden rounded-2xl border border-[#E8E1D5] bg-white">
                  <div className="aspect-square bg-[#EFEAE1]" />
                  <div className="space-y-3 p-4"><div className="h-3 w-3/4 rounded bg-[#EFEAE1]" /><div className="h-3 w-1/2 rounded bg-[#EFEAE1]" /></div>
                </div>
              ))}
            </div>
          ) : !error && products.length === 0 ? (
            <div className="mt-5 rounded-[24px] border border-[#E8E1D5] bg-white px-5 py-12 text-center">
              <div className="text-5xl">📦</div>
              <h3 className="mt-4 text-xl font-black">Your store is ready for its first product</h3>
              <p className="mt-2 text-sm text-[#74716B]">Add a product to start building your GoldMart catalogue.</p>
              <Link href="/seller/products/new" className="mt-6 inline-flex rounded-full bg-[#17191D] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#96713D]">Add Product →</Link>
            </div>
          ) : !error ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products.slice(0, 4).map((product) => (
                <article key={product.id} className="overflow-hidden rounded-[22px] border border-[#E8E1D5] bg-white shadow-sm transition hover:border-[#C5A46D] hover:shadow-md">
                  {product.image_url ? (
                    // External product images may not be configured for next/image.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image_url} alt={product.name} loading="lazy" className="aspect-square w-full bg-[#F5F1E9] object-cover" />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-[#F5F1E9] text-5xl">📦</div>
                  )}
                  <div className="p-4">
                    <h3 className="line-clamp-2 min-h-10 text-sm font-black">{product.name}</h3>
                    <p className="mt-2 text-base font-extrabold text-[#96713D]">{formatPrice(product.price, product.currency)}</p>
                    <p className="mt-1 text-xs text-[#74716B]">{Number(product.stock) > 0 ? `${product.stock} in stock` : "Out of stock"}</p>
                    <Link href={`/seller/products/${product.id}/edit`} className="mt-4 block rounded-full border border-[#D7BF97] px-3 py-2.5 text-center text-xs font-bold transition hover:bg-[#FAF8F3]">Edit Product →</Link>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        {/* Reviews: preserve average and complete existing review list. */}
        <section className="mt-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#96713D]">Customer feedback</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Reviews & Ratings</h2>
            <p className="mt-2 text-sm text-[#74716B]">See what customers are saying about your store.</p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-6 rounded-[22px] border border-[#E8E1D5] bg-white p-5 sm:p-6">
            <div><p className="text-xs text-[#74716B]">Average rating</p><p className="mt-1 text-2xl font-black">{loading ? "—" : averageRating > 0 ? `⭐ ${averageRating.toFixed(1)} / 5` : "No rating yet"}</p></div>
            <div className="h-10 w-px bg-[#E8E1D5]" />
            <div><p className="text-xs text-[#74716B]">Total reviews</p><p className="mt-1 text-2xl font-black">{loading ? "—" : rating.review_count}</p></div>
          </div>
          {!loading && reviewError && (
            <p className="mt-4 rounded-xl border border-[#E8E1D5] bg-white p-4 text-sm text-[#74716B]">{reviewError}</p>
          )}
          {!loading && !error && !reviewError && reviews.length === 0 && (
            <div className="mt-4 rounded-[22px] border border-[#E8E1D5] bg-white p-8 text-center">
              <p className="text-3xl">⭐</p>
              <h3 className="mt-3 text-lg font-black">No reviews yet</h3>
              <p className="mt-2 text-sm text-[#74716B]">Your customer reviews will appear here.</p>
            </div>
          )}
          {!loading && !error && !reviewError && reviews.length > 0 && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {reviews.map((item) => (
                <article key={item.id} className="rounded-[22px] border border-[#E8E1D5] bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-black">{item.buyer_name || "GoldMart Customer"}</p><p className="mt-1 text-[#96713D]" aria-label={`${item.rating} out of 5 stars`}>{Array.from({ length: 5 }).map((_, index) => <span key={index}>{index < Number(item.rating) ? "★" : "☆"}</span>)}</p></div>
                    <time className="shrink-0 text-xs text-[#74716B]" dateTime={item.created_at}>{reviewDate(item.created_at)}</time>
                  </div>
                  {item.review && <p className="mt-4 rounded-2xl bg-[#FAF8F3] p-4 text-sm leading-6 text-[#57534C]">“{item.review}”</p>}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10 overflow-hidden rounded-[26px] bg-[#17191D] p-6 text-white sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E9D9BB]">Grow your GoldMart store</p>
          <h2 className="mt-3 text-2xl font-black sm:text-3xl">Make your next sale count.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#D6D1C8]">Keep your catalogue up to date, manage customer orders and grow your shop.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/seller/products/new" className="rounded-full bg-[#C5A46D] px-6 py-3 text-center text-sm font-bold text-[#17191D] transition hover:bg-[#E9D9BB]">Add Product →</Link>
            <Link href="/seller/products" className="rounded-full border border-[#C5A46D]/65 px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10">Manage Products</Link>
          </div>
        </section>

        <p className="mt-7 text-center text-xs text-[#8B8377]">GoldMart Seller Centre · Built for your business</p>
      </div>
    </main>
  );
}
