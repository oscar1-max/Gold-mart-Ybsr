
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

// ===========================================
// GOLDMART MONITORING CONTROL CENTER
// ===========================================
//
// Free, administrator-only monitoring.
//
// - Scan and save operational alerts
// - View alert history
// - Acknowledge reviewed alerts
// - Resolve alerts when rules clear
//
// No payment, refund, order or account
// changes are performed by this page.
//
// ===========================================

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

type AlertStatus =
  | "open"
  | "acknowledged"
  | "resolved";

type FilterStatus =
  | "all"
  | AlertStatus;

type MonitoringAlert = {
  id: string | number;
  alert_key: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  status: AlertStatus;
  first_seen_at: string;
  last_seen_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | number | null;
  resolved_at: string | null;
  updated_at: string;
};

type AlertsResponse = {
  success: boolean;
  alerts: MonitoringAlert[];
  returned: number;
  message?: string;
};

type ActionResponse = {
  success: boolean;
  message?: string;
  detected_count?: number;
  checked_at?: string;
};

// ===========================================
// FORMATTING
// ===========================================

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

function severityOrder(value: string) {
  if (value === "high") return 0;
  if (value === "attention") return 1;
  return 2;
}

function statusText(status: AlertStatus) {
  if (status === "acknowledged") {
    return "Acknowledged";
  }

  if (status === "resolved") {
    return "Resolved";
  }

  return "Open";
}

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function AdminMonitoringPage() {
  const [alerts, setAlerts] =
    useState<MonitoringAlert[]>([]);

  const [filter, setFilter] =
    useState<FilterStatus>("all");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [scanning, setScanning] =
    useState(false);

  const [activeAlertId, setActiveAlertId] =
    useState<string | null>(null);

  const [authorized, setAuthorized] =
    useState(false);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [lastScan, setLastScan] =
    useState<string | null>(null);

  // =========================================
  // AUTHENTICATED BACKEND REQUESTS
  // =========================================

  async function apiRequest<T>(
    path: string,
    method: "GET" | "POST" | "PATCH" = "GET"
  ): Promise<T> {
    const token =
      localStorage.getItem("goldmart_token");

    if (!token) {
      throw new Error(
        "Please sign in with your GoldMart administrator account."
      );
    }

    const response = await fetch(
      `${API_URL}${path}`,
      {
        method,
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
      throw new Error(
        "Your session has expired. Please sign in again."
      );
    }

    if (response.status === 403) {
      throw new Error(
        "Administrator access denied."
      );
    }

    if (!response.ok || !result?.success) {
      throw new Error(
        result?.message ||
          `Monitoring request failed (${response.status}).`
      );
    }

    return result as T;
  }

  // =========================================
  // LOAD SAVED ALERTS
  // =========================================

  const loadAlerts = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const token =
          localStorage.getItem("goldmart_token");

        if (!token) {
          throw new Error(
            "Please sign in with your administrator account."
          );
        }

        const response = await fetch(
          `${API_URL}/api/admin-monitoring/alerts?status=${filter}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        const result = (await response
          .json()
          .catch(() => null)) as
          | AlertsResponse
          | null;

        if (response.status === 401) {
          throw new Error(
            "Session expired. Please sign in again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "Only authorized GoldMart administrators can access monitoring."
          );
        }

        if (
          !response.ok ||
          !result?.success ||
          !Array.isArray(result.alerts)
        ) {
          throw new Error(
            result?.message ||
              "Unable to load saved alerts."
          );
        }

        setAlerts(result.alerts);
        setAuthorized(true);
      } catch (err) {
        setAlerts([]);
        setAuthorized(false);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load monitoring."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  // =========================================
  // SCAN MARKETPLACE
  // =========================================

  async function scanMarketplace() {
    if (scanning || activeAlertId) return;

    setScanning(true);
    setError("");
    setNotice("");

    try {
      const result =
        await apiRequest<ActionResponse>(
          "/api/admin-monitoring/scan",
          "POST"
        );

      setLastScan(
        result.checked_at ||
          new Date().toISOString()
      );

      setNotice(
        `Scan complete. ${result.detected_count ?? 0} ` +
          "monitoring rule(s) detected an issue. " +
          "Active alerts have been saved."
      );

      await loadAlerts(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Marketplace scan failed."
      );
    } finally {
      setScanning(false);
    }
  }

  // =========================================
  // ACKNOWLEDGE OR RESOLVE
  // =========================================

  async function updateAlert(
    id: string | number,
    action: "acknowledge" | "resolve"
  ) {
    if (activeAlertId || scanning) return;

    setActiveAlertId(String(id));
    setError("");
    setNotice("");

    try {
      await apiRequest<ActionResponse>(
        `/api/admin-monitoring/alerts/${encodeURIComponent(String(id))}/${action}`,
        "PATCH"
      );

      setNotice(
        action === "acknowledge"
          ? "Alert acknowledged. The underlying issue still needs attention."
          : "Monitoring alert resolved. No order, refund or payment record was changed."
      );

      await loadAlerts(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update alert."
      );
    } finally {
      setActiveAlertId(null);
    }
  }

  // =========================================
  // DISPLAY COUNTS
  // =========================================

  const openCount = alerts.filter(
    (item) => item.status === "open"
  ).length;

  const acknowledgedCount = alerts.filter(
    (item) => item.status === "acknowledged"
  ).length;

  const resolvedCount = alerts.filter(
    (item) => item.status === "resolved"
  ).length;

  const sortedAlerts = [...alerts].sort(
    (a, b) => {
      const statusRank = {
        open: 0,
        acknowledged: 1,
        resolved: 2,
      };

      return (
        statusRank[a.status] -
          statusRank[b.status] ||
        severityOrder(a.severity) -
          severityOrder(b.severity)
      );
    }
  );

  const busy = scanning || activeAlertId !== null;

  // =========================================
  // PAGE
  // =========================================

  return (
    <main className="min-h-screen bg-[#F8F7F3] text-gray-900">
      <header className="border-b border-[#E9DEBE] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5">
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
            href="/admin/ai"
            className="rounded-full border px-4 py-2 text-sm font-bold"
          >
            🤖 AI Admin
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 pb-40">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-[#98721B]">
            GoldMart Administration
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            🛡️ Monitoring Control Center
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
            Detect marketplace issues, save alerts,
            acknowledge reviewed problems and track
            resolved alerts. All monitoring uses
            predefined rules without paid AI APIs.
          </p>
        </div>

        {/* SECURITY NOTICE */}

        <section className="rounded-2xl border border-[#E7D9AA] bg-white p-5">
          <p className="font-black">
            🔒 Administrator-only monitoring
          </p>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Scanning reads marketplace records and
            saves operational alerts. It cannot
            approve refunds, transfer seller funds,
            ban users or change orders.
          </p>

          <p className="mt-2 text-xs leading-5 text-gray-500">
            Alerts are indicators for investigation,
            not proof of fraud or wrongdoing.
          </p>
        </section>

        {/* ERROR */}

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}

            <button
              type="button"
              onClick={() => void loadAlerts(true)}
              className="ml-3 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div className="rounded-2xl border bg-white p-8 text-center">
            Loading monitoring alerts...
          </div>
        )}

        {/* AUTHORIZED CONTENT */}

        {!loading && authorized && (
          <>
            {/* ACTION BAR */}

            <section className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black">
                    Marketplace Scanner
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Run a fresh check and save any
                    currently detected issues.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void scanMarketplace()
                    }
                    className="rounded-full bg-[#17191D] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {scanning
                      ? "Scanning..."
                      : "🔍 Scan Marketplace"}
                  </button>

                  <button
                    type="button"
                    disabled={busy || refreshing}
                    onClick={() =>
                      void loadAlerts(true)
                    }
                    className="rounded-full border px-5 py-3 text-sm font-bold disabled:opacity-50"
                  >
                    {refreshing
                      ? "Refreshing..."
                      : "↻ Refresh Alerts"}
                  </button>
                </div>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Last scan from this page:{" "}
                <strong>
                  {lastScan
                    ? formatDate(lastScan)
                    : "Not run in this session"}
                </strong>
              </p>

              {notice && (
                <div
                  role="status"
                  className="mt-4 rounded-xl border border-[#E7D9AA] bg-[#FFF9EA] p-3 text-sm"
                >
                  {notice}
                </div>
              )}
            </section>

            {/* FILTERS */}

            <section>
              <h2 className="text-xl font-black">
                Saved Alert History
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                View up to 100 saved alerts for the
                selected status.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  [
                    "all",
                    "open",
                    "acknowledged",
                    "resolved",
                  ] as FilterStatus[]
                ).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setNotice("");
                      setFilter(item);
                    }}
                    disabled={busy}
                    className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${
                      filter === item
                        ? "bg-[#17191D] text-white"
                        : "border bg-white text-gray-700"
                    } disabled:opacity-50`}
                  >
                    {item === "all"
                      ? "All"
                      : item}
                  </button>
                ))}
              </div>
            </section>

            {/* SUMMARY */}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: "Loaded Alerts",
                  value: alerts.length,
                },
                {
                  label: "Open",
                  value: openCount,
                },
                {
                  label: "Acknowledged",
                  value: acknowledgedCount,
                },
                {
                  label: "Resolved",
                  value: resolvedCount,
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border bg-white p-4"
                >
                  <p className="text-xs font-semibold text-gray-500">
                    {metric.label}
                  </p>

                  <p className="mt-2 text-3xl font-black text-[#98721B]">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500">
              These counts describe the currently
              loaded, filtered records. They are not
              necessarily totals for every alert
              stored in the database.
            </p>

            {/* ALERT CARDS */}

            {sortedAlerts.length === 0 ? (
              <div className="rounded-2xl border bg-white p-8 text-center">
                <p className="font-black">
                  No saved alerts in this view.
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  You can run a marketplace scan to
                  detect and save active issues.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedAlerts.map((alert) => {
                  const updating =
                    activeAlertId ===
                    String(alert.id);

                  return (
                    <article
                      key={String(alert.id)}
                      className="rounded-2xl border border-[#E7D9AA] bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black uppercase">
                            {alert.severity}
                          </span>

                          <span className="rounded-full border px-3 py-1 text-xs font-bold">
                            {statusText(alert.status)}
                          </span>
                        </div>

                        <span className="text-xs text-gray-400">
                          Alert #{String(alert.id)}
                        </span>
                      </div>

                      <h3 className="mt-4 text-lg font-black">
                        {alert.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        {alert.message}
                      </p>

                      <div className="mt-4 grid gap-2 text-xs text-gray-500 sm:grid-cols-2">
                        <p>
                          First detected:{" "}
                          {formatDate(
                            alert.first_seen_at
                          )}
                        </p>

                        <p>
                          Last detected:{" "}
                          {formatDate(
                            alert.last_seen_at
                          )}
                        </p>

                        {alert.acknowledged_at && (
                          <p>
                            Acknowledged:{" "}
                            {formatDate(
                              alert.acknowledged_at
                            )}
                          </p>
                        )}

                        {alert.resolved_at && (
                          <p>
                            Resolved:{" "}
                            {formatDate(
                              alert.resolved_at
                            )}
                          </p>
                        )}
                      </div>

                      {/* ADMIN ACTIONS */}

                      <div className="mt-5 flex flex-wrap gap-2">
                        {alert.status === "open" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void updateAlert(
                                alert.id,
                                "acknowledge"
                              )
                            }
                            className="rounded-full border border-[#B38A25] px-4 py-2 text-sm font-bold text-[#896716] disabled:opacity-50"
                          >
                            {updating
                              ? "Updating..."
                              : "✓ Acknowledge"}
                          </button>
                        )}

                        {alert.status !== "resolved" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void updateAlert(
                                alert.id,
                                "resolve"
                              )
                            }
                            className="rounded-full bg-[#17191D] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                          >
                            {updating
                              ? "Checking..."
                              : "Resolve if Cleared"}
                          </button>
                        )}

                        {alert.status === "resolved" && (
                          <span className="text-sm font-semibold text-gray-500">
                            Monitoring alert closed
                          </span>
                        )}
                      </div>

                      {alert.status !== "resolved" && (
                        <p className="mt-3 text-xs leading-5 text-gray-500">
                          Resolving this alert requires
                          a fresh backend check. If the
                          monitoring rule still detects
                          an issue, the request will be
                          rejected.
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
