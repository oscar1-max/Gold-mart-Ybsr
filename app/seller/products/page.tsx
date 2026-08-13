"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: string | number;
  image_url?: string | null;
  category_name?: string | null;
  stock: number;
};

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("goldmart_token");

      if (!token) {
        setError("Please sign in to access your seller products.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_URL}/api/seller/products`,
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
          data.message || "Failed to load seller products."
        );
      }

      setProducts(
        Array.isArray(data.products)
          ? data.products
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function formatPrice(price: string | number) {
    const amount = Number(price);

    if (!Number.isFinite(amount)) {
      return "0.00";
    }

    return amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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
            Gold<span className="text-[#D4AF37]">Mart</span>
          </Link>

          <Link
            href="/seller"
            className="rounded-full border px-5 py-2 text-sm font-bold transition hover:bg-gray-100"
          >
            Dashboard
          </Link>

        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-4 py-10">

        {/* TITLE */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
              Seller Center
            </p>

            <h1 className="mt-1 text-3xl font-black sm:text-4xl">
              My Products
            </h1>

            <p className="mt-2 text-gray-500">
              Manage the products in your GoldMart store.
            </p>
          </div>

          <Link
            href="/seller/products/new"
            className="rounded-full bg-black px-6 py-3 text-center font-bold text-white transition hover:bg-[#D4AF37] hover:text-black"
          >
            + Add Product
          </Link>

        </div>

        {/* PRODUCT COUNT */}
        {!loading && !error && (
          <div className="mt-6 rounded-2xl border bg-white p-5">
            <p className="text-sm text-gray-500">
              Your products
            </p>

            <p className="mt-1 text-3xl font-black">
              {products.length}
            </p>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">

            <p className="font-bold">
              Something went wrong
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>

            <button
              type="button"
              onClick={loadProducts}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white"
            >
              Try Again
            </button>

          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="mt-8 rounded-2xl border bg-white p-10 text-center">

            <div className="text-4xl">
              📦
            </div>

            <p className="mt-4 font-bold">
              Loading your products...
            </p>

          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && products.length === 0 && (
          <div className="mt-8 rounded-2xl border bg-white p-10 text-center">

            <div className="text-5xl">
              📦
            </div>

            <h2 className="mt-4 text-2xl font-black">
              No products yet
            </h2>

            <p className="mt-2 text-gray-500">
              Add your first product to start selling on GoldMart.
            </p>

            <Link
              href="/seller/products/new"
              className="mt-6 inline-block rounded-full bg-black px-6 py-3 font-bold text-white"
            >
              Add Your First Product
            </Link>

          </div>
        )}

        {/* PRODUCTS */}
        {!loading && !error && products.length > 0 && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {products.map((product) => (

              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >

                {/* IMAGE */}
                <div className="relative h-56 bg-gray-100">

                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl">
                      📦
                    </div>
                  )}

                </div>

                {/* DETAILS */}
                <div className="p-5">

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                      <p className="text-xs font-bold uppercase tracking-wider text-[#A67C00]">
                        {product.category_name || "Uncategorized"}
                      </p>

                      <h2 className="mt-1 truncate text-lg font-black">
                        {product.name}
                      </h2>

                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                        product.stock > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.stock > 0
                        ? "Active"
                        : "Out of Stock"}
                    </span>

                  </div>

                  {/* DESCRIPTION */}
                  {product.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-gray-500">
                      {product.description}
                    </p>
                  )}

                  {/* PRICE + STOCK */}
                  <div className="mt-5 flex items-end justify-between">

                    <div>
                      <p className="text-xs text-gray-400">
                        Price
                      </p>

                      <p className="text-xl font-black text-[#A67C00]">
                        ${formatPrice(product.price)}
                      </p>
                    </div>

                    <div className="text-right">

                      <p className="text-xs text-gray-400">
                        Stock
                      </p>

                      <p className="font-black">
                        {product.stock}
                      </p>

                    </div>

                  </div>

                  {/* ACTIONS */}
                  <div className="mt-5 flex gap-3">

                    {/* EDIT */}
                    <Link
                      href={`/seller/products/${product.id}/edit`}
                      className="flex-1 rounded-xl border px-4 py-3 text-center text-sm font-bold transition hover:border-[#D4AF37] hover:bg-gray-100"
                    >
                      Edit
                    </Link>

                    {/* VIEW STORE */}
                    <Link
                      href="/shop"
                      className="flex-1 rounded-xl bg-black px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-[#D4AF37] hover:text-black"
                    >
                      View Store
                    </Link>

                  </div>

                </div>

              </article>

            ))}

          </div>
        )}

      </div>
    </main>
  );
      }
