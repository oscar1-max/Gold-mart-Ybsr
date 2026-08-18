"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

type OrderItem = {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: string | number;
  image_url?: string | null;
};

type SellerOrder = {
  id: number;
  user_id: number;
  total_amount: string | number;
  status: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  items: OrderItem[];
};

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("goldmart_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/orders/seller/all`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load seller orders."
        );
      }

      setOrders(
        Array.isArray(data.orders)
          ? data.orders
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load seller orders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateStatus(
    orderId: number,
    status: string
  ) {
    try {
      const token = localStorage.getItem("goldmart_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/orders/seller/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update order."
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: data.order.status,
              }
            : order
        )
      );
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to update order."
      );
    }
  }

  function formatPrice(price: string | number) {
    const amount = Number(price);

    if (!Number.isFinite(amount)) {
      return "$0.00";
    }

    return `$${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  }

  function statusClass(status: string) {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-700";

      case "shipped":
        return "bg-purple-100 text-purple-700";

      case "processing":
        return "bg-blue-100 text-blue-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 text-black">

      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">

          <Link
            href="/seller"
            className="text-2xl font-black"
          >
            Gold
            <span className="text-[#D4AF37]">
              Mart
            </span>
          </Link>

          <Link
            href="/seller"
            className="rounded-full border px-5 py-2 text-sm font-bold transition hover:bg-gray-100"
          >
            ← Seller Dashboard
          </Link>

        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-4 py-10">

        {/* TITLE */}
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
            Seller Center
          </p>

          <h1 className="mt-1 text-3xl font-black sm:text-4xl">
            Customer Orders
          </h1>

          <p className="mt-3 text-gray-500">
            View and manage orders containing your products.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-bold">
              Something went wrong
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>

            <button
              onClick={loadOrders}
              className="mt-4 rounded-full bg-black px-5 py-2 text-sm font-bold text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="mt-8 rounded-3xl border bg-white p-10 text-center shadow-sm">

            <div className="text-5xl">
              📦
            </div>

            <p className="mt-4 font-bold">
              Loading customer orders...
            </p>

          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && orders.length === 0 && (
          <div className="mt-8 rounded-3xl border bg-white p-10 text-center shadow-sm">

            <div className="text-6xl">
              📭
            </div>

            <h2 className="mt-5 text-2xl font-black">
              No customer orders yet
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-gray-500">
              When a customer purchases one of your products,
              the order will appear here automatically.
            </p>

            <Link
              href="/seller/products/new"
              className="mt-6 inline-block rounded-full bg-black px-7 py-3 font-bold text-white transition hover:bg-[#D4AF37] hover:text-black"
            >
              Add Product
            </Link>

          </div>
        )}

        {/* ORDERS */}
        {!loading && !error && orders.length > 0 && (
          <div className="mt-8 space-y-6">

            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-3xl border bg-white p-6 shadow-sm"
              >

                {/* ORDER HEADER */}
                <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <p className="text-sm font-bold text-[#A67C00]">
                      Order #{order.id}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">

                    <span
                      className={`rounded-full px-4 py-2 text-xs font-bold capitalize ${statusClass(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>

                    <select
                      value={order.status}
                      onChange={(event) =>
                        updateStatus(
                          order.id,
                          event.target.value
                        )
                      }
                      className="rounded-xl border px-3 py-2 text-sm font-bold outline-none"
                    >
                      <option value="pending">
                        Pending
                      </option>

                      <option value="processing">
                        Processing
                      </option>

                      <option value="shipped">
                        Shipped
                      </option>

                      <option value="delivered">
                        Delivered
                      </option>

                      <option value="cancelled">
                        Cancelled
                      </option>
                    </select>

                  </div>

                </div>

                {/* CUSTOMER */}
                <div className="mt-6 rounded-2xl bg-gray-50 p-5">

                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Customer
                  </p>

                  <p className="mt-2 font-black">
                    {order.customer_name}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {order.customer_email}
                  </p>

                </div>

                {/* PRODUCTS */}
                <div className="mt-6">

                  <h2 className="text-lg font-black">
                    Products
                  </h2>

                  <div className="mt-4 space-y-4">

                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                      >

                        <div className="flex items-center gap-4">

                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.product_name}
                              className="h-16 w-16 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                              📦
                            </div>
                          )}

                          <div>
                            <h3 className="font-black">
                              {item.product_name}
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                              Quantity: {item.quantity}
                            </p>
                          </div>

                        </div>

                        <p className="font-black text-[#A67C00]">
                          {formatPrice(item.price)}
                        </p>

                      </div>
                    ))}

                  </div>

                </div>

                {/* TOTAL */}
                <div className="mt-6 flex items-center justify-between border-t pt-5">

                  <p className="font-bold text-gray-500">
                    Order Total
                  </p>

                  <p className="text-2xl font-black text-[#A67C00]">
                    {formatPrice(order.total_amount)}
                  </p>

                </div>

              </article>
            ))}

          </div>
        )}

      </div>
    </main>
  );
    }
