"use client";

import Link from "next/link";

const categories = [
  {
    name: "Electronics",
    description: "Phones, laptops, gadgets and more.",
  },
  {
    name: "Gaming",
    description: "Gaming consoles, accessories and gear.",
  },
  {
    name: "Fashion",
    description: "Clothing, shoes and fashion accessories.",
  },
  {
    name: "Phones",
    description: "Smartphones and mobile accessories.",
  },
  {
    name: "Beauty & Cosmetics",
    description: "Beauty, skincare and cosmetics.",
  },
  {
    name: "Groceries",
    description: "Everyday food and household essentials.",
  },
  {
    name: "Home & Kitchen",
    description: "Everything for your home and kitchen.",
  },
  {
    name: "Accessories",
    description: "Useful accessories and everyday essentials.",
  },
];

export default function Categories() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-sm font-bold uppercase tracking-wider text-[#A67C00]">
          Explore GoldMart
        </p>

        <h2 className="mt-2 text-center text-3xl font-black">
          Shop By Category
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-center text-gray-500">
          Find exactly what you need from our growing collection of products.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/shop?category=${encodeURIComponent(category.name)}`}
              className="group rounded-2xl border bg-white p-6 text-center transition duration-200 hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl transition group-hover:bg-[#D4AF37]">
                🛍️
              </div>

              <h3 className="mt-5 text-lg font-black transition group-hover:text-[#A67C00]">
                {category.name}
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                {category.description}
              </p>

              <span className="mt-4 inline-block text-sm font-bold text-[#A67C00]">
                Shop Now →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
