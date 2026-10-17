
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

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

type AllocationsSummary = {
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
    seller_allocations: AllocationsSummary;
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
  role: "user" | "assistant";
  content: string;
};

type ChatApiResponse = {
  success?: boolean;
  answer?: string;
  message?: string;
  model?: string;
};

// ============================================
// REUSABLE DASHBOARD COMPONENTS
// ============================================

function MetricCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: number;
  detail?: string;
}) {
  const number = Number(value);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-black text-[#98721B]">
        {Number.isFinite(number)
          ? number.toLocaleString()
          : "—"}
      </p>

      {detail && (
        <p className="mt-2 text-xs text-gray-500">
          {detail}
        </p>
      )}
    </div>
  );
}

function SectionTitle({
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

// ============================================
// GOLDMART AI ADMIN PAGE
// ============================================

export default function AiAdminPage() {
  const [data, setData] =
    useState<AdminOverview | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [accessDenied, setAccessDenied] =
    useState(false);

  // ==========================================
  // AI CHAT STATE
  // ==========================================

  const [question, setQuestion] =
    useState("");

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [sending, setSending] =
    useState(false);

  const [chatError, setChatError] =
    useState("");

  // ==========================================
  // LOAD ADMIN DASHBOARD
  // ==========================================

  const loadOverview = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setAccessDenied(false);

      try {
        const token =
          localStorage.getItem("goldmart_token");

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

        if (response.status === 403) {
          setData(null);
          setAccessDenied(true);

          throw new Error(
            "Access denied. This page is restricted to authorized GoldMart administrators."
          );
        }

        if (response.status === 401) {
          setData(null);

          throw new Error(
            "Your session has expired. Please sign in again."
          );
        }

        if (
          !response.ok ||
          !result?.success ||
          !result.overview ||
          !result.security ||
          !Array.isArray(result.alerts)
        ) {
          throw new Error(
            result?.message ||
            "Unable to load AI Admin data."
          );
        }

        setData(result as AdminOverview);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard."
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

  // ==========================================
  // SEND A QUESTION TO THE REAL AI MODEL
  // ==========================================

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

    const token =
      localStorage.getItem("goldmart_token");

    if (!token) {
      setChatError(
        "Please sign in to use GoldMart AI."
      );
      return;
    }

    setSending(true);
    setChatError("");
    setQuestion("");

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: message,
      },
    ]);

    try {
      const response = await fetch(
        `${API_URL}/api/ai-admin/chat`,
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
        .catch(() => ({}))) as ChatApiResponse;

      if (
        !response.ok ||
        !result.success ||
        !result.answer
      ) {
        throw new Error(
          result.message ||
          `AI request failed (${response.status}).`
        );
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.answer || "",
        },
      ]);
    } catch (err) {
      setChatError(
        err instanceof Error
          ? err.message
          : "GoldMart AI could not answer your question."
      );
    } finally {
      setSending(false);
    }
  }

  const overview = data?.overview;

  // ==========================================
  // PAGE INTERFACE
  // ==========================================

  return (
    <main className="min-h-screen bg-[#F8F7F3] text-gray-900">
      {/* HEADER */}
      <header className="border-b border-[#E9DEBE] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5">
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
            className="rounded-full border px-4 py-2 text-sm font-bold hover:bg-gray-50"
          >
            Admin Refunds
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 pb-36">
        {/* TITLE */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#A17B1F]">
              Task 10
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              🤖 GoldMart AI Admin
            </h1>

            <p className="mt-3 max-w-2xl text-sm text-gray-600">
              Your secure marketplace assistant for
              orders, refunds, seller activity and
              operational reports.
            </p>
          </div>

          <button
            type="button"
            disabled={loading || refreshing}
            onClick={() =>
              void loadOverview(true)
            }
            className="rounded-full bg-[#17191D] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh Dashboard"}
          </button>
        </div>

        {/* SECURITY NOTICE */}
        <div className="mt-6 rounded-2xl border border-[#E7D9AA] bg-white p-5">
          <p className="font-black">
            🔒 Security-first AI Assistant
          </p>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            GoldMart AI can analyze available
            marketplace statistics and recommend
            actions. It cannot approve refunds,
            transfer money, ban accounts, or change
            payment settings.
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="mt-8 rounded-2xl border bg-white p-8 text-center">
            <p className="font-bold">
              Loading GoldMart AI Admin...
            </p>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div
            role="alert"
            className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6"
          >
            <h2 className="font-black text-red-700">
              {accessDenied
                ? "Administrator access denied"
                : "Unable to load dashboard"}
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error}
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

        {/* AUTHORIZED ADMIN CONTENT */}
        {!loading && !error && overview && data && (
          <div className="mt-8 space-y-10">
            {/* ==================================
                REAL AI CHAT
                ================================== */}

            <section
              aria-label="GoldMart AI chat"
              className="overflow-hidden rounded-3xl border border-[#E7D9AA] bg-white shadow-sm"
            >
              <div className="border-b bg-[#FFF9EA] px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#17191D] text-2xl">
                    🤖
                  </div>

                  <div>
                    <h2 className="text-xl font-black">
                      Chat with GoldMart AI
                    </h2>

                    <p className="mt-1 text-xs text-gray-600">
                      Real AI model • Admin-only •
                      Read-only
                    </p>
                  </div>
                </div>
              </div>

              {/* CHAT MESSAGES */}
              <div
                aria-live="polite"
                className="max-h-[520px] min-h-[260px] space-y-4 overflow-y-auto bg-[#FCFBF8] p-4 sm:p-6"
              >
                {messages.length === 0 && (
                  <div className="rounded-2xl border bg-white p-5">
                    <p className="font-black">
                      Welcome to GoldMart AI!
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      Ask me about your marketplace.
                      I can review available order
                      statistics, explain refund alerts,
                      and recommend what needs attention.
                    </p>

                    <p className="mt-4 text-sm font-semibold text-[#98721B]">
                      Example questions:
                    </p>

                    <div className="mt-2 space-y-2 text-sm text-gray-600">
                      <p>
                        “How many orders are processing?”
                      </p>
                      <p>
                        “What problems should I check today?”
                      </p>
                      <p>
                        “Are there refund requests waiting
                        for review?”
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[92%] rounded-2xl p-4 text-sm leading-7 sm:max-w-[85%] ${
                        message.role === "user"
                          ? "bg-[#17191D] text-white"
                          : "border bg-white text-gray-900"
                      }`}
                    >
                      <p className="mb-1 text-xs font-black opacity-70">
                        {message.role === "user"
                          ? "You"
                          : "GoldMart AI"}
                      </p>

                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="max-w-[85%] rounded-2xl border bg-white p-4 text-sm text-gray-600">
                    🤖 GoldMart AI is analyzing...
                  </div>
                )}
              </div>

              {/* CHAT ERROR */}
              {chatError && (
                <div
                  role="alert"
                  className="border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700"
                >
                  {chatError}
                </div>
              )}

              {/* CHAT FORM */}
              <form
                onSubmit={sendMessage}
                className="border-t bg-white p-4 sm:p-5"
              >
                <label
                  htmlFor="goldmart-ai-question"
                  className="block text-sm font-bold"
                >
                  Ask GoldMart AI
                </label>

                <textarea
                  id="goldmart-ai-question"
                  value={question}
                  maxLength={500}
                  rows={3}
                  onChange={(event) =>
                    setQuestion(event.target.value)
                  }
                  placeholder="Ask about orders, refunds, seller allocations or marketplace risks..."
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
                      ? "Thinking..."
                      : "Send to AI →"}
                  </button>
                </div>

                <p className="mt-3 text-xs leading-5 text-gray-500">
                  Each question is analyzed using a
                  fresh marketplace summary. Earlier
                  chat messages are displayed here
                  but are not sent as conversation
                  history. AI responses may be
                  inaccurate; verify important
                  conclusions against the records.
                </p>
              </form>
            </section>

            {/* REPORT TIME */}
            <p className="text-xs text-gray-500">
              Dashboard report:{" "}
              {data.generated_at
                ? new Date(
                    data.generated_at
                  ).toLocaleString()
                : "Unknown"}
              {" • "}Read-only
            </p>

            {/* MARKETPLACE OVERVIEW */}
            <section>
              <SectionTitle
                title="Marketplace Overview"
                description="Counts retrieved from your GoldMart database."
              />

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard
                  title="Total Orders"
                  value={overview.orders.total}
                />

                <MetricCard
                  title="New Orders (24h)"
                  value={
                    overview.orders.last_24_hours
                  }
                />

                <MetricCard
                  title="Verified Payment Records"
                  value={
                    overview.payments.successful_records
                  }
                  detail="Database records, not bank settlements."
                />

                <MetricCard
                  title="Refund Requests"
                  value={overview.refunds.total}
                />
              </div>
            </section>

            {/* ORDER MONITORING */}
            <section>
              <SectionTitle
                title="📦 Order Monitoring"
                description="Check fulfillment activity without modifying orders."
              />

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard
                  title="Processing"
                  value={overview.orders.processing}
                />

                <MetricCard
                  title="Shipped"
                  value={overview.orders.shipped}
                />

                <MetricCard
                  title="Delivered"
                  value={overview.orders.delivered}
                />

                <MetricCard
                  title="Delayed (72h+)"
                  value={
                    overview.orders
                      .processing_over_72_hours
                  }
                />
              </div>
            </section>

            {/* REFUND MONITORING */}
            <section>
              <SectionTitle
                title="🛡️ Refund Monitoring"
                description="Review refund statuses and identify cases needing attention."
              />

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard
                  title="Awaiting Review"
                  value={
                    overview.refunds.awaiting_review
                  }
                />

                <MetricCard
                  title="Approved"
                  value={overview.refunds.approved}
                />

                <MetricCard
                  title="Refund Pending"
                  value={
                    overview.refunds.refund_pending
                  }
                />

                <MetricCard
                  title="Rejected"
                  value={overview.refunds.rejected}
                />
              </div>

              <Link
                href="/admin/refunds"
                className="mt-4 inline-block rounded-full border border-[#B38A25] bg-white px-5 py-2 text-sm font-bold text-[#896716]"
              >
                Open Refund Management →
              </Link>
            </section>

            {/* SELLER ALLOCATIONS */}
            <section>
              <SectionTitle
                title="🏪 Seller Allocations"
                description="Accounting records, not withdrawable balances."
              />

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard
                  title="Total Allocations"
                  value={
                    overview.seller_allocations.total
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
                    overview.seller_allocations.blocked
                  }
                />

                <MetricCard
                  title="Settled Records"
                  value={
                    overview.seller_allocations
                      .settled_records
                  }
                  detail="Not proof of bank transfer."
                />
              </div>
            </section>

            {/* OPERATIONAL ALERTS */}
            <section>
              <SectionTitle
                title="⚠️ Operational Alerts"
                description="Alerts signal possible problems, not proven wrongdoing."
              />

              {data.alerts.length === 0 ? (
                <div className="rounded-2xl border bg-white p-6">
                  <p className="font-bold">
                    No alerts from the current checks.
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    This does not guarantee that every
                    order or account is risk-free.
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

            {/* SECURITY DETAILS */}
            <section className="rounded-2xl border bg-white p-6">
              <h2 className="text-lg font-black">
                🔐 Administrator Security
              </h2>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p>
                  Administrator ID:{" "}
                  <strong>
                    {data.security.administrator_id}
                  </strong>
                </p>

                <p>
                  Monitoring:{" "}
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
