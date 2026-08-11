"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "../../components/CartProvider";

export default function CheckoutPage() {
  const { cart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState("card");

  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const price =
        typeof item.price === "number"
          ? item.price
          : Number(String(item.price).replace(/[^0-9.]/g, ""));

      return total + price * item.quantity;
    }, 0);
  }, [cart]);

  const delivery = subtotal > 0 ? 2500 : 0;
  const total = subtotal + delivery;

  function formatPrice(amount: number) {
    return `₦${amount.toLocaleString("en-NG")}`;
  }

  function handlePlaceOrder() {
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    alert(
      "Order created successfully. Real payment processing will be connected to the GoldMart backend."
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-black">

      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">

          <Link href="/" className="text-2xl font-black">
            Gold<span className="text-[#D4AF37]">Mart</span>
          </Link>

          <Link
            href="/cart"
            className="rounded-full border px-5 py-2 text-sm font-bold"
          >
            ← Cart
          </Link>

        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-4 py-10">

        <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
          GoldMart Checkout
        </p>

        <h1 className="mt-1 text-3xl font-black sm:text-4xl">
          Complete Your Order
        </h1>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          {/* LEFT */}
          <section className="space-y-6 lg:col-span-2">

            {/* DELIVERY */}
            <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">

              <h2 className="text-xl font-black">
                Delivery Information
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">

                <input
                  placeholder="First Name"
                  className="rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
                />

                <input
                  placeholder="Last Name"
                  className="rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
                />

                <input
                  type="email"
                  placeholder="Email"
                  className="rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
                />

                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
                />

                <textarea
                  rows={3}
                  placeholder="Full Delivery Address"
                  className="resize-none rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37] sm:col-span-2"
                />

                <input
                  placeholder="City"
                  className="rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
                />

                <select className="rounded-xl border bg-white px-4 py-3 outline-none focus:border-[#D4AF37]">
                  <option>Rivers</option>
                  <option>Lagos</option>
                  <option>Abuja</option>
                  <option>Oyo</option>
                  <option>Delta</option>
                  <option>Enugu</option>
                  <option>Kano</option>
                  <option>Other</option>
                </select>

              </div>

            </div>

            {/* DELIVERY METHOD */}
            <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">

              <h2 className="text-xl font-black">
                Delivery Method
              </h2>

              <label className="mt-5 flex cursor-pointer items-center justify-between rounded-2xl border p-4">

                <div className="flex items-center gap-3">

                  <input
                    type="radio"
                    name="delivery"
                    defaultChecked
                  />

                  <div>
                    <p className="font-bold">
                      Standard Delivery
                    </p>

                    <p className="text-sm text-gray-500">
                      3–7 business days
                    </p>
                  </div>

                </div>

                <span className="font-bold">
                  ₦2,500
                </span>

              </label>

            </div>

            {/* PAYMENT */}
            <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">

              <h2 className="text-xl font-black">
                Payment Method
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">

                {[
                  ["card", "💳", "Card"],
                  ["transfer", "🏦", "Bank Transfer"],
                  ["wallet", "📱", "Wallet"],
                ].map(([value, icon, name]) => (

                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value)}
                    className={`rounded-2xl border p-5 text-left ${
                      paymentMethod === value
                        ? "border-[#D4AF37] bg-yellow-50"
                        : ""
                    }`}
                  >

                    <div className="text-2xl">
                      {icon}
                    </div>

                    <p className="mt-2 font-bold">
                      {name}
                    </p>

                  </button>

                ))}

              </div>

            </div>

          </section>

          {/* ORDER SUMMARY */}
          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-24">

            <h2 className="text-xl font-black">
              Order Summary
            </h2>

            {cart.length === 0 ? (

              <div className="py-10 text-center">

                <div className="text-5xl">
                  🛒
                </div>

                <p className="mt-4 font-bold">
                  Your cart is empty
                </p>

                <Link
                  href="/shop"
                  className="mt-5 inline-block rounded-full bg-black px-6 py-3 text-sm font-bold text-white"
                >
                  Continue Shopping
                </Link>

              </div>

            ) : (

              <>
                <div className="mt-6 space-y-4">

                  {cart.map((item) => {

                    const price =
                      typeof item.price === "number"
                        ? item.price
                        : Number(
                            String(item.price).replace(
                              /[^0-9.]/g,
                              ""
                            )
                          );

                    return (
                      <div
                        key={item.id}
                        className="flex justify-between gap-4 border-b pb-4"
                      >

                        <div>
                          <p className="font-bold">
                            {item.name}
                          </p>

                          <p className="text-sm text-gray-500">
                            Quantity: {item.quantity}
                          </p>
                        </div>

                        <p className="font-bold">
                          {formatPrice(price * item.quantity)}
                        </p>

                      </div>
                    );

                  })}

                </div>

                <div className="mt-6 space-y-3 border-b pb-6">

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Subtotal
                    </span>

                    <span className="font-bold">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between">

                    <span className="text-gray-500">
                      Delivery
                    </span>

                    <span className="font-bold">
                      {formatPrice(delivery)}
                    </span>

                  </div>

                </div>

                <div className="flex justify-between py-6">

                  <span className="text-lg font-black">
                    Total
                  </span>

                  <span className="text-xl font-black text-[#A67C00]">
                    {formatPrice(total)}
                  </span>

                </div>

                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  className="w-full rounded-xl bg-black py-4 font-bold text-white transition hover:bg-[#D4AF37] hover:text-black"
                >
                  Place Order
                </button>

              </>

            )}

          </aside>

        </div>

      </div>
    </main>
  );
}
