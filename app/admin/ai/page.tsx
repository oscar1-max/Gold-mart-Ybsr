
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

// ==============================================
// GOLDMART ADMIN ASSISTANT PRO
// FREE ANALYTICS DASHBOARD
// ==============================================
//
// No paid AI API.
// No additional npm packages.
// Backend administrator verification required.
//
// ==============================================

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

// ==============================================
// TYPES
// ==============================================

type OrderSummary = {
  total: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  last_24_hours: number;
  processing_over_72_hours: number;
};

type PaymentSummary = {
  total_records: number;
  successful_records: number;
};

type RefundSummary = {
  total: number;
  awaiting_review: number;
  approved: number;
  refund_pending: number;
  rejected: number;
};

type AllocationSummary = {
  total: number;
  pending_review: number;
  blocked: number;
  settled_records: number;
};

type Trend = {
  direction: "up" | "down" | "unchanged" | "no_baseline";
  percent: number | null;
};

type Analytics = {
  order_activity: {
    last_24_hours: number;
    previous_24_hours: number;
    last_7_days: number;
    previous_7_days: number;
    change_last_24_hours: Trend;
    change_last_7_days: Trend;
    recent_orders_currently_cancelled: number;
    recent_orders_cancelled_percent: number | null;
  };
  fulfillment: {
    processing_over_72_hours: number;
    processing_over_7_days: number;
    processing_between_72_hours_and_7_days: number;
  };
  notes?: string[];
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
  overview: {
    orders: OrderSummary;
    payments: PaymentSummary;
    refunds: RefundSummary;
    seller_allocations: AllocationSummary;
  };
  analytics?: Analytics;
  alerts: AdminAlert[];
  security: {
    administrator_id: number;
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
};

const QUESTIONS = [
  "What needs my attention today?",
  "Compare orders in the last 7 days with the previous 7 days.",
  "Check delayed orders and pending refunds.",
  "Show order, refund and seller allocation statistics.",
  "Are there signs of suspicious activity?",
];

// ==============================================
// DISPLAY HELPERS
// ==============================================

function num(value: number | undefined) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed.toLocaleString()
    : "—";
}

function priority(severity: string) {
  if (severity === "high") return 0;
  if (severity === "attention") return 1;
  return 2;
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#FFF8F2] bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-500 sm:text-sm">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-[#FF6B00]">
        {num(value)}
      </p>

      {detail && (
        <p className="mt-2 text-xs leading-5 text-gray-500">
          {detail}
        </p>
      )}
    </div>
  );
}

