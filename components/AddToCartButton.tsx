"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

type AddToCartButtonProps = {
  product: {
    id: number;
    name: string;
    price: string;
    image: string;
    currency?: string;
  };
};

export default function AddToCartButton({
  product,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function handleAddToCart() {
    try {
      setLoading(true);
      setMessage("");

      const token =
        localStorage.getItem(
          "goldmart_token"
        );

      if (!token) {
        setMessage(
          "Please log in before adding products to your cart."
        );
        return;
      }

      // =====================================================
      // GOLDMART USES USD
      // =====================================================

      const usdProduct = {
        ...product,
        currency: "USD",
      };

      // =====================================================
      // ADD TO FRONTEND CART
      // =====================================================

      addToCart(usdProduct);

      // =====================================================
      // ADD TO BACKEND CART
      // =====================================================

      const response = await fetch(
        `${API_URL}/api/cart`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            productId: product.id,
            quantity: 1,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        console.error(
          "Backend cart error:",
          data
        );

        setMessage(
          data.message ||
            "Product was added locally but could not be saved to your account."
        );

        return;
      }

      setMessage(
        "Added to cart ✓"
      );
    } catch (error) {
      console.error(
        "Add to cart error:",
        error
      );

      setMessage(
        "Could not add product to cart."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={loading}
        className="w-full rounded-xl bg-black py-2.5 text-sm font-bold text-white transition hover:bg-[#D4AF37] hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Adding..."
          : "Add to Cart"}
      </button>

      {message && (
        <p
          className={`mt-2 text-center text-xs font-semibold ${
            message.includes("✓")
              ? "text-green-600"
              : "text-red-500"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
