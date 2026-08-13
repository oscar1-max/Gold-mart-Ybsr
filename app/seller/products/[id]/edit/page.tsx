"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

const CLOUDINARY_CLOUD_NAME = "nahkdmgc";
const CLOUDINARY_UPLOAD_PRESET = "goldmart_products";

type Category = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: string | number;
  image_url?: string | null;
  category_id?: number | null;
  stock: number;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();

  const productId = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [loadingProduct, setLoadingProduct] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");

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
  // LOAD PRODUCT
  // =====================================================
  useEffect(() => {
    async function loadProduct() {
      try {
        const token = localStorage.getItem("goldmart_token");

        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(
          `${API_URL}/api/seller/products`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load product."
          );
        }

        const product: Product | undefined =
          data.products?.find(
            (item: Product) =>
              String(item.id) === String(productId)
          );

        if (!product) {
          throw new Error("Product not found.");
        }

        setName(product.name || "");
        setDescription(product.description || "");
        setPrice(String(product.price ?? ""));
        setCategoryId(
          product.category_id
            ? String(product.category_id)
            : ""
        );
        setStock(String(product.stock ?? 0));
        setImageUrl(product.image_url || "");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load product."
        );
      } finally {
        setLoadingProduct(false);
      }
    }

    if (productId) {
      loadProduct();
    }
  }, [productId, router]);

  // =====================================================
  // UPLOAD IMAGE
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
            "Failed to upload image."
        );
      }

      setImageUrl(data.secure_url);
      setSuccess("New image uploaded successfully!");
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
  // SAVE PRODUCT
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

    if (!price || Number(price) < 0) {
      setError("Please enter a valid price.");
      return;
    }

    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    if (!stock || Number(stock) < 0) {
      setError("Please enter a valid stock quantity.");
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
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            price: Number(price),
            category_id: Number(categoryId),
            stock: Number(stock),
            image_url: imageUrl.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to update product."
        );
      }

      setSuccess("Product updated successfully!");

      setTimeout(() => {
        router.push("/seller/products");
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

  // =====================================================
  // LOADING SCREEN
  // =====================================================
  if (loadingProduct) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 text-black">
        <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
          <div className="text-4xl">📦</div>

          <p className="mt-4 font-bold">
            Loading product...
          </p>
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

        {/* BACK */}
        <Link
          href="/seller/products"
          className="font-bold text-[#A67C00]"
        >
          ← Back to My Products
        </Link>

        {/* TITLE */}
        <div className="mt-6">

          <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
            Seller Center
          </p>

          <h1 className="mt-1 text-3xl font-black sm:text-4xl">
            Edit Product
          </h1>

          <p className="mt-2 text-gray-500">
            Update your product information.
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

          {/* PRICE + STOCK */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2">

            <div>
              <label className="text-sm font-bold">
                Price ($)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) =>
                  setPrice(event.target.value)
                }
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
                required
              />
            </div>

            <div>
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

          {/* IMAGE */}
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
                disabled={uploadingImage || saving}
                className="hidden"
              />

              <label
                htmlFor="product-image"
                className={`inline-flex items-center justify-center rounded-xl px-6 py-3 font-bold transition ${
                  uploadingImage
                    ? "cursor-not-allowed bg-gray-200 text-gray-500"
                    : "cursor-pointer bg-black text-white hover:bg-[#D4AF37] hover:text-black"
                }`}
              >
                {uploadingImage
                  ? "Uploading Image..."
                  : imageUrl
                  ? "Choose Another Image"
                  : "Upload Image"}
              </label>

              <p className="mt-3 text-sm text-gray-500">
                Upload a new product image if you want to replace the current one.
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

              <div className="overflow-hidden rounded-2xl border bg-gray-100">

                <img
                  src={imageUrl}
                  alt={name || "Product preview"}
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
              disabled={saving || uploadingImage}
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
