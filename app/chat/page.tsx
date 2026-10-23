
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

type Conversation = {
  id: number;
  buyer_id: number;
  seller_id: number;
  product_id?: number | null;

  other_user_name?: string | null;
  other_user_id?: number | null;

  product_name?: string | null;
  product_image?: string | null;

  last_message?: string | null;
  last_message_at?: string | null;

  unread_count?: number | string;
  updated_at?: string | null;
};

type ConversationsResponse = {
  success: boolean;
  message?: string;
  conversations?: Conversation[];
};

// =====================================================
// CHAT PAGE
// =====================================================

export default function ChatPage() {
  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [currentUserId, setCurrentUserId] =
    useState<number | null>(null);

  // ===================================================
  // LOAD CONVERSATIONS
  // ===================================================

  const loadConversations = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const token =
          localStorage.getItem(
            "goldmart_token"
          );

        if (!token) {
          window.location.href =
            "/login";

          return;
        }

        const savedUser =
          localStorage.getItem(
            "goldmart_user"
          );

        if (savedUser) {
          try {
            const user =
              JSON.parse(savedUser);

            const userId =
              Number(user?.id);

            if (
              Number.isInteger(userId) &&
              userId > 0
            ) {
              setCurrentUserId(
                userId
              );
            }
          } catch {
            setCurrentUserId(null);
          }
        }

        const response = await fetch(
          `${API_URL}/messages/conversations`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
              Accept:
                "application/json",
            },
            cache: "no-store",
          }
        );

        const data:
          ConversationsResponse =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to load messages."
          );
        }

        const incoming =
          Array.isArray(
            data.conversations
          )
            ? data.conversations
            : [];

        setConversations(
          incoming
        );

        setError("");
      } catch (err) {
        console.error(
          "GoldMart chat loading error:",
          err
        );

        if (!silent) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load conversations."
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // ===================================================
  // INITIAL LOAD AND AUTOMATIC REFRESH
  // ===================================================

  useEffect(() => {
    void loadConversations();

    const interval =
      window.setInterval(() => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void loadConversations(
            true
          );
        }
      }, 15000);

    const handleFocus = () => {
      void loadConversations(true);
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.clearInterval(
        interval
      );

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [loadConversations]);

  // ===================================================
  // FORMAT LAST MESSAGE TIME
  // ===================================================

  function formatTime(
    value?: string | null
  ) {
    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    return date.toLocaleString(
      undefined,
      {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }

  // ===================================================
  // GET CONVERSATION DISPLAY NAME
  // ===================================================

  function getOtherPerson(
    conversation: Conversation
  ) {
    const backendName =
      conversation.other_user_name;

    if (
      typeof backendName ===
        "string" &&
      backendName.trim()
    ) {
      return backendName;
    }

    const isBuyer =
      currentUserId !== null &&
      Number(
        conversation.buyer_id
      ) === currentUserId;

    return isBuyer
      ? "Seller"
      : "Buyer";
  }

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <main className="min-h-screen bg-[#FFFFFF] pb-28 text-[#14263D] md:pb-14">
      <section aria-label="Messages introduction" className="relative mx-auto mt-5 max-w-7xl overflow-hidden rounded-[27px] px-6 py-8 text-white shadow-[0_15px_35px_rgba(25,39,46,0.13)] sm:mt-8 sm:px-10 sm:py-12" style={{ background: "linear-gradient(135deg, #14263D 0%, #243B53 50%, #FF6B00 100%)" }}>
        <div className="pointer-events-none absolute -right-8 -top-14 text-[150px] leading-none opacity-10" aria-hidden="true">💬</div>
        <div className="relative">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#FFE9CC]">GoldMart · Messages</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">Conversations, beautifully organized.</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/85">Keep up with buyers and sellers in one convenient place.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/shop" className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/25">Shop All ↗</Link>
            <Link href="/track-order" className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/25">Track Order ↗</Link>
            <Link href="/help" className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/25">Help Centre ↗</Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl">

        {/* HEADER */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#FF6B00]">
              GoldMart Messages
            </p>

            <h1 className="mt-1 text-3xl font-black">
              💬 Your Conversations
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Send and receive messages
              with buyers and sellers.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/"
              className="rounded-xl border bg-white px-4 py-3 text-sm font-bold hover:bg-gray-100"
            >
              Home
            </Link>

            <Link
              href="/shop"
              className="rounded-xl bg-black px-4 py-3 text-sm font-bold text-white hover:bg-[#FF6B00] hover:text-black"
            >
              Shop
            </Link>
          </div>
        </div>

        {/* REFRESH BUTTON */}

        <div className="mb-5 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {conversations.length}{" "}
            {conversations.length === 1
              ? "conversation"
              : "conversations"}
          </span>

          <button
            type="button"
            disabled={refreshing}
            onClick={() =>
              void loadConversations(
                true
              )
            }
            className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="rounded-2xl border border-[#FFF8F2] bg-white shadow-[0_5px_18px_rgba(24,42,50,0.045)] p-10 text-center shadow-sm">
            <div className="mb-4 text-4xl">
              ⏳
            </div>

            <p className="font-semibold">
              Loading conversations...
            </p>
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="rounded-2xl border border-[#FFF8F2] bg-white shadow-[0_5px_18px_rgba(24,42,50,0.045)] p-8 text-center shadow-sm">
            <div className="mb-4 text-4xl">
              ⚠️
            </div>

            <p className="mb-5 text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadConversations()
              }
              className="rounded-xl bg-black px-6 py-3 font-bold text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY CHAT LIST */}

        {!loading &&
          !error &&
          conversations.length ===
            0 && (
            <div className="rounded-2xl border border-[#FFF8F2] bg-white shadow-[0_5px_18px_rgba(24,42,50,0.045)] p-10 text-center shadow-sm">
              <div className="text-5xl">
                💬
              </div>

              <h2 className="mt-4 text-xl font-black">
                No conversations yet
              </h2>

              <p className="mt-3 text-gray-500">
                Your messages with buyers
                and sellers will appear here.
              </p>

              <Link
                href="/shop"
                className="mt-6 inline-block rounded-xl bg-black px-6 py-3 font-bold text-white"
              >
                Browse Products
              </Link>
            </div>
          )}

        {/* CONVERSATION LIST */}

        {!loading &&
          !error &&
          conversations.length >
            0 && (
            <div className="space-y-3">
              {conversations.map(
                (conversation) => {
                  const unread =
                    Number(
                      conversation.unread_count ||
                        0
                    );

                  const isSeller =
                    currentUserId !== null &&
                    Number(
                      conversation.seller_id
                    ) === currentUserId;

                  const otherPerson =
                    getOtherPerson(
                      conversation
                    );

                  return (
                    <Link
                      key={
                        conversation.id
                      }
                      href={`/chat/${conversation.id}`}
                      className="block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-[#FF6B00] hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-xl">
                          💬
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="font-black">
                              {otherPerson}
                            </h2>

                            <span className="text-xs text-gray-400">
                              {formatTime(
                                conversation.last_message_at ||
                                  conversation.updated_at
                              )}
                            </span>
                          </div>

                          <p className="mt-1 text-xs font-semibold text-[#FF6B00]">
                            {isSeller
                              ? "Customer conversation"
                              : "Seller conversation"}
                          </p>

                          {conversation.product_name && (
                            <p className="mt-2 text-sm text-gray-500">
                              Product:{" "}
                              {
                                conversation.product_name
                              }
                            </p>
                          )}

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <p className="min-w-0 truncate text-sm text-gray-600">
                              {conversation.last_message ||
                                "Open this conversation to start chatting."}
                            </p>

                            {unread > 0 && (
                              <span className="shrink-0 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
                                {unread}
                              </span>
                            )}
                          </div>

                          <p className="mt-3 text-xs font-semibold text-gray-400">
                            Tap to open and reply →
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          )}
      </div>
    </main>
  );
}
