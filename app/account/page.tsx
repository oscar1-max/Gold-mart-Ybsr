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
  const [user, setUser] = useState<User | null>(
    null
  );

  const [checking, setChecking] =
    useState(true);

  useEffect(() => {
    const savedUser =
      localStorage.getItem(
        "goldmart_user"
      );

    if (savedUser) {
      try {
        const parsedUser =
          JSON.parse(savedUser);

        setUser(parsedUser);
      } catch {
        localStorage.removeItem(
          "goldmart_user"
        );

        localStorage.removeItem(
          "goldmart_token"
        );

        setUser(null);
      }
    }

    setChecking(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(
      "goldmart_user"
    );

    localStorage.removeItem(
      "goldmart_token"
    );

    setUser(null);
  };

  // CHECKING LOGIN STATUS
  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-500">
          Loading...
        </p>
      </main>
    );
  }

  // NOT LOGGED IN
  if (!user) {
    return (
      <main className="min-h-screen bg-white px-4 py-10 text-black">

        <div className="mx-auto max-w-lg">

          <Link
            href="/"
            className="text-sm font-medium text-gray-500 hover:text-[#A67C00]"
          >
            ← Back to GoldMart
          </Link>

          <div className="mt-10 rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">

            <div className="text-5xl">
              👤
            </div>

            <h1 className="mt-5 text-3xl font-black">
              Your Account
            </h1>

            <p className="mt-3 text-gray-500">
              Sign in to access your
              account, orders and cart.
            </p>

            {/* SIGN IN */}
            <Link
              href="/login"
              className="mt-8 block w-full rounded-full bg-black px-6 py-4 font-bold text-white transition hover:bg-[#D4AF37] hover:text-black"
            >
              🔐 Sign In
            </Link>

            {/* CREATE ACCOUNT */}
            <Link
              href="/register"
              className="mt-3 block w-full rounded-full border border-gray-300 px-6 py-4 font-bold text-black transition hover:border-[#D4AF37]"
            >
              📝 Create Account
            </Link>

          </div>

        </div>

      </main>
    );
  }

  // LOGGED IN
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-black">

      <div className="mx-auto max-w-3xl">

        {/* HEADER */}
        <div className="mb-8">

          <Link
            href="/"
            className="text-sm font-medium text-gray-500 hover:text-[#A67C00]"
          >
            ← Back to GoldMart
          </Link>

          <h1 className="mt-5 text-4xl font-black">
            My Account
          </h1>

          <p className="mt-2 text-gray-500">
            Manage your GoldMart account.
          </p>

        </div>

        {/* ACCOUNT INFORMATION */}
        <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">

          <h2 className="mb-6 text-2xl font-bold">
            Account Information
          </h2>

          <div className="space-y-5">

            <div>
              <p className="text-sm text-gray-500">
                Name
              </p>

              <p className="mt-1 text-lg font-semibold">
                {user.name ||
                  "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Email
              </p>

              <p className="mt-1 break-all text-lg font-semibold">
                {user.email ||
                  "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Account Type
              </p>

              <p className="mt-1 text-lg font-semibold capitalize">
                {user.role ||
                  "Buyer"}
              </p>
            </div>

          </div>

        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">

          {/* ORDERS */}
          <Link
            href="/orders"
            className="rounded-2xl border border-gray-200 p-5 transition hover:border-[#D4AF37] hover:shadow-md"
          >
            <div className="text-2xl">
              📦
            </div>

            <h3 className="mt-3 text-lg font-bold">
              My Orders
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              View your orders and order
              history.
            </p>
          </Link>

          {/* CART */}
          <Link
            href="/cart"
            className="rounded-2xl border border-gray-200 p-5 transition hover:border-[#D4AF37] hover:shadow-md"
          >
            <div className="text-2xl">
              🛒
            </div>

            <h3 className="mt-3 text-lg font-bold">
              My Cart
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              View items waiting in your
              cart.
            </p>
          </Link>

          {/* SELLER */}
          {user.role ===
            "seller" && (
            <Link
              href="/seller"
              className="rounded-2xl border border-gray-200 p-5 transition hover:border-[#D4AF37] hover:shadow-md"
            >
              <div className="text-2xl">
                🏪
              </div>

              <h3 className="mt-3 text-lg font-bold">
                Seller Dashboard
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Manage your products and
                sales.
              </p>
            </Link>
          )}

        </div>

        {/* LOGOUT */}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 w-full rounded-full bg-black px-6 py-4 font-bold text-white transition hover:bg-[#D4AF37] hover:text-black"
        >
          🚪 Log Out
        </button>

      </div>

    </main>
  );
              }
