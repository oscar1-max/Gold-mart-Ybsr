"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com/api";

type Conversation = {
  id: number;
  buyer_id: number;
  seller_id: number;
  product_id?: number | null;
  buyer_name: string;
  seller_name: string;
  product_name?: string | null;
  last_message?: string | null;
  unread_count?: number | string;
  updated_at: string;
};

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      const token = localStorage.getItem("goldmart_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/messages/conversations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load conversations"
        );
      }

      setConversations(data.conversations || []);
    } catch (err: any) {
      setError(
        err.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  function openConversation(id: number) {
    window.location.href = `/chat/${id}`;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              💬 Messages
            </h1>

            <p className="mt-1 text-gray-600">
              Chat privately with buyers and sellers.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Home
          </Link>
        </div>

        {loading && (
          <div className="rounded-xl bg-white p-8 text-center shadow">
            Loading messages...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl bg-white p-8 text-center shadow">
            <p className="mb-4 text-red-600">
              {error}
            </p>

            <button
              onClick={() => {
                setLoading(true);
                setError("");
                loadConversations();
              }}
              className="rounded-lg bg-black px-5 py-2 text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          conversations.length === 0 && (
            <div className="rounded-xl bg-white p-10 text-center shadow">
              <div className="mb-3 text-5xl">
                💬
              </div>

              <h2 className="text-xl font-semibold">
                No conversations yet
              </h2>

              <p className="mt-2 text-gray-500">
                Start a conversation with a seller
                from a product page.
              </p>

              <Link
                href="/shop"
                className="mt-5 inline-block rounded-lg bg-black px-5 py-3 text-white"
              >
                Browse Products
              </Link>
            </div>
          )}

        {!loading &&
          !error &&
          conversations.length > 0 && (
            <div className="space-y-3">
              {conversations.map((conversation) => {
                const tokenUser =
                  localStorage.getItem(
                    "goldmart_user"
                  );

                let currentUserId: number | null =
                  null;

                try {
                  if (tokenUser) {
                    const parsed =
                      JSON.parse(tokenUser);

                    currentUserId = Number(
                      parsed.id
                    );
                  }
                } catch {}

                const otherPerson =
                  currentUserId ===
                  Number(conversation.buyer_id)
                    ? conversation.seller_name
                    : conversation.buyer_name;

                const unread =
                  Number(
                    conversation.unread_count || 0
                  );

                return (
                  <button
                    key={conversation.id}
                    onClick={() =>
                      openConversation(
                        conversation.id
                      )
                    }
                    className="w-full rounded-xl bg-white p-5 text-left shadow transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold">
                          {otherPerson}
                        </h2>

                        {conversation.product_name && (
                          <p className="mt-1 text-sm text-gray-500">
                            Product:{" "}
                            {conversation.product_name}
                          </p>
                        )}

                        <p className="mt-2 truncate text-gray-600">
                          {conversation.last_message ||
                            "No messages yet"}
                        </p>
                      </div>

                      {unread > 0 && (
                        <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
                          {unread}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
      </div>
    </main>
  );
          }
