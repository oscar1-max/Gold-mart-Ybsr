
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const API =
  "https://goldmart-backend-yoxc.onrender.com/api";

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

type RefundAttempt = {
  id: number;
  request_id: number;
  status: string;
  provider_status?: string | null;
  paystack_refund_id?: string | null;
};

type ApiResult = {
  success: boolean;
  message?: string;
  requests?: RefundRequest[];
  attempt?: RefundAttempt | null;
  status?: string;
  test_mode?: boolean;
  requires_manual_review?: boolean;
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

function nice(value: string) {
  return String(value || "Unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function dateText(value: string) {
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

function amountText(value: string | number) {
  const amount = Number(value);

  return Number.isFinite(amount)
    ? amount.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "Unavailable";
}

function statusStyle(status: RefundStatus) {
  if (status === "refunded") {
    return "bg-green-50 text-green-800";
  }

  if (
    status === "rejected" ||
    status === "refund_failed"
  ) {
    return "bg-red-50 text-red-800";
  }

  if (status === "refund_pending") {
    return "bg-blue-50 text-blue-800";
  }

  return "bg-amber-50 text-amber-800";
}

function errorText(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong.";
}

// =============================================
// BACKEND REQUEST HELPER
// =============================================

async function apiRequest(
  path: string,
  options: RequestInit = {}
): Promise<ApiResult> {
  const token = localStorage.getItem(
    "goldmart_token"
  );

  if (!token) {
    throw new Error(
      "Please sign in with your admin account."
    );
  }

  const response = await fetch(
    `${API}${path}`,
    {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.body
          ? {
              "Content-Type":
                "application/json",
            }
          : {}),
        ...(options.headers || {}),
      },
      cache: "no-store",
    }
  );

  const data: ApiResult | null =
    await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.message ||
        `Request failed (${response.status}).`
    );
  }

  return data;
}

// =============================================
// ADMIN REFUND PAGE
// =============================================

