
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API =
  "https://goldmart-backend-yoxc.onrender.com/api";

type Order = {
  id: number;
  status: string;
  created_at: string;
};

type RefundRequest = {
  id: number;
  request_type: string;
  reason: string;
  status: string;
  review_note?: string | null;
  provider_status?: string | null;
  created_at: string;
};

type Protection = {
  refund_request: RefundRequest | null;
  delivery_confirmation: {
    confirmed_at: string;
  } | null;
};

function formatDate(value?: string) {
  if (!value) return "Unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function readableStatus(value?: string) {
  return String(value || "Unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.message ||
        `Request failed (${response.status}).`
    );
  }

  return data;
}

export default function OrderProtectionPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedId, setSelectedId] =
    useState<number | null>(null);

  const [protection, setProtection] =
    useState<Protection | null>(null);

  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] =
    useState(false);
  const [busy, setBusy] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedOrder =
    orders.find(
      (order) => Number(order.id) === selectedId
    ) || null;

  const orderStatus = String(
    selectedOrder?.status || ""
  ).toLowerCase();

  const hasRequest =
    Boolean(protection?.refund_request);

  const confirmed =
    Boolean(protection?.delivery_confirmation);

  const canConfirm =
    orderStatus === "delivered" &&
    !hasRequest &&
    !confirmed;

  const requestLabel = [
    "pending",
    "processing",
  ].includes(orderStatus)
    ? "Request Cancellation"
    : "Request Return / Refund";

  function getToken() {
    return localStorage.getItem("goldmart_token");
  }

  async function loadProtection(orderId: number) {
    const token = getToken();

    if (!token) {
      throw new Error("Please sign in again.");
    }

    const response = await fetch(
      `${API}/order-protection/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const data = await parseResponse(response);

    return {
      refund_request: data.refund_request || null,
      delivery_confirmation:
        data.delivery_confirmation || null,
    } as Protection;
  }

  // Load the buyer's orders.

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      const token = getToken();

      if (!token) {
        if (active) {
          setSignedOut(true);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(
          `${API}/orders`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        const data = await parseResponse(response);

        const list: Order[] = Array.isArray(
          data.orders
        )
          ? data.orders
          : [];

        if (!active) return;

        setOrders(list);

        if (list.length > 0) {
          const queryId = Number(
            new URLSearchParams(
              window.location.search
            ).get("orderId")
          );

          const matchingOrder = list.find(
            (order) =>
              Number(order.id) === queryId
          );

          setSelectedId(
            Number(
              matchingOrder?.id || list[0].id
            )
          );
        }

        setError("");
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load orders."
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
  }, []);

  // Load protection status whenever
  // the selected order changes.

  useEffect(() => {
    if (selectedId === null) return;

    let active = true;

    setProtection(null);
    setDetailsLoading(true);
    setReason("");
    setError("");
    setMessage("");

    loadProtection(selectedId)
      .then((data) => {
        if (active) setProtection(data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load protection details."
          );
        }
      })
      .finally(() => {
        if (active) {
          setDetailsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedId]);

  // Submit a cancellation or refund request.

  async function requestRefund() {
    if (!selectedId || busy || detailsLoading) {
      return;
    }

    const trimmedReason = reason.trim();

    if (
      trimmedReason.length < 10 ||
      trimmedReason.length > 2000
    ) {
      setError(
        "Please enter a reason between 10 and 2000 characters."
      );
      return;
    }

    const token = getToken();

    if (!token) {
      setError("Please sign in again.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/order-protection/${selectedId}/refund-request`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: trimmedReason,
          }),
        }
      );

      const data = await parseResponse(response);

      setMessage(
        data.message ||
          "Your request has been submitted."
      );

      setReason("");

      setProtection(
        await loadProtection(selectedId)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Request failed."
      );
    } finally {
      setBusy(false);
    }
  }

  // The buyer confirms actual receipt.

  async function confirmDelivery() {
    if (
      !selectedId ||
      busy ||
      detailsLoading ||
      !canConfirm
    ) {
      return;
    }

    const agreed = window.confirm(
      "Confirm delivery only if you have actually received your order and checked the items. Do you want to confirm?"
    );

    if (!agreed) return;

    const token = getToken();

    if (!token) {
      setError("Please sign in again.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/order-protection/${selectedId}/confirm-delivery`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await parseResponse(response);

      setMessage(
        data.message ||
          "Delivery confirmed successfully."
      );

      setProtection(
        await loadProtection(selectedId)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not confirm delivery."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FFFFFF] pb-28 text-[#14263D] md:pb-14">
      <section aria-label="Buyer protection introduction" className="relative mx-auto mt-5 max-w-7xl overflow-hidden rounded-[27px] px-6 py-8 text-white shadow-[0_15px_35px_rgba(25,39,46,0.13)] sm:mt-8 sm:px-10 sm:py-12" style={{ background: "linear-gradient(135deg, #14263D 0%, #243B53 50%, #FF6B00 100%)" }}>
        <div className="pointer-events-none absolute -right-8 -top-14 text-[150px] leading-none opacity-10" aria-hidden="true">🛡️</div>
        <div className="relative">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#FFE9CC]">GoldMart · Buyer protection</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">Support for every purchase.</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/85">Review your orders, raise requests and confirm delivery when your order arrives.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/shop" className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/25">Shop All ↗</Link>
            <Link href="/track-order" className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/25">Track Order ↗</Link>
            <Link href="/help" className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/25">Help Centre ↗</Link>
          </div>
        </div>
      </section>

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-5">
          <Link
            href="/"
            className="text-2xl font-black"
          >
            Gold
            <span className="text-[#FF6B00]">
              Mart
            </span>
          </Link>

          <Link
            href="/orders"
            className="rounded-xl border px-4 py-2 text-sm font-semibold"
          >
            My Orders
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-xs font-bold uppercase tracking-widest text-[#FF6B00]">
          GoldMart Customer Care
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Buyer Protection
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-600">
          Request an order cancellation or refund,
          check your request status, and confirm
          when your purchase has arrived.
        </p>

        {signedOut && (
          <div className="mt-8 rounded-2xl border border-[#FFF8F2] bg-white shadow-[0_5px_18px_rgba(24,42,50,0.045)] p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold">
              Sign in required
            </h2>

            <p className="mt-2 text-gray-600">
              Sign in to manage your orders.
            </p>

            <Link
              href="/login"
              className="mt-5 inline-block rounded-xl bg-black px-6 py-3 font-bold text-white"
            >
              Sign In
            </Link>
          </div>
        )}

        {loading && !signedOut && (
          <div className="mt-8 rounded-2xl border border-[#FFF8F2] bg-white shadow-[0_5px_18px_rgba(24,42,50,0.045)] p-8 text-center">
            Loading your orders...
          </div>
        )}

        {!loading &&
          !signedOut &&
          orders.length === 0 &&
          !error && (
            <div className="mt-8 rounded-2xl border border-[#FFF8F2] bg-white shadow-[0_5px_18px_rgba(24,42,50,0.045)] p-8 text-center">
              <p className="text-3xl">📦</p>
              <h2 className="mt-3 text-xl font-bold">
                No orders found
              </h2>
              <p className="mt-2 text-gray-600">
                Your purchases will appear here
                once you have placed an order.
              </p>

              <Link
                href="/shop"
                className="mt-5 inline-block rounded-xl bg-black px-6 py-3 font-bold text-white"
              >
                Shop Now
              </Link>
            </div>
          )}

        {!loading &&
          !signedOut &&
          orders.length > 0 && (
            <div className="mt-8 space-y-5">
              <div className="rounded-2xl border border-[#FFF8F2] bg-white shadow-[0_5px_18px_rgba(24,42,50,0.045)] p-6 shadow-sm">
                <label
                  htmlFor="order-select"
                  className="block text-sm font-bold"
                >
                  Select your order
                </label>

                <select
                  id="order-select"
                  value={selectedId ?? ""}
                  onChange={(event) =>
                    setSelectedId(
                      Number(event.target.value)
                    )
                  }
                  disabled={busy}
                  className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                >
                  {orders.map((order) => (
                    <option
                      key={order.id}
                      value={order.id}
                    >
                      Order #{order.id} —{" "}
                      {readableStatus(order.status)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedOrder && (
                <div className="rounded-2xl border border-[#FFF8F2] bg-white shadow-[0_5px_18px_rgba(24,42,50,0.045)] p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500">
                        Selected Order
                      </p>

                      <h2 className="mt-1 text-2xl font-black">
                        #{selectedOrder.id}
                      </h2>

                      <p className="mt-2 text-sm text-gray-500">
                        Placed{" "}
                        {formatDate(
                          selectedOrder.created_at
                        )}
                      </p>
                    </div>

                    <span className="rounded-full bg-[#FFF8F2] px-4 py-2 text-sm font-bold text-[#FF6B00]">
                      {readableStatus(
                        selectedOrder.status
                      )}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3 border-t pt-5">
                    <Link
                      href="/track-order"
                      className="rounded-xl border px-4 py-3 text-sm font-bold"
                    >
                      Track Order
                    </Link>

                    <Link
                      href="/chat"
                      className="rounded-xl border px-4 py-3 text-sm font-bold"
                    >
                      Messages
                    </Link>
                  </div>
                </div>
              )}

              {detailsLoading && (
                <div className="rounded-2xl border border-[#FFF8F2] bg-white shadow-[0_5px_18px_rgba(24,42,50,0.045)] p-6">
                  Loading buyer protection details...
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700"
                >
                  {error}
                </div>
              )}

              {message && (
                <div
                  role="status"
                  className="rounded-2xl border border-orange-200 bg-orange-50 p-5 text-sm font-medium text-orange-800"
                >
                  {message}
                </div>
              )}

              {!detailsLoading &&
                protection &&
                selectedOrder && (
                  <>
                    {/* EXISTING REFUND REQUEST */}

                    {protection.refund_request && (
                      <div className="rounded-2xl border border-[#FFF8F2] bg-white shadow-[0_5px_18px_rgba(24,42,50,0.045)] p-6 shadow-sm">
                        <h2 className="text-xl font-black">
                          Refund Request Status
                        </h2>

                        <p className="mt-4 text-sm text-gray-500">
                          Request Type
                        </p>
                        <p className="font-bold">
                          {readableStatus(
                            protection.refund_request
                              .request_type
                          )}
                        </p>

                        <p className="mt-4 text-sm text-gray-500">
                          Current Status
                        </p>
                        <p className="font-bold text-[#FF6B00]">
                          {readableStatus(
                            protection.refund_request
                              .status
                          )}
                        </p>

                        <p className="mt-4 text-sm text-gray-500">
                          Your Reason
                        </p>
                        <p className="whitespace-pre-wrap text-sm">
                          {
                            protection.refund_request
                              .reason
                          }
                        </p>

                        {protection.refund_request
                          .review_note && (
                          <>
                            <p className="mt-4 text-sm text-gray-500">
                              Support Response
                            </p>
                            <p className="text-sm">
                              {
                                protection
                                  .refund_request
                                  .review_note
                              }
                            </p>
                          </>
                        )}

                        <p className="mt-5 text-xs text-gray-500">
                          A submitted request does
                          not mean that money has
                          already been refunded.
                        </p>
                      </div>
                    )}

                    {/* NEW REFUND REQUEST */}

                    {!hasRequest && (
                      <div className="rounded-2xl border border-[#FFF8F2] bg-white shadow-[0_5px_18px_rgba(24,42,50,0.045)] p-6 shadow-sm">
                        <h2 className="text-xl font-black">
                          {requestLabel}
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          Explain why you want to
                          cancel or return this
                          order. GoldMart will review
                          your request. Approval
                          and any refund are separate
                          steps.
                        </p>

                        <label
                          htmlFor="reason"
                          className="mt-5 block text-sm font-bold"
                        >
                          Reason for request
                        </label>

                        <textarea
                          id="reason"
                          value={reason}
                          onChange={(event) =>
                            setReason(
                              event.target.value
                            )
                          }
                          rows={5}
                          maxLength={2000}
                          placeholder="Explain the problem with your order..."
                          className="mt-2 w-full rounded-xl border border-gray-300 p-4 text-sm outline-none focus:border-[#FF6B00]"
                        />

                        <p className="mt-1 text-xs text-gray-500">
                          Minimum 10 characters.
                          Maximum 2000.
                        </p>

                        <button
                          type="button"
                          onClick={requestRefund}
                          disabled={
                            busy ||
                            reason.trim().length < 10
                          }
                          className="mt-5 w-full rounded-xl bg-[#FF6B00] px-5 py-3 font-black text-black disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busy
                            ? "Submitting..."
                            : requestLabel}
                        </button>
                      </div>
                    )}

                    {/* DELIVERY CONFIRMATION */}

                    <div className="rounded-2xl border border-[#FFF8F2] bg-white shadow-[0_5px_18px_rgba(24,42,50,0.045)] p-6 shadow-sm">
                      <h2 className="text-xl font-black">
                        Confirm Delivery
                      </h2>

                      {confirmed ? (
                        <div className="mt-4 rounded-xl bg-orange-50 p-4 text-sm text-orange-800">
                          ✓ You confirmed receiving
                          this order on{" "}
                          {formatDate(
                            protection
                              .delivery_confirmation
                              ?.confirmed_at
                          )}
                          .
                        </div>
                      ) : (
                        <>
                          <p className="mt-3 text-sm leading-6 text-gray-600">
                            Only confirm after the
                            goods have arrived and
                            you have checked them.
                            Do not confirm just
                            because the seller says
                            the order was delivered.
                          </p>

                          {hasRequest && (
                            <p className="mt-3 text-sm text-amber-700">
                              Delivery confirmation
                              is unavailable while a
                              refund or cancellation
                              request exists.
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={confirmDelivery}
                            disabled={
                              !canConfirm || busy
                            }
                            className="mt-5 w-full rounded-xl bg-black px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {busy
                              ? "Please wait..."
                              : "I Have Received My Order"}
                          </button>

                          {!canConfirm &&
                            !hasRequest && (
                              <p className="mt-3 text-xs text-gray-500">
                                This button becomes
                                available when the
                                order is marked as
                                delivered.
                              </p>
                            )}
                        </>
                      )}
                    </div>
                  </>
                )}
            </div>
          )}

        <p className="mt-8 text-xs leading-5 text-gray-500">
          GoldMart records buyer protection requests
          and delivery confirmations. Payment
          refunds require separate approval and
          processing. Seller payouts are not
          automatically released by this page.
        </p>
      </section>
    </main>
  );
}
