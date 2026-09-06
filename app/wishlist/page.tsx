"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "../../components/CartProvider";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com/api";

type WishlistProduct = {
  id: number;
  name: string;
  price: string | number;
  currency?: string;
  image_url?: string;
  stock?: number;
  category_name?: string;
};

type WishlistItem = {
  id: number;
  product_id: number;
  product: WishlistProduct;
};

function formatPrice(
  price: string | number,
  currency = "NGN"
) {
  const amount = Number(price);
  const code = currency.toUpperCase();

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

export default function WishlistPage() {
  const { addToCart } = useCart();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    async function loadWishlist() {
      const token = localStorage.getItem("goldmart_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/wishlist`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load wishlist"
          );
        }

        setItems(data.items || data.wishlist || []);
      } catch (err) {
        console.error("Wishlist error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load wishlist."
        );
      } finally {
        setLoading(false);
      }
    }

    loadWishlist();
  }, []);

  async function removeItem(productId: number) {
    const token = localStorage.getItem("goldmart_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      setRemoving(productId);

      const response = await fetch(
        `${API_URL}/wishlist/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to remove item"
        );
      }

      setItems((current) =>
        current.filter(
          (item) => item.product_id !== productId
        )
      );
    } catch (err) {
      console.error("Remove wishlist error:", err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to remove item."
      );
    } finally {
      setRemoving(null);
    }
  }

  async function clearWishlist() {
    const token = localStorage.getItem("goldmart_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (items.length === 0) return;

    if (
      !window.confirm(
        "Are you sure you want to clear your wishlist?"
      )
    ) {
      return;
    }

    try {
      setClearing(true);

      const response = await fetch(`${API_URL}/wishlist`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to clear wishlist"
        );
      }

      setItems([]);
    } catch (err) {
      console.error("Clear wishlist error:", err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to clear wishlist."
      );
    } finally {
      setClearing(false);
    }
  }

  function handleAddToCart(item: WishlistItem) {
    const product = item.product;

    if (!product) return;

    const token = localStorage.getItem("goldmart_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (Number(product.stock || 0) <= 0) {
      alert("This product is currently out of stock.");
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: String(product.price),
      image:
        product.image_url ||
        "/images/headphones.jpg",
      currency:
        product.currency || "NGN",
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-5xl">❤️</div>

          <h1 className="mt-4 text-xl font-black">
            Loading Wishlist...
          </h1>
        </div>
      </main>
    );
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

          <div className="flex items-center gap-2">
            <Link
              href="/shop"
              className="rounded-full border px-4 py-2 text-sm font-bold"
            >
              Shop
            </Link>

            <Link
              href="/cart"
              className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white"
            >
              🛒 Cart
            </Link>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/"
              className="text-sm font-bold text-[#A67C00]"
            >
              ← Back to Home
            </Link>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl">
              ❤️ My Wishlist
            </h1>

            <p className="mt-2 text-gray-500">
              {items.length}{" "}
              {items.length === 1
                ? "saved product"
                : "saved products"}
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearWishlist}
              disabled={clearing}
              className="rounded-xl border border-red-200 bg-white px-5 py-3 font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {clearing
                ? "Clearing..."
                : "🗑️ Clear Wishlist"}
            </button>
          )}
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-bold">
              Unable to load wishlist
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>
          </div>
        )}

        {/* EMPTY */}
        {!error && items.length === 0 && (
          <div className="mt-10 rounded-3xl bg-white px-6 py-16 text-center shadow-sm">
            <div className="text-7xl">♡</div>

            <h2 className="mt-5 text-2xl font-black">
              Your wishlist is empty
            </h2>

            <p className="mx-auto mt-2 max-w-md text-gray-500">
              Save products you love and come back
              to them later.
            </p>

            <Link
              href="/shop"
              className="mt-7 inline-block rounded-xl bg-black px-7 py-3 font-bold text-white"
            >
              Browse Products
            </Link>
          </div>
        )}

        {/* PRODUCTS */}
        {!error && items.length > 0 && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
              const product = item.product;

              if (!product) return null;

              const stock = Number(
                product.stock || 0
              );

              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  {/* IMAGE */}
                  <Link
                    href={`/product/${product.id}`}
                  >
                    <div className="relative h-64 bg-gray-100">
                      <Image
                        src={
                          product.image_url ||
                          "/images/headphones.jpg"
                        }
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />

                      <div className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-sm font-bold shadow">
                        ❤️
                      </div>
                    </div>
                  </Link>

                  {/* INFO */}
                  <div className="p-5">
                    {product.category_name && (
                      <p className="text-xs font-bold uppercase tracking-wide text-[#A67C00]">
                        {product.category_name}
                      </p>
                    )}

                    <Link
                      href={`/product/${product.id}`}
                    >
                      <h2 className="mt-1 line-clamp-2 text-lg font-black hover:underline">
                        {product.name}
                      </h2>
                    </Link>

                    <p className="mt-3 text-xl font-black text-[#A67C00]">
                      {formatPrice(
                        product.price,
                        product.currency
                      )}
                    </p>

                    <p className="mt-2 text-sm font-bold">
                      {stock > 0 ? (
                        <span className="text-green-600">
                          ✓ {stock} available
                        </span>
                      ) : (
                        <span className="text-red-600">
                          Out of stock
                        </span>
                      )}
                    </p>

                    {/* ACTIONS */}
                    <div className="mt-5 grid gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleAddToCart(item)
                        }
                        disabled={stock <= 0}
                        className="rounded-xl bg-black py-3 font-bold text-white hover:bg-[#D4AF37] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        🛒 Add to Cart
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removeItem(product.id)
                        }
                        disabled={
                          removing === product.id
                        }
                        className="rounded-xl border py-3 font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {removing === product.id
                          ? "Removing..."
                          : "♡ Remove"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
