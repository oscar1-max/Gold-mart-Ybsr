"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

type AddToCartButtonProps = {
  product: {
    id: number;
    name: string;
    price: string | number;
    image: string;
    currency?: string;
  };
};

export default function AddToCartButton({
  product,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    const price =
      typeof product.price === "number"
        ? product.price.toString()
        : product.price;

    addToCart({
      id: product.id,
      name: product.name,
      price,
      image: product.image,
      currency: product.currency || "USD",
    });

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1500);
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className={`mt-4 w-full rounded-xl py-2.5 text-sm font-bold transition ${
        added
          ? "bg-green-600 text-white"
          : "bg-black text-white hover:bg-[#D4AF37] hover:text-black"
      }`}
    >
      {added ? "✓ Added to Cart" : "Add to Cart"}
    </button>
  );
}
