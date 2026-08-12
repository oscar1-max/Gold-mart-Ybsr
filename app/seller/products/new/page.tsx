"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

export default function NewProductPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("1");
  const [imageUrl, setImageUrl] = useState("");

  const [categories, setCategories] = useState<
    { id: number; name: string }[]
  >([]);

  const [categoryId, setCategoryId] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load categories from backend
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch(
          `${API_URL}/api/categories`
        );

        const data = await response.json();

        if (data.success) {
          setCategories(data.categories);

          if (data.categories.length > 0) {
            setCategoryId(String(data.categories[0].id));
          }
        }
      } catch {
        setError("Could not load product categories.");
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
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
      setError(
        "You must have a seller account to add products."
      );
      return;
    }

    if (!categoryId) {
      setError("Please select a category.");
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
            category_id: Number(categoryId),
            stock: Number(stock),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to add product."
        );
      }

      setSuccess("✅ Product added successfully!");

      setName("");
      setPrice("");
      setDescription("");
      setStock("1");
      setImageUrl("");

      setTimeout(() => {
        router.push("/seller/products");
      }, 1000);
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

      {/* HEADER */}
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
            className="rounded-full border px-5 py-2 text-sm font-bold hover:bg-gray-100"
          >
            Seller Dashboard
          </Link>

        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-2xl px-4 py-10">

        {/* BACK BUTTON */}
        <Link
          href="/seller"
          className="font-bold text-[#A67C00]"
        >
          ← Back to Seller Dashboard
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

          {/* ERROR */}
          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
              {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >

            {/* NAME */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Product Name
              </label>

              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Wireless Headphones"
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
                onChange={(e) => setPrice(e.target.value)}
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
                onChange={(e) => setStock(e.target.value)}
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
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loadingCategories}
                className="w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-[#D4AF37]"
              >
                {loadingCategories ? (
                  <option>
                    Loading categories...
                  </option>
                ) : (
                  categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))
                )}
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
                onChange={(e) => setDescription(e.target.value)}
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

              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste product image URL"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
              />

              <p className="mt-2 text-xs text-gray-400">
                For now, paste a direct image URL. We will
                add real image uploading after the product
                system is working.
              </p>

              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Product preview"
                  className="mt-4 h-48 w-full rounded-xl object-cover"
                />
              )}
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading || loadingCategories}
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
