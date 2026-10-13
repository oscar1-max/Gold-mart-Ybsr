
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API = "https://goldmart-backend-yoxc.onrender.com/api";
const PAGE_SIZE = 20;

type RefundStatus =
  | "requested"
  | "under_review"
  | "approved"
  | "rejected"
  | "refund_pending"
  | "refunded"
  | "refund_failed";

type RefundRequest = {
  id: number;
  order_id: number;
  buyer_id: number;
  buyer_name: string | null;
  buyer_email: string | null;
  request_type: string;
  reason: string;
  status: RefundStatus;
  review_note: string | null;
  reviewed_by: number | null;
  provider_status: string | null;
  order_status: string;
  total_amount: string | number;
  created_at: string;
  updated_at: string;
};

const filters = [
  { value: "", label: "All Requests" },
  { value: "requested", label: "New Requests" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "refund_pending", label: "Refund Pending" },
  { value: "refunded", label: "Refunded" },
  { value: "refund_failed", label: "Refund Failed" },
];

function formatStatus(value: string) {
  return String(value || "Unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function statusStyle(status: RefundStatus) {
  switch (status) {
    case "approved":
    case "refunded":
      return "bg-emerald-50 text-emerald-800";

    case "rejected":
    case "refund_failed":
      return "bg-red-50 text-red-800";

    case "requested":
    case "under_review":
      return "bg-amber-50 text-amber-800";

    default:
      return "bg-blue-50 text-blue-800";
  }
}

function formatAmount(amount: string | number) {
  const value = Number(amount);

  return Number.isFinite(value)
    ? value.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "Unavailable";
}

async function readResponse(response: Response) {
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    if (response.status === 401) {
      throw new Error(
        "Your session expired. Please sign in again."
      );
    }

    if (response.status === 403) {
      throw new Error(
        "Administrator permission is required."
      );
    }

    throw new Error(
      data?.message ||
        `Request failed (${response.status}).`
    );
  }

  return data;
}

function errorText(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong.";
}

