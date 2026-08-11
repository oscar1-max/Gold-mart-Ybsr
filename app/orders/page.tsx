import Link from "next/link";

const orders = [
  {
    id: "#GM-1001",
    date: "August 11, 2026",
    product: "Wireless Headphones",
    quantity: 1,
    total: "₦91,500",
    status: "Processing",
  },
  {
    id: "#GM-1002",
    date: "August 8, 2026",
    product: "Smart Watch",
    quantity: 1,
    total: "₦151,500",
    status: "Delivered",
  },
];

export default function OrdersPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-black">

      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">

          <Link href="/" className="text-2xl font-black">
            Gold<span className="text-[#D4AF37]">Mart</span>
          </Link>

          <Link
            href="/"
            className="rounded-full border px-5 py-2 text-sm font-bold"
          >
            Continue Shopping
          </Link>

        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-4 py-10">

        <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
          My Account
        </p>

        <h1 className="mt-1 text-3xl font-black sm:text-4xl">
          My Orders
        </h1>

        <p className="mt-3 text-gray-500">
          Track your GoldMart purchases and delivery status.
        </p>

        {/* ORDERS */}
        <div className="mt-8 space-y-5">

          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-3xl border bg-white p-6 shadow-sm"
            >

              {/* TOP */}
              <div className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <p className="text-sm font-bold text-[#A67C00]">
                    {order.id}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Ordered on {order.date}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-4 py-2 text-xs font-bold ${
                    order.status === "Delivered"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {order.status}
                </span>

              </div>

              {/* PRODUCT */}
              <div className="flex flex-col gap-5 py-6 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-4">

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-3xl">
                    🛍️
                  </div>

                  <div>
                    <h2 className="font-black">
                      {order.product}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Quantity: {order.quantity}
                    </p>
                  </div>

                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-gray-400">
                    Total
                  </p>

                  <p className="mt-1 font-black text-[#A67C00]">
                    {order.total}
                  </p>
                </div>

              </div>

              {/* TRACKING */}
              <div className="border-t pt-5">

                <p className="text-sm font-bold">
                  Delivery Progress
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2">

                  <div className="text-center">

                    <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                      ✓
                    </div>

                    <p className="mt-2 text-xs font-bold">
                      Ordered
                    </p>

                  </div>

                  <div className="text-center">

                    <div
                      className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${
                        order.status === "Delivered"
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }`}
                    >
                      {order.status === "Delivered" ? "✓" : "2"}
                    </div>

                    <p className="mt-2 text-xs font-bold">
                      Shipped
                    </p>

                  </div>

                  <div className="text-center">

                    <div
                      className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${
                        order.status === "Delivered"
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    >
                      {order.status === "Delivered" ? "✓" : "3"}
                    </div>

                    <p className="mt-2 text-xs font-bold">
                      Delivered
                    </p>

                  </div>

                </div>

              </div>

            </article>
          ))}

        </div>

        {/* EMPTY / FUTURE NOTE */}
        <section className="mt-8 rounded-3xl bg-black p-8 text-white">

          <p className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]">
            GoldMart Orders
          </p>

          <h2 className="mt-3 text-2xl font-black">
            Your orders, all in one place.
          </h2>

          <p className="mt-3 max-w-2xl text-gray-400">
            These are currently sample orders. Once the backend
            is connected, this page will automatically display
            the customer's real orders and live delivery status.
          </p>

        </section>

      </div>
    </main>
  );
              }
