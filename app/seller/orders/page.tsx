"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

type OrderItem = {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: string | number;
  image_url?: string | null;
};

type Shipment = { carrier: string; tracking_number: string; status: string };
type SellerOrder = {
  id: number;
  user_id: number;
  total_amount: string | number;
  status: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  items: OrderItem[];
  shipment?: Shipment | null;
};

type StatusFilter = "all" | "pending" | "processing" | "shipped" | "delivered" | "closed";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All orders" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "closed", label: "Cancelled / refunded" },
];

function normalizeStatus(value: string) {
  return String(value || "pending").trim().toLowerCase();
}

function nextStatus(status: string): { value: string; label: string } | null {
  switch (normalizeStatus(status)) {
    case "pending":
    case "paid":
    case "confirmed":
      return { value: "processing", label: "Start processing" };
    case "processing":
      return { value: "shipped", label: "Mark as shipped" };
    case "shipped":
      return { value: "delivered", label: "Mark as delivered" };
    default:
      return null;
  }
}

function isClosed(status: string) {
  return ["cancelled", "canceled", "refunded", "refund_pending", "refund_requested"].includes(normalizeStatus(status));
}

function badgeClass(status: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "delivered") return "border-orange-200 bg-orange-50 text-orange-800";
  if (normalized === "shipped") return "border-violet-200 bg-violet-50 text-violet-800";
  if (normalized === "processing") return "border-sky-200 bg-sky-50 text-sky-800";
  if (isClosed(normalized)) return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function money(value: string | number) {
  const amount = Number(value);
  return `$${(Number.isFinite(amount) ? amount : 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [trackingDrafts, setTrackingDrafts] = useState<Record<number, { carrier: string; trackingNumber: string; status: "dispatched" | "in_transit" }>>({});
  const [filter, setFilter] = useState<StatusFilter>("all");

  const loadOrders = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("goldmart_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const response = await fetch(`${API_URL}/api/orders/seller/all`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load your orders.");
      }
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load your orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const counts = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => ["pending", "paid", "confirmed"].includes(normalizeStatus(o.status))).length,
    active: orders.filter((o) => ["processing", "shipped"].includes(normalizeStatus(o.status))).length,
    delivered: orders.filter((o) => normalizeStatus(o.status) === "delivered").length,
  }), [orders]);

  const visibleOrders = useMemo(() => {
    const term = query.trim().toLowerCase();
    return orders.filter((order) => {
      const status = normalizeStatus(order.status);
      const matchesFilter = filter === "all" ||
        (filter === "pending" && ["pending", "paid", "confirmed"].includes(status)) ||
        (filter === "closed" && isClosed(status)) ||
        (filter !== "pending" && filter !== "closed" && status === filter);
      const matchesSearch = !term ||
        String(order.id).includes(term) ||
        String(order.customer_name || "").toLowerCase().includes(term) ||
        String(order.customer_email || "").toLowerCase().includes(term) ||
        (Array.isArray(order.items) ? order.items : []).some((item) =>
          String(item.product_name || "").toLowerCase().includes(term)
        );
      return matchesFilter && matchesSearch;
    }).sort((a, b) => {
      const first = new Date(a.created_at).getTime();
      const second = new Date(b.created_at).getTime();
      return (Number.isFinite(second) ? second : 0) - (Number.isFinite(first) ? first : 0);
    });
  }, [orders, query, filter]);

  async function saveShipment(order: SellerOrder) {
    const draft = trackingDrafts[order.id] || {
      carrier: order.shipment?.carrier || "",
      trackingNumber: order.shipment?.tracking_number || "",
      status: (order.shipment?.status === "in_transit" ? "in_transit" : "dispatched") as "dispatched" | "in_transit",
    };
    if (!draft.carrier.trim() || !draft.trackingNumber.trim()) {
      setActionError("Enter both the courier name and tracking number.");
      return;
    }
    const token = localStorage.getItem("goldmart_token");
    if (!token) { window.location.href = "/login"; return; }
    setUpdatingId(order.id);
    setActionError("");
    try {
      const response = await fetch(`${API_URL}/api/orders/seller/${order.id}/shipment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Could not save tracking.");
      await loadOrders(true);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not save tracking.");
    } finally { setUpdatingId(null); }
  }

  async function advanceStatus(order: SellerOrder) {
    const next = nextStatus(order.status);
    if (!next || updatingId !== null) return;
    const verb = next.value === "shipped" ? "mark as shipped" : next.value === "delivered" ? "mark as delivered" : "start processing";
    if (!window.confirm(`Do you want to ${verb} order #${order.id}? Only continue when the order is eligible and this step is accurate.`)) return;

    setActionError("");
    setUpdatingId(order.id);
    try {
      const token = localStorage.getItem("goldmart_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const response = await fetch(`${API_URL}/api/orders/seller/${order.id}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ status: next.value }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update the order status.");
      }
      // The backend remains authoritative, especially for paid/refund-protected orders.
      setOrders((previous) => previous.map((item) => item.id === order.id
        ? { ...item, status: String(data.order?.status || next.value) }
        : item));
      await loadOrders(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to update the order status.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#FFF8F2] pb-28 text-[#243B53] md:pb-14">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <section className="relative overflow-hidden rounded-[30px] px-6 py-9 text-white shadow-[0_18px_38px_rgba(24,51,62,0.16)] sm:px-10 sm:py-12" style={{background:"linear-gradient(135deg, #14263D 0%, #243B53 50%, #FF6B00 100%)"}}>
          <div className="pointer-events-none absolute -right-10 -top-20 h-60 w-60 rounded-full border-[32px] border-white/10" aria-hidden="true"/>
          <div className="relative"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FFE9CC]">GOLDMART SELLER STUDIO · Order Desk</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Every order in focus.</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/85">Keep customer orders organized and manage fulfillment with confidence.</p></div>
        </section>
        <nav aria-label="Seller Studio navigation" className="og-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2">
          <Link href="/seller" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Dashboard</Link>
          <Link href="/seller/products" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Catalogue</Link>
          <Link href="/seller/products/new" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Add Product</Link>
          <Link href="/seller/orders" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Orders</Link>
          <Link href="/seller/payment-protection" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Finance</Link>
          <Link href="/chat" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Messages</Link>
          <Link href="/account" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Account</Link>
        </nav>
      </div>

      <div className="h-1 bg-gradient-to-r from-[#243B53] via-[#FFF8F2] to-[#FF6B00]" />
      <header className="border-b border-[#FFF8F2] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-2xl font-black tracking-tight">Gold<span className="text-[#FF6B00]">Mart</span></Link>
          <Link href="/seller" className="rounded-full border border-[#FFF8F2] px-4 py-2.5 text-sm font-bold hover:border-[#FF6B00]">← Seller Dashboard</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-7 sm:px-6 sm:pt-10">
        <section className="relative overflow-hidden rounded-[28px] bg-[#243B53] p-6 text-white sm:p-9">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-60 w-60 rounded-full border border-[#FF6B00]/25" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFF8F2]">GoldMart · Seller Centre</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Customer Orders</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#FFF8F2]">Manage fulfilment, see customers and review the products in each order.</p>
          <button type="button" onClick={() => void loadOrders(true)} disabled={loading || refreshing || updatingId !== null} className="mt-6 rounded-full bg-[#FF6B00] px-5 py-3 text-sm font-extrabold text-[#14263D] disabled:opacity-60">
            {refreshing ? "Refreshing..." : "↻ Refresh Orders"}
          </button>
        </section>

        {!loading && !error && (
          <section aria-label="Order overview" className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "All orders", value: counts.total },
              { label: "Awaiting processing", value: counts.pending },
              { label: "In fulfilment", value: counts.active },
              { label: "Delivered", value: counts.delivered },
            ].map((item) => (
              <div key={item.label} className="rounded-[22px] border border-[#FFF8F2] bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold text-[#FF6B00]">{item.label}</p>
                <p className="mt-2 text-3xl font-black">{item.value}</p>
              </div>
            ))}
          </section>
        )}

        {error && <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><p className="font-bold">Unable to load orders</p><p className="mt-1">{error}</p><button type="button" className="mt-3 rounded-full bg-[#14263D] px-4 py-2 font-bold text-white" onClick={() => void loadOrders()}>Try Again</button></div>}
        {actionError && <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{actionError}</div>}

        {!loading && !error && orders.length > 0 && (
          <section className="mt-8 rounded-[22px] border border-[#FFF8F2] bg-white p-4 sm:p-5" aria-label="Find orders">
            <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
              <div>
                <label htmlFor="order-search" className="mb-2 block text-xs font-bold text-[#FF6B00]">Find an order</label>
                <input id="order-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Order number, customer or product" className="w-full rounded-xl border border-[#FFF8F2] bg-[#FFFFFF] px-4 py-3 text-sm outline-none focus:border-[#243B53]" />
              </div>
              <div>
                <label htmlFor="order-filter" className="mb-2 block text-xs font-bold text-[#FF6B00]">Filter status</label>
                <select id="order-filter" value={filter} onChange={(event) => setFilter(event.target.value as StatusFilter)} className="w-full rounded-xl border border-[#FFF8F2] bg-[#FFFFFF] px-4 py-3 text-sm outline-none focus:border-[#243B53]">
                  {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </div>
            <p className="mt-3 text-xs text-[#FF6B00]">Showing {visibleOrders.length} of {orders.length} orders · Newest first</p>
          </section>
        )}

        {loading && <div className="mt-8 animate-pulse rounded-[22px] border border-[#FFF8F2] bg-white p-10 text-center font-semibold text-[#FF6B00]">Loading your customer orders...</div>}

        {!loading && !error && orders.length === 0 && (
          <section className="mt-8 rounded-[26px] border border-[#FFF8F2] bg-white px-5 py-14 text-center">
            <p className="text-5xl">📭</p>
            <h2 className="mt-4 text-2xl font-black">No customer orders yet</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-[#FF6B00]">Orders containing your products will appear here when customers purchase them.</p>
            <Link href="/seller/products" className="mt-6 inline-flex rounded-full bg-[#14263D] px-6 py-3 text-sm font-bold text-white">Manage Products →</Link>
          </section>
        )}

        {!loading && !error && orders.length > 0 && visibleOrders.length === 0 && (
          <div className="mt-6 rounded-2xl border border-[#FFF8F2] bg-white p-8 text-center text-sm text-[#FF6B00]">No orders match your search or filter.</div>
        )}

        {!loading && !error && visibleOrders.length > 0 && (
          <section className="mt-6 space-y-5" aria-label="Seller orders">
            {visibleOrders.map((order) => {
              const next = nextStatus(order.status);
              const busy = updatingId === order.id;
              return (
                <article key={order.id} className="overflow-hidden rounded-[24px] border border-[#FFF8F2] bg-white shadow-[0_5px_20px_rgba(23,25,29,0.035)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#FFF8F2] p-5 sm:p-6">
                    <div>
                      <p className="text-lg font-black">Order #{order.id}</p>
                      <p className="mt-1 text-xs text-[#FF6B00]">{dateLabel(order.created_at)}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1.5 text-xs font-extrabold capitalize ${badgeClass(order.status)}`}>{normalizeStatus(order.status).replace(/_/g, " ")}</span>
                  </div>
                  <div className="p-5 sm:p-6">
                    <div className="rounded-2xl bg-[#FFFFFF] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#243B53]">Customer</p>
                      <p className="mt-2 font-bold">{order.customer_name || "GoldMart Customer"}</p>
                      <p className="mt-1 break-all text-sm text-[#FF6B00]">{order.customer_email || "No email provided"}</p>
                    </div>

                    <h3 className="mt-6 text-base font-black">Products in this order</h3>
                    <div className="mt-3 space-y-3">
                      {(Array.isArray(order.items) ? order.items : []).map((item) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-[#FFF8F2] p-3 sm:gap-4">
                          {item.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image_url} alt={item.product_name} className="h-16 w-16 shrink-0 rounded-xl bg-[#FFF8F2] object-cover" loading="lazy" />
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#FFF8F2] text-2xl">📦</div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold">{item.product_name}</p>
                            <p className="mt-1 text-xs text-[#FF6B00]">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-right text-sm font-black text-[#243B53]">{money(item.price)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#FFF8F2] pt-5">
                      <p className="text-sm font-bold text-[#FF6B00]">Order total</p>
                      <p className="text-xl font-black text-[#243B53]">{money(order.total_amount)}</p>
                    </div>
                    <p className="mt-1 text-right text-xs text-[#FF6B00]">As reported by the orders API; not a seller payout balance.</p>
                    {["shipped", "delivered"].includes(normalizeStatus(order.status)) && (
                      <div className="mt-5 rounded-2xl border border-[#5D584C] bg-[#1C211E] p-4 text-[#F5F3EC]">
                        <p className="font-bold text-[#E4D3A9]">Shipment tracking</p>
                        <p className="mt-1 text-xs text-[#B9BBB4]">Enter the actual courier and tracking number. This is seller-reported, not verified live carrier tracking.</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <input
                            aria-label={`Carrier for order ${order.id}`}
                            placeholder="Courier / carrier"
                            maxLength={100}
                            value={trackingDrafts[order.id]?.carrier ?? order.shipment?.carrier ?? ""}
                            onChange={(e) => setTrackingDrafts(prev => ({ ...prev, [order.id]: {
                              carrier: e.target.value,
                              trackingNumber: prev[order.id]?.trackingNumber ?? order.shipment?.tracking_number ?? "",
                              status: prev[order.id]?.status ?? (order.shipment?.status === "in_transit" ? "in_transit" : "dispatched"),
                            } }))}
                            className="rounded-xl border border-[#5D584C] bg-[#111514] px-3 py-2 text-white"
                          />
                          <input
                            aria-label={`Tracking number for order ${order.id}`}
                            placeholder="Tracking number"
                            maxLength={120}
                            value={trackingDrafts[order.id]?.trackingNumber ?? order.shipment?.tracking_number ?? ""}
                            onChange={(e) => setTrackingDrafts(prev => ({ ...prev, [order.id]: {
                              carrier: prev[order.id]?.carrier ?? order.shipment?.carrier ?? "",
                              trackingNumber: e.target.value,
                              status: prev[order.id]?.status ?? (order.shipment?.status === "in_transit" ? "in_transit" : "dispatched"),
                            } }))}
                            className="rounded-xl border border-[#5D584C] bg-[#111514] px-3 py-2 text-white"
                          />
                          <select
                            aria-label={`Tracking status for order ${order.id}`}
                            value={trackingDrafts[order.id]?.status ?? (order.shipment?.status === "in_transit" ? "in_transit" : "dispatched")}
                            onChange={(e) => setTrackingDrafts(prev => ({ ...prev, [order.id]: {
                              carrier: prev[order.id]?.carrier ?? order.shipment?.carrier ?? "",
                              trackingNumber: prev[order.id]?.trackingNumber ?? order.shipment?.tracking_number ?? "",
                              status: e.target.value as "dispatched" | "in_transit",
                            } }))}
                            className="rounded-xl border border-[#5D584C] bg-[#111514] px-3 py-2 text-white"
                          >
                            <option value="dispatched">Dispatched</option>
                            <option value="in_transit">In transit</option>
                          </select>
                          <button type="button" disabled={updatingId !== null} onClick={() => void saveShipment(order)}
                            className="rounded-xl bg-[#C8AB6D] px-4 py-2 font-bold text-black disabled:opacity-50">
                            {busy ? "Saving..." : "Save tracking"}
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#FFF8F2] bg-[#FFFFFF] p-4">
                      <div>
                        <p className="text-sm font-bold">Order fulfilment</p>
                        <p className="mt-1 text-xs text-[#FF6B00]">Progress is saved through GoldMart's backend.</p>
                      </div>
                      {next ? (
                        <button type="button" disabled={updatingId !== null || refreshing} onClick={() => void advanceStatus(order)} className="rounded-full bg-[#14263D] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#243B53] disabled:cursor-not-allowed disabled:opacity-50">
                          {busy ? "Saving..." : `${next.label} →`}
                        </button>
                      ) : (
                        <span className="rounded-full border border-[#FFF8F2] px-4 py-2 text-xs font-bold text-[#FF6B00]">{normalizeStatus(order.status) === "delivered" ? "Delivered" : isClosed(order.status) ? "No fulfilment changes" : "Contact support for status changes"}</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
        <p className="mt-8 text-center text-xs text-[#FF6B00]">GoldMart Seller Centre · Status changes remain subject to backend validation and refund protection.</p>
      </div>
    </main>
  );
}
