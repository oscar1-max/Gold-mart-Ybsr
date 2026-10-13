
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FormEvent } from "react";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

type Ticket = {
  id: string | number;
  user_id: string | number;
  category: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type TicketMessage = {
  id: string | number;
  sender_id: string | number;
  message: string;
  created_at: string;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  tickets?: Ticket[];
  ticket?: Ticket;
  messages?: TicketMessage[];
};

type AccessState =
  | "checking"
  | "allowed"
  | "denied"
  | "login";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusLabel(value: string) {
  return (
    STATUS_OPTIONS.find(
      (item) => item.value === value
    )?.label || value
  );
}

function statusClass(value: string) {
  switch (value) {
    case "open":
      return "bg-amber-50 text-amber-800";
    case "in_progress":
      return "bg-blue-50 text-blue-800";
    case "resolved":
      return "bg-emerald-50 text-emerald-800";
    case "closed":
      return "bg-stone-100 text-stone-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

async function apiRequest(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse> {
  const token = localStorage.getItem(
    "goldmart_token"
  );

  if (!token) {
    throw new ApiError(
      "Please sign in first.",
      401
    );
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(options.body
          ? {
              "Content-Type":
                "application/json",
            }
          : {}),
        ...options.headers,
      },
    }
  );

  const data: ApiResponse | null =
    await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    throw new ApiError(
      data?.message ||
        `Request failed (${response.status})`,
      response.status
    );
  }

  return data;
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong.";
}

export default function AdminSupportPage() {
  const [access, setAccess] =
    useState<AccessState>("checking");

  const [tickets, setTickets] =
    useState<Ticket[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [listError, setListError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("all");

  const [selectedTicket, setSelectedTicket] =
    useState<Ticket | null>(null);

  const [messages, setMessages] =
    useState<TicketMessage[]>([]);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [detailError, setDetailError] =
    useState("");

  const [statusDraft, setStatusDraft] =
    useState("open");

  const [savingStatus, setSavingStatus] =
    useState(false);

  const [replyText, setReplyText] =
    useState("");

  const [sendingReply, setSendingReply] =
    useState(false);

  const [actionError, setActionError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  // Verify admin authorization using the backend.
  // Browser account fields do not grant admin access.

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setListError("");

    try {
      const data = await apiRequest(
        "/api/support/admin/tickets"
      );

      setTickets(
        Array.isArray(data.tickets)
          ? data.tickets
          : []
      );

      setAccess("allowed");
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 401
      ) {
        setAccess("login");
      } else if (
        error instanceof ApiError &&
        error.status === 403
      ) {
        setAccess("denied");
      } else {
        setAccess("allowed");
        setListError(errorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  async function openTicket(
    ticket: Ticket
  ) {
    setSelectedTicket(ticket);
    setMessages([]);
    setStatusDraft(ticket.status);
    setReplyText("");
    setDetailError("");
    setActionError("");
    setNotice("");
    setDetailLoading(true);

    try {
      const data = await apiRequest(
        `/api/support/${ticket.id}`
      );

      if (!data.ticket) {
        throw new Error(
          "Ticket details are missing."
        );
      }

      setSelectedTicket(data.ticket);
      setStatusDraft(data.ticket.status);

      setMessages(
        Array.isArray(data.messages)
          ? data.messages
          : []
      );
    } catch (error) {
      setDetailError(errorMessage(error));
    } finally {
      setDetailLoading(false);
    }
  }

  async function refreshConversation() {
    if (!selectedTicket) return;

    await openTicket(selectedTicket);
  }

  // Save the selected ticket status.

  async function updateStatus(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !selectedTicket ||
      savingStatus ||
      statusDraft === selectedTicket.status
    ) {
      return;
    }

    setSavingStatus(true);
    setActionError("");
    setNotice("");

    try {
      const data = await apiRequest(
        `/api/support/admin/${selectedTicket.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: statusDraft,
          }),
        }
      );

      if (data.ticket) {
        setSelectedTicket(data.ticket);
        setStatusDraft(data.ticket.status);
      }

      setNotice(
        "Ticket status updated successfully."
      );

      await loadTickets();
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setSavingStatus(false);
    }
  }

  // Send a support-team reply.

  async function sendReply(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !selectedTicket ||
      !replyText.trim() ||
      sendingReply
    ) {
      return;
    }

    setSendingReply(true);
    setActionError("");
    setNotice("");

    try {
      await apiRequest(
        `/api/support/${selectedTicket.id}/replies`,
        {
          method: "POST",
          body: JSON.stringify({
            message: replyText.trim(),
          }),
        }
      );

      setReplyText("");

      const data = await apiRequest(
        `/api/support/${selectedTicket.id}`
      );

      if (data.ticket) {
        setSelectedTicket(data.ticket);
      }

      setMessages(
        Array.isArray(data.messages)
          ? data.messages
          : []
      );

      setNotice(
        "Support reply sent successfully."
      );

      await loadTickets();
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setSendingReply(false);
    }
  }

  // Dashboard statistics

  const counts = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter(
        (ticket) => ticket.status === "open"
      ).length,
      inProgress: tickets.filter(
        (ticket) =>
          ticket.status === "in_progress"
      ).length,
      resolved: tickets.filter(
        (ticket) =>
          ticket.status === "resolved"
      ).length,
    };
  }, [tickets]);

  // Search and filter tickets

  const visibleTickets = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesStatus =
        filter === "all" ||
        ticket.status === filter;

      const searchableText = [
        ticket.id,
        ticket.user_id,
        ticket.subject,
        ticket.category,
        ticket.status,
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        (!query ||
          searchableText.includes(query))
      );
    });
  }, [tickets, search, filter]);

  return (
    <main className="min-h-screen bg-[#FAF8F3] pb-16 text-[#17191D]">
      <div className="h-1 bg-gradient-to-r from-[#96713D] via-[#E9D9BB] to-[#C5A46D]" />

      {/* HEADER */}

      <header className="border-b border-[#E8E1D5] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <Link
            href="/"
            className="text-2xl font-black"
          >
            Gold
            <span className="text-[#B08A50]">
              Mart
            </span>
          </Link>

          <Link
            href="/account"
            className="rounded-full border border-[#E8E1D5] px-4 py-2 text-sm font-bold"
          >
            My Account
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* HERO */}

        <section className="rounded-[28px] bg-[#17191D] p-7 text-white sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E9D9BB]">
            GoldMart Administration
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            🎧 Admin Support Inbox
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#E5DDD1]">
            Review support requests, help
            customers, and manage ticket
            progress from one place.
          </p>
        </section>

        {/* CHECKING ACCESS */}

        {access === "checking" && (
          <p className="mt-8 text-sm">
            Checking administrator access...
          </p>
        )}

        {/* LOGIN REQUIRED */}

        {access === "login" && (
          <div className="mt-7 rounded-3xl border border-[#E8E1D5] bg-white p-8 text-center">
            <h2 className="text-xl font-black">
              Please sign in
            </h2>

            <p className="mt-3 text-sm text-[#716B62]">
              Sign in with your authorized
              GoldMart administrator account.
            </p>

            <Link
              href="/login"
              className="mt-6 inline-block rounded-full bg-[#17191D] px-6 py-3 text-sm font-bold text-white"
            >
              Go to Login
            </Link>
          </div>
        )}

        {/* ACCESS DENIED */}

        {access === "denied" && (
          <div className="mt-7 rounded-3xl border border-red-200 bg-white p-8 text-center">
            <h2 className="text-xl font-black">
              Administrator Access Required
            </h2>

            <p className="mt-3 text-sm text-[#716B62]">
              This account does not have
              permission to manage GoldMart
              support tickets.
            </p>

            <Link
              href="/account"
              className="mt-6 inline-block rounded-full bg-[#17191D] px-6 py-3 text-sm font-bold text-white"
            >
              Back to Account
            </Link>
          </div>
        )}

        {/* ADMIN DASHBOARD */}

        {access === "allowed" && (
          <>
            {/* STATS */}

            <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                {
                  label: "Total Tickets",
                  value: counts.total,
                  icon: "🎫",
                },
                {
                  label: "Open",
                  value: counts.open,
                  icon: "📬",
                },
                {
                  label: "In Progress",
                  value: counts.inProgress,
                  icon: "⏳",
                },
                {
                  label: "Resolved",
                  value: counts.resolved,
                  icon: "✅",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[22px] border border-[#E8E1D5] bg-white p-5 shadow-sm"
                >
                  <span className="text-2xl">
                    {item.icon}
                  </span>

                  <p className="mt-3 text-xs font-semibold text-[#716B62]">
                    {item.label}
                  </p>

                  <p className="mt-1 text-3xl font-black">
                    {loading
                      ? "—"
                      : item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">

              {/* TICKET LIST */}

              <section className="min-w-0 rounded-3xl border border-[#E8E1D5] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black">
                    Support Tickets
                  </h2>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      void loadTickets()
                    }
                    className="text-sm font-bold text-[#96713D] disabled:opacity-50"
                  >
                    Refresh
                  </button>
                </div>

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search ticket, customer ID, issue..."
                  className="mt-5 w-full rounded-xl border border-[#DDD5C8] px-4 py-3 text-sm outline-none focus:border-[#B08A50]"
                />

                <select
                  value={filter}
                  onChange={(event) =>
                    setFilter(event.target.value)
                  }
                  className="mt-3 w-full rounded-xl border border-[#DDD5C8] bg-white px-4 py-3 text-sm"
                >
                  <option value="all">
                    All Statuses
                  </option>

                  {STATUS_OPTIONS.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>

                {loading && (
                  <p className="mt-6 text-sm text-[#716B62]">
                    Loading support tickets...
                  </p>
                )}

                {listError && (
                  <div
                    role="alert"
                    className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                  >
                    {listError}

                    <button
                      type="button"
                      onClick={() =>
                        void loadTickets()
                      }
                      className="mt-3 block font-bold underline"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {!loading &&
                  !listError &&
                  visibleTickets.length === 0 && (
                    <div className="mt-6 rounded-2xl bg-[#FAF8F3] p-8 text-center">
                      <p className="text-4xl">
                        📭
                      </p>

                      <p className="mt-3 font-bold">
                        No matching tickets
                      </p>

                      <p className="mt-2 text-sm text-[#716B62]">
                        New support requests
                        will appear here.
                      </p>
                    </div>
                  )}

                <div className="mt-5 space-y-3">
                  {visibleTickets.map(
                    (ticket) => (
                      <button
                        type="button"
                        key={String(ticket.id)}
                        onClick={() =>
                          void openTicket(ticket)
                        }
                        className={`w-full rounded-2xl border p-4 text-left transition hover:border-[#C5A46D] ${
                          String(
                            selectedTicket?.id
                          ) === String(ticket.id)
                            ? "border-[#B08A50] bg-[#FAF8F3]"
                            : "border-[#E8E1D5]"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#96713D]">
                            Ticket #{ticket.id}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                              ticket.status
                            )}`}
                          >
                            {statusLabel(
                              ticket.status
                            )}
                          </span>
                        </div>

                        <p className="mt-3 break-words font-black">
                          {ticket.subject}
                        </p>

                        <p className="mt-2 text-xs text-[#716B62]">
                          Customer ID:{" "}
                          {ticket.user_id}
                        </p>

                        <p className="mt-1 text-xs capitalize text-[#716B62]">
                          {ticket.category}
                          {" · "}
                          {formatDate(
                            ticket.updated_at
                          )}
                        </p>
                      </button>
                    )
                  )}
                </div>
              </section>

              {/* SELECTED TICKET */}

              <section className="min-w-0 rounded-3xl border border-[#E8E1D5] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black">
                    Ticket Details
                  </h2>

                  {selectedTicket && (
                    <button
                      type="button"
                      disabled={detailLoading}
                      onClick={() =>
                        void refreshConversation()
                      }
                      className="text-sm font-bold text-[#96713D] disabled:opacity-50"
                    >
                      Refresh
                    </button>
                  )}
                </div>

                {!selectedTicket && (
                  <div className="mt-6 rounded-2xl bg-[#FAF8F3] p-8 text-center">
                    <p className="text-4xl">
                      💬
                    </p>

                    <p className="mt-4 text-sm text-[#716B62]">
                      Select a ticket to read
                      the conversation and
                      respond to the customer.
                    </p>
                  </div>
                )}

                {selectedTicket && (
                  <div className="mt-5">
                    <div className="rounded-2xl bg-[#FAF8F3] p-5">
                      <p className="text-xs font-bold text-[#96713D]">
                        Ticket #
                        {selectedTicket.id}
                      </p>

                      <h3 className="mt-2 break-words text-lg font-black">
                        {selectedTicket.subject}
                      </h3>

                      <p className="mt-2 text-sm text-[#716B62]">
                        Customer #
                        {selectedTicket.user_id}
                      </p>

                      <p className="mt-1 text-xs text-[#716B62]">
                        Created{" "}
                        {formatDate(
                          selectedTicket.created_at
                        )}
                      </p>
                    </div>

                    {detailLoading && (
                      <p className="mt-5 text-sm">
                        Loading conversation...
                      </p>
                    )}

                    {detailError && (
                      <p
                        role="alert"
                        className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                      >
                        {detailError}
                      </p>
                    )}

                    {!detailLoading &&
                      !detailError && (
                        <>
                          {/* STATUS CONTROL */}

                          <form
                            onSubmit={updateStatus}
                            className="mt-6 rounded-2xl border border-[#E8E1D5] p-4"
                          >
                            <label
                              htmlFor="ticket-status"
                              className="block text-sm font-bold"
                            >
                              Ticket Status
                            </label>

                            <select
                              id="ticket-status"
                              value={statusDraft}
                              onChange={(
                                event
                              ) =>
                                setStatusDraft(
                                  event.target.value
                                )
                              }
                              className="mt-3 w-full rounded-xl border border-[#DDD5C8] bg-white px-4 py-3 text-sm"
                            >
                              {STATUS_OPTIONS.map(
                                (item) => (
                                  <option
                                    key={item.value}
                                    value={
                                      item.value
                                    }
                                  >
                                    {item.label}
                                  </option>
                                )
                              )}
                            </select>

                            <button
                              type="submit"
                              disabled={
                                savingStatus ||
                                statusDraft ===
                                  selectedTicket.status
                              }
                              className="mt-3 rounded-full bg-[#17191D] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                            >
                              {savingStatus
                                ? "Saving..."
                                : "Save Status"}
                            </button>
                          </form>

                          {/* CONVERSATION */}

                          <div className="mt-7">
                            <h3 className="text-base font-black">
                              Conversation
                            </h3>

                            {messages.length ===
                              0 && (
                              <p className="mt-4 text-sm text-[#716B62]">
                                No messages found.
                              </p>
                            )}

                            <div className="mt-4 max-h-[500px] space-y-3 overflow-y-auto">
                              {messages.map(
                                (item) => {
                                  const fromCustomer =
                                    String(
                                      item.sender_id
                                    ) ===
                                    String(
                                      selectedTicket.user_id
                                    );

                                  return (
                                    <article
                                      key={String(
                                        item.id
                                      )}
                                      className={`rounded-2xl p-4 ${
                                        fromCustomer
                                          ? "bg-[#FAF8F3]"
                                          : "bg-[#17191D] text-white"
                                      }`}
                                    >
                                      <p
                                        className={`text-xs font-bold ${
                                          fromCustomer
                                            ? "text-[#96713D]"
                                            : "text-[#E9D9BB]"
                                        }`}
                                      >
                                        {fromCustomer
                                          ? "Customer"
                                          : "GoldMart Support"}
                                      </p>

                                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                                        {
                                          item.message
                                        }
                                      </p>

                                      <p
                                        className={`mt-3 text-xs ${
                                          fromCustomer
                                            ? "text-[#716B62]"
                                            : "text-[#D6D1C8]"
                                        }`}
                                      >
                                        {formatDate(
                                          item.created_at
                                        )}
                                      </p>
                                    </article>
                                  );
                                }
                              )}
                            </div>
                          </div>

                          {/* ADMIN REPLY */}

                          {selectedTicket.status ===
                          "closed" ? (
                            <p className="mt-6 rounded-xl bg-[#FAF8F3] p-4 text-sm text-[#716B62]">
                              This ticket is
                              closed. Change its
                              status before
                              replying.
                            </p>
                          ) : (
                            <form
                              onSubmit={
                                sendReply
                              }
                              className="mt-7 border-t border-[#E8E1D5] pt-5"
                            >
                              <label
                                htmlFor="admin-reply"
                                className="block text-sm font-bold"
                              >
                                Reply to Customer
                              </label>

                              <textarea
                                id="admin-reply"
                                rows={5}
                                maxLength={
                                  5000
                                }
                                required
                                value={
                                  replyText
                                }
                                onChange={(
                                  event
                                ) =>
                                  setReplyText(
                                    event.target.value
                                  )
                                }
                                placeholder="Write a helpful response..."
                                className="mt-3 w-full resize-y rounded-xl border border-[#DDD5C8] px-4 py-3 text-sm outline-none focus:border-[#B08A50]"
                              />

                              <button
                                type="submit"
                                disabled={
                                  sendingReply ||
                                  !replyText.trim()
                                }
                                className="mt-3 rounded-full bg-[#C5A46D] px-6 py-3 text-sm font-bold text-[#17191D] disabled:opacity-50"
                              >
                                {sendingReply
                                  ? "Sending..."
                                  : "Send Reply →"}
                              </button>
                            </form>
                          )}

                          {actionError && (
                            <p
                              role="alert"
                              className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                            >
                              {actionError}
                            </p>
                          )}

                          {notice && (
                            <p
                              role="status"
                              className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800"
                            >
                              {notice}
                            </p>
                          )}
                        </>
                      )}
                  </div>
                )}
              </section>
            </div>

            <p className="mt-6 text-center text-xs text-[#716B62]">
              GoldMart Support Administration
              · Authorized personnel only
            </p>
          </>
        )}
      </div>
    </main>
  );
}
