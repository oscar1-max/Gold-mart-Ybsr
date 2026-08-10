"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { products } from "../../../data/products";
import { useCart } from "../../../components/CartProvider";

export default function ProductDetailsPage() {
  const params = useParams();
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const productId = Number(params.id);
  const product = products.find((item) => item.id === productId);

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-6xl">🔎</div>

          <h1 className="mt-4 text-3xl font-black">
            Product not found
          </h1>

          <p className="mt-2 text-gray-500">
            The product you are looking for doesn't exist.
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

  function handleAddToCart() {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      });
    }

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2000);
  }

  return (
    <main className="min-h-screen bg-gray-50 text-black">

      {/* HEADER */}
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

      {/* PRODUCT */}
      <div className="mx-auto max-w-7xl px-4 py-10">

        <Link
          href="/shop"
          className="text-sm font-bold text-[#A67C00]"
        >
          ← Back to Shop
        </Link>

        <div className="mt-8 grid gap-8 rounded-3xl bg-white p-5 shadow-sm md:grid-cols-2 md:p-8">

          {/* IMAGE */}
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

          {/* INFORMATION */}
          <div className="flex flex-col justify-center">

            <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
              {product.category}
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-4 flex items-center gap-3">

              <span className="text-lg">
                ⭐ {product.rating}
              </span>

              <span className="text-sm text-gray-500">
                Trusted GoldMart product
              </span>

            </div>

            <p className="mt-6 text-3xl font-black text-[#A67C00]">
              {product.price}
            </p>

            <p className="mt-6 leading-7 text-gray-600">
              {product.description}
            </p>

            {/* QUANTITY */}
            <div className="mt-8">

              <p className="mb-3 font-bold">
                Quantity
              </p>

              <div className="flex w-fit items-center rounded-xl border">

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) => Math.max(1, current - 1))
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
                    setQuantity((current) => current + 1)
                  }
                  className="h-11 w-11 font-bold"
                >
                  +
                </button>

              </div>

            </div>

            {/* BUTTONS */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">

              <button
                type="button"
                onClick={handleAddToCart}
                className="rounded-xl bg-black py-4 font-bold text-white transition hover:bg-[#D4AF37] hover:text-black"
              >
                {added ? "✓ Added to Cart" : "🛒 Add to Cart"}
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                className="rounded-xl bg-[#D4AF37] py-4 font-bold text-black"
              >
                ⚡ Buy Now
              </button>

            </div>

            {/* TRUST */}
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

          </div>
        </div>
      </div>
    </main>
  );
            }
