"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { products } from "../../data/products";
import AddToCartButton from "../../components/AddToCartButton";

const categories = [
  "All",
  "Electronics",
  "Gaming",
  "Fashion",
  "Phones",
  "Beauty & Cosmetics",
  "Groceries",
];

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.description.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

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
            className="rounded-full border px-4 py-2 font-bold"
          >
            🛒 Cart
          </Link>

        </div>
      </header>

      {/* SHOP */}
      <div className="mx-auto max-w-7xl px-4 py-10">

        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
            GoldMart Store
          </p>

          <h1 className="mt-1 text-4xl font-black">
            Shop Everything
          </h1>

          <p className="mt-3 text-gray-500">
            Find phones, electronics, fashion, beauty products,
            groceries and more.
          </p>
        </div>

        {/* SEARCH */}
        <div className="mt-8">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products..."
            className="w-full rounded-2xl border bg-white px-5 py-4 outline-none focus:border-[#D4AF37]"
          />
        </div>

        {/* CATEGORIES */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold ${
                selectedCategory === category
                  ? "bg-black text-white"
                  : "border bg-white hover:border-[#D4AF37]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* RESULTS */}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-xl font-black">
            {filteredProducts.length} Products
          </h2>
        </div>

        {/* PRODUCT GRID */}
        {filteredProducts.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-white p-10 text-center">
            <div className="text-5xl">🔎</div>

            <h2 className="mt-4 text-xl font-black">
              No products found
            </h2>

            <p className="mt-2 text-gray-500">
              Try another search or category.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-1 hover:shadow-lg"
              >

                {/* IMAGE */}
                <Link href={`/product/${product.id}`}>
                  <div className="relative h-48 bg-gray-100">

                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />

                  </div>
                </Link>

                {/* INFO */}
                <div className="p-4">

                  <p className="text-xs font-bold uppercase text-[#A67C00]">
                    {product.category}
                  </p>

                  <Link href={`/product/${product.id}`}>
                    <h3 className="mt-1 font-bold hover:text-[#A67C00]">
                      {product.name}
                    </h3>
                  </Link>

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
        )}

      </div>
    </main>
  );
        }
