"use client";

import Link from "next/link";

const sellerProducts = [
  {
    id: 1,
    name: "Wireless Headphones",
    price: "₦89,000",
    category: "Electronics",
    status: "Active",
  },
  {
    id: 2,
    name: "Smart Watch",
    price: "₦149,000",
    category: "Electronics",
    status: "Active",
  },
  {
    id: 3,
    name: "Leather Backpack",
    price: "₦99,000",
    category: "Fashion",
    status: "Active",
  },
];

export default function SellerProductsPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-black">

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <Link href="/" className="text-2xl font-black">
            Gold<span className="text-[#D4AF37]">Mart</span>
          </Link>

          <Link
            href="/seller"
            className="rounded-full border px-5 py-2 text-sm font-bold"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10">

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
              Seller Center
            </p>

            <h1 className="mt-1 text-3xl font-black">
              My Products
            </h1>

            <p className="mt-2 text-gray-500">
              Manage the products in your GoldMart store.
            </p>
          </div>

          <Link
            href="/seller/products/new"
            className="rounded-full bg-black px-6 py-3 text-center font-bold text-white"
          >
            + Add Product
          </Link>

        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border bg-white">

          <div className="hidden grid-cols-5 gap-4 border-b bg-gray-50 p-5 text-sm font-bold sm:grid">
            <span>Product</span>
            <span>Category</span>
            <span>Price</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {sellerProducts.map((product) => (
            <div
              key={product.id}
              className="grid gap-4 border-b p-5 last:border-b-0 sm:grid-cols-5 sm:items-center"
            >

              <div>
                <p className="text-xs font-bold uppercase text-gray-400 sm:hidden">
                  Product
                </p>

                <p className="font-bold">
                  {product.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-gray-400 sm:hidden">
                  Category
                </p>

                <p className="text-sm text-gray-600">
                  {product.category}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-gray-400 sm:hidden">
                  Price
                </p>

                <p className="font-bold text-[#A67C00]">
                  {product.price}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-gray-400 sm:hidden">
                  Status
                </p>

                <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  {product.status}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-gray-400 sm:hidden">
                  Action
                </p>

                <button
                  type="button"
                  className="rounded-lg border px-4 py-2 text-sm font-bold"
                  onClick={() =>
                    alert(
                      "Product editing will be connected to the database later."
                    )
                  }
                >
                  Edit
                </button>
              </div>

            </div>
          ))}

        </div>

        <div className="mt-8 rounded-3xl bg-black p-8 text-white">

          <p className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]">
            Seller Products
          </p>

          <h2 className="mt-3 text-2xl font-black">
            Manage everything from one place
          </h2>

          <p className="mt-3 max-w-2xl text-gray-400">
            Product information, inventory, images and editing
            will be connected to the GoldMart database during
            the backend stage.
          </p>

        </div>

      </div>
    </main>
  );
}
