"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
const API = "https://goldmart-backend-yoxc.onrender.com/api/withdrawals";
type Withdrawal = { id: number; order_id: number; seller_name: string; seller_email: string; seller_id: number; currency: string; amount_minor: string; status: string; decision_reason: string; decision_source: string; order_status: string; created_at: string; updated_at: string; };
const money = (w: Withdrawal) => {
  const amount = Number(w.amount_minor) / 100;
  return Number.isFinite(amount) ? new Intl.NumberFormat("en-US", { style: "currency", currency: w.currency === "NGN" ? "NGN" : "USD" }).format(amount) : "Unavailable";
};
export default function AdminWithdrawalsPage() {
  const [rows, setRows] = useState<Withdrawal[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number,string>>({});
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const token = localStorage.getItem("goldmart_token");
    if (!token) { setError("Log in as the GoldMart admin first."); setLoading(false); return; }
    try {
      const res = await fetch(API + "/admin", { headers: { Authorization: "Bearer " + token }, cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Unable to load withdrawal requests.");
      setRows(Array.isArray(data.withdrawals) ? data.withdrawals : []);
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load requests."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function decide(id: number, action: "approve" | "hold" | "reject") {
    const note = (notes[id] || "").trim();
    if (action !== "approve" && (note.length < 8 || note.length > 500)) {
      setError("Enter a reason of 8–500 characters before holding or rejecting."); return;
    }
    if (!window.confirm(action === "approve" ? "Approve this TEST request? No bank transfer will occur." : "Confirm " + action + " for request #" + id + "?")) return;
    const token = localStorage.getItem("goldmart_token");
    if (!token) { setError("Admin login required."); return; }
    setBusy(id); setError(""); setMessage("");
    try {
      const res = await fetch(API + "/admin/" + id + "/decision", {
        method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ action, note })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Unable to save decision.");
      setMessage("Test decision saved. No real payout was sent.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Decision failed."); }
    finally { setBusy(null); }
  }
  const visible = filter === "all" ? rows : rows.filter(w => w.status === filter);
  return (
    <main className="min-h-screen bg-[#141414] px-4 py-8 text-[#F6F3EA] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C8AB6D]">GoldMart admin · test mode</p>
            <h1 className="mt-2 text-3xl font-bold">Withdrawal reviews</h1>
            <p className="mt-2 text-sm text-[#B9B9B9]">Automatic safety checks, manual holds, decisions and request history. No real money is sent.</p></div>
          <div className="flex gap-2"><Link href="/admin" className="rounded-xl border border-[#454545] px-4 py-2 text-sm">Admin overview</Link>
            <button onClick={() => { setLoading(true); void load(); }} className="rounded-xl bg-[#C8AB6D] px-4 py-2 text-sm font-bold text-black">Refresh</button></div>
        </div>
        {error && <p role="alert" className="mb-4 rounded-xl border border-red-800 p-4 text-red-200">{error}</p>}
        {message && <p role="status" className="mb-4 rounded-xl border border-[#C8AB6D] p-4">{message}</p>}
        <div className="mb-5 flex flex-wrap gap-2">{["all","pending_review","approved_test","rejected"].map(status =>
          <button key={status} onClick={() => setFilter(status)} aria-pressed={filter === status}
            className={"rounded-full border px-4 py-2 text-xs font-semibold " + (filter === status ? "border-[#C8AB6D] bg-[#C8AB6D] text-black" : "border-[#484848] text-[#DDD]")}>
            {status === "all" ? "All" : status.replace(/_/g," ")} ({status === "all" ? rows.length : rows.filter(w => w.status === status).length})
          </button>)}</div>
        {loading ? <p>Loading review queue…</p> : visible.length === 0 ? <p className="rounded-2xl border border-[#333] p-8 text-[#BBB]">No requests in this section yet.</p> :
          <div className="grid gap-4">{visible.map(w => <article key={w.id} className="rounded-2xl border border-[#383838] bg-[#202020] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs text-[#C8AB6D]">Request #{w.id} · Order #{w.order_id}</p>
                <h2 className="mt-1 text-xl font-bold">{money(w)}</h2>
                <p className="mt-1 text-sm text-[#DDD]">{w.seller_name || "Seller"} · {w.seller_email || "No email"}</p>
                <p className="mt-1 text-xs text-[#AAA]">Order: {w.order_status} · Requested: {new Date(w.created_at).toLocaleString()}</p></div>
              <span className="rounded-full border border-[#6E6046] px-3 py-1 text-xs font-semibold text-[#E1C68C]">{w.status.replace(/_/g," ")}</span>
            </div>
            <p className="mt-4 text-sm text-[#D2D2D2]">{w.decision_reason}</p>
            <p className="mt-1 text-xs text-[#999]">Reviewed by: {w.decision_source.replace(/_/g," ")}</p>
            {w.status !== "rejected" && <div className="mt-5 space-y-3 border-t border-[#383838] pt-4">
              <label htmlFor={"note-" + w.id} className="block text-xs font-semibold">Reason for hold or rejection</label>
              <textarea id={"note-" + w.id} maxLength={500} value={notes[w.id] || ""} onChange={e => setNotes(prev => ({...prev,[w.id]:e.target.value}))}
                placeholder="Explain the concern (at least 8 characters)" rows={2} className="w-full rounded-xl border border-[#555] bg-[#151515] p-3 text-sm text-white"/>
              <div className="flex flex-wrap gap-2">
                <button disabled={busy !== null} onClick={() => void decide(w.id,"approve")} className="rounded-xl bg-[#C8AB6D] px-4 py-2 text-sm font-bold text-black disabled:opacity-50">Approve test</button>
                <button disabled={busy !== null} onClick={() => void decide(w.id,"hold")} className="rounded-xl border border-[#C8AB6D] px-4 py-2 text-sm disabled:opacity-50">Hold pending</button>
                <button disabled={busy !== null} onClick={() => void decide(w.id,"reject")} className="rounded-xl border border-red-700 px-4 py-2 text-sm text-red-200 disabled:opacity-50">Reject</button>
              </div>
            </div>}
          </article>)}</div>}
        <p className="mt-8 text-xs text-[#999]">Approved test requests are simulations only. Actual seller transfers require separate business approval and payout integration.</p>
      </div>
    </main>
  );
}
