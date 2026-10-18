
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

// =====================================================
// GOLDMART FREE ADMIN ASSISTANT
// =====================================================
//
// Free, rule-based marketplace assistant.
//
// - No OpenAI API calls
// - No paid AI credits required
// - Administrator-only backend access
// - Read-only database reports
// - No refunds, payouts, bans or account changes
//
// =====================================================

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

// =====================================================
// TYPES
// =====================================================

type OrdersSummary = {
  total: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  last_24_hours: number;
  processing_over_72_hours: number;
};

type PaymentsSummary = {
  total_records: number;
  successful_records: number;
  note?: string;
};

type RefundsSummary = {
  total: number;
  awaiting_review: number;
  approved: number;
  refund_pending: number;
  rejected: number;
};

type SellerAllocationsSummary = {
  total: number;
  pending_review: number;
  blocked: number;
  settled_records: number;
  note?: string;
};

type AdminAlert = {
  type: string;
  severity: string;
  title: string;
  message: string;
  human_review_required?: boolean;
};

type AdminOverview = {
  success: boolean;
  generated_at: string;
  mode: string;
  overview: {
    orders: OrdersSummary;
    payments: PaymentsSummary;
    refunds: RefundsSummary;
    seller_allocations: SellerAllocationsSummary;
  };
  alerts: AdminAlert[];
  security: {
    administrator_id: number;
    ai_can_change_records: boolean;
    financial_actions_enabled: boolean;
    human_approval_required: boolean;
  };
  message?: string;
};

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

type ChatResponse = {
  success?: boolean;
  answer?: string;
  message?: string;
  mode?: string;
  requires_paid_ai?: boolean;
};

// =====================================================
// SUGGESTED QUESTIONS
// =====================================================

const SUGGESTED_QUESTIONS = [
  "What needs my attention today?",
  "Check my orders.",
  "How many refund requests are pending?",
  "Check seller allocations.",
  "Show payment statistics.",
  "Give me a marketplace report.",
];

// =====================================================
// HELPERS
// =====================================================

function getAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("goldmart_token");
}

function formatNumber(value: number | undefined) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return number.toLocaleString();
}

function MetricCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: number;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-semibold text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-black text-[#98721B]">
        {formatNumber(value)}
      </p>

      {detail && (
        <p className="mt-2 text-xs leading-5 text-gray-500">
          {detail}
        </p>
      )}
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-black text-gray-900">
        {title}
      </h2>

      {description && (
        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      )}
    </div>
  );
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function AiAdminPage() {
  const [data, setData] =
    useState<AdminOverview | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [pageError, setPageError] =
    useState("");

  const [accessDenied, setAccessDenied] =
    useState(false);

  // ===================================================
  // FREE ASSISTANT STATE
  // ===================================================

  const [question, setQuestion] =
    useState("");

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [sending, setSending] =
    useState(false);

  const [chatError, setChatError] =
    useState("");

  // ===================================================
  // FETCH DASHBOARD DATA
  // ===================================================

  const loadOverview = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setPageError("");
      setAccessDenied(false);

      try {
        const token = getAuthToken();

        if (!token) {
          setData(null);

          throw new Error(
            "Please sign in to your GoldMart administrator account."
          );
        }

        const response = await fetch(
          `${API_URL}/api/ai-admin/overview`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        const result = await response
          .json()
          .catch(() => null);

        if (response.status === 401) {
          setData(null);

          throw new Error(
            "Your session has expired. Please sign in again."
          );
        }

        if (response.status === 403) {
          setData(null);
          setAccessDenied(true);

          throw new Error(
            "Only authorized GoldMart administrators can access this page."
          );
        }

        if (
          !response.ok ||
          !result?.success ||
          !result.overview ||
          !result.security ||
          !Array.isArray(result.alerts)
        ) {
          setData(null);

          throw new Error(
            result?.message ||
              "Unable to load the admin dashboard."
          );
        }

        setData(result as AdminOverview);
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Unable to load the dashboard."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  // ===================================================
  // SEND MESSAGE TO FREE ASSISTANT
  // ===================================================

  async function sendMessage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const message = question.trim();

    if (
      sending ||
      message.length < 2 ||
      message.length > 500
    ) {
      return;
    }

    const token = getAuthToken();

    if (!token) {
      setChatError(
        "Please sign in to your administrator account."
      );
      return;
    }

    setChatError("");
    setSending(true);
    setQuestion("");

    const messageId = Date.now();

    setMessages((current) => [
      ...current,
      {
        id: messageId,
        role: "user",
        content: message,
      },
    ]);

    try {
      // IMPORTANT:
      // This is the FREE backend endpoint.
      // We do NOT call /api/ai-admin/chat here.
      const response = await fetch(
        `${API_URL}/api/ai-admin/free-chat`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            message,
          }),
        }
      );

      const result = (await response
        .json()
        .catch(() => ({}))) as ChatResponse;

      if (
        !response.ok ||
        !result.success ||
        typeof result.answer !== "string"
      ) {
        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please sign in again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "Administrator access was denied."
          );
        }

        throw new Error(
          result.message ||
            `Assistant request failed (${response.status}).`
        );
      }

      setMessages((current) => [
        ...current,
        {
          id: messageId + 1,
          role: "assistant",
          content: result.answer || "",
        },
      ]);
    } catch (error) {
      setChatError(
        error instanceof Error
          ? error.message
          : "The free assistant couldn't answer your question."
      );
    } finally {
      setSending(false);
    }
  }

  // ===================================================
  // CLEAR LOCAL CHAT
  // ===================================================

  function clearChat() {
    if (sending) return;

    setMessages([]);
    setChatError("");
    setQuestion("");
  }

  const overview = data?.overview;

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <main className="min-h-screen bg-[#F8F7F3] text-gray-900">
      {/* ============================================
          HEADER
          ============================================ */}

      <header className="border-b border-[#E9DEBE] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5">
          <Link
            href="/"
            className="text-2xl font-black"
          >
            Gold
            <span className="text-[#B38A25]">
              Mart
            </span>
          </Link>

          <Link
            href="/admin/refunds"
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-bold hover:bg-gray-50"
          >
            Admin Refunds
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 pb-40">
        {/* ==========================================
            PAGE TITLE
            ========================================== */}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#A17B1F]">
              GoldMart Administration
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              🤖 GoldMart Admin Assistant
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
              Ask questions about orders, refunds,
              payments and seller allocation records.
              No paid AI API is required.
            </p>
          </div>

          <button
            type="button"
            disabled={loading || refreshing}
            onClick={() => void loadOverview(true)}
            className="rounded-full bg-[#17191D] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh Dashboard"}
          </button>
        </div>

        {/* ==========================================
            SECURITY NOTICE
            ========================================== */}

        <div className="mt-6 rounded-2xl border border-[#E7D9AA] bg-white p-5">
          <p className="font-black">
            🔒 Free, Read-Only Assistant
          </p>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            This assistant uses predefined rules and
            current GoldMart database summaries. It is
            not a generative AI model. It cannot approve
            refunds, transfer money, ban users or
            change marketplace records.
          </p>
        </div>

        {/* ==========================================
            LOADING
            ========================================== */}

        {loading && (
          <div className="mt-8 rounded-2xl border bg-white p-8 text-center">
            <p className="font-bold">
              Loading GoldMart Admin...
            </p>
          </div>
        )}

        {/* ==========================================
            DASHBOARD ERROR
            ========================================== */}

        {pageError && (
          <div
            role="alert"
            className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6"
          >
            <h2 className="font-black text-red-700">
              {accessDenied
                ? "Administrator Access Denied"
                : "Unable to Load Dashboard"}
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {pageError}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              {!accessDenied && (
                <button
                  type="button"
                  onClick={() =>
                    void loadOverview(true)
                  }
                  className="rounded-full border bg-white px-5 py-2 text-sm font-bold"
                >
                  Try Again
                </button>
              )}

              <Link
                href="/login"
                className="rounded-full border bg-white px-5 py-2 text-sm font-bold"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}

        {/* ==========================================
            AUTHORIZED ADMIN CONTENT
            ========================================== */}

        {!loading &&
          !pageError &&
          overview &&
          data && (
            <div className="mt-8 space-y-10">
              {/* ====================================
                  FREE ASSISTANT CHAT
                  ==================================== */}

              <section className="overflow-hidden rounded-3xl border border-[#E7D9AA] bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-[#FFF9EA] px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#17191D] text-2xl">
                      🤖
                    </div>

                    <div>
                      <h2 className="text-xl font-black">
                        Chat with GoldMart Assistant
                      </h2>

                      <p className="mt-1 text-xs text-gray-600">
                        Free • Rule-based • Admin-only
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={clearChat}
                    disabled={
                      sending ||
                      messages.length === 0
                    }
                    className="rounded-full border bg-white px-4 py-2 text-xs font-bold disabled:opacity-50"
                  >
                    Clear Chat
                  </button>
                </div>

                {/* CHAT CONVERSATION */}
                <div
                  aria-live="polite"
                  className="max-h-[540px] min-h-[280px] space-y-4 overflow-y-auto bg-[#FCFBF8] p-4 sm:p-6"
                >
                  {messages.length === 0 && (
                    <div className="rounded-2xl border bg-white p-5">
                      <h3 className="text-lg font-black">
                        Welcome to GoldMart!
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        I'm your free administrator
                        assistant. I can check trusted
                        database statistics and explain
                        which operational issues need
                        attention.
                      </p>

                      <p className="mt-4 text-sm font-bold text-[#98721B]">
                        Try one of these questions:
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {SUGGESTED_QUESTIONS.map(
                          (suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() =>
                                setQuestion(suggestion)
                              }
                              className="rounded-xl border border-gray-200 bg-[#FFFDF8] px-3 py-2 text-left text-xs font-medium hover:border-[#B38A25]"
                            >
                              {suggestion}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {messages.map((item) => (
                    <div
                      key={item.id}
                      className={`flex ${
                        item.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[92%] rounded-2xl p-4 text-sm leading-7 sm:max-w-[85%] ${
                          item.role === "user"
                            ? "bg-[#17191D] text-white"
                            : "border bg-white text-gray-900"
                        }`}
                      >
                        <p className="mb-1 text-xs font-black opacity-70">
                          {item.role === "user"
                            ? "You"
                            : "GoldMart Assistant"}
                        </p>

                        <p className="whitespace-pre-wrap break-words">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  ))}

                  {sending && (
                    <div className="max-w-[90%] rounded-2xl border bg-white p-4 text-sm text-gray-600">
                      🤖 Checking marketplace
                      statistics...
                    </div>
                  )}
                </div>

                {/* CHAT ERRORS */}
                {chatError && (
                  <div
                    role="alert"
                    className="border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700"
                  >
                    {chatError}
                  </div>
                )}

                {/* MESSAGE FORM */}
                <form
                  onSubmit={sendMessage}
                  className="border-t bg-white p-4 sm:p-5"
                >
                  <label
                    htmlFor="goldmart-free-question"
                    className="block text-sm font-bold"
                  >
                    Ask the Free Admin Assistant
                  </label>

                  <textarea
                    id="goldmart-free-question"
                    value={question}
                    rows={3}
                    maxLength={500}
                    onChange={(event) =>
                      setQuestion(
                        event.target.value
                      )
                    }
                    placeholder="Example: What needs my attention today?"
                    className="mt-2 w-full resize-y rounded-2xl border border-gray-300 p-4 text-sm outline-none focus:border-[#B38A25]"
                  />

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-gray-500">
                      {question.length}/500 characters
                    </p>

                    <button
                      type="submit"
                      disabled={
                        sending ||
                        question.trim().length < 2
                      }
                      className="rounded-full bg-[#17191D] px-7 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sending
                        ? "Checking..."
                        : "Ask Assistant →"}
                    </button>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-gray-500">
                    Each request reads a fresh
                    marketplace summary. The chat
                    history stays on this page and
                    is not saved as an AI
                    conversation. Always verify
                    important decisions against
                    individual records.
                  </p>
                </form>
              </section>

              {/* ====================================
                  REPORT TIMESTAMP
                  ==================================== */}

              <p className="text-xs text-gray-500">
                Dashboard last generated:{" "}
                {data.generated_at
                  ? new Date(
                      data.generated_at
                    ).toLocaleString()
                  : "Unknown"}
                {" • "}Read-only monitoring
              </p>

              {/* ====================================
                  MARKETPLACE OVERVIEW
                  ==================================== */}

              <section>
                <SectionHeading
                  title="📊 Marketplace Overview"
                  description="Statistics from your GoldMart database."
                />

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <MetricCard
                    title="Total Orders"
                    value={overview.orders.total}
                  />

                  <MetricCard
                    title="Orders Created (24h)"
                    value={
                      overview.orders
                        .last_24_hours
                    }
                  />

                  <MetricCard
                    title="Successful Payment Records"
                    value={
                      overview.payments
                        .successful_records
                    }
                    detail="Not proof of bank settlement."
                  />

                  <MetricCard
                    title="Refund Requests"
                    value={overview.refunds.total}
                  />
                </div>
              </section>

              {/* ====================================
                  ORDERS
                  ==================================== */}

              <section>
                <SectionHeading
                  title="📦 Order Monitoring"
                  description="Monitor fulfillment and identify possible delays."
                />

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <MetricCard
                    title="Processing"
                    value={
                      overview.orders.processing
                    }
                  />

                  <MetricCard
                    title="Shipped"
                    value={
                      overview.orders.shipped
                    }
                  />

                  <MetricCard
                    title="Delivered"
                    value={
                      overview.orders.delivered
                    }
                  />

                  <MetricCard
                    title="Processing Over 72h"
                    value={
                      overview.orders
                        .processing_over_72_hours
                    }
                  />
                </div>
              </section>

              {/* ====================================
                  REFUNDS
                  ==================================== */}

              <section>
                <SectionHeading
                  title="🛡️ Refund Monitoring"
                  description="Statuses requiring administrator attention."
                />

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <MetricCard
                    title="Awaiting Review"
                    value={
                      overview.refunds
                        .awaiting_review
                    }
                  />

                  <MetricCard
                    title="Approved Records"
                    value={
                      overview.refunds.approved
                    }
                  />

                  <MetricCard
                    title="Refund Pending"
                    value={
                      overview.refunds
                        .refund_pending
                    }
                  />

                  <MetricCard
                    title="Rejected Records"
                    value={
                      overview.refunds.rejected
                    }
                  />
                </div>

                <Link
                  href="/admin/refunds"
                  className="mt-4 inline-block rounded-full border border-[#B38A25] bg-white px-5 py-2 text-sm font-bold text-[#896716]"
                >
                  Open Refund Management →
                </Link>
              </section>

              {/* ====================================
                  SELLER ALLOCATIONS
                  ==================================== */}

              <section>
                <SectionHeading
                  title="🏪 Seller Allocations"
                  description="Internal accounting records, not withdrawable seller balances."
                />

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <MetricCard
                    title="Total Allocations"
                    value={
                      overview.seller_allocations
                        .total
                    }
                  />

                  <MetricCard
                    title="Pending Review"
                    value={
                      overview.seller_allocations
                        .pending_review
                    }
                  />

                  <MetricCard
                    title="Blocked"
                    value={
                      overview.seller_allocations
                        .blocked
                    }
                  />

                  <MetricCard
                    title="Settled Records"
                    value={
                      overview.seller_allocations
                        .settled_records
                    }
                    detail="Not proof of a bank transfer."
                  />
                </div>
              </section>

              {/* ====================================
                  OPERATIONAL ALERTS
                  ==================================== */}

              <section>
                <SectionHeading
                  title="⚠️ Operational Alerts"
                  description="Rule-based warnings, not evidence of misconduct."
                />

                {data.alerts.length === 0 ? (
                  <div className="rounded-2xl border bg-white p-6">
                    <p className="font-bold">
                      No alerts from the current
                      monitoring rules.
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      This does not guarantee that
                      every order, payment or account
                      is problem-free.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.alerts.map(
                      (alert, index) => (
                        <div
                          key={`${alert.type}-${index}`}
                          className="rounded-2xl border border-amber-200 bg-white p-5"
                        >
                          <h3 className="font-black">
                            ⚠️ {alert.title}
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-gray-600">
                            {alert.message}
                          </p>

                          {alert.human_review_required && (
                            <p className="mt-3 text-xs font-bold text-[#987216]">
                              Human review required
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </section>

              {/* ====================================
                  SECURITY
                  ==================================== */}

              <section className="rounded-2xl border bg-white p-6">
                <h2 className="text-lg font-black">
                  🔐 Administrator Security
                </h2>

                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p>
                    Administrator ID:{" "}
                    <strong>
                      {
                        data.security
                          .administrator_id
                      }
                    </strong>
                  </p>

                  <p>
                    Assistant type:{" "}
                    <strong>
                      Free rule-based assistant
                    </strong>
                  </p>

                  <p>
                    Database access:{" "}
                    <strong>Read-only</strong>
                  </p>

                  <p>
                    Financial actions:{" "}
                    <strong>Disabled</strong>
                  </p>

                  <p>
                    Sensitive decisions:{" "}
                    <strong>
                      Human approval required
                    </strong>
                  </p>
                </div>
              </section>
            </div>
          )}
      </div>
    </main>
  );
}