export default function AdminRefundsPage() {
  const [requests, setRequests] = useState<
    RefundRequest[]
  >([]);

  const [statusFilter, setStatusFilter] =
    useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [busyId, setBusyId] = useState<
    number | null
  >(null);

  const [notes, setNotes] = useState<
    Record<number, string>
  >({});

  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");

  const [accessDenied, setAccessDenied] =
    useState(false);

  // Prevent a second click while an action
  // is running, even before React re-renders.
  const busyRef = useRef(false);

  // After an uncertain response, require
  // investigation rather than another click.
  const [uncertainIds, setUncertainIds] =
    useState<Record<number, boolean>>({});

  const requestSequence = useRef(0);

  // =============================================
  // LOAD REQUESTS
  // =============================================

  const loadRequests = useCallback(async () => {
    const sequence =
      ++requestSequence.current;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
      });

      if (statusFilter) {
        params.set("status", statusFilter);
      }

      const path =
        `/admin/refunds?${params.toString()}`;

      const data = await apiRequest(path);

      const found = Array.isArray(data.requests)
        ? data.requests
        : [];

      // Reconcile existing pending refunds.
      // This only checks statuses; it never
      // starts a new refund.

      const pending = found.filter(
        (request) =>
          request.status === "refund_pending"
      );

      if (pending.length > 0) {
        await Promise.allSettled(
          pending.map((request) =>
            apiRequest(
              `/admin/refund-processing/${request.id}/status`
            )
          )
        );

        const refreshed =
          await apiRequest(path);

        if (
          sequence ===
          requestSequence.current
        ) {
          setRequests(
            Array.isArray(refreshed.requests)
              ? refreshed.requests
              : []
          );
        }
      } else if (
        sequence === requestSequence.current
      ) {
        setRequests(found);
      }

      if (
        sequence === requestSequence.current
      ) {
        setAccessDenied(false);
      }
    } catch (err) {
      if (
        sequence === requestSequence.current
      ) {
        const text = errorText(err);

        setRequests([]);
        setError(text);

        setAccessDenied(
          /sign in|administrator|authorized|session/i.test(
            text
          )
        );
      }
    } finally {
      if (
        sequence === requestSequence.current
      ) {
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

  // =============================================
  // ONE BUTTON: APPROVE AND START TEST REFUND
  // =============================================

  async function approveAndRefund(
    request: RefundRequest
  ) {
    if (
      busyRef.current ||
      loading ||
      uncertainIds[request.id]
    ) {
      return;
    }

    const newRequest = [
      "requested",
      "under_review",
    ].includes(request.status);

    const alreadyApproved =
      request.status === "approved";

    if (!newRequest && !alreadyApproved) {
      return;
    }

    const confirmed = window.confirm(
      `GoldMart TEST refund for request #${request.id}?\n\n` +
        `This will approve the request if needed, then ask Paystack to process ONE sandbox refund.\n\n` +
        `Approval does not guarantee that Paystack has completed the refund.`
    );

    if (!confirmed) {
      return;
    }

    busyRef.current = true;
    setBusyId(request.id);

    setError("");
    setWarning("");
    setMessage("");

    let approvalRecorded = alreadyApproved;
    let refundSubmissionAttempted = false;

    try {
      // ===========================================
      // STEP 1: REQUIRE PAYSTACK TEST MODE
      // ===========================================

      const config = await apiRequest(
        "/payments/config"
      );

      if (config.test_mode !== true) {
        throw new Error(
          "Paystack sandbox mode is not configured. No new refund was submitted."
        );
      }

      // ===========================================
      // STEP 2: APPROVE REQUEST
      // ===========================================

      if (newRequest) {
        const note = (
          notes[request.id] || ""
        ).trim();

        if (note.length > 2000) {
          throw new Error(
            "Review note cannot exceed 2000 characters."
          );
        }

        await apiRequest(
          `/admin/refunds/${request.id}/review`,
          {
            method: "PATCH",
            body: JSON.stringify({
              decision: "approved",
              note,
            }),
          }
        );

        approvalRecorded = true;
      }

      // ===========================================
      // STEP 3: CHECK FOR EXISTING REFUND
      // ===========================================

      const existing = await apiRequest(
        `/admin/refund-processing/${request.id}/status`
      );

      if (
        existing.attempt ||
        existing.status
      ) {
        setMessage(
          `Request #${request.id} is approved. ` +
            `An existing refund attempt was found. ` +
            `Status: ${nice(
              existing.attempt?.status ||
                existing.status ||
                "unknown"
            )}. ` +
            `No second refund was submitted.`
        );

        return;
      }

      // ===========================================
      // STEP 4: START ONE PAYSTACK TEST REFUND
      // ===========================================

      refundSubmissionAttempted = true;

      const result = await apiRequest(
        `/admin/refund-processing/${request.id}/start`,
        {
          method: "POST",
        }
      );

      if (result.requires_manual_review) {
        setUncertainIds((old) => ({
          ...old,
          [request.id]: true,
        }));

        setWarning(
          result.message ||
            "The Paystack refund outcome is uncertain. Do not repeat it. Investigate the existing attempt."
        );
      } else {
        setMessage(
          result.message ||
            "Paystack test refund was submitted. Final status is pending provider confirmation."
        );
      }
    } catch (err) {
      const details = errorText(err);

      if (refundSubmissionAttempted) {
        setUncertainIds((old) => ({
          ...old,
          [request.id]: true,
        }));

        setWarning(
          `Refund submission was not confirmed. ${details} ` +
            `Do not click again until the existing attempt is investigated.`
        );
      } else if (approvalRecorded) {
        setWarning(
          `The request is approved, but no refund was confirmed. ${details} ` +
            `Check the processing status before taking further action.`
        );
      } else {
        setError(details);
      }
    } finally {
      setNotes((old) => ({
        ...old,
        [request.id]: "",
      }));

      await loadRequests();

      busyRef.current = false;
      setBusyId(null);
    }
  }

  // =============================================
  // REJECT REFUND
  // =============================================

  async function rejectRequest(
    request: RefundRequest
  ) {
    if (busyRef.current || loading) {
      return;
    }

    const note = (
      notes[request.id] || ""
    ).trim();

    if (note.length < 10) {
      setError(
        "Explain the rejection in at least 10 characters."
      );
      return;
    }

    if (note.length > 2000) {
      setError(
        "Review note cannot exceed 2000 characters."
      );
      return;
    }

    if (
      !window.confirm(
        `Reject refund request #${request.id}?`
      )
    ) {
      return;
    }

    busyRef.current = true;
    setBusyId(request.id);

    setError("");
    setWarning("");
    setMessage("");

    try {
      const result = await apiRequest(
        `/admin/refunds/${request.id}/review`,
        {
          method: "PATCH",
          body: JSON.stringify({
            decision: "rejected",
            note,
          }),
        }
      );

      setMessage(
        result.message ||
          "Request rejected."
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      await loadRequests();

      busyRef.current = false;
      setBusyId(null);
    }
  }

  // =============================================
  // PAGE STATISTICS
  // =============================================

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

  // =============================================
  // SEARCH
  // =============================================

  const visibleRequests = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return requests;

    return requests.filter((r) =>
      [
        r.id,
        r.order_id,
        r.buyer_id,
        r.buyer_name,
        r.buyer_email,
        r.reason,
        r.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [requests, search]);

  // =============================================
  // PAGE LAYOUT
  // =============================================

  return (
    <main className="min-h-screen bg-[#FAF8F3] pb-16 text-[#17191D]">
      <div className="h-1 bg-gradient-to-r from-[#96713D] via-[#E9D9BB] to-[#C5A46D]" />

      <header className="border-b border-[#E8E1D5] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
          <Link
            href="/"
            className="text-2xl font-black"
          >
            Gold
            <span className="text-[#B08A50]">
              Mart
            </span>
          </Link>

          <Link
            href="/account"
            className="rounded-full border border-[#D7BF97] px-4 py-2 text-sm font-bold"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* HEADER */}

        <section className="rounded-[28px] bg-[#17191D] p-7 text-white sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E9D9BB]">
            GoldMart Administration
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            Refund Management
          </h1>

          <p className="mt-3 text-sm leading-7 text-[#E5DDD1]">
            Review requests and manage Paystack
            sandbox refunds from one simple page.
          </p>
        </section>

        {/* SIMPLE SAFETY NOTICE */}

        <div className="mt-6 rounded-2xl border border-[#E2D5BE] bg-[#FFF9EE] p-4 text-sm text-[#67502C]">
          <strong>Test mode:</strong>{" "}
          Approve & Refund submits a sandbox
          refund request when authorized.
          GoldMart shows "Refunded" only when
          Paystack reports it processed.
          Seller payouts remain disabled.
        </div>

        {/* MESSAGES */}

        {message && (
          <div
            role="status"
            className="mt-5 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-800"
          >
            {message}
          </div>
        )}

        {warning && (
          <div
            role="alert"
            className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-900"
          >
            {warning}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800"
          >
            {error}
          </div>
        )}

        {accessDenied ? (
          <div className="mt-8 rounded-3xl bg-white p-8 text-center">
            <h2 className="text-xl font-black">
              Admin Access Required
            </h2>

            <Link
              href="/login"
              className="mt-5 inline-block rounded-full bg-black px-6 py-3 text-sm font-bold text-white"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <>
            {/* STATS */}

            <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ["Requests", stats.shown, "📋"],
                ["Awaiting Review", stats.awaiting, "⏳"],
                ["Approved", stats.approved, "✅"],
                ["Refunded", stats.refunded, "💳"],
              ].map(([label, count, icon]) => (
                <div
                  key={String(label)}
                  className="rounded-2xl border border-[#E8E1D5] bg-white p-5"
                >
                  <div className="text-2xl">
                    {icon}
                  </div>

                  <p className="mt-3 text-xs text-gray-500">
                    {label}
                  </p>

                  <p className="mt-1 text-3xl font-black">
                    {loading ? "—" : count}
                  </p>
                </div>
              ))}
            </section>

            {/* SEARCH AND FILTER */}

            <section className="mt-7 rounded-3xl border border-[#E8E1D5] bg-white p-5">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="search"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search refund requests..."
                  className="rounded-xl border p-3 text-sm"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                    setSearch("");
                  }}
                  className="rounded-xl border p-3 text-sm"
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
                disabled={
                  loading ||
                  busyId !== null
                }
                className="mt-4 rounded-full border border-[#D7BF97] px-5 py-2 text-sm font-bold disabled:opacity-50"
              >
                ↻ Refresh
              </button>
            </section>

            {/* LOADING */}

            {loading && (
              <p className="mt-6 text-center text-sm text-gray-500">
                Loading refund requests...
              </p>
            )}

            {/* EMPTY */}

            {!loading &&
              !error &&
              visibleRequests.length === 0 && (
                <div className="mt-6 rounded-3xl bg-white p-10 text-center">
                  <div className="text-4xl">
                    📭
                  </div>

                  <h2 className="mt-4 text-xl font-black">
                    No matching refund requests
                  </h2>
                </div>
              )}

            {/* REQUEST LIST */}

            {!loading && !error && (
              <section className="mt-6 space-y-5">
                {visibleRequests.map((request) => {
                  const waiting = [
                    "requested",
                    "under_review",
                  ].includes(request.status);

                  const approved =
                    request.status === "approved";

                  const canApprove =
                    waiting || approved;

                  const blocked =
                    Boolean(
                      uncertainIds[request.id]
                    );

                  const busy =
                    busyId === request.id;

                  return (
                    <article
                      key={request.id}
                      className="overflow-hidden rounded-3xl border border-[#E8E1D5] bg-white shadow-sm"
                    >
                      {/* REQUEST HEADER */}

                      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5 sm:p-7">
                        <div>
                          <p className="text-xs font-bold text-[#96713D]">
                            Refund Request #{request.id}
                          </p>

                          <h3 className="mt-2 text-xl font-black">
                            Order #{request.order_id}
                          </h3>

                          <p className="mt-2 text-xs text-gray-500">
                            {dateText(
                              request.created_at
                            )}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-4 py-2 text-xs font-bold ${statusStyle(
                            request.status
                          )}`}
                        >
                          {nice(request.status)}
                        </span>
                      </div>

                      {/* DETAILS */}

                      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
                        <div className="rounded-2xl bg-[#FAF8F3] p-4">
                          <p className="text-xs font-bold text-[#96713D]">
                            Buyer
                          </p>

                          <p className="mt-2 font-bold">
                            {request.buyer_name ||
                              `User #${request.buyer_id}`}
                          </p>

                          <p className="mt-1 break-all text-sm text-gray-500">
                            {request.buyer_email ||
                              "Email unavailable"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#FAF8F3] p-4">
                          <p className="text-xs font-bold text-[#96713D]">
                            Request Details
                          </p>

                          <p className="mt-2 text-sm">
                            {nice(
                              request.request_type
                            )}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            Order:{" "}
                            {nice(
                              request.order_status
                            )}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            Total:{" "}
                            {amountText(
                              request.total_amount
                            )}
                            {" "} (currency not verified)
                          </p>

                          {request.provider_status && (
                            <p className="mt-1 text-sm text-gray-500">
                              Paystack:{" "}
                              {nice(
                                request.provider_status
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* REASON */}

                      <div className="mx-5 rounded-2xl border p-4 sm:mx-7">
                        <p className="text-xs font-bold text-[#96713D]">
                          Buyer's Reason
                        </p>

                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">
                          {request.reason}
                        </p>
                      </div>

                      {request.review_note && (
                        <div className="mx-5 mt-4 rounded-2xl bg-[#FAF8F3] p-4 text-sm sm:mx-7">
                          <strong>Admin Note:</strong>{" "}
                          {request.review_note}
                        </div>
                      )}

                      {/* ACTIONS */}

                      {canApprove && (
                        <div className="mt-6 border-t p-5 sm:p-7">

                          {waiting && (
                            <textarea
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
                                      e.target.value,
                                  })
                                )
                              }
                              rows={3}
                              maxLength={2000}
                              placeholder="Optional approval note, or rejection reason..."
                              disabled={
                                busyId !== null
                              }
                              className="w-full rounded-xl border p-4 text-sm disabled:opacity-50"
                            />
                          )}

                          <div className="mt-4 flex flex-wrap gap-3">

                            <button
                              type="button"
                              onClick={() =>
                                void approveAndRefund(
                                  request
                                )
                              }
                              disabled={
                                busyId !== null ||
                                blocked
                              }
                              className="rounded-full bg-[#17191D] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                            >
                              {busy
                                ? "Processing..."
                                : approved
                                  ? "Complete Approved Refund (Test)"
                                  : "Approve & Refund (Test)"}
                            </button>

                            {waiting && (
                              <button
                                type="button"
                                onClick={() =>
                                  void rejectRequest(
                                    request
                                  )
                                }
                                disabled={
                                  busyId !== null
                                }
                                className="rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-800 disabled:opacity-50"
                              >
                                Reject Request
                              </button>
                            )}
                          </div>

                          {blocked && (
                            <p className="mt-3 text-xs text-amber-800">
                              Refund outcome requires
                              investigation. Further
                              submission is disabled
                              in this session.
                            </p>
                          )}
                        </div>
                      )}

                      {request.status ===
                        "refund_pending" && (
                        <p className="border-t px-5 py-4 text-sm text-blue-800 sm:px-7">
                          Paystack refund is pending.
                          Refresh to check its status.
                          Do not submit another refund.
                        </p>
                      )}

                      {request.status ===
                        "refunded" && (
                        <p className="border-t px-5 py-4 text-sm text-green-800 sm:px-7">
                          Paystack reports that the
                          refund was processed.
                        </p>
                      )}

                      {request.status ===
                        "refund_failed" && (
                        <p className="border-t px-5 py-4 text-sm text-red-800 sm:px-7">
                          Refund processing needs
                          investigation. Do not
                          repeat the transaction.
                        </p>
                      )}

                    </article>
                  );
                })}
              </section>
            )}

            {/* PAGINATION */}

            {!loading && (
              <nav className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  disabled={
                    page === 1 ||
                    busyId !== null
                  }
                  onClick={() => {
                    setPage((p) =>
                      Math.max(1, p - 1)
                    );
                    setSearch("");
                  }}
                  className="rounded-full border px-5 py-3 text-sm font-bold disabled:opacity-40"
                >
                  ← Previous
                </button>

                <span className="font-bold">
                  Page {page}
                </span>

                <button
                  type="button"
                  disabled={
                    requests.length < PAGE_SIZE ||
                    busyId !== null
                  }
                  onClick={() => {
                    setPage((p) => p + 1);
                    setSearch("");
                  }}
                  className="rounded-full border px-5 py-3 text-sm font-bold disabled:opacity-40"
                >
                  Next →
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}
