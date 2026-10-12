"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com/api";

type Notification = {
  id: number;
  title: string;
  message: string;
  type?: string | null;
  is_read?: boolean;
  created_at?: string | null;
};

type NotificationResponse = {
  success?: boolean;
  message?: string;
  notifications?: Notification[];
};

function notificationIcon(type?: string | null) {
  switch (type) {
    case "message": return "💬";
    case "order": return "📦";
    case "seller": return "🏪";
    case "payment": return "💳";
    case "review": return "⭐";
    case "wishlist": return "❤️";
    default: return "🔔";
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notifications, setNotifications] =
    useState<Notification[]>([]);
  const [expandedId, setExpandedId] =
    useState<number | null>(null);
  const [busyId, setBusyId] =
    useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("goldmart_token");
    setToken(savedToken);
    if (!savedToken) setLoading(false);
  }, []);

  const loadNotifications = useCallback(async (showLoading = true) => {
    if (!token) return;
    if (showLoading) setLoading(true);
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      const data: NotificationResponse = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to load notifications.");
      }
      setNotifications(Array.isArray(data.notifications)
        ? data.notifications
        : []);
      setError("");
    } catch (err) {
      setError(err instanceof Error
        ? err.message
        : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void loadNotifications();
    const refresh = () => void loadNotifications(false);
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [token, loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function changeRead(id: number, read: boolean) {
    if (!token) return;
    setBusyId(id);
    try {
      const response = await fetch(
        `${API_URL}/notifications/${id}/${read ? "read" : "unread"}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to update notification.");
      }
      setNotifications((prev) => prev.map((n) =>
        n.id === id ? { ...n, is_read: read } : n
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update notification.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteNotification(id: number) {
    if (!token) return;
    setBusyId(id);
    try {
      const response = await fetch(`${API_URL}/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to delete notification.");
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setExpandedId((prev) => prev === id ? null : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete notification.");
    } finally {
      setBusyId(null);
    }
  }

  async function markAllAsRead() {
    if (!token || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || "Unable to mark all as read.");
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to mark all as read.");
    } finally {
      setMarkingAll(false);
    }
  }

  function openNotification(n: Notification) {
    // Existing message notifications do not contain a conversation ID.
    // Open the authenticated conversation list, not an invented chat ID.
    if (n.type === "message") {
      if (!n.is_read) void changeRead(n.id, true);
      router.push("/chat");
      return;
    }
    setExpandedId((prev) => prev === n.id ? null : n.id);
    if (!n.is_read) void changeRead(n.id, true);
  }

  return (
    <main className="min-h-screen bg-[#F7F6F2] text-black">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <Link href="/" className="text-2xl font-black">
            Gold<span className="text-[#A67C00]">Mart</span>
          </Link>
          <div className="flex gap-2">
            <Link href="/chat" className="rounded-full border px-4 py-2 text-sm font-bold">
              💬 Messages
            </Link>
            <Link href="/account" className="rounded-full border px-4 py-2 text-sm font-bold">
              Account
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#A67C00]">GoldMart</p>
            <h1 className="mt-1 text-3xl font-black">Notifications</h1>
            <p className="mt-2 text-sm text-gray-600">
              Orders, messages, payments and marketplace updates.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void loadNotifications()}
              disabled={!token || loading}
              className="rounded-full border bg-white px-4 py-3 text-sm font-bold disabled:opacity-50">
              Refresh
            </button>
            {unreadCount > 0 && (
              <button type="button" onClick={() => void markAllAsRead()}
                disabled={markingAll}
                className="rounded-full bg-black px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                {markingAll ? "Marking..." : `Mark all read (${unreadCount})`}
              </button>
            )}
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {!token && !loading && (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center">
            <p className="font-bold">Sign in to see your notifications.</p>
            <Link href="/login" className="mt-4 inline-block rounded-full bg-black px-6 py-3 font-bold text-white">
              Sign In
            </Link>
          </div>
        )}

        {loading && (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center text-gray-600">
            Loading notifications...
          </div>
        )}

        {token && !loading && !error && notifications.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center">
            <div className="text-4xl">🔔</div>
            <h2 className="mt-4 text-xl font-black">You're all caught up</h2>
            <p className="mt-2 text-gray-600">No notifications yet.</p>
          </div>
        )}

        {token && !loading && notifications.length > 0 && (
          <div className="mt-8 space-y-3">
            {notifications.map((n) => {
              const expanded = expandedId === n.id;
              const busy = busyId === n.id;
              const messageNotice = n.type === "message";
              return (
                <article key={n.id}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${!n.is_read ? "border-[#C9A227]" : "border-gray-100"}`}>
                  <button type="button" onClick={() => openNotification(n)}
                    className="flex w-full gap-4 p-5 text-left hover:bg-[#FFFDF5]">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-lg">
                      {notificationIcon(n.type)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {!n.is_read && <span className="h-2 w-2 rounded-full bg-[#C9A227]" />}
                        <h2 className="font-black">{n.title}</h2>
                      </div>
                      <p className={`mt-2 text-sm text-gray-600 ${expanded || messageNotice ? "" : "line-clamp-2"}`}>
                        {n.message}
                      </p>
                      {n.created_at && (
                        <p className="mt-2 text-xs text-gray-400">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      )}
                      <p className="mt-2 text-xs font-bold text-[#A67C00]">
                        {messageNotice ? "Open messages and reply →" : expanded ? "Collapse ▲" : "Read more ▼"}
                      </p>
                    </div>
                  </button>

                  <div className="flex flex-wrap items-center gap-2 border-t bg-gray-50 p-3 sm:px-5">
                    {messageNotice && (
                      <Link href="/chat" className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white">
                        💬 Open Chat
                      </Link>
                    )}
                    <button type="button" disabled={busy}
                      onClick={() => void changeRead(n.id, !n.is_read)}
                      className="rounded-full border bg-white px-4 py-2 text-xs font-bold disabled:opacity-50">
                      {n.is_read ? "Mark unread" : "Mark read"}
                    </button>
                    <button type="button" disabled={busy}
                      onClick={() => void deleteNotification(n.id)}
                      className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 disabled:opacity-50">
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
