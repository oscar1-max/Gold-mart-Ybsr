"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../../../components/CartProvider";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com/api";

type Product = {
  id: number;
  name: string;
  price: number;
  currency: string;
  rating: number;
  image: string;
  description: string;
  category: string;
  stock: number;
  seller_id: number;
  seller_name: string;
};

function formatPrice(price: number, currency: string) {
  const code = (currency || "NGN").toUpperCase();

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${code} ${price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

export default function ProductDetailsPage() {
  const params = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportResult, setReportResult] = useState("");

  const productId = Number(params.id);
    useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/products/${productId}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Product not found");
        }

        const data = await response.json();

        if (!data.success || !data.product) {
          throw new Error(data.message || "Product not found");
        }

        const p = data.product;

        setProduct({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          currency: String(p.currency || "NGN").toUpperCase(),
          rating: Number(p.rating) || 4.5,
          image: p.image_url || "/images/headphones.jpg",
          description:
            p.description || "Quality product from GoldMart.",
          category: p.category_name || "Other",
          stock: Number(p.stock) || 0,
          seller_id: Number(p.seller_id),
          seller_name: p.seller_name || "GoldMart Seller",
        });
      } catch (err) {
        console.error("Product error:", err);
        setError("Unable to load this product.");
      } finally {
        setLoading(false);
      }
    }

    if (productId) fetchProduct();
  }, [productId]);

  useEffect(() => {
    async function checkWishlist() {
      const token = localStorage.getItem("goldmart_token");
      if (!token || !productId) return;

      try {
        const response = await fetch(
          `${API_URL}/wishlist/check/${productId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setWishlisted(Boolean(data.wishlisted));
        }
      } catch (err) {
        console.error("Wishlist check error:", err);
      }
    }

    checkWishlist();
  }, [productId]);
    function handleAddToCart() {
    if (!product) return;

    const token = localStorage.getItem("goldmart_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    addToCart(
      {
        id: product.id,
        name: product.name,
        price: String(product.price),
        image: product.image,
        currency: product.currency,
      },
      quantity
    );

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2000);
  }

  async function handleWishlist() {
    if (!product) return;

    const token = localStorage.getItem("goldmart_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      setWishlistLoading(true);

      const response = await fetch(
        wishlisted
          ? `${API_URL}/wishlist/${product.id}`
          : `${API_URL}/wishlist`,
        {
          method: wishlisted ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: wishlisted
            ? undefined
            : JSON.stringify({
                productId: product.id,
              }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Wishlist action failed"
        );
      }

      setWishlisted(!wishlisted);
    } catch (err) {
      console.error("Wishlist error:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Wishlist action failed."
      );
    } finally {
      setWishlistLoading(false);
    }
  }
    async function handleReportSeller() {
    if (!product) return;

    const token = localStorage.getItem("goldmart_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (!reportReason) {
      setReportResult("Please select a reason.");
      return;
    }

    try {
      setReporting(true);
      setReportResult("");

      const response = await fetch(`${API_URL}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportedUserId: product.seller_id,
          reason: reportReason,
          message: reportMessage.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to submit report"
        );
      }

      setReportResult(
        "✓ Report submitted successfully."
      );

      setReportReason("");
      setReportMessage("");

      setTimeout(() => {
        setShowReport(false);
        setReportResult("");
      }, 2000);
    } catch (err) {
      console.error("Report seller error:", err);

      setReportResult(
        err instanceof Error
          ? err.message
          : "Failed to submit report."
      );
    } finally {
      setReporting(false);
    }
    }
    if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-5xl">⏳</div>
          <h1 className="mt-4 text-xl font-black">
            Loading product...
          </h1>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-6xl">🔎</div>

          <h1 className="mt-4 text-3xl font-black">
            Product not found
          </h1>

          <p className="mt-2 text-gray-500">
            {error ||
              "The product you're looking for doesn't exist."}
          </p>

          <Link
            href="/shop"
            className="mt-6 inline-block rounded-full bg-black px-7 py-3 font-bold text-white"
          >
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }
    return (
    <main className="min-h-screen bg-gray-50 text-black">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <Link href="/" className="text-2xl font-black">
            Gold<span className="text-[#D4AF37]">Mart</span>
          </Link>

          <Link
            href="/cart"
            className="rounded-full border px-5 py-2 font-bold"
          >
            🛒 Cart
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <Link
          href="/shop"
          className="text-sm font-bold text-[#A67C00]"
        >
          ← Back to Shop
        </Link>

        <div className="mt-8 grid gap-8 rounded-3xl bg-white p-5 shadow-sm md:grid-cols-2 md:p-8">
          <div className="relative min-h-[350px] overflow-hidden rounded-2xl bg-gray-100 md:min-h-[500px]">
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
              {product.category}
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-4 rounded-xl border bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Sold by
              </p>

              <p className="mt-1 font-bold">
                {product.seller_name}
              </p>

              <p className="text-xs text-gray-500">
                Seller ID: {product.seller_id}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-lg">
                ⭐ {product.rating.toFixed(1)}
              </span>

              <span className="text-sm text-gray-500">
                GoldMart customer rating
              </span>
            </div>

            <p className="mt-6 text-3xl font-black text-[#A67C00]">
              {formatPrice(
                product.price,
                product.currency
              )}
            </p>

            <p className="mt-6 leading-7 text-gray-600">
              {product.description}
            </p>

            <p className="mt-4 text-sm font-bold">
              {product.stock > 0 ? (
                <span className="text-green-600">
                  ✓ {product.stock} available
                </span>
              ) : (
                <span className="text-red-600">
                  Out of stock
                </span>
              )}
            </p>
                        <div className="mt-8">
              <p className="mb-3 font-bold">
                Quantity
              </p>

              <div className="flex w-fit items-center rounded-xl border">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) =>
                      Math.max(1, current - 1)
                    )
                  }
                  className="h-11 w-11 font-bold"
                >
                  −
                </button>

                <span className="w-12 text-center font-bold">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) =>
                      Math.min(
                        product.stock,
                        current + 1
                      )
                    )
                  }
                  disabled={product.stock === 0}
                  className="h-11 w-11 font-bold disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="rounded-xl bg-black py-4 font-bold text-white hover:bg-[#D4AF37] hover:text-black disabled:opacity-50"
              >
                {added
                  ? "✓ Added to Cart"
                  : "🛒 Add to Cart"}
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="rounded-xl bg-[#D4AF37] py-4 font-bold text-black disabled:opacity-50"
              >
                ⚡ Buy Now
              </button>
            </div>

            <button
              type="button"
              onClick={handleWishlist}
              disabled={wishlistLoading}
              className="mt-3 w-full rounded-xl border py-4 font-bold hover:bg-gray-50 disabled:opacity-50"
            >
              {wishlistLoading
                ? "Saving..."
                : wishlisted
                ? "❤️ Remove from Wishlist"
                : "♡ Add to Wishlist"}
            </button>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-xl border p-4">
                <div className="text-xl">🔒</div>
                <p className="mt-2 text-sm font-bold">
                  Secure Payment
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="text-xl">🚚</div>
                <p className="mt-2 text-sm font-bold">
                  Reliable Delivery
                </p>
              </div>
            </div>
                        <div className="mt-6 border-t pt-6">
              <button
                type="button"
                onClick={() => {
                  const token =
                    localStorage.getItem(
                      "goldmart_token"
                    );

                  if (!token) {
                    window.location.href = "/login";
                    return;
                  }

                  setShowReport((current) => !current);
                  setReportResult("");
                }}
                className="text-sm font-semibold text-red-600 hover:underline"
              >
                🚩 Report Seller
              </button>

              {showReport && (
                <div className="mt-4 rounded-2xl border bg-gray-50 p-5">
                  <h2 className="text-lg font-black">
                    Report {product.seller_name}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Tell GoldMart why you are reporting this seller.
                  </p>

                  <label className="mt-5 block text-sm font-bold">
                    Reason
                  </label>

                  <select
                    value={reportReason}
                    onChange={(e) =>
                      setReportReason(e.target.value)
                    }
                    className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none"
                  >
                    <option value="">
                      Select a reason
                    </option>
                    <option value="Fraud or scam">
                      Fraud or scam
                    </option>
                    <option value="Fake product">
                      Fake product
                    </option>
                    <option value="Misleading listing">
                      Misleading listing
                    </option>
                    <option value="Bad behavior">
                      Bad behavior
                    </option>
                    <option value="Harassment">
                      Harassment
                    </option>
                    <option value="Other">
                      Other
                    </option>
                  </select>

                  <label className="mt-4 block text-sm font-bold">
                    Additional message
                  </label>

                  <textarea
                    value={reportMessage}
                    onChange={(e) =>
                      setReportMessage(e.target.value)
                    }
                    rows={4}
                    placeholder="Optional details..."
                    className="mt-2 w-full resize-none rounded-xl border bg-white px-4 py-3 outline-none"
                  />

                  {reportResult && (
                    <p className="mt-3 text-sm font-semibold">
                      {reportResult}
                    </p>
                  )}

                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={handleReportSeller}
                      disabled={reporting}
                      className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white disabled:opacity-50"
                    >
                      {reporting
                        ? "Submitting..."
                        : "Submit Report"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowReport(false);
                        setReportReason("");
                        setReportMessage("");
                        setReportResult("");
                      }}
                      className="rounded-xl border bg-white px-5 py-3 font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
