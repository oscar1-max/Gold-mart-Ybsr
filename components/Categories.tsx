"use client";

import Link from "next/link";

const categories = [
  "Electronics",
  "Fashion",
  "Home & Living",
  "Beauty",
  "Gaming",
  "Accessories",
];

export default function Categories() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold">
          Shop By Category
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-center text-gray-500">
          Explore products from your favorite categories.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/shop?category=${encodeURIComponent(category)}`}
              className="group rounded-2xl border p-8 text-center transition hover:-translate-y-1 hover:border-yellow-600 hover:shadow-lg"
            >
              <h3 className="text-xl font-semibold transition group-hover:text-yellow-600">
                {category}
              </h3>

              <p className="mt-2 text-gray-500">
                Explore premium {category.toLowerCase()} products.
              </p>

              <span className="mt-5 inline-block text-sm font-medium text-yellow-600 opacity-0 transition group-hover:opacity-100">
                Shop Now →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
