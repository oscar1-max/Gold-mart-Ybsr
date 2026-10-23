
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

type Report = {
  id: number;
  reason: string;
  message: string | null;
  status: string;
  admin_message: string | null;
  created_at: string;
  updated_at: string;

  reporter_id: number;
  reporter_name: string;
  reporter_role: string;

  reported_user_id: number;
  reported_user_name: string;
  reported_user_role: string;
  reported_user_is_banned: boolean;
};

const STATUS_OPTIONS = [
  "all",
  "pending",
  "reviewed",
  "resolved",
  "dismissed",
];

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function statusLabel(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function statusClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-800";
    case "reviewed":
      return "bg-blue-50 text-blue-800";
    case "resolved":
      return "bg-emerald-50 text-emerald-800";
    case "dismissed":
      return "bg-stone-100 text-stone-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

async function apiRequest(
  path: string,
  options: RequestInit = {}
) {
  const token =
    localStorage.getItem("goldmart_token");

  if (!token) {
    throw new Error(
      "Please sign in with your administrator account."
    );
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(options.body
          ? {
              "Content-Type": "application/json",
            }
          : {}),
        ...options.headers,
      },
    }
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok || !data?.success) {
    if (response.status === 401) {
      throw new Error(
        "Your session has expired. Please sign in again."
      );
    }

    if (response.status === 403) {
      throw new Error(
        "Administrator access required."
      );
    }

    throw new Error(
      data?.message ||
        `Request failed (${response.status}).`
    );
  }

  return data;
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong.";
}

