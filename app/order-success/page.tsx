
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "../../components/CartProvider";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

type PaymentResponse = {
  success: boolean;
  message?: string;
  payment?: {
    status?: string;
    order_id?: number | null;
  };
};

type OrderResponse = {
  success: boolean;
  message?: string;
  order?: {
    id: number;
  };
};

export default function OrderSuccessPage() {
  const { clearCart } = useCart();

  const clearCartRef = useRef(clearCart);
  clearCartRef.current = clearCart;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState(
    "Preparing payment confirmation..."
  );
  const [orderId, setOrderId] =
    useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function completeOrder() {
      try {
        setLoading(true);
        setError("");

        // 1. Read the Paystack reference.
        const params = new URLSearchParams(
          window.location.search
        );

        const reference =
          params.get("reference") ||
          params.get("trxref") ||
          sessionStorage.getItem(
            "goldmart-payment-reference"
          );

        if (!reference) {
          throw new Error(
            "Payment reference was not found. Please check your payment history before trying again."
          );
        }

        // 2. Authenticate the buyer.
        const token = localStorage.getItem(
          "goldmart_token"
        );

        if (!token) {
          throw new Error(
            "Please sign in to your GoldMart account, then return to this page to confirm your payment. Do not pay again."
          );
        }

        setStep("Verifying payment with Paystack...");

        // 3. Verify the actual payment.
        const verifyResponse = await fetch(
          `${API_URL}/api/payments/verify/${encodeURIComponent(
            reference
          )}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        const verifyData: PaymentResponse =
          await verifyResponse.json();

        if (
          !verifyResponse.ok ||
          !verifyData.success
        ) {
          throw new Error(
            verifyData.message ||
              "Unable to verify payment. Do not pay again."
          );
        }

        if (
          verifyData.payment?.status !== "success"
        ) {
          throw new Error(
            "Payment has not been confirmed. Do not make another payment while verification is pending."
          );
        }

        // 4. Create or recover the order.
        setStep("Finalizing your GoldMart order...");

        const orderResponse = await fetch(
          `${API_URL}/api/orders`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              paymentReference: reference,
            }),
            cache: "no-store",
          }
        );

        const orderData: OrderResponse =
          await orderResponse.json();

        if (
          !orderResponse.ok ||
          !orderData.success
        ) {
          throw new Error(
            orderData.message ||
              "Unable to finalize this order. If you were charged, do not pay again."
          );
        }

        const confirmedOrderId =
          Number(orderData.order?.id);

        if (
          !Number.isInteger(confirmedOrderId) ||
          confirmedOrderId <= 0
        ) {
          throw new Error(
            "Payment was verified, but the order confirmation needs review. Do not pay again."
          );
        }

        if (cancelled) return;

        // 5. Only clear cart after an order exists.
        setStep("Completing your order...");

        setOrderId(confirmedOrderId);

        clearCartRef.current();

        sessionStorage.removeItem(
          "goldmart-payment-reference"
        );
        sessionStorage.removeItem(
          "goldmart-delivery"
        );

        setLoading(false);
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Order confirmation failed:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to complete order confirmation. If you were charged, do not pay again."
        );

        setLoading(false);
      }
    }

    completeOrder();

    return () => {
      cancelled = true;
    };
  }, []);

  // ===============================================
  // LOADING
  // ===============================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-black">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">⏳</div>

          <h1 className="mt-5 text-2xl font-black">
            Confirming Your Order
          </h1>

          <p className="mt-4 text-gray-600">
            {step}
          </p>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-[#D4AF37]" />
          </div>

          <p className="mt-5 text-sm text-gray-500">
            Please wait while GoldMart verifies
            your transaction.
          </p>
        </div>
      </main>
    );
  }

  // ===============================================
  // ERROR
  // ===============================================

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-black">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">⚠️</div>

          <h1 className="mt-5 text-2xl font-black">
            Order Confirmation Needs Attention
          </h1>

          <p className="mt-4 text-gray-600">
            {error}
          </p>

          <p className="mt-4 text-sm font-semibold text-red-700">
            If Paystack has charged you, do not
            pay again. Keep your payment reference
            for support.
          </p>

          <div className="mt-7 flex flex-col gap-3">
            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="rounded-xl bg-black px-6 py-4 font-bold text-white"
            >
              Retry Confirmation
            </button>

            <Link
              href="/orders"
              className="rounded-xl border px-6 py-4 text-center font-bold"
            >
              View My Orders
            </Link>

            <Link
              href="/login"
              className="text-center text-sm font-semibold underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ===============================================
  // SUCCESS
  // ===============================================

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-black">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-700">
          ✓
        </div>

        <p className="mt-6 font-bold uppercase tracking-wider text-[#A67C00]">
          GoldMart
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Order Successful!
        </h1>

        <p className="mt-4 text-gray-600">
          Your payment has been verified and
          your GoldMart order was created
          successfully.
        </p>

        {orderId !== null && (
          <div className="mt-6 rounded-2xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">
              Order Number
            </p>

            <p className="mt-2 text-2xl font-black">
              #{orderId}
            </p>
          </div>
        )}

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Link
            href="/orders"
            className="rounded-xl bg-black px-6 py-4 text-center font-bold text-white"
          >
            View My Orders
          </Link>

          <Link
            href="/"
            className="rounded-xl border px-6 py-4 text-center font-bold"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
