import Link from "next/link";

export default function OrderSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-black">

      <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm sm:p-12">

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
          ✓
        </div>

        <p className="mt-8 text-sm font-bold uppercase tracking-widest text-[#A67C00]">
          GoldMart
        </p>

        <h1 className="mt-2 text-3xl font-black sm:text-4xl">
          Order Confirmed!
        </h1>

        <p className="mx-auto mt-4 max-w-md text-gray-500">
          Thank you for shopping with GoldMart. Your order has
          been received and is being prepared.
        </p>

        <div className="mt-8 rounded-2xl bg-gray-50 p-5 text-left">

          <div className="flex justify-between border-b pb-4">
            <span className="text-sm text-gray-500">
              Order Number
            </span>

            <span className="font-bold">
              #GM-1001
            </span>
          </div>

          <div className="flex justify-between pt-4">
            <span className="text-sm text-gray-500">
              Status
            </span>

            <span className="font-bold text-green-600">
              Confirmed
            </span>
          </div>

        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">

          <Link
            href="/"
            className="flex-1 rounded-xl bg-black px-6 py-3 font-bold text-white"
          >
            Continue Shopping
          </Link>

          <Link
            href="/orders"
            className="flex-1 rounded-xl border px-6 py-3 font-bold"
          >
            View Orders
          </Link>

        </div>

        <p className="mt-6 text-xs text-gray-400">
          Real order numbers and order status will be connected
          to the GoldMart database during the backend stage.
        </p>

      </div>

    </main>
  );
}
