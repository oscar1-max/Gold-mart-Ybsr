"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import AddToCartButton from "../components/AddToCartButton";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

const categories = [
  { icon: "📱", name: "Phones" },
  { icon: "💻", name: "Electronics" },
  { icon: "🎮", name: "Gaming" },
  { icon: "👕", name: "Fashion" },
  { icon: "💄", name: "Beauty & Cosmetics" },
  { icon: "🛒", name: "Groceries" },
  { icon: "🏠", name: "Home & Kitchen" },
];

type User = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
};

type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: string | number;
  currency?: string | null;
  image_url?: string | null;
  category_name?: string | null;
  stock: number;
  rating?: number;
};

export default function Home() {
  const [user, setUser] =
    useState<User | null>(null);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [search, setSearch] =
    useState("");

  // LOAD USER
  useEffect(() => {
    const savedUser =
      localStorage.getItem(
        "goldmart_user"
      );

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  // LOAD PRODUCTS
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoadingProducts(true);

        const response = await fetch(
          `${API_URL}/api/products`,
          {
            method: "GET",
            headers: {
              Accept:
                "application/json",
            },
            cache: "no-store",
          }
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Failed to load products"
          );
        }

        setProducts(
          Array.isArray(
            data.products
          )
            ? data.products
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load products:",
          error
        );

        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, []);

  // HERO SEARCH
  function handleSearch() {
    const query =
      search.trim();

    if (!query) {
      window.location.href =
        "/shop";

      return;
    }

    window.location.href =
      `/shop?search=${encodeURIComponent(
        query
      )}`;
  }

  // CATEGORY
  function handleCategory(
    category: string
  ) {
    window.location.href =
      `/shop?category=${encodeURIComponent(
        category
      )}`;
  }

  // FORMAT PRICE
  function formatPrice(
    price: string | number,
    currency?: string | null
  ) {
    const amount = Number(price);

    if (!Number.isFinite(amount)) {
      return "0.00";
    }

    const formatted =
      amount.toLocaleString(
        "en-US",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      );

    switch (
      currency?.toUpperCase()
    ) {
      case "USD":
        return `$${formatted}`;

      case "EUR":
        return `€${formatted}`;

      case "GBP":
        return `£${formatted}`;

      case "NGN":
        return `₦${formatted}`;

      default:
        return formatted;
    }
  }

  return (
    <main className="min-h-screen bg-white text-black">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">

          {/* LOGO */}
          <Link
            href="/"
            className="text-2xl font-black"
          >
            Gold
            <span className="text-[#D4AF37]">
              Mart
            </span>
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden items-center gap-8 md:flex">

            <Link
              href="/"
              className="font-medium hover:text-[#A67C00]"
            >
              Home
            </Link>

            <Link
              href="/shop"
              className="font-medium hover:text-[#A67C00]"
            >
              Shop
            </Link>

            <a
              href="#categories"
              className="font-medium hover:text-[#A67C00]"
            >
              Categories
            </a>

            <a
              href="#deals"
              className="font-medium hover:text-[#A67C00]"
            >
              Deals
            </a>

          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-2">

            {/* TOP SEARCH */}
            <button
              type="button"
              aria-label="Search"
              onClick={() =>
                (window.location.href =
                  "/shop")
              }
              className="rounded-full border border-gray-200 p-2 transition hover:border-[#D4AF37]"
            >
              🔍
            </button>

            {/* SELLER / LOGIN */}
            {user?.role ===
            "seller" ? (
              <Link
                href="/seller"
                className="hidden rounded-full bg-black px-4 py-2 text-sm font-bold text-white transition hover:bg-[#D4AF37] hover:text-black sm:block"
              >
                🏪 Seller Dashboard
              </Link>
            ) : user?.role ===
              "admin" ? (
              <Link
                href="/admin"
                className="hidden rounded-full bg-black px-4 py-2 text-sm font-bold text-white transition hover:bg-[#D4AF37] hover:text-black sm:block"
              >
                ⚙️ Admin
              </Link>
            ) : user ? (
              <Link
                href="/become-seller"
                className="hidden rounded-full bg-black px-4 py-2 text-sm font-bold text-white transition hover:bg-[#D4AF37] hover:text-black sm:block"
              >
                🏪 Sell on GoldMart
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-full border border-gray-200 px-3 py-2 text-sm font-bold hover:border-[#D4AF37] sm:block"
              >
                Sign In
              </Link>
            )}

            {/* CREATE ACCOUNT */}
            {!user && (
              <Link
                href="/register"
                className="hidden rounded-full bg-black px-4 py-2 text-sm font-bold text-white transition hover:bg-[#D4AF37] hover:text-black md:block"
              >
                Create Account
              </Link>
            )}

            {/* ACCOUNT */}
            {user && (
              <Link
                href="/account"
                className="rounded-full border border-gray-200 px-3 py-2 text-sm font-bold hover:border-[#D4AF37]"
              >
                👤
                <span className="hidden sm:inline">
                  {" "}
                  Account
                </span>
              </Link>
            )}

            {/* CART */}
            <Link
              href="/cart"
              aria-label="Shopping cart"
              className="rounded-full border border-gray-200 p-2 hover:border-[#D4AF37]"
            >
              🛒
            </Link>

          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-black">

        <div className="mx-auto max-w-7xl px-5 py-20 text-center sm:py-28">

          <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
            Welcome to GoldMart
          </p>

          <h1 className="text-4xl font-black leading-tight text-white sm:text-6xl">

            Everything You Need.

            <br />

            <span className="text-[#D4AF37]">
              All in One Place.
            </span>

          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-gray-300">
            Shop phones, electronics,
            fashion, cosmetics,
            groceries and thousands
            of products from trusted
            sellers.
          </p>

          {/* HERO SEARCH */}
          <div className="mx-auto mt-8 flex max-w-2xl overflow-hidden rounded-full bg-white p-1">

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  handleSearch();
                }
              }}
              placeholder="What are you looking for?"
              className="min-w-0 flex-1 px-5 py-3 text-black outline-none"
            />

            <button
              type="button"
              onClick={handleSearch}
              className="rounded-full bg-[#D4AF37] px-6 font-bold text-black transition hover:bg-white"
            >
              Search
            </button>

          </div>

          <Link
            href="/shop"
            className="mt-6 inline-block rounded-full border border-[#D4AF37] px-8 py-3 font-bold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black"
          >
            Start Shopping →
          </Link>

        </div>
      </section>

      {/* CATEGORIES */}
      <section
        id="categories"
        className="mx-auto max-w-7xl px-4 py-14"
      >

        <div className="mb-8">

          <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
            Explore
          </p>

          <h2 className="mt-1 text-3xl font-black">
            Shop by Category
          </h2>

        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">

          {categories.map(
            (category) => (
              <button
                key={category.name}
                type="button"
                onClick={() =>
                  handleCategory(
                    category.name
                  )
                }
                className="rounded-2xl border border-gray-200 p-5 text-center transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
              >

                <div className="text-4xl">
                  {
                    category.icon
                  }
                </div>

                <p className="mt-3 text-sm font-bold">
                  {
                    category.name
                  }
                </p>

              </button>
            )
          )}

        </div>
      </section>

      {/* PRODUCTS */}
      <section
        id="products"
        className="bg-gray-50 px-4 py-14"
      >

        <div className="mx-auto max-w-7xl">

          <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
            GoldMart Picks
          </p>

          <div className="mt-1 flex items-center justify-between">

            <h2 className="text-3xl font-black">
              Featured Products
            </h2>

            <Link
              href="/shop"
              className="text-sm font-bold text-[#A67C00]"
            >
              View all →
            </Link>

          </div>

          {/* LOADING */}
          {loadingProducts && (
            <div className="mt-8 rounded-2xl border bg-white p-10 text-center">

              <div className="text-4xl">
                📦
              </div>

              <p className="mt-3 font-bold">
                Loading products...
              </p>

            </div>
          )}

          {/* NO PRODUCTS */}
          {!loadingProducts &&
            products.length ===
              0 && (
              <div className="mt-8 rounded-2xl border bg-white p-10 text-center">

                <div className="text-4xl">
                  📦
                </div>

                <p className="mt-3 font-bold">
                  No products available
                  yet.
                </p>

              </div>
            )}

          {/* PRODUCT GRID */}
          {!loadingProducts &&
            products.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">

                {products
                  .slice(0, 8)
                  .map(
                    (product) => (
                      <article
                        key={
                          product.id
                        }
                        className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
                      >

                        {/* IMAGE */}
                        <Link
                          href={`/product/${product.id}`}
                        >
                          <div className="relative h-40 bg-gray-100">

                            {product.image_url ? (
                              <Image
                                src={
                                  product.image_url
                                }
                                alt={
                                  product.name
                                }
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 50vw, 25vw"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-5xl">
                                📦
                              </div>
                            )}

                          </div>
                        </Link>

                        {/* DETAILS */}
                        <div className="p-4">

                          <p className="text-xs font-semibold uppercase text-[#A67C00]">
                            {
                              product.category_name ||
                              "Uncategorized"
                            }
                          </p>

                          <Link
                            href={`/product/${product.id}`}
                          >
                            <h3 className="mt-1 font-bold hover:text-[#A67C00]">
                              {
                                product.name
                              }
                            </h3>
                          </Link>

                          {product.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                              {
                                product.description
                              }
                            </p>
                          )}

                          <div className="mt-3 flex items-center justify-between">

                            <span className="font-black text-[#A67C00]">
                              {formatPrice(
                                product.price,
                                product.currency
                              )}
                            </span>

                            <span className="text-sm">
                              ⭐{" "}
                              {Number(
                                product.rating ||
                                  0
                              ).toFixed(
                                1
                              )}
                            </span>

                          </div>

                          <AddToCartButton
                            product={{
                              id: product.id,
                              name: product.name,
                              price:
                                formatPrice(
                                  product.price,
                                  product.currency
                                ),
                              image:
                                product.image_url ||
                                "/images/placeholder.png",
                            }}
                          />

                        </div>

                      </article>
                    )
                  )}

              </div>
            )}

        </div>
      </section>

      {/* DEALS */}
      <section
        id="deals"
        className="mx-auto max-w-7xl px-4 py-14"
      >

        <div className="rounded-3xl bg-black p-8 text-white sm:p-12">

          <p className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]">
            GoldMart Deals
          </p>

          <h2 className="mt-3 text-3xl font-black sm:text-4xl">
            Great products.
            <br />
            Better prices.
          </h2>

          <p className="mt-4 max-w-xl text-gray-400">
            Discover special offers
            and deals from trusted
            GoldMart sellers.
          </p>

          <Link
            href="/shop"
            className="mt-6 inline-block rounded-full bg-[#D4AF37] px-7 py-3 font-bold text-black"
          >
            Explore Deals
          </Link>

        </div>
      </section>

      {/* TRUST */}
      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-14 sm:grid-cols-3">

        <div className="rounded-2xl border p-6">

          <div className="text-3xl">
            🔒
          </div>

          <h3 className="mt-3 font-bold">
            Secure Shopping
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Your account and
            transactions are protected.
          </p>

        </div>

        <div className="rounded-2xl border p-6">

          <div className="text-3xl">
            🚚
          </div>

          <h3 className="mt-3 font-bold">
            Reliable Delivery
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Shop from sellers and
            receive your orders safely.
          </p>

        </div>

        <div className="rounded-2xl border p-6">

          <div className="text-3xl">
            ⭐
          </div>

          <h3 className="mt-3 font-bold">
            Trusted Marketplace
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Discover products from
            trusted sellers.
          </p>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="bg-black px-4 py-12 text-white">

        <div className="mx-auto max-w-7xl">

          <div className="text-3xl font-black">
            Gold
            <span className="text-[#D4AF37]">
              Mart
            </span>
          </div>

          <p className="mt-3 max-w-md text-sm text-gray-400">
            Everything you need,
            all in one place.
          </p>

          <div className="mt-10 border-t border-gray-800 pt-6 text-sm text-gray-500">
            © 2026 GoldMart.
            All rights reserved.
          </div>

        </div>

      </footer>

    </main>
  );
        }
