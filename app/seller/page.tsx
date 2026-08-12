"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  image_url?: string | null;
};

export default function SellerDashboard() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSellerProducts() {
      try {
        const token = localStorage.getItem("goldmart_token");

        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(
          `${API_URL}/api/seller/products`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load seller products."
          );
        }

        setProducts(data.products || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load seller products."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSellerProducts();
  }, [router]);

  const productCount = products.length;

  return (
    <main className="min-h-screen bg-gray-50 text-black">

      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">

          <Link
            href="/"
            className="text-2xl font-black"
          >
            Gold<span className="text-[#D4AF37]">Mart</span>
          </Link>

          <div className="flex items-center gap-3">

            {/* BUYER STORE */}
            <Link
              href="/"
              className="rounded-full border px-5 py-2 text-sm font-bold transition hover:bg-gray-100"
            >
              🛍️ Buyer Store
            </Link>

          </div>

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
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
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
              {loading ? "..." : productCount}
            </h2>

          </div>

          {/* ORDERS */}
          <div className="rounded-2xl border bg-white p-6">

            <div className="text-3xl">
              🛍️
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Orders
            </p>

            <h2 className="mt-1 text-3xl font-black">
              0
            </h2>

          </div>

          {/* SALES */}
          <div className="rounded-2xl border bg-white p-6">

            <div className="text-3xl">
              💰
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Sales
            </p>

            <h2 className="mt-1 text-3xl font-black">
              ₦0
            </h2>

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

          </div>

        </div>

        {/* ACTIONS */}
        <section className="mt-8">

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
                View and manage products in your store.
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

        {/* CURRENT PRODUCTS */}
        <section className="mt-8">

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

          {loading ? (
            <div className="mt-5 rounded-2xl border bg-white p-8 text-center text-gray-500">
              Loading your products...
            </div>
          ) : products.length === 0 ? (
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
                className="mt-5 inline-block rounded-full bg-black px-6 py-3 font-bold text-white hover:bg-[#D4AF37] hover:text-black"
              >
                Add Product
              </Link>

            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {products.slice(0, 4).map((product) => (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-2xl border bg-white"
                >

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

                    <h3 className="font-black">
                      {product.name}
                    </h3>

                    <p className="mt-1 font-bold text-[#A67C00]">
                      ₦{Number(product.price).toLocaleString()}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Stock: {product.stock}
                    </p>

                  </div>

                </div>
              ))}

            </div>
          )}

        </section>

        {/* SELLER NOTICE */}
        <section className="mt-8 rounded-3xl bg-black p-8 text-white">

          <p className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]">
            GoldMart Seller
          </p>

          <h2 className="mt-3 text-2xl font-black">
            Build your store
          </h2>

          <p className="mt-3 max-w-2xl text-gray-400">
            Add products, manage your inventory and prepare your
            store for customers.
          </p>

          <Link
            href="/seller/products/new"
            className="mt-6 inline-block rounded-full bg-[#D4AF37] px-7 py-3 font-bold text-black"
          >
            Add Product
          </Link>

        </section>

      </div>
    </main>
  );
      }
