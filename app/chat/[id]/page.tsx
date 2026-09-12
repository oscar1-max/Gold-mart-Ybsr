"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

const API_URL = "https://goldmart-backend-yoxc.onrender.com/api";

type User = {
  id: number | string;
  name?: string;
  email?: string;
  role?: string;
};

type Message = {
  id: number | string;
  conversation_id: number | string;
  sender_id: number | string;
  message: string;
  is_read?: boolean;
  created_at: string;
  sender_name?: string;
};

type Conversation = {
  id: number | string;
  buyer_id: number | string;
  seller_id: number | string;
  product_id?: number | string | null;
  buyer_name?: string;
  seller_name?: string;
  product_name?: string | null;
  product_image?: string | null;
};

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();

  const conversationId = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] =
    useState<Conversation | null>(null);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  /*
    Get logged-in user from localStorage.
  */
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("goldmart_user");

      if (!storedUser) {
        router.push("/login");
        return;
      }

      const parsedUser = JSON.parse(storedUser);

      if (!parsedUser?.id) {
        router.push("/login");
        return;
      }

      setUser(parsedUser);
    } catch (err) {
      console.error("User loading error:", err);
      router.push("/login");
    }
  }, [router]);

  /*
    Load conversation messages.
  */
  const loadConversation = useCallback(
    async (showLoading = true) => {
      if (!conversationId) return;

      const token = localStorage.getItem("goldmart_token");

      if (!token) {
        router.push("/login");
        return;
      }

      if (showLoading) {
        setLoading(true);
      }

      try {
        setError("");

        const response = await fetch(
          `${API_URL}/messages/conversations/${conversationId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }
        );

        const data = await response.json().catch(() => null);

        if (response.status === 401) {
          localStorage.removeItem("goldmart_token");
          localStorage.removeItem("goldmart_user");
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data?.message || "Failed to load conversation"
          );
        }

        setConversation(data?.conversation || null);
        setMessages(
          Array.isArray(data?.messages)
            ? data.messages
            : []
        );
      } catch (err) {
        console.error("Conversation loading error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load conversation"
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [conversationId, router]
  );

  useEffect(() => {
    if (!conversationId || !user) return;

    loadConversation(true);

    /*
      Refresh messages periodically so the buyer/seller
      can see new messages without manually refreshing.
    */
    const interval = window.setInterval(() => {
      loadConversation(false);
    }, 4000);

    return () => {
      window.clearInterval(interval);
    };
  }, [conversationId, user, loadConversation]);

  /*
    Keep the newest message visible.
  */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /*
    Send a message.
  */
  const handleSend = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmed = text.trim();

    if (!trimmed || sending || !conversationId) {
      return;
    }

    const token = localStorage.getItem("goldmart_token");

    if (!token) {
      router.push("/login");
      return;
    }

    setSending(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/messages/conversations/${conversationId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmed,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        localStorage.removeItem("goldmart_token");
        localStorage.removeItem("goldmart_user");
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to send message"
        );
      }

      /*
        IMPORTANT:
        Do NOT replace sender_id with currentUserId.

        The backend now returns the real sender_id.
      */
      if (data?.message) {
        setMessages((previous) => [
          ...previous,
          data.message,
        ]);
      }

      setText("");

      /*
        Refresh shortly after sending so the page
        is synchronized with the database.
      */
      window.setTimeout(() => {
        loadConversation(false);
      }, 300);

      inputRef.current?.focus();
    } catch (err) {
      console.error("Send message error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  };

  const currentUserId = user?.id
    ? String(user.id)
    : "";

  const otherPersonName =
    conversation && user
      ? String(conversation.buyer_id) === currentUserId
        ? conversation.seller_name || "Seller"
        : conversation.buyer_name || "Buyer"
      : "Chat";

  const formatTime = (value: string) => {
    try {
      return new Date(value).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-black">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
            <p className="text-sm text-gray-500">
              Loading conversation...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !conversation) {
    return (
      <main className="min-h-screen bg-gray-50 text-black">
        <div className="mx-auto max-w-2xl px-4 py-10">
          <Link
            href="/account"
            className="mb-6 inline-flex items-center text-sm font-medium text-gray-600 hover:text-black"
          >
            ← Back
          </Link>

          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold">
              Could not open chat
            </h1>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => loadConversation(true)}
              className="mt-5 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gray-100 text-black">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="Go back"
          >
            ←
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
              {otherPersonName
                .trim()
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold">
                {otherPersonName}
              </h1>

              {conversation?.product_name ? (
                <p className="truncate text-xs text-gray-500">
                  {conversation.product_name}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  GoldMart chat
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Chat body */}
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-5">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {conversation?.product_name && (
            <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                About this product
              </p>

              <p className="mt-1 text-sm font-semibold">
                {conversation.product_name}
              </p>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex min-h-[55vh] items-center justify-center">
              <div className="max-w-xs text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-black text-xl text-white">
                  💬
                </div>

                <h2 className="text-base font-semibold">
                  Start the conversation
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Send a message to {otherPersonName}.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((item) => {
                /*
                  Compare IDs as strings so that
                  number/string differences don't break
                  the message alignment.
                */
                const isMine =
                  String(item.sender_id) ===
                  currentUserId;

                return (
                  <div
                    key={String(item.id)}
                    className={`flex ${
                      isMine
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                        isMine
                          ? "rounded-br-md bg-black text-white"
                          : "rounded-bl-md bg-white text-black shadow-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-6">
                        {item.message}
                      </p>

                      <div
                        className={`mt-1 text-[10px] ${
                          isMine
                            ? "text-gray-300"
                            : "text-gray-400"
                        }`}
                      >
                        {formatTime(item.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Message input */}
        <div className="sticky bottom-0 border-t border-gray-200 bg-white p-3">
          <form
            onSubmit={handleSend}
            className="mx-auto flex max-w-3xl items-end gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(event) =>
                setText(event.target.value)
              }
              placeholder={`Message ${otherPersonName}...`}
              maxLength={5000}
              disabled={sending}
              className="min-h-12 flex-1 rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-black focus:bg-white"
            />

            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="flex h-12 min-w-20 items-center justify-center rounded-2xl bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {sending ? "..." : "Send"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
        }
