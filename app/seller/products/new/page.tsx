"use client";

import Link from "next/link";
import { useState } from "react";

export default function NewProductPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [description, setDescription] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    alert(
      "Product form saved. We will connect it to the GoldMart database in the backend stage."
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-black">

      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">

          <Link href="/" className="text-2xl font-black">
            Gold<span className="text-[#D4AF37]">Mart</span>
          </Link>

          <Link
            href="/seller"
            className="rounded-full border px-5 py-2 text-sm font-bold"
          >
            Seller Dashboard
          </Link>

        </div>
      </header>

      {/* FORM */}
      <div className="mx-auto max-w-2xl px-4 py-10">

        <Link
          href="/seller"
          className="text-sm font-bold text-[#A67C00]"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">

          <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
            Seller Center
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Add New Product
          </h1>

          <p className="mt-2 text-gray-500">
            Add a product to your GoldMart store.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >

            {/* PRODUCT NAME */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Product Name
              </label>

              <input
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Example: Wireless Headphones"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* PRICE */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Price (₦)
              </label>

              <input
                type="number"
                required
                min="0"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="50000"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* CATEGORY */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Category
              </label>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-[#D4AF37]"
              >
                <option>Phones</option>
                <option>Electronics</option>
                <option>Gaming</option>
                <option>Fashion</option>
                <option>Beauty & Cosmetics</option>
                <option>Groceries</option>
                <option>Home & Kitchen</option>
              </select>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Description
              </label>

              <textarea
                required
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe your product..."
                rows={5}
                className="w-full resize-none rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* IMAGE */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Product Image
              </label>

              <div className="rounded-xl border-2 border-dashed p-8 text-center">

                <div className="text-4xl">
                  📷
                </div>

                <p className="mt-3 text-sm text-gray-500">
                  Product image upload will be connected to
                  the backend later.
                </p>

                <button
                  type="button"
                  className="mt-4 rounded-lg border px-5 py-2 text-sm font-bold"
                >
                  Choose Image
                </button>

              </div>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              className="w-full rounded-xl bg-black py-4 font-bold text-white transition hover:bg-[#D4AF37] hover:text-black"
            >
              Add Product
            </button>

          </form>

        </div>
      </div>
    </main>
  );
                  }