export default function AdminReportsPage() {
  const [reports, setReports] =
    useState<Report[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [busyAction, setBusyAction] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const loadReports = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const data = await apiRequest(
          "/api/reports"
        );

        setReports(
          Array.isArray(data.reports)
            ? data.reports
            : []
        );
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  async function updateReport(
    reportId: number,
    status: string
  ) {
    if (busyAction) return;

    if (
      status === "dismissed" &&
      !window.confirm(
        "Dismiss this report? Confirm that it does not require further action."
      )
    ) {
      return;
    }

    if (
      status === "resolved" &&
      !window.confirm(
        "Mark this report as resolved?"
      )
    ) {
      return;
    }

    setBusyAction(
      `report-${reportId}`
    );
    setNotice("");
    setActionError("");

    const adminMessage =
      status === "resolved"
        ? "Report resolved by administrator."
        : status === "dismissed"
          ? "Report dismissed by administrator."
          : "Report reviewed by administrator.";

    try {
      await apiRequest(
        `/api/reports/${reportId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
            adminMessage,
          }),
        }
      );

      setNotice(
        `Report #${reportId} updated successfully.`
      );

      await loadReports();
    } catch (err) {
      setActionError(
        errorMessage(err)
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function changeUserBan(
    userId: number,
    userName: string,
    shouldBan: boolean
  ) {
    if (busyAction) return;

    const action = shouldBan
      ? "ban"
      : "unban";

    const confirmed = window.confirm(
      shouldBan
        ? `Ban ${userName} (User #${userId})? This may restrict their access to GoldMart.`
        : `Remove the ban from ${userName} (User #${userId})?`
    );

    if (!confirmed) return;

    setBusyAction(
      `${action}-${userId}`
    );
    setNotice("");
    setActionError("");

    try {
      await apiRequest(
        `/api/reports/users/${userId}/${action}`,
        {
          method: "POST",
        }
      );

      setNotice(
        shouldBan
          ? `User #${userId} was banned successfully.`
          : `User #${userId} was unbanned successfully.`
      );

      await loadReports();
    } catch (err) {
      setActionError(
        errorMessage(err)
      );
    } finally {
      setBusyAction(null);
    }
  }

  const stats = useMemo(() => {
    const uniqueBannedUsers = new Set(
      reports
        .filter(
          (report) =>
            report.reported_user_is_banned
        )
        .map(
          (report) =>
            report.reported_user_id
        )
    );

    return {
      total: reports.length,

      pending: reports.filter(
        (report) =>
          report.status === "pending"
      ).length,

      reviewed: reports.filter(
        (report) =>
          report.status === "reviewed"
      ).length,

      resolved: reports.filter(
        (report) =>
          report.status === "resolved"
      ).length,

      banned: uniqueBannedUsers.size,
    };
  }, [reports]);

  const visibleReports = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return reports.filter((report) => {
      const matchesStatus =
        statusFilter === "all" ||
        report.status === statusFilter;

      const searchable = [
        report.id,
        report.reason,
        report.message,
        report.reporter_name,
        report.reporter_id,
        report.reported_user_name,
        report.reported_user_id,
        report.status,
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        (!query ||
          searchable.includes(query))
      );
    });
  }, [
    reports,
    search,
    statusFilter,
  ]);

  const actionDisabled =
    loading || busyAction !== null;

  return (
    <main className="min-h-screen bg-[#f5f7f6] pb-32 text-[#1b3329] md:pb-12">
      {/* Admin visual identity: existing permissions and actions remain authoritative */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="relative overflow-hidden rounded-[28px] px-6 py-8 text-white shadow-[0_18px_38px_rgba(22,39,46,0.13)] sm:px-10 sm:py-11" style={{background:"linear-gradient(115deg,#23364B,#456A8D 56%,#A7AFC1)"}}>
          <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-12 text-[150px] leading-none opacity-10">▤</span>
          <div className="relative">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.23em]" style={{color:"#D6E6FC"}}>GOLDMART PRIVATE ADMIN · SAFETY & TRUST</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Reports & Users</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">Manage reviews, reports and account safeguards.</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[11px] font-bold text-white/90"><span className="h-2 w-2 rounded-full bg-[#def3e6]"/>Authorized access required</div>
          </div>
        </div>
        <nav aria-label="Admin workspaces" className="og-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2">
          <Link href="/admin" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#dee9e2] bg-white text-[#506363] hover:border-[#8fbfa7] hover:bg-[#ebf5ee]">Overview</Link>
          <Link href="/admin/ai" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#dee9e2] bg-white text-[#506363] hover:border-[#8fbfa7] hover:bg-[#ebf5ee]">AI Admin</Link>
          <Link href="/admin/monitoring" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#dee9e2] bg-white text-[#506363] hover:border-[#8fbfa7] hover:bg-[#ebf5ee]">Monitoring</Link>
          <Link href="/admin/support-assistant" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#dee9e2] bg-white text-[#506363] hover:border-[#8fbfa7] hover:bg-[#ebf5ee]">Assistant</Link>
          <Link href="/admin/reports" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#284F55] bg-[#284F55] text-white">Reports</Link>
          <Link href="/admin/refunds" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#dee9e2] bg-white text-[#506363] hover:border-[#8fbfa7] hover:bg-[#ebf5ee]">Refunds</Link>
          <Link href="/admin/support" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#dee9e2] bg-white text-[#506363] hover:border-[#8fbfa7] hover:bg-[#ebf5ee]">Support</Link>
        </nav>
      </div>

      <div className="h-1 bg-gradient-to-r from-[#176c52] via-[#ddf1e3] to-[#68a98c]" />

      {/* HEADER */}

      <header className="border-b border-[#e0eae3] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
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
            className="rounded-full border border-[#e0eae3] px-4 py-2 text-xs font-bold transition hover:border-[#68a98c] sm:text-sm"
          >
            ← Admin Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* HERO */}

        <section className="relative overflow-hidden rounded-[28px] bg-[#253F48] p-7 text-white sm:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full border border-[#68a98c]/25"
          />

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ddf1e3]">
              GoldMart Administration
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Reports & User Safety
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#E5DDD1]">
              Review marketplace reports,
              investigate complaints and
              manage account restrictions.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/admin/support"
                className="rounded-full bg-[#68a98c] px-5 py-3 text-sm font-bold text-[#162e25] transition hover:bg-[#ddf1e3]"
              >
                🎧 Support Inbox →
              </Link>

              <Link
                href="/admin/refunds"
                className="rounded-full border border-[#68a98c]/60 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Manage Refunds →
              </Link>
            </div>
          </div>
        </section>

        {/* OVERVIEW */}

        <section className="mt-9">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#176c52]">
                Marketplace Moderation
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Reports Overview
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadReports()
              }
              disabled={actionDisabled}
              className="rounded-full border border-[#D7BF97] bg-white px-5 py-2.5 text-sm font-bold transition hover:bg-[#ebf4ed] disabled:opacity-50"
            >
              {loading
                ? "Refreshing..."
                : "↻ Refresh Reports"}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              {
                title: "Total Reports",
                value: stats.total,
                icon: "📋",
              },
              {
                title: "Pending",
                value: stats.pending,
                icon: "⏳",
              },
              {
                title: "Reviewed",
                value: stats.reviewed,
                icon: "🔍",
              },
              {
                title: "Resolved",
                value: stats.resolved,
                icon: "✅",
              },
              {
                title: "Reported Banned Users",
                value: stats.banned,
                icon: "🛡️",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[22px] border border-[#e0eae3] bg-white p-4 shadow-sm sm:p-5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ebf4ed] text-xl">
                  {item.icon}
                </span>

                <p className="mt-4 text-xs font-semibold text-[#716B62]">
                  {item.title}
                </p>

                <p className="mt-1 text-2xl font-black">
                  {loading || error
                    ? "—"
                    : item.value}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs leading-5 text-[#716B62]">
            Figures reflect reports returned
            by the reports API, not necessarily
            every user on GoldMart.
          </p>
        </section>

        {/* ALERTS */}

        {notice && (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"
          >
            {notice}
          </div>
        )}

        {actionError && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {actionError}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5"
          >
            <p className="font-bold text-red-800">
              Could not load reports
            </p>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadReports()
              }
              className="mt-4 rounded-full bg-[#162e25] px-5 py-2.5 text-sm font-bold text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {/* FILTERS */}

        <section className="mt-9 rounded-[24px] border border-[#e0eae3] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black">
              Manage Reports
            </h2>

            {!loading && !error && (
              <span className="text-sm font-semibold text-[#716B62]">
                Showing {visibleReports.length} of{" "}
                {reports.length}
              </span>
            )}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <div>
              <label
                htmlFor="report-search"
                className="mb-2 block text-xs font-bold text-[#716B62]"
              >
                Search reports
              </label>

              <input
                id="report-search"
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Report ID, user, reason..."
                className="w-full rounded-xl border border-[#DDD5C8] px-4 py-3 text-sm outline-none focus:border-[#B08A50]"
              />
            </div>

            <div>
              <label
                htmlFor="report-status"
                className="mb-2 block text-xs font-bold text-[#716B62]"
              >
                Filter by status
              </label>

              <select
                id="report-status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-[#DDD5C8] bg-white px-4 py-3 text-sm outline-none focus:border-[#B08A50]"
              >
                {STATUS_OPTIONS.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status === "all"
                        ? "All Statuses"
                        : statusLabel(status)}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </section>

        {/* LOADING */}

        {loading && (
          <div className="mt-6 rounded-3xl border border-[#e0eae3] bg-white p-10 text-center">
            <p className="text-4xl">📋</p>

            <p className="mt-4 font-bold">
              Loading marketplace reports...
            </p>
          </div>
        )}

        {/* EMPTY STATE */}

        {!loading &&
          !error &&
          visibleReports.length === 0 && (
            <div className="mt-6 rounded-3xl border border-[#e0eae3] bg-white p-10 text-center">
              <p className="text-4xl">📭</p>

              <h3 className="mt-4 text-xl font-black">
                {reports.length === 0
                  ? "No reports yet"
                  : "No matching reports"}
              </h3>

              <p className="mt-2 text-sm text-[#716B62]">
                {reports.length === 0
                  ? "Buyer and seller reports will appear here."
                  : "Try another search or status filter."}
              </p>
            </div>
          )}

        {/* REPORT CARDS */}

        {!loading && !error && (
          <section className="mt-6 space-y-5">
            {visibleReports.map((report) => (
              <article
                key={report.id}
                className="overflow-hidden rounded-[24px] border border-[#e0eae3] bg-white p-5 shadow-sm sm:p-7"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#ebf4ed] px-3 py-1 text-xs font-bold text-[#176c52]">
                        Report #{report.id}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                          report.status
                        )}`}
                      >
                        {statusLabel(
                          report.status
                        )}
                      </span>

                      {report.reported_user_is_banned && (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                          BANNED
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 break-words text-xl font-black">
                      {report.reason}
                    </h3>

                    <p className="mt-2 text-xs text-[#716B62]">
                      Submitted{" "}
                      {formatDate(
                        report.created_at
                      )}
                    </p>
                  </div>
                </div>

                {/* PEOPLE INVOLVED */}

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-[#f5f8f5] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#176c52]">
                      Reported By
                    </p>

                    <p className="mt-2 break-words font-black">
                      {report.reporter_name ||
                        "GoldMart Member"}
                    </p>

                    <p className="mt-1 text-xs text-[#716B62]">
                      User #{report.reporter_id}
                      {" · "}
                      {report.reporter_role}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#f5f8f5] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#176c52]">
                      Reported Account
                    </p>

                    <p className="mt-2 break-words font-black">
                      {report.reported_user_name ||
                        "GoldMart Member"}
                    </p>

                    <p className="mt-1 text-xs text-[#716B62]">
                      User #{report.reported_user_id}
                      {" · "}
                      {report.reported_user_role}
                    </p>
                  </div>
                </div>

                {/* REPORT DETAILS */}

                {report.message && (
                  <div className="mt-4 rounded-2xl border border-[#e0eae3] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#176c52]">
                      Customer Report
                    </p>

                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[#514C45]">
                      {report.message}
                    </p>
                  </div>
                )}

                {report.admin_message && (
                  <div className="mt-4 rounded-2xl border border-[#e0eae3] bg-[#FFFDF8] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#176c52]">
                      Previous Admin Action
                    </p>

                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[#514C45]">
                      {report.admin_message}
                    </p>
                  </div>
                )}

                {/* ADMIN ACTIONS */}

                <div className="mt-6 border-t border-[#e0eae3] pt-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#716B62]">
                    Moderation Actions
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {report.status === "pending" && (
                      <button
                        type="button"
                        disabled={actionDisabled}
                        onClick={() =>
                          void updateReport(
                            report.id,
                            "reviewed"
                          )
                        }
                        className="rounded-full border border-[#D7BF97] px-4 py-2.5 text-xs font-bold transition hover:bg-[#f5f8f5] disabled:opacity-50 sm:text-sm"
                      >
                        Mark Reviewed
                      </button>
                    )}

                    {report.status !== "resolved" &&
                      report.status !== "dismissed" && (
                        <button
                          type="button"
                          disabled={actionDisabled}
                          onClick={() =>
                            void updateReport(
                              report.id,
                              "resolved"
                            )
                          }
                          className="rounded-full bg-[#162e25] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#176c52] disabled:opacity-50 sm:text-sm"
                        >
                          Mark Resolved
                        </button>
                      )}

                    {report.status !== "dismissed" &&
                      report.status !== "resolved" && (
                        <button
                          type="button"
                          disabled={actionDisabled}
                          onClick={() =>
                            void updateReport(
                              report.id,
                              "dismissed"
                            )
                          }
                          className="rounded-full border border-[#D7BF97] px-4 py-2.5 text-xs font-bold transition hover:bg-[#f5f8f5] disabled:opacity-50 sm:text-sm"
                        >
                          Dismiss
                        </button>
                      )}

                    {!report.reported_user_is_banned ? (
                      <button
                        type="button"
                        disabled={actionDisabled}
                        onClick={() =>
                          void changeUserBan(
                            report.reported_user_id,
                            report.reported_user_name ||
                              "this account",
                            true
                          )
                        }
                        className="rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-800 transition hover:bg-red-100 disabled:opacity-50 sm:text-sm"
                      >
                        🚫 Ban User
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={actionDisabled}
                        onClick={() =>
                          void changeUserBan(
                            report.reported_user_id,
                            report.reported_user_name ||
                              "this account",
                            false
                          )
                        }
                        className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-800 transition hover:bg-blue-100 disabled:opacity-50 sm:text-sm"
                      >
                        🔓 Unban User
                      </button>
                    )}
                  </div>

                  <p className="mt-4 text-xs leading-5 text-[#716B62]">
                    Review the evidence before
                    restricting an account.
                    Account restrictions are
                    handled by the backend.
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}

        <p className="mt-9 text-center text-xs text-[#89847A]">
          GoldMart Administration ·
          Marketplace Safety & Trust
        </p>
      </div>
    </main>
  );
}