function Heading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-black text-gray-900">
        {title}
      </h2>

      {subtitle && (
        <p className="mt-1 text-sm leading-6 text-gray-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ==============================================
// SIMPLE BAR CHART
// NO CHART LIBRARY REQUIRED
// ==============================================

function ComparisonBars({
  current,
  previous,
  currentLabel,
  previousLabel,
}: {
  current: number;
  previous: number;
  currentLabel: string;
  previousLabel: string;
}) {
  const max = Math.max(current, previous, 1);

  const currentWidth = Math.min(
    100,
    Math.max(0, (current / max) * 100)
  );

  const previousWidth = Math.min(
    100,
    Math.max(0, (previous / max) * 100)
  );

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-gray-600">
            {currentLabel}
          </span>
          <strong>{num(current)}</strong>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#243B53]"
            style={{ width: `${currentWidth}%` }}
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-gray-600">
            {previousLabel}
          </span>
          <strong>{num(previous)}</strong>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#14263D]"
            style={{ width: `${previousWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function TrendLabel({ trend }: { trend: Trend }) {
  if (
    trend.percent === null ||
    trend.direction === "no_baseline"
  ) {
    return (
      <span className="text-sm font-semibold text-gray-500">
        No previous baseline
      </span>
    );
  }

  const positive = trend.percent > 0;
  const negative = trend.percent < 0;

  return (
    <span
      className={`text-sm font-bold ${
        positive
          ? "text-orange-700"
          : negative
            ? "text-red-700"
            : "text-gray-500"
      }`}
    >
      {positive ? "↑ " : negative ? "↓ " : "→ "}
      {Math.abs(trend.percent)}%
      {positive
        ? " increase"
        : negative
          ? " decrease"
          : " unchanged"}
    </span>
  );
}

// ==============================================
// MAIN PAGE
// ==============================================

export default function AiAdminPage() {
  const [data, setData] =
    useState<AdminOverview | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");

  const messageCounter = useRef(0);

  // ==============================================
  // LOAD ADMIN DASHBOARD
  // ==============================================

  const loadOverview = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setPageError("");
      setAccessDenied(false);

      try {
        const token = localStorage.getItem(
          "goldmart_token"
        );

        if (!token) {
          setData(null);
          throw new Error(
            "Please sign in to your administrator account."
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
            "Your session expired. Please sign in again."
          );
        }

        if (response.status === 403) {
          setData(null);
          setAccessDenied(true);
          throw new Error(
            "Administrator access denied."
          );
        }

        if (
          !response.ok ||
          !result?.success ||
          !result.overview ||
          !Array.isArray(result.alerts) ||
          !result.security
        ) {
          setData(null);
          throw new Error(
            result?.message ||
              "Could not load marketplace analytics."
          );
        }

        setData(result as AdminOverview);
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
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

  // ==============================================
  // FREE CHAT — NO PAID AI REQUESTS
  // ==============================================

  async function sendMessage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const text = question.trim();

    if (sending || text.length < 2 || text.length > 500) {
      return;
    }

    const token = localStorage.getItem(
      "goldmart_token"
    );

    if (!token) {
      setChatError("Please sign in first.");
      return;
    }

    setSending(true);
    setChatError("");
    setQuestion("");

    const userId = ++messageCounter.current;

    setMessages((current) => [
      ...current,
      {
        id: userId,
        role: "user",
        content: text,
      },
    ]);

    try {
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
            message: text,
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
        throw new Error(
          result.message ||
            `Assistant error (${response.status}).`
        );
      }

      const assistantId = ++messageCounter.current;

      setMessages((current) => [
        ...current,
        {
          id: assistantId,
          role: "assistant",
          content: result.answer || "",
        },
      ]);
    } catch (error) {
      setChatError(
        error instanceof Error
          ? error.message
          : "Unable to contact the free assistant."
      );
    } finally {
      setSending(false);
    }
  }

  const overview = data?.overview;
  const analytics = data?.analytics;

  const orderedAlerts = [...(data?.alerts || [])].sort(
    (a, b) =>
      priority(a.severity) -
      priority(b.severity)
  );

  const highPriorityCount = orderedAlerts.filter(
    (alert) => alert.severity === "high"
  ).length;

  // ==============================================
  // PAGE
  // ==============================================

  return (
    <main className="min-h-screen bg-[#FFFFFF] pb-32 text-[#14263D] md:pb-12">
      {/* Admin visual identity: existing permissions and actions remain authoritative */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="relative overflow-hidden rounded-[28px] px-6 py-8 text-white shadow-[0_18px_38px_rgba(22,39,46,0.13)] sm:px-10 sm:py-11" style={{background:"linear-gradient(135deg, #14263D 0%, #243B53 50%, #FF6B00 100%)"}}>
          <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-12 text-[150px] leading-none opacity-10">◈</span>
          <div className="relative">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.23em]" style={{color:"#FFF8F2"}}>GOLDMART PRIVATE ADMIN · INTELLIGENCE STUDIO</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">AI Admin</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">Insights, conversations, and decisions at a glance.</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[11px] font-bold text-white/90"><span className="h-2 w-2 rounded-full bg-[#FFF8F2]"/>Authorized access required</div>
          </div>
        </div>
        <nav aria-label="Admin workspaces" className="og-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2">
          <Link href="/admin" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#FFF8F2] bg-white text-[#243B53] hover:border-[#FFE9CC] hover:bg-[#FFF8F2]">Overview</Link>
          <Link href="/admin/ai" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#243B53] bg-[#243B53] text-white">AI Admin</Link>
          <Link href="/admin/monitoring" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#FFF8F2] bg-white text-[#243B53] hover:border-[#FFE9CC] hover:bg-[#FFF8F2]">Monitoring</Link>
          <Link href="/admin/support-assistant" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#FFF8F2] bg-white text-[#243B53] hover:border-[#FFE9CC] hover:bg-[#FFF8F2]">Assistant</Link>
          <Link href="/admin/reports" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#FFF8F2] bg-white text-[#243B53] hover:border-[#FFE9CC] hover:bg-[#FFF8F2]">Reports</Link>
          <Link href="/admin/refunds" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#FFF8F2] bg-white text-[#243B53] hover:border-[#FFE9CC] hover:bg-[#FFF8F2]">Refunds</Link>
          <Link href="/admin/support" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#FFF8F2] bg-white text-[#243B53] hover:border-[#FFE9CC] hover:bg-[#FFF8F2]">Support</Link>
        </nav>
      </div>

      <header className="border-b border-[#FFE9CC] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5">
          <Link href="/" className="text-2xl font-black">
            Gold
            <span className="text-[#243B53]">
              Mart
            </span>
          </Link>

          <Link
            href="/admin/refunds"
            className="rounded-full border px-4 py-2 text-sm font-bold"
          >
            Admin Refunds
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-9 px-4 py-8 pb-40">
        {/* PAGE HEADER */}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#FF6B00]">
              GoldMart Administration
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              🤖 Admin Assistant Pro
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Free marketplace analysis, order trends,
              operational alerts and administrator reports.
            </p>
          </div>

          <button
            type="button"
            disabled={loading || refreshing}
            onClick={() => void loadOverview(true)}
            className="rounded-full bg-[#243B53] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh Reports"}
          </button>
        </div>

        <div className="rounded-2xl border border-[#FFF8F2] bg-white p-4 text-sm leading-6 text-gray-600">
          <strong className="text-gray-900">
            🔒 Free • Rule-based • Administrator-only
          </strong>
          <p className="mt-1">
            No paid AI API is used. The assistant analyzes
            trusted database summaries but cannot approve
            refunds, send payments, ban accounts or modify
            records.
          </p>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="rounded-[21px] border border-[#FFF8F2] bg-white shadow-[0_5px_18px_rgba(26,43,48,0.035)] p-8 text-center">
            Loading GoldMart analytics...
          </div>
        )}

        {/* ERROR */}

        {pageError && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5"
          >
            <h2 className="font-black text-red-700">
              {accessDenied
                ? "Administrator Access Denied"
                : "Dashboard Error"}
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {pageError}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              {!accessDenied && (
                <button
                  type="button"
                  onClick={() => void loadOverview(true)}
                  className="rounded-full border bg-white px-4 py-2 text-sm font-bold"
                >
                  Try Again
                </button>
              )}

              <Link
                href="/login"
                className="rounded-full border bg-white px-4 py-2 text-sm font-bold"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}

        {/* AUTHORIZED DASHBOARD */}

        {!loading && !pageError && data && overview && (
          <>
            {/* CHAT */}

            <section className="overflow-hidden rounded-3xl border border-[#FFF8F2] bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-[#FFF8F2] bg-[#FFF8F2] p-5">
                <div>
                  <h2 className="text-xl font-black">
                    💬 Chat with GoldMart Pro
                  </h2>

                  <p className="mt-1 text-xs text-gray-600">
                    Free • Multi-topic reports • Read-only
                  </p>
                </div>

                <button
                  type="button"
                  disabled={sending || messages.length === 0}
                  onClick={() => {
                    setMessages([]);
                    setChatError("");
                  }}
                  className="rounded-full border bg-white px-4 py-2 text-xs font-bold disabled:opacity-50"
                >
                  Clear Chat
                </button>
              </div>

              <div
                aria-live="polite"
                className="max-h-[540px] min-h-[300px] space-y-3 overflow-y-auto bg-[#FFF8F2] p-4 sm:p-6"
              >
                {messages.length === 0 && (
                  <div className="rounded-[21px] border border-[#FFF8F2] bg-white shadow-[0_5px_18px_rgba(26,43,48,0.035)] p-4">
                    <p className="font-black">
                      Ask me about your marketplace.
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                      I can combine order and refund
                      reports, compare recent activity,
                      and identify issues requiring review.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {QUESTIONS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setQuestion(item)}
                          className="rounded-xl border border-[#FFE9CC] bg-[#FFFFFF] px-3 py-2 text-left text-xs font-semibold hover:border-[#243B53]"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[92%] rounded-2xl p-4 text-sm leading-7 sm:max-w-[85%] ${
                        message.role === "user"
                          ? "bg-[#14263D] text-white"
                          : "border bg-white text-gray-900"
                      }`}
                    >
                      <p className="mb-1 text-xs font-black opacity-70">
                        {message.role === "user"
                          ? "You"
                          : "GoldMart Pro"}
                      </p>

                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}

                {sending && (
                  <p className="rounded-xl border bg-white p-3 text-sm text-gray-600">
                    🤖 Analyzing marketplace records...
                  </p>
                )}
              </div>

              {chatError && (
                <div
                  role="alert"
                  className="border-t border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {chatError}
                </div>
              )}

              <form
                onSubmit={sendMessage}
                className="border-t p-4 sm:p-5"
              >
                <label
                  htmlFor="admin-pro-question"
                  className="text-sm font-bold"
                >
                  Ask GoldMart Pro
                </label>

                <textarea
                  id="admin-pro-question"
                  value={question}
                  rows={3}
                  maxLength={500}
                  onChange={(event) =>
                    setQuestion(event.target.value)
                  }
                  placeholder="Example: Check orders and refund requests together."
                  className="mt-2 w-full rounded-2xl border border-gray-300 p-4 text-sm outline-none focus:border-[#243B53]"
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-gray-500">
                    {question.length}/500 characters
                  </span>

                  <button
                    type="submit"
                    disabled={
                      sending ||
                      question.trim().length < 2
                    }
                    className="rounded-full bg-[#243B53] px-6 py-3 text-sm font-black text-white disabled:opacity-50"
                  >
                    {sending
                      ? "Analyzing..."
                      : "Ask Assistant →"}
                  </button>
                </div>
              </form>
            </section>

            {/* MAIN COUNTS */}

            <section>
              <Heading
                title="📊 Marketplace Overview"
                subtitle="Current database counts. These are not verified bank settlement figures."
              />

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Metric
                  label="Total Orders"
                  value={overview.orders.total}
                />

                <Metric
                  label="Orders in Last 24h"
                  value={overview.orders.last_24_hours}
                />

                <Metric
                  label="Successful Payment Records"
                  value={
                    overview.payments.successful_records
                  }
                />

                <Metric
                  label="Total Refund Requests"
                  value={overview.refunds.total}
                />
              </div>
            </section>

            {/* ADVANCED ANALYTICS */}

            {analytics && (
              <section>
                <Heading
                  title="📈 Advanced Order Analytics"
                  subtitle="Compare rolling periods to understand marketplace activity."
                />

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[21px] border border-[#FFF8F2] bg-white shadow-[0_5px_18px_rgba(26,43,48,0.035)] p-5 shadow-sm">
                    <h3 className="font-black">
                      Last 24 Hours
                    </h3>

                    <p className="mt-2">
                      <TrendLabel
                        trend={
                          analytics.order_activity
                            .change_last_24_hours
                        }
                      />
                    </p>

                    <div className="mt-6">
                      <ComparisonBars
                        current={
                          analytics.order_activity
                            .last_24_hours
                        }
                        previous={
                          analytics.order_activity
                            .previous_24_hours
                        }
                        currentLabel="Most recent 24h"
                        previousLabel="Previous 24h"
                      />
                    </div>
                  </div>

                  <div className="rounded-[21px] border border-[#FFF8F2] bg-white shadow-[0_5px_18px_rgba(26,43,48,0.035)] p-5 shadow-sm">
                    <h3 className="font-black">
                      Last 7 Days
                    </h3>

                    <p className="mt-2">
                      <TrendLabel
                        trend={
                          analytics.order_activity
                            .change_last_7_days
                        }
                      />
                    </p>

                    <div className="mt-6">
                      <ComparisonBars
                        current={
                          analytics.order_activity
                            .last_7_days
                        }
                        previous={
                          analytics.order_activity
                            .previous_7_days
                        }
                        currentLabel="Most recent 7 days"
                        previousLabel="Previous 7 days"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
                  <Metric
                    label="Processing Over 72 Hours"
                    value={
                      analytics.fulfillment
                        .processing_over_72_hours
                    }
                  />

                  <Metric
                    label="Processing Over 7 Days"
                    value={
                      analytics.fulfillment
                        .processing_over_7_days
                    }
                    detail="Included in the 72-hour count."
                  />

                  <Metric
                    label="Recent Orders Now Cancelled"
                    value={
                      analytics.order_activity
                        .recent_orders_currently_cancelled
                    }
                    detail="Orders created within the last 7 days."
                  />
                </div>

                <p className="mt-3 text-xs leading-5 text-gray-500">
                  These charts compare order counts, not
                  revenue. An increase in orders does not
                  necessarily mean higher profits.
                </p>
              </section>
            )}

            {/* OPERATIONAL ALERTS */}

            <section>
              <Heading
                title="🚨 Priority Alert Center"
                subtitle="Rule-based alerts ordered by severity. Human review is required."
              />

              <div className="mb-4 flex flex-wrap gap-3">
                <div className="rounded-full border bg-white px-4 py-2 text-sm font-bold">
                  Total alerts: {orderedAlerts.length}
                </div>

                <div className="rounded-full border bg-white px-4 py-2 text-sm font-bold">
                  High priority: {highPriorityCount}
                </div>
              </div>

              {orderedAlerts.length === 0 ? (
                <div className="rounded-[21px] border border-[#FFF8F2] bg-white shadow-[0_5px_18px_rgba(26,43,48,0.035)] p-5">
                  <p className="font-bold">
                    No alerts triggered by the current rules.
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    This does not guarantee that every
                    transaction or account is problem-free.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orderedAlerts.map((alert, index) => (
                    <div
                      key={`${alert.type}-${index}`}
                      className="rounded-2xl border border-[#FFF8F2] bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black uppercase">
                          {alert.severity}
                        </span>

                        <h3 className="font-black">
                          {alert.title}
                        </h3>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-gray-600">
                        {alert.message}
                      </p>

                      {alert.human_review_required && (
                        <p className="mt-3 text-xs font-bold text-[#FF6B00]">
                          Human review required
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ORDERS */}

            <section>
              <Heading
                title="📦 Order Monitoring"
                subtitle="Current order statuses from GoldMart."
              />

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Metric
                  label="Processing"
                  value={overview.orders.processing}
                />

                <Metric
                  label="Shipped"
                  value={overview.orders.shipped}
                />

                <Metric
                  label="Delivered"
                  value={overview.orders.delivered}
                />

                <Metric
                  label="Cancelled"
                  value={overview.orders.cancelled}
                />
              </div>
            </section>

            {/* REFUNDS */}

            <section>
              <Heading
                title="🛡️ Refund Monitoring"
                subtitle="Refund status records requiring administrative oversight."
              />

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Metric
                  label="Awaiting Review"
                  value={overview.refunds.awaiting_review}
                />

                <Metric
                  label="Approved Records"
                  value={overview.refunds.approved}
                />

                <Metric
                  label="Refund Pending"
                  value={overview.refunds.refund_pending}
                />

                <Metric
                  label="Rejected Records"
                  value={overview.refunds.rejected}
                />
              </div>

              <Link
                href="/admin/refunds"
                className="mt-4 inline-block rounded-full border border-[#243B53] bg-white px-5 py-3 text-sm font-bold text-[#243B53]"
              >
                Open Refund Management →
              </Link>
            </section>

            {/* SELLERS */}

            <section>
              <Heading
                title="🏪 Seller Allocations"
                subtitle="Internal accounting records, not verified bank payouts."
              />

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Metric
                  label="Total Allocations"
                  value={
                    overview.seller_allocations.total
                  }
                />

                <Metric
                  label="Pending Review"
                  value={
                    overview.seller_allocations
                      .pending_review
                  }
                />

                <Metric
                  label="Blocked"
                  value={
                    overview.seller_allocations.blocked
                  }
                />

                <Metric
                  label="Marked Settled"
                  value={
                    overview.seller_allocations
                      .settled_records
                  }
                  detail="Not proof of a bank transfer."
                />
              </div>
            </section>

            {/* SECURITY AND FOOTER */}

            <section className="rounded-[21px] border border-[#FFF8F2] bg-white shadow-[0_5px_18px_rgba(26,43,48,0.035)] p-5">
              <h2 className="text-lg font-black">
                🔐 Administrator Security
              </h2>

              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <p>
                  Administrator ID:{" "}
                  <strong>
                    {data.security.administrator_id}
                  </strong>
                </p>

                <p>
                  Assistant:{" "}
                  <strong>
                    Free rule-based analysis
                  </strong>
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

                <p>
                  Report generated:{" "}
                  <strong>
                    {new Date(
                      data.generated_at
                    ).toLocaleString()}
                  </strong>
                </p>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
