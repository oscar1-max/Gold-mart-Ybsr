
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com/api";

// =====================================================
// TYPES
// =====================================================

type OrderItem = {
  id: number;
  product_id: number;
  name?: string | null;
  image_url?: string | null;
  quantity: number;
  price: string | number;
  currency?: string | null;
};

type Order = {
  id: number;
  total_amount: string | number;
  status: string;
  created_at: string;
  items: OrderItem[];
};

const trackingSteps = [
  {
    key: "pending",
    title: "Order Placed",
    description: "Your order has been received.",
  },
  {
    key: "processing",
    title: "Processing",
    description:
      "The seller is preparing your order.",
  },
  {
    key: "shipped",
    title: "Shipped",
    description:
      "The seller has marked your order as shipped.",
  },
  {
    key: "delivered",
    title: "Delivered",
    description:
      "Your order has been marked as delivered.",
  },
];

// =====================================================
// HELPERS
// =====================================================

function normalizeStatus(value: string) {
  return String(value || "pending")
    .trim()
    .toLowerCase();
}

function getStepIndex(status: string) {
  switch (normalizeStatus(status)) {
    case "pending":
      return 0;
    case "processing":
      return 1;
    case "shipped":
      return 2;
    case "delivered":
      return 3;
    default:
      return -1;
  }
}

function statusLabel(status: string) {
  const value = normalizeStatus(status);

  switch (value) {
    case "pending":
      return "Order Placed";
    case "processing":
      return "Processing";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return value.replace(/_/g, " ");
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAmount(
  value: number | string,
  currency?: string | null
) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Amount unavailable";
  }

  const code = String(currency || "")
    .toUpperCase();

  if (!["USD", "NGN"].includes(code)) {
    return amount.toFixed(2);
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: code,
  }).format(amount);
}

// =====================================================
// ORDER TRACKING PAGE
// =====================================================

