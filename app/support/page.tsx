
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

type Ticket = {
  id: string | number;
  category: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type SupportMessage = {
  id: string | number;
  sender_id: string | number;
  message: string;
  created_at: string;
};

type TicketDetail = {
  ticket: Ticket;
  messages: SupportMessage[];
};

const categories = [
  { value: "order", label: "Order issue" },
  { value: "delivery", label: "Delivery problem" },
  { value: "payment", label: "Payment question" },
  { value: "refund", label: "Refund or return" },
  { value: "account", label: "Account help" },
  { value: "seller", label: "Seller support" },
  { value: "other", label: "Other question" },
];

function friendlyDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function friendlyStatus(status: string) {
  return status.replace(/_/g, " ");
}

function statusStyle(status: string) {
  if (status === "resolved") {
    return "bg-emerald-50 text-emerald-800";
  }

  if (status === "closed") {
    return "bg-stone-100 text-stone-600";
  }

  if (status === "in_progress") {
    return "bg-blue-50 text-blue-800";
  }

  return "bg-[#F8EEDA] text-[#80602C]";
}

async function apiRequest(
  path: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem("goldmart_token");

  if (!token) {
    throw new Error(
      "Please sign in to use customer support."
    );
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok || !data?.success) {
    if (response.status === 401) {
      throw new Error(
        "Your session has expired. Please sign in again."
      );
    }

    throw new Error(
      data?.message ||
        `Request failed (${response.status}).`
    );
  }

  return data;
}

export default function SupportPage() {
  const [signedIn, setSignedIn] = useState<
    boolean | null
  >(null);

  const [userId, setUserId] = useState("");

  const [tickets, setTickets] = useState<Ticket[]>(
    []
  );

  const [listLoading, setListLoading] =
    useState(true);

  const [listError, setListError] = useState("");

  const [selectedId, setSelectedId] =
    useState("");

  const [detail, setDetail] =
    useState<TicketDetail | null>(null);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [detailError, setDetailError] =
    useState("");

  const [category, setCategory] =
    useState("order");

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [creating, setCreating] = useState(false);

  const [createError, setCreateError] =
    useState("");

  const [notice, setNotice] = useState("");

  const [reply, setReply] = useState("");

  const [sendingReply, setSendingReply] =
    useState(false);

  const [replyError, setReplyError] =
    useState("");

  // Load the logged-in customer's tickets

  const loadTickets = useCallback(async () => {
    setListLoading(true);
    setListError("");

    try {
      const data = await apiRequest("/api/support");

      setTickets(
        Array.isArray(data.tickets)
          ? data.tickets
          : []
      );
    } catch (error) {
      setListError(
        error instanceof Error
          ? error.message
          : "Could not load tickets."
      );
    } finally {
      setListLoading(false);
    }
  }, []);

  // Load one ticket and its messages

  const loadTicket = useCallback(
    async (id: string) => {
      setSelectedId(id);
      setDetail(null);
      setDetailLoading(true);
      setDetailError("");
      setReplyError("");

      try {
        const data = await apiRequest(
          `/api/support/${encodeURIComponent(id)}`
        );

        setDetail({
          ticket: data.ticket,
          messages: Array.isArray(data.messages)
            ? data.messages
            : [],
        });
      } catch (error) {
        setDetailError(
          error instanceof Error
            ? error.message
            : "Could not load ticket."
        );
      } finally {
        setDetailLoading(false);
      }
    },
    []
  );

  // Check login and load tickets

  useEffect(() => {
    const token = localStorage.getItem(
      "goldmart_token"
    );

    setSignedIn(Boolean(token));

    if (!token) {
      setListLoading(false);
      return;
    }

    try {
      const savedUser = JSON.parse(
        localStorage.getItem("goldmart_user") ||
          "null"
      );

      setUserId(String(savedUser?.id ?? ""));
    } catch {
      setUserId("");
    }

    void loadTickets();
  }, [loadTickets]);

  // Create a new support ticket

  async function submitTicket(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (creating) return;

    setCreateError("");
    setNotice("");
    setCreating(true);

    try {
      const data = await apiRequest(
        "/api/support",
        {
          method: "POST",
          body: JSON.stringify({
            category,
            subject: subject.trim(),
            message: message.trim(),
          }),
        }
      );

      const newId = String(data.ticket.id);

      setSubject("");
      setMessage("");
      setCategory("order");

      setNotice(
        `Support ticket #${newId} was created successfully.`
      );

      await loadTickets();
      await loadTicket(newId);
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "Could not create ticket."
      );
    } finally {
      setCreating(false);
    }
  }

  // Reply to an existing support ticket

  async function submitReply(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !selectedId ||
      !reply.trim() ||
      sendingReply
    ) {
      return;
    }

    setSendingReply(true);
    setReplyError("");

    try {
      await apiRequest(
        `/api/support/${encodeURIComponent(
          selectedId
        )}/replies`,
        {
          method: "POST",
          body: JSON.stringify({
            message: reply.trim(),
          }),
        }
      );

      setReply("");

      await loadTicket(selectedId);
      await loadTickets();
    } catch (error) {
      setReplyError(
        error instanceof Error
          ? error.message
          : "Could not send reply."
      );
    } finally {
      setSendingReply(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF8F3] pb-16 text-[#17191D]">
      <div className="h-1 bg-gradient-to-r from-[#96713D] via-[#E9D9BB] to-[#C5A46D]" />

      {/* HEADER */}

      <header className="border-b border-[#E8E1D5] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight"
          >
            Gold
            <span className="text-[#B08A50]">
              Mart
            </span>
          </Link>

          <div className="flex gap-2 text-sm font-semibold">
            <Link
              href="/help"
              className="rounded-full border border-[#E8E1D5] px-4 py-2 hover:border-[#C5A46D]"
            >
              Help Centre
            </Link>

            <Link
              href="/account"
              className="rounded-full bg-[#17191D] px-4 py-2 text-white"
            >
              My Account
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* HERO */}

        <section className="rounded-[28px] bg-[#17191D] px-6 py-8 text-white sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E9D9BB]">
            GoldMart Support Centre
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            How can we help?
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#E5DDD1]">
            Create a private support ticket,
            check its progress, and reply to
            the GoldMart support team.
          </p>
        </section>

        {signedIn === null && (
          <p className="mt-8 text-sm">
            Checking your account...
          </p>
        )}

        {/* SIGN IN REQUIRED */}

        {signedIn === false && (
          <section className="mt-7 rounded-3xl border border-[#E8E1D5] bg-white p-7 text-center">
            <h2 className="text-xl font-black">
              Sign in to contact support
            </h2>

            <p className="mt-2 text-sm text-[#716B62]">
              Your support tickets are linked
              to your GoldMart account.
            </p>

            <Link
              href="/login"
              className="mt-5 inline-block rounded-full bg-[#17191D] px-7 py-3 text-sm font-bold text-white"
            >
              Sign In
            </Link>
          </section>
        )}

        {/* SUPPORT DASHBOARD */}

        {signedIn === true && (
          <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              {/* CREATE TICKET */}

              <section className="rounded-3xl border border-[#E8E1D5] bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-xl font-black">
                  Create a Support Ticket
                </h2>

                <p className="mt-2 text-sm text-[#716B62]">
                  Explain your issue clearly.
                  Do not include passwords,
                  card numbers, or secret codes.
                </p>

                <form
                  className="mt-6 space-y-4"
                  onSubmit={submitTicket}
                >
                  <div>
                    <label
                      htmlFor="category"
                      className="mb-2 block text-sm font-bold"
                    >
                      What do you need help with?
                    </label>

                    <select
                      id="category"
                      value={category}
                      onChange={(event) =>
                        setCategory(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-[#DDD5C8] bg-white px-4 py-3 text-sm outline-none focus:border-[#B08A50]"
                    >
                      {categories.map((item) => (
                        <option
                          key={item.value}
                          value={item.value}
                        >
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="mb-2 block text-sm font-bold"
                    >
                      Subject
                    </label>

                    <input
                      id="subject"
                      value={subject}
                      onChange={(event) =>
                        setSubject(
                          event.target.value
                        )
                      }
                      required
                      minLength={5}
                      maxLength={120}
                      placeholder="e.g. I need help with my order"
                      className="w-full rounded-xl border border-[#DDD5C8] px-4 py-3 text-sm outline-none focus:border-[#B08A50]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="mb-2 block text-sm font-bold"
                    >
                      Describe the problem
                    </label>

                    <textarea
                      id="message"
                      value={message}
                      onChange={(event) =>
                        setMessage(
                          event.target.value
                        )
                      }
                      required
                      minLength={10}
                      maxLength={5000}
                      rows={5}
                      placeholder="Tell us what happened and what help you need..."
                      className="w-full resize-y rounded-xl border border-[#DDD5C8] px-4 py-3 text-sm outline-none focus:border-[#B08A50]"
                    />
                  </div>

                  {createError && (
                    <p
                      role="alert"
                      className="text-sm text-red-700"
                    >
                      {createError}
                    </p>
                  )}

                  {notice && (
                    <p
                      role="status"
                      className="text-sm font-semibold text-emerald-800"
                    >
                      {notice}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full rounded-full bg-[#17191D] px-6 py-3 font-bold text-white transition hover:bg-[#96713D] disabled:opacity-60"
                  >
                    {creating
                      ? "Creating ticket..."
                      : "Submit Support Ticket →"}
                  </button>
                </form>
              </section>

              {/* MY TICKETS */}

              <section className="rounded-3xl border border-[#E8E1D5] bg-white p-5 shadow-sm sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black">
                    My Support Tickets
                  </h2>

                  <button
                    type="button"
                    onClick={() =>
                      void loadTickets()
                    }
                    disabled={listLoading}
                    className="text-sm font-bold text-[#96713D] disabled:opacity-50"
                  >
                    Refresh
                  </button>
                </div>

                {listLoading && (
                  <p className="mt-4 text-sm text-[#716B62]">
                    Loading tickets...
                  </p>
                )}

                {listError && (
                  <p
                    role="alert"
                    className="mt-4 text-sm text-red-700"
                  >
                    {listError}
                  </p>
                )}

                {!listLoading &&
                  !listError &&
                  tickets.length === 0 && (
                    <p className="mt-4 rounded-xl bg-[#FAF8F3] p-5 text-sm text-[#716B62]">
                      No support tickets yet.
                      You can create one above.
                    </p>
                  )}

                <div className="mt-4 space-y-3">
                  {tickets.map((ticket) => (
                    <button
                      key={String(ticket.id)}
                      type="button"
                      onClick={() =>
                        void loadTicket(
                          String(ticket.id)
                        )
                      }
                      className={`w-full rounded-2xl border p-4 text-left transition hover:border-[#B08A50] ${
                        selectedId ===
                        String(ticket.id)
                          ? "border-[#B08A50] bg-[#FAF8F3]"
                          : "border-[#E8E1D5]"
                      }`}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="min-w-0 font-bold">
                          #{ticket.id} ·{" "}
                          {ticket.subject}
                        </span>

                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold capitalize ${statusStyle(
                            ticket.status
                          )}`}
                        >
                          {friendlyStatus(
                            ticket.status
                          )}
                        </span>
                      </span>

                      <span className="mt-2 block text-xs text-[#716B62]">
                        Updated{" "}
                        {friendlyDate(
                          ticket.updated_at
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* TICKET CONVERSATION */}

            <section className="rounded-3xl border border-[#E8E1D5] bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-xl font-black">
                Ticket Conversation
              </h2>

              {!selectedId && (
                <p className="mt-4 text-sm leading-6 text-[#716B62]">
                  Select a ticket from your list
                  to read replies or send a
                  follow-up message.
                </p>
              )}

              {detailLoading && (
                <p className="mt-4 text-sm text-[#716B62]">
                  Loading conversation...
                </p>
              )}

              {detailError && (
                <p
                  role="alert"
                  className="mt-4 text-sm text-red-700"
                >
                  {detailError}
                </p>
              )}

              {detail && !detailLoading && (
                <div className="mt-5">
                  <div className="rounded-2xl bg-[#FAF8F3] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#96713D]">
                      Ticket #{detail.ticket.id}
                    </p>

                    <h3 className="mt-1 text-lg font-black">
                      {detail.ticket.subject}
                    </h3>

                    <span
                      className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyle(
                        detail.ticket.status
                      )}`}
                    >
                      {friendlyStatus(
                        detail.ticket.status
                      )}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {detail.messages.map(
                      (item) => {
                        const mine =
                          userId !== "" &&
                          String(
                            item.sender_id
                          ) === userId;

                        return (
                          <article
                            key={String(item.id)}
                            className={`rounded-2xl p-4 ${
                              mine
                                ? "bg-[#F6F0E6]"
                                : "border border-[#E8E1D5] bg-white"
                            }`}
                          >
                            <p className="text-xs font-bold text-[#96713D]">
                              {mine
                                ? "You"
                                : "GoldMart Support"}
                            </p>

                            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                              {item.message}
                            </p>

                            <p className="mt-3 text-xs text-[#716B62]">
                              {friendlyDate(
                                item.created_at
                              )}
                            </p>
                          </article>
                        );
                      }
                    )}
                  </div>

                  {detail.ticket.status ===
                  "closed" ? (
                    <p className="mt-5 rounded-xl bg-[#FAF8F3] p-4 text-sm text-[#716B62]">
                      This ticket is closed.
                      Create a new ticket if
                      you need more help.
                    </p>
                  ) : (
                    <form
                      className="mt-6 space-y-3 border-t border-[#E8E1D5] pt-5"
                      onSubmit={submitReply}
                    >
                      <label
                        htmlFor="reply"
                        className="block text-sm font-bold"
                      >
                        Send a follow-up
                      </label>

                      <textarea
                        id="reply"
                        value={reply}
                        onChange={(event) =>
                          setReply(
                            event.target.value
                          )
                        }
                        required
                        maxLength={5000}
                        rows={4}
                        placeholder="Write your reply..."
                        className="w-full resize-y rounded-xl border border-[#DDD5C8] px-4 py-3 text-sm outline-none focus:border-[#B08A50]"
                      />

                      {replyError && (
                        <p
                          role="alert"
                          className="text-sm text-red-700"
                        >
                          {replyError}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={
                          sendingReply ||
                          !reply.trim()
                        }
                        className="rounded-full bg-[#17191D] px-6 py-3 text-sm font-bold text-white hover:bg-[#96713D] disabled:opacity-60"
                      >
                        {sendingReply
                          ? "Sending..."
                          : "Send Reply →"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
