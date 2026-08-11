"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

type Product = {
  id: number;
  name: string;
  description?: string;
  price: string | number;
  image_url?: string | null;
  category_name?: string | null;
  stock: number;
};

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const token = localStorage.getItem("goldmart_token");

        if (!token) {
          setError("Please sign in to access your seller products.");
          setLoading(false);
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
            data.message || "Failed to load products."
          );
        }

        setProducts(data.products || []);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load products."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 text-black">

      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">

          <Link href="/" className="text-2xl font-black">
            Gold<span className="text-[#D4AF37]">Mart</span>
          </Link>

          <Link
            href="/seller"
            className="rounded-full border px-5 py-2 text-sm font-bold"
          >
            Dashboard
          </Link>

        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-4 py-10">

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
              Seller Center
            </p>

            <h1 className="mt-1 text-3xl font-black">
              My Products
            </h1>

            <p className="mt-2 text-gray-500">
              Manage the products in your GoldMart store.
            </p>
          </div>

          <Link
            href="/seller/products/new"
            className="rounded-full bg-black px-6 py-3 text-center font-bold text-white"
          >
            + Add Product
          </Link>

        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-bold">
              Something went wrong
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="mt-8 rounded-2xl border bg-white p-10 text-center">
            <p className="font-bold">
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
          <div className="mt-8 overflow-hidden rounded-2xl border bg-white">

            <div className="hidden grid-cols-6 gap-4 border-b bg-gray-50 p-5 text-sm font-bold lg:grid">
              <span>Product</span>
              <span>Category</span>
              <span>Price</span>
              <span>Stock</span>
              <span>Status</span>
              <span>Action</span>
            </div>

            {products.map((product) => (
              <div
                key={product.id}
                className="grid gap-4 border-b p-5 last:border-b-0 lg:grid-cols-6 lg:items-center"
              >

                {/* PRODUCT */}
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400 lg:hidden">
                    Product
                  </p>

                  <p className="font-bold">
                    {product.name}
                  </p>

                  {product.description && (
                    <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                      {product.description}
                    </p>
                  )}
                </div>

                {/* CATEGORY */}
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400 lg:hidden">
                    Category
                  </p>

                  <p className="text-sm text-gray-600">
                    {product.category_name || "Uncategorized"}
                  </p>
                </div>

                {/* PRICE */}
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400 lg:hidden">
                    Price
                  </p>

                  <p className="font-black text-[#A67C00]">
                    ₦{Number(product.price).toLocaleString()}
                  </p>
                </div>

                {/* STOCK */}
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400 lg:hidden">
                    Stock
                  </p>

                  <p className="font-bold">
                    {product.stock}
                  </p>
                </div>

                {/* STATUS */}
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400 lg:hidden">
                    Status
                  </p>

                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
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

                {/* ACTION */}
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400 lg:hidden">
                    Action
                  </p>

                  <button
                    type="button"
                    className="rounded-lg border px-4 py-2 text-sm font-bold"
                    onClick={() =>
                      alert(
                        "Product editing will be connected next."
                      )
                    }
                  >
                    Edit
                  </button>
                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </main>
  );
}
