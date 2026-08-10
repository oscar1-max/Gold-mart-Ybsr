"use client";

import Link from "next/link";

const orders = [
  {
    id: "#GM-1001",
    customer: "Customer",
    product: "Wireless Headphones",
    amount: "₦89,000",
    status: "Pending",
  },
  {
    id: "#GM-1002",
    customer: "Customer",
    product: "Smart Watch",
    amount: "₦149,000",
    status: "Processing",
  },
  {
    id: "#GM-1003",
    customer: "Customer",
    product: "Leather Backpack",
    amount: "₦99,000",
    status: "Delivered",
  },
];

export default function SellerOrdersPage() {
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
            Dashboard
          </Link>

        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-4 py-10">

        <Link
          href="/seller"
          className="text-sm font-bold text-[#A67C00]"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-6">

          <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
            Seller Center
          </p>

          <h1 className="mt-1 text-3xl font-black sm:text-4xl">
            Customer Orders
          </h1>

          <p className="mt-3 text-gray-500">
            View and manage orders for your GoldMart store.
          </p>

        </div>

        {/* ORDER LIST */}
        <div className="mt-8 space-y-4">

          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border bg-white p-5 shadow-sm"
            >

              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                {/* ORDER INFO */}
                <div>

                  <p className="text-sm font-bold text-[#A67C00]">
                    {order.id}
                  </p>

                  <h2 className="mt-1 text-lg font-black">
                    {order.product}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Customer: {order.customer}
                  </p>

                </div>

                {/* PRICE */}
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">
                    Amount
                  </p>

                  <p className="mt-1 font-black text-[#A67C00]">
                    {order.amount}
                  </p>
                </div>

                {/* STATUS */}
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">
                    Status
                  </p>

                  <span
                    className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                      order.status === "Delivered"
                        ? "bg-green-100 text-green-700"
                        : order.status === "Processing"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* ACTION */}
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "Order management will be connected to the GoldMart backend."
                    )
                  }
                  className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white"
                >
                  Manage Order
                </button>

              </div>

            </div>
          ))}

        </div>

        {/* NOTICE */}
        <section className="mt-8 rounded-3xl bg-black p-8 text-white">

          <p className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]">
            Coming with the Backend
          </p>

          <h2 className="mt-3 text-2xl font-black">
            Real-time order management
          </h2>

          <p className="mt-3 max-w-2xl text-gray-400">
            These sample orders will later be replaced with
            real customer orders from the GoldMart database.
            Sellers will be able to update order status and
            manage deliveries.
          </p>

        </section>

      </div>
    </main>
  );
}
