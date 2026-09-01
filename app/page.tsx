"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AddToCartButton from "../components/AddToCartButton";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

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

const categories = [
  { icon: "📱", name: "Phones", value: "Phones" },
  { icon: "💻", name: "Electronics", value: "Electronics" },
  { icon: "🎮", name: "Gaming", value: "Gaming" },
  { icon: "👕", name: "Fashion", value: "Fashion" },
  { icon: "💄", name: "Beauty", value: "Beauty & Cosmetics" },
  { icon: "🛒", name: "Groceries", value: "Groceries" },
  { icon: "🏠", name: "Home", value: "Home & Kitchen" },
  { icon: "💎", name: "Jewelry", value: "Jewelry & Accessories" },
];

const discoveryTabs = [
  "All",
  "Deals",
  "5-Star Rated",
  "Best Selling",
  "New Arrivals",
];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    const savedUser = localStorage.getItem("goldmart_user");

    if (!savedUser) return;

    try {
      setUser(JSON.parse(savedUser));
    } catch {
      setUser(null);
    }
  }, []);

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

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load products"
          );
        }

        setProducts(
          Array.isArray(data.products)
            ? data.products
            : []
        );
      } catch (error) {
        console.error(
          "GoldMart products error:",
          error
        );

        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, []);

  function handleSearch() {
    const query = search.trim();

    if (!query) {
      window.location.href = "/shop";
      return;
    }

    window.location.href =
      `/shop?search=${encodeURIComponent(query)}`;
  }

  function handleCategory(category: string) {
    setActiveCategory(category);

    if (!category) {
      window.location.href = "/shop";
      return;
    }

    window.location.href =
      `/shop?category=${encodeURIComponent(category)}`;
  }

  function formatPrice(
    price: string | number,
    currency?: string | null
  ) {
    const amount = Number(price);

    if (!Number.isFinite(amount)) {
      return "0.00";
    }

    const formatted = amount.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );

    switch (currency?.toUpperCase()) {
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

  const displayedProducts = useMemo(() => {
    let result = [...products];

    if (activeCategory) {
      result = result.filter((product) =>
        product.category_name
          ?.toLowerCase()
          .includes(activeCategory.toLowerCase())
      );
    }

    if (activeTab === "5-Star Rated") {
      result = result.filter(
        (product) =>
          Number(product.rating || 0) >= 5
      );
    }

    if (activeTab === "Best Selling") {
      result = [...result].sort(
        (a, b) =>
          Number(b.rating || 0) -
          Number(a.rating || 0)
      );
    }

    if (activeTab === "New Arrivals") {
      result = [...result].reverse();
    }

    if (activeTab === "Deals") {
      result = result.filter(
        (product) => Number(product.price) > 0
      );
    }

    return result;
  }, [
    products,
    activeCategory,
    activeTab,
  ]);

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-[#111] pb-20">

      {/* ================================
          TOP MOBILE HEADER
          ================================ */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">

        <div className="flex items-center justify-between px-4 py-3">

          <Link
            href="/"
            className="text-xl font-black tracking-tight"
          >
            Gold
            <span className="text-[#c99b25]">
              Mart
            </span>
          </Link>

          <div className="flex items-center gap-2">

            {user && (
              <Link
                href="/notifications"
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f5f5]"
              >
                🔔
              </Link>
            )}

            <Link
              href={
                user
                  ? "/account"
                  : "/login"
              }
              aria-label="Account"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f5f5]"
            >
              👤
            </Link>

            <Link
              href="/cart"
              aria-label="Cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f5f5]"
            >
              🛒
            </Link>

          </div>
        </div>

        {/* SEARCH */}
        <div className="px-3 pb-3">

          <div className="flex h-12 items-center overflow-hidden rounded-full border-2 border-[#111] bg-white">

            <span className="pl-4 text-lg">
              🔍
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="What are you looking for?"
              className="min-w-0 flex-1 px-3 text-sm outline-none"
            />

            <Link
              href="/visual-search"
              className="mr-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f3f3]"
              aria-label="Visual search"
            >
              📷
            </Link>

            <button
              type="button"
              onClick={handleSearch}
              className="mr-1 flex h-10 w-10 items-center justify-center rounded-full bg-black text-xl text-white"
              aria-label="Search"
            >
              🔎
            </button>

          </div>
        </div>

      </header>

      {/* ================================
          FREE SHIPPING BAR
          ================================ */}
      <section className="bg-[#fff1df]">

        <div className="flex items-center gap-5 overflow-x-auto whitespace-nowrap px-4 py-3 text-sm">

          <div className="flex items-center gap-2">
            <span className="font-black text-green-600">
              ✓
            </span>
            <span className="font-semibold">
              Free shipping
            </span>
          </div>

          <div className="h-5 w-px bg-[#d8c7b5]" />

          <div className="flex items-center gap-2">
            <span className="font-black text-green-600">
              ✓
            </span>
            <span className="font-semibold">
              Price adjustment within 30 days
            </span>
          </div>

          <span className="ml-auto text-lg">
            →
          </span>

        </div>

      </section>

      {/* ================================
          HERO PROMOTION
          ================================ */}
      <section className="bg-white px-4 pt-4">

        <div className="relative overflow-hidden rounded-2xl bg-[#fff0df] p-5">

          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#f7b955]/30" />

          <div className="relative">

            <p className="text-xs font-bold uppercase tracking-wider text-[#e87500]">
              GoldMart Deals
            </p>

            <h1 className="mt-1 max-w-[260px] text-3xl font-black leading-tight">
              Great products.
              <br />
              Better prices.
            </h1>

            <p className="mt-2 max-w-[270px] text-sm text-gray-600">
              Discover products from trusted
              sellers and find your next favorite
              item.
            </p>

            <Link
              href="/shop"
              className="mt-4 inline-flex rounded-full bg-[#ff8500] px-6 py-3 text-sm font-bold text-white"
            >
              Shop now →
            </Link>

          </div>

        </div>

      </section>
            {/* ================================
          CATEGORIES
          ================================ */}
      <section className="mt-3 bg-white px-4 py-4">

        <div className="mb-3 flex items-center justify-between">

          <h2 className="text-lg font-black">
            Categories
          </h2>

          <Link
            href="/categories"
            className="text-sm font-semibold text-[#c99b25]"
          >
            See all →
          </Link>

        </div>

        <div className="og-scrollbar flex gap-4 overflow-x-auto pb-2">

          {categories.map((category) => (
            <button
              key={category.name}
              type="button"
              onClick={() =>
                handleCategory(category.value)
              }
              className={`flex min-w-[76px] flex-col items-center gap-2 ${
                activeCategory === category.value
                  ? "text-[#c99b25]"
                  : "text-gray-800"
              }`}
            >

              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl ${
                  activeCategory === category.value
                    ? "border-2 border-[#c99b25] bg-[#fff8e8]"
                    : "bg-[#f5f5f5]"
                }`}
              >
                {category.icon}
              </span>

              <span className="text-xs font-semibold">
                {category.name}
              </span>

            </button>
          ))}

        </div>

      </section>

      {/* ================================
          PROMOTION CARDS
          ================================ */}
      <section className="mt-3 bg-white px-4 py-4">

        <div className="grid grid-cols-2 gap-3">

          <Link
            href="/shop?sort=deals"
            className="relative min-h-[150px] overflow-hidden rounded-2xl bg-[#ffe6e6] p-4"
          >

            <span className="text-2xl">
              🔥
            </span>

            <h3 className="mt-2 text-lg font-black">
              Hot Deals
            </h3>

            <p className="mt-1 text-xs text-gray-600">
              Great prices every day
            </p>

            <span className="absolute bottom-3 text-xs font-bold text-[#d94343]">
              Shop deals →
            </span>

          </Link>

          <Link
            href="/shop?sort=new"
            className="relative min-h-[150px] overflow-hidden rounded-2xl bg-[#e9f7ef] p-4"
          >

            <span className="text-2xl">
              ✨
            </span>

            <h3 className="mt-2 text-lg font-black">
              New Arrivals
            </h3>

            <p className="mt-1 text-xs text-gray-600">
              Fresh products to discover
            </p>

            <span className="absolute bottom-3 text-xs font-bold text-green-700">
              Explore →
            </span>

          </Link>

        </div>

      </section>

      {/* ================================
          QUICK BENEFITS
          ================================ */}
      <section className="mt-3 bg-white px-4 py-4">

        <div className="grid grid-cols-3 gap-2">

          <div className="rounded-xl bg-[#f7f7f7] p-3 text-center">

            <div className="text-xl">
              🛡️
            </div>

            <p className="mt-1 text-[11px] font-bold">
              Buyer Protection
            </p>

          </div>

          <div className="rounded-xl bg-[#f7f7f7] p-3 text-center">

            <div className="text-xl">
              🚚
            </div>

            <p className="mt-1 text-[11px] font-bold">
              Fast Delivery
            </p>

          </div>

          <div className="rounded-xl bg-[#f7f7f7] p-3 text-center">

            <div className="text-xl">
              ⭐
            </div>

            <p className="mt-1 text-[11px] font-bold">
              Trusted Sellers
            </p>

          </div>

        </div>

      </section>

      {/* ================================
          DISCOVERY NAVIGATION
          ================================ */}
      <section className="mt-3 bg-white px-4 py-4">

        <div className="mb-3 flex items-center justify-between">

          <h2 className="text-lg font-black">
            Discover
          </h2>

          <Link
            href="/shop"
            className="text-sm font-semibold text-[#c99b25]"
          >
            See all →
          </Link>

        </div>

        <div className="og-scrollbar flex gap-2 overflow-x-auto pb-1">

          {discoveryTabs.map((tab) => (

            <button
              key={tab}
              type="button"
              onClick={() =>
                setActiveTab(tab)
              }
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${
                activeTab === tab
                  ? "bg-black text-white"
                  : "bg-[#f2f2f2] text-gray-700"
              }`}
            >
              {tab}
            </button>

          ))}

        </div>

      </section>

      {/* ================================
          FLASH DEAL HEADER
          ================================ */}
      <section className="mt-3 bg-white px-4 py-4">

        <div className="flex items-center justify-between">

          <div>

            <div className="flex items-center gap-2">

              <span className="text-xl">
                ⚡
              </span>

              <h2 className="text-xl font-black">
                Flash Deals
              </h2>

            </div>

            <p className="mt-1 text-xs text-gray-500">
              Limited-time marketplace deals
            </p>

          </div>

          <Link
            href="/shop?sort=deals"
            className="text-sm font-semibold text-[#c99b25]"
          >
            More →
          </Link>

        </div>

      </section>

      {/* ================================
          PRODUCT GRID
          ================================ */}
      <section className="bg-[#f7f7f7] px-3 pb-6">

        {loadingProducts ? (

          <div className="grid grid-cols-2 gap-3">

            {[1, 2, 3, 4].map((item) => (

              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-xl bg-white"
              >

                <div className="h-44 bg-gray-200" />

                <div className="space-y-2 p-3">

                  <div className="h-3 w-3/4 rounded bg-gray-200" />

                  <div className="h-4 w-1/2 rounded bg-gray-200" />

                  <div className="h-3 w-1/3 rounded bg-gray-200" />

                </div>

              </div>

            ))}

          </div>

        ) : displayedProducts.length === 0 ? (

          <div className="rounded-2xl bg-white px-5 py-12 text-center">

            <div className="text-4xl">
              🛍️
            </div>

            <h3 className="mt-3 text-lg font-black">
              No products found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try another category or browse
              all products.
            </p>

            <Link
              href="/shop"
              className="mt-5 inline-flex rounded-full bg-black px-6 py-3 text-sm font-bold text-white"
            >
              Browse products
            </Link>

          </div>

        ) : (

          <div className="grid grid-cols-2 gap-3">

            {displayedProducts
              .slice(0, 12)
              .map((product) => (

                <article
                  key={product.id}
                  className="overflow-hidden rounded-xl bg-white shadow-sm"
                >

                  {/* PRODUCT IMAGE */}

                  <Link
                    href={`/shop/${product.id}`}
                    className="block"
                  >

                    <div className="relative aspect-square bg-[#f5f5f5]">

                      {product.image_url ? (

                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover"
                        />

                      ) : (

                        <div className="flex h-full items-center justify-center text-4xl">
                          🛍️
                        </div>

                      )}

                      <span className="absolute left-2 top-2 rounded-md bg-[#ff3b30] px-2 py-1 text-[10px] font-black text-white">
                        DEAL
                      </span>

                    </div>

                  </Link>

                  {/* PRODUCT INFO */}

                  <div className="p-3">

                    <Link
                      href={`/shop/${product.id}`}
                    >

                      <h3 className="line-clamp-2 min-h-[36px] text-sm font-semibold leading-5">
                        {product.name}
                      </h3>

                    </Link>

                    <div className="mt-2 flex items-center gap-1">

                      <span className="text-sm font-black">
                        {formatPrice(
                          product.price,
                          product.currency
                        )}
                      </span>

                    </div>

                    <div className="mt-1 flex items-center gap-1">

                      <span className="text-xs">
                        ⭐
                      </span>

                      <span className="text-[11px] text-gray-500">
                        {Number(
                          product.rating || 0
                        ).toFixed(1)}
                      </span>

                      <span className="text-[11px] text-gray-400">
                        •
                      </span>

                      <span className="text-[11px] text-gray-500">
                        {product.stock > 0
                          ? "In stock"
                          : "Sold out"}
                      </span>

                    </div>

                    <div className="mt-3">

                      <AddToCartButton
                        productId={product.id}
                        disabled={
                          product.stock <= 0
                        }
                      />

                    </div>

                  </div>

                </article>

              ))}

          </div>

        )}

      </section>
            {/* ================================
          MORE PRODUCTS
          ================================ */}
      {displayedProducts.length > 12 && (
        <section className="mt-3 bg-white px-4 py-5">

          <div className="mb-4 flex items-center justify-between">

            <div>
              <h2 className="text-xl font-black">
                Recommended for you
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                More products you may like
              </p>
            </div>

            <Link
              href="/shop"
              className="text-sm font-semibold text-[#c99b25]"
            >
              See all →
            </Link>

          </div>

          <div className="og-scrollbar flex gap-3 overflow-x-auto pb-2">

            {displayedProducts
              .slice(12, 20)
              .map((product) => (

                <article
                  key={product.id}
                  className="min-w-[170px] max-w-[170px] overflow-hidden rounded-xl bg-[#f7f7f7]"
                >

                  <Link
                    href={`/shop/${product.id}`}
                    className="block"
                  >

                    <div className="relative aspect-square bg-white">

                      {product.image_url ? (

                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          sizes="170px"
                          className="object-cover"
                        />

                      ) : (

                        <div className="flex h-full items-center justify-center text-4xl">
                          🛍️
                        </div>

                      )}

                    </div>

                  </Link>

                  <div className="p-3">

                    <Link
                      href={`/shop/${product.id}`}
                    >

                      <h3 className="line-clamp-2 text-sm font-semibold">
                        {product.name}
                      </h3>

                    </Link>

                    <p className="mt-2 text-base font-black">
                      {formatPrice(
                        product.price,
                        product.currency
                      )}
                    </p>

                    <div className="mt-1 text-xs text-gray-500">
                      ⭐ {Number(
                        product.rating || 0
                      ).toFixed(1)}
                    </div>

                  </div>

                </article>

              ))}

          </div>

        </section>
      )}

      {/* ================================
          GOLDMART TRUST SECTION
          ================================ */}
      <section className="mt-3 bg-white px-4 py-6">

        <div className="rounded-2xl bg-[#fff8e8] p-5">

          <div className="flex items-start gap-3">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#c99b25] text-xl">
              🛡️
            </div>

            <div>

              <h2 className="text-lg font-black">
                Shop with confidence
              </h2>

              <p className="mt-1 text-sm leading-5 text-gray-600">
                GoldMart connects you with sellers
                while giving buyers a safer and
                easier shopping experience.
              </p>

            </div>

          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">

            <div className="rounded-xl bg-white p-3">

              <div className="text-lg">
                🔒
              </div>

              <p className="mt-1 text-xs font-bold">
                Secure shopping
              </p>

              <p className="mt-1 text-[11px] text-gray-500">
                Your account and orders are
                protected.
              </p>

            </div>

            <div className="rounded-xl bg-white p-3">

              <div className="text-lg">
                ⭐
              </div>

              <p className="mt-1 text-xs font-bold">
                Seller ratings
              </p>

              <p className="mt-1 text-[11px] text-gray-500">
                Discover trusted sellers and
                product reviews.
              </p>

            </div>

            <div className="rounded-xl bg-white p-3">

              <div className="text-lg">
                📦
              </div>

              <p className="mt-1 text-xs font-bold">
                Order tracking
              </p>

              <p className="mt-1 text-[11px] text-gray-500">
                Keep track of your purchases
                from your account.
              </p>

            </div>

            <div className="rounded-xl bg-white p-3">

              <div className="text-lg">
                💬
              </div>

              <p className="mt-1 text-xs font-bold">
                Customer support
              </p>

              <p className="mt-1 text-[11px] text-gray-500">
                Get help when you need it.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* ================================
          SELLER CTA
          ================================ */}
      <section className="mt-3 bg-white px-4 py-5">

        <div className="rounded-2xl bg-black p-5 text-white">

          <p className="text-xs font-bold uppercase tracking-wider text-[#e4bb55]">
            Grow with GoldMart
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Have products to sell?
          </h2>

          <p className="mt-2 max-w-[300px] text-sm leading-5 text-gray-300">
            Join the GoldMart marketplace and
            start reaching more customers.
          </p>

          <Link
            href="/seller"
            className="mt-4 inline-flex rounded-full bg-[#c99b25] px-5 py-3 text-sm font-black text-black"
          >
            Become a seller →
          </Link>

        </div>

      </section>

      {/* ================================
          FOOTER
          ================================ */}
      <footer className="mt-3 bg-white px-5 pb-8 pt-6">

        <div className="text-center">

          <Link
            href="/"
            className="text-2xl font-black"
          >
            Gold
            <span className="text-[#c99b25]">
              Mart
            </span>
          </Link>

          <p className="mx-auto mt-2 max-w-[300px] text-xs leading-5 text-gray-500">
            Your marketplace for products,
            great deals and trusted sellers.
          </p>

        </div>

        <div className="mt-6 grid grid-cols-2 gap-y-3 text-center text-xs font-semibold text-gray-600">

          <Link href="/shop">
            Shop
          </Link>

          <Link href="/categories">
            Categories
          </Link>

          <Link href="/orders">
            My Orders
          </Link>

          <Link href="/account">
            My Account
          </Link>

          <Link href="/seller">
            Sell on GoldMart
          </Link>

          <Link href="/help">
            Help Center
          </Link>

        </div>

        <div className="mt-6 border-t border-gray-100 pt-5 text-center">

          <p className="text-[11px] text-gray-400">
            © {new Date().getFullYear()} GoldMart.
            All rights reserved.
          </p>

        </div>

      </footer>
            {/* ================================
          MOBILE BOTTOM NAVIGATION
          ================================ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden">

        <div className="mx-auto flex h-[68px] max-w-lg items-center justify-around px-2">

          {/* HOME */}

          <Link
            href="/"
            className="flex min-w-[64px] flex-col items-center justify-center gap-1"
          >

            <span className="text-xl">
              🏠
            </span>

            <span className="text-[10px] font-bold text-[#c99b25]">
              Home
            </span>

          </Link>

          {/* CATEGORIES */}

          <Link
            href="/categories"
            className="flex min-w-[64px] flex-col items-center justify-center gap-1"
          >

            <span className="text-xl">
              📂
            </span>

            <span className="text-[10px] font-semibold text-gray-600">
              Categories
            </span>

          </Link>

          {/* CART */}

          <Link
            href="/cart"
            className="relative flex min-w-[64px] flex-col items-center justify-center gap-1"
          >

            <span className="text-xl">
              🛒
            </span>

            <span className="text-[10px] font-semibold text-gray-600">
              Cart
            </span>

          </Link>

          {/* YOU */}

          <Link
            href={
              user
                ? "/account"
                : "/login"
            }
            className="flex min-w-[64px] flex-col items-center justify-center gap-1"
          >

            <span className="text-xl">
              👤
            </span>

            <span className="text-[10px] font-semibold text-gray-600">
              You
            </span>

          </Link>

        </div>

      </nav>

    </main>
  );
}
