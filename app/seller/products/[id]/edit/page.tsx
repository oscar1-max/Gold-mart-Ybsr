"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

type Category = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  stock: number;
  image_url: string | null;
  category_id: number | null;
  currency?: string | null;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();

  const productId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [currency, setCurrency] = useState("NGN");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!productId) {
      setError("Product ID is missing.");
      setLoading(false);
      return;
    }

    async function loadProduct() {
      try {
        const token = localStorage.getItem("goldmart_token");

        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(
          `${API_URL}/api/seller/products/${productId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load product."
          );
        }

        const item = data.product;

        setProduct(item);

        setName(item.name || "");
        setDescription(item.description || "");
        setPrice(String(item.price ?? ""));
        setStock(String(item.stock ?? ""));
        setCategoryId(
          item.category_id !== null &&
          item.category_id !== undefined
            ? String(item.category_id)
            : ""
        );
        setImageUrl(item.image_url || "");
        setCurrency(item.currency || "NGN");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load product."
        );
      } finally {
        setLoading(false);
      }
    }

    async function loadCategories() {
      try {
        const response = await fetch(
          `${API_URL}/api/categories`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          setCategories(
            Array.isArray(data.categories)
              ? data.categories
              : []
          );
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }

    loadProduct();
    loadCategories();
  }, [productId, router]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const token = localStorage.getItem("goldmart_token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!productId) {
      setError("Product ID is missing.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter a product name.");
      return;
    }

    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      setError("Please enter a valid price.");
      return;
    }

    if (
      !Number.isInteger(numericStock) ||
      numericStock < 0
    ) {
      setError(
        "Stock must be a non-negative whole number."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/api/seller/products/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            price: numericPrice,
            stock: numericStock,
            category_id: categoryId
              ? Number(categoryId)
              : null,
            image_url: imageUrl.trim() || null,
            currency,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update product."
        );
      }

      setProduct(data.product);
      setSuccess("Product updated successfully!");

      setTimeout(() => {
        router.push("/seller/products");
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update product."
      );
    } finally {
      setSaving(false);
    }
  }

  function currencySymbol(value: string) {
    switch (value) {
      case "USD":
        return "$";
      case "EUR":
        return "€";
      case "GBP":
        return "£";
      case "NGN":
      default:
        return "₦";
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-5xl">📦</div>

          <p className="mt-4 font-bold">
            Loading product...
          </p>
        </div>
      </main>
    );
  }

  if (error && !product) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-2xl">

          <Link
            href="/seller/products"
            className="font-bold text-[#A67C00]"
          >
            ← Back to My Products
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">

            <h1 className="font-black">
              Unable to load product
            </h1>

            <p className="mt-2">
              {error}
            </p>

          </div>

        </div>
      </main>
    );
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
            Gold<span className="text-[#D4AF37]">
              Mart
            </span>
          </Link>

          <Link
            href="/seller/products"
            className="rounded-full border px-5 py-2 text-sm font-bold transition hover:bg-gray-100"
          >
            My Products
          </Link>

        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-3xl px-4 py-10">

        <Link
          href="/seller/products"
          className="font-bold text-[#A67C00]"
        >
          ← Back to My Products
        </Link>

        <div className="mt-6">

          <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
            Seller Center
          </p>

          <h1 className="mt-1 text-3xl font-black sm:text-4xl">
            Edit Product
          </h1>

          <p className="mt-2 text-gray-500">
            Update your GoldMart product information.
          </p>

        </div>

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
          className="mt-8 rounded-3xl border bg-white p-6 shadow-sm sm:p-8"
        >

          {/* PRODUCT NAME */}
          <div>
            <label className="text-sm font-bold">
              Product Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
              required
            />
          </div>

          {/* DESCRIPTION */}
          <div className="mt-6">

            <label className="text-sm font-bold">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={5}
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
            />

          </div>

          {/* PRICE + CURRENCY */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2">

            <div>

              <label className="text-sm font-bold">
                Currency
              </label>

              <select
                value={currency}
                onChange={(event) =>
                  setCurrency(event.target.value)
                }
                className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-[#D4AF37]"
              >
                <option value="NGN">
                  ₦ Nigerian Naira
                </option>

                <option value="USD">
                  $ US Dollar
                </option>

                <option value="EUR">
                  € Euro
                </option>

                <option value="GBP">
                  £ British Pound
                </option>
              </select>

            </div>

            <div>

              <label className="text-sm font-bold">
                Price
              </label>

              <div className="relative mt-2">

                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold">
                  {currencySymbol(currency)}
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(event) =>
                    setPrice(event.target.value)
                  }
                  className="w-full rounded-xl border py-3 pl-10 pr-4 outline-none focus:border-[#D4AF37]"
                  required
                />

              </div>

            </div>

          </div>

          {/* STOCK */}
          <div className="mt-6">

            <label className="text-sm font-bold">
              Stock Quantity
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(event) =>
                setStock(event.target.value)
              }
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
              required
            />

          </div>

          {/* CATEGORY */}
          <div className="mt-6">

            <label className="text-sm font-bold">
              Category
            </label>

            <select
              value={categoryId}
              onChange={(event) =>
                setCategoryId(event.target.value)
              }
              className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-[#D4AF37]"
            >

              <option value="">
                Select a category
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}

            </select>

          </div>

          {/* IMAGE URL */}
          <div className="mt-6">

            <label className="text-sm font-bold">
              Product Image URL
            </label>

            <input
              type="url"
              value={imageUrl}
              onChange={(event) =>
                setImageUrl(event.target.value)
              }
              placeholder="https://..."
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
            />

          </div>

          {/* IMAGE PREVIEW */}
          {imageUrl && (
            <div className="mt-6">

              <p className="mb-2 text-sm font-bold">
                Image Preview
              </p>

              <img
                src={imageUrl}
                alt={name || "Product"}
                className="h-64 w-full rounded-2xl border bg-gray-100 object-cover"
              />

            </div>
          )}

          {/* BUTTONS */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">

            <Link
              href="/seller/products"
              className="rounded-xl border px-6 py-3 text-center font-bold hover:bg-gray-100"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-black px-6 py-3 font-bold text-white transition hover:bg-[#D4AF37] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving Changes..."
                : "Save Changes"}
            </button>

          </div>

        </form>

      </div>
    </main>
  );
}
