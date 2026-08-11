"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

export default function BecomeSellerPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function becomeSeller() {
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("goldmart_token");
      const savedUser = localStorage.getItem("goldmart_user");

      if (!token || !savedUser) {
        router.push("/login");
        return;
      }

      const user = JSON.parse(savedUser);

      if (user.role === "seller") {
        router.push("/seller");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/auth/become-seller`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to become a seller."
        );
      }

      localStorage.setItem(
        "goldmart_token",
        data.token
      );

      localStorage.setItem(
        "goldmart_user",
        JSON.stringify(data.user)
      );

      router.push("/seller");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-black">

      <div className="mx-auto max-w-2xl">

        <Link
          href="/"
          className="text-2xl font-black"
        >
          Gold<span className="text-[#D4AF37]">Mart</span>
        </Link>

        <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm sm:p-10">

          <div className="text-5xl">
            🏪
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-wider text-[#A67C00]">
            GoldMart Seller Center
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Become a Seller
          </h1>

          <p className="mt-4 text-gray-500">
            Turn your existing GoldMart buyer account into
            a seller account and start selling products.
          </p>

          <div className="mt-8 space-y-4">

            <div className="rounded-2xl border p-5">
              <p className="font-black">
                📦 Sell Products
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Add products and manage your inventory.
              </p>
            </div>

            <div className="rounded-2xl border p-5">
              <p className="font-black">
                🛍️ Manage Orders
              </p>

              <p className="mt-1 text-sm text-gray-500">
                View customer orders and manage fulfillment.
              </p>
            </div>

            <div className="rounded-2xl border p-5">
              <p className="font-black">
                💰 Sell on GoldMart
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Your payment and seller payout system will
                be connected later.
              </p>
            </div>

          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={becomeSeller}
            disabled={loading}
            className="mt-8 w-full rounded-xl bg-black py-4 font-bold text-white transition hover:bg-[#D4AF37] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Setting up seller account..."
              : "Become a Seller"}
          </button>

          <Link
            href="/"
            className="mt-4 block text-center text-sm font-bold text-gray-500"
          >
            Cancel
          </Link>

        </div>
      </div>
    </main>
  );
}
