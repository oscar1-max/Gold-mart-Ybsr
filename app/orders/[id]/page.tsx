import Link from "next/link";

const order = {
  id: "#GM-1001",
  product: "Wireless Headphones",
  quantity: 1,
  total: "₦91,500",
  status: "Processing",
  deliveryAddress: "Customer delivery address",
};

const steps = [
  {
    title: "Order Placed",
    description: "Your order has been received.",
    completed: true,
  },
  {
    title: "Order Confirmed",
    description: "The seller has confirmed your order.",
    completed: true,
  },
  {
    title: "Preparing Order",
    description: "The seller is preparing your package.",
    completed: true,
  },
  {
    title: "Shipped",
    description: "Your package is on its way.",
    completed: false,
  },
  {
    title: "Delivered",
    description: "Your package has been delivered.",
    completed: false,
  },
];

export default function OrderTrackingPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-black">

      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">

          <Link href="/" className="text-2xl font-black">
            Gold<span className="text-[#D4AF37]">Mart</span>
          </Link>

          <Link
            href="/orders"
            className="rounded-full border px-5 py-2 text-sm font-bold"
          >
            ← My Orders
          </Link>

        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-4xl px-4 py-10">

        <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
          GoldMart Delivery
        </p>

        <div className="mt-1 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <h1 className="text-3xl font-black sm:text-4xl">
              Track Your Order
            </h1>

            <p className="mt-2 text-gray-500">
              Order {order.id}
            </p>
          </div>

          <span className="w-fit rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
            {order.status}
          </span>

        </div>

        {/* ORDER SUMMARY */}
        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm sm:p-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 text-4xl">
                🎧
              </div>

              <div>
                <h2 className="text-lg font-black">
                  {order.product}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Quantity: {order.quantity}
                </p>
              </div>

            </div>

            <div>
              <p className="text-xs font-bold uppercase text-gray-400">
                Order Total
              </p>

              <p className="mt-1 text-xl font-black text-[#A67C00]">
                {order.total}
              </p>
            </div>

          </div>

        </section>

        {/* TRACKING */}
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-black">
            Delivery Progress
          </h2>

          <div className="mt-8">

            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative flex gap-4"
              >

                {/* LINE */}
                {index < steps.length - 1 && (
                  <div
                    className={`absolute left-4 top-9 h-full w-0.5 ${
                      step.completed
                        ? "bg-green-500"
                        : "bg-gray-200"
                    }`}
                  />
                )}

                {/* ICON */}
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    step.completed
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step.completed ? "✓" : index + 1}
                </div>

                {/* TEXT */}
                <div className="pb-8">

                  <h3
                    className={`font-black ${
                      step.completed
                        ? "text-black"
                        : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {step.description}
                  </p>

                </div>

              </div>
            ))}

          </div>

        </section>

        {/* DELIVERY INFORMATION */}
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">

          <h2 className="text-xl font-black">
            Delivery Information
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">

            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-xs font-bold uppercase text-gray-400">
                Delivery Address
              </p>

              <p className="mt-2 font-bold">
                {order.deliveryAddress}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-xs font-bold uppercase text-gray-400">
                Estimated Delivery
              </p>

              <p className="mt-2 font-bold">
                3–7 business days
              </p>
            </div>

          </div>

        </section>

        {/* NOTICE */}
        <section className="mt-6 rounded-3xl bg-black p-8 text-white">

          <p className="text-sm font-bold uppercase tracking-widest text-[#D4AF37]">
            Live Tracking
          </p>

          <h2 className="mt-3 text-2xl font-black">
            Real-time delivery updates
          </h2>

          <p className="mt-3 text-gray-400">
            Live tracking and automatic status updates will be
            connected to the GoldMart backend and delivery system.
          </p>

        </section>

      </div>
    </main>
  );
                }
