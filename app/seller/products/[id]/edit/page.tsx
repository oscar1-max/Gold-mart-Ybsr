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
  const [dealPrice,setDealPrice]=useState("");
  const [dealEnd,setDealEnd]=useState("");
  const [dealBusy,setDealBusy]=useState(false);
  const [dealMessage,setDealMessage]=useState("");

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

  async function saveDeal(clear=false) {
    if (!productId || dealBusy) return;
    setDealBusy(true);setDealMessage("");
    try {
      const token=localStorage.getItem("goldmart_token");
      if (!token) throw new Error("Seller login required.");
      const response=await fetch(`${API_URL}/api/seller/products/${productId}/deal`,{
        method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
        body:JSON.stringify(clear?{clear:true}:{deal_price:Number(dealPrice),start_at:new Date().toISOString(),end_at:new Date(dealEnd).toISOString()})
      });
      const data=await response.json();
      if(!response.ok||!data.success) throw new Error(data.message||"Could not save deal.");
      setDealMessage(data.message||"Updated.");
      if(clear){setDealPrice("");setDealEnd("");}
    } catch(err){setDealMessage(err instanceof Error?err.message:"Could not save deal.");}
    finally{setDealBusy(false);}
  }

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
      <main className="min-h-screen bg-[#FFF8F2] pb-28 text-[#243B53] md:pb-14">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <section className="relative overflow-hidden rounded-[30px] px-6 py-9 text-white shadow-[0_18px_38px_rgba(24,51,62,0.16)] sm:px-10 sm:py-12" style={{background:"linear-gradient(135deg, #14263D 0%, #243B53 50%, #FF6B00 100%)"}}>
          <div className="pointer-events-none absolute -right-10 -top-20 h-60 w-60 rounded-full border-[32px] border-white/10" aria-hidden="true"/>
          <div className="relative"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#FFE9CC]">GOLDMART SELLER STUDIO · Product Editor</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Fine-tune your listing.</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/85">Update product details and inventory without losing your place.</p></div>
        </section>
        <nav aria-label="Seller Studio navigation" className="og-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2">
          <Link href="/seller" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Dashboard</Link>
          <Link href="/seller/products" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Catalogue</Link>
          <Link href="/seller/products/new" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Add Product</Link>
          <Link href="/seller/orders" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Orders</Link>
          <Link href="/seller/payment-protection" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Finance</Link>
          <Link href="/chat" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Messages</Link>
          <Link href="/account" className="shrink-0 rounded-full border border-[#FFF8F2] bg-white px-4 py-2.5 text-xs font-bold text-[#243B53] transition hover:border-[#FF6B00] hover:bg-[#FFF8F2]">Account</Link>
        </nav>
      </div>

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
            className="font-bold text-[#FF6B00]"
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
            Gold<span className="text-[#FF6B00]">
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
          className="font-bold text-[#FF6B00]"
        >
          ← Back to My Products
        </Link>

        <div className="mt-6">

          <p className="text-sm font-bold uppercase tracking-wider text-[#FF6B00]">
            Seller Center
          </p>

          <h1 className="mt-1 text-3xl font-black sm:text-4xl">
            Edit Product
          </h1>

          <p className="mt-2 text-gray-500">
            Update your GoldMart product information.
          </p>

        </div>


        <section className="mt-7 rounded-[24px] border border-[#FFF8F2] bg-[#FFF8F2] p-5 sm:p-7">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#243B53]">Seller promotion tools</p>
          <h2 className="mt-2 text-xl font-black">⚡ Flash Deal</h2>
          <p className="mt-2 text-sm text-[#243B53]">Offer a lower price until your selected end time. Checkout uses the active price automatically. Only USD and NGN supported.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">Deal price<input type="number" min="0.01" step="0.01" value={dealPrice} onChange={e=>setDealPrice(e.target.value)} placeholder="Lower than regular price" className="mt-2 w-full rounded-xl border border-[#FFE9CC] bg-white px-4 py-3"/></label><label className="text-sm font-bold">Ends at<input type="datetime-local" value={dealEnd} onChange={e=>setDealEnd(e.target.value)} className="mt-2 w-full rounded-xl border border-[#FFE9CC] bg-white px-4 py-3"/></label></div>
          <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={dealBusy||!dealPrice||!dealEnd} onClick={()=>void saveDeal()} className="rounded-full bg-[#243B53] px-5 py-3 text-sm font-bold text-white disabled:opacity-40">Start Flash Deal</button><button type="button" disabled={dealBusy} onClick={()=>void saveDeal(true)} className="rounded-full border border-[#FFE9CC] bg-white px-5 py-3 text-sm font-bold disabled:opacity-40">Clear Deal</button></div>
          {dealMessage&&<p role="status" className="mt-3 text-sm font-semibold">{dealMessage}</p>}
        </section>
        {/* ERROR */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm font-medium text-orange-700">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-[25px] border border-[#FFF8F2] bg-white shadow-[0_9px_26px_rgba(24,51,62,0.05)] p-6 shadow-sm sm:p-8"
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
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-[#FF6B00]"
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
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-[#FF6B00]"
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
                className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-[#FF6B00]"
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
                  className="w-full rounded-xl border py-3 pl-10 pr-4 outline-none focus:border-[#FF6B00]"
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
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-[#FF6B00]"
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
              className="mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-[#FF6B00]"
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
              className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-[#FF6B00]"
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
              className="flex-1 rounded-xl bg-black px-6 py-3 font-bold text-white transition hover:bg-[#FF6B00] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
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
