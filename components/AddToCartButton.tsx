"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

type Product = {
  id: number;
  name: string;
  price: string | number;
  image_url?: string | null;
  stock?: number;
  currency?: string;
};

export type AddToCartButtonProps = {
  product: Product;
  disabled?: boolean;
};

export default function AddToCartButton({
  product,
  disabled = false,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();

  const [adding, setAdding] =
    useState(false);

  const [message, setMessage] =
    useState("");

  function handleAddToCart() {
    if (
      adding ||
      disabled ||
      product.stock === 0
    ) {
      return;
    }

    const token =
      localStorage.getItem(
        "goldmart_token"
      );

    if (!token) {
      window.location.href =
        "/login";
      return;
    }

    try {
      setAdding(true);
      setMessage("");

      addToCart(
        {
          id: product.id,
          name: product.name,
          price: String(product.price),
          image:
            product.image_url ||
            "/images/headphones.jpg",
          currency:
            product.currency ||
            "USD",
        },
        1
      );

      setMessage("Added ✓");

      setTimeout(() => {
        setMessage("");
      }, 1800);
    } catch (error) {
      console.error(
        "Add to cart error:",
        error
      );

      setMessage(
        "Unable to add to cart"
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
      disabled={
        adding || unavailable
      }
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
