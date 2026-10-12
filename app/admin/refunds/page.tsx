
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

const API =
  "https://goldmart-backend-yoxc.onrender.com/api";

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
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusStyle(status: string) {
  switch (status) {
    case "approved":
    case "refunded":
      return "bg-green-100 text-green-800";

    case "rejected":
    case "refund_failed":
      return "bg-red-100 text-red-800";

    case "requested":
    case "under_review":
      return "bg-amber-100 text-amber-800";

    default:
      return "bg-blue-100 text-blue-800";
  }
}

async function readResponse(response: Response) {
  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.message ||
        `Request failed (${response.status}).`
    );
  }

  return data;
}

export default function AdminRefundsPage() {
  const [requests, setRequests] = useState<
    RefundRequest[]
  >([]);

  const [statusFilter, setStatusFilter] =
    useState("");

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<
    number | null
  >(null);

  const [accessDenied, setAccessDenied] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [notes, setNotes] = useState<
    Record<number, string>
  >({});

  // ================================================
  // LOAD ADMIN REFUND REQUESTS
  // ================================================

  const loadRequests = useCallback(
    async () => {
      const token = localStorage.getItem(
        "goldmart_token"
      );

      if (!token) {
        setAccessDenied(true);
        setLoading(false);
        setError(
          "Please sign in with your administrator account."
        );
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
          `${API}/admin/refunds?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          setAccessDenied(true);
          setRequests([]);

          throw new Error(
            response.status === 403
              ? "Access denied. Only authorized GoldMart administrators can view this page."
              : "Your session has expired. Please sign in again."
          );
        }

        const data = await readResponse(response);

        setRequests(
          Array.isArray(data.requests)
            ? data.requests
            : []
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load requests."
        );
      } finally {
        setLoading(false);
      }
    },
    [page, statusFilter]
  );

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  // ================================================
  // APPROVE OR REJECT A REFUND REQUEST
  // ================================================

  async function reviewRequest(
    request: RefundRequest,
    decision: "approved" | "rejected"
  ) {
    if (savingId !== null) return;

    const note = (
      notes[request.id] || ""
    ).trim();

    if (
      decision === "rejected" &&
      note.length < 10
    ) {
      setError(
        "Please write at least 10 characters explaining the rejection."
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
        ? `Approve refund request #${request.id} for further processing? This will NOT send money through Paystack.`
        : `Reject refund request #${request.id}? The buyer will be notified.`
    );

    if (!confirmed) return;

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
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/admin/refunds/${request.id}/review`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
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
          "Request reviewed successfully."
      );

      setNotes((previous) => ({
        ...previous,
        [request.id]: "",
      }));

      await loadRequests();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to review request."
      );
    } finally {
      setSavingId(null);
    }
  }

  // ================================================
  // PAGE
  // ================================================

  return (
    <main className="min-h-screen bg-[#F7F6F2] text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5">
          <Link
            href="/"
            className="text-2xl font-black"
          >
            Gold
            <span className="text-[#C59A28]">
              Mart
            </span>
          </Link>

          <span className="rounded-full border px-4 py-2 text-xs font-bold">
            Admin Dashboard
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs font-black uppercase tracking-widest text-[#9A7617]">
          GoldMart Administration
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Refund Management
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
          Review buyer cancellation and refund
          requests. Approval records a decision
          only. No Paystack refund or seller
          transfer is initiated from this page.
        </p>

        {message && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}

        {/* ACCESS DENIED */}

        {accessDenied ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">
            <div className="text-4xl">🔒</div>

            <h2 className="mt-4 text-xl font-black">
              Administrator Access Required
            </h2>

            <p className="mt-3 text-sm text-gray-600">
              Only accounts configured as
              GoldMart administrators can
              review refunds.
            </p>

            <Link
              href="/login"
              className="mt-6 inline-block rounded-xl bg-black px-6 py-3 font-bold text-white"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <>
            {/* FILTER BAR */}

            <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-end gap-4">
                <div className="min-w-52 flex-1">
                  <label
                    htmlFor="refund-filter"
                    className="block text-sm font-bold"
                  >
                    Filter by status
                  </label>

                  <select
                    id="refund-filter"
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(
                        event.target.value
                      );
                      setPage(1);
                      setMessage("");
                    }}
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
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

                <button
                  type="button"
                  onClick={() =>
                    void loadRequests()
                  }
                  disabled={loading || savingId !== null}
                  className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {loading
                    ? "Loading..."
                    : "Refresh Requests"}
                </button>
              </div>
            </div>

            {/* LOADING */}

            {loading && (
              <div className="mt-6 rounded-2xl bg-white p-8 text-center text-gray-600">
                Loading refund requests...
              </div>
            )}

            {/* EMPTY RESULT */}

            {!loading &&
              !error &&
              requests.length === 0 && (
                <div className="mt-6 rounded-2xl bg-white p-10 text-center shadow-sm">
                  <div className="text-4xl">📋</div>

                  <h2 className="mt-4 text-xl font-black">
                    No refund requests found
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Buyer requests will
                    appear here when submitted.
                  </p>
                </div>
              )}

            {/* REQUEST CARDS */}

            {!loading &&
              requests.length > 0 && (
                <div className="mt-6 space-y-5">
                  {requests.map((request) => {
                    const canReview = [
                      "requested",
                      "under_review",
                    ].includes(request.status);

                    const saving =
                      savingId === request.id;

                    return (
                      <article
                        key={request.id}
                        className="overflow-hidden rounded-2xl bg-white shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4 border-b p-6">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                              Refund Request #
                              {request.id}
                            </p>

                            <h2 className="mt-2 text-xl font-black">
                              Order #
                              {request.order_id}
                            </h2>

                            <p className="mt-2 text-sm text-gray-500">
                              Requested{" "}
                              {formatDate(
                                request.created_at
                              )}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-4 py-2 text-xs font-black ${getStatusStyle(
                              request.status
                            )}`}
                          >
                            {formatStatus(
                              request.status
                            )}
                          </span>
                        </div>

                        <div className="grid gap-5 p-6 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-bold uppercase text-gray-400">
                              Buyer
                            </p>

                            <p className="mt-1 font-bold">
                              {request.buyer_name ||
                                `User #${request.buyer_id}`}
                            </p>

                            <p className="mt-1 break-all text-sm text-gray-600">
                              {request.buyer_email ||
                                "Email unavailable"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase text-gray-400">
                              Request Type
                            </p>

                            <p className="mt-1 font-bold">
                              {formatStatus(
                                request.request_type
                              )}
                            </p>

                            <p className="mt-2 text-sm text-gray-600">
                              Order status:{" "}
                              {formatStatus(
                                request.order_status
                              )}
                            </p>

                            <p className="mt-1 text-sm text-gray-600">
                              Order total:{" "}
                              {Number(
                                request.total_amount
                              ).toLocaleString(
                                "en-NG",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                              {" "}
                              (currency not verified)
                            </p>
                          </div>
                        </div>

                        <div className="mx-6 rounded-xl bg-gray-50 p-4">
                          <p className="text-xs font-bold uppercase text-gray-400">
                            Buyer's Explanation
                          </p>

                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                            {request.reason}
                          </p>
                        </div>

                        {/* PREVIOUS DECISION */}

                        {request.review_note && (
                          <div className="mx-6 mt-4 rounded-xl border p-4">
                            <p className="text-xs font-bold uppercase text-gray-400">
                              Admin Review Note
                            </p>

                            <p className="mt-2 whitespace-pre-wrap text-sm">
                              {request.review_note}
                            </p>
                          </div>
                        )}

                        {/* APPROVE OR REJECT */}

                        {canReview && (
                          <div className="mt-5 border-t p-6">
                            <label
                              htmlFor={`note-${request.id}`}
                              className="block text-sm font-bold"
                            >
                              Admin Review Note
                            </label>

                            <p className="mt-1 text-xs text-gray-500">
                              Explain your decision.
                              A note of at least 10
                              characters is required
                              for rejection.
                            </p>

                            <textarea
                              id={`note-${request.id}`}
                              value={
                                notes[request.id] ||
                                ""
                              }
                              onChange={(event) =>
                                setNotes(
                                  (previous) => ({
                                    ...previous,
                                    [request.id]:
                                      event.target.value,
                                  })
                                )
                              }
                              maxLength={2000}
                              rows={3}
                              disabled={
                                savingId !== null
                              }
                              placeholder="Write your review note..."
                              className="mt-3 w-full rounded-xl border border-gray-300 p-4 text-sm outline-none focus:border-[#C59A28]"
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
                                className="rounded-xl bg-green-700 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
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
                                className="rounded-xl bg-red-700 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                              >
                                Reject Request
                              </button>
                            </div>
                          </div>
                        )}

                        {!canReview && (
                          <p className="border-t px-6 py-4 text-xs text-gray-500">
                            This request is no longer
                            awaiting an admin decision.
                            Financial processing, if
                            applicable, is handled
                            separately.
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

            {/* PAGINATION */}

            {!loading &&
              requests.length > 0 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    disabled={
                      page === 1 ||
                      savingId !== null
                    }
                    onClick={() =>
                      setPage((old) =>
                        Math.max(1, old - 1)
                      )
                    }
                    className="rounded-xl border bg-white px-5 py-3 text-sm font-bold disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="text-sm font-bold">
                    Page {page}
                  </span>

                  <button
                    type="button"
                    disabled={
                      requests.length < 20 ||
                      savingId !== null
                    }
                    onClick={() =>
                      setPage((old) => old + 1)
                    }
                    className="rounded-xl border bg-white px-5 py-3 text-sm font-bold disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
          </>
        )}

        <p className="mt-8 text-xs leading-5 text-gray-500">
          This administration page records refund
          review decisions. It does not perform
          Paystack refunds, initiate bank transfers,
          or release seller payouts.
        </p>
      </section>
    </main>
  );
}
