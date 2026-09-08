"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../../../components/CartProvider";

const API_URL = "https://goldmart-backend-yoxc.onrender.com/api";

type Product = {
  id: number;
  name: string;
  description?: string;
  price: number | string;
  stock: number;
  image_url?: string;
  category_name?: string;
  seller_id?: number;
  seller_name?: string;
};

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [wishlist, setWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [reporting, setReporting] = useState(false);

  const productId = params?.id;

  useEffect(() => {
    if (!productId) return;

    const loadProduct = async () => {
      try {
        const response = await fetch(
          `${API_URL}/products/${productId}`
        );

        if (!response.ok) {
          throw new Error("Product not found");
        }

        const data = await response.json();

        setProduct(data.product || data);
      } catch (error) {
        console.error("Product error:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  useEffect(() => {
    if (!productId) return;

    const checkWishlist = async () => {
      const token = localStorage.getItem("goldmart_token");

      if (!token) return;

      try {
        const response = await fetch(
          `${API_URL}/wishlist/check/${productId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setWishlist(Boolean(data.wishlisted));
        }
      } catch (error) {
        console.error("Wishlist check error:", error);
      }
    };

    checkWishlist();
  }, [productId]);

  const handleWishlist = async () => {
    const token = localStorage.getItem("goldmart_token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!product) return;

    setWishlistLoading(true);

    try {
      if (wishlist) {
        const response = await fetch(
          `${API_URL}/wishlist/${product.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          setWishlist(false);
        }
      } else {
        const response = await fetch(
          `${API_URL}/wishlist`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              productId: product.id,
            }),
          }
        );

        if (response.ok) {
          setWishlist(true);
        }
      }
    } catch (error) {
      console.error("Wishlist error:", error);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleChatWithSeller = async () => {
    const token = localStorage.getItem("goldmart_token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!product?.seller_id) {
      alert("Seller information is not available.");
      return;
    }

    setChatLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/messages/conversations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sellerId: product.seller_id,
            productId: product.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not open chat"
        );
      }

      router.push(`/chat/${data.conversation.id}`);
    } catch (error) {
      console.error("Chat error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Could not open chat."
      );
    } finally {
      setChatLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
  id: product.id,
  name: product.name,
  price: String(product.price),
  image_url: product.image_url,
});

    alert("Product added to cart!");
  };

  const handleBuyNow = () => {
    if (!product) return;

    addToCart({
  id: product.id,
  name: product.name,
  price: String(product.price),
  image_url: product.image_url,
});

    router.push("/checkout");
  };

  const handleReportSeller = async () => {
    const token = localStorage.getItem("goldmart_token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!product?.seller_id) {
      alert("Seller information is not available.");
      return;
    }

    const reason = prompt(
      "Why are you reporting this seller?"
    );

    if (!reason?.trim()) return;

    setReporting(true);

    try {
      const response = await fetch(
        `${API_URL}/reports`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reportedUserId: product.seller_id,
            reason: reason.trim(),
            message:
              "Report submitted from the product page.",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not submit report."
        );
      }

      alert("Report submitted successfully.");
    } catch (error) {
      console.error("Report error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Could not submit report."
      );
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-semibold">Loading product...</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">
          Product not found
        </h1>

        <Link
          href="/shop"
          className="rounded-xl bg-black px-6 py-3 font-bold text-white"
        >
          Back to Shop
        </Link>
      </main>
    );
  }

  const price = Number(product.price);
  const total = price * quantity;

  return (
    <main className="min-h-screen bg-white text-black">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <Link
            href="/shop"
            className="text-xl font-black"
          >
            GoldMart
          </Link>

          <Link
            href="/cart"
            className="rounded-xl border px-4 py-2 font-bold"
          >
            🛒 Cart
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link
          href="/shop"
          className="mb-6 inline-block font-semibold underline"
        >
          ← Back to Shop
        </Link>

        <div className="grid gap-10 md:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-gray-500">
              {product.category_name || "Product"}
            </p>

            <h1 className="text-3xl font-black">
              {product.name}
            </h1>

            <p className="mt-4 text-2xl font-black">
              ${price.toFixed(2)}
            </p>

            <p className="mt-3 text-sm text-gray-600">
              {product.stock > 0
                ? `${product.stock} available`
                : "Out of stock"}
            </p>

            <div className="mt-8">
              <h2 className="text-lg font-bold">
                Description
              </h2>

              <p className="mt-2 leading-7 text-gray-700">
                {product.description ||
                  "No description available."}
              </p>
            </div>

            <div className="mt-8 rounded-2xl border p-5">
              <h2 className="text-lg font-black">
                Seller
              </h2>

              <p className="mt-2 font-semibold">
                {product.seller_name || "GoldMart Seller"}
              </p>

              {product.seller_id && (
                <p className="mt-1 text-sm text-gray-500">
                  Seller ID: {product.seller_id}
                </p>
              )}

              <button
                type="button"
                onClick={handleChatWithSeller}
                disabled={chatLoading}
                className="mt-4 w-full rounded-xl border-2 border-black py-4 font-bold hover:bg-black hover:text-white disabled:opacity-50"
              >
                {chatLoading
                  ? "Opening Chat..."
                  : "💬 Chat with Seller"}
              </button>
            </div>

            <div className="mt-8">
              <label className="font-bold">
                Quantity
              </label>

              <div className="mt-3 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.max(1, q - 1))
                  }
                  className="h-10 w-10 rounded-lg border font-bold"
                >
                  −
                </button>

                <span className="w-8 text-center font-bold">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) =>
                      Math.min(product.stock, q + 1)
                    )
                  }
                  className="h-10 w-10 rounded-lg border font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <p className="mt-6 text-xl font-black">
              Total: ${total.toFixed(2)}
            </p>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="rounded-xl border-2 border-black py-4 font-bold hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                🛒 Add to Cart
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="rounded-xl bg-black py-4 font-bold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Buy Now
              </button>
            </div>

            <button
              type="button"
              onClick={handleWishlist}
              disabled={wishlistLoading}
              className="mt-3 w-full rounded-xl border-2 border-black py-4 font-bold hover:bg-gray-100 disabled:opacity-50"
            >
              {wishlistLoading
                ? "Updating..."
                : wishlist
                ? "❤️ Remove from Wishlist"
                : "♡ Add to Wishlist"}
            </button>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border p-4">
                <p className="font-bold">
                  🔒 Secure Payment
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Your payment is protected through GoldMart.
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="font-bold">
                  🚚 Reliable Delivery
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Track your order from purchase to delivery.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReportSeller}
              disabled={reporting}
              className="mt-6 w-full rounded-xl border border-red-300 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {reporting
                ? "Submitting Report..."
                : "🚩 Report Seller"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
