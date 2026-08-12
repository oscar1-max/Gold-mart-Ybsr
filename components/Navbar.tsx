"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("goldmart_user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link
          href="/"
          className="text-3xl font-black text-yellow-600"
        >
          GoldMart
        </Link>

        {/* Navigation Links */}
        <div className="hidden items-center gap-8 md:flex">

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

          {user?.role === "seller" ? (
            <Link
              href="/seller"
              className="font-bold text-yellow-600 hover:text-black"
            >
              Seller Dashboard
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

        {/* Action Buttons */}
        <div className="flex items-center gap-3">

          {/* Wishlist */}
          <Link
            href="/wishlist"
            className="rounded-full border px-4 py-2 hover:bg-gray-100"
          >
            ❤️ Wishlist
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="rounded-full border px-4 py-2 hover:bg-gray-100"
          >
            🛒 Cart
          </Link>

          {/* Account */}
          <Link
            href={user ? "/account" : "/login"}
            className="rounded-full bg-black px-5 py-2 text-white hover:bg-yellow-600"
          >
            👤 {user ? "Account" : "Login"}
          </Link>

        </div>
      </div>
    </nav>
  );
}
