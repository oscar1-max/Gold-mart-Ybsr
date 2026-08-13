"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
};

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = () => {
      const savedUser = localStorage.getItem("goldmart_user");

      if (!savedUser) {
        setUser(null);
        return;
      }

      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch {
        setUser(null);
      }
    };

    loadUser();

    // Refresh user information when the page becomes active
    window.addEventListener("focus", loadUser);

    return () => {
      window.removeEventListener("focus", loadUser);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">

        {/* LOGO */}
        <Link
          href="/"
          className="text-3xl font-black text-yellow-600"
        >
          GoldMart
        </Link>

        {/* NAVIGATION */}
        <div className="hidden items-center gap-7 md:flex">

          <Link
            href="/"
            className="font-medium hover:text-yellow-600"
          >
            Home
          </Link>

          <Link
            href="/shop"
            className="font-medium hover:text-yellow-600"
          >
            Shop
          </Link>

          <Link
            href="/categories"
            className="font-medium hover:text-yellow-600"
          >
            Categories
          </Link>

          {/* SELLER SWITCH */}
          {user?.role === "seller" ? (
            <Link
              href="/seller"
              className="rounded-full bg-black px-5 py-2 font-bold text-white transition hover:bg-[#D4AF37] hover:text-black"
            >
              🏪 Seller Dashboard
            </Link>
          ) : (
            <Link
              href="/become-seller"
              className="font-bold text-yellow-600 hover:text-black"
            >
              Sell on GoldMart
            </Link>
          )}

          <Link
            href="/contact"
            className="font-medium hover:text-yellow-600"
          >
            Contact
          </Link>

        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2">

          <Link
            href="/wishlist"
            className="hidden rounded-full border px-4 py-2 hover:bg-gray-100 sm:block"
          >
            ❤️ Wishlist
          </Link>

          <Link
            href="/cart"
            className="hidden rounded-full border px-4 py-2 hover:bg-gray-100 sm:block"
          >
            🛒 Cart
          </Link>

          <Link
            href={user ? "/account" : "/login"}
            className="rounded-full bg-black px-5 py-2 font-bold text-white hover:bg-yellow-600"
          >
            👤 {user ? "Account" : "Login"}
          </Link>

        </div>

      </div>

      {/* MOBILE NAVIGATION */}
      <div className="border-t px-4 py-3 md:hidden">

        <div className="flex items-center gap-2 overflow-x-auto">

          <Link
            href="/"
            className="whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium"
          >
            🏠 Home
          </Link>

          <Link
            href="/shop"
            className="whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium"
          >
            🛍️ Shop
          </Link>

          {user?.role === "seller" && (
            <Link
              href="/seller"
              className="whitespace-nowrap rounded-full bg-black px-4 py-2 text-sm font-bold text-white"
            >
              🏪 Seller
            </Link>
          )}

          {user?.role !== "seller" && (
            <Link
              href="/become-seller"
              className="whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold text-yellow-600"
            >
              Sell on GoldMart
            </Link>
          )}

        </div>

      </div>
    </nav>
  );
}
