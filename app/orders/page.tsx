"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

type SellerGroup = {
  sellerId: number;
  products: OrderItem[];
};

type ReviewForm = {
  rating: number;
  review: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reviewing, setReviewing] = useState<{
    orderId: number;
    sellerId: number;
  } | null>(null);

  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    rating: 5,
    review: "",
  });

  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("goldmart_token");

        if (!token) {
          window.location.href = "/login";
          return;
        }

        const response = await fetch(`${API_URL}/api/orders`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load orders"
          );
        }

        setOrders(
          Array.isArray(data.orders)
            ? data.orders
            : []
        );
      } catch (err) {
        console.error("Orders error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load orders"
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  function formatPrice(price: string | number) {
    const amount = Number(price);

    if (!Number.isFinite(amount)) {
      return "$0.00";
    }

    return `$${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function getStatusClass(status: string) {
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
        return "bg-yellow-100 text-yellow-700";
    }
  }

  function getSellerGroups(items: OrderItem[]): SellerGroup[] {
    const groups = new Map<number, OrderItem[]>();

    for (const item of items) {
      if (!item.seller_id) {
        continue;
      }

      const existing = groups.get(item.seller_id) || [];

      existing.push(item);

      groups.set(item.seller_id, existing);
    }

    return Array.from(groups.entries()).map(
      ([sellerId, products]) => ({
        sellerId,
        products,
      })
    );
  }

  async function submitReview(
    orderId: number,
    sellerId: number
  ) {
    try {
      setSubmittingReview(true);
      setReviewMessage("");

      const token = localStorage.getItem("goldmart_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          orderId,
          sellerId,
          rating: reviewForm.rating,
          review: reviewForm.review.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to submit review"
        );
      }

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
            className="rounded-full border px-5 py-2 text-sm font-bold transition hover:bg-gray-100"
          >
            Continue Shopping
          </Link>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
          My Account
        </p>

        <h1 className="mt-1 text-3xl font-black sm:text-4xl">
          My Orders
        </h1>

        <p className="mt-3 text-gray-500">
          View your GoldMart purchases and rate sellers after delivery.
        </p>

        {/* ERROR */}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-bold">
              Something went wrong
            </p>

            <p className="mt-1 text-sm">
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
          <div className="mt-8 rounded-3xl border bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">
              📦
            </div>

            <p className="mt-4 font-bold">
              Loading your orders...
            </p>
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          !error &&
          orders.length === 0 && (
            <div className="mt-8 rounded-3xl border bg-white p-10 text-center shadow-sm">
              <div className="text-6xl">
                📭
              </div>

              <h2 className="mt-5 text-2xl font-black">
                No orders yet
              </h2>

              <p className="mt-3 text-gray-500">
                Your purchases will appear here after you place an order.
              </p>

              <Link
                href="/shop"
                className="mt-6 inline-block rounded-full bg-black px-7 py-3 font-bold text-white transition hover:bg-[#D4AF37] hover:text-black"
              >
                Start Shopping
              </Link>
            </div>
          )}

        {/* ORDERS */}
        {!loading &&
          !error &&
          orders.length > 0 && (
            <div className="mt-8 space-y-6">
              {orders.map((order) => {
                const sellerGroups = getSellerGroups(
                  order.items
                );

                return (
                  <article
                    key={order.id}
                    className="rounded-3xl border bg-white p-6 shadow-sm"
                  >
                    {/* ORDER HEADER */}
                    <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-bold text-[#A67C00]">
                          Order #{order.id}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Ordered on{" "}
                          {formatDate(
                            order.created_at
                          )}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full px-4 py-2 text-xs font-bold capitalize ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status}
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
                                  item.name ||
                                  "Product"
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
                                {item.name ||
                                  "Product"}
                              </h2>

                              <p className="mt-1 text-sm text-gray-500">
                                Quantity:{" "}
                                {item.quantity}
                              </p>
                            </div>
                          </div>

                          <p className="font-black text-[#A67C00]">
                            {formatPrice(
                              Number(item.price) *
                                Number(item.quantity)
                            )}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* TOTAL */}
                    <div className="mt-6 flex items-center justify-between border-t pt-5">
                      <p className="font-bold text-gray-500">
                        Order Total
                      </p>

                      <p className="text-2xl font-black text-[#A67C00]">
                        {formatPrice(
                          order.total_amount
                        )}
                      </p>
                    </div>

                    {/* RATING */}
                    {order.status.toLowerCase() ===
                      "delivered" &&
                      sellerGroups.length > 0 && (
                        <div className="mt-6 border-t pt-6">
                          <h2 className="text-lg font-black">
                            ⭐ Rate Your Seller
                          </h2>

                          <p className="mt-1 text-sm text-gray-500">
                            Your feedback helps other GoldMart buyers.
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
                                  <div>
                                    <p className="text-sm font-bold">
                                      Seller #
                                      {
                                        group.sellerId
                                      }
                                    </p>

                                    <p className="mt-1 text-xs text-gray-500">
                                      {group.products
                                        .map(
                                          (
                                            product
                                          ) =>
                                            product.name ||
                                            "Product"
                                        )
                                        .join(
                                          ", "
                                        )}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReviewing({
                                        orderId:
                                          order.id,
                                        sellerId:
                                          group.sellerId,
                                      });

                                      setReviewMessage(
                                        ""
                                      );
                                    }}
                                    className="mt-4 rounded-full bg-black px-5 py-2 text-sm font-bold text-white transition hover:bg-[#D4AF37] hover:text-black"
                                  >
                                    ⭐ Rate Seller
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* REVIEW FORM */}
                    {reviewing &&
                      reviewing.orderId ===
                        order.id && (
                        <div className="mt-6 rounded-2xl border bg-white p-5">
                          <h3 className="text-lg font-black">
                            Seller Rating
                          </h3>

                          <div className="mt-4 flex gap-2">
                            {[1, 2, 3, 4, 5].map(
                              (star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() =>
                                    setReviewForm(
                                      (
                                        current
                                      ) => ({
                                        ...current,
                                        rating:
                                          star,
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
                            value={
                              reviewForm.review
                            }
                            onChange={(event) =>
                              setReviewForm(
                                (current) => ({
                                  ...current,
                                  review:
                                    event.target
                                      .value,
                                })
                              )
                            }
                            placeholder="Write an optional review..."
                            rows={4}
                            className="mt-4 w-full rounded-2xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
                          />

                          {reviewMessage && (
                            <p className="mt-3 text-sm font-bold">
                              {reviewMessage}
                            </p>
                          )}

                          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                            <button
                              type="button"
                              disabled={
                                submittingReview
                              }
                              onClick={() =>
                                submitReview(
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
                                setReviewing(
                                  null
                                );

                                setReviewMessage(
                                  ""
                                );
                              }}
                              className="rounded-full border px-6 py-3 font-bold disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
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
