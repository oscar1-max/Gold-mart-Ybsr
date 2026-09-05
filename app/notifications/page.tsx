"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

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

  useEffect(() => {
    const savedUser =
      localStorage.getItem("goldmart_user");

    if (!savedUser) {
      setLoading(false);
      return;
    }

    try {
      const user =
        JSON.parse(savedUser);

      if (user?.id) {
        setUserId(Number(user.id));
      }
    } catch {
      setError(
        "Unable to load your account."
      );

      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    async function loadNotifications() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_URL}/api/notifications/${userId}`,
            {
              method: "GET",
              headers: {
                Accept:
                  "application/json",
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

    loadNotifications();
  }, [userId]);

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length;

  return (
    <main className="min-h-screen bg-[#F8F7F3] text-black">

      {/* HEADER */}
      <header className="border-b border-black/10 bg-white">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">

          <Link
            href="/"
            className="text-2xl font-black"
          >
            Gold
            <span className="bg-gradient-to-r from-[#9A7617] via-[#D4AF37] to-[#F5D76E] bg-clip-text text-transparent">
              Mart
            </span>
          </Link>

          <Link
            href="/account"
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-bold transition hover:border-[#D4AF37]"
          >
            👤 Account
          </Link>

        </div>

      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:py-12">

        <div className="flex items-end justify-between">

          <div>

            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#A67C00]">
              GoldMart
            </p>

            <h1 className="mt-1 text-3xl font-black">
              Notifications
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Stay updated about your GoldMart activity.
            </p>

          </div>

          {unreadCount > 0 && (
            <div className="rounded-full bg-black px-3 py-1.5 text-xs font-black text-white">
              {unreadCount} unread
            </div>
          )}

        </div>
                {/* LOADING */}
        {loading && (
          <div className="mt-8 rounded-3xl border border-black/5 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F8E7A8] text-2xl">
              🔔
            </div>

            <p className="mt-4 text-sm font-black">
              Loading notifications...
            </p>

          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="mt-8 rounded-3xl border border-red-100 bg-white p-8 text-center">

            <div className="text-3xl">
              ⚠️
            </div>

            <p className="mt-3 text-sm font-bold">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="mt-5 rounded-full bg-black px-6 py-3 text-xs font-black text-white transition hover:bg-[#D4AF37] hover:text-black"
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

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F8E7A8] text-2xl">
                👤
              </div>

              <h2 className="mt-4 text-lg font-black">
                Sign in to view notifications
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Your GoldMart notifications will
                appear here.
              </p>

              <Link
                href="/login"
                className="mt-5 inline-flex rounded-full bg-black px-6 py-3 text-xs font-black text-white transition hover:bg-[#D4AF37] hover:text-black"
              >
                Sign In
              </Link>

            </div>
          )}

        {/* EMPTY */}
        {!loading &&
          !error &&
          userId &&
          notifications.length ===
            0 && (
            <div className="mt-8 rounded-3xl border border-black/5 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F8E7F3] text-2xl">
                🔔
              </div>

              <h2 className="mt-4 text-lg font-black">
                You're all caught up
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                You don't have any notifications yet.
              </p>

              <Link
                href="/shop"
                className="mt-5 inline-flex rounded-full bg-gradient-to-r from-[#9A7617] via-[#D4AF37] to-[#F5D76E] px-6 py-3 text-xs font-black text-black"
              >
                Continue Shopping →
              </Link>

            </div>
          )}

        {/* NOTIFICATIONS */}
        {!loading &&
          !error &&
          notifications.length >
            0 && (
            <div className="mt-8 space-y-3">

              {notifications.map(
                (notification) => (
                  <article
                    key={
                      notification.id
                    }
                    className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5 ${
                      notification.is_read
                        ? "border-black/5"
                        : "border-[#D4AF37]/40 bg-[#FFFDF5]"
                    }`}
                  >

                    <div className="flex gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-lg">
                        {notification.type ===
                        "order"
                          ? "📦"
                          : notification.type ===
                            "payment"
                          ? "💳"
                          : notification.type ===
                            "seller"
                          ? "🏪"
                          : "🔔"}
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-3">

                          <h2 className="text-sm font-black sm:text-base">
                            {
                              notification.title
                            }
                          </h2>

                          {!notification.is_read && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#D4AF37]" />
                          )}

                        </div>

                        <p className="mt-1 text-sm leading-6 text-gray-600">
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

                  </article>
                )
              )}

            </div>
          )}

      </section>
            {/* FOOTER */}
      <footer className="border-t border-black/10 bg-black px-4 py-8 text-center text-white">

        <div className="text-2xl font-black">
          Gold
          <span className="bg-gradient-to-r from-[#9A7617] via-[#F5D76E] to-[#D4AF37] bg-clip-text text-transparent">
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
