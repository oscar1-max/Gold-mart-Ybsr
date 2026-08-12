"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

const categories = [
  "Phones",
  "Electronics",
  "Gaming",
  "Fashion",
  "Beauty & Cosmetics",
  "Groceries",
  "Home & Kitchen",
];

export default function NewProductPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("1");
  const [imageUrl, setImageUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const token = localStorage.getItem("goldmart_token");
    const savedUser = localStorage.getItem("goldmart_user");

    if (!token || !savedUser) {
      router.push("/login");
      return;
    }

    let user;

    try {
      user = JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("goldmart_token");
      localStorage.removeItem("goldmart_user");
      router.push("/login");
      return;
    }

    if (user.role !== "seller" && user.role !== "admin") {
      setError("You must be a seller to add products.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter a product name.");
      return;
    }

    if (!price || Number(price) < 0) {
      setError("Please enter a valid price.");
      return;
    }

    if (!stock || !Number.isInteger(Number(stock)) || Number(stock) < 0) {
      setError("Stock must be a whole number.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/seller/products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            price: Number(price),
            image_url: imageUrl.trim() || null,
            category_id: null,
            stock: Number(stock),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to create product."
        );
      }

      setSuccess("Product added successfully!");

      setName("");
      setPrice("");
      setDescription("");
      setStock("1");
      setImageUrl("");

      setTimeout(() => {
        router.push("/seller/products");
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to GoldMart."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 text-black">

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">

          <Link
            href="/"
            className="text-2xl font-black"
          >
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
            Add a real product to your GoldMart store.
          </p>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
              {success}
            </div>
          )}

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
                onChange={(event) =>
                  setName(event.target.value)
                }
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
                onChange={(event) =>
                  setPrice(event.target.value)
                }
                placeholder="50000"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* STOCK */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Stock Quantity
              </label>

              <input
                type="number"
                required
                min="0"
                step="1"
                value={stock}
                onChange={(event) =>
                  setStock(event.target.value)
                }
                placeholder="10"
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
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                className="w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-[#D4AF37]"
              >
                {categories.map((item) => (
                  <option key={item}>
                    {item}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-gray-400">
                Category linking will be connected to the
                database categories next.
              </p>
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

            {/* IMAGE URL */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Product Image URL
              </label>

              <input
                type="url"
                value={imageUrl}
                onChange={(event) =>
                  setImageUrl(event.target.value)
                }
                placeholder="https://example.com/product.jpg"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
              />

              <p className="mt-2 text-xs text-gray-400">
                We'll add proper image uploading later.
              </p>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black py-4 font-bold text-white transition hover:bg-[#D4AF37] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Adding Product..."
                : "Add Product"}
            </button>

          </form>

        </div>
      </div>
    </main>
  );
}
