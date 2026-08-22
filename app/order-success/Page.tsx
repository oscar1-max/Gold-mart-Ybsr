"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "../../components/CartProvider";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

export default function OrderSuccessPage() {
  const { clearCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState<number | null>(
    null
  );

  useEffect(() => {
    async function completePayment() {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("goldmart_token");

        if (!token) {
          window.location.href = "/login";
          return;
        }

        const params = new URLSearchParams(
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

        // =============================================
        // STEP 1: VERIFY PAYMENT WITH GOLDMART
        // =============================================

        const verifyResponse = await fetch(
          `${API_URL}/api/payments/verify/${encodeURIComponent(
            reference
          )}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        const verifyData =
          await verifyResponse.json();

        if (
          !verifyResponse.ok ||
          !verifyData.success
        ) {
          throw new Error(
            verifyData.message ||
              "Payment could not be verified."
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

        // =============================================
        // STEP 2: GET DELIVERY INFORMATION
        // =============================================

        let delivery = {};

        const savedDelivery =
          sessionStorage.getItem(
            "goldmart-delivery"
          );

        if (savedDelivery) {
          try {
            delivery =
              JSON.parse(savedDelivery);
          } catch {
            delivery = {};
          }
        }

        // =============================================
        // STEP 3: CREATE ORDER
        // =============================================

        const orderResponse = await fetch(
          `${API_URL}/api/orders`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              paymentReference:
                reference,
              delivery,
            }),
          }
        );

        const orderData =
          await orderResponse.json();

        if (
          !orderResponse.ok ||
          !orderData.success
        ) {
          throw new Error(
            orderData.message ||
              "Payment succeeded but order creation failed."
          );
        }

        // =============================================
        // STEP 4: SAVE ORDER ID
        // =============================================

        if (orderData.order?.id) {
          setOrderId(
            Number(orderData.order.id)
          );
        }

        // =============================================
        // STEP 5: CLEAR CART
        // =============================================

        clearCart();

        // =============================================
        // STEP 6: REMOVE TEMPORARY PAYMENT DATA
        // =============================================

        sessionStorage.removeItem(
          "goldmart-payment-reference"
        );

        sessionStorage.removeItem(
          "goldmart-delivery"
        );

        setSuccess(true);
      } catch (err) {
        console.error(
          "Order success error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    completePayment();
  }, [clearCart]);

  // ===============================================
  // LOADING
  // ===============================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-black">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="text-6xl">
            ⏳
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Confirming Your Payment
          </h1>

          <p className="mt-3 text-gray-500">
            Please wait while GoldMart verifies
            your payment and creates your order.
          </p>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-[#D4AF37]" />
          </div>
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
          <div className="text-6xl">
            ⚠️
          </div>

          <h1 className="mt-5 text-2xl font-black">
            We Could Not Complete Your Order
          </h1>

          <p className="mt-4 text-gray-500">
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
              href="/"
              className="rounded-full border px-6 py-3 font-bold transition hover:bg-gray-100"
            >
              Back to Home
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
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
          ✓
        </div>

        <p className="mt-6 text-sm font-bold uppercase tracking-wider text-[#A67C00]">
          GoldMart
        </p>

        <h1 className="mt-2 text-3xl font-black">
          Payment Successful!
        </h1>

        <p className="mt-4 text-gray-500">
          Your payment has been verified and
          your order has been created successfully.
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
