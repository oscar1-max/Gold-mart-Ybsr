
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
  provider_status?: string;
  refund_id?: string | number;
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

function amountText(
  value: string | number
) {
  const amount = Number(value);

  return Number.isFinite(amount)
    ? amount.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "Unavailable";
}

function statusStyle(
  status: RefundStatus
) {
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
      "Please sign in with your administrator account."
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
    await response.json().catch(
      () => null
    );

  if (!response.ok || !data?.success) {
    if (response.status === 401) {
      throw new Error(
        "Your login session has expired. Please sign in again."
      );
    }

    throw new Error(
      data?.message ||
        `Server request failed (${response.status}).`
    );
  }

  return data;
}

export default function AdminRefundsPage() {
  const [requests, setRequests] =
    useState<RefundRequest[]>([]);

  const [statusFilter, setStatusFilter] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [busyId, setBusyId] =
    useState<number | null>(null);

  const [notes, setNotes] =
    useState<Record<number, string>>({});

  const [message, setMessage] =
    useState("");

  const [warning, setWarning] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [loadError, setLoadError] =
    useState("");

  const [accessDenied, setAccessDenied] =
    useState(false);

  const busyRef = useRef(false);
  const requestSequence = useRef(0);

  // Block a second submission if a
  // previous response was uncertain.
  const [uncertainIds, setUncertainIds] =
    useState<Record<number, boolean>>({});

  // =============================================
  // LOAD REFUND REQUESTS
  // =============================================

  const loadRequests = useCallback(
    async () => {
      const sequence =
        ++requestSequence.current;

      setLoading(true);
      setLoadError("");

      try {
        const params =
          new URLSearchParams({
            page: String(page),
          });

        if (statusFilter) {
          params.set(
            "status",
            statusFilter
          );
        }

        const path =
          `/admin/refunds?${params.toString()}`;

        const data =
          await apiRequest(path);

        const found =
          Array.isArray(data.requests)
            ? data.requests
            : [];

        // Checking pending refunds is
        // read-only at the provider level.
        // This does NOT create a refund.
        const pending =
          found.filter(
            (request) =>
              request.status ===
              "refund_pending"
          );

        if (pending.length > 0) {
          await Promise.allSettled(
            pending.map(
              (request) =>
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
              Array.isArray(
                refreshed.requests
              )
                ? refreshed.requests
                : []
            );
          }
        } else if (
          sequence ===
          requestSequence.current
        ) {
          setRequests(found);
        }

        if (
          sequence ===
          requestSequence.current
        ) {
          setAccessDenied(false);
        }
      } catch (error) {
        if (
          sequence ===
          requestSequence.current
        ) {
          const text =
            errorText(error);

          setLoadError(text);

          setAccessDenied(
            /sign in|administrator|authorized|session|permission/i.test(
              text
            )
          );
        }
      } finally {
        if (
          sequence ===
          requestSequence.current
        ) {
          setLoading(false);
        }
      }
    },
    [page, statusFilter]
  );

  useEffect(() => {
    void loadRequests();

    return () => {
      requestSequence.current += 1;
    };
  }, [loadRequests]);

  function clearFeedback() {
    setMessage("");
    setWarning("");
    setActionError("");
  }

  // =============================================
  // APPROVE + ONE TEST REFUND
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

    const waiting =
      request.status === "requested" ||
      request.status === "under_review";

    const alreadyApproved =
      request.status === "approved";

    if (
      !waiting &&
      !alreadyApproved
    ) {
      return;
    }

    const note = (
      notes[request.id] || ""
    ).trim();

    if (note.length > 2000) {
      setActionError(
        "Admin note cannot exceed 2000 characters."
      );
      return;
    }

    const confirmed = window.confirm(
      `Approve & Refund (TEST)\n\n` +
        `Refund request #${request.id}\n` +
        `Order #${request.order_id}\n\n` +
        `GoldMart will approve the request and, if eligible, submit ONE Paystack sandbox refund.\n\n` +
        `This action does not enable real-money refunds or seller payouts.`
    );

    if (!confirmed) {
      return;
    }

    busyRef.current = true;
    setBusyId(request.id);
    clearFeedback();

    let approvalRecorded =
      alreadyApproved;

    let refundSubmissionAttempted =
      false;

    try {
      // ===========================================
      // STEP 1: APPROVE THE REQUEST
      // ===========================================
      //
      // IMPORTANT FIX:
      //
      // We DO NOT check config.test_mode
      // in the frontend before approving.
      //
      // The backend decides whether test
      // refund processing is permitted.

      if (waiting) {
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
      // STEP 2: CHECK FOR EXISTING ATTEMPT
      // ===========================================
      //
      // Never submit a duplicate refund.

      const existing =
        await apiRequest(
          `/admin/refund-processing/${request.id}/status`
        );

      if (
        existing.attempt ||
        existing.status
      ) {
        const status =
          existing.attempt?.status ||
          existing.status ||
          "unknown";

        setMessage(
          `Request #${request.id} is approved. ` +
            `A refund attempt already exists. ` +
            `Current status: ${nice(status)}. ` +
            `No second refund was submitted.`
        );

        return;
      }

      // ===========================================
      // STEP 3: START ONE PAYSTACK TEST REFUND
      // ===========================================
      //
      // Backend enforces:
      // - Authorized admin
      // - sk_test_ secret key
      // - ENABLE_PAYSTACK_REFUNDS_TEST
      // - Verified original transaction
      // - No duplicate refund attempt
      // - No started seller payout

      refundSubmissionAttempted = true;

      const result =
        await apiRequest(
          `/admin/refund-processing/${request.id}/start`,
          {
            method: "POST",
          }
        );

      if (
        result.requires_manual_review
      ) {
        setUncertainIds(
          (previous) => ({
            ...previous,
            [request.id]: true,
          })
        );

        setWarning(
          result.message ||
            "Refund outcome is uncertain. Do not submit again. Check the existing attempt."
        );
      } else {
        setMessage(
          result.message ||
            "Paystack sandbox refund was submitted. Waiting for provider confirmation."
        );
      }
    } catch (error) {
      const details =
        errorText(error);

      if (
        refundSubmissionAttempted
      ) {
        // A network failure after POST
        // does not prove that the provider
        // failed to receive the request.

        setUncertainIds(
          (previous) => ({
            ...previous,
            [request.id]: true,
          })
        );

        setWarning(
          `Refund outcome requires checking. ${details} ` +
            `Do not submit again until the existing attempt has been investigated.`
        );
      } else if (
        approvalRecorded
      ) {
        setWarning(
          `Admin approval was recorded, but refund processing was not completed. ` +
            `${details} ` +
            `Check the existing attempt before taking further action.`
        );
      } else {
        // The approval itself was not
        // confirmed. No refund start was sent.

        setActionError(
          `Approval could not be confirmed. ${details}`
        );
      }
    } finally {
      setNotes(
        (previous) => ({
          ...previous,
          [request.id]: "",
        })
      );

      // Reload the status from Neon,
      // without clearing feedback messages.
      await loadRequests();

      busyRef.current = false;
      setBusyId(null);
    }
  }

  // =============================================
  // REJECT REQUEST
  // =============================================

  async function rejectRequest(
    request: RefundRequest
  ) {
    if (
      busyRef.current ||
      loading
    ) {
      return;
    }

    const note = (
      notes[request.id] || ""
    ).trim();

    if (
      note.length < 10
    ) {
      setActionError(
        "Please explain the rejection in at least 10 characters."
      );
      return;
    }

    if (
      note.length > 2000
    ) {
      setActionError(
        "Admin note cannot exceed 2000 characters."
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
    clearFeedback();

    try {
      const result =
        await apiRequest(
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
          "Refund request rejected."
      );
    } catch (error) {
      setActionError(
        errorText(error)
      );
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

      awaiting:
        requests.filter(
          (request) =>
            request.status ===
              "requested" ||
            request.status ===
              "under_review"
        ).length,

      approved:
        requests.filter(
          (request) =>
            request.status ===
            "approved"
        ).length,

      refunded:
        requests.filter(
          (request) =>
            request.status ===
            "refunded"
        ).length,
    }),
    [requests]
  );

  // =============================================
  // SEARCH
  // =============================================

  const visibleRequests =
    useMemo(() => {
      const term =
        search.trim().toLowerCase();

      if (!term) {
        return requests;
      }

      return requests.filter(
        (request) =>
          [
            request.id,
            request.order_id,
            request.buyer_id,
            request.buyer_name,
            request.buyer_email,
            request.reason,
            request.request_type,
            request.status,
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
    <main className="min-h-screen bg-[#f5f7f6] pb-32 text-[#1b3329] md:pb-12">
      {/* Admin visual identity: existing permissions and actions remain authoritative */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="relative overflow-hidden rounded-[28px] px-6 py-8 text-white shadow-[0_18px_38px_rgba(22,39,46,0.13)] sm:px-10 sm:py-11" style={{background:"linear-gradient(115deg,#3F322A,#866744 56%,#C7A779)"}}>
          <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-12 text-[150px] leading-none opacity-10">◇</span>
          <div className="relative">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.23em]" style={{color:"#FFE5B8"}}>GOLDMART PRIVATE ADMIN · FINANCIAL REVIEW</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Manage Refunds</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">Clear, careful visibility into refund requests.</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[11px] font-bold text-white/90"><span className="h-2 w-2 rounded-full bg-[#def3e6]"/>Authorized access required</div>
          </div>
        </div>
        <nav aria-label="Admin workspaces" className="og-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2">
          <Link href="/admin" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#dee9e2] bg-white text-[#506363] hover:border-[#8fbfa7] hover:bg-[#ebf5ee]">Overview</Link>
          <Link href="/admin/ai" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#dee9e2] bg-white text-[#506363] hover:border-[#8fbfa7] hover:bg-[#ebf5ee]">AI Admin</Link>
          <Link href="/admin/monitoring" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#dee9e2] bg-white text-[#506363] hover:border-[#8fbfa7] hover:bg-[#ebf5ee]">Monitoring</Link>
          <Link href="/admin/support-assistant" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#dee9e2] bg-white text-[#506363] hover:border-[#8fbfa7] hover:bg-[#ebf5ee]">Assistant</Link>
          <Link href="/admin/reports" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#dee9e2] bg-white text-[#506363] hover:border-[#8fbfa7] hover:bg-[#ebf5ee]">Reports</Link>
          <Link href="/admin/refunds" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#284F55] bg-[#284F55] text-white">Refunds</Link>
          <Link href="/admin/support" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#dee9e2] bg-white text-[#506363] hover:border-[#8fbfa7] hover:bg-[#ebf5ee]">Support</Link>
        </nav>
      </div>

      <div className="h-1 bg-gradient-to-r from-[#176c52] via-[#ddf1e3] to-[#68a98c]" />

      {/* HEADER */}

      <header className="border-b border-[#e0eae3] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
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

        {/* HERO */}

        <section className="rounded-[28px] bg-[#253F48] p-7 text-white sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ddf1e3]">
            GoldMart Administration
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            Refund Management
          </h1>

          <p className="mt-3 text-sm leading-7 text-[#E5DDD1]">
            Review customer refund requests and
            manage Paystack sandbox refunds.
          </p>
        </section>

        {/* SAFETY NOTICE */}

        <div className="mt-6 rounded-2xl border border-[#E2D5BE] bg-[#FFF9EE] p-4 text-sm leading-6 text-[#67502C]">
          <strong>
            Paystack Test Mode:
          </strong>{" "}
          Approve & Refund can approve a request
          and submit one authorized sandbox
          refund. GoldMart only displays
          Refunded after Paystack reports
          processing complete. Seller payouts
          remain disabled.
        </div>

        {/* ACTION MESSAGES */}

        {message && (
          <div
            role="status"
            className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800"
          >
            {message}
          </div>
        )}

        {warning && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900"
          >
            {warning}
          </div>
        )}

        {actionError && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800"
          >
            {actionError}
          </div>
        )}

        {loadError && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {loadError}
          </div>
        )}

        {/* ACCESS */}

        {accessDenied ? (
          <div className="mt-8 rounded-3xl bg-white p-8 text-center">
            <h2 className="text-xl font-black">
              Admin Access Required
            </h2>

            <p className="mt-3 text-sm text-gray-500">
              Sign in with your authorized
              administrator account.
            </p>

            <Link
              href="/login"
              className="mt-5 inline-block rounded-full bg-black px-6 py-3 text-sm font-bold text-white"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <>
            {/* STATISTICS */}

            <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                {
                  label: "Requests",
                  count: stats.shown,
                  icon: "📋",
                },
                {
                  label: "Awaiting Review",
                  count: stats.awaiting,
                  icon: "⏳",
                },
                {
                  label: "Approved",
                  count: stats.approved,
                  icon: "✅",
                },
                {
                  label: "Refunded",
                  count: stats.refunded,
                  icon: "💳",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-[#e0eae3] bg-white p-5"
                >
                  <div className="text-2xl">
                    {stat.icon}
                  </div>

                  <p className="mt-3 text-xs text-gray-500">
                    {stat.label}
                  </p>

                  <p className="mt-1 text-3xl font-black">
                    {loading
                      ? "—"
                      : stat.count}
                  </p>
                </div>
              ))}
            </section>

            {/* SEARCH AND FILTER */}

            <section className="mt-7 rounded-[26px] border border-[#E7D9C5] bg-white shadow-[0_7px_24px_rgba(28,35,36,0.045)] p-5">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search refund requests..."
                  aria-label="Search refund requests"
                  className="rounded-xl border p-3 text-sm"
                />

                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(
                      event.target.value
                    );
                    setPage(1);
                    setSearch("");
                  }}
                  aria-label="Filter refund requests"
                  disabled={
                    busyId !== null
                  }
                  className="rounded-xl border p-3 text-sm disabled:opacity-50"
                >
                  {filters.map(
                    (filter) => (
                      <option
                        key={filter.value}
                        value={filter.value}
                      >
                        {filter.label}
                      </option>
                    )
                  )}
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

            {/* EMPTY STATE */}

            {!loading &&
              !loadError &&
              visibleRequests.length === 0 && (
                <div className="mt-6 rounded-3xl border border-[#e0eae3] bg-white p-10 text-center">
                  <div className="text-4xl">
                    📭
                  </div>

                  <h2 className="mt-4 text-xl font-black">
                    No matching refund requests
                  </h2>
                </div>
              )}

            {/* REFUND CARDS */}

            {!loading &&
              !loadError && (
                <section className="mt-6 space-y-5">
                  {visibleRequests.map(
                    (request) => {
                      const waiting =
                        request.status ===
                          "requested" ||
                        request.status ===
                          "under_review";

                      const approved =
                        request.status ===
                        "approved";

                      const canApprove =
                        waiting || approved;

                      const busy =
                        busyId === request.id;

                      const blocked =
                        Boolean(
                          uncertainIds[
                            request.id
                          ]
                        );

                      return (
                        <article
                          key={request.id}
                          className="overflow-hidden rounded-3xl border border-[#e0eae3] bg-white shadow-sm"
                        >
                          {/* CARD HEADER */}

                          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5 sm:p-7">
                            <div>
                              <p className="text-xs font-bold text-[#176c52]">
                                Refund Request #
                                {request.id}
                              </p>

                              <h3 className="mt-2 text-xl font-black">
                                Order #
                                {request.order_id}
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
                              {nice(
                                request.status
                              )}
                            </span>
                          </div>

                          {/* BUYER DETAILS */}

                          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
                            <div className="rounded-2xl bg-[#f5f8f5] p-4">
                              <p className="text-xs font-bold text-[#176c52]">
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

                            <div className="rounded-2xl bg-[#f5f8f5] p-4">
                              <p className="text-xs font-bold text-[#176c52]">
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
                                Order total:{" "}
                                {amountText(
                                  request.total_amount
                                )}{" "}
                                <span className="text-xs">
                                  (currency not verified)
                                </span>
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

                          {/* BUYER'S REASON */}

                          <div className="mx-5 rounded-2xl border p-4 sm:mx-7">
                            <p className="text-xs font-bold text-[#176c52]">
                              Buyer's Reason
                            </p>

                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">
                              {request.reason ||
                                "No reason provided."}
                            </p>
                          </div>

                          {/* REVIEW NOTE */}

                          {request.review_note && (
                            <div className="mx-5 mt-4 rounded-2xl bg-[#f5f8f5] p-4 text-sm sm:mx-7">
                              <strong>
                                Admin Note:
                              </strong>{" "}
                              {request.review_note}
                            </div>
                          )}

                          {/* ACTION BUTTONS */}

                          {canApprove && (
                            <div className="mt-6 border-t p-5 sm:p-7">

                              {waiting && (
                                <textarea
                                  value={
                                    notes[
                                      request.id
                                    ] || ""
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setNotes(
                                      (old) => ({
                                        ...old,
                                        [request.id]:
                                          event
                                            .target
                                            .value,
                                      })
                                    )
                                  }
                                  rows={3}
                                  maxLength={2000}
                                  placeholder="Optional approval note or rejection reason..."
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
                                  className="rounded-full bg-[#145d4a] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
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
                                  Refund outcome needs
                                  investigation.
                                  Another submission
                                  is blocked in
                                  this session.
                                </p>
                              )}
                            </div>
                          )}

                          {/* PENDING STATUS */}

                          {request.status ===
                            "refund_pending" && (
                            <p className="border-t px-5 py-4 text-sm text-blue-800 sm:px-7">
                              Paystack test refund
                              is pending. Refresh
                              to check its status.
                              Do not submit another
                              refund.
                            </p>
                          )}

                          {/* REFUNDED STATUS */}

                          {request.status ===
                            "refunded" && (
                            <p className="border-t px-5 py-4 text-sm text-green-800 sm:px-7">
                              Paystack reports the
                              refund as processed.
                            </p>
                          )}

                          {/* FAILED STATUS */}

                          {request.status ===
                            "refund_failed" && (
                            <p className="border-t px-5 py-4 text-sm text-red-800 sm:px-7">
                              Refund processing
                              requires investigation.
                              Do not submit another
                              transaction.
                            </p>
                          )}

                        </article>
                      );
                    }
                  )}
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
                    setPage(
                      (current) =>
                        Math.max(
                          1,
                          current - 1
                        )
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
                    requests.length <
                      PAGE_SIZE ||
                    busyId !== null
                  }
                  onClick={() => {
                    setPage(
                      (current) =>
                        current + 1
                    );
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
