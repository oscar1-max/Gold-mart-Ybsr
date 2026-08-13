"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

const CLOUDINARY_CLOUD_NAME = "nahkdmgc";
const CLOUDINARY_UPLOAD_PRESET = "goldmart_products";

type Category = {
  id: number;
  name: string;
};

export default function NewProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [categoryId, setCategoryId] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD CATEGORIES
  // =====================================================
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch(`${API_URL}/api/categories`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load categories."
          );
        }

        setCategories(data.categories || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load categories."
        );
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  // =====================================================
  // UPLOAD IMAGE TO CLOUDINARY
  // =====================================================
  async function handleImageUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10MB.");
      event.target.value = "";
      return;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();

      formData.append("file", file);
      formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
      );

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.secure_url) {
        throw new Error(
          data.error?.message ||
            "Failed to upload image to Cloudinary."
        );
      }

      setImageUrl(data.secure_url);
      setSuccess("Image uploaded successfully!");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload image."
      );
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  }

  // =====================================================
  // CREATE PRODUCT
  // =====================================================
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const token = localStorage.getItem("goldmart_token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!name.trim()) {
      setError("Please enter a product name.");
      return;
    }

    if (!price || Number(price) <= 0) {
      setError("Please enter a valid price.");
      return;
    }

    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    if (stock === "" || Number(stock) < 0) {
      setError("Please enter a valid stock quantity.");
      return;
    }

    try {
      setLoading(true);

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

            // IMPORTANT:
            // Save the seller's selected currency.
            currency,

            category_id: Number(categoryId),
            stock: Number(stock),
            image_url: imageUrl.trim() || null,
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
      setDescription("");
      setPrice("");
      setCurrency("USD");
      setCategoryId("");
      setStock("");
      setImageUrl("");

      setTimeout(() => {
        router.push("/seller/products");
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create product."
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
            href="/seller/products"
            className="rounded-full border px-5 py-2 text-sm font-bold hover:bg-gray-100"
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
            Add Product
          </h1>

          <p className="mt-2 text-gray-500">
            Add a new product to your GoldMart store.
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

        {/* FORM */}
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
              placeholder="e.g. Wireless Bluetooth Headphones"
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
              placeholder="Describe your product..."
              rows={5}
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
            />
          </div>

          {/* PRICE + CURRENCY */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2">

            {/* PRICE */}
            <div>
              <label className="text-sm font-bold">
                Price
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) =>
                  setPrice(event.target.value)
                }
                placeholder="15000"
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
                required
              />
            </div>

            {/* CURRENCY */}
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
                <option value="USD">
                  USD ($) - US Dollar
                </option>

                <option value="NGN">
                  NGN (₦) - Nigerian Naira
                </option>

                <option value="EUR">
                  EUR (€) - Euro
                </option>

                <option value="GBP">
                  GBP (£) - British Pound
                </option>
              </select>
            </div>

          </div>

          {/* PRICE PREVIEW */}
          {price && Number(price) >= 0 && (
            <div className="mt-4 rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">
                Price Preview
              </p>

              <p className="mt-1 text-xl font-black text-[#A67C00]">
                {currency === "USD" && "$"}
                {currency === "NGN" && "₦"}
                {currency === "EUR" && "€"}
                {currency === "GBP" && "£"}

                {Number(price).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          )}

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
              placeholder="10"
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
              disabled={loadingCategories}
              className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-[#D4AF37]"
              required
            >
              <option value="">
                {loadingCategories
                  ? "Loading categories..."
                  : "Select a category"}
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

          {/* PRODUCT IMAGE */}
          <div className="mt-6">

            <label className="text-sm font-bold">
              Product Image
            </label>

            <div className="mt-2 rounded-2xl border-2 border-dashed border-gray-300 p-6 text-center">

              <input
                id="product-image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage || loading}
                className="hidden"
              />

              <label
                htmlFor="product-image"
                className={`inline-flex cursor-pointer items-center justify-center rounded-xl px-6 py-3 font-bold transition ${
                  uploadingImage
                    ? "cursor-not-allowed bg-gray-200 text-gray-500"
                    : "bg-black text-white hover:bg-[#D4AF37] hover:text-black"
                }`}
              >
                {uploadingImage
                  ? "Uploading Image..."
                  : imageUrl
                  ? "Choose Another Image"
                  : "Upload Image"}
              </label>

              <p className="mt-3 text-sm text-gray-500">
                Choose a product image from your gallery.
              </p>

              <p className="mt-1 text-xs text-gray-400">
                JPG, PNG, WEBP • Maximum 10MB
              </p>

            </div>

          </div>

          {/* IMAGE PREVIEW */}
          {imageUrl && (
            <div className="mt-6">

              <p className="mb-2 text-sm font-bold">
                Image Preview
              </p>

              <div className="relative overflow-hidden rounded-2xl border bg-gray-100">

                <img
                  src={imageUrl}
                  alt="Product preview"
                  className="h-64 w-full object-cover"
                />

              </div>

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
              disabled={loading || uploadingImage}
              className="flex-1 rounded-xl bg-black px-6 py-3 font-bold text-white transition hover:bg-[#D4AF37] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Adding Product..."
                : "Add Product"}
            </button>

          </div>

        </form>

      </div>
    </main>
  );
}
