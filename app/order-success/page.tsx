"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "../../components/CartProvider";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

export default function OrderSuccessPage() {
  const { clearCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState(
    "Confirming your GoldMart payment..."
  );
  const [orderId, setOrderId] =
    useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function completeOrder() {
      try {
        setLoading(true);
        setError("");

        // =================================================
        // 1. CHECK LOGIN
        // =================================================

        setStep(
          "Checking your GoldMart account..."
        );

        const token =
          localStorage.getItem(
            "goldmart_token"
          );

        if (!token) {
          window.location.href = "/login";
          return;
        }

        // =================================================
        // 2. GET PAYSTACK REFERENCE
        // =================================================

        setStep(
          "Reading your payment reference..."
        );

        const params =
          new URLSearchParams(
            window.location.search
          );

        const reference =
          params.get("reference") ||
          params.get("trxref");

        if (!reference) {
          throw new Error(
            "Payment reference was not found."
          );
        }

        console.log(
          "GoldMart reference:",
          reference
        );

        // =================================================
        // 3. VERIFY PAYMENT
        // =================================================

        setStep(
          "Verifying your payment with Paystack..."
        );

        const verifyResponse =
          await fetch(
            `${API_URL}/api/payments/verify/${encodeURIComponent(
              reference
            )}`,
            {
              method: "GET",
              headers: {
                Accept:
                  "application/json",
              },
              cache: "no-store",
            }
          );

        let verifyData: any;

        try {
          verifyData =
            await verifyResponse.json();
        } catch {
          throw new Error(
            `Payment verification server returned an invalid response (HTTP ${verifyResponse.status}).`
          );
        }

        console.log(
          "GoldMart verification:",
          verifyData
        );

        if (
          !verifyResponse.ok ||
          !verifyData.success
        ) {
          throw new Error(
            verifyData.message ||
              "Payment verification failed."
          );
        }

        if (
          verifyData.payment?.status !==
          "success"
        ) {
          throw new Error(
            "Payment was not successful."
          );
        }

        // =================================================
        // 4. GET DELIVERY INFORMATION
        // =================================================

        setStep(
          "Preparing your delivery information..."
        );

        let delivery = {};

        const savedDelivery =
          sessionStorage.getItem(
            "goldmart-delivery"
          );

        if (savedDelivery) {
          try {
            delivery =
              JSON.parse(
                savedDelivery
              );
          } catch {
            delivery = {};
          }
        }

        // =================================================
        // 5. CREATE / RECOVER ORDER
        // =================================================

        setStep(
          "Creating your GoldMart order..."
        );

        const orderResponse =
          await fetch(
            `${API_URL}/api/orders`,
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${token}`,

                "Content-Type":
                  "application/json",

                Accept:
                  "application/json",
              },

              body: JSON.stringify({
                paymentReference:
                  reference,

                delivery,
              }),

              cache: "no-store",
            }
          );

        let orderData: any;

        try {
          orderData =
            await orderResponse.json();
        } catch {
          throw new Error(
            `GoldMart order server returned an invalid response (HTTP ${orderResponse.status}).`
          );
        }

        console.log(
          "GoldMart order response:",
          orderData
        );

        // =================================================
        // IMPORTANT
        //
        // If the order already exists, the backend
        // returns success:true.
        // =================================================

        if (
          !orderResponse.ok ||
          !orderData.success
        ) {
          throw new Error(
            orderData.message ||
              `Order creation failed (HTTP ${orderResponse.status}).`
          );
        }

        // =================================================
        // 6. SAVE ORDER ID
        // =================================================

        const createdOrderId =
          orderData.order?.id;

        if (createdOrderId) {
          setOrderId(
            Number(createdOrderId)
          );
        }

        // =================================================
        // 7. CLEAR CART
        // =================================================

        setStep(
          "Finishing your GoldMart order..."
        );

        clearCart();

        // =================================================
        // 8. REMOVE TEMPORARY DATA
        // =================================================

        sessionStorage.removeItem(
          "goldmart-payment-reference"
        );

        sessionStorage.removeItem(
          "goldmart-delivery"
        );

        // =================================================
        // 9. SUCCESS
        // =================================================

        if (!cancelled) {
          setLoading(false);
        }
      } catch (err) {
        console.error(
          "GoldMart order completion error:",
          err
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong while completing your order."
          );

          setLoading(false);
        }
      }
    }

    completeOrder();

    return () => {
      cancelled = true;
    };
  }, [clearCart]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-black">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">

          <div className="text-6xl">
            ⏳
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Confirming Your GoldMart Order
          </h1>

          <p className="mt-3 text-gray-500">
            {step}
          </p>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-[#D4AF37]" />
          </div>

          <p className="mt-5 text-xs text-gray-400">
            Please do not close this page.
          </p>

        </div>
      </main>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-black">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm sm:p-10">

          <div className="text-6xl">
            ⚠️
          </div>

          <h1 className="mt-5 text-2xl font-black">
            We Could Not Complete Your Order
          </h1>

          <p className="mt-4 break-words text-gray-600">
            {error}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">

            <Link
              href="/checkout"
              className="rounded-full bg-black px-6 py-3 font-bold text-white transition hover:bg-[#D4AF37] hover:text-black"
            >
              Return to Checkout
            </Link>

            <Link
              href="/orders"
              className="rounded-full border px-6 py-3 font-bold transition hover:bg-gray-100"
            >
              View My Orders
            </Link>

          </div>

        </div>
      </main>
    );
  }

  // =====================================================
  // SUCCESS
  // =====================================================

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-black">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm sm:p-10">

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
          ✓
        </div>

        <p className="mt-6 text-sm font-bold uppercase tracking-wider text-[#A67C00]">
          GoldMart
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Order Successful!
        </h1>

        <p className="mt-4 text-gray-500">
          Your payment has been verified
          and your GoldMart order has been
          created successfully.
        </p>

        {orderId && (
          <div className="mt-6 rounded-2xl bg-gray-50 p-4">

            <p className="text-sm text-gray-500">
              Order Number
            </p>

            <p className="mt-1 text-xl font-black">
              #{orderId}
            </p>

          </div>
        )}

        <div className="mt-7 grid gap-3 sm:grid-cols-2">

          <Link
            href="/orders"
            className="rounded-xl bg-black py-4 font-bold text-white transition hover:bg-[#D4AF37] hover:text-black"
          >
            View My Orders
          </Link>

          <Link
            href="/"
            className="rounded-xl border py-4 font-bold transition hover:bg-gray-100"
          >
            Back to Home
          </Link>

        </div>

      </div>
    </main>
  );
      }
