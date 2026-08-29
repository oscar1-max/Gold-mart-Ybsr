"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AddToCartButton from "../components/AddToCartButton";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

const categories = [
  { icon: "✨", name: "All", value: "" },
  { icon: "📱", name: "Phones", value: "Phones" },
  { icon: "💻", name: "Electronics", value: "Electronics" },
  { icon: "🎮", name: "Gaming", value: "Gaming" },
  { icon: "👕", name: "Fashion", value: "Fashion" },
  { icon: "💄", name: "Beauty", value: "Beauty & Cosmetics" },
  { icon: "🛒", name: "Groceries", value: "Groceries" },
  { icon: "🏠", name: "Home", value: "Home & Kitchen" },
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
  const [user, setUser] = useState<User | null>(null);

  const [products, setProducts] = useState<Product[]>([]);

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [search, setSearch] = useState("");

  const [activeCategory, setActiveCategory] =
    useState("All");

  const [activeTab, setActiveTab] =
    useState("All");

  /*
   * LOAD USER
   *
   * We keep the existing GoldMart authentication
   * storage exactly as it was.
   */
  useEffect(() => {
    const savedUser =
      localStorage.getItem("goldmart_user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  /*
   * LOAD PRODUCTS
   *
   * Existing backend endpoint is preserved.
   */
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoadingProducts(true);

        const response = await fetch(
          `${API_URL}/api/products`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
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
          Array.isArray(data.products)
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

  /*
   * SEARCH
   *
   * Keeps the existing /shop search behaviour.
   */
  function handleSearch() {
    const query = search.trim();

    if (!query) {
      window.location.href = "/shop";
      return;
    }

    window.location.href =
      `/shop?search=${encodeURIComponent(
        query
      )}`;
  }

  /*
   * CATEGORY
   *
   * Keeps the existing /shop?category=...
   * behaviour.
   */
  function handleCategory(
    category: string
  ) {
    setActiveCategory(
      category || "All"
    );

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

  /*
   * PRICE FORMATTER
   */
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

  /*
   * PRODUCT FILTERING
   *
   * This only changes what is displayed on the
   * homepage. It does NOT change the backend.
   */
  const visibleProducts = useMemo(() => {
    let result = [...products];

    if (
      activeCategory !== "All"
    ) {
      result = result.filter(
        (product) =>
          product.category_name
            ?.toLowerCase()
            .includes(
              activeCategory.toLowerCase()
            )
      );
    }

    if (
      activeTab === "5-Star Rated"
    ) {
      result = result.filter(
        (product) =>
          Number(product.rating || 0) >= 5
      );
    }

    if (
      activeTab === "Best Selling"
    ) {
      /*
       * Your current product API does not
       * provide a sold-count field.
       *
       * Therefore we don't invent one.
       * Products remain in their backend order.
       */
      result = result;
    }

    if (
      activeTab === "Deals"
    ) {
      /*
       * Your current API does not provide
       * discount/old-price information.
       *
       * We leave the products intact until
       * real discount data is available.
       */
      result = result;
    }

    if (
      activeTab === "New Arrivals"
    ) {
      /*
       * No created_at field is currently
       * available in this Product type.
       *
       * We therefore preserve backend order.
       */
      result = result;
    }

    return result;
  }, [
    products,
    activeCategory,
    activeTab,
  ]);

  const displayedProducts =
    visibleProducts.slice(0, 8);

  return (
    <main className="min-h-screen bg-white pb-20 text-black md:pb-0">

      {/* =====================================================
          PREMIUM NAVBAR
          ===================================================== */}

      <nav className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">

          {/* LOGO */}
          <Link
            href="/"
            className="shrink-0"
          >
            <div className="text-2xl font-black tracking-tight sm:text-3xl">
              Gold
              <span className="text-[#D4AF37]">
                Mart
              </span>
            </div>

            <div className="hidden text-[9px] font-bold uppercase tracking-[0.28em] text-gray-400 sm:block">
              Shop the world
            </div>
          </Link>

          {/* DESKTOP NAV */}
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

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-2">

            {/* SEARCH */}
            <Link
              href="/shop"
              aria-label="Search products"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-lg transition hover:border-[#D4AF37] hover:bg-[#D4AF37]"
            >
              🔍
            </Link>

            {/* NOTIFICATIONS */}
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-lg transition hover:border-[#D4AF37] hover:bg-[#D4AF37]"
            >
              🔔

              {user && (
                <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-[#D4AF37] ring-2 ring-white" />
              )}
            </Link>

            {/* SELLER / ADMIN / SIGN IN */}
            {user?.role === "seller" ? (
              <Link
                href="/seller"
                className="hidden rounded-full bg-black px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#D4AF37] hover:text-black sm:block"
              >
                🏪 Seller Dashboard
              </Link>
            ) : user?.role === "admin" ? (
              <Link
                href="/admin"
                className="hidden rounded-full bg-black px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#D4AF37] hover:text-black sm:block"
              >
                ⚙️ Admin
              </Link>
            ) : user ? (
              <Link
                href="/become-seller"
                className="hidden rounded-full bg-black px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#D4AF37] hover:text-black sm:block"
              >
                🏪 Sell on GoldMart
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-full border border-black/10 px-4 py-2.5 text-xs font-black transition hover:border-[#D4AF37] hover:bg-[#D4AF37] sm:block"
              >
                Sign In
              </Link>
            )}

            {/* ACCOUNT */}
            {user && (
              <Link
                href="/account"
                aria-label="Account"
                className="flex h-10 items-center rounded-full border border-black/10 px-3 text-sm font-bold transition hover:border-[#D4AF37] hover:bg-[#D4AF37]"
              >
                👤
                <span className="ml-1 hidden xl:inline">
                  Account
                </span>
              </Link>
            )}

            {/* CART */}
            <Link
              href="/cart"
              aria-label="Shopping cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-lg transition hover:border-[#D4AF37] hover:bg-[#D4AF37]"
            >
              🛒

              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D4AF37] px-1 text-[9px] font-black text-black">
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

        {/* GOLD DECORATION */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#D4AF37]/20 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-24">

          <div className="max-w-4xl">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#D4AF37]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
              The GoldMart Marketplace
            </div>

            <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">

              Everything you want.

              <br />

              <span className="text-[#D4AF37]">
                One marketplace.
              </span>

            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-gray-300 sm:text-base sm:leading-7">
              Discover products from
              trusted sellers and shop
              a growing marketplace
              designed for the modern
              world.
            </p>

            {/* HERO SEARCH */}
            <div className="mt-7 flex max-w-3xl items-center rounded-2xl bg-white p-1.5 shadow-2xl shadow-black/30 sm:rounded-full">

              <span className="pl-3 text-lg sm:pl-5">
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
                aria-label="Search products"
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-black outline-none sm:px-4 sm:text-base"
              />

              {/* CAMERA VISUAL SEARCH ENTRY */}
              <Link
                href="/shop"
                aria-label="Visual search"
                className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg transition hover:bg-gray-100"
                title="Visual search"
              >
                📷
              </Link>

              <button
                type="button"
                onClick={handleSearch}
                className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-black text-black transition hover:bg-white sm:rounded-full sm:px-7"
              >
                Search
              </button>

            </div>

            {/* HERO BUTTONS */}
            <div className="mt-6 flex flex-wrap gap-3">

              <Link
                href="/shop"
                className="rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-black text-black transition hover:bg-white"
              >
                Start Shopping →
              </Link>

              <a
                href="#categories"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white transition hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
              >
                Explore Categories
              </a>

            </div>

          </div>

          {/* HERO TRUST STRIP */}
          <div className="mt-10 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 sm:mt-14 sm:grid-cols-4">

            <div>
              <p className="text-lg font-black text-white">
                🌍
              </p>
              <p className="mt-1 text-[11px] font-bold text-gray-400">
                Marketplace
              </p>
            </div>

            <div>
              <p className="text-lg font-black text-white">
                🔒
              </p>
              <p className="mt-1 text-[11px] font-bold text-gray-400">
                Secure shopping
              </p>
            </div>

            <div>
              <p className="text-lg font-black text-white">
                🚚
              </p>
              <p className="mt-1 text-[11px] font-bold text-gray-400">
                Reliable delivery
              </p>
            </div>

            <div>
              <p className="text-lg font-black text-white">
                ⭐
              </p>
              <p className="mt-1 text-[11px] font-bold text-gray-400">
                Trusted sellers
              </p>
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
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A67C00]">
                Explore
              </p>

              <h2 className="mt-0.5 text-lg font-black sm:text-xl">
                Shop by Category
              </h2>
            </div>

            <Link
              href="/shop"
              className="text-xs font-black text-[#A67C00] transition hover:text-black"
            >
              View all →
            </Link>
          </div>

          {/* HORIZONTAL CATEGORY SCROLLER */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">

            {categories.map(
              (category) => {
                const isActive =
                  activeCategory ===
                  (category.name ===
                  "All"
                    ? "All"
                    : category.name);

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
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold transition ${
                      isActive
                        ? "border-black bg-black text-white shadow-md"
                        : "border-black/10 bg-white text-black hover:border-[#D4AF37] hover:bg-[#D4AF37]"
                    }`}
                  >
                    <span className="text-base">
                      {
                        category.icon
                      }
                    </span>

                    {
                      category.name
                    }
                  </button>
                );
              }
            )}

          </div>
        </div>
      </section>

      {/* =====================================================
          PROMOTIONAL BENEFITS
          ===================================================== */}

      <section className="bg-[#F8F7F3]">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex gap-3 overflow-x-auto pb-1">

            <div className="flex min-w-max items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm ring-1 ring-black/5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D4AF37]/15 text-xs">
                ✓
              </span>

              <span className="text-xs font-bold">
                Free shipping
              </span>
            </div>

            <div className="flex min-w-max items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm ring-1 ring-black/5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D4AF37]/15 text-xs">
                ✓
              </span>

              <span className="text-xs font-bold">
                Secure payment
              </span>
            </div>

            <div className="flex min-w-max items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm ring-1 ring-black/5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D4AF37]/15 text-xs">
                ✓
              </span>

              <span className="text-xs font-bold">
                Trusted sellers
              </span>
            </div>

            <div className="flex min-w-max items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm ring-1 ring-black/5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D4AF37]/15 text-xs">
                ✓
              </span>

              <span className="text-xs font-bold">
                Reliable delivery
              </span>
            </div>

            <Link
              href="/shop"
              className="flex min-w-max items-center rounded-full bg-black px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#D4AF37] hover:text-black"
            >
              More →
            </Link>

          </div>
        </div>
      </section>

      {/* =====================================================
          SHOPPING TABS
          ===================================================== */}

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">

          <div className="flex items-end justify-between gap-4">

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A67C00]">
                Discover
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                Find your next favorite
              </h2>
            </div>

            <Link
              href="/shop"
              className="hidden text-sm font-black text-[#A67C00] sm:block"
            >
              Browse marketplace →
            </Link>

          </div>

          {/* TABS */}
          <div className="mt-5 flex gap-2 overflow-x-auto border-b border-black/10 pb-0 scrollbar-hide">

            {shoppingTabs.map(
              (tab) => {
                const isActive =
                  activeTab === tab;

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        tab
                      )
                    }
                    className={`relative shrink-0 px-3 pb-3 text-xs font-black transition sm:px-4 ${
                      isActive
                        ? "text-black"
                        : "text-gray-400 hover:text-black"
                    }`}
                  >
                    {tab}

                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#D4AF37]" />
                    )}
                  </button>
                );
              }
            )}

          </div>
        </div>
      </section>

      {/* =====================================================
          PRODUCT MARKETPLACE
          ===================================================== */}

      <section
        id="products"
        className="bg-white px-4 py-6 sm:px-6 sm:py-10 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">

          {/* SECTION HEADER */}
          <div className="mb-5 flex items-center justify-between">

            <div>
              <p className="text-xs font-bold text-gray-400">
                {activeTab === "All"
                  ? "Handpicked for you"
                  : activeTab}
              </p>

              <h3 className="mt-0.5 text-lg font-black sm:text-xl">
                {activeTab ===
                "Deals"
                  ? "Today's deals"
                  : activeTab ===
                    "5-Star Rated"
                  ? "Top rated"
                  : activeTab ===
                    "Best Selling"
                  ? "Popular picks"
                  : activeTab ===
                    "New Arrivals"
                  ? "Fresh arrivals"
                  : "Featured products"}
              </h3>
            </div>

            <Link
              href="/shop"
              className="rounded-full border border-black/10 px-4 py-2 text-xs font-black transition hover:border-[#D4AF37] hover:bg-[#D4AF37]"
            >
              See all
            </Link>

          </div>

          {/* LOADING STATE */}
          {loadingProducts && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">

              {Array.from({
                length: 8,
              }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl border border-black/5 bg-white"
                  >
                    <div className="h-44 animate-pulse bg-gray-100 sm:h-52" />

                    <div className="space-y-3 p-3">

                      <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />

                      <div className="h-4 w-full animate-pulse rounded bg-gray-100" />

                      <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />

                      <div className="h-7 w-1/2 animate-pulse rounded bg-gray-100" />

                    </div>
                  </div>
                )
              )}

            </div>
          )}

          {/* EMPTY STATE */}
          {!loadingProducts &&
            displayedProducts.length ===
              0 && (
              <div className="rounded-3xl border border-black/10 bg-[#F8F7F3] px-6 py-14 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black text-2xl">
                  📦
                </div>

                <h3 className="mt-5 text-lg font-black">
                  No products found
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                  We couldn't find products
                  for this selection yet.
                  Explore the full GoldMart
                  marketplace instead.
                </p>

                <Link
                  href="/shop"
                  className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm font-black text-white transition hover:bg-[#D4AF37] hover:text-black"
                >
                  Browse all products →
                </Link>

              </div>
            )}

          {/* =================================================
              PRODUCT GRID
              ================================================= */}

          {!loadingProducts &&
            displayedProducts.length >
              0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">

                {displayedProducts.map(
                  (product) => {

                    const rating =
                      Number(
                        product.rating ||
                          0
                      );

                    const stock =
                      Number(
                        product.stock || 0
                      );

                    const isLowStock =
                      stock > 0 &&
                      stock <= 5;

                    return (
                      <article
                        key={
                          product.id
                        }
                        className="group relative overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/50 hover:shadow-xl"
                      >

                        {/* PRODUCT IMAGE */}
                        <Link
                          href={`/product/${product.id}`}
                          className="block"
                        >
                          <div className="relative h-44 overflow-hidden bg-[#F5F5F3] sm:h-56">

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

                            {/* GOLDMART BADGE */}
                            <div className="absolute left-2 top-2 rounded-full bg-black px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#D4AF37] shadow-lg">
                              GoldMart
                            </div>

                            {/* STOCK BADGE */}
                            {isLowStock && (
                              <div className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-black text-black shadow">
                                Only {stock} left
                              </div>
                            )}

                          </div>
                        </Link>

                        {/* PRODUCT DETAILS */}
                        <div className="p-3 sm:p-4">

                          {/* CATEGORY */}
                          <p className="truncate text-[9px] font-black uppercase tracking-wider text-[#A67C00]">
                            {product.category_name ||
                              "Marketplace"}
                          </p>

                          {/* PRODUCT NAME */}
                          <Link
                            href={`/product/${product.id}`}
                          >
                            <h3 className="mt-1 line-clamp-2 min-h-[36px] text-sm font-bold leading-5 transition hover:text-[#A67C00] sm:text-[15px]">
                              {
                                product.name
                              }
                            </h3>
                          </Link>

                          {/* DESCRIPTION */}
                          {product.description && (
                            <p className="mt-1 line-clamp-1 text-[11px] text-gray-400">
                              {
                                product.description
                              }
                            </p>
                          )}

                          {/* RATING */}
                          <div className="mt-2 flex items-center gap-1">

                            <span className="text-[11px]">
                              ⭐
                            </span>

                            <span className="text-[11px] font-black">
                              {rating.toFixed(
                                1
                              )}
                            </span>

                            <span className="text-[10px] text-gray-400">
                              / 5
                            </span>

                          </div>

                          {/* PRICE */}
                          <div className="mt-2 flex items-end justify-between gap-2">

                            <span className="text-base font-black text-[#A67C00] sm:text-lg">
                              {formatPrice(
                                product.price,
                                product.currency
                              )}
                            </span>

                            {stock > 0 ? (
                              <span className="text-[9px] font-bold text-gray-400">
                                In stock
                              </span>
                            ) : (
                              <span className="text-[9px] font-black text-red-500">
                                Out of stock
                              </span>
                            )}

                          </div>

                          {/* ADD TO CART */}
                          <div className="mt-3">
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

                        </div>

                      </article>
                    );
                  }
                )}

              </div>
            )}

          {/* MOBILE VIEW ALL */}
          <div className="mt-6 text-center sm:hidden">

            <Link
              href="/shop"
              className="inline-flex rounded-full border border-black px-6 py-3 text-xs font-black transition hover:bg-black hover:text-white"
            >
              View all products →
            </Link>

          </div>

        </div>
      </section>

      {/* =====================================================
          FEATURED MARKETPLACE BANNER
          ===================================================== */}

      <section
        id="deals"
        className="px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">

          <div className="relative overflow-hidden rounded-[2rem] bg-black px-6 py-10 text-white shadow-2xl sm:px-10 sm:py-14">

            {/* DECORATIVE GOLD CIRCLES */}
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-[#D4AF37]/20" />

            <div className="pointer-events-none absolute -right-6 -top-10 h-44 w-44 rounded-full border border-[#D4AF37]/10" />

            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />

            <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">

              <div>

                <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                  <span>✦</span>
                  GoldMart Exclusive
                </div>

                <h2 className="mt-4 max-w-xl text-3xl font-black leading-tight sm:text-4xl">
                  Great products.
                  <br />
                  <span className="text-[#D4AF37]">
                    Better shopping.
                  </span>
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-6 text-gray-400">
                  Explore the GoldMart
                  marketplace and discover
                  products from sellers
                  around the world.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">

                  <Link
                    href="/shop"
                    className="rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-black text-black transition hover:bg-white"
                  >
                    Explore Marketplace →
                  </Link>

                  {!user && (
                    <Link
                      href="/register"
                      className="rounded-full border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
                    >
                      Join GoldMart
                    </Link>
                  )}

                </div>

              </div>

              {/* GOLDMARK */}
              <div className="hidden h-36 w-36 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 md:flex">

                <div className="text-center">

                  <div className="text-4xl font-black text-[#D4AF37]">
                    G
                  </div>

                  <div className="mt-1 text-[8px] font-black uppercase tracking-[0.25em] text-gray-400">
                    GoldMart
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      </section>
            {/* =====================================================
          TRUST & SERVICE
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

            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
              A modern marketplace built around
              convenient shopping, trusted sellers
              and a better customer experience.
            </p>

          </div>

          <div className="grid gap-3 sm:grid-cols-3 sm:gap-5">

            {/* SECURE */}
            <div className="group rounded-3xl border border-black/5 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/40 hover:shadow-lg sm:p-7">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-xl transition group-hover:bg-[#D4AF37]">
                🔒
              </div>

              <h3 className="mt-4 font-black">
                Secure Shopping
              </h3>

              <p className="mt-2 text-xs leading-5 text-gray-500 sm:text-sm">
                Your GoldMart account and
                shopping experience are designed
                with security in mind.
              </p>

            </div>

            {/* DELIVERY */}
            <div className="group rounded-3xl border border-black/5 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/40 hover:shadow-lg sm:p-7">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-xl transition group-hover:bg-[#D4AF37]">
                🚚
              </div>

              <h3 className="mt-4 font-black">
                Reliable Delivery
              </h3>

              <p className="mt-2 text-xs leading-5 text-gray-500 sm:text-sm">
                Shop products from marketplace
                sellers and manage your orders
                through GoldMart.
              </p>

            </div>

            {/* TRUST */}
            <div className="group rounded-3xl border border-black/5 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/40 hover:shadow-lg sm:p-7">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-xl transition group-hover:bg-[#D4AF37]">
                ⭐
              </div>

              <h3 className="mt-4 font-black">
                Trusted Marketplace
              </h3>

              <p className="mt-2 text-xs leading-5 text-gray-500 sm:text-sm">
                Discover products from sellers
                and explore ratings as your
                marketplace grows.
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

              {/* GOLD DECORATION */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#D4AF37]/10 blur-3xl" />

              <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

                <div className="max-w-2xl">

                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#A67C00]">
                    Grow with GoldMart
                  </p>

                  <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                    Have something to sell?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Join the GoldMart marketplace
                    and build your online store.
                  </p>

                </div>

                <Link
                  href="/register"
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-black px-7 py-3.5 text-sm font-black text-white transition hover:bg-[#D4AF37] hover:text-black"
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
                  <span className="text-[#D4AF37]">
                    Mart
                  </span>
                </div>
              </Link>

              <p className="mt-3 max-w-xs text-sm leading-6 text-gray-400">
                A modern marketplace for
                discovering products from
                trusted sellers.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                ✦ Shop the world
              </div>

            </div>

            {/* SHOP */}
            <div>

              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
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

              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
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

            {/* SELL */}
            <div>

              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                GoldMart
              </h3>

              <div className="mt-4 space-y-3">

                {user?.role ===
                "seller" ? (
                  <Link
                    href="/seller"
                    className="block text-sm text-gray-400 transition hover:text-white"
                  >
                    Seller Dashboard
                  </Link>
                ) : user?.role ===
                  "admin" ? (
                  <Link
                    href="/admin"
                    className="block text-sm text-gray-400 transition hover:text-white"
                  >
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/become-seller"
                    className="block text-sm text-gray-400 transition hover:text-white"
                  >
                    Sell on GoldMart
                  </Link>
                )}

                <Link
                  href="/shop"
                  className="block text-sm text-gray-400 transition hover:text-white"
                >
                  Explore Products
                </Link>

              </div>

            </div>

          </div>

          {/* FOOTER BOTTOM */}
          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-xs text-gray-500">
              © 2026 GoldMart. All rights reserved.
            </p>

            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
              <span>BLACK</span>
              <span>•</span>
              <span className="text-[#D4AF37]">
                GOLD
              </span>
              <span>•</span>
              <span>WHITE</span>
            </div>

          </div>

        </div>

      </footer>

      {/* =====================================================
          MOBILE BOTTOM NAVIGATION
          ===================================================== */}

      <nav className="fixed bottom-0 left-0 right-0 z-[60] border-t border-black/10 bg-white/95 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl md:hidden">

        <div className="mx-auto grid max-w-md grid-cols-4">

          {/* HOME */}
          <Link
            href="/"
            className="flex flex-col items-center justify-center gap-1 px-2 py-3 text-[10px] font-black text-black"
          >
            <span className="text-lg">
              🏠
            </span>

            <span>
              Home
            </span>
          </Link>

          {/* CATEGORIES */}
          <a
            href="#categories"
            className="flex flex-col items-center justify-center gap-1 px-2 py-3 text-[10px] font-bold text-gray-500 transition hover:text-black"
          >
            <span className="text-lg">
              ☷
            </span>

            <span>
              Categories
            </span>
          </a>

          {/* YOU */}
          <Link
            href={
              user
                ? "/account"
                : "/login"
            }
            className="flex flex-col items-center justify-center gap-1 px-2 py-3 text-[10px] font-bold text-gray-500 transition hover:text-black"
          >
            <span className="text-lg">
              👤
            </span>

            <span>
              You
            </span>
          </Link>

          {/* CART */}
          <Link
            href="/cart"
            className="relative flex flex-col items-center justify-center gap-1 px-2 py-3 text-[10px] font-bold text-gray-500 transition hover:text-black"
          >
            <span className="relative text-lg">

              🛒

              <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#D4AF37] px-1 text-[7px] font-black text-black">
                +
              </span>

            </span>

            <span>
              Cart
            </span>
          </Link>

        </div>

      </nav>

    </main>
  );
          }
