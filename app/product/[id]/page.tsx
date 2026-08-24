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
};

function formatPrice(
  price: number,
  currency: string
) {
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

  const [product, setProduct] =
    useState<Product | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const productId = Number(params.id);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/products/${productId}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Product not found");
        }

        const data = await response.json();

        if (!data.success || !data.product) {
          throw new Error(
            data.message || "Product not found"
          );
        }

        const productData = data.product;

        setProduct({
          id: productData.id,
          name: productData.name,
          price: Number(productData.price),

          // IMPORTANT:
          // Keep the real currency from the database.
          currency:
            String(
              productData.currency || "NGN"
            ).toUpperCase(),

          rating:
            Number(productData.rating) || 4.5,

          image:
            productData.image_url ||
            "/images/headphones.jpg",

          description:
            productData.description ||
            "Quality product from GoldMart.",

          category:
            productData.category_name ||
            "Other",

          stock:
            Number(productData.stock) || 0,
        });
      } catch (err) {
        console.error(
          "Product error:",
          err
        );

        setError(
          "Unable to load this product."
        );
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  function handleAddToCart() {
    if (!product) return;

    for (
      let i = 0;
      i < quantity;
      i++
    ) {
      addToCart({
        id: product.id,
        name: product.name,

        // Keep the actual numeric price.
        price: String(product.price),

        image: product.image,

        // Keep the real product currency.
        currency: product.currency,
      });
    }

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2000);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-5xl">
            ⏳
          </div>

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
          <div className="text-6xl">
            🔎
          </div>

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

            {/* RATING */}
            <div className="mt-4 flex items-center gap-3">

              <span className="text-lg">
                ⭐ {product.rating.toFixed(1)}
              </span>

              <span className="text-sm text-gray-500">
                GoldMart customer rating
              </span>

            </div>

            {/* PRICE */}
            <p className="mt-6 text-3xl font-black text-[#A67C00]">
              {formatPrice(
                product.price,
                product.currency
              )}
            </p>

            {/* DESCRIPTION */}
            <p className="mt-6 leading-7 text-gray-600">
              {product.description}
            </p>

            {/* STOCK */}
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

            {/* QUANTITY */}
            <div className="mt-8">

              <p className="mb-3 font-bold">
                Quantity
              </p>

              <div className="flex w-fit items-center rounded-xl border">

                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      (current) =>
                        Math.max(
                          1,
                          current - 1
                        )
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
                    setQuantity(
                      (current) =>
                        Math.min(
                          product.stock,
                          current + 1
                        )
                    )
                  }
                  disabled={
                    product.stock === 0
                  }
                  className="h-11 w-11 font-bold disabled:opacity-40"
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
                disabled={
                  product.stock === 0
                }
                className="rounded-xl bg-black py-4 font-bold text-white transition hover:bg-[#D4AF37] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {added
                  ? "✓ Added to Cart"
                  : "🛒 Add to Cart"}
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={
                  product.stock === 0
                }
                className="rounded-xl bg-[#D4AF37] py-4 font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                ⚡ Buy Now
              </button>

            </div>

            {/* TRUST */}
            <div className="mt-8 grid grid-cols-2 gap-3">

              <div className="rounded-xl border p-4">
                <div className="text-xl">
                  🔒
                </div>

                <p className="mt-2 text-sm font-bold">
                  Secure Payment
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="text-xl">
                  🚚
                </div>

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
