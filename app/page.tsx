import Image from "next/image";
import { products } from "../data/products";
import AddToCartButton from "../components/AddToCartButton";

const categories = [
  { icon: "📱", name: "Phones" },
  { icon: "💻", name: "Electronics" },
  { icon: "👕", name: "Fashion" },
  { icon: "💄", name: "Beauty & Cosmetics" },
  { icon: "🛒", name: "Groceries" },
  { icon: "🏠", name: "Home & Kitchen" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">

          <a href="/" className="text-2xl font-black">
            Gold<span className="text-[#D4AF37]">Mart</span>
          </a>

          <div className="hidden items-center gap-8 md:flex">
            <a href="/" className="font-medium hover:text-[#A67C00]">
              Home
            </a>

            <a href="#products" className="font-medium hover:text-[#A67C00]">
              Shop
            </a>

            <a href="#categories" className="font-medium hover:text-[#A67C00]">
              Categories
            </a>

            <a href="#deals" className="font-medium hover:text-[#A67C00]">
              Deals
            </a>
          </div>

          <div className="flex items-center gap-2">

            <button
              aria-label="Search"
              className="rounded-full border border-gray-200 p-2"
            >
              🔍
            </button>

            <a
              href="/cart"
              aria-label="Shopping cart"
              className="rounded-full border border-gray-200 p-2"
            >
              🛒
            </a>

            <a
              href="/login"
              className="hidden rounded-full bg-black px-5 py-2 font-bold text-white sm:block"
            >
              Sign In
            </a>

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
            Shop phones, electronics, fashion, cosmetics,
            groceries and thousands of products from trusted sellers.
          </p>

          {/* SEARCH */}
          <div className="mx-auto mt-8 flex max-w-2xl overflow-hidden rounded-full bg-white p-1">

            <input
              type="search"
              placeholder="What are you looking for?"
              className="min-w-0 flex-1 px-5 py-3 text-black outline-none"
            />

            <button
              type="button"
              className="rounded-full bg-[#D4AF37] px-6 font-bold text-black"
            >
              Search
            </button>

          </div>

          <a
            href="#products"
            className="mt-6 inline-block rounded-full border border-[#D4AF37] px-8 py-3 font-bold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black"
          >
            Start Shopping →
          </a>

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

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">

          {categories.map((category) => (
            <button
              key={category.name}
              type="button"
              className="rounded-2xl border border-gray-200 p-5 text-center transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
            >

              <div className="text-4xl">
                {category.icon}
              </div>

              <p className="mt-3 text-sm font-bold">
                {category.name}
              </p>

            </button>
          ))}

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

            <a
              href="/shop"
              className="text-sm font-bold text-[#A67C00]"
            >
              View all →
            </a>

          </div>

          {/* PRODUCT GRID */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">

            {products.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
              >

                {/* PRODUCT IMAGE */}
                <div className="relative h-40 bg-gray-100">

                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />

                </div>

                {/* PRODUCT INFO */}
                <div className="p-4">

                  <p className="text-xs font-semibold uppercase text-[#A67C00]">
                    {product.category}
                  </p>

                  <h3 className="mt-1 font-bold">
                    {product.name}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                    {product.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between">

                    <span className="font-black text-[#A67C00]">
                      {product.price}
                    </span>

                    <span className="text-sm">
                      ⭐ {product.rating}
                    </span>

                  </div>

                  <AddToCartButton
                    product={{
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.image,
                    }}
                  />

                </div>

              </article>
            ))}

          </div>
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
            Discover special offers and deals from trusted GoldMart sellers.
          </p>

          <a
            href="/shop"
            className="mt-6 inline-block rounded-full bg-[#D4AF37] px-7 py-3 font-bold text-black"
          >
            Explore Deals
          </a>

        </div>
      </section>

      {/* TRUST */}
      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-14 sm:grid-cols-3">

        <div className="rounded-2xl border p-6">
          <div className="text-3xl">🔒</div>

          <h3 className="mt-3 font-bold">
            Secure Shopping
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Your account and transactions are protected.
          </p>
        </div>

        <div className="rounded-2xl border p-6">
          <div className="text-3xl">🚚</div>

          <h3 className="mt-3 font-bold">
            Reliable Delivery
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Shop from sellers and receive your orders safely.
          </p>
        </div>

        <div className="rounded-2xl border p-6">
          <div className="text-3xl">⭐</div>

          <h3 className="mt-3 font-bold">
            Trusted Marketplace
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Discover products from trusted sellers.
          </p>
        </div>

      </section>

      {/* FOOTER */}
      <footer className="bg-black px-4 py-12 text-white">

        <div className="mx-auto max-w-7xl">

          <div className="text-3xl font-black">
            Gold<span className="text-[#D4AF37]">Mart</span>
          </div>

          <p className="mt-3 max-w-md text-sm text-gray-400">
            Everything you need, all in one place.
          </p>

          <div className="mt-10 border-t border-gray-800 pt-6 text-sm text-gray-500">
            © 2026 GoldMart. All rights reserved.
          </div>

        </div>

      </footer>

    </main>
  );
          }
