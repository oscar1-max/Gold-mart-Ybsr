
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

async function readResponse<T>(
  response: Response
): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(
      "GoldMart could not read the server response. Please retry confirmation. Do not make another payment."
    );
  }
}

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

        // ============================================
        // 1. FIND PAYSTACK REFERENCE
        // ============================================

        const params = new URLSearchParams(
          window.location.search
        );

        const reference = (
          params.get("reference") ||
          params.get("trxref") ||
          sessionStorage.getItem(
            "goldmart-payment-reference"
          ) ||
          ""
        ).trim();

        if (!reference) {
          throw new Error(
            "Payment reference was not found. Check your payment history before trying again."
          );
        }

        // Keep reference available for retries.
        sessionStorage.setItem(
          "goldmart-payment-reference",
          reference
        );

        // ============================================
        // 2. CHECK BUYER AUTHENTICATION
        // ============================================

        const token =
          localStorage.getItem("goldmart_token");

        if (!token) {
          throw new Error(
            "Please sign in to your GoldMart account, then return to this page to confirm your payment. Do not pay again."
          );
        }

        if (cancelled) return;

        setStep(
          "Verifying payment with Paystack..."
        );

        // ============================================
        // 3. VERIFY PAYMENT WITH BACKEND
        // ============================================

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

        const verifyData =
          await readResponse<PaymentResponse>(
            verifyResponse
          );

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
          verifyData.payment?.status !==
          "success"
        ) {
          throw new Error(
            "Payment is not yet confirmed. Do not make another payment while confirmation is pending."
          );
        }

        if (cancelled) return;

        // ============================================
        // 4. CREATE OR RECOVER EXISTING ORDER
        // ============================================

        setStep(
          "Finalizing your GoldMart order..."
        );

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

        const orderData =
          await readResponse<OrderResponse>(
            orderResponse
          );

        if (
          !orderResponse.ok ||
          !orderData.success
        ) {
          throw new Error(
            orderData.message ||
              "Unable to finalize this order. If you were charged, do not pay again."
          );
        }

        // Existing orders are also valid.
        // The backend prevents duplicate orders.

        const confirmedOrderId = Number(
          orderData.order?.id
        );

        if (
          !Number.isSafeInteger(
            confirmedOrderId
          ) ||
          confirmedOrderId <= 0
        ) {
          throw new Error(
            "Payment was verified, but the order confirmation needs review. Do not pay again."
          );
        }

        if (cancelled) return;

        // ============================================
        // 5. CONFIRM ORDER SUCCESS
        // ============================================

        setStep("Completing your order...");
        setOrderId(confirmedOrderId);

        // The order is saved on the backend.
        // A local cart error must not turn a
        // successful order into a payment error.

        try {
          clearCartRef.current();
        } catch (cartError) {
          console.error(
            "Local cart clear error:",
            cartError
          );
        }

        sessionStorage.removeItem(
          "goldmart-payment-reference"
        );

        sessionStorage.removeItem(
          "goldmart-delivery"
        );

        setError("");
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

  // ================================================
  // LOADING SCREEN
  // ================================================

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

  // ================================================
  // ERROR SCREEN
  // ================================================

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

  // ================================================
  // SUCCESS SCREEN
  // ================================================

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
