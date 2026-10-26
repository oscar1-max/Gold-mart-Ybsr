"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";
const SUBJECT = "Delete my GoldMart account";

type Ticket = {
  id: string | number;
  category: string;
  subject: string;
  status: string;
  created_at: string;
};
type ApiResponse = {
  success?: boolean;
  message?: string;
  tickets?: Ticket[];
  ticket?: Ticket;
};

function activeRequest(ticket: Ticket) {
  return ticket.category === "account" &&
    ticket.subject.trim().toLowerCase() === SUBJECT.toLowerCase() &&
    ["open", "in_progress"].includes(ticket.status);
}

export default function AccountDeletionPage() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [request, setRequest] = useState<Ticket | null>(null);
  const [checked, setChecked] = useState(false);
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadRequest = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("goldmart_token");
    if (!token) {
      setSignedIn(false);
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/support`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({}))) as ApiResponse;
      if (response.status === 401) {
        setSignedIn(false);
        return;
      }
      if (!response.ok || !data.success || !Array.isArray(data.tickets)) {
        throw new Error(data.message || "Unable to check existing requests.");
      }
      setSignedIn(true);
      setRequest(data.tickets.find(activeRequest) || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to check existing requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadRequest(); }, [loadRequest]);

  async function submitRequest() {
    if (!checked || loading || sending || request) return;
    const token = localStorage.getItem("goldmart_token");
    if (!token) {
      setSignedIn(false);
      return;
    }
    setSending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/api/support`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          category: "account",
          subject: SUBJECT,
          message: "I request closure of my GoldMart account and deletion of eligible personal data. " +
            "Please review outstanding orders, refunds, seller obligations, and any records that must legally be retained." +
            (details.trim() ? "\nAdditional information: " + details.trim() : ""),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as ApiResponse;
      if (response.status === 401) {
        setSignedIn(false);
        return;
      }
      if (!response.ok || !data.success || !data.ticket) {
        throw new Error(data.message || "Could not submit your request.");
      }
      setRequest(data.ticket);
      setNotice("Your deletion request has been submitted to GoldMart Support. Your account has NOT been deleted yet.");
      setDetails("");
      setChecked(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your request.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#111514] px-5 py-12 text-[#F5F3EC]">
      <article className="mx-auto max-w-3xl space-y-6 leading-7">
        <Link href="/account" className="text-[#DCC38E]">← My account</Link>
        <h1 className="text-3xl font-bold">Request account deletion</h1>
        <p>GoldMart buyers and sellers can request account closure and deletion of eligible personal information. Requests are handled by support and are <strong>not automatic deletion</strong>.</p>

        <section className="rounded-2xl border border-[#444B40] bg-[#1C211E] p-6">
          <h2 className="text-xl font-semibold">Your request</h2>
          {loading && <p role="status" className="mt-3 text-[#C4C7BE]">Checking for an existing request…</p>}
          {!loading && signedIn === false && (
            <div className="mt-3">
              <p>Sign in to the account you want deleted so support can identify your request securely.</p>
              <Link href="/login" className="mt-4 inline-block rounded-xl bg-[#C8AB6D] px-5 py-2 font-bold text-black">Sign in</Link>
            </div>
          )}
          {!loading && signedIn === true && request && (
            <div className="mt-3 space-y-3">
              <p className="font-semibold text-[#E4D3A9]">Existing deletion request #{request.id}</p>
              <p>Status: <span className="capitalize">{request.status.replace(/_/g, " ")}</span>. Support is reviewing your request. Do not submit a duplicate request.</p>
              <Link href="/support" className="inline-block rounded-xl border border-[#817257] px-4 py-2 text-sm">View and reply to support ticket</Link>
            </div>
          )}
          {!loading && signedIn === true && !request && !error && (
            <div className="mt-4 space-y-4">
              <label htmlFor="deletion-details" className="block text-sm font-semibold">Additional information (optional)</label>
              <textarea
                id="deletion-details"
                maxLength={500}
                rows={3}
                value={details}
                onChange={event => setDetails(event.target.value)}
                placeholder="Anything support should know about your request. Do not enter passwords or bank details."
                className="w-full rounded-xl border border-[#555E51] bg-[#111514] p-3 text-[#F5F3EC] outline-none focus:border-[#C8AB6D]"
              />
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} className="mt-1 accent-[#C8AB6D]" />
                <span>I understand this sends a support request and does not immediately delete my account. Some order, dispute, fraud-prevention or legally required records may need to be retained.</span>
              </label>
              <button type="button" disabled={!checked || sending} onClick={() => void submitRequest()}
                className="rounded-xl bg-[#C8AB6D] px-5 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-50">
                {sending ? "Submitting…" : "Submit deletion request"}
              </button>
            </div>
          )}
          {error && <div role="alert" className="mt-4 text-[#F0A6A6]">{error} <button type="button" className="underline" onClick={() => void loadRequest()}>Try again</button></div>}
          {notice && <p role="status" className="mt-4 text-[#E4D3A9]">{notice}</p>}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">What happens next?</h2>
          <p>Support will review your request and any outstanding orders, refunds, seller obligations and legal record-keeping requirements. They will contact you through the support ticket to explain the next steps and what data can be removed.</p>
          <p>You can also open <Link href="/support" className="text-[#DCC38E] underline">Customer Support</Link> directly to ask about a request. Never share your password, banking credentials or identity-document numbers in a ticket.</p>
          <p className="text-sm text-[#C4C7BE]">This is a manual request workflow, not a self-service account deletion feature. A final retention policy and public contact channel are still required before Google Play submission.</p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/privacy" className="rounded-xl border border-[#6E6E60] px-5 py-3">Privacy notice</Link>
          <Link href="/terms" className="rounded-xl border border-[#6E6E60] px-5 py-3">Marketplace terms</Link>
        </div>
      </article>
    </main>
  );
}
