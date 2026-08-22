"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "../../components/CartProvider";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

type PaymentMethod =
  | "card"
  | "transfer"
  | "wallet";

type Delivery = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
};

function normalizeCurrency(currency?: string) {
  return String(currency || "NGN").toUpperCase();
}

function getNumericPrice(
  price: string | number
) {
  if (typeof price === "number") {
    return price;
  }

  const cleaned = String(price)
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");

  const value = Number(cleaned);

  return Number.isFinite(value) ? value : 0;
}

function getCurrencySymbol(currency: string) {
  switch (normalizeCurrency(currency)) {
    case "NGN":
      return "₦";

    case "USD":
      return "$";

    case "GBP":
      return "£";

    case "EUR":
      return "€";

    case "GHS":
      return "GH₵";

    case "ZAR":
      return "R";

    case "KES":
      return "KSh";

    case "XOF":
      return "CFA";

    default:
      return currency;
  }
}

export default function CheckoutPage() {
  const { cart } = useCart();

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("card");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [delivery, setDelivery] =
    useState<Delivery>({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "Rivers",
    });

  // =====================================================
  // CART CURRENCIES
  // =====================================================

  const currencies = useMemo(() => {
    return Array.from(
      new Set(
        cart.map((item) =>
          normalizeCurrency(item.currency)
        )
      )
    );
  }, [cart]);

  const currency =
    currencies.length === 1
      ? currencies[0]
      : null;

  // =====================================================
  // SUBTOTAL
  // =====================================================

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) => {
        const price =
          getNumericPrice(item.price);

        return (
          total +
          price * Number(item.quantity)
        );
      },
      0
    );
  }, [cart]);

  // =====================================================
  // DELIVERY FEE
  // =====================================================

  const deliveryFee = 0;

  const total =
    subtotal + deliveryFee;

  // =====================================================
  // FORMAT PRICE
  // =====================================================

  function formatPrice(
    amount: number
  ) {
    const currentCurrency =
      currency || "NGN";

    const symbol =
      getCurrencySymbol(
        currentCurrency
      );

    return `${symbol}${amount.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  // =====================================================
  // UPDATE DELIVERY
  // =====================================================

  function updateDelivery(
    field: keyof Delivery,
    value: string
  ) {
    setDelivery((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // =====================================================
  // PLACE ORDER / PAYMENT
  // =====================================================

  async function handlePlaceOrder() {
    setError("");

    if (cart.length === 0) {
      setError(
        "Your cart is empty."
      );
      return;
    }

    if (!currency) {
      setError(
        "Your cart contains products with different currencies. Please remove the products with different currencies and try again."
      );
      return;
    }

    if (
      !delivery.firstName ||
      !delivery.lastName ||
      !delivery.email ||
      !delivery.phone ||
      !delivery.address ||
      !delivery.city ||
      !delivery.state
    ) {
      setError(
        "Please complete all delivery information."
      );
      return;
    }

    try {
      setLoading(true);

      const token =
        localStorage.getItem(
          "goldmart_token"
        );

      if (!token) {
        setError(
          "Please log in before making a payment."
        );

        setLoading(false);
        return;
      }

      // =================================================
      // STEP 1: SYNC CART WITH DATABASE
      // =================================================

      const syncResponse =
        await fetch(
          `${API_URL}/api/cart/sync`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              items: cart.map(
                (item) => ({
                  productId:
                    item.id,

                  quantity:
                    Number(
                      item.quantity
                    ),
                })
              ),
            }),
          }
        );

      const syncData =
        await syncResponse.json();

      if (
        !syncResponse.ok ||
        !syncData.success
      ) {
        throw new Error(
          syncData.message ||
            "Unable to synchronize your cart."
        );
      }

      // =================================================
      // STEP 2: SAVE DELIVERY
      // =================================================

      sessionStorage.setItem(
        "goldmart-delivery",
        JSON.stringify(
          delivery
        )
      );

      // =================================================
      // STEP 3: INITIALIZE PAYMENT
      //
      // IMPORTANT:
      //
      // If product is NGN 10,000:
      // payment amount = NGN 10,000
      //
      // It must NOT become:
      // USD 10,000 × 1500
      // =================================================

      const paymentResponse =
        await fetch(
          `${API_URL}/api/payments/initialize`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              email:
                delivery.email,

              amount:
                total,

              currency:
                currency,

              metadata: {
                payment_method:
                  paymentMethod,

                delivery,

                goldmart_currency:
                  currency,

                goldmart_total:
                  Number(
                    total.toFixed(2)
                  ),
              },
            }),
          }
        );

      const paymentData =
        await paymentResponse.json();

      if (
        !paymentResponse.ok ||
        !paymentData.success
      ) {
        throw new Error(
          paymentData.message ||
            "Unable to initialize payment."
        );
      }

      const authorizationUrl =
        paymentData.payment
          ?.authorization_url;

      const reference =
        paymentData.payment
          ?.reference;

      if (
        !authorizationUrl ||
        !reference
      ) {
        throw new Error(
          "Payment provider did not return a payment URL."
        );
      }

      // =================================================
      // STEP 4: SAVE PAYMENT REFERENCE
      // =================================================

      sessionStorage.setItem(
        "goldmart-payment-reference",
        reference
      );

      // =================================================
      // STEP 5: REDIRECT TO PAYSTACK
      // =================================================

      window.location.href =
        authorizationUrl;
    } catch (err) {
      console.error(
        "Checkout error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while starting payment."
      );

      setLoading(false);
    }
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-gray-50 text-black">

      {/* HEADER */}

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">

          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-black"
          >
            Gold
            <span className="text-[#D4AF37]">
              Mart
            </span>
          </Link>

          <div className="flex items-center gap-2">

            <Link
              href="/"
              className="rounded-full bg-black px-5 py-2 text-sm font-bold text-white transition hover:bg-[#D4AF37] hover:text-black"
            >
              🏠 Home
            </Link>

            <Link
              href="/cart"
              className="rounded-full border px-5 py-2 text-sm font-bold transition hover:bg-gray-100"
            >
              ← Cart
            </Link>

          </div>

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

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* MIXED CURRENCY WARNING */}

        {cart.length > 0 &&
          currencies.length > 1 && (
            <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-semibold text-yellow-800">
              Your cart contains products
              with different currencies.
              Please remove products with
              different currencies.
            </div>
          )}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          {/* LEFT */}

          <section className="space-y-6 lg:col-span-2">

            {/* DELIVERY INFORMATION */}

            <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">

              <h2 className="text-xl font-black">
                Delivery Information
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">

                <input
                  value={
                    delivery.firstName
                  }
                  onChange={(e) =>
                    updateDelivery(
                      "firstName",
                      e.target.value
                    )
                  }
                  placeholder="First Name"
                  className="rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
                />

                <input
                  value={
                    delivery.lastName
                  }
                  onChange={(e) =>
                    updateDelivery(
                      "lastName",
                      e.target.value
                    )
                  }
                  placeholder="Last Name"
                  className="rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
                />

                <input
                  type="email"
                  value={
                    delivery.email
                  }
                  onChange={(e) =>
                    updateDelivery(
                      "email",
                      e.target.value
                    )
                  }
                  placeholder="Email Address"
                  className="rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
                />

                <input
                  type="tel"
                  value={
                    delivery.phone
                  }
                  onChange={(e) =>
                    updateDelivery(
                      "phone",
                      e.target.value
                    )
                  }
                  placeholder="Phone Number"
                  className="rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
                />

                <textarea
                  rows={3}
                  value={
                    delivery.address
                  }
                  onChange={(e) =>
                    updateDelivery(
                      "address",
                      e.target.value
                    )
                  }
                  placeholder="Full Delivery Address"
                  className="resize-none rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37] sm:col-span-2"
                />

                <input
                  value={
                    delivery.city
                  }
                  onChange={(e) =>
                    updateDelivery(
                      "city",
                      e.target.value
                    )
                  }
                  placeholder="City"
                  className="rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
                />

                <select
                  value={
                    delivery.state
                  }
                  onChange={(e) =>
                    updateDelivery(
                      "state",
                      e.target.value
                    )
                  }
                  className="rounded-xl border bg-white px-4 py-3 outline-none focus:border-[#D4AF37]"
                >
                  <option>Rivers</option>
                  <option>Lagos</option>
                  <option>Abuja</option>
                  <option>Oyo</option>
                  <option>Delta</option>
                  <option>Enugu</option>
                  <option>Kano</option>
                  <option>Edo</option>
                  <option>Other</option>
                </select>

              </div>

            </div>

            {/* DELIVERY METHOD */}

            <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">

              <h2 className="text-xl font-black">
                Delivery Method
              </h2>

              <label className="mt-5 flex cursor-pointer items-center justify-between rounded-2xl border border-[#D4AF37] bg-yellow-50 p-4">

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
                  Free
                </span>

              </label>

            </div>

            {/* PAYMENT METHOD */}

            <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">

              <h2 className="text-xl font-black">
                Payment Method
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                You will be securely
                redirected to Paystack
                to complete your payment.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod(
                      "card"
                    )
                  }
                  className={`rounded-2xl border p-5 text-left transition ${
                    paymentMethod ===
                    "card"
                      ? "border-[#D4AF37] bg-yellow-50"
                      : "hover:border-gray-400"
                  }`}
                >
                  <div className="text-2xl">
                    💳
                  </div>

                  <p className="mt-2 font-bold">
                    Card
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Visa, Mastercard
                    and more
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod(
                      "transfer"
                    )
                  }
                  className={`rounded-2xl border p-5 text-left transition ${
                    paymentMethod ===
                    "transfer"
                      ? "border-[#D4AF37] bg-yellow-50"
                      : "hover:border-gray-400"
                  }`}
                >
                  <div className="text-2xl">
                    🏦
                  </div>

                  <p className="mt-2 font-bold">
                    Bank Transfer
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Pay using bank
                    transfer
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod(
                      "wallet"
                    )
                  }
                  className={`rounded-2xl border p-5 text-left transition ${
                    paymentMethod ===
                    "wallet"
                      ? "border-[#D4AF37] bg-yellow-50"
                      : "hover:border-gray-400"
                  }`}
                >
                  <div className="text-2xl">
                    📱
                  </div>

                  <p className="mt-2 font-bold">
                    Wallet
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Available payment
                    wallets
                  </p>
                </button>

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

                  {cart.map(
                    (item) => {
                      const price =
                        getNumericPrice(
                          item.price
                        );

                      const itemCurrency =
                        normalizeCurrency(
                          item.currency
                        );
                                            return (
                        <div
                          key={item.id}
                          className="flex justify-between gap-4 border-b pb-4"
                        >

                          <div className="min-w-0">

                            <p className="font-bold">
                              {item.name}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              Qty: {item.quantity}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-gray-400">
                              {itemCurrency}
                            </p>

                          </div>

                          <p className="whitespace-nowrap font-bold">
                            {getCurrencySymbol(
                              itemCurrency
                            )}

                            {(
                              price *
                              Number(item.quantity)
                            ).toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </p>

                        </div>
                      );
                    }
                  )}

                </div>

                <div className="mt-6 space-y-3">

                  <div className="flex justify-between text-sm">

                    <span className="text-gray-500">
                      Items
                    </span>

                    <span className="font-bold">
                      {cart.reduce(
                        (sum, item) =>
                          sum +
                          Number(
                            item.quantity
                          ),
                        0
                      )}
                    </span>

                  </div>

                  <div className="flex justify-between text-sm">

                    <span className="text-gray-500">
                      Subtotal
                    </span>

                    <span className="font-bold">
                      {formatPrice(
                        subtotal
                      )}
                    </span>

                  </div>

                  <div className="flex justify-between text-sm">

                    <span className="text-gray-500">
                      Delivery
                    </span>

                    <span className="font-bold">
                      Free
                    </span>

                  </div>

                  <div className="border-t pt-4">

                    <div className="flex justify-between">

                      <span className="text-lg font-black">
                        Total
                      </span>

                      <span className="text-2xl font-black text-[#A67C00]">
                        {formatPrice(
                          total
                        )}
                      </span>

                    </div>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={
                    handlePlaceOrder
                  }
                  disabled={
                    loading ||
                    cart.length === 0 ||
                    !currency
                  }
                  className="mt-6 w-full rounded-2xl bg-black py-4 font-black text-white transition hover:bg-[#D4AF37] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Processing Payment..."
                    : `Pay ${formatPrice(
                        total
                      )}`}
                </button>

                <p className="mt-4 text-center text-xs text-gray-400">
                  🔒 Secure payment powered
                  by Paystack
                </p>

              </>
            )}

          </aside>

        </div>

      </div>

    </main>
  );
}

     
