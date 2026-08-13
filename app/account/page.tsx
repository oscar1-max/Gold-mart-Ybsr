"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
};

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("goldmart_user");

    if (!savedUser) {
      window.location.href = "/login";
      return;
    }

    try {
      setUser(JSON.parse(savedUser));
    } catch {
      localStorage.removeItem("goldmart_user");
      window.location.href = "/login";
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("goldmart_user");
    localStorage.removeItem("goldmart_token");

    window.location.href = "/login";
  };

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-500">Loading account...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto max-w-3xl">

        {/* HEADER */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-gray-500 hover:text-yellow-600"
          >
            ← Back to GoldMart
          </Link>

          <h1 className="mt-5 text-4xl font-black text-black">
            My Account
          </h1>

          <p className="mt-2 text-gray-500">
            Manage your GoldMart account.
          </p>
        </div>

        {/* ACCOUNT INFORMATION */}
        <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="mb-6 text-2xl font-bold text-black">
            Account Information
          </h2>

          <div className="space-y-5">

            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="mt-1 text-lg font-semibold text-black">
                {user.name || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="mt-1 text-lg font-semibold text-black">
                {user.email || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Account Type</p>
              <p className="mt-1 text-lg font-semibold capitalize text-black">
                {user.role || "Buyer"}
              </p>
            </div>

          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">

          <Link
            href="/orders"
            className="rounded-2xl border border-gray-200 p-5 transition hover:border-yellow-500 hover:shadow-md"
          >
            <div className="text-2xl">📦</div>
            <h3 className="mt-3 text-lg font-bold text-black">
              My Orders
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              View your orders and order history.
            </p>
          </Link>

          <Link
            href="/cart"
            className="rounded-2xl border border-gray-200 p-5 transition hover:border-yellow-500 hover:shadow-md"
          >
            <div className="text-2xl">🛒</div>
            <h3 className="mt-3 text-lg font-bold text-black">
              My Cart
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              View items waiting in your cart.
            </p>
          </Link>

          {user.role === "seller" && (
            <Link
              href="/seller"
              className="rounded-2xl border border-gray-200 p-5 transition hover:border-yellow-500 hover:shadow-md"
            >
              <div className="text-2xl">🏪</div>
              <h3 className="mt-3 text-lg font-bold text-black">
                Seller Dashboard
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Manage your products and sales.
              </p>
            </Link>
          )}

        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="mt-8 w-full rounded-full bg-black px-6 py-4 font-bold text-white transition hover:bg-yellow-600 hover:text-black"
        >
          Log Out
        </button>

      </div>
    </main>
  );
        }
