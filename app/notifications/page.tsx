
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com/api";

// =====================================================
// TYPES
// =====================================================

type Notification = {
  id: number;
  title: string;
  message: string;
  type?: string | null;
  is_read: boolean;
  created_at?: string | null;
  conversation_id?: number | string | null;
};

type NotificationsResponse = {
  success: boolean;
  message?: string;
  notifications?: Notification[];
};

// =====================================================
// NOTIFICATIONS PAGE
// =====================================================

export default function NotificationsPage() {
  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [token, setToken] =
    useState<string | null>(null);

  const [ready, setReady] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [expandedId, setExpandedId] =
    useState<number | null>(null);

  const [busyId, setBusyId] =
    useState<number | null>(null);

  const [markingAll, setMarkingAll] =
    useState(false);

  // ===================================================
  // CHECK ACCOUNT
  // ===================================================

  useEffect(() => {
    const savedToken =
      localStorage.getItem("goldmart_token");

    setToken(savedToken);
    setReady(true);

    if (!savedToken) {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // LOAD NOTIFICATIONS
  // ===================================================

  const loadNotifications = useCallback(
    async (showLoading = true) => {
      if (!token) return;

      if (showLoading) {
        setLoading(true);
      }

      try {
        const response = await fetch(
          `${API_URL}/notifications`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        const data: NotificationsResponse =
          await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to load notifications"
          );
        }

        setNotifications(
          Array.isArray(data.notifications)
            ? data.notifications
            : []
        );

        setError("");
      } catch (err) {
        console.error(
          "Notifications loading error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load notifications"
        );
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!token) return;

    void loadNotifications();

    const interval = window.setInterval(() => {
      if (
        document.visibilityState === "visible"
      ) {
        void loadNotifications(false);
      }
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [token, loadNotifications]);

  // ===================================================
  // ICONS
  // ===================================================

  function notificationIcon(type?: string | null) {
    switch (type) {
      case "message":
        return "💬";
      case "order":
        return "📦";
      case "seller":
        return "🏪";
      case "payment":
        return "💳";
      case "review":
        return "⭐";
      case "wishlist":
        return "❤️";
      case "system":
        return "⚙️";
      default:
        return "🔔";
    }
  }

  // ===================================================
  // CHANGE READ STATUS
  // ===================================================

  async function updateReadStatus(
    id: number,
    isRead: boolean
  ) {
    if (!token) return;

    setBusyId(id);

    try {
      const action = isRead ? "read" : "unread";

      const response = await fetch(
        `${API_URL}/notifications/${id}/${action}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Could not update notification"
        );
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, is_read: isRead }
            : item
        )
      );

      setError("");
    } catch (err) {
      console.error(
        "Update notification error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update notification"
      );
    } finally {
      setBusyId(null);
    }
  }

  // ===================================================
  // MARK ALL READ
  // ===================================================

  async function markAllAsRead() {
    if (!token) return;

    setMarkingAll(true);

    try {
      const response = await fetch(
        `${API_URL}/notifications/read-all`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to mark all as read"
        );
      }

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
        }))
      );

      setError("");
    } catch (err) {
      console.error(
        "Mark all read error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to mark notifications as read"
      );
    } finally {
      setMarkingAll(false);
    }
  }

  // ===================================================
  // DELETE NOTIFICATION
  // ===================================================

  async function deleteNotification(id: number) {
    if (!token) return;

    setBusyId(id);

    try {
      const response = await fetch(
        `${API_URL}/notifications/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to delete notification"
        );
      }

      setNotifications((current) =>
        current.filter((item) => item.id !== id)
      );

      if (expandedId === id) {
        setExpandedId(null);
      }

      setError("");
    } catch (err) {
      console.error(
        "Delete notification error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete notification"
      );
    } finally {
      setBusyId(null);
    }
  }

  // ===================================================
  // CHAT NAVIGATION
  // ===================================================

  function getNotificationLink(
    notification: Notification
  ) {
    if (notification.type === "message") {
      const conversationId = Number(
        notification.conversation_id
      );

      if (
        Number.isSafeInteger(conversationId) &&
        conversationId > 0
      ) {
        return `/chat/${conversationId}`;
      }

      // Old notifications don't have a conversation ID.
      return "/chat";
    }

    if (notification.type === "admin_alert") return "/admin/monitoring";
    if (
      notification.type === "order" ||
      notification.type === "seller"
    ) {
      return "/orders";
    }

    return null;
  }

  // ===================================================
  // COUNTERS
  // ===================================================

  const unreadCount = notifications.filter((item) => !item.is_read).length;
  const visibleNotifications = notifications.filter((item) => filter === "all" || (filter === "unread" ? !item.is_read : item.is_read));
  const readCount = notifications.length - unreadCount;
  function notificationTone(type?: string | null) {
    switch(type) {
      case "message": return "bg-[#F7F7F5] text-[#D4AF37]";
      case "order": return "bg-[#F7F7F5] text-[#D4AF37]";
      case "seller": return "bg-[#F7F7F5] text-[#D4AF37]";
      case "payment": return "bg-[#F7F7F5] text-[#D4AF37]";
      case "review": return "bg-[#F7F7F5] text-[#A45A62]";
      default: return "bg-[#F7F7F5] text-[#D4AF37]";
    }
  }

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <main className="min-h-screen bg-[#FFFFFF] pb-28 text-[#0A1F1A] md:pb-8">

      {/* HEADER */}
      <header className="border-b border-[#F7F7F5] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight"
          >
            Gold
            <span className="text-[#D4AF37]">
              Mart
            </span>
          </Link>

          <Link
            href="/account"
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-bold"
          >
            Account
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <div className="relative mb-7 overflow-hidden rounded-[28px] px-6 py-9 text-white shadow-[0_16px_35px_rgba(20,39,44,0.13)] sm:px-9 sm:py-11" style={{background:"linear-gradient(135deg, #0A1F1A 0%, #1A3C32 50%, #D4AF37 100%)"}}>
          <span className="pointer-events-none absolute -right-8 -top-16 text-[180px] opacity-10" aria-hidden="true">✦</span>
          <p className="relative text-[10px] font-bold uppercase tracking-[0.2em] text-[#F5E6A3]">Your GoldMart updates</p>
          <h2 className="relative mt-3 text-3xl font-black tracking-tight sm:text-4xl">Stay in the know.</h2>
          <p className="relative mt-3 max-w-lg text-sm leading-6 text-white/85">Messages, orders, payments and important activity — thoughtfully organized in one place.</p>
          <div className="relative mt-6 flex flex-wrap gap-2">
            <Link href="/orders" className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-bold text-white hover:bg-white/25">My Orders ↗</Link>
            <Link href="/chat" className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-bold text-white hover:bg-white/25">Messages ↗</Link>
          </div>
        </div>

        {/* TITLE */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">
              GoldMart
            </p>

            <h1 className="mt-2 text-3xl font-black">
              🔔 Notifications
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              See updates about messages, orders,
              payments, reviews and GoldMart activity.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                void loadNotifications()
              }
              disabled={!token || loading}
              className="rounded-full border bg-white px-4 py-3 text-xs font-bold disabled:opacity-50"
            >
              ↻ Refresh
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  void markAllAsRead()
                }
                disabled={markingAll}
                className="rounded-full bg-black px-4 py-3 text-xs font-bold text-white disabled:opacity-50"
              >
                {markingAll
                  ? "Working..."
                  : `Mark all read (${unreadCount})`}
              </button>
            )}
          </div>
        </div>

        {token && !loading && !error && (
          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3" aria-label="Notification counts">
            {[
              {value:notifications.length,label:"Total",tone:"bg-white text-[#1A3C32]"},
              {value:unreadCount,label:"Unread",tone:"bg-[#F7F7F5] text-[#1A3C32]"},
              {value:readCount,label:"Read",tone:"bg-[#F7F7F5] text-[#D4AF37]"},
            ].map((item) => (
              <div key={item.label} className={`rounded-2xl border border-[#F7F7F5] p-4 shadow-sm ${item.tone}`}>
                <p className="text-2xl font-black">{item.value}</p><p className="mt-1 text-[11px] font-bold">{item.label}</p>
              </div>
            ))}
          </div>
        )}
        {token && !loading && notifications.length > 0 && (
          <div role="group" aria-label="Filter notifications" className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {([{key:"all",label:"All updates"},{key:"unread",label:"Unread"},{key:"read",label:"Read"}] as const).map(item => (
              <button key={item.key} type="button" onClick={() => setFilter(item.key)} aria-pressed={filter === item.key}
                className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition ${filter === item.key ? "border-[#1A3C32] bg-[#1A3C32] text-white" : "border-[#F7F7F5] bg-white text-[#1A3C32] hover:border-[#F5E6A3]"}`}>
                {item.label}
              </button>
            ))}
          </div>
        )}
        {/* NOT LOGGED IN */}
        {ready && !token && (
          <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">👤</div>

            <h2 className="mt-4 text-xl font-black">
              Sign in to view notifications
            </h2>

            <Link
              href="/login"
              className="mt-6 inline-block rounded-full bg-black px-6 py-3 font-bold text-white"
            >
              Sign In
            </Link>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* LOADING */}
        {loading && token && (
          <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow-sm">
            Loading notifications...
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          token &&
          notifications.length === 0 &&
          !error && (
            <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow-sm">
              <div className="text-5xl">🔔</div>

              <h2 className="mt-4 text-xl font-black">
                You're all caught up
              </h2>

              <p className="mt-2 text-gray-500">
                You don't have any notifications yet.
              </p>

              <Link
                href="/shop"
                className="mt-6 inline-block rounded-full bg-black px-6 py-3 font-bold text-white"
              >
                Continue Shopping
              </Link>
            </div>
          )}

        {/* NOTIFICATION LIST */}
        {!loading &&
          token &&
          notifications.length > 0 && (
            <div className="mt-8 space-y-3">
              {visibleNotifications.map((notification) => {
                const isExpanded =
                  expandedId === notification.id;

                const isBusy =
                  busyId === notification.id;

                const destination =
                  getNotificationLink(notification);

                return (
                  <article
                    key={notification.id}
                    className={`overflow-hidden rounded-[22px] border bg-white shadow-[0_5px_20px_rgba(25,43,45,0.04)] transition hover:shadow-lg ${
                      notification.is_read
                        ? "border-[#F7F7F5]"
                        : "border-[#F5E6A3] bg-[#FFFFFF]"
                    }`}
                  >
                    {/* NOTIFICATION HEADER */}
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedId(
                          isExpanded
                            ? null
                            : notification.id
                        );
                      }}
                      className="w-full p-5 text-left sm:p-6" aria-expanded={isExpanded}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${notificationTone(notification.type)}`}>
                          {notificationIcon(
                            notification.type
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {!notification.is_read && (
                              <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />
                            )}

                            <h2 className="font-black">
                              {notification.title}
                            </h2>
                          </div>

                          <p className={`mt-2 text-sm text-gray-600 ${
                            isExpanded
                              ? ""
                              : "line-clamp-2"
                          }`}>
                            {notification.message}
                          </p>

                          {notification.created_at && (
                            <p className="mt-2 text-xs text-gray-400">
                              {new Date(
                                notification.created_at
                              ).toLocaleString()}
                            </p>
                          )}
                        </div>

                        <span className="text-sm text-gray-400">
                          {isExpanded ? "▲" : "▼"}
                        </span>
                      </div>
                    </button>

                    {/* ACTIONS */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-[#F7F7F5] bg-[#FFFFFF] p-4">

                      {/* OPEN CHAT / ORDER */}
                      {destination && (
                        <Link
                          href={destination}
                          onClick={() => {
                            if (!notification.is_read) {
                              void updateReadStatus(
                                notification.id,
                                true
                              );
                            }
                          }}
                          className="rounded-full bg-[#1A3C32] px-4 py-2 text-xs font-black text-white hover:bg-[#D4AF37]"
                        >
                          {notification.type === "message"
                            ? "💬 Open Chat"
                            : "📦 View Orders"}
                        </Link>
                      )}

                      {/* READ / UNREAD */}
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          void updateReadStatus(
                            notification.id,
                            !notification.is_read
                          )
                        }
                        className="rounded-full border border-[#F7F7F5] bg-white px-4 py-2 text-xs font-bold text-[#1A3C32] hover:bg-[#F7F7F5] disabled:opacity-50"
                      >
                        {isBusy
                          ? "Working..."
                          : notification.is_read
                          ? "Mark Unread"
                          : "Mark Read"}
                      </button>

                      {/* DELETE */}
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          void deleteNotification(
                            notification.id
                          )
                        }
                        className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 disabled:opacity-50"
                      >
                        {isBusy
                          ? "Working..."
                          : "🗑️ Delete"}
                      </button>

                      {/* EXPAND / COLLAPSE */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(
                            isExpanded
                              ? null
                              : notification.id
                          )
                        }
                        className="ml-auto rounded-full px-3 py-2 text-xs font-bold text-gray-500"
                      >
                        {isExpanded
                          ? "Collapse"
                          : "Expand"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#F7F7F5] bg-[#1A3C32] px-4 py-8 text-center text-white">
        <p className="text-2xl font-black">
          Gold<span className="text-[#D4AF37]">Mart</span>
        </p>

        <p className="mt-2 text-xs text-gray-400">
          Everything you need, all in one place.
        </p>
      </footer>
    </main>
  );
}
