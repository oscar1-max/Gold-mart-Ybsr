
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

type Allocation = {
  id: number;
  order_id: number;
  currency: string;
  gross_minor: string;
  status: string;
  order_status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
};

type SummaryRow = {
  currency: string;
  status: string;
  allocation_count: number;
  gross_minor: string;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  allocations?: Allocation[];
  summary?: {
    by_currency_and_status?: SummaryRow[];
    total_records?: number;
    page?: number;
    page_size?: number;
    has_next_page?: boolean;
  };
};

function money(minor: string, currency: string) {
  const raw = String(minor ?? "").trim();

  if (!/^\d+$/.test(raw)) {
    return "Amount unavailable";
  }

  const padded = raw.padStart(3, "0");

  const whole = padded
    .slice(0, -2)
    .replace(/^0+(?=\d)/, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const cents = padded.slice(-2);

  const symbol =
    currency === "USD"
      ? "$"
      : currency === "NGN"
        ? "₦"
        : "";

  return `${currency} ${symbol}${whole}.${cents}`;
}

function labelStatus(status: string) {
  const labels: Record<string, string> = {
    pending_review: "Pending Review",
    blocked: "Blocked",
    eligible: "Marked Eligible",
    settled: "Marked Settled",
    voided: "Voided",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    success: "Verified",
    pending: "Pending",
    failed: "Failed",
    needs_review: "Needs Review",
  };

  return (
    labels[status] ||
    status.replace(/_/g, " ")
  );
}

function statusStyle(status: string) {
  if (status === "pending_review") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (
    status === "blocked" ||
    status === "voided" ||
    status === "failed" ||
    status === "cancelled"
  ) {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (
    status === "eligible" ||
    status === "settled" ||
    status === "success" ||
    status === "delivered"
  ) {
    return "border-orange-200 bg-orange-50 text-orange-800";
  }

  return "border-[#FFF8F2] bg-[#FFFFFF] text-[#243B53]";
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusStyle(
        status
      )}`}
    >
      {labelStatus(status)}
    </span>
  );
}

export default function SellerPaymentProtectionPage() {
  const [allocations, setAllocations] = useState<
    Allocation[]
  >([]);

  const [summaryRows, setSummaryRows] = useState<
    SummaryRow[]
  >([]);

  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] =
    useState(false);

  const [totalRecords, setTotalRecords] =
    useState(0);

  const [hasNextPage, setHasNextPage] =
    useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAllocations() {
      setLoading(true);
      setError("");
      setNeedsLogin(false);

      const token =
        localStorage.getItem("goldmart_token");

      if (!token) {
        setNeedsLogin(true);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/seller/payment-protection?page=${page}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data: ApiResponse =
          await response.json();

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          throw new Error(
            "Please sign in with an authorized seller account."
          );
        }

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Could not load payment protection records."
          );
        }

        if (controller.signal.aborted) return;

        setAllocations(
          Array.isArray(data.allocations)
            ? data.allocations
            : []
        );

        setSummaryRows(
          Array.isArray(
            data.summary?.by_currency_and_status
          )
            ? data.summary
                ?.by_currency_and_status || []
            : []
        );

        setTotalRecords(
          Number(data.summary?.total_records) || 0
        );

        setHasNextPage(
          Boolean(data.summary?.has_next_page)
        );
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load seller records."
        );

        setAllocations([]);
        setSummaryRows([]);
        setTotalRecords(0);
        setHasNextPage(false);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadAllocations();

    return () => controller.abort();
  }, [page, refreshKey]);

  function refresh() {
    setRefreshKey((value) => value + 1);
  }

  return (
    <main className="min-h-screen bg-[#FFF8F2] pb-28 text-[#243B53] md:pb-14">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <section className="relative overflow-hidden rounded-[30px] px-6 py-9 text-white shadow-[0_18px_38px_rgba(24,51,62,0.16)] sm:px-10 sm:py-12" style={{background:"linear-gradient(135deg, #14263D 0%, #243B53 50%, #FF6B00 100%)"}}>
          <div className="pointer-events-none absolute -right-10 -top-20 h-60 w-60 rounded-full border-[32px] border-white/10" aria-hidden="true"/>
          <div className="relative"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FFE9CC]">GOLDMART SELLER STUDIO · Finance Ledger</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Clarity for your records.</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/85">Review recorded allocations and their review status. Withdrawals remain unavailable.</p></div>
        </section>
        <nav aria-label="Seller Studio navigation" className="og-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2">
          <Link href="/seller" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Dashboard</Link>
          <Link href="/seller/products" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Catalogue</Link>
          <Link href="/seller/products/new" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Add Product</Link>
          <Link href="/seller/orders" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Orders</Link>
          <Link href="/seller/payment-protection" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Finance</Link>
          <Link href="/chat" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Messages</Link>
          <Link href="/account" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Account</Link>
        </nav>
      </div>

      <div className="h-1 bg-gradient-to-r from-[#243B53] via-[#FFF8F2] to-[#FF6B00]" />

      <header className="border-b border-[#FFF8F2] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <Link
            href="/seller"
            className="text-sm font-bold text-[#243B53] hover:underline"
          >
            ← Seller Dashboard
          </Link>

          <span className="text-lg font-black">
            Gold
            <span className="text-[#FF6B00]">
              Mart
            </span>
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-[28px] bg-[#243B53] px-6 py-8 text-white sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFF8F2]">
            Seller Finance
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            🛡️ Payment Protection
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#FFF8F2]">
            View your recorded portions of verified
            GoldMart orders and their current review
            status. This page is for tracking only.
          </p>

          <div className="mt-6 rounded-2xl border border-[#FF6B00]/40 bg-white/10 p-4 text-sm leading-6 text-[#FFF8F2]">
            These figures are not available balances,
            money held in escrow, or proof of Paystack
            settlement. Payouts and withdrawals are
            not enabled.
          </div>
        </section>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#243B53]">
              Payment Records
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Seller Allocations
            </h2>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="rounded-full border border-[#FFE9CC] bg-white px-5 py-3 text-sm font-bold transition hover:bg-[#FFF8F2] disabled:opacity-60"
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>

        {needsLogin && (
          <section className="mt-6 rounded-2xl border border-[#FFF8F2] bg-white p-6">
            <p className="font-semibold">
              Please sign in to see your seller records.
            </p>

            <Link
              href="/login"
              className="mt-4 inline-flex rounded-full bg-[#14263D] px-5 py-3 text-sm font-bold text-white"
            >
              Sign In →
            </Link>
          </section>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {!needsLogin && !error && (
          <>
            <section className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#FFF8F2] bg-white p-6">
                <p className="text-sm text-[#FF6B00]">
                  Allocation Records
                </p>

                <p className="mt-2 text-3xl font-black">
                  {loading ? "..." : totalRecords}
                </p>
              </div>

              <div className="rounded-2xl border border-[#FFF8F2] bg-white p-6">
                <p className="text-sm text-[#FF6B00]">
                  Withdrawal Availability
                </p>

                <p className="mt-2 text-xl font-black text-[#243B53]">
                  Not Enabled
                </p>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-xl font-black">
                Recorded Totals
              </h2>

              <p className="mt-1 text-sm text-[#FF6B00]">
                Amounts are separated by currency
                and review status.
              </p>

              {summaryRows.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-[#FFF8F2] bg-white p-6 text-sm text-[#FF6B00]">
                  {loading
                    ? "Loading totals..."
                    : "No allocations recorded yet."}
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {summaryRows.map((row, index) => (
                    <div
                      key={`${row.currency}-${row.status}-${index}`}
                      className="rounded-2xl border border-[#FFF8F2] bg-white p-5"
                    >
                      <StatusBadge status={row.status} />

                      <p className="mt-4 break-words text-xl font-black">
                        {money(
                          row.gross_minor,
                          row.currency
                        )}
                      </p>

                      <p className="mt-2 text-xs text-[#FF6B00]">
                        {row.allocation_count} recorded
                        allocation(s)
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-9">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-xl font-black">
                  Allocation History
                </h2>

                <p className="text-xs font-medium text-[#FF6B00]">
                  Page {page}
                </p>
              </div>

              {loading ? (
                <div className="mt-4 rounded-2xl border border-[#FFF8F2] bg-white p-8 text-center text-sm text-[#FF6B00]">
                  Loading seller allocation records...
                </div>
              ) : allocations.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-[#FFF8F2] bg-white p-8 text-center">
                  <div className="text-3xl">
                    📋
                  </div>

                  <h3 className="mt-3 font-black">
                    No records on this page
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#FF6B00]">
                    New allocation records are created
                    when eligible verified payments
                    become completed order records.
                    Earlier orders are not automatically
                    included.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {allocations.map((allocation) => (
                    <article
                      key={allocation.id}
                      className="rounded-2xl border border-[#FFF8F2] bg-white p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#243B53]">
                            Order #{allocation.order_id}
                          </p>

                          <h3 className="mt-2 break-words text-xl font-black">
                            {money(
                              allocation.gross_minor,
                              allocation.currency
                            )}
                          </h3>
                        </div>

                        <StatusBadge
                          status={allocation.status}
                        />
                      </div>

                      <div className="mt-5 grid gap-4 border-t border-[#FFF8F2] pt-4 sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-[#FF6B00]">
                            Order Status
                          </p>

                          <div className="mt-2">
                            <StatusBadge
                              status={
                                allocation.order_status
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-[#FF6B00]">
                            Payment Record
                          </p>

                          <div className="mt-2">
                            <StatusBadge
                              status={
                                allocation.payment_status
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-[#FF6B00]">
                            Recorded
                          </p>

                          <p className="mt-2 text-sm font-bold">
                            {new Date(
                              allocation.created_at
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <p className="mt-5 text-xs leading-5 text-[#FF6B00]">
                        This amount is a gross order
                        allocation before commissions,
                        fees, refunds and settlement
                        adjustments.
                      </p>
                    </article>
                  ))}
                </div>
              )}

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setPage((value) =>
                      Math.max(1, value - 1)
                    )
                  }
                  disabled={loading || page === 1}
                  className="rounded-full border border-[#FFE9CC] bg-white px-5 py-3 text-sm font-bold disabled:opacity-40"
                >
                  ← Previous
                </button>

                <span className="text-sm font-bold">
                  Page {page}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPage((value) => value + 1)
                  }
                  disabled={loading || !hasNextPage}
                  className="rounded-full bg-[#14263D] px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </section>
          </>
        )}

        <section className="mt-10 rounded-2xl border border-[#FFE9CC] bg-[#FFFFFF] p-5 sm:p-7">
          <h2 className="text-lg font-black">
            What does Pending Review mean?
          </h2>

          <p className="mt-3 text-sm leading-7 text-[#243B53]">
            GoldMart has recorded the seller portion
            of an order, but it has not confirmed
            that the amount is eligible for payout.
            Delivery, disputes, refunds, payment
            settlement and marketplace rules must
            still be checked.
          </p>

          <Link
            href="/seller"
            className="mt-5 inline-flex rounded-full bg-[#14263D] px-5 py-3 text-sm font-bold text-white"
          >
            Back to Seller Dashboard →
          </Link>
        </section>
      </div>
    </main>
  );
}
