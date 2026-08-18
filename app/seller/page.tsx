"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

type Product = {
  id: number;
  name: string;
  price: string | number;
  currency?: string | null;
  stock: number;
  image_url?: string | null;
};

type SellerStats = {
  products: number;
  orders: number;
  sales: string | number;
};

export default function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<SellerStats>({
    products: 0,
    orders: 0,
    sales: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const token = localStorage.getItem("goldmart_token");

        if (!token) {
          window.location.href = "/login";
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        };

        const [productsResponse, statsResponse] =
          await Promise.all([
            fetch(`${API_URL}/api/seller/products`, {
              headers,
              cache: "no-store",
            }),

            fetch(`${API_URL}/api/seller/stats`, {
              headers,
              cache: "no-store",
            }),
          ]);

        const productsData =
          await productsResponse.json();

        const statsData =
          await statsResponse.json();

        if (
          !productsResponse.ok ||
          !productsData.success
        ) {
          throw new Error(
            productsData.message ||
              "Failed to load seller products."
          );
        }

        if (
          !statsResponse.ok ||
          !statsData.success
        ) {
          throw new Error(
            statsData.message ||
              "Failed to load seller statistics."
          );
        }

        setProducts(
          Array.isArray(productsData.products)
            ? productsData.products
            : []
        );

        setStats({
          products:
            Number(statsData.stats?.products) || 0,

          orders:
            Number(statsData.stats?.orders) || 0,

          sales:
            Number(statsData.stats?.sales) || 0,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load seller dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  function formatPrice(
    price: string | number,
    currency?: string | null
  ) {
    const amount = Number(price);

    if (!Number.isFinite(amount)) {
      return "$0.00";
    }

    const formatted = amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    switch (currency) {
      case "USD":
        return `$${formatted}`;

      case "EUR":
        return `€${formatted}`;

      case "GBP":
        return `£${formatted}`;

      case "NGN":
        return `₦${formatted}`;

      default:
        return `$${formatted}`;
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 text-black">

      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">

          <Link
            href="/"
            className="text-2xl font-black"
          >
            Gold
            <span className="text-[#D4AF37]">
              Mart
            </span>
          </Link>

          <Link
            href="/"
            className="rounded-full border px-5 py-2 text-sm font-bold transition hover:bg-gray-100"
          >
            🛍️ Buyer Store
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
            Seller Dashboard
          </h1>

          <p className="mt-3 text-gray-500">
            Manage your GoldMart store, products and orders.
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
          </div>
        )}

        {/* STATS */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* PRODUCTS */}
          <div className="rounded-2xl border bg-white p-6">

            <div className="text-3xl">
              📦
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Products
            </p>

            <h2 className="mt-1 text-3xl font-black">
              {loading ? "..." : stats.products}
            </h2>

          </div>

          {/* ORDERS */}
          <Link
            href="/seller/orders"
            className="rounded-2xl border bg-white p-6 transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-md"
          >

            <div className="text-3xl">
              🛍️
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Orders
            </p>

            <h2 className="mt-1 text-3xl font-black">
              {loading ? "..." : stats.orders}
            </h2>

            <p className="mt-2 text-xs font-bold text-[#A67C00]">
              View Orders →
            </p>

          </Link>

          {/* SALES */}
          <div className="rounded-2xl border bg-white p-6">

            <div className="text-3xl">
              💰
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Sales
            </p>

            <h2 className="mt-1 text-3xl font-black">
              {loading
                ? "..."
                : `₦${Number(
                    stats.sales
                  ).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
            </h2>

            <p className="mt-2 text-xs text-gray-400">
              Total completed/non-cancelled sales
            </p>

          </div>

          {/* RATING */}
          <div className="rounded-2xl border bg-white p-6">

            <div className="text-3xl">
              ⭐
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Rating
            </p>

            <h2 className="mt-1 text-3xl font-black">
              —
            </h2>

            <p className="mt-2 text-xs text-gray-400">
              Reviews coming next
            </p>

          </div>

        </div>

        {/* STORE MANAGEMENT */}
        <section className="mt-10">

          <h2 className="text-2xl font-black">
            Store Management
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* PRODUCTS */}
            <Link
              href="/seller/products"
              className="rounded-2xl border bg-white p-6 transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
            >

              <div className="text-4xl">
                📦
              </div>

              <h3 className="mt-4 text-lg font-black">
                My Products
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                View, edit and manage your products.
              </p>

            </Link>

            {/* ADD PRODUCT */}
            <Link
              href="/seller/products/new"
              className="rounded-2xl border bg-white p-6 transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
            >

              <div className="text-4xl">
                ➕
              </div>

              <h3 className="mt-4 text-lg font-black">
                Add Product
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Add a new product to your GoldMart store.
              </p>

            </Link>

            {/* ORDERS */}
            <Link
              href="/seller/orders"
              className="rounded-2xl border bg-white p-6 transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
            >

              <div className="text-4xl">
                🚚
              </div>

              <h3 className="mt-4 text-lg font-black">
                Orders
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                View and manage customer orders.
              </p>

            </Link>

          </div>

        </section>

        {/* PRODUCTS */}
        <section className="mt-10">

          <div className="flex items-center justify-between">

            <h2 className="text-2xl font-black">
              Your Products
            </h2>

            <Link
              href="/seller/products"
              className="font-bold text-[#A67C00] hover:text-black"
            >
              View All →
            </Link>

          </div>

          {/* LOADING */}
          {loading && (
            <div className="mt-5 rounded-2xl border bg-white p-8 text-center">

              <div className="text-4xl">
                📦
              </div>

              <p className="mt-3 font-bold">
                Loading your products...
              </p>

            </div>
          )}

          {/* EMPTY */}
          {!loading &&
            !error &&
            products.length === 0 && (
              <div className="mt-5 rounded-2xl border bg-white p-8 text-center">

                <div className="text-5xl">
                  📦
                </div>

                <h3 className="mt-4 text-xl font-black">
                  No products yet
                </h3>

                <p className="mt-2 text-gray-500">
                  Add your first product to start selling.
                </p>

                <Link
                  href="/seller/products/new"
                  className="mt-5 inline-block rounded-full bg-black px-6 py-3 font-bold text-white transition hover:bg-[#D4AF37] hover:text-black"
                >
                  Add Product
                </Link>

              </div>
            )}

          {/* PRODUCT LIST */}
          {!loading &&
            !error &&
            products.length > 0 && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                {products
                  .slice(0, 4)
                  .map((product) => (
                    <article
                      key={product.id}
                      className="overflow-hidden rounded-2xl border bg-white"
                    >

                      {/* IMAGE */}
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-48 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-48 items-center justify-center bg-gray-100 text-5xl">
                          📦
                        </div>
                      )}

                      <div className="p-4">

                        <h3 className="truncate font-black">
                          {product.name}
                        </h3>

                        <p className="mt-1 font-bold text-[#A67C00]">
                          {formatPrice(
                            product.price,
                            product.currency
                          )}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Stock: {product.stock}
                        </p>

                        <Link
                          href={`/seller/products/${product.id}/edit`}
                          className="mt-4 block rounded-xl border px-4 py-2 text-center text-sm font-bold transition hover:bg-gray-100"
                        >
                          Edit Product
                        </Link>

                      </div>

                    </article>
                  ))}

              </div>
            )}

        </section>

        {/* SELLER NOTICE */}
        <section className="mt-10 rounded-3xl bg-black p-8 text-white">

          <p className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]">
            GoldMart Seller
          </p>

          <h2 className="mt-3 text-2xl font-black">
            Build your store
          </h2>

          <p className="mt-3 max-w-2xl text-gray-400">
            Add products, manage your inventory and prepare
            your store for customers.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">

            <Link
              href="/seller/products/new"
              className="rounded-full bg-[#D4AF37] px-7 py-3 text-center font-bold text-black"
            >
              Add Product
            </Link>

            <Link
              href="/seller/products"
              className="rounded-full border border-white px-7 py-3 text-center font-bold text-white"
            >
              Manage Products
            </Link>

          </div>

        </section>

      </div>
    </main>
  );
          }
