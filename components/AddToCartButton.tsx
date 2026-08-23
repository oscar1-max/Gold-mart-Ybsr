"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

type AddToCartButtonProps = {
  product: {
    id: number;
    name: string;
    price: string | number;
    image: string;
    currency?: string;
  };
};

function normalizeCurrency(currency?: string) {
  return String(currency || "USD").toUpperCase();
}

export default function AddToCartButton({
  product,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAddToCart() {
    setMessage("");

    const token =
      localStorage.getItem("goldmart_token");

    if (!token) {
      setMessage(
        "Please log in before adding products to your cart."
      );
      return;
    }

    try {
      setLoading(true);

      // Keep the REAL product currency.
      // Do NOT force everything to USD.
      const productCurrency =
        normalizeCurrency(product.currency);

      const cartProduct = {
        ...product,
        currency: productCurrency,
      };

      // Add to frontend cart
      addToCart(cartProduct);

      // Add to backend cart
      const response = await fetch(
        `${API_URL}/api/cart`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
            Accept:
              "application/json",
          },
          body: JSON.stringify({
            productId: product.id,
            quantity: 1,
          }),
        }
      );

      const text = await response.text();

      let data: any = null;

      try {
        data = JSON.parse(text);
      } catch {
        console.error(
          "Backend returned non-JSON:",
          text
        );

        throw new Error(
          "The GoldMart backend did not return a valid response."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Could not save product to your cart."
        );
      }

      setMessage(
        `Added to cart ✓ (${productCurrency})`
      );
    } catch (error) {
      console.error(
        "Add to cart error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Could not add product to cart."
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
