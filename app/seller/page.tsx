
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";
const LOW_STOCK_THRESHOLD = 5;

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
  sales: number;
  sales_by_currency?: {currency:string;amount:string}[];
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

type ApiResponse = {
  success?: boolean;
  message?: string;
  products?: Product[];
  stats?: Partial<SellerStats>;
  rating?: Partial<SellerRating>;
  reviews?: SellerReview[];
  user?: unknown;
  token?: string;
};

function formatPrice(
  price: string | number,
  currency?: string | null
) {
  const numericPrice = Number(price);
  const amount = Number.isFinite(numericPrice)
    ? numericPrice
    : 0;

  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  switch (currency?.toUpperCase()) {
    case "EUR":
      return `€${formatted}`;
    case "GBP":
      return `£${formatted}`;
    case "NGN":
      return `₦${formatted}`;
    default:
      return `$${formatted}`;
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

function stockCount(value: number) {
  const n = Number(value);
  return Number.isFinite(n)
    ? Math.max(0, n)
    : 0;
}

async function readResponse(
  response: Response
): Promise<ApiResponse> {
  let data: ApiResponse;

  try {
    data = (await response.json()) as ApiResponse;
  } catch {
    throw new Error(
      "The server returned an unreadable response. Please try again."
    );
  }

  if (!response.ok || !data.success) {
    if (response.status === 401) {
      throw new Error(
        "Your session may have expired. Please log in again."
      );
    }

    throw new Error(
      data.message ||
        "Unable to load data. Please try again."
    );
  }

  return data;
}

// =====================================================
// SELLER MANAGEMENT BUTTONS
// =====================================================

const actionLinks = [
  {
    title: "Manage products",
    subtitle: "View inventory and edit listings",
    emoji: "📦",
    href: "/seller/products",
  },
  {
    title: "Add a product",
    subtitle: "Create a new product listing",
    emoji: "✦",
    href: "/seller/products/new",
  },
  {
    title: "Customer orders",
    subtitle: "Check orders and fulfilment",
    emoji: "🚚",
    href: "/seller/orders",
  },
  {
    title: "Payment Protection",
    subtitle:
      "Review recorded order allocations — no withdrawals",
    emoji: "🛡️",
    href: "/seller/payment-protection",
  },
  {
    title: "Messages",
    subtitle: "Talk with your customers",
    emoji: "💬",
    href: "/chat",
  },
  {
    title: "Notifications",
    subtitle: "See messages and store alerts",
    emoji: "🔔",
    href: "/notifications",
  },
  {
    title: "My account",
    subtitle: "Manage your GoldMart account",
    emoji: "👤",
    href: "/account",
  },
];

export default function SellerDashboard() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [salesByCurrency, setSalesByCurrency] = useState<{currency:string;amount:string}[]>([]);
  const [stats, setStats] =
    useState<SellerStats>({
      products: 0,
      orders: 0,
      sales: 0,
    });

  const [rating, setRating] =
    useState<SellerRating>({
      review_count: 0,
      average_rating: 0,
    });

  const [reviews, setReviews] =
    useState<SellerReview[]>([]);

  const [loading, setLoading] = useState(true);

  const [productsError, setProductsError] =
    useState("");

  const [statsError, setStatsError] =
    useState("");

  const [reviewError, setReviewError] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [switching, setSwitching] =
    useState(false);

  const [refreshCount, setRefreshCount] =
    useState(0);

  const [lastUpdated, setLastUpdated] =
    useState("");

  // ===================================================
  // LOAD SELLER DASHBOARD DATA
  // ===================================================

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      setLoading(true);
      setProductsError("");
      setStatsError("");
      setReviewError("");

      try {
        const token =
          localStorage.getItem("goldmart_token");

        const savedUser =
          localStorage.getItem("goldmart_user");

        if (!token || !savedUser) {
          window.location.href = "/login";
          return;
        }

        let sellerId: number;

        try {
          sellerId = Number(
            JSON.parse(savedUser)?.id
          );
        } catch {
          localStorage.removeItem(
            "goldmart_user"
          );

          window.location.href = "/login";
          return;
        }

        if (
          !Number.isInteger(sellerId) ||
          sellerId < 1
        ) {
          setActionError(
            "Your account could not be verified. Please sign in again."
          );
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        };

        // Load each part independently so a
        // review error does not hide products.

        const [
          productsResult,
          statsResult,
          reviewsResult,
        ] = await Promise.allSettled([
          fetch(
            `${API_URL}/api/seller/products`,
            {
              headers,
              cache: "no-store",
              signal: controller.signal,
            }
          ).then(readResponse),

          fetch(
            `${API_URL}/api/seller/stats`,
            {
              headers,
              cache: "no-store",
              signal: controller.signal,
            }
          ).then(readResponse),

          fetch(
            `${API_URL}/api/reviews/seller/${sellerId}`,
            {
              headers,
              cache: "no-store",
              signal: controller.signal,
            }
          ).then(readResponse),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        if (
          productsResult.status ===
          "fulfilled"
        ) {
          setProducts(
            Array.isArray(
              productsResult.value.products
            )
              ? productsResult.value.products
              : []
          );
        } else {
          setProductsError(
            productsResult.reason instanceof Error
              ? productsResult.reason.message
              : "Could not load products."
          );
        }

        if (
          statsResult.status ===
          "fulfilled"
        ) {
          const incoming =
            statsResult.value.stats;

          setSalesByCurrency(Array.isArray(incoming?.sales_by_currency) ? incoming.sales_by_currency : []);
          setStats({
            products:
              Number(incoming?.products) || 0,
            orders:
              Number(incoming?.orders) || 0,
            sales:
              Number(incoming?.sales) || 0,
          });
        } else {
          setStatsError(
            statsResult.reason instanceof Error
              ? statsResult.reason.message
              : "Could not load store statistics."
          );
        }

        if (
          reviewsResult.status ===
          "fulfilled"
        ) {
          setRating({
            review_count:
              Number(
                reviewsResult.value.rating
                  ?.review_count
              ) || 0,
            average_rating:
              Number(
                reviewsResult.value.rating
                  ?.average_rating
              ) || 0,
          });

          setReviews(
            Array.isArray(
              reviewsResult.value.reviews
            )
              ? reviewsResult.value.reviews
              : []
          );
        } else {
          setReviewError(
            "Customer reviews are temporarily unavailable."
          );
        }

        setLastUpdated(
          new Date().toLocaleTimeString(
            "en-US",
            {
              hour: "numeric",
              minute: "2-digit",
            }
          )
        );
      } catch (err) {
        if (!controller.signal.aborted) {
          setActionError(
            err instanceof Error
              ? err.message
              : "Could not load dashboard."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => controller.abort();
  }, [refreshCount]);

  // ===================================================
  // BUYER MODE SWITCH
  // ===================================================

  async function handleSwitchToBuyer() {
    if (switching) return;

    try {
      setSwitching(true);
      setActionError("");

      const token =
        localStorage.getItem("goldmart_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/auth/switch-role`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await readResponse(
        response
      );

      if (!data.user) {
        throw new Error(
          "The server did not return your account information."
        );
      }

      localStorage.setItem(
        "goldmart_user",
        JSON.stringify(data.user)
      );

      if (data.token) {
        localStorage.setItem(
          "goldmart_token",
          data.token
        );
      }

      window.location.href = "/";
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to switch to buyer mode."
      );

      setSwitching(false);
    }
  }

  // ===================================================
  // INVENTORY INFORMATION
  // ===================================================

  const stockInfo = useMemo(() => {
    const outOfStock = products.filter(
      (p) => stockCount(p.stock) === 0
    );

    const lowStock = products.filter(
      (p) =>
        stockCount(p.stock) > 0 &&
        stockCount(p.stock) <=
          LOW_STOCK_THRESHOLD
    );

    const available = products.filter(
      (p) => stockCount(p.stock) > 0
    );

    return {
      outOfStock,
      lowStock,
      available,
    };
  }, [products]);

  const inventoryWarnings = useMemo(
    () =>
      [
        ...stockInfo.outOfStock,
        ...stockInfo.lowStock,
      ].slice(0, 4),
    [stockInfo]
  );

  const averageRating =
    Number(rating.average_rating) || 0;

  const showStats =
    !loading && !statsError;

  const showProducts =
    !loading && !productsError;

  const showReviews =
    !loading && !reviewError;

  // Preserve the dashboard's existing
  // sales display pending currency review.

  const salesDisplay = salesByCurrency.length === 0 ? "No verified sales yet" : salesByCurrency.map(item => formatPrice(item.amount,item.currency)).join(" · ");

  return (
    <main className="min-h-screen bg-[#F1F5F5] pb-28 text-[#20313B] md:pb-14">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <section className="relative overflow-hidden rounded-[30px] px-6 py-9 text-white shadow-[0_18px_38px_rgba(24,51,62,0.16)] sm:px-10 sm:py-12" style={{background:"linear-gradient(120deg,#102A3C,#1C5563 54%,#3C8B87)"}}>
          <div className="pointer-events-none absolute -right-10 -top-20 h-60 w-60 rounded-full border-[32px] border-white/10" aria-hidden="true"/>
          <div className="relative"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#BDECE4]">GOLDMART SELLER STUDIO · Seller Studio</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Your business, beautifully managed.</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/85">Manage your catalogue, customer orders and growth in one professional workspace.</p></div>
        </section>
        <nav aria-label="Seller Studio navigation" className="og-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2">
          <Link href="/seller" className="shrink-0 rounded-full border border-[#CEDFDF] bg-white px-4 py-2.5 text-xs font-bold text-[#2E5361] transition hover:border-[#70A9A8] hover:bg-[#E9F3F2]">Dashboard</Link>
          <Link href="/seller/products" className="shrink-0 rounded-full border border-[#CEDFDF] bg-white px-4 py-2.5 text-xs font-bold text-[#2E5361] transition hover:border-[#70A9A8] hover:bg-[#E9F3F2]">Catalogue</Link>
          <Link href="/seller/products/new" className="shrink-0 rounded-full border border-[#CEDFDF] bg-white px-4 py-2.5 text-xs font-bold text-[#2E5361] transition hover:border-[#70A9A8] hover:bg-[#E9F3F2]">Add Product</Link>
          <Link href="/seller/orders" className="shrink-0 rounded-full border border-[#CEDFDF] bg-white px-4 py-2.5 text-xs font-bold text-[#2E5361] transition hover:border-[#70A9A8] hover:bg-[#E9F3F2]">Orders</Link>
          <Link href="/seller/payment-protection" className="shrink-0 rounded-full border border-[#CEDFDF] bg-white px-4 py-2.5 text-xs font-bold text-[#2E5361] transition hover:border-[#70A9A8] hover:bg-[#E9F3F2]">Finance</Link>
          <Link href="/chat" className="shrink-0 rounded-full border border-[#CEDFDF] bg-white px-4 py-2.5 text-xs font-bold text-[#2E5361] transition hover:border-[#70A9A8] hover:bg-[#E9F3F2]">Messages</Link>
          <Link href="/account" className="shrink-0 rounded-full border border-[#CEDFDF] bg-white px-4 py-2.5 text-xs font-bold text-[#2E5361] transition hover:border-[#70A9A8] hover:bg-[#E9F3F2]">Account</Link>
        </nav>
      </div>

      <div className="h-1 bg-gradient-to-r from-[#96713D] via-[#E9D9BB] to-[#C5A46D]" />

      {/* HEADER */}

      <header className="border-b border-[#DAE5E5] bg-white/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight"
            aria-label="GoldMart home"
          >
            Gold
            <span className="text-[#B08A50]">
              Mart
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="rounded-full border border-[#DAE8E1] px-3 py-2 text-sm transition hover:border-[#71A999]"
            >
              🔔
            </Link>

            <Link
              href="/chat"
              aria-label="Customer messages"
              className="rounded-full border border-[#DAE8E1] px-3 py-2 text-sm transition hover:border-[#71A999]"
            >
              💬
            </Link>

            <Link
              href="/account"
              className="rounded-full border border-[#DAE8E1] px-4 py-2 text-xs font-bold transition hover:border-[#71A999] sm:text-sm"
            >
              Account
            </Link>

            <button
              type="button"
              onClick={handleSwitchToBuyer}
              disabled={switching}
              className="rounded-full bg-[#17191D] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#247263] disabled:opacity-50 sm:text-sm"
            >
              {switching
                ? "Switching..."
                : "🛍️ Buyer mode"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        {/* SELLER HERO */}

        <section className="relative overflow-hidden rounded-[28px] bg-[#164555] px-5 py-8 text-white shadow-[0_16px_45px_rgba(23,25,29,0.12)] sm:px-9 sm:py-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-16 h-60 w-60 rounded-full border border-[#C5A46D]/25"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border border-[#C5A46D]/20"
          />

          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E9D9BB]">
                GoldMart • Seller Centre
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Run your store with confidence.
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[#E1DDD6] sm:text-base">
                Manage your products, customer
                orders, inventory and store feedback
                in one place.
              </p>
            </div>

            <Link
              href="/seller/products/new"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#C5A46D] px-6 py-3 text-sm font-extrabold text-[#17191D] transition hover:bg-[#E9D9BB]"
            >
              + Add product
              <span
                className="ml-2"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          </div>
        </section>

        {/* ACTION ERROR */}

        {actionError && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <p className="font-bold">
              Action needed
            </p>

            <p className="mt-1">
              {actionError}
            </p>

            <Link
              href="/login"
              className="mt-2 inline-block font-bold underline"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* DASHBOARD REFRESH */}

        <section
          className="mt-8 flex flex-wrap items-center justify-between gap-3"
          aria-label="Dashboard refresh"
        >
          <p className="text-xs text-[#74716B]">
            {loading
              ? "Loading your live store data..."
              : lastUpdated
                ? `Last checked at ${lastUpdated}`
                : "Your store overview"}
          </p>

          <button
            type="button"
            onClick={() =>
              setRefreshCount(
                (value) => value + 1
              )
            }
            disabled={loading}
            className="rounded-full border border-[#D7BF97] bg-white px-4 py-2 text-xs font-bold text-[#17191D] transition hover:bg-[#F5F1E9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Refreshing..."
              : "↻ Refresh dashboard"}
          </button>
        </section>

        {/* STORE OVERVIEW */}

        <section
          className="mt-6"
          aria-labelledby="overview-heading"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#347467]">
                Business snapshot
              </p>

              <h2
                id="overview-heading"
                className="mt-1 text-2xl font-black tracking-tight"
              >
                Store Overview
              </h2>
            </div>

            <Link
              href="/seller/orders"
              className="text-sm font-bold text-[#347467] hover:underline"
            >
              Manage orders →
            </Link>
          </div>

          {statsError && !loading && (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-[#7C5416]"
            >
              Store statistics could not load:
              {" "}{statsError}
            </p>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <Link
              href="/seller/products"
              className="rounded-[22px] border border-[#DAE5E5] bg-white p-4 shadow-sm transition hover:border-[#71A999] hover:shadow-md sm:p-6"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5F1E9] text-xl">
                📦
              </span>

              <p className="mt-4 text-xs font-semibold text-[#74716B] sm:text-sm">
                Total products
              </p>

              <p className="mt-1 text-2xl font-black sm:text-3xl">
                {showStats
                  ? stats.products
                  : "—"}
              </p>

              <p className="mt-2 text-xs font-bold text-[#347467]">
                Manage products →
              </p>
            </Link>

            <Link
              href="/seller/orders"
              className="rounded-[22px] border border-[#DAE5E5] bg-white p-4 shadow-sm transition hover:border-[#71A999] hover:shadow-md sm:p-6"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5F1E9] text-xl">
                🚚
              </span>

              <p className="mt-4 text-xs font-semibold text-[#74716B] sm:text-sm">
                Recorded orders
              </p>

              <p className="mt-1 text-2xl font-black sm:text-3xl">
                {showStats
                  ? stats.orders
                  : "—"}
              </p>

              <p className="mt-2 text-xs font-bold text-[#347467]">
                Open orders →
              </p>
            </Link>

            <div className="rounded-[22px] border border-[#DAE5E5] bg-white p-4 shadow-sm sm:p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5F1E9] text-xl">
                💰
              </span>

              <p className="mt-4 text-xs font-semibold text-[#74716B] sm:text-sm">
                Recorded sales
              </p>

              <p className="mt-1 break-words text-xl font-black sm:text-2xl">
                {showStats
                  ? salesDisplay
                  : "—"}
              </p>

              <p className="mt-2 text-xs text-[#74716B]">
                Not an available payout balance
              </p>
            </div>

            <div className="rounded-[22px] border border-[#DAE5E5] bg-white p-4 shadow-sm sm:p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5F1E9] text-xl">
                ⭐
              </span>

              <p className="mt-4 text-xs font-semibold text-[#74716B] sm:text-sm">
                Store rating
              </p>

              <p className="mt-1 text-2xl font-black sm:text-3xl">
                {showReviews &&
                averageRating > 0
                  ? `${averageRating.toFixed(1)} / 5`
                  : "—"}
              </p>

              <p className="mt-2 text-xs text-[#74716B]">
                {showReviews
                  ? `${rating.review_count} review${
                      rating.review_count === 1
                        ? ""
                        : "s"
                    }`
                  : "Reviews unavailable"}
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs leading-5 text-[#74716B]">
            Recorded sales are shown in the
            dashboard&apos;s existing ₦ format.
            This does not confirm a cash balance
            or convert sales into USD; the
            backend currency must be checked
            before changing this figure.
          </p>
        </section>

        {/* INVENTORY HEALTH */}

        <section
          className="mt-10"
          aria-labelledby="inventory-heading"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#347467]">
                Keep products available
              </p>

              <h2
                id="inventory-heading"
                className="mt-1 text-2xl font-black"
              >
                Inventory Health
              </h2>
            </div>

            <Link
              href="/seller/products"
              className="text-sm font-bold text-[#347467] hover:underline"
            >
              View inventory →
            </Link>
          </div>

          {productsError && !loading ? (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-[#7C5416]"
            >
              Inventory could not load:
              {" "}{productsError}
            </div>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-[20px] border border-[#DAE5E5] bg-white p-4 sm:p-5">
                  <p className="text-xs font-semibold text-[#74716B]">
                    In stock
                  </p>

                  <p className="mt-2 text-2xl font-black">
                    {showProducts
                      ? stockInfo.available.length
                      : "—"}
                  </p>
                </div>

                <div className="rounded-[20px] border border-[#DAE5E5] bg-white p-4 sm:p-5">
                  <p className="text-xs font-semibold text-[#74716B]">
                    Low stock
                  </p>

                  <p className="mt-2 text-2xl font-black text-[#946B2B]">
                    {showProducts
                      ? stockInfo.lowStock.length
                      : "—"}
                  </p>
                </div>

                <div className="rounded-[20px] border border-[#DAE5E5] bg-white p-4 sm:p-5">
                  <p className="text-xs font-semibold text-[#74716B]">
                    Out of stock
                  </p>

                  <p className="mt-2 text-2xl font-black text-[#9D3434]">
                    {showProducts
                      ? stockInfo.outOfStock.length
                      : "—"}
                  </p>
                </div>
              </div>

              {showProducts &&
                inventoryWarnings.length > 0 && (
                  <div className="mt-4 rounded-[22px] border border-[#E8D8B4] bg-[#FFFDF8] p-4 sm:p-5">
                    <h3 className="text-sm font-black">
                      ⚠️ Products that need attention
                    </h3>

                    <p className="mt-1 text-xs text-[#74716B]">
                      Low stock means 1–
                      {LOW_STOCK_THRESHOLD}
                      {" "}units remaining.
                    </p>

                    <div className="mt-3 divide-y divide-[#EEE6D8]">
                      {inventoryWarnings.map(
                        (product) => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between gap-3 py-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold">
                                {product.name}
                              </p>

                              <p className="mt-1 text-xs text-[#916F42]">
                                {stockCount(
                                  product.stock
                                ) === 0
                                  ? "Out of stock"
                                  : `${stockCount(
                                      product.stock
                                    )} left in stock`}
                              </p>
                            </div>

                            <Link
                              href={`/seller/products/${product.id}/edit`}
                              className="shrink-0 rounded-full border border-[#D7BF97] px-4 py-2 text-xs font-bold hover:bg-white"
                            >
                              Edit →
                            </Link>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {showProducts &&
                products.length > 0 &&
                inventoryWarnings.length === 0 && (
                  <p className="mt-4 rounded-xl border border-[#DAE5E5] bg-white p-4 text-sm text-[#57534C]">
                    ✓ No products are currently low
                    or out of stock.
                  </p>
                )}

              {showProducts &&
                products.length === 0 && (
                  <div className="mt-4 rounded-[22px] border border-[#DAE5E5] bg-white p-6 text-center">
                    <p className="text-sm text-[#74716B]">
                      No products listed yet.
                    </p>

                    <Link
                      href="/seller/products/new"
                      className="mt-3 inline-block font-bold text-[#347467] hover:underline"
                    >
                      Add your first product →
                    </Link>
                  </div>
                )}
            </>
          )}
        </section>

        {/* STORE MANAGEMENT */}

        <section
          className="mt-10"
          aria-labelledby="management-heading"
        >
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#347467]">
            Seller tools
          </p>

          <h2
            id="management-heading"
            className="mt-1 text-2xl font-black"
          >
            Store Management
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {actionLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-start gap-4 rounded-[22px] border border-[#DAE5E5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#71A999] hover:shadow-md sm:p-6"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F5F1E9] text-2xl">
                  {item.emoji}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-base font-black">
                    {item.title}
                  </span>

                  <span className="mt-1 block text-sm leading-5 text-[#74716B]">
                    {item.subtitle}
                  </span>

                  <span className="mt-2 block text-xs font-bold text-[#347467]">
                    Open →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* YOUR PRODUCTS */}

        <section
          className="mt-10"
          aria-labelledby="products-heading"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#347467]">
                Your catalogue
              </p>

              <h2
                id="products-heading"
                className="mt-1 text-2xl font-black"
              >
                Your Products
              </h2>
            </div>

            <Link
              href="/seller/products"
              className="text-sm font-bold text-[#347467] hover:underline"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="animate-pulse overflow-hidden rounded-2xl border border-[#DAE5E5] bg-white"
                >
                  <div className="aspect-square bg-[#EFEAE1]" />

                  <div className="space-y-3 p-4">
                    <div className="h-3 w-3/4 rounded bg-[#EFEAE1]" />
                    <div className="h-3 w-1/2 rounded bg-[#EFEAE1]" />
                  </div>
                </div>
              ))}
            </div>
          ) : productsError ? (
            <p className="mt-5 rounded-xl bg-white p-5 text-sm text-[#74716B]">
              Your product list is unavailable right
              now. Tap Refresh dashboard to try again.
            </p>
          ) : products.length === 0 ? (
            <div className="mt-5 rounded-[22px] border border-[#DAE5E5] bg-white px-5 py-10 text-center">
              <p className="text-4xl">
                📦
              </p>

              <h3 className="mt-3 text-lg font-black">
                Your store is ready for its
                first product
              </h3>

              <p className="mt-2 text-sm text-[#74716B]">
                Add a product to start building
                your catalogue.
              </p>

              <Link
                href="/seller/products/new"
                className="mt-5 inline-flex rounded-full bg-[#17191D] px-6 py-3 text-sm font-bold text-white"
              >
                Add product →
              </Link>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products
                .slice(0, 4)
                .map((product) => (
                  <article
                    key={product.id}
                    className="overflow-hidden rounded-[22px] border border-[#DAE5E5] bg-white shadow-sm transition hover:border-[#71A999] hover:shadow-md"
                  >
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image_url}
                        alt={product.name}
                        loading="lazy"
                        className="aspect-square w-full bg-[#F5F1E9] object-cover"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-[#F5F1E9] text-5xl">
                        📦
                      </div>
                    )}

                    <div className="p-4">
                      <h3 className="line-clamp-2 min-h-10 text-sm font-black">
                        {product.name}
                      </h3>

                      <p className="mt-2 text-base font-extrabold text-[#347467]">
                        {formatPrice(
                          product.price,
                          product.currency
                        )}
                      </p>

                      <p
                        className={`mt-1 text-xs ${
                          stockCount(
                            product.stock
                          ) === 0
                            ? "font-bold text-[#9D3434]"
                            : "text-[#74716B]"
                        }`}
                      >
                        {stockCount(
                          product.stock
                        ) > 0
                          ? `${stockCount(
                              product.stock
                            )} in stock`
                          : "Out of stock"}
                      </p>

                      <Link
                        href={`/seller/products/${product.id}/edit`}
                        className="mt-4 block rounded-full border border-[#D7BF97] px-3 py-2.5 text-center text-xs font-bold transition hover:bg-[#F3F7F5]"
                      >
                        Edit product →
                      </Link>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </section>

        {/* REVIEWS AND RATINGS */}

        <section
          className="mt-10"
          aria-labelledby="reviews-heading"
        >
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#347467]">
            Customer feedback
          </p>

          <h2
            id="reviews-heading"
            className="mt-1 text-2xl font-black"
          >
            Reviews & Ratings
          </h2>

          <p className="mt-2 text-sm text-[#74716B]">
            Feedback left by customers of your store.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-6 rounded-[22px] border border-[#DAE5E5] bg-white p-5 sm:p-6">
            <div>
              <p className="text-xs text-[#74716B]">
                Average rating
              </p>

              <p className="mt-1 text-2xl font-black">
                {showReviews &&
                averageRating > 0
                  ? `⭐ ${averageRating.toFixed(1)} / 5`
                  : "—"}
              </p>
            </div>

            <div className="h-10 w-px bg-[#E8E1D5]" />

            <div>
              <p className="text-xs text-[#74716B]">
                Total reviews
              </p>

              <p className="mt-1 text-2xl font-black">
                {showReviews
                  ? rating.review_count
                  : "—"}
              </p>
            </div>
          </div>

          {!loading && reviewError && (
            <p className="mt-4 rounded-xl border border-[#DAE5E5] bg-white p-4 text-sm text-[#74716B]">
              {reviewError}
            </p>
          )}

          {showReviews &&
            reviews.length === 0 && (
              <div className="mt-4 rounded-[22px] border border-[#DAE5E5] bg-white p-8 text-center">
                <p className="text-3xl">
                  ⭐
                </p>

                <h3 className="mt-3 text-lg font-black">
                  No reviews yet
                </h3>

                <p className="mt-2 text-sm text-[#74716B]">
                  Your customer reviews will
                  appear here.
                </p>
              </div>
            )}

          {showReviews &&
            reviews.length > 0 && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {reviews
                  .slice(0, 6)
                  .map((review) => (
                    <article
                      key={review.id}
                      className="rounded-[22px] border border-[#DAE5E5] bg-white p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black">
                            {review.buyer_name ||
                              "GoldMart Customer"}
                          </p>

                          <p
                            className="mt-1 text-[#347467]"
                            aria-label={`${review.rating} out of 5 stars`}
                          >
                            {Array.from(
                              {
                                length: 5,
                              },
                              (_, i) => (
                                <span key={i}>
                                  {i <
                                  Number(
                                    review.rating
                                  )
                                    ? "★"
                                    : "☆"}
                                </span>
                              )
                            )}
                          </p>
                        </div>

                        <time
                          className="shrink-0 text-xs text-[#74716B]"
                          dateTime={
                            review.created_at
                          }
                        >
                          {reviewDate(
                            review.created_at
                          )}
                        </time>
                      </div>

                      {review.review && (
                        <p className="mt-4 rounded-2xl bg-[#F3F7F5] p-4 text-sm leading-6 text-[#57534C]">
                          “{review.review}”
                        </p>
                      )}
                    </article>
                  ))}
              </div>
            )}
        </section>

        {/* FOOTER CARD */}

        <section className="mt-10 overflow-hidden rounded-[26px] bg-[#164555] p-6 text-white sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E9D9BB]">
            Keep growing with GoldMart
          </p>

          <h2 className="mt-3 text-2xl font-black sm:text-3xl">
            Your next customer is waiting.
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[#D6D1C8]">
            Keep your products up to date and
            reply to customers quickly.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/seller/products/new"
              className="rounded-full bg-[#C5A46D] px-6 py-3 text-center text-sm font-bold text-[#17191D] transition hover:bg-[#E9D9BB]"
            >
              Add a product →
            </Link>

            <Link
              href="/chat"
              className="rounded-full border border-[#C5A46D]/65 px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10"
            >
              Customer messages
            </Link>
          </div>
        </section>

        <p className="mt-7 text-center text-xs text-[#8B8377]">
          GoldMart Seller Centre · Built for your business
        </p>
      </div>
    </main>
  );
}
