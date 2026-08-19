"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "../../components/CartProvider";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

type PaymentMethod = "card" | "transfer" | "wallet";

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("card");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [delivery, setDelivery] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "Rivers",
  });

  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const price =
        typeof item.price === "number"
          ? item.price
          : Number(
              String(item.price).replace(/[^0-9.]/g, "")
            );

      return total + price * item.quantity;
    }, 0);
  }, [cart]);

  const deliveryFee = subtotal > 0 ? 2500 : 0;
  const total = subtotal + deliveryFee;

  function formatPrice(amount: number) {
    return `₦${amount.toLocaleString("en-NG")}`;
  }

  function updateDelivery(
    field: keyof typeof delivery,
    value: string
  ) {
    setDelivery((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handlePlaceOrder() {
    setError("");

    if (cart.length === 0) {
      setError("Your cart is empty.");
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
        localStorage.getItem("token") ||
        localStorage.getItem("goldmart-token") ||
        localStorage.getItem("authToken");

      if (!token) {
        setError(
          "Please log in before making a payment."
        );
        setLoading(false);
        return;
      }

      // ------------------------------------------------
      // INITIALIZE REAL PAYSTACK PAYMENT
      // ------------------------------------------------

      const paymentResponse = await fetch(
        `${API_URL}/api/payments/initialize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: delivery.email,
            amount: total,
            currency: "NGN",
            metadata: {
              payment_method: paymentMethod,
              delivery: {
                firstName: delivery.firstName,
                lastName: delivery.lastName,
                phone: delivery.phone,
                address: delivery.address,
                city: delivery.city,
                state: delivery.state,
              },
            },
          }),
        }
      );

      const paymentData =
        await paymentResponse.json();

      if (!paymentResponse.ok || !paymentData.success) {
        throw new Error(
          paymentData.message ||
            "Unable to initialize payment."
        );
      }

      const authorizationUrl =
        paymentData.payment?.authorization_url;

      const reference =
        paymentData.payment?.reference;

      if (!authorizationUrl || !reference) {
        throw new Error(
          "Payment provider did not return a payment URL."
        );
      }

      /*
       * Save the reference temporarily so the checkout
       * page can verify the payment after Paystack sends
       * the customer back.
       */

      sessionStorage.setItem(
        "goldmart-payment-reference",
        reference
      );

      sessionStorage.setItem(
        "goldmart-delivery",
        JSON.stringify(delivery)
      );

      /*
       * Send the customer to Paystack.
       *
       * Paystack handles:
       * - Card
       * - Bank transfer
       * - Other payment channels available
       *   for the customer's currency/account.
       */

      window.location.href = authorizationUrl;
    } catch (err) {
      console.error("Payment error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while starting payment."
      );

      setLoading(false);
    }
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
            Gold
            <span className="text-[#D4AF37]">
              Mart
            </span>
          </Link>

          <Link
            href="/cart"
            className="rounded-full border px-5 py-2 text-sm font-bold transition hover:bg-gray-100"
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

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          {/* LEFT SIDE */}
          <section className="space-y-6 lg:col-span-2">

            {/* DELIVERY INFORMATION */}
            <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">

              <h2 className="text-xl font-black">
                Delivery Information
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">

                <input
                  value={delivery.firstName}
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
                  value={delivery.lastName}
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
                  value={delivery.email}
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
                  value={delivery.phone}
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
                  value={delivery.address}
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
                  value={delivery.city}
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
                  value={delivery.state}
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
                  {formatPrice(deliveryFee)}
                </span>

              </label>

            </div>

            {/* PAYMENT METHOD */}
            <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">

              <h2 className="text-xl font-black">
                Payment Method
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                You will be securely redirected to
                Paystack to complete your payment.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod("card")
                  }
                  className={`rounded-2xl border p-5 text-left transition ${
                    paymentMethod === "card"
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
                    Visa, Mastercard and more
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod("transfer")
                  }
                  className={`rounded-2xl border p-5 text-left transition ${
                    paymentMethod === "transfer"
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
                    Pay using bank transfer
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod("wallet")
                  }
                  className={`rounded-2xl border p-5 text-left transition ${
                    paymentMethod === "wallet"
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
                    Available payment wallets
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
                            Quantity:{" "}
                            {item.quantity}
                          </p>
                        </div>

                        <p className="font-bold">
                          {formatPrice(
                            price *
                              item.quantity
                          )}
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
                      {formatPrice(
                        deliveryFee
                      )}
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
                  disabled={loading}
                  className="w-full rounded-xl bg-black py-4 font-bold text-white transition hover:bg-[#D4AF37] hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Opening Secure Payment..."
                    : `Pay ${formatPrice(total)}`}
                </button>

                <p className="mt-4 text-center text-xs text-gray-500">
                  🔒 Secure payment powered by
                  Paystack
                </p>

              </>
            )}

          </aside>

        </div>
      </div>
    </main>
  );
}
