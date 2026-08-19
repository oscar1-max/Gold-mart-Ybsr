"use client";

import { useCart } from "./CartProvider";

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

  function handleAddToCart() {
    addToCart({
      ...product,
      currency: product.currency || "USD",
    });
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className="mt-4 w-full rounded-xl bg-black py-2.5 text-sm font-bold text-white transition hover:bg-[#D4AF37] hover:text-black"
    >
      Add to Cart
    </button>
  );
}
