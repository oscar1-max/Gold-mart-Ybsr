export default function Hero() {
  return (
    <section className="bg-black px-6 py-20 text-white">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="text-5xl font-bold md:text-7xl">
          Shop Smarter With <span className="text-yellow-500">GoldMart</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
          Discover amazing products from trusted sellers.
          A modern marketplace built for buyers and businesses.
        </p>

        <div className="mx-auto mt-8 flex max-w-xl items-center rounded-full bg-white p-2">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full px-5 py-3 text-black outline-none"
          />

          <button className="rounded-full bg-yellow-600 px-6 py-3 text-white">
            Search
          </button>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <button className="rounded-full bg-yellow-600 px-8 py-3 text-black font-semibold">
            Start Shopping
          </button>

          <button className="rounded-full border border-white px-8 py-3">
            Become a Seller
          </button>
        </div>
      </div>
    </section>
  );
}
