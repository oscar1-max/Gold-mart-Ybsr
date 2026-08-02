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

        <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category}
              className="rounded-2xl border p-8 text-center transition hover:border-yellow-600 hover:shadow-lg"
            >
              <h3 className="text-xl font-semibold">
                {category}
              </h3>

              <p className="mt-2 text-gray-500">
                Explore premium {category.toLowerCase()} products.
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
