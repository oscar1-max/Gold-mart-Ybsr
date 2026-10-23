
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

type OrderItem = {
  id: number;
  product_id: number;
  quantity: number;
  price: string | number;
  name?: string | null;
  image_url?: string | null;
  seller_id?: number | null;
};

type Order = {
  id: number;
  total_amount: string | number;
  status: string;
  created_at: string;
  items: OrderItem[];
};

type RefundRequest = {
  id: number;
  status: string;
  request_type?: string;
  created_at?: string;
};

type Protection = {
  refund_request: RefundRequest | null;
  delivery_confirmation: {
    confirmed_at: string;
  } | null;
  standard_refund_window?: {
    delivery_confirmed_at?: string | null;
    deadline?: string | null;
    expired?: boolean;
    seconds_remaining?: number | null;
  } | null;
};

type ApiResult = {
  success?: boolean;
  message?: string;
  orders?: Order[];
  refund_request?: RefundRequest | null;
  delivery_confirmation?: Protection["delivery_confirmation"];
  standard_refund_window?: Protection["standard_refund_window"];
};

type ReviewForm = {
  rating: number;
  review: string;
};

// ==============================================
// AUTHENTICATED API REQUESTS
// ==============================================

async function api(
  path: string,
  options: RequestInit = {}
): Promise<ApiResult> {
  const token = localStorage.getItem("goldmart_token");

  if (!token) {
    window.location.assign("/login");
    throw new Error("Please sign in to continue.");
  }

  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = (await response
    .json()
    .catch(() => ({}))) as ApiResult;

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message ||
      `Request failed (${response.status}).`
    );
  }

  return data;
}

// ==============================================
// FORMATTING HELPERS
// ==============================================

