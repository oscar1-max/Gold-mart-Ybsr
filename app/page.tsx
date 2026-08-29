"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AddToCartButton from "../components/AddToCartButton";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

const categories = [
  {
    icon: "✨",
    name: "All",
    value: "",
  },
  {
    icon: "📱",
    name: "Phones",
    value: "Phones",
  },
  {
    icon: "💻",
    name: "Electronics",
    value: "Electronics",
  },
  {
    icon: "🎮",
    name: "Gaming",
    value: "Gaming",
  },
  {
    icon: "👕",
    name: "Fashion",
    value: "Fashion",
  },
  {
    icon: "💄",
    name: "Beauty",
    value: "Beauty & Cosmetics",
  },
  {
    icon: "🛒",
    name: "Groceries",
    value: "Groceries",
  },
  {
    icon: "🏠",
    name: "Home",
    value: "Home & Kitchen",
  },
];

const shoppingTabs = [
  "All",
  "Deals",
  "5-Star Rated",
  "Best Selling",
  "New Arrivals",
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

  const [activeCategory, setActiveCategory] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("All");

  // =====================================================
  // LOAD USER
  // =====================================================

  useEffect(() => {
    const savedUser =
      localStorage.getItem(
        "goldmart_user"
      );

    if (!savedUser) {
      return;
    }

    try {
      setUser(
        JSON.parse(savedUser)
      );
    } catch {
      setUser(null);
    }
  }, []);

  // =====================================================
  // LOAD PRODUCTS
  // =====================================================

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoadingProducts(true);

        const response =
          await fetch(
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

  // =====================================================
  // SEARCH
  // =====================================================

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

  // =====================================================
  // CATEGORY
  // =====================================================

  function handleCategory(
    category: string
  ) {
    setActiveCategory(category);

    if (!category) {
      window.location.href =
        "/shop";
      return;
    }

    window.location.href =
      `/shop?category=${encodeURIComponent(
        category
      )}`;
  }

  // =====================================================
  // PRICE FORMAT
  // =====================================================

  function formatPrice(
    price: string | number,
    currency?: string | null
  ) {
    const amount =
      Number(price);

    if (
      !Number.isFinite(amount)
    ) {
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

  // =====================================================
  // FILTER PRODUCTS
  // =====================================================

  const displayedProducts =
    useMemo(() => {
      let result = [
        ...products,
      ];

      if (
        activeCategory
      ) {
        result =
          result.filter(
            (product) =>
              product.category_name
                ?.toLowerCase()
                .includes(
                  activeCategory.toLowerCase()
                )
          );
      }

      if (
        activeTab ===
        "5-Star Rated"
      ) {
        result =
          result.filter(
            (product) =>
              Number(
                product.rating || 0
              ) >= 5
          );
      }

      if (
        activeTab ===
        "Best Selling"
      ) {
        result =
          [...result].sort(
            (a, b) =>
              Number(
                b.rating || 0
              ) -
              Number(
                a.rating || 0
              )
          );
      }

      if (
        activeTab ===
        "New Arrivals"
      ) {
        result =
          [...result].reverse();
      }

      if (
        activeTab ===
        "Deals"
      ) {
        result =
          result.filter(
            (product) =>
              Number(
                product.price
              ) > 0
          );
      }

      return result;
    }, [
      products,
      activeCategory,
      activeTab,
    ]);

  return (
    <main className="min-h-screen bg-white text-black">

      {/* =====================================================
          TOP NAVIGATION
          ===================================================== */}

      <nav className="sticky top-0 z-50 border-b border-black/10 bg-white/95 shadow-sm backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">

          {/* LOGO */}
          <Link
            href="/"
            className="shrink-0"
          >
            <div className="text-2xl font-black tracking-tight sm:text-3xl">

              Gold

              <span className="bg-gradient-to-r from-[#8A6510] via-[#D4AF37] to-[#F5D76E] bg-clip-text text-transparent">
                Mart
              </span>

            </div>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <div className="hidden items-center gap-7 lg:flex">

            <Link
              href="/"
              className="text-sm font-bold transition hover:text-[#A67C00]"
            >
              Home
            </Link>

            <Link
              href="/shop"
              className="text-sm font-bold transition hover:text-[#A67C00]"
            >
              Shop
            </Link>

            <a
              href="#categories"
              className="text-sm font-bold transition hover:text-[#A67C00]"
            >
              Categories
            </a>

            <a
              href="#deals"
              className="text-sm font-bold transition hover:text-[#A67C00]"
            >
              Deals
            </a>

          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2">

            {/* SEARCH */}
            <Link
              href="/shop"
              aria-label="Search products"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-base transition hover:border-[#D4AF37] hover:bg-[#F8F7F3]"
            >
              🔍
            </Link>

            {/* NOTIFICATIONS */}
            {user && (
              <Link
                href="/notifications"
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-base transition hover:border-[#D4AF37] hover:bg-[#F8F7F3]"
              >
                🔔
              </Link>
            )}

            {/* ACCOUNT */}
            {user ? (
              <Link
                href="/account"
                aria-label="Account"
                className="flex h-10 items-center justify-center rounded-full border border-black/10 bg-white px-3 text-sm font-bold transition hover:border-[#D4AF37] hover:bg-[#F8F7F3]"
              >
                👤
                <span className="ml-1 hidden xl:inline">
                  Account
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-full border border-black/10 px-4 py-2 text-sm font-bold transition hover:border-[#D4AF37] md:block"
              >
                Sign In
              </Link>
            )}

            {/* CART */}
            <Link
              href="/cart"
              aria-label="Shopping cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-base transition hover:border-[#D4AF37] hover:bg-[#F8F7F3]"
            >
              🛒

              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-[#9A7617] via-[#D4AF37] to-[#F5D76E] px-1 text-[8px] font-black text-black">
                +
              </span>

            </Link>

          </div>

        </div>

      </nav>

      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="relative overflow-hidden bg-black">

        {/* GOLD LIGHT */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#D4AF37]/20 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-24">

          <div className="max-w-3xl">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#F5D76E]">

              ✦ The GoldMart Marketplace

            </div>

            <h1 className="text-4xl font-black leading-[1.05] text-white sm:text-6xl lg:text-7xl">

              Everything you want.

              <br />

              <span className="bg-gradient-to-r from-[#9A7617] via-[#F5D76E] to-[#D4AF37] bg-clip-text text-transparent">
                One marketplace.
              </span>

            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-gray-300 sm:text-base sm:leading-7">
              Discover products from trusted
              sellers and shop a growing
              marketplace designed for the
              modern world.
            </p>

            {/* HERO SEARCH */}
            <div className="mt-7 flex max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-white p-1.5 shadow-2xl sm:rounded-full">

              <span className="flex items-center pl-3 text-gray-400">
                🔍
              </span>

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
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-black outline-none placeholder:text-gray-400"
              />

              {/* CAMERA */}
              <Link
                href="/visual-search"
                aria-label="Visual search"
                className="mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F8F7F3] text-lg transition hover:bg-[#F8E7A8] sm:rounded-full"
              >
                📷
              </Link>

              <button
                type="button"
                onClick={handleSearch}
                className="rounded-xl bg-gradient-to-r from-[#9A7617] via-[#D4AF37] to-[#F5D76E] px-5 text-xs font-black text-black transition hover:scale-[1.01] sm:rounded-full sm:px-7 sm:text-sm"
              >
                Search
              </button>

            </div>

            <div className="mt-5 flex flex-wrap gap-3">

              <Link
                href="/shop"
                className="rounded-full bg-gradient-to-r from-[#9A7617] via-[#D4AF37] to-[#F5D76E] px-6 py-3 text-xs font-black text-black shadow-lg shadow-[#D4AF37]/20 transition hover:scale-[1.02]"
              >
                Start Shopping →
              </Link>

              <Link
                href="/shop"
                className="rounded-full border border-white/20 px-6 py-3 text-xs font-black text-white transition hover:border-[#D4AF37] hover:text-[#F5D76E]"
              >
                Explore Marketplace
              </Link>

            </div>

          </div>

        </div>

      </section>
            {/* =====================================================
          CATEGORY STRIP
          ===================================================== */}

      <section
        id="categories"
        className="border-b border-black/5 bg-white"
      >

        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">

          <div className="mb-5 flex items-end justify-between">

            <div>

              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#A67C00]">
                Explore
              </p>

              <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                Shop by Category
              </h2>

            </div>

            <Link
              href="/shop"
              className="text-xs font-black text-[#9A7617] transition hover:text-black sm:text-sm"
            >
              View all →
            </Link>

          </div>

          <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">

            <div className="flex min-w-max gap-3">

              {categories.map(
                (category) => {

                  const active =
                    activeCategory ===
                    category.value;

                  return (
                    <button
                      key={
                        category.name
                      }
                      type="button"
                      onClick={() =>
                        handleCategory(
                          category.value
                        )
                      }
                      className={`group flex min-w-[92px] flex-col items-center justify-center rounded-2xl border px-4 py-4 transition duration-300 ${
                        active
                          ? "border-[#D4AF37] bg-black text-white shadow-lg"
                          : "border-black/10 bg-white hover:-translate-y-0.5 hover:border-[#D4AF37] hover:shadow-md"
                      }`}
                    >

                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-full text-xl ${
                          active
                            ? "bg-gradient-to-br from-[#9A7617] via-[#D4AF37] to-[#F5D76E]"
                            : "bg-[#F8F7F3]"
                        }`}
                      >
                        {category.icon}
                      </span>

                      <span
                        className={`mt-2 whitespace-nowrap text-[10px] font-black ${
                          active
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        {category.name}
                      </span>

                    </button>
                  );
                }
              )}

            </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          PROMOTIONAL BENEFITS
          ===================================================== */}

      <section className="bg-[#F8F7F3]">

        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">

          <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

            <div className="flex min-w-max items-center gap-5 px-5 py-4">

              <div className="flex items-center gap-2">

                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F8E7A8] text-xs">
                  ✓
                </span>

                <span className="text-xs font-bold">
                  Free shipping
                </span>

              </div>

              <div className="h-5 w-px bg-gray-200" />

              <div className="flex items-center gap-2">

                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F8E7A8] text-xs">
                  ✓
                </span>

                <span className="text-xs font-bold">
                  Secure payment
                </span>

              </div>

              <div className="h-5 w-px bg-gray-200" />

              <div className="flex items-center gap-2">

                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F8E7A8] text-xs">
                  ✓
                </span>

                <span className="text-xs font-bold">
                  Trusted sellers
                </span>

              </div>

              <div className="h-5 w-px bg-gray-200" />

              <div className="flex items-center gap-2">

                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F8E7A8] text-xs">
                  ✓
                </span>

                <span className="text-xs font-bold">
                  Reliable delivery
                </span>

              </div>

              <div className="h-5 w-px bg-gray-200" />

              <Link
                href="/shop"
                className="text-xs font-black text-[#9A7617] hover:text-black"
              >
                More →
              </Link>

            </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          DISCOVERY TABS
          ===================================================== */}

      <section className="bg-[#F8F7F3] px-4 pb-4 pt-7 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-7xl">

          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#A67C00]">
            Discover
          </p>

          <h2 className="mt-1 text-2xl font-black sm:text-3xl">
            Find your next favorite
          </h2>

          <div className="-mx-4 mt-5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">

            <div className="flex min-w-max gap-2">

              {shoppingTabs.map(
                (tab) => {

                  const active =
                    activeTab ===
                    tab;

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          tab
                        )
                      }
                      className={`rounded-full px-5 py-2.5 text-xs font-black transition ${
                        active
                          ? "bg-gradient-to-r from-[#9A7617] via-[#D4AF37] to-[#F5D76E] text-black shadow-md"
                          : "border border-black/10 bg-white text-gray-600 hover:border-[#D4AF37] hover:text-black"
                      }`}
                    >
                      {tab}
                    </button>
                  );
                }
              )}

            </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          FEATURED PRODUCTS
          ===================================================== */}

      <section
        id="products"
        className="bg-[#F8F7F3] px-4 pb-12 pt-5 sm:px-6 sm:pb-16 lg:px-8"
      >

        <div className="mx-auto max-w-7xl">

          <div className="mb-6 flex items-end justify-between">

            <div>

              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#A67C00]">
                Handpicked for you
              </p>

              <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                Featured products
              </h2>

            </div>

            <Link
              href="/shop"
              className="text-xs font-black text-[#9A7617] transition hover:text-black sm:text-sm"
            >
              See all →
            </Link>

          </div>

          {/* LOADING */}
          {loadingProducts && (
            <div className="rounded-3xl border border-black/5 bg-white p-10 text-center shadow-sm">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F8E7A8]/50 text-2xl">
                📦
              </div>

              <p className="mt-4 text-sm font-black">
                Loading products...
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Finding something great for you.
              </p>

            </div>
          )}

          {/* NO PRODUCTS */}
          {!loadingProducts &&
            displayedProducts.length ===
              0 && (
              <div className="rounded-3xl border border-black/5 bg-white p-10 text-center shadow-sm">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F8E7A8]/50 text-2xl">
                  📦
                </div>

                <p className="mt-4 text-sm font-black">
                  No products available yet.
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Check back soon for new products.
                </p>

                <Link
                  href="/shop"
                  className="mt-5 inline-flex rounded-full bg-black px-6 py-3 text-xs font-black text-white transition hover:bg-[#D4AF37] hover:text-black"
                >
                  Browse Marketplace
                </Link>

              </div>
            )}

          {/* PRODUCT GRID */}
          {!loadingProducts &&
            displayedProducts.length >
              0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">

                {displayedProducts.map(
                  (product) => {

                    const rating =
                      Number(
                        product.rating || 0
                      );

                    const inStock =
                      Number(
                        product.stock
                      ) > 0;

                    return (
                      <article
                        key={
                          product.id
                        }
                        className="group overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:shadow-xl sm:rounded-3xl"
                      >

                        {/* IMAGE */}
                        <Link
                          href={`/product/${product.id}`}
                          className="block"
                        >

                          <div className="relative aspect-square overflow-hidden bg-[#F5F4F0]">

                            {product.image_url ? (
                              <Image
                                src={
                                  product.image_url
                                }
                                alt={
                                  product.name
                                }
                                fill
                                className="object-cover transition duration-500 group-hover:scale-105"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-5xl">
                                📦
                              </div>
                            )}

                            <div className="absolute left-2 top-2 rounded-full bg-black/90 px-2 py-1 text-[8px] font-black text-[#F5D76E] sm:left-3 sm:top-3 sm:px-2.5">
                              GoldMart
                            </div>

                            <div
                              className={`absolute bottom-2 left-2 rounded-full px-2 py-1 text-[8px] font-black sm:bottom-3 sm:left-3 ${
                                inStock
                                  ? "bg-white/90 text-black"
                                  : "bg-red-500 text-white"
                              }`}
                            >
                              {inStock
                                ? "In stock"
                                : "Out of stock"}
                            </div>

                          </div>

                        </Link>

                        {/* DETAILS */}
                        <div className="p-3 sm:p-4">

                          <p className="truncate text-[9px] font-black uppercase tracking-wider text-[#9A7617]">
                            {product.category_name ||
                              "Marketplace"}
                          </p>

                          <Link
                            href={`/product/${product.id}`}
                          >
                            <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-black leading-5 transition hover:text-[#9A7617] sm:text-base">
                              {product.name}
                            </h3>
                          </Link>

                          {product.description && (
                            <p className="mt-1 hidden line-clamp-2 text-xs leading-5 text-gray-500 sm:block">
                              {product.description}
                            </p>
                          )}

                          <div className="mt-2 flex items-center gap-1">

                            <span className="text-[11px]">
                              ⭐
                            </span>

                            <span className="text-[10px] font-black text-gray-700 sm:text-xs">
                              {rating.toFixed(1)}
                            </span>

                            <span className="text-[9px] text-gray-400">
                              / 5
                            </span>

                          </div>

                          <div className="mt-2">

                            <span className="bg-gradient-to-r from-[#8A6510] via-[#D4AF37] to-[#9A7617] bg-clip-text text-base font-black text-transparent sm:text-lg">
                              {formatPrice(
                                product.price,
                                product.currency
                              )}
                            </span>

                          </div>

                          <div className="mt-3">

                            <AddToCartButton
                              product={{
                                id:
                                  product.id,
                                name:
                                  product.name,
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

                        </div>

                      </article>
                    );
                  }
                )}

              </div>
            )}

          {!loadingProducts &&
            products.length > 8 && (
              <div className="mt-8 text-center">

                <Link
                  href="/shop"
                  className="inline-flex rounded-full border border-black/10 bg-white px-7 py-3 text-xs font-black transition hover:border-[#D4AF37] hover:bg-[#D4AF37]"
                >
                  View all products →
                </Link>

              </div>
            )}

        </div>
      </section>
            {/* =====================================================
          GOLDMART EXCLUSIVE DEALS
          ===================================================== */}

      <section
        id="deals"
        className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">

          <div className="relative overflow-hidden rounded-[2rem] bg-black p-7 shadow-2xl sm:p-10 lg:p-14">

            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#D4AF37]/20 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl" />

            <div className="relative max-w-2xl">

              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-[#F5D76E]">
                ✦ GoldMart Exclusive
              </div>

              <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                Great products.
                <br />
                <span className="bg-gradient-to-r from-[#9A7617] via-[#F5D76E] to-[#D4AF37] bg-clip-text text-transparent">
                  Better shopping.
                </span>
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-6 text-gray-400 sm:text-base">
                Explore the GoldMart marketplace
                and discover products from sellers
                around the world.
              </p>

              <Link
                href="/shop"
                className="mt-6 inline-flex rounded-full bg-gradient-to-r from-[#9A7617] via-[#D4AF37] to-[#F5D76E] px-7 py-3.5 text-sm font-black text-black shadow-lg shadow-[#D4AF37]/20 transition hover:scale-[1.02]"
              >
                Explore Marketplace →
              </Link>

            </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          WHY GOLDMART
          ===================================================== */}

      <section className="bg-[#F8F7F3] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">

        <div className="mx-auto max-w-7xl">

          <div className="mb-7 text-center">

            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#A67C00]">
              Why GoldMart
            </p>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              Shop with confidence
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-500">
              A modern marketplace built around
              convenient shopping, trusted sellers
              and a better customer experience.
            </p>

          </div>

          <div className="grid gap-3 sm:grid-cols-3 sm:gap-5">

            <div className="group rounded-3xl border border-black/5 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:shadow-xl sm:p-7">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-xl transition group-hover:bg-[#D4AF37]">
                🔒
              </div>

              <h3 className="mt-4 font-black">
                Secure Shopping
              </h3>

              <p className="mt-2 text-xs leading-5 text-gray-500 sm:text-sm">
                Your GoldMart account and shopping
                experience are designed with security
                in mind.
              </p>

            </div>

            <div className="group rounded-3xl border border-black/5 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:shadow-xl sm:p-7">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-xl transition group-hover:bg-[#D4AF37]">
                🚚
              </div>

              <h3 className="mt-4 font-black">
                Reliable Delivery
              </h3>

              <p className="mt-2 text-xs leading-5 text-gray-500 sm:text-sm">
                Shop products from marketplace sellers
                and manage your orders through GoldMart.
              </p>

            </div>

            <div className="group rounded-3xl border border-black/5 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:shadow-xl sm:p-7">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-xl transition group-hover:bg-[#D4AF37]">
                ⭐
              </div>

              <h3 className="mt-4 font-black">
                Trusted Sellers
              </h3>

              <p className="mt-2 text-xs leading-5 text-gray-500 sm:text-sm">
                Discover products from sellers and
                explore ratings as the marketplace grows.
              </p>

            </div>

          </div>

        </div>

      </section>
            {/* =====================================================
          SELL ON GOLDMART
          ===================================================== */}

      {!user && (
        <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">

          <div className="mx-auto max-w-7xl">

            <div className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-white p-7 shadow-sm sm:p-10">

              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D4AF37]/15 blur-3xl" />

              <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                <div className="max-w-2xl">

                  <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-[#9A7617]">
                    ✦ Grow with GoldMart
                  </div>

                  <h2 className="mt-4 text-2xl font-black sm:text-3xl">
                    Have something to sell?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Join the GoldMart marketplace
                    and build your online store.
                  </p>

                </div>

                <Link
                  href="/register"
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-black px-7 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-[#D4AF37] hover:text-black"
                >
                  Create your account →
                </Link>

              </div>

            </div>

          </div>

        </section>
      )}

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="bg-black px-4 pb-24 pt-12 text-white md:pb-10 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-7xl">

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

            {/* BRAND */}
            <div className="sm:col-span-2 lg:col-span-1">

              <Link
                href="/"
                className="inline-block"
              >

                <div className="text-3xl font-black tracking-tight">
                  Gold
                  <span className="bg-gradient-to-r from-[#9A7617] via-[#F5D76E] to-[#D4AF37] bg-clip-text text-transparent">
                    Mart
                  </span>
                </div>

              </Link>

              <p className="mt-3 max-w-xs text-sm leading-6 text-gray-400">
                A modern marketplace for
                discovering products from
                trusted sellers.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#F5D76E]">
                ✦ Shop the world
              </div>

            </div>

            {/* SHOP */}
            <div>

              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#F5D76E]">
                Shop
              </h3>

              <div className="mt-4 space-y-3">

                <Link
                  href="/shop"
                  className="block text-sm text-gray-400 transition hover:text-white"
                >
                  Marketplace
                </Link>

                <a
                  href="#categories"
                  className="block text-sm text-gray-400 transition hover:text-white"
                >
                  Categories
                </a>

                <a
                  href="#deals"
                  className="block text-sm text-gray-400 transition hover:text-white"
                >
                  Deals
                </a>

                <Link
                  href="/cart"
                  className="block text-sm text-gray-400 transition hover:text-white"
                >
                  Cart
                </Link>

              </div>

            </div>

            {/* ACCOUNT */}
            <div>

              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#F5D76E]">
                Account
              </h3>

              <div className="mt-4 space-y-3">

                {user ? (
                  <>
                    <Link
                      href="/account"
                      className="block text-sm text-gray-400 transition hover:text-white"
                    >
                      My Account
                    </Link>

                    <Link
                      href="/orders"
                      className="block text-sm text-gray-400 transition hover:text-white"
                    >
                      My Orders
                    </Link>

                    <Link
                      href="/notifications"
                      className="block text-sm text-gray-400 transition hover:text-white"
                    >
                      Notifications
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block text-sm text-gray-400 transition hover:text-white"
                    >
                      Sign In
                    </Link>

                    <Link
                      href="/register"
                      className="block text-sm text-gray-400 transition hover:text-white"
                    >
                      Create Account
                    </Link>
                  </>
                )}

              </div>

            </div>

          </div>

        </div>
      </footer>
            {/* =====================================================
          MOBILE BOTTOM NAVIGATION
          ===================================================== */}

      <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-black/10 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl md:hidden">

        <div className="mx-auto flex max-w-md items-center justify-around">

          {/* HOME */}
          <Link
            href="/"
            className="flex min-w-[64px] flex-col items-center gap-1 py-3 text-[#A67C00]"
          >
            <span className="text-xl">
              🏠
            </span>

            <span className="text-[9px] font-black">
              Home
            </span>
          </Link>

          {/* CATEGORIES */}
          <Link
            href="/shop"
            className="flex min-w-[64px] flex-col items-center gap-1 py-3 text-gray-500 transition hover:text-[#A67C00]"
          >
            <span className="text-xl">
              ☷
            </span>

            <span className="text-[9px] font-black">
              Categories
            </span>
          </Link>

          {/* YOU */}
          <Link
            href={
              user
                ? "/account"
                : "/login"
            }
            className="flex min-w-[64px] flex-col items-center gap-1 py-3 text-gray-500 transition hover:text-[#A67C00]"
          >
            <span className="text-xl">
              👤
            </span>

            <span className="text-[9px] font-black">
              You
            </span>
          </Link>

          {/* CART */}
          <Link
            href="/cart"
            className="relative flex min-w-[64px] flex-col items-center gap-1 py-3 text-gray-500 transition hover:text-[#A67C00]"
          >
            <span className="relative text-xl">

              🛒

              <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D4AF37] px-1 text-[8px] font-black text-black">
                +
              </span>

            </span>

            <span className="text-[9px] font-black">
              Cart
            </span>

          </Link>

        </div>

      </div>

    </main>
  );
            }
