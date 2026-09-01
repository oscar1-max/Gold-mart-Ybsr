"use client";

import { useState } from "react";

type Product = {
  id: number;
  name: string;
  price: string | number;
  image_url?: string | null;
  stock?: number;
};

export type AddToCartButtonProps = {
  product: Product;
  disabled?: boolean;
};

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

export default function AddToCartButton({
  product,
  disabled = false,
}: AddToCartButtonProps) {
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAddToCart() {
    if (adding || disabled || product.stock === 0) {
      return;
    }

    const savedUser =
      localStorage.getItem("goldmart_user");

    if (!savedUser) {
      window.location.href = "/login";
      return;
    }

    let user;

    try {
      user = JSON.parse(savedUser);
    } catch {
      window.location.href = "/login";
      return;
    }

    if (!user?.id) {
      window.location.href = "/login";
      return;
    }

    try {
      setAdding(true);
      setMessage("");

      const response = await fetch(
        `${API_URL}/api/cart`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            product_id: product.id,
            quantity: 1,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to add product to cart"
        );
      }

      setMessage("Added ✓");

      window.dispatchEvent(
        new Event("goldmart-cart-updated")
      );

      setTimeout(() => {
        setMessage("");
      }, 1800);
    } catch (error) {
      console.error(
        "Add to cart error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to add to cart"
      );

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } finally {
      setAdding(false);
    }
  }

  const unavailable =
    disabled ||
    product.stock === 0;

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      disabled={adding || unavailable}
      className={`w-full rounded-full px-3 py-2.5 text-xs font-bold transition ${
        unavailable
          ? "cursor-not-allowed bg-gray-200 text-gray-500"
          : adding
          ? "bg-gray-800 text-white"
          : message === "Added ✓"
          ? "bg-green-600 text-white"
          : "bg-black text-white active:scale-95"
      }`}
    >
      {adding
        ? "Adding..."
        : message
        ? message
        : unavailable
        ? "Sold out"
        : "Add to cart"}
    </button>
  );
      }
