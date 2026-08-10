export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="text-2xl font-black tracking-tight">
            <span className="text-black">Gold</span>
            <span className="text-[#D4AF37]">Mart</span>
          </div>

          <button className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white">
            Shop Now
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-black">
        <div className="mx-auto max-w-7xl px-5 py-20 text-center">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-[#D4AF37]">
            Welcome to GoldMart
          </p>

          <h1 className="text-4xl font-black leading-tight text-white sm:text-6xl">
            Everything You Need.
            <br />
            <span className="text-[#D4AF37]">All in One Place.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-gray-300">
            Shop phones, electronics, fashion, cosmetics, groceries and more
            from one trusted marketplace.
          </p>

          <button className="mt-8 rounded-full bg-[#D4AF37] px-8 py-4 font-bold text-black transition hover:bg-[#F4D675]">
            Start Shopping
          </button>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
              Explore
            </p>
            <h2 className="mt-1 text-3xl font-black">Shop by Category</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            "📱 Phones",
            "💻 Electronics",
            "👕 Fashion",
            "💄 Beauty",
            "🛒 Groceries",
            "🏠 Home",
          ].map((category) => (
            <button
              key={category}
              className="rounded-2xl border border-gray-200 bg-white p-6 text-center font-bold shadow-sm transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-md"
            >
              <span className="text-3xl">{category.split(" ")[0]}</span>
              <span className="mt-3 block text-sm">
                {category.substring(category.indexOf(" ") + 1)}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="bg-gray-50 px-4 py-14">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
            GoldMart Picks
          </p>

          <h2 className="mt-1 text-3xl font-black">Featured Products</h2>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {["Smartphones", "Laptops", "Fashion", "Beauty"].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                <div className="flex h-40 items-center justify-center bg-gray-100 text-5xl">
                  🛍️
                </div>

                <div className="p-4">
                  <h3 className="font-bold">{item}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Discover amazing deals
                  </p>

                  <button className="mt-4 w-full rounded-xl bg-black py-2 text-sm font-bold text-white">
                    Explore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black px-4 py-10 text-center text-white">
        <div className="text-2xl font-black">
          Gold<span className="text-[#D4AF37]">Mart</span>
        </div>

        <p className="mt-3 text-sm text-gray-400">
          Everything you need, all in one place.
        </p>

        <p className="mt-8 text-xs text-gray-500">
          © 2026 GoldMart. All rights reserved.
        </p>
      </footer>
    </main>
  );
                }
