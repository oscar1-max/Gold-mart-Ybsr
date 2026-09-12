"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com/api";

type Notification = {
  id: number;
  title: string;
  message: string;
  type?: string;
  is_read?: boolean;
  created_at?: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [userId, setUserId] =
    useState<number | null>(null);

  const [token, setToken] =
    useState<string | null>(null);

  const [expandedId, setExpandedId] =
    useState<number | null>(null);

  const [busyId, setBusyId] =
    useState<number | null>(null);

  const [markingAll, setMarkingAll] =
    useState(false);

  useEffect(() => {
    const savedUser =
      localStorage.getItem("goldmart_user");

    const savedToken =
      localStorage.getItem("goldmart_token");

    if (!savedUser || !savedToken) {
      setLoading(false);
      return;
    }

    try {
      const user =
        JSON.parse(savedUser);

      if (user?.id) {
        setUserId(Number(user.id));
        setToken(savedToken);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(
        "Account loading error:",
        err
      );

      setError(
        "Unable to load your account."
      );

      setLoading(false);
    }
  }, []);

  async function loadNotifications() {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `${API_URL}/notifications`,
          {
            method: "GET",
            headers: {
              Accept:
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load notifications."
        );
      }

      setNotifications(
        Array.isArray(
          data.notifications
        )
          ? data.notifications
          : []
      );
    } catch (err) {
      console.error(
        "Notifications error:",
        err
      );

      setError(
        "Notifications could not be loaded yet."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;

    loadNotifications();
  }, [token]);

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length;

  function getIcon(type?: string) {
    switch (type) {
      case "order":
        return "📦";

      case "payment":
        return "💳";

      case "seller":
        return "🏪";

      case "message":
        return "💬";

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

  async function markAsRead(
    notificationId: number
  ) {
    if (!token) return;

    try {
      setBusyId(notificationId);

      const response =
        await fetch(
          `${API_URL}/notifications/${notificationId}/read`,
          {
            method: "PATCH",
            headers: {
              Accept:
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to mark notification as read."
        );
      }

      setNotifications(
        (current) =>
          current.map(
            (notification) =>
              notification.id ===
              notificationId
                ? {
                    ...notification,
                    is_read: true,
                  }
                : notification
          )
      );
    } catch (err) {
      console.error(
        "Mark read error:",
        err
      );
    } finally {
      setBusyId(null);
    }
  }

  async function markAsUnread(
    notificationId: number
  ) {
    if (!token) return;

    try {
      setBusyId(notificationId);

      const response =
        await fetch(
          `${API_URL}/notifications/${notificationId}/unread`,
          {
            method: "PATCH",
            headers: {
              Accept:
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to mark notification as unread."
        );
      }

      setNotifications(
        (current) =>
          current.map(
            (notification) =>
              notification.id ===
              notificationId
                ? {
                    ...notification,
                    is_read: false,
                  }
                : notification
          )
      );
    } catch (err) {
      console.error(
        "Mark unread error:",
        err
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteNotification(
    notificationId: number
  ) {
    if (!token) return;

    try {
      setBusyId(notificationId);

      const response =
        await fetch(
          `${API_URL}/notifications/${notificationId}`,
          {
            method: "DELETE",
            headers: {
              Accept:
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete notification."
        );
      }

      setNotifications(
        (current) =>
          current.filter(
            (notification) =>
              notification.id !==
              notificationId
          )
      );

      if (
        expandedId ===
        notificationId
      ) {
        setExpandedId(null);
      }
    } catch (err) {
      console.error(
        "Delete notification error:",
        err
      );
    } finally {
      setBusyId(null);
    }
  }

  async function markAllAsRead() {
    if (!token || unreadCount === 0)
      return;

    try {
      setMarkingAll(true);

      const response =
        await fetch(
          `${API_URL}/notifications/read-all`,
          {
            method: "PATCH",
            headers: {
              Accept:
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to mark notifications as read."
        );
      }

      setNotifications(
        (current) =>
          current.map(
            (notification) => ({
              ...notification,
              is_read: true,
            })
          )
      );
    } catch (err) {
      console.error(
        "Mark all read error:",
        err
      );
    } finally {
      setMarkingAll(false);
    }
  }

  function openNotification(
    notification: Notification
  ) {
    setExpandedId(
      expandedId === notification.id
        ? null
        : notification.id
    );

    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F6F2] text-black">

      {/* HEADER */}
      <header className="border-b border-black/10 bg-white">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">

          <Link
            href="/"
            className="text-2xl font-black tracking-tight"
          >
            Gold
            <span className="bg-gradient-to-r from-[#9A7617] via-[#C9A227] to-[#E6C85C] bg-clip-text text-transparent">
              Mart
            </span>
          </Link>

          <Link
            href="/account"
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-bold transition hover:border-[#C9A227]"
          >
            👤 Account
          </Link>

        </div>

      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:py-12">

        {/* TITLE */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9A7617]">
              GoldMart
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-tight">
              Notifications
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
              Stay updated about your orders,
              messages, payments, reviews and
              GoldMart activity.
            </p>

          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={markingAll}
              className="rounded-full bg-black px-5 py-3 text-xs font-black text-white transition hover:bg-[#C9A227] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {markingAll
                ? "Marking..."
                : `Mark all as read (${unreadCount})`}
            </button>
          )}

        </div>

        {/* LOADING */}
        {loading && (
          <div className="mt-8 rounded-3xl border border-black/5 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F3E8C2] text-2xl">
              🔔
            </div>

            <p className="mt-4 text-sm font-black">
              Loading notifications...
            </p>

          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="mt-8 rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">

            <div className="text-3xl">
              ⚠️
            </div>

            <p className="mt-3 text-sm font-bold">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                loadNotifications()
              }
              className="mt-5 rounded-full bg-black px-6 py-3 text-xs font-black text-white transition hover:bg-[#C9A227] hover:text-black"
            >
              Try Again
            </button>

          </div>
        )}

        {/* NOT LOGGED IN */}
        {!loading &&
          !error &&
          !userId && (
            <div className="mt-8 rounded-3xl border border-black/5 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F3E8C2] text-2xl">
                👤
              </div>

              <h2 className="mt-4 text-lg font-black">
                Sign in to view notifications
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Your GoldMart notifications will
                appear here.
              </p>

              <Link
                href="/login"
                className="mt-5 inline-flex rounded-full bg-black px-6 py-3 text-xs font-black text-white transition hover:bg-[#C9A227] hover:text-black"
              >
                Sign In
              </Link>

            </div>
          )}

        {/* EMPTY */}
        {!loading &&
          !error &&
          userId &&
          notifications.length === 0 && (
            <div className="mt-8 rounded-3xl border border-black/5 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F3E8C2] text-2xl">
                🔔
              </div>

              <h2 className="mt-4 text-lg font-black">
                You're all caught up
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                You don't have any notifications yet.
              </p>

              <Link
                href="/shop"
                className="mt-5 inline-flex rounded-full bg-black px-6 py-3 text-xs font-black text-white transition hover:bg-[#C9A227] hover:text-black"
              >
                Continue Shopping →
              </Link>

            </div>
          )}
                {/* NOTIFICATIONS */}
        {!loading &&
          !error &&
          notifications.length > 0 && (
            <div className="mt-8 space-y-3">

              {notifications.map(
                (notification) => {
                  const isExpanded =
                    expandedId ===
                    notification.id;

                  const isBusy =
                    busyId ===
                    notification.id;

                  return (
                    <article
                      key={notification.id}
                      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                        notification.is_read
                          ? "border-black/5"
                          : "border-[#C9A227]/40 bg-[#FFFDF5]"
                      }`}
                    >

                      {/* NOTIFICATION CONTENT */}
                      <button
                        type="button"
                        onClick={() =>
                          openNotification(
                            notification
                          )
                        }
                        className="w-full text-left"
                      >

                        <div className="flex gap-4 p-4 sm:p-5">

                          {/* ICON */}
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-lg">
                            {getIcon(
                              notification.type
                            )}
                          </div>

                          {/* TEXT */}
                          <div className="min-w-0 flex-1">

                            <div className="flex items-start justify-between gap-3">

                              <div className="flex items-center gap-2">

                                {!notification.is_read && (
                                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#C9A227]" />
                                )}

                                <h2 className="text-sm font-black sm:text-base">
                                  {
                                    notification.title
                                  }
                                </h2>

                              </div>

                              <span className="shrink-0 text-xs text-gray-400">
                                {isExpanded
                                  ? "▲"
                                  : "▼"}
                              </span>

                            </div>

                            <p
                              className={`mt-1 text-sm leading-6 ${
                                isExpanded
                                  ? "text-gray-700"
                                  : "line-clamp-2 text-gray-600"
                              }`}
                            >
                              {
                                notification.message
                              }
                            </p>

                            {notification.created_at && (
                              <p className="mt-2 text-[10px] font-bold text-gray-400">
                                {new Date(
                                  notification.created_at
                                ).toLocaleString(
                                  "en-US",
                                  {
                                    dateStyle:
                                      "medium",
                                    timeStyle:
                                      "short",
                                  }
                                )}
                              </p>
                            )}

                          </div>

                        </div>

                      </button>

                      {/* ACTIONS */}
                      <div className="border-t border-black/5 bg-[#FAFAF8] px-4 py-3 sm:px-5">

                        <div className="flex flex-wrap items-center gap-2">

                          {/* READ / UNREAD */}
                          {notification.is_read ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                markAsUnread(
                                  notification.id
                                )
                              }
                              className="rounded-full border border-black/10 bg-white px-4 py-2 text-[11px] font-black transition hover:border-[#C9A227] hover:bg-[#FFF8DC] disabled:opacity-50"
                            >
                              {isBusy
                                ? "Working..."
                                : "🔵 Mark unread"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                markAsRead(
                                  notification.id
                                )
                              }
                              className="rounded-full border border-black/10 bg-white px-4 py-2 text-[11px] font-black transition hover:border-[#C9A227] hover:bg-[#FFF8DC] disabled:opacity-50"
                            >
                              {isBusy
                                ? "Working..."
                                : "✓ Mark read"}
                            </button>
                          )}

                          {/* DELETE */}
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              deleteNotification(
                                notification.id
                              )
                            }
                            className="rounded-full border border-red-100 bg-white px-4 py-2 text-[11px] font-black text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {isBusy
                              ? "Deleting..."
                              : "🗑️ Delete"}
                          </button>

                          {/* OPEN / CLOSE */}
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(
                                isExpanded
                                  ? null
                                  : notification.id
                              )
                            }
                            className="ml-auto rounded-full px-3 py-2 text-[11px] font-black text-gray-500 transition hover:bg-black/5 hover:text-black"
                          >
                            {isExpanded
                              ? "Collapse"
                              : "Open"}
                          </button>

                        </div>

                      </div>

                    </article>
                  );
                }
              )}

            </div>
          )}

      </section>

      {/* FOOTER */}
      <footer className="border-t border-black/10 bg-black px-4 py-8 text-center text-white">

        <div className="text-2xl font-black">
          Gold
          <span className="bg-gradient-to-r from-[#9A7617] via-[#E6C85C] to-[#C9A227] bg-clip-text text-transparent">
            Mart
          </span>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Everything you need, all in one place.
        </p>

        <div className="mt-5 flex justify-center gap-5 text-xs">

          <Link
            href="/"
            className="text-gray-400 transition hover:text-white"
          >
            Home
          </Link>

          <Link
            href="/shop"
            className="text-gray-400 transition hover:text-white"
          >
            Shop
          </Link>

          <Link
            href="/cart"
            className="text-gray-400 transition hover:text-white"
          >
            Cart
          </Link>

        </div>

        <p className="mt-6 text-[10px] text-gray-600">
          © 2026 GoldMart. All rights reserved.
        </p>

      </footer>

    </main>
  );
}