function formatPrice(value: string | number) {
  const amount = Number(value);

  return `$${(
    Number.isFinite(amount) ? amount : 0
  ).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}

function formatCountdown(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case "delivered":
      return "bg-green-100 text-green-700";

    case "shipped":
      return "bg-purple-100 text-purple-700";

    case "processing":
      return "bg-blue-100 text-blue-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-yellow-100 text-yellow-800";
  }
}

// ==============================================
// MY ORDERS PAGE
// ==============================================

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const [protections, setProtections] = useState<
    Record<number, Protection>
  >({});

  const [protectionErrors, setProtectionErrors] = useState<
    Record<number, string>
  >({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [now, setNow] = useState(() => Date.now());

  const [busyOrderId, setBusyOrderId] = useState<
    number | null
  >(null);

  const [refundOrderId, setRefundOrderId] = useState<
    number | null
  >(null);

  const [refundReason, setRefundReason] = useState("");

  const [actionMessage, setActionMessage] = useState<
    Record<number, string>
  >({});

  const [reviewing, setReviewing] = useState<{
    orderId: number;
    sellerId: number;
  } | null>(null);

  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    rating: 5,
    review: "",
  });

  const [submittingReview, setSubmittingReview] =
    useState(false);

  const [reviewMessage, setReviewMessage] = useState("");

  // ==============================================
  // LOAD BUYER PROTECTION DETAILS
  // ==============================================

  const loadProtection = useCallback(
    async (orderId: number) => {
      try {
        const data = await api(
          `/order-protection/${orderId}`
        );

        const protection: Protection = {
          refund_request: data.refund_request || null,

          delivery_confirmation:
            data.delivery_confirmation || null,

          standard_refund_window:
            data.standard_refund_window || null,
        };

        setProtections((current) => ({
          ...current,
          [orderId]: protection,
        }));

        setProtectionErrors((current) => {
          const next = { ...current };
          delete next[orderId];
          return next;
        });
      } catch (err) {
        setProtectionErrors((current) => ({
          ...current,
          [orderId]:
            err instanceof Error
              ? err.message
              : "Could not check refund eligibility.",
        }));
      }
    },
    []
  );

  // ==============================================
  // LOAD BUYER ORDERS
  // ==============================================

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        const data = await api("/orders");

        if (!active) return;

        const fetched = Array.isArray(data.orders)
          ? data.orders
          : [];

        setOrders(fetched);

        await Promise.all(
          fetched.map((order) =>
            loadProtection(order.id)
          )
        );
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load orders."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      active = false;
    };
  }, [loadProtection]);

  // ==============================================
  // UPDATE COUNTDOWN EVERY SECOND
  // ==============================================

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  function notify(orderId: number, message: string) {
    setActionMessage((current) => ({
      ...current,
      [orderId]: message,
    }));
  }

  // ==============================================
  // BUYER CONFIRMS DELIVERY
  // ==============================================

  async function confirmDelivery(orderId: number) {
    const confirmed = window.confirm(
      "Have you actually received all items in this order? " +
      "Confirm only if they arrived."
    );

    if (!confirmed) return;

    setBusyOrderId(orderId);
    notify(orderId, "");

    try {
      await api(
        `/order-protection/${orderId}/confirm-delivery`,
        {
          method: "POST",
        }
      );

      await loadProtection(orderId);

      notify(
        orderId,
        "Delivery confirmed. Your ordinary 48-hour " +
        "refund window has started."
      );
    } catch (err) {
      notify(
        orderId,
        err instanceof Error
          ? err.message
          : "Unable to confirm delivery."
      );
    } finally {
      setBusyOrderId(null);
    }
  }

  // ==============================================
  // SUBMIT REFUND OR CANCELLATION REQUEST
  // ==============================================

  async function submitRefund(orderId: number) {
    const reason = refundReason.trim();

    if (
      reason.length < 10 ||
      reason.length > 2000
    ) {
      notify(
        orderId,
        "Please explain your request in 10 to 2000 characters."
      );
      return;
    }

    setBusyOrderId(orderId);
    notify(orderId, "");

    try {
      const result = await api(
        `/order-protection/${orderId}/refund-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        }
      );

      await loadProtection(orderId);

      setRefundOrderId(null);
      setRefundReason("");

      notify(
        orderId,
        result.message ||
        "Your request has been submitted for review."
      );
    } catch (err) {
      notify(
        orderId,
        err instanceof Error
          ? err.message
          : "Unable to submit your request."
      );

      await loadProtection(orderId);
    } finally {
      setBusyOrderId(null);
    }
  }

  // ==============================================
  // SUBMIT SELLER REVIEW
  // ==============================================

  async function submitReview(
    orderId: number,
    sellerId: number
  ) {
    setSubmittingReview(true);
    setReviewMessage("");

    try {
      await api("/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          sellerId,
          rating: reviewForm.rating,
          review: reviewForm.review.trim() || null,
        }),
      });

      setReviewMessage(
        "Review submitted successfully."
      );

      setReviewing(null);

      setReviewForm({
        rating: 5,
        review: "",
      });
    } catch (err) {
      setReviewMessage(
        err instanceof Error
          ? err.message
          : "Failed to submit review."
      );
    } finally {
      setSubmittingReview(false);
    }
  }

  // ==============================================
  // PAGE
  // ==============================================

  return (
    <main className="min-h-screen bg-gray-50 text-black">
      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <Link
            href="/"
            className="text-2xl font-black"
          >
            Gold
            <span className="text-[#D4AF37]">
              Mart
            </span>
          </Link>

          <Link
            href="/"
            className="rounded-full border px-5 py-2 text-sm font-bold hover:bg-gray-100"
          >
            Continue Shopping
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-sm font-bold uppercase tracking-wider text-[#D4AF37]">
          My Account
        </p>

        <h1 className="mt-1 text-3xl font-black sm:text-4xl">
          My Orders
        </h1>

        <p className="mt-3 text-gray-500">
          Track orders, confirm receipt, request a refund,
          and rate sellers.
        </p>

        {/* GENERAL ERROR */}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-bold">
              Something went wrong
            </p>

            <p className="mt-2 text-sm">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full bg-black px-5 py-2 text-sm font-bold text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <p className="mt-8 rounded-2xl bg-white p-8 text-center font-bold">
            📦 Loading your orders...
          </p>
        )}

        {/* NO ORDERS */}
        {!loading && !error && orders.length === 0 && (
          <div className="mt-8 rounded-3xl border bg-white p-10 text-center">
            <p className="text-5xl">📭</p>

            <h2 className="mt-4 text-2xl font-black">
              No orders yet
            </h2>

            <p className="mt-3 text-gray-500">
              Your purchases will appear here after an order.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-block rounded-full bg-black px-7 py-3 font-bold text-white"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {/* ORDER LIST */}
        {!loading && !error && orders.length > 0 && (
          <div className="mt-8 space-y-6">
            {orders.map((order) => {
              const protection = protections[order.id];

              const protectionError =
                protectionErrors[order.id];

              const status =
                order.status.toLowerCase();

              const confirmedAt =
                protection?.delivery_confirmation
                  ?.confirmed_at ||
                protection?.standard_refund_window
                  ?.delivery_confirmed_at ||
                null;

              const deadline =
                protection?.standard_refund_window
                  ?.deadline;

              const deadlineMs = deadline
                ? new Date(deadline).getTime()
                : NaN;

              const hasDeadline =
                Boolean(confirmedAt) &&
                Number.isFinite(deadlineMs);

              const expired = hasDeadline
                ? now >= deadlineMs
                : protection?.standard_refund_window
                    ?.expired === true;

              const request =
                protection?.refund_request;

              const canRequest = [
                "pending",
                "processing",
                "shipped",
                "delivered",
              ].includes(status);

              const isBusy =
                busyOrderId === order.id;

              // Group products by seller for reviews.
              const sellerIds = Array.from(
                new Set(
                  order.items
                    .map((item) => item.seller_id)
                    .filter(
                      (id): id is number =>
                        typeof id === "number"
                    )
                )
              );

              const sellerGroups = sellerIds.map(
                (sellerId) => ({
                  sellerId,
                  products: order.items.filter(
                    (item) =>
                      item.seller_id === sellerId
                  ),
                })
              );

              return (
                <article
                  key={order.id}
                  className="rounded-3xl border bg-white p-6 shadow-sm"
                >
                  {/* ORDER HEADER */}
                  <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-[#D4AF37]">
                        Order #{order.id}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Ordered on{" "}
                        {formatDate(order.created_at)}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-4 py-2 text-xs font-bold capitalize ${statusClass(
                        status
                      )}`}
                    >
                      {status}
                    </span>
                  </div>

                  {/* PRODUCTS */}
                  <div className="mt-6 space-y-4">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-4">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={
                                item.name || "Product"
                              }
                              className="h-16 w-16 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                              📦
                            </div>
                          )}

                          <div>
                            <h2 className="font-black">
                              {item.name || "Product"}
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                        </div>

                        <p className="font-black text-[#D4AF37]">
                          {formatPrice(
                            Number(item.price) *
                            Number(item.quantity)
                          )}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* ORDER TOTAL */}
                  <div className="mt-6 flex items-center justify-between border-t pt-5">
                    <p className="font-bold text-gray-500">
                      Order Total
                    </p>

                    <p className="text-2xl font-black text-[#D4AF37]">
                      {formatPrice(order.total_amount)}
                    </p>
                  </div>

                  {/* BUYER PROTECTION */}
                  <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <h2 className="text-lg font-black">
                      🛡️ Buyer Protection
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                      Standard refund requests close 48 hours
                      after you confirm delivery. Faulty or
                      misdescribed goods may still qualify
                      for support review.
                    </p>

                    {!protection &&
                      !protectionError && (
                        <p className="mt-3 text-sm text-gray-600">
                          Checking your order protection...
                        </p>
                      )}

                    {protectionError && (
                      <div className="mt-3">
                        <p className="text-sm text-red-700">
                          {protectionError}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            void loadProtection(order.id)
                          }
                          className="mt-2 rounded-full border bg-white px-4 py-2 text-sm font-bold"
                        >
                          Retry check
                        </button>
                      </div>
                    )}

                    {protection && (
                      <div className="mt-4 space-y-3">
                        {/* REFUND COUNTDOWN */}
                        {confirmedAt &&
                        hasDeadline ? (
                          <div className="rounded-xl bg-white p-4">
                            <p className="text-sm font-semibold text-gray-600">
                              48-hour ordinary refund window
                            </p>

                            {expired ? (
                              <p className="mt-1 font-black text-red-700">
                                Standard refund window closed
                              </p>
                            ) : (
                              <p className="mt-1 text-xl font-black text-[#D4AF37]">
                                {formatCountdown(
                                  deadlineMs - now
                                )}{" "}
                                remaining
                              </p>
                            )}

                            <p className="mt-1 text-xs text-gray-500">
                              Deadline:{" "}
                              {new Date(
                                deadlineMs
                              ).toLocaleString()}
                            </p>
                          </div>
                        ) : status === "delivered" &&
                          !confirmedAt ? (
                          <p className="text-sm text-gray-700">
                            The seller marked this order
                            delivered. Confirm only after
                            you actually receive it.
                          </p>
                        ) : null}

                        {/* CONFIRM DELIVERY */}
                        {status === "delivered" &&
                          !confirmedAt &&
                          !request && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                void confirmDelivery(
                                  order.id
                                )
                              }
                              className="rounded-full bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                            >
                              {isBusy
                                ? "Working..."
                                : "Confirm Delivery Received"}
                            </button>
                          )}

                        {/* EXISTING REFUND REQUEST */}
                        {request ? (
                          <div className="rounded-xl border bg-white p-4 text-sm">
                            <p className="font-bold">
                              Request #{request.id}:{" "}
                              <span className="capitalize">
                                {request.status.replace(
                                  /_/g,
                                  " "
                                )}
                              </span>
                            </p>

                            <p className="mt-1 text-gray-600">
                              Your existing request is
                              being tracked. A second
                              request for this order is
                              not allowed.
                            </p>
                          </div>
                        ) : expired &&
                          status === "delivered" ? (
                          <div className="rounded-xl border bg-white p-4 text-sm text-gray-700">
                            The ordinary refund deadline
                            has passed. For faulty,
                            missing, or misdescribed goods,
                            please contact GoldMart support
                            for review.
                          </div>
                        ) : canRequest ? (
                          <>
                            {/* OPEN REQUEST FORM */}
                            {refundOrderId !== order.id ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setRefundOrderId(
                                    order.id
                                  );

                                  setRefundReason("");

                                  notify(
                                    order.id,
                                    ""
                                  );
                                }}
                                className="rounded-full border border-[#D4AF37] bg-white px-5 py-3 text-sm font-bold text-[#D4AF37]"
                              >
                                {status === "processing" ||
                                status === "pending"
                                  ? "Request Cancellation / Refund"
                                  : "Request Refund"}
                              </button>
                            ) : (
                              <div className="rounded-xl border bg-white p-4">
                                <label
                                  htmlFor={`reason-${order.id}`}
                                  className="block text-sm font-bold"
                                >
                                  Reason for your request
                                </label>

                                <textarea
                                  id={`reason-${order.id}`}
                                  value={refundReason}
                                  maxLength={2000}
                                  rows={4}
                                  onChange={(event) =>
                                    setRefundReason(
                                      event.target.value
                                    )
                                  }
                                  placeholder="Explain what happened (at least 10 characters)."
                                  className="mt-2 w-full rounded-xl border p-3 outline-none focus:border-[#D4AF37]"
                                />

                                <p className="mt-1 text-xs text-gray-500">
                                  {
                                    refundReason.trim()
                                      .length
                                  }
                                  /2000 characters
                                </p>

                                <div className="mt-3 flex flex-wrap gap-3">
                                  <button
                                    type="button"
                                    disabled={
                                      isBusy ||
                                      refundReason.trim()
                                        .length < 10
                                    }
                                    onClick={() =>
                                      void submitRefund(
                                        order.id
                                      )
                                    }
                                    className="rounded-full bg-black px-5 py-2 font-bold text-white disabled:opacity-50"
                                  >
                                    {isBusy
                                      ? "Submitting..."
                                      : "Submit Request"}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() =>
                                      setRefundOrderId(
                                        null
                                      )
                                    }
                                    className="rounded-full border px-5 py-2 font-bold disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        ) : null}
                      </div>
                    )}

                    {/* ACTION FEEDBACK */}
                    {actionMessage[order.id] && (
                      <p
                        role="status"
                        className="mt-3 rounded-xl bg-white p-3 text-sm font-semibold"
                      >
                        {actionMessage[order.id]}
                      </p>
                    )}
                  </section>

                  {/* SELLER RATINGS — PRESERVED */}
                  {status === "delivered" &&
                    sellerGroups.length > 0 && (
                      <section className="mt-6 border-t pt-6">
                        <h2 className="text-lg font-black">
                          ⭐ Rate Your Seller
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                          Your feedback helps other
                          GoldMart buyers.
                        </p>

                        <div className="mt-4 space-y-3">
                          {sellerGroups.map(
                            (group) => (
                              <div
                                key={
                                  group.sellerId
                                }
                                className="rounded-2xl border bg-gray-50 p-4"
                              >
                                <p className="text-sm font-bold">
                                  Seller #
                                  {
                                    group.sellerId
                                  }
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                  {group.products
                                    .map(
                                      (product) =>
                                        product.name ||
                                        "Product"
                                    )
                                    .join(", ")}
                                </p>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setReviewing({
                                      orderId:
                                        order.id,
                                      sellerId:
                                        group.sellerId,
                                    });

                                    setReviewForm({
                                      rating: 5,
                                      review: "",
                                    });

                                    setReviewMessage(
                                      ""
                                    );
                                  }}
                                  className="mt-4 rounded-full bg-black px-5 py-2 text-sm font-bold text-white"
                                >
                                  ⭐ Rate Seller
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      </section>
                    )}

                  {/* REVIEW FORM */}
                  {reviewing?.orderId ===
                    order.id && (
                    <div className="mt-6 rounded-2xl border p-5">
                      <h3 className="text-lg font-black">
                        Seller Rating
                      </h3>

                      <div className="mt-4 flex gap-2">
                        {[1, 2, 3, 4, 5].map(
                          (star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() =>
                                setReviewForm(
                                  (current) => ({
                                    ...current,
                                    rating: star,
                                  })
                                )
                              }
                              className={`text-3xl ${
                                star <=
                                reviewForm.rating
                                  ? "text-yellow-500"
                                  : "text-gray-300"
                              }`}
                              aria-label={`${star} star`}
                            >
                              ★
                            </button>
                          )
                        )}
                      </div>

                      <textarea
                        value={reviewForm.review}
                        rows={4}
                        onChange={(event) =>
                          setReviewForm(
                            (current) => ({
                              ...current,
                              review:
                                event.target.value,
                            })
                          )
                        }
                        placeholder="Write an optional review..."
                        className="mt-4 w-full rounded-2xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
                      />

                      {reviewMessage && (
                        <p className="mt-3 text-sm font-bold">
                          {reviewMessage}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={
                            submittingReview
                          }
                          onClick={() =>
                            void submitReview(
                              reviewing.orderId,
                              reviewing.sellerId
                            )
                          }
                          className="rounded-full bg-black px-6 py-3 font-bold text-white disabled:opacity-50"
                        >
                          {submittingReview
                            ? "Submitting..."
                            : "Submit Review"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            submittingReview
                          }
                          onClick={() => {
                            setReviewing(null);
                            setReviewMessage("");
                          }}
                          className="rounded-full border px-6 py-3 font-bold disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {!reviewing &&
                    reviewMessage &&
                    status === "delivered" && (
                      <p className="mt-3 text-sm font-bold">
                        {reviewMessage}
                      </p>
                    )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
