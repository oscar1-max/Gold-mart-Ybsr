"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

type Item = {
  id: number;
  product_id: number;
  name?: string | null;
  image_url?: string | null;
  quantity: number;
  price: string | number;
  currency?: string | null;
};
type Order = {
  id: number;
  total_amount: string | number;
  status: string;
  created_at: string;
};
type Shipment = { seller_id: number; carrier: string; tracking_number: string; status: string; updated_at: string };
type OrderResponse = {
  success?: boolean;
  message?: string;
  order?: Order;
  items?: Item[];
  shipments?: Shipment[];
};

const steps = ["pending", "processing", "shipped", "delivered"] as const;

function money(value: string | number, currency?: string | null) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Amount unavailable";
  const normalized = String(currency || "").toUpperCase();
  if (!["USD", "NGN"].includes(normalized)) {
    return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " (currency unavailable)";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalized,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const orderId = String(params.id || "");
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setNeedsLogin(false);
    if (!/^[1-9]\d*$/.test(orderId)) {
      setError("This order link is invalid.");
      setLoading(false);
      return;
    }
    const token = localStorage.getItem("goldmart_token");
    if (!token) {
      setNeedsLogin(true);
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/orders/${encodeURIComponent(orderId)}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({}))) as OrderResponse;
      if (response.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (!response.ok || !data.success || !data.order || !Array.isArray(data.items)) {
        throw new Error(data.message || "We could not load this order.");
      }
      setOrder(data.order);
      setItems(data.items);
      setShipments(Array.isArray(data.shipments) ? data.shipments : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not load this order.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { void load(); }, [load]);

  const status = String(order?.status || "").toLowerCase();
  const currentStep = steps.indexOf(status as (typeof steps)[number]);
  const currency = items[0]?.currency || null;
  const date = order ? new Date(order.created_at) : null;

  return (
    <main className="min-h-screen bg-[#111514] px-4 pb-28 pt-8 text-[#F5F3EC] md:pb-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C8AB6D]">GoldMart · Your purchase</p>
            <h1 className="mt-2 text-3xl font-bold">Order details</h1>
          </div>
          <Link href="/orders" className="rounded-xl border border-[#5D584C] px-4 py-2 text-sm hover:bg-white/10">← My orders</Link>
        </div>

        {loading && <p role="status" className="rounded-2xl border border-[#393B36] p-6">Loading your order…</p>}
        {needsLogin && (
          <div className="rounded-2xl border border-[#48483F] p-6">
            <p>Please sign in to view your own order.</p>
            <Link href="/login" className="mt-4 inline-block rounded-xl bg-[#C8AB6D] px-5 py-3 font-bold text-black">Sign in</Link>
          </div>
        )}
        {error && !loading && !needsLogin && (
          <div role="alert" className="rounded-2xl border border-[#A96363] p-6">
            <p>{error}</p>
            <button type="button" onClick={() => void load()} className="mt-4 rounded-xl border border-[#C8AB6D] px-4 py-2">Try again</button>
          </div>
        )}

        {order && !loading && !needsLogin && !error && (
          <div className="space-y-5">
            <section className="rounded-2xl border border-[#393B36] bg-[#1C211E] p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Order #{order.id}</h2>
                  <p className="mt-2 text-sm text-[#BABCB4]">Placed {date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) : "date unavailable"}</p>
                </div>
                <span className="rounded-full border border-[#C8AB6D] px-4 py-2 text-sm font-semibold capitalize text-[#E4D3A9]">{status.replace(/_/g, " ")}</span>
              </div>
              <h3 className="mt-7 font-semibold">Recorded order progress</h3>
              {currentStep >= 0 ? (
                <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {steps.map((step, index) => (
                    <li key={step} className={`rounded-xl border p-3 text-sm capitalize ${index <= currentStep ? "border-[#C8AB6D] text-[#F5F3EC]" : "border-[#424540] text-[#888F87]"}`}>
                      <span aria-hidden="true">{index <= currentStep ? "✓ " : "○ "}</span>{step}
                    </li>
                  ))}
                </ol>
              ) : <p className="mt-3 text-sm text-[#BABCB4]">Current recorded status: {status || "unavailable"}. See My Orders or contact support for help.</p>}
              <p className="mt-4 text-xs text-[#B9BBB4]">These are GoldMart's recorded statuses, not live courier GPS tracking or a delivery-time guarantee.</p>
            </section>

            <section className="rounded-2xl border border-[#393B36] bg-[#1C211E] p-6">
              <h2 className="text-lg font-bold">Items in this order</h2>
              <div className="mt-5 divide-y divide-[#383C36]">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-4 py-4">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name || "Ordered product"} className="h-16 w-16 rounded-lg object-cover" />
                    ) : <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#303630]" aria-hidden="true">📦</div>}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{item.name || "Product details unavailable"}</p>
                      <p className="mt-1 text-sm text-[#BABCB4]">Quantity: {item.quantity}</p>
                    </div>
                    <p className="text-right font-semibold text-[#E4D3A9]">{money(Number(item.price) * Number(item.quantity), item.currency)}</p>
                  </div>
                ))}
                {items.length === 0 && <p className="py-4 text-[#BABCB4]">No product details are available for this order. Contact support.</p>}
              </div>
              <div className="mt-5 flex flex-wrap justify-between gap-3 border-t border-[#424540] pt-5">
                <span className="font-semibold">Recorded order total</span>
                <span className="text-xl font-bold text-[#E4D3A9]">{money(order.total_amount, currency)}</span>
              </div>
            </section>

            <section className="rounded-2xl border border-[#393B36] bg-[#1C211E] p-6">
              <h2 className="text-lg font-bold">Delivery and buyer protection</h2>
              <p className="mt-2 text-sm leading-6 text-[#BABCB4]">Seller-reported tracking appears below when provided. This is not a live courier feed, and no delivery date is guaranteed.</p>
              {shipments.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {shipments.map((shipment) => (
                    <div key={shipment.seller_id} className="rounded-xl border border-[#5D584C] bg-[#151A18] p-4">
                      <p className="font-semibold">Carrier: {shipment.carrier}</p>
                      <p className="mt-1 break-all text-sm">Tracking number: {shipment.tracking_number}</p>
                      <p className="mt-1 text-sm capitalize text-[#BABCB4]">Seller-reported status: {shipment.status.replace(/_/g, " ")}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-3 text-sm text-[#BABCB4]">No shipment tracking information has been provided yet.</p>}
              <p className="mt-3 text-sm leading-6 text-[#BABCB4]">Confirm receipt only after your package arrives and you have checked it. Refund or cancellation requests are reviewed through Buyer Protection.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/orders" className="rounded-xl bg-[#C8AB6D] px-5 py-3 text-sm font-bold text-black">Confirm delivery / view protection</Link>
                <Link href="/track-order" className="rounded-xl border border-[#5D584C] px-5 py-3 text-sm">Track recorded status</Link>
                <Link href="/support" className="rounded-xl border border-[#5D584C] px-5 py-3 text-sm">Contact support</Link>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
