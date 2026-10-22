"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const API_URL = "https://goldmart-backend-yoxc.onrender.com/api";

type OrderItem = {
  id: number;
  product_id: number;
  name?: string | null;
  quantity: number;
  price: number | string;
  currency?: string | null;
  seller_id?: number | null;
};

type BuyerOrder = {
  id: number;
  status: string;
  total_amount: number | string;
  created_at: string;
  currency?: string | null;
};

type OrderResult = {
  success?: boolean;
  message?: string;
  order?: BuyerOrder;
  items?: OrderItem[];
};

const stages = ["pending", "processing", "shipped", "delivered"];

function money(amount: number, currency: string) {
  if (!Number.isFinite(amount)) return "Amount unavailable";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return currency + " " + amount.toFixed(2);
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

export default function OrderDetailsPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const [order, setOrder] = useState<BuyerOrder | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  const retry = useCallback(() => setReload(value => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const token = localStorage.getItem("goldmart_token");
      if (!token) {
        window.location.assign("/login");
        return;
      }
      if (!/^[1-9][0-9]*$/.test(id)) {
        setError("Invalid order number.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const response = await fetch(API_URL + "/orders/" + encodeURIComponent(id), {
          headers: { Authorization: "Bearer " + token, Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json()) as OrderResult;
        if (!response.ok || !data.success || !data.order) {
          throw new Error(data.message || "Could not load this order.");
        }
        if (!controller.signal.aborted) {
          setOrder(data.order);
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setOrder(null);
          setError(err instanceof Error ? err.message : "Order details are unavailable.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [id, reload]);

  const currency = String(order?.currency || items[0]?.currency || "USD").toUpperCase();
  const status = String(order?.status || "").toLowerCase();
  const currentIndex = stages.indexOf(status);
  const interrupted = ["cancelled", "refunded", "refund_pending"].includes(status);

  return (
    <main className="min-h-screen bg-[#FAF8F3] px-4 py-8 text-[#17191D]">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/orders" className="text-sm font-bold text-[#96713D]">← All Orders</Link>
          <Link href="/" className="text-xl font-black">Gold<span className="text-[#B08A50]">Mart</span></Link>
        </div>
        {loading ? (
          <p className="mt-12 rounded-2xl bg-white p-8" role="status">Loading your order...</p>
        ) : error ? (
          <section className="mt-8 rounded-2xl border border-red-200 bg-white p-8">
            <h1 className="text-2xl font-bold">Order unavailable</h1>
            <p className="mt-3 text-red-700" role="alert">{error}</p>
            <button type="button" onClick={retry} className="mt-5 rounded-full bg-black px-5 py-3 font-bold text-white">Retry</button>
          </section>
        ) : order ? (
          <>
            <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#96713D]">Your purchase</p>
                <h1 className="mt-2 text-3xl font-black">Order #{order.id}</h1>
                <p className="mt-2 text-sm text-gray-600">Placed {formatDate(order.created_at)}</p>
              </div>
              <span className="rounded-full bg-white px-5 py-2 text-sm font-bold capitalize shadow-sm">
                {status.replace(/_/g, " ")}
              </span>
            </div>
            <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold">Delivery progress</h2>
              {interrupted ? (
                <p className="mt-4 rounded-xl bg-amber-50 p-4 text-amber-900">
                  This order is {status.replace(/_/g, " ")}. Check buyer protection for the latest request status.
                </p>
              ) : (
                <ol className="mt-6 grid gap-3 sm:grid-cols-4">
                  {stages.map((stage, index) => (
                    <li key={stage} className={"rounded-xl border p-4 " + (currentIndex >= index ? "border-[#B08A50] bg-[#FAF4E7]" : "border-gray-200")}>
                      <span className="text-lg" aria-hidden="true">{currentIndex >= index ? "✓" : "○"}</span>
                      <p className="mt-1 text-sm font-bold capitalize">{stage === "pending" ? "Order placed" : stage}</p>
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-5 text-sm text-gray-600">
                These updates are based on seller-reported order status. Courier location and delivery estimates are not yet provided.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/track-order" className="rounded-full bg-[#17191D] px-5 py-3 text-sm font-bold text-white">Track orders</Link>
                <Link href="/order-protection" className="rounded-full border px-5 py-3 text-sm font-bold">Buyer protection</Link>
                <button type="button" onClick={retry} className="rounded-full border px-5 py-3 text-sm font-bold">Refresh status</button>
              </div>
            </section>
            <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold">Items purchased</h2>
              {items.length === 0 ? (
                <p className="mt-4 text-gray-600">No item details were returned for this order.</p>
              ) : (
                <ul className="mt-4 divide-y">
                  {items.map(item => (
                    <li key={item.id} className="flex items-center justify-between gap-4 py-5">
                      <div>
                        <Link href={"/product/" + item.product_id} className="font-bold hover:underline">
                          {item.name || "Product #" + item.product_id}
                        </Link>
                        <p className="mt-1 text-sm text-gray-600">Qty {item.quantity}</p>
                      </div>
                      <p className="font-bold">
                        {money(Number(item.price) * Number(item.quantity), String(item.currency || currency).toUpperCase())}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex justify-between border-t pt-5 text-lg font-black">
                <span>Order total</span>
                <span>{money(Number(order.total_amount), currency)}</span>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