export default function TrackOrderPage() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [selectedId, setSelectedId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loggedIn, setLoggedIn] =
    useState(true);

  // ===================================================
  // LOAD BUYER ORDERS
  // ===================================================

  const loadOrders = useCallback(
    async (showLoading = true) => {
      const token =
        localStorage.getItem(
          "goldmart_token"
        );

      if (!token) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }

      setLoggedIn(true);

      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const response = await fetch(
          `${API_URL}/orders`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
              Accept:
                "application/json",
            },
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          if (response.status === 401) {
            setLoggedIn(false);
          }

          throw new Error(
            data.message ||
              "Unable to load your orders."
          );
        }

        const receivedOrders: Order[] =
          Array.isArray(data.orders)
            ? data.orders
            : [];

        setOrders(receivedOrders);

        setSelectedId((current) => {
          if (
            current !== null &&
            receivedOrders.some(
              (order) =>
                Number(order.id) === current
            )
          ) {
            return current;
          }

          return receivedOrders.length > 0
            ? Number(receivedOrders[0].id)
            : null;
        });

        setError("");
      } catch (err) {
        console.error(
          "Order tracking error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load tracking details."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // ===================================================
  // SELECTED ORDER
  // ===================================================

  const selectedOrder =
    orders.find(
      (order) =>
        Number(order.id) === selectedId
    ) || null;

  const currentStatus =
    normalizeStatus(
      selectedOrder?.status || ""
    );

  const currentStep =
    getStepIndex(currentStatus);

  const isCancelled =
    currentStatus === "cancelled";

  const currency =
    selectedOrder?.items?.[0]?.currency;

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <main className="min-h-screen bg-[#f5f8f6] pb-28 text-[#1b3329] md:pb-14">
      <section aria-label="Track your order introduction" className="relative mx-auto mt-5 max-w-7xl overflow-hidden rounded-[27px] px-6 py-8 text-white shadow-[0_15px_35px_rgba(25,39,46,0.13)] sm:mt-8 sm:px-10 sm:py-12" style={{ background: "linear-gradient(120deg,#173D44,#347D78,#A5CFCA)" }}>
        <div className="pointer-events-none absolute -right-8 -top-14 text-[150px] leading-none opacity-10" aria-hidden="true">📦</div>
        <div className="relative">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#F2DEC0]">GoldMart · Track your order</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">Every step, made clearer.</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/85">See the latest recorded status of your GoldMart orders.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/shop" className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/25">Shop All ↗</Link>
            <Link href="/track-order" className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/25">Track Order ↗</Link>
            <Link href="/help" className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/25">Help Centre ↗</Link>
          </div>
        </div>
      </section>


      {/* HEADER */}

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-5">
          <Link
            href="/"
            className="text-2xl font-black"
          >
            Gold
            <span className="text-[#C9A227]">
              Mart
            </span>
          </Link>

          <Link
            href="/orders"
            className="rounded-full border px-4 py-2 text-sm font-bold"
          >
            My Orders
          </Link>
        </div>
      </header>

      {/* CONTENT */}

      <section className="mx-auto max-w-5xl px-4 py-8 sm:py-12">

        <p className="text-xs font-black uppercase tracking-widest text-[#9A7617]">
          GoldMart Delivery
        </p>

        <h1 className="mt-2 text-3xl font-black">
          📦 Track Your Order
        </h1>

        <p className="mt-3 text-sm text-gray-600">
          Check the latest status of your
          GoldMart purchases.
        </p>

        {/* NOT LOGGED IN */}

        {!loggedIn && (
          <div className="mt-8 rounded-3xl border border-[#E7E9E6] bg-white shadow-[0_5px_18px_rgba(24,42,50,0.045)] p-8 text-center shadow-sm">
            <div className="text-5xl">
              🔐
            </div>

            <h2 className="mt-4 text-xl font-black">
              Sign in to track orders
            </h2>

            <p className="mt-2 text-gray-500">
              Please sign in with the account
              used to place your order.
            </p>

            <Link
              href="/login"
              className="mt-6 inline-block rounded-xl bg-black px-6 py-3 font-bold text-white"
            >
              Sign In
            </Link>
          </div>
        )}

        {/* LOADING */}

        {loggedIn && loading && (
          <div className="mt-8 rounded-3xl border border-[#E7E9E6] bg-white shadow-[0_5px_18px_rgba(24,42,50,0.045)] p-10 text-center shadow-sm">
            <div className="text-5xl">
              ⏳
            </div>

            <p className="mt-4 font-bold">
              Loading your orders...
            </p>
          </div>
        )}

        {/* ERROR */}

        {loggedIn && !loading && error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-white p-6">
            <p className="text-sm font-bold text-red-600">
              ⚠️ {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadOrders()
              }
              className="mt-4 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY */}

        {loggedIn &&
          !loading &&
          !error &&
          orders.length === 0 && (
            <div className="mt-8 rounded-3xl border border-[#E7E9E6] bg-white shadow-[0_5px_18px_rgba(24,42,50,0.045)] p-10 text-center shadow-sm">
              <div className="text-5xl">
                🛒
              </div>

              <h2 className="mt-4 text-xl font-black">
                No orders yet
              </h2>

              <p className="mt-2 text-gray-500">
                Once you place an order,
                you can track it here.
              </p>

              <Link
                href="/shop"
                className="mt-6 inline-block rounded-xl bg-black px-6 py-3 font-bold text-white"
              >
                Start Shopping
              </Link>
            </div>
          )}

        {/* TRACKING AREA */}

        {loggedIn &&
          !loading &&
          !error &&
          selectedOrder && (
            <div className="mt-8 space-y-6">

              {/* SELECT ORDER */}

              <div className="rounded-3xl border border-[#E7E9E6] bg-white shadow-[0_5px_18px_rgba(24,42,50,0.045)] p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">

                  <label
                    htmlFor="goldmart-order"
                    className="text-sm font-black"
                  >
                    Select an Order
                  </label>

                  <button
                    type="button"
                    disabled={refreshing}
                    onClick={() =>
                      void loadOrders(false)
                    }
                    className="rounded-full border px-4 py-2 text-xs font-bold disabled:opacity-50"
                  >
                    {refreshing
                      ? "Refreshing..."
                      : "↻ Refresh Status"}
                  </button>
                </div>

                <select
                  id="goldmart-order"
                  value={selectedOrder.id}
                  onChange={(event) =>
                    setSelectedId(
                      Number(event.target.value)
                    )
                  }
                  className="mt-4 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-[#C9A227]"
                >
                  {orders.map((order) => (
                    <option
                      key={order.id}
                      value={order.id}
                    >
                      Order #{order.id} —{" "}
                      {statusLabel(order.status)}
                    </option>
                  ))}
                </select>
              </div>

              {/* ORDER DETAILS */}

              <div className="rounded-3xl border border-[#E7E9E6] bg-white shadow-[0_5px_18px_rgba(24,42,50,0.045)] p-6 shadow-sm sm:p-8">

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Order Number
                    </p>

                    <h2 className="mt-1 text-2xl font-black">
                      #{selectedOrder.id}
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                      Placed on{" "}
                      {formatDate(
                        selectedOrder.created_at
                      )}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-xs font-black ${
                      isCancelled
                        ? "bg-red-100 text-red-700"
                        : currentStatus ===
                            "delivered"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {statusLabel(
                      selectedOrder.status
                    )}
                  </span>
                </div>

                <div className="mt-6 border-t pt-5">
                  <p className="text-sm text-gray-500">
                    Order Total
                  </p>

                  <p className="mt-1 text-2xl font-black text-[#9A7617]">
                    {formatAmount(
                      selectedOrder.total_amount,
                      currency
                    )}
                  </p>
                </div>
              </div>

              {/* STATUS TIMELINE */}

              <div className="rounded-3xl border border-[#E7E9E6] bg-white shadow-[0_5px_18px_rgba(24,42,50,0.045)] p-6 shadow-sm sm:p-8">

                <h2 className="text-xl font-black">
                  Delivery Progress
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  These updates come from the
                  status recorded for your order.
                </p>

                {isCancelled ? (
                  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
                    <p className="font-black text-red-700">
                      Order Cancelled
                    </p>

                    <p className="mt-2 text-sm text-red-700">
                      This order is marked as
                      cancelled. Cancellation does
                      not automatically mean a
                      refund has been processed.
                    </p>
                  </div>
                ) : currentStep === -1 ? (
                  <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                    Your order status is{" "}
                    <strong>
                      {statusLabel(currentStatus)}
                    </strong>
                    . More tracking details will
                    appear when its status is updated.
                  </div>
                ) : (
                  <div className="mt-7 space-y-0">
                    {trackingSteps.map(
                      (step, index) => {
                        const completed =
                          index <= currentStep;

                        const active =
                          index === currentStep;

                        const last =
                          index ===
                          trackingSteps.length - 1;

                        return (
                          <div
                            key={step.key}
                            className="flex gap-4"
                          >
                            <div className="flex flex-col items-center">

                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-black ${
                                  completed
                                    ? "border-[#C9A227] bg-[#C9A227] text-black"
                                    : "border-gray-200 bg-white text-gray-400"
                                }`}
                              >
                                {completed
                                  ? "✓"
                                  : index + 1}
                              </div>

                              {!last && (
                                <div
                                  className={`min-h-14 w-0.5 flex-1 ${
                                    index <
                                    currentStep
                                      ? "bg-[#C9A227]"
                                      : "bg-gray-200"
                                  }`}
                                />
                              )}
                            </div>

                            <div className="pb-8">
                              <p
                                className={`font-black ${
                                  completed
                                    ? "text-black"
                                    : "text-gray-400"
                                }`}
                              >
                                {step.title}
                                {active &&
                                  " — Current"}
                              </p>

                              <p className="mt-1 text-sm text-gray-500">
                                {step.description}
                              </p>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}

                <p className="mt-2 text-xs text-gray-400">
                  Tracking shows seller-reported
                  order status. Live courier
                  location and delivery estimates
                  are not available yet.
                </p>
              </div>

              {/* PURCHASED PRODUCTS */}

              <div className="rounded-3xl border border-[#E7E9E6] bg-white shadow-[0_5px_18px_rgba(24,42,50,0.045)] p-6 shadow-sm sm:p-8">

                <h2 className="text-xl font-black">
                  Products in This Order
                </h2>

                <div className="mt-5 divide-y">
                  {(selectedOrder.items || []).map(
                    (item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 py-4"
                      >
                        <div className="min-w-0">
                          <p className="font-bold">
                            {item.name ||
                              `Product #${item.product_id}`}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            Quantity: {item.quantity}
                          </p>
                        </div>

                        <span className="text-sm font-bold">
                          {formatAmount(
                            Number(item.price) *
                              Number(item.quantity),
                            item.currency
                          )}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* NAVIGATION */}

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/orders/${selectedOrder.id}`}
                  className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white"
                >
                  View Order Details
                </Link>

                <Link
                  href="/chat"
                  className="rounded-xl border bg-white px-5 py-3 text-sm font-bold"
                >
                  Messages
                </Link>
              </div>
            </div>
          )}
      </section>
    </main>
  );
}
