"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com/api";

type Message = {
  id: number;
  sender_id: number;
  message: string;
  created_at: string;
  sender_name: string;
};

type Conversation = {
  id: number;
  buyer_id: number;
  seller_id: number;
  buyer_name: string;
  seller_name: string;
  product_name?: string | null;
};

export default function ConversationPage() {
  const params = useParams();
  const conversationId = String(params.id);

  const [conversation, setConversation] =
    useState<Conversation | null>(null);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [currentUserId, setCurrentUserId] =
    useState<number | null>(null);

  useEffect(() => {
    const savedUser =
      localStorage.getItem("goldmart_user");

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUserId(Number(user.id));
      } catch {}
    }

    loadConversation();
  }, [conversationId]);

  async function loadConversation() {
    try {
      const token =
        localStorage.getItem("goldmart_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/messages/conversations/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load chat"
        );
      }

      setConversation(data.conversation);
      setMessages(data.messages || []);
    } catch (err: any) {
      setError(
        err.message || "Failed to load conversation"
      );
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault();

    const text = message.trim();

    if (!text || sending) return;

    try {
      setSending(true);

      const token =
        localStorage.getItem("goldmart_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/messages/conversations/${conversationId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: text,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to send message"
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          ...data.message,
          sender_id: currentUserId,
        },
      ]);

      setMessage("");

      setTimeout(() => {
        loadConversation();
      }, 500);
    } catch (err: any) {
      alert(
        err.message || "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 text-center shadow">
          Loading chat...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 text-center shadow">
          <p className="mb-4 text-red-600">
            {error}
          </p>

          <Link
            href="/chat"
            className="rounded-lg bg-black px-5 py-2 text-white"
          >
            Back to Messages
          </Link>
        </div>
      </main>
    );
  }

  if (!conversation) return null;

  const otherPerson =
    currentUserId ===
    Number(conversation.buyer_id)
      ? conversation.seller_name
      : conversation.buyer_name;

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">

      {/* Header */}
      <header className="border-b bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-4">

          <Link
            href="/chat"
            className="rounded-lg border px-3 py-2 hover:bg-gray-100"
          >
            ←
          </Link>

          <div>
            <h1 className="text-xl font-bold">
              💬 {otherPerson}
            </h1>

            {conversation.product_name && (
              <p className="text-sm text-gray-500">
                Product: {conversation.product_name}
              </p>
            )}
          </div>

        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-3">

          {messages.length === 0 && (
            <div className="py-20 text-center text-gray-500">
              <div className="mb-3 text-4xl">
                💬
              </div>

              <p>
                No messages yet. Start the
                conversation!
              </p>
            </div>
          )}

          {messages.map((item) => {
            const mine =
              Number(item.sender_id) ===
              Number(currentUserId);

            return (
              <div
                key={item.id}
                className={`flex ${
                  mine
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    mine
                      ? "bg-black text-white"
                      : "bg-white text-gray-900 shadow"
                  }`}
                >
                  {!mine && (
                    <p className="mb-1 text-xs font-semibold text-gray-500">
                      {item.sender_name}
                    </p>
                  )}

                  <p className="whitespace-pre-wrap break-words">
                    {item.message}
                  </p>

                  <p
                    className={`mt-1 text-[10px] ${
                      mine
                        ? "text-gray-300"
                        : "text-gray-400"
                    }`}
                  >
                    {new Date(
                      item.created_at
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* Message box */}
      <div className="border-t bg-white p-4">
        <form
          onSubmit={sendMessage}
          className="mx-auto flex max-w-3xl gap-2"
        >
          <input
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            placeholder="Write a message..."
            maxLength={2000}
            className="flex-1 rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-black"
          />

          <button
            type="submit"
            disabled={
              sending || !message.trim()
            }
            className="rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "..." : "Send"}
          </button>
        </form>
      </div>

    </main>
  );
}