export default function AdminRefundsPage() {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const requestSequence = useRef(0);

  const loadRequests = useCallback(async () => {
    const sequence = ++requestSequence.current;
    const token = localStorage.getItem("goldmart_token");

    if (!token) {
      setRequests([]);
      setAccessDenied(true);
      setError(
        "Please sign in with your administrator account."
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setAccessDenied(false);

    try {
      const params = new URLSearchParams({
        page: String(page),
      });

      if (statusFilter) {
        params.set("status", statusFilter);
      }

      const response = await fetch(
        `${API}/admin/refunds?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      if (sequence !== requestSequence.current) {
        return;
      }

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        setAccessDenied(true);
        setRequests([]);
      }

      const data = await readResponse(response);

      if (sequence !== requestSequence.current) {
        return;
      }

      setRequests(
        Array.isArray(data.requests)
          ? data.requests
          : []
      );
    } catch (err) {
      if (sequence === requestSequence.current) {
        setRequests([]);
        setError(errorText(err));
      }
    } finally {
      if (sequence === requestSequence.current) {
        setLoading(false);
      }
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void loadRequests();

    return () => {
      requestSequence.current += 1;
    };
  }, [loadRequests]);

  async function reviewRequest(
    request: RefundRequest,
    decision: "approved" | "rejected"
  ) {
    if (savingId !== null || loading) {
      return;
    }

    if (
      request.status !== "requested" &&
      request.status !== "under_review"
    ) {
      setError(
        "This request is not awaiting an admin decision."
      );
      return;
    }

    const note = (notes[request.id] || "").trim();

    if (
      decision === "rejected" &&
      note.length < 10
    ) {
      setError(
        "Write at least 10 characters to explain a rejection."
      );
      return;
    }

    if (note.length > 2000) {
      setError(
        "Review notes cannot exceed 2000 characters."
      );
      return;
    }

    const confirmed = window.confirm(
      decision === "approved"
        ? `Approve request #${request.id} for processing? This records a review decision only; it does NOT transfer money or issue a Paystack refund.`
        : `Reject refund request #${request.id}? Make sure the reason is clear.`
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem(
      "goldmart_token"
    );

    if (!token) {
      setError(
        "Please sign in with your administrator account."
      );
      return;
    }

    setSavingId(request.id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API}/admin/refunds/${request.id}/review`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            decision,
            note,
          }),
        }
      );

      const data = await readResponse(response);

      setMessage(
        data.message ||
          `Request #${request.id} reviewed successfully.`
      );

      setNotes((old) => ({
        ...old,
        [request.id]: "",
      }));

      await loadRequests();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSavingId(null);
    }
  }

  // Statistics and search apply to the current
  // loaded page, not the entire database.

  const stats = useMemo(
    () => ({
      shown: requests.length,

      awaiting: requests.filter(
        (r) =>
          r.status === "requested" ||
          r.status === "under_review"
      ).length,

      approved: requests.filter(
        (r) => r.status === "approved"
      ).length,

      refunded: requests.filter(
        (r) => r.status === "refunded"
      ).length,
    }),
    [requests]
  );

  const visibleRequests = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return requests;
    }

    return requests.filter((r) =>
      [
        r.id,
        r.order_id,
        r.buyer_id,
        r.buyer_name,
        r.buyer_email,
        r.reason,
        r.request_type,
        r.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [requests, search]);

  return (
    <main className="min-h-screen bg-[#FAF8F3] pb-16 text-[#17191D]">
      <div className="h-1 bg-gradient-to-r from-[#96713D] via-[#E9D9BB] to-[#C5A46D]" />

      {/* HEADER */}

      <header className="border-b border-[#E8E1D5] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight"
          >
            Gold
            <span className="text-[#B08A50]">
              Mart
            </span>
          </Link>

          <Link
            href="/account"
            className="rounded-full border border-[#D7BF97] px-4 py-2 text-xs font-bold hover:bg-[#FAF8F3] sm:text-sm"
          >
            ← Admin Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* PREMIUM HERO */}

        <section className="relative overflow-hidden rounded-[28px] bg-[#17191D] p-7 text-white sm:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-14 h-52 w-52 rounded-full border border-[#C5A46D]/30"
          />

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E9D9BB]">
              GoldMart Administration
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Refund Management
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#E5DDD1]">
              Review cancellation and refund requests,
              record decisions, and track processing
              statuses.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/admin/reports"
                className="rounded-full border border-[#C5A46D]/60 px-5 py-2.5 text-sm font-bold hover:bg-white/10"
              >
                📋 Reports & Users
              </Link>

              <Link
                href="/admin/support"
                className="rounded-full bg-[#C5A46D] px-5 py-2.5 text-sm font-bold text-[#17191D] hover:bg-[#E9D9BB]"
              >
                🎧 Support Inbox
              </Link>
            </div>
          </div>
        </section>

        {/* FINANCIAL SAFETY NOTE */}

        <div className="mt-6 rounded-2xl border border-[#E2D5BE] bg-[#FFF9EE] p-4 text-sm leading-6 text-[#67502C]">
          <strong>Financial safety:</strong>{" "}
          Approving here records a review decision only.
          This page does not issue Paystack refunds,
          transfer money, or release seller payouts.
          "Approved" is not the same as "Refunded".
        </div>

        {/* FEEDBACK */}

        {message && (
          <div
            role="status"
            className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {/* ADMIN ACCESS */}

        {accessDenied ? (
          <section className="mt-8 rounded-3xl border border-[#E8E1D5] bg-white p-8 text-center shadow-sm">
            <div className="text-4xl">🔒</div>

            <h2 className="mt-4 text-xl font-black">
              Administrator Access Required
            </h2>

            <p className="mt-3 text-sm text-[#716B62]">
              Sign in with an account authorized by
              GoldMart's backend to manage refund
              requests.
            </p>

            <Link
              href="/login"
              className="mt-6 inline-block rounded-full bg-[#17191D] px-6 py-3 text-sm font-bold text-white"
            >
              Sign In
            </Link>
          </section>
        ) : (
          <>
            {/* OVERVIEW */}

            <section className="mt-9">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#96713D]">
                    Refund Operations
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    Page {page} Overview
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => void loadRequests()}
                  disabled={
                    loading ||
                    savingId !== null
                  }
                  className="rounded-full border border-[#D7BF97] bg-white px-5 py-2.5 text-sm font-bold hover:bg-[#F5F1E9] disabled:opacity-50"
                >
                  {loading
                    ? "Loading..."
                    : "↻ Refresh Requests"}
                </button>
              </div>

              {/* STATS */}

              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  {
                    label: "Requests on Page",
                    value: stats.shown,
                    icon: "📋",
                  },
                  {
                    label: "Awaiting Review",
                    value: stats.awaiting,
                    icon: "⏳",
                  },
                  {
                    label: "Approved",
                    value: stats.approved,
                    icon: "✅",
                  },
                  {
                    label: "Refunded",
                    value: stats.refunded,
                    icon: "💳",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[22px] border border-[#E8E1D5] bg-white p-4 shadow-sm sm:p-5"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5F1E9] text-xl">
                      {item.icon}
                    </span>

                    <p className="mt-4 text-xs font-semibold text-[#716B62]">
                      {item.label}
                    </p>

                    <p className="mt-1 text-3xl font-black">
                      {loading || error
                        ? "—"
                        : item.value}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-xs leading-5 text-[#716B62]">
                Counts show the currently loaded page
                only. They are not marketplace-wide totals.
              </p>
            </section>

            {/* SEARCH AND FILTER */}

            <section className="mt-8 rounded-3xl border border-[#E8E1D5] bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-black">
                Find Refund Requests
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
                <div>
                  <label
                    htmlFor="refund-search"
                    className="mb-2 block text-xs font-bold text-[#716B62]"
                  >
                    Search this page
                  </label>

                  <input
                    id="refund-search"
                    type="search"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Request ID, order, buyer, reason..."
                    className="w-full rounded-xl border border-[#DDD5C8] px-4 py-3 text-sm outline-none focus:border-[#B08A50]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="refund-filter"
                    className="mb-2 block text-xs font-bold text-[#716B62]"
                  >
                    Filter by status
                  </label>

                  <select
                    id="refund-filter"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                      setSearch("");
                      setMessage("");
                    }}
                    disabled={
                      savingId !== null
                    }
                    className="w-full rounded-xl border border-[#DDD5C8] bg-white px-4 py-3 text-sm outline-none focus:border-[#B08A50] disabled:opacity-50"
                  >
                    {filters.map((filter) => (
                      <option
                        key={filter.value}
                        value={filter.value}
                      >
                        {filter.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="mt-3 text-xs text-[#716B62]">
                Search checks the currently loaded page.
                Change pages to inspect older requests.
              </p>
            </section>

            {/* LOADING */}

            {loading && (
              <div className="mt-6 rounded-3xl border border-[#E8E1D5] bg-white p-10 text-center text-sm text-[#716B62]">
                Loading refund requests...
              </div>
            )}

            {/* NO REQUESTS */}

            {!loading &&
              !error &&
              visibleRequests.length === 0 && (
                <div className="mt-6 rounded-3xl border border-[#E8E1D5] bg-white p-10 text-center">
                  <p className="text-4xl">
                    📭
                  </p>

                  <h3 className="mt-4 text-xl font-black">
                    {requests.length === 0
                      ? "No refund requests found"
                      : "No matching requests"}
                  </h3>

                  <p className="mt-2 text-sm text-[#716B62]">
                    {requests.length === 0
                      ? "Buyer refund or cancellation requests will appear here when available."
                      : "Try a different search, or browse another page."}
                  </p>
                </div>
              )}

            {/* REFUND REQUESTS */}

            {!loading &&
              !error && (
                <section className="mt-6 space-y-5">
                  {visibleRequests.map((request) => {
                    const canReview =
                      request.status ===
                        "requested" ||
                      request.status ===
                        "under_review";

                    const saving =
                      savingId === request.id;

                    return (
                      <article
                        key={request.id}
                        className="overflow-hidden rounded-[24px] border border-[#E8E1D5] bg-white shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E8E1D5] p-5 sm:p-7">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-[#96713D]">
                              Refund Request #
                              {request.id}
                            </p>

                            <h3 className="mt-2 text-xl font-black">
                              Order #
                              {request.order_id}
                            </h3>

                            <p className="mt-2 text-xs text-[#716B62]">
                              Requested{" "}
                              {formatDate(
                                request.created_at
                              )}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-4 py-2 text-xs font-bold ${statusStyle(
                              request.status
                            )}`}
                          >
                            {formatStatus(
                              request.status
                            )}
                          </span>
                        </div>

                        {/* BUYER AND ORDER */}

                        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
                          <div className="rounded-2xl bg-[#FAF8F3] p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-[#96713D]">
                              Buyer
                            </p>

                            <p className="mt-2 break-words font-black">
                              {request.buyer_name ||
                                `User #${request.buyer_id}`}
                            </p>

                            <p className="mt-1 break-all text-sm text-[#716B62]">
                              {request.buyer_email ||
                                "Email unavailable"}
                            </p>

                            <p className="mt-1 text-xs text-[#716B62]">
                              Buyer ID:{" "}
                              {request.buyer_id}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-[#FAF8F3] p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-[#96713D]">
                              Request Details
                            </p>

                            <p className="mt-2 font-black">
                              {formatStatus(
                                request.request_type
                              )}
                            </p>

                            <p className="mt-1 text-sm text-[#716B62]">
                              Order:{" "}
                              {formatStatus(
                                request.order_status
                              )}
                            </p>

                            <p className="mt-1 text-sm text-[#716B62]">
                              Order total:{" "}
                              {formatAmount(
                                request.total_amount
                              )}{" "}
                              <span className="text-xs">
                                (currency not verified)
                              </span>
                            </p>

                            {request.provider_status && (
                              <p className="mt-1 text-sm text-[#716B62]">
                                Provider status:{" "}
                                {formatStatus(
                                  request.provider_status
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* CUSTOMER REASON */}

                        <div className="mx-5 rounded-2xl border border-[#E8E1D5] p-4 sm:mx-7">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#96713D]">
                            Buyer's Explanation
                          </p>

                          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[#514C45]">
                            {request.reason ||
                              "No reason provided."}
                          </p>
                        </div>

                        {/* PREVIOUS ADMIN NOTE */}

                        {request.review_note && (
                          <div className="mx-5 mt-4 rounded-2xl border border-[#E8E1D5] bg-[#FFFDF8] p-4 sm:mx-7">
                            <p className="text-xs font-bold uppercase tracking-wide text-[#96713D]">
                              Previous Admin Review
                            </p>

                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[#514C45]">
                              {request.review_note}
                            </p>
                          </div>
                        )}

                        {/* REVIEW ACTIONS */}

                        {canReview ? (
                          <div className="mt-6 border-t border-[#E8E1D5] p-5 sm:p-7">
                            <label
                              htmlFor={`note-${request.id}`}
                              className="block text-sm font-bold"
                            >
                              Admin Review Note
                            </label>

                            <p className="mt-1 text-xs leading-5 text-[#716B62]">
                              Explain your decision.
                              Rejections require at least
                              10 characters.
                            </p>

                            <textarea
                              id={`note-${request.id}`}
                              value={
                                notes[
                                  request.id
                                ] || ""
                              }
                              onChange={(e) =>
                                setNotes(
                                  (old) => ({
                                    ...old,
                                    [request.id]:
                                      e.target
                                        .value,
                                  })
                                )
                              }
                              maxLength={2000}
                              rows={3}
                              disabled={
                                savingId !== null
                              }
                              placeholder="Write your review note..."
                              className="mt-3 w-full resize-y rounded-xl border border-[#DDD5C8] p-4 text-sm outline-none focus:border-[#B08A50] disabled:opacity-50"
                            />

                            <div className="mt-4 flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  void reviewRequest(
                                    request,
                                    "approved"
                                  )
                                }
                                disabled={
                                  savingId !== null
                                }
                                className="rounded-full bg-[#17191D] px-5 py-3 text-sm font-bold text-white hover:bg-[#96713D] disabled:opacity-50"
                              >
                                {saving
                                  ? "Saving..."
                                  : "Approve for Processing"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void reviewRequest(
                                    request,
                                    "rejected"
                                  )
                                }
                                disabled={
                                  savingId !== null
                                }
                                className="rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-800 hover:bg-red-100 disabled:opacity-50"
                              >
                                Reject Request
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-6 border-t border-[#E8E1D5] px-5 py-4 text-xs leading-6 text-[#716B62] sm:px-7">
                            This request is not awaiting
                            an admin decision. Financial
                            processing, when applicable,
                            is handled separately.
                          </div>
                        )}
                      </article>
                    );
                  })}
                </section>
              )}

            {/* PAGINATION */}

            {!loading &&
              !error && (
                <nav
                  aria-label="Refund request pages"
                  className="mt-8 flex flex-wrap items-center justify-center gap-4"
                >
                  <button
                    type="button"
                    disabled={
                      page === 1 ||
                      savingId !== null
                    }
                    onClick={() => {
                      setPage((old) =>
                        Math.max(
                          1,
                          old - 1
                        )
                      );
                      setSearch("");
                    }}
                    className="rounded-full border border-[#D7BF97] bg-white px-5 py-3 text-sm font-bold disabled:opacity-40"
                  >
                    ← Previous
                  </button>

                  <span className="text-sm font-bold">
                    Page {page}
                  </span>

                  <button
                    type="button"
                    disabled={
                      requests.length <
                        PAGE_SIZE ||
                      savingId !== null
                    }
                    onClick={() => {
                      setPage(
                        (old) =>
                          old + 1
                      );
                      setSearch("");
                    }}
                    className="rounded-full border border-[#D7BF97] bg-white px-5 py-3 text-sm font-bold disabled:opacity-40"
                  >
                    Next →
                  </button>
                </nav>
              )}
          </>
        )}

        <p className="mt-9 text-center text-xs leading-6 text-[#716B62]">
          GoldMart Refund Administration ·
          Review decisions only ·
          No direct refunds or transfers
        </p>
      </div>
    </main>
  );
}
