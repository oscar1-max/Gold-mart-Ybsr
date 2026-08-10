"use client";

import Link from "next/link";

export default function SellerDashboard() {
  return (
    <main className="min-h-screen bg-gray-50 text-black">

      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">

          <Link href="/" className="text-2xl font-black">
            Gold<span className="text-[#D4AF37]">Mart</span>
          </Link>

          <Link
            href="/"
            className="rounded-full border px-5 py-2 text-sm font-bold"
          >
            Back to Store
          </Link>

        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-4 py-10">

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

        {/* STATS */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border bg-white p-6">
            <div className="text-3xl">📦</div>

            <p className="mt-4 text-sm text-gray-500">
              Products
            </p>

            <h2 className="mt-1 text-3xl font-black">
              0
            </h2>
          </div>

          <div className="rounded-2xl border bg-white p-6">
            <div className="text-3xl">🛍️</div>

            <p className="mt-4 text-sm text-gray-500">
              Orders
            </p>

            <h2 className="mt-1 text-3xl font-black">
              0
            </h2>
          </div>

          <div className="rounded-2xl border bg-white p-6">
            <div className="text-3xl">💰</div>

            <p className="mt-4 text-sm text-gray-500">
              Sales
            </p>

            <h2 className="mt-1 text-3xl font-black">
              ₦0
            </h2>
          </div>

          <div className="rounded-2xl border bg-white p-6">
            <div className="text-3xl">⭐</div>

            <p className="mt-4 text-sm text-gray-500">
              Rating
            </p>

            <h2 className="mt-1 text-3xl font-black">
              —
            </h2>
          </div>

        </div>

        {/* ACTIONS */}
        <section className="mt-8">

          <h2 className="text-2xl font-black">
            Store Management
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <Link
              href="/seller/products"
              className="rounded-2xl border bg-white p-6 transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
            >
              <div className="text-4xl">📦</div>

              <h3 className="mt-4 text-lg font-black">
                My Products
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                View and manage products in your store.
              </p>
            </Link>

            <Link
              href="/seller/products/new"
              className="rounded-2xl border bg-white p-6 transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
            >
              <div className="text-4xl">➕</div>

              <h3 className="mt-4 text-lg font-black">
                Add Product
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Add a new product to your GoldMart store.
              </p>
            </Link>

            <Link
              href="/seller/orders"
              className="rounded-2xl border bg-white p-6 transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
            >
              <div className="text-4xl">🚚</div>

              <h3 className="mt-4 text-lg font-black">
                Orders
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                View and manage customer orders.
              </p>
            </Link>

          </div>

        </section>

        {/* SELLER NOTICE */}
        <section className="mt-8 rounded-3xl bg-black p-8 text-white">

          <p className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]">
            GoldMart Seller
          </p>

          <h2 className="mt-3 text-2xl font-black">
            Start building your store
          </h2>

          <p className="mt-3 max-w-2xl text-gray-400">
            Add products, manage your inventory and prepare your
            store for customers. Seller authentication and the
            database will be connected when we build the backend.
          </p>

          <Link
            href="/seller/products/new"
            className="mt-6 inline-block rounded-full bg-[#D4AF37] px-7 py-3 font-bold text-black"
          >
            Add Your First Product
          </Link>

        </section>

      </div>
    </main>
  );
}
