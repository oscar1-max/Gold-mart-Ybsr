"use client";

import Link from "next/link";
import { useState } from "react";

export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState("card");

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

      {/* CHECKOUT */}
      <div className="mx-auto max-w-7xl px-4 py-10">

        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-[#A67C00]">
            GoldMart Checkout
          </p>

          <h1 className="mt-1 text-3xl font-black sm:text-4xl">
            Complete Your Order
          </h1>

          <p className="mt-3 text-gray-500">
            Enter your delivery details and choose a payment method.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          {/* CUSTOMER DETAILS */}
          <section className="lg:col-span-2">

            <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">

              <h2 className="text-xl font-black">
                Delivery Information
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    First Name
                  </label>

                  <input
                    type="text"
                    placeholder="First name"
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Last Name
                  </label>

                  <input
                    type="text"
                    placeholder="Last name"
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Email
                  </label>

                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    placeholder="08012345678"
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-bold">
                    Delivery Address
                  </label>

                  <textarea
                    rows={3}
                    placeholder="Enter your full delivery address"
                    className="w-full resize-none rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    City
                  </label>

                  <input
                    type="text"
                    placeholder="City"
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    State
                  </label>

                  <select className="w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-[#D4AF37]">
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

            </div>

            {/* DELIVERY */}
            <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">

              <h2 className="text-xl font-black">
                Delivery Method
              </h2>

              <div className="mt-5 space-y-3">

                <label className="flex cursor-pointer items-center justify-between rounded-2xl border p-4">
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

                <label className="flex cursor-pointer items-center justify-between rounded-2xl border p-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="delivery"
                    />

                    <div>
                      <p className="font-bold">
                        Express Delivery
                      </p>

                      <p className="text-sm text-gray-500">
                        1–2 business days
                      </p>
                    </div>
                  </div>

                  <span className="font-bold">
                    ₦5,000
                  </span>
                </label>

              </div>

            </div>

            {/* PAYMENT */}
            <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">

              <h2 className="text-xl font-black">
                Payment Method
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">

                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`rounded-2xl border p-5 text-left ${
                    paymentMethod === "card"
                      ? "border-[#D4AF37] bg-yellow-50"
                      : ""
                  }`}
                >
                  <div className="text-2xl">💳</div>

                  <p className="mt-2 font-bold">
                    Card
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Debit or credit card
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("transfer")}
                  className={`rounded-2xl border p-5 text-left ${
                    paymentMethod === "transfer"
                      ? "border-[#D4AF37] bg-yellow-50"
                      : ""
                  }`}
                >
                  <div className="text-2xl">🏦</div>

                  <p className="mt-2 font-bold">
                    Bank Transfer
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Pay by bank transfer
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("wallet")}
                  className={`rounded-2xl border p-5 text-left ${
                    paymentMethod === "wallet"
                      ? "border-[#D4AF37] bg-yellow-50"
                      : ""
                  }`}
                >
                  <div className="text-2xl">📱</div>

                  <p className="mt-2 font-bold">
                    Wallet
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    GoldMart wallet
                  </p>
                </button>

              </div>

              <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                Selected payment:{" "}
                <span className="font-bold text-black">
                  {paymentMethod === "card"
                    ? "Card"
                    : paymentMethod === "transfer"
                    ? "Bank Transfer"
                    : "GoldMart Wallet"}
                </span>
              </div>

            </div>

          </section>

          {/* ORDER SUMMARY */}
          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-24">

            <h2 className="text-xl font-black">
              Order Summary
            </h2>

            <div className="mt-6 space-y-4 border-b pb-6">

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Products
                </span>

                <span className="font-bold">
                  ₦89,000
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Delivery
                </span>

                <span className="font-bold">
                  ₦2,500
                </span>
              </div>

            </div>

            <div className="flex justify-between py-6">

              <span className="text-lg font-black">
                Total
              </span>

              <span className="text-xl font-black text-[#A67C00]">
                ₦91,500
              </span>

            </div>

            <button
              type="button"
              onClick={() =>
                alert(
                  "Payment processing will be connected to the GoldMart backend."
                )
              }
              className="w-full rounded-xl bg-black py-4 font-bold text-white transition hover:bg-[#D4AF37] hover:text-black"
            >
              Place Order
            </button>

            <div className="mt-5 flex gap-3 rounded-xl bg-gray-50 p-4">

              <span className="text-xl">
                🔒
              </span>

              <p className="text-xs text-gray-500">
                Your order and payment information will be
                securely processed.
              </p>

            </div>

          </aside>

        </div>
      </div>
    </main>
  );
                    }
