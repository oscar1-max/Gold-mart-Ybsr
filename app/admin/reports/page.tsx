"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

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

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const getToken = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("goldmart_token") || "";
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        setError("You must be logged in as an administrator.");
        return;
      }

      const response = await fetch(`${API_URL}/api/reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load reports");
      }

      setReports(data.reports || []);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load reports"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const updateReport = async (
    reportId: number,
    status: string
  ) => {
    try {
      setUpdatingId(reportId);
      setMessage("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/reports/${reportId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            adminMessage:
              status === "resolved"
                ? "Report resolved by administrator."
                : status === "dismissed"
                ? "Report dismissed by administrator."
                : "Report reviewed by administrator.",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update report"
        );
      }

      setReports((current) =>
        current.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: data.report.status,
                admin_message: data.report.admin_message,
              }
            : report
        )
      );

      setMessage("Report updated successfully.");
    } catch (err) {
      console.error(err);

      setMessage(
        err instanceof Error
          ? err.message
          : "Failed to update report"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const banUser = async (userId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to ban this user?"
    );

    if (!confirmed) return;

    try {
      setUpdatingId(userId);
      setMessage("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/reports/users/${userId}/ban`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to ban user"
        );
      }

      setReports((current) =>
        current.map((report) =>
          report.reported_user_id === userId
            ? {
                ...report,
                reported_user_is_banned: true,
              }
            : report
        )
      );

      setMessage(
        `${data.user.name} has been banned successfully.`
      );
    } catch (err) {
      console.error(err);

      setMessage(
        err instanceof Error
          ? err.message
          : "Failed to ban user"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const unbanUser = async (userId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to unban this user?"
    );

    if (!confirmed) return;

    try {
      setUpdatingId(userId);
      setMessage("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/reports/users/${userId}/unban`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to unban user"
        );
      }

      setReports((current) =>
        current.map((report) =>
          report.reported_user_id === userId
            ? {
                ...report,
                reported_user_is_banned: false,
              }
            : report
        )
      );

      setMessage(
        `${data.user.name} has been unbanned successfully.`
      );
    } catch (err) {
      console.error(err);

      setMessage(
        err instanceof Error
          ? err.message
          : "Failed to unban user"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = reports.filter(
    (report) => report.status === "pending"
  ).length;

  const bannedCount = reports.filter(
    (report) => report.reported_user_is_banned
  ).length;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Admin Reports
            </h1>

            <p className="mt-1 text-gray-600">
              Review user reports and manage bans.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex w-fit rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium hover:bg-gray-100"
          >
            ← Back to GoldMart
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Reports
            </p>

            <p className="mt-1 text-3xl font-bold">
              {reports.length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Pending Reports
            </p>

            <p className="mt-1 text-3xl font-bold">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Banned Users
            </p>

            <p className="mt-1 text-3xl font-bold">
              {bannedCount}
            </p>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-lg border bg-white p-4 text-sm">
            {message}
          </div>
        )}

        {loading && (
          <div className="rounded-xl border bg-white p-8 text-center">
            Loading reports...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-semibold">
              Could not load reports
            </p>

            <p className="mt-1">{error}</p>

            <button
              onClick={loadReports}
              className="mt-4 rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="rounded-xl border bg-white p-10 text-center">
            <div className="text-4xl">📋</div>

            <h2 className="mt-3 text-xl font-semibold">
              No reports yet
            </h2>

            <p className="mt-1 text-gray-500">
              New buyer or seller reports will appear here.
            </p>
          </div>
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="space-y-5">
            {reports.map((report) => (
              <div
                key={report.id}
                className="rounded-xl border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                        Report #{report.id}
                      </span>

                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                        {report.status}
                      </span>

                      {report.reported_user_is_banned && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                          BANNED
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 text-xl font-bold">
                      {report.reason}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(
                        report.created_at
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Reported by
                    </p>

                    <p className="mt-1 font-semibold">
                      {report.reporter_name}
                    </p>

                    <p className="text-sm text-gray-500">
                      User ID: {report.reporter_id} ·{" "}
                      {report.reporter_role}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Reported user
                    </p>

                    <p className="mt-1 font-semibold">
                      {report.reported_user_name}
                    </p>

                    <p className="text-sm text-gray-500">
                      User ID: {report.reported_user_id} ·{" "}
                      {report.reported_user_role}
                    </p>
                  </div>
                </div>

                {report.message && (
                  <div className="mt-4 rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Report message
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {report.message}
                    </p>
                  </div>
                )}

                {report.admin_message && (
                  <div className="mt-4 rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Admin action
                    </p>

                    <p className="mt-2 text-sm">
                      {report.admin_message}
                    </p>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  {report.status === "pending" && (
                    <button
                      onClick={() =>
                        updateReport(
                          report.id,
                          "reviewed"
                        )
                      }
                      disabled={updatingId === report.id}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      Mark Reviewed
                    </button>
                  )}

                  {report.status !== "resolved" && (
                    <button
                      onClick={() =>
                        updateReport(
                          report.id,
                          "resolved"
                        )
                      }
                      disabled={updatingId === report.id}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Resolve
                    </button>
                  )}

                  {report.status !== "dismissed" && (
                    <button
                      onClick={() =>
                        updateReport(
                          report.id,
                          "dismissed"
                        )
                      }
                      disabled={updatingId === report.id}
                      className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300 disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  )}

                  {!report.reported_user_is_banned ? (
                    <button
                      onClick={() =>
                        banUser(
                          report.reported_user_id
                        )
                      }
                      disabled={
                        updatingId ===
                        report.reported_user_id
                      }
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      🚫 Ban User
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        unbanUser(
                          report.reported_user_id
                        )
                      }
                      disabled={
                        updatingId ===
                        report.reported_user_id
                      }
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      🔓 Unban User
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
