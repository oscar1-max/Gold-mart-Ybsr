"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  image_url: string | null;
  category_name: string | null;
  stock: number;
  created_at: string;
};

export default function SellerProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      const token = localStorage.getItem("goldmart_token");
      const savedUser = localStorage.getItem("goldmart_user");

      if (!token || !savedUser) {
        router.push("/login");
        return;
      }

      try {
        const user = JSON.parse(savedUser);

        if (user.role !== "seller" && user.role !== "admin") {
          router.push("/");
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
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load products."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [router]);

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
            className="rounded-full border px-5 py-2 text-sm font-bold hover:bg-gray-100"
          >
            Seller Dashboard
          </Link>

        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-4 py-10">

        {/* BACK */}
        <Link
          href="/seller"
          className="font-bold text-[#A67C00]"
        >
          ← Back to Seller Dashboard
        </Link>

        {/* TITLE */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
              Seller Center
            </p>

            <h1 className="mt-1 text-3xl font-black sm:text-4xl">
              My Products
            </h1>

            <p className="mt-2 text-gray-500">
              Products you have added to GoldMart.
            </p>
          </div>

          <Link
            href="/seller/products/new"
            className="rounded-xl bg-black px-5 py-3 text-center text-sm font-bold text-white hover:bg-[#D4AF37] hover:text-black"
          >
            + Add Product
          </Link>

        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="font-bold">
              Loading your products...
            </p>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && products.length === 0 && (
          <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow-sm">

            <div className="text-5xl">
              📦
            </div>

            <h2 className="mt-4 text-2xl font-black">
              No products yet
            </h2>

            <p className="mt-2 text-gray-500">
              You haven't added any products to your store.
            </p>

            <Link
              href="/seller/products/new"
              className="mt-6 inline-block rounded-xl bg-black px-6 py-3 font-bold text-white"
            >
              Add Your First Product
            </Link>

          </div>
        )}

        {/* PRODUCTS */}
        {!loading && products.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {products.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-3xl border bg-white shadow-sm"
              >

                {/* IMAGE */}
                <div className="h-56 bg-gray-100">

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

                  <p className="text-xs font-bold uppercase tracking-wider text-[#A67C00]">
                    {product.category_name || "Uncategorized"}
                  </p>

                  <h2 className="mt-2 text-xl font-black">
                    {product.name}
                  </h2>

                  <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                    {product.description || "No description"}
                  </p>

                  <div className="mt-5 flex items-center justify-between">

                    <div>
                      <p className="text-xs font-bold uppercase text-gray-400">
                        Price
                      </p>

                      <p className="font-black text-[#A67C00]">
                        ₦
                        {Number(product.price).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold uppercase text-gray-400">
                        Stock
                      </p>

                      <p className="font-black">
                        {product.stock}
                      </p>
                    </div>

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </main>
  );
}
