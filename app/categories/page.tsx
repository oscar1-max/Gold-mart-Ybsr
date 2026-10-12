
import Link from "next/link";

const categories = [
  { name: "Phones", icon: "📱" },
  { name: "Electronics", icon: "💻" },
  { name: "Gaming", icon: "🎮" },
  { name: "Fashion", icon: "👕" },
  { name: "Beauty & Cosmetics", icon: "💄" },
  { name: "Groceries", icon: "🛒" },
  { name: "Home & Kitchen", icon: "🏠" },
  { name: "Jewelry & Accessories", icon: "💎" },
];

export default function CategoriesPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-5 text-black">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-sm font-bold text-[#a67c00]"
        >
          ← Back to Home
        </Link>

        <h1 className="mt-8 text-3xl font-black">
          Shop by Categories
        </h1>

        <p className="mt-2 text-gray-500">
          Discover products on GoldMart.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/shop?category=${encodeURIComponent(category.name)}`}
              className="flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-sm hover:shadow-md"
            >
              <span className="text-4xl">
                {category.icon}
              </span>

              <span className="mt-4 font-bold">
                {category.name}
              </span>

              <span className="mt-2 text-xs text-[#a67c00]">
                Shop Now →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
