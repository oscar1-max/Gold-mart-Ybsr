
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
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
  service: string;
  mode: string;
  generated_at: string;
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

function numberValue(value: number | undefined) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-black text-[#9B7415]">
        {numberValue(value).toLocaleString()}
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

export default function AiAdminPage() {
  const [data, setData] =
    useState<AdminOverview | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] =
    useState(false);

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
        const token = localStorage.getItem(
          "goldmart_token"
        );

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
            "Access denied. This page is only for authorized GoldMart administrators."
          );
        }

        if (response.status === 401) {
          setData(null);

          throw new Error(
            "Your session has expired. Please sign in again."
          );
        }

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.message ||
            `Unable to load AI Admin (${response.status}).`
          );
        }

        if (
          !result.overview ||
          !result.security ||
          !Array.isArray(result.alerts)
        ) {
          throw new Error(
            "The AI Admin response is incomplete."
          );
        }

        // The backend is the authority.
        // The UI never grants admin permissions.

        setData(result as AdminOverview);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load AI Admin."
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

  const overview = data?.overview;

  return (
    <main className="min-h-screen bg-[#F8F7F3] text-gray-900">
      {/* HEADER */}
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

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/refunds"
              className="rounded-full border px-4 py-2 text-sm font-bold hover:bg-gray-50"
            >
              Admin Refunds
            </Link>

            <Link
              href="/"
              className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 pb-32">
        {/* TITLE */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#A17B1F]">
              Task 10
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              🤖 GoldMart AI Admin
            </h1>

            <p className="mt-3 max-w-2xl text-sm text-gray-600">
              Secure marketplace monitoring, operational
              alerts and administrator reports.
            </p>
          </div>

          <button
            type="button"
            disabled={loading || refreshing}
            onClick={() => void loadOverview(true)}
            className="rounded-full bg-[#17191D] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh Dashboard"}
          </button>
        </div>

        {/* STATUS INFORMATION */}
        <div className="mt-6 rounded-2xl border border-[#E7D9AA] bg-white p-5">
          <p className="font-black">
            🔒 Security-first Admin Monitoring
          </p>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            This dashboard is read-only. It cannot approve
            refunds, pay sellers, suspend accounts or
            change Paystack settings.
          </p>

          <p className="mt-2 text-xs text-gray-500">
            AI analysis, autonomous monitoring and customer
            support automation will be added in later stages.
          </p>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="mt-8 rounded-2xl border bg-white p-8 text-center">
            <p className="font-bold">
              Loading GoldMart Admin data...
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

            {!accessDenied && (
              <button
                type="button"
                onClick={() => void loadOverview(true)}
                className="mt-4 rounded-full border border-red-300 bg-white px-5 py-2 text-sm font-bold"
              >
                Try Again
              </button>
            )}

            <Link
              href="/login"
              className="ml-3 mt-4 inline-block text-sm font-bold underline"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* DASHBOARD CONTENT */}
        {!loading && overview && data && (
          <div className="mt-8 space-y-10">
            {/* REPORT TIME */}
            <p className="text-xs text-gray-500">
              Last report:{" "}
              {data.generated_at
                ? new Date(
                    data.generated_at
                  ).toLocaleString()
                : "Unknown"}
              {" • "}
              Mode: Read-only
            </p>

            {/* KEY NUMBERS */}
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
                  title="Payment Records Verified"
                  value={
                    overview.payments.successful_records
                  }
                  detail="Database records; not bank settlements."
                />

                <MetricCard
                  title="Refund Requests"
                  value={overview.refunds.total}
                />
              </div>
            </section>

            {/* ORDER ACTIVITY */}
            <section>
              <SectionTitle
                title="📦 Order Monitoring"
                description="Monitor fulfillment without modifying orders."
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
                  detail="Orders still marked processing."
                />
              </div>
            </section>

            {/* REFUNDS */}
            <section>
              <SectionTitle
                title="🛡️ Refund Monitoring"
                description="Review request statuses and identify cases needing attention."
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
                description="Accounting records only. No seller payouts are initiated."
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
                  detail="Recorded statuses, not proof of bank transfers."
                />
              </div>
            </section>

            {/* SYSTEM ALERTS */}
            <section>
              <SectionTitle
                title="⚠️ Operational Alerts"
                description="These warnings require investigation; they do not prove fraud."
              />

              {data.alerts.length === 0 ? (
                <div className="rounded-2xl border bg-white p-6">
                  <p className="font-bold">
                    No alerts generated by the current checks.
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    This does not guarantee that every
                    order or account is risk-free.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.alerts.map((alert, index) => (
                    <div
                      key={`${alert.type}-${index}`}
                      className="rounded-2xl border border-amber-200 bg-white p-5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg">
                          ⚠️
                        </span>

                        <h3 className="font-black">
                          {alert.title}
                        </h3>
                      </div>

                      <p className="mt-2 text-sm text-gray-600">
                        {alert.message}
                      </p>

                      {alert.human_review_required && (
                        <p className="mt-3 text-xs font-bold text-[#987216]">
                          Authorized human review required
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* SECURITY INFORMATION */}
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
                  Mode: <strong>Read-only</strong>
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
