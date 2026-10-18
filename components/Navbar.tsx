
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

type User = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
};

export default function Navbar() {
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);

  // Only the backend can confirm administrator access.
  const [isAiAdmin, setIsAiAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    let activeRequest: AbortController | null = null;

    function loadUser() {
      const savedUser = localStorage.getItem("goldmart_user");

      if (!savedUser) {
        setUser(null);
        return;
      }

      try {
        const parsedUser: User = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch {
        localStorage.removeItem("goldmart_user");
        setUser(null);
      }
    }

    async function checkAiAdmin() {
      // Never trust localStorage role or ID as proof
      // that a user is an authorized administrator.
      activeRequest?.abort();

      const controller = new AbortController();
      activeRequest = controller;

      setIsAiAdmin(false);

      const token = localStorage.getItem("goldmart_token");

      if (!token) {
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/ai-admin`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (mounted && !controller.signal.aborted) {
          setIsAiAdmin(response.ok);
        }
      } catch {
        if (mounted && !controller.signal.aborted) {
          setIsAiAdmin(false);
        }
      }
    }

    function refreshNavbar() {
      loadUser();
      void checkAiAdmin();
    }

    // Check when the page loads or the route changes.
    refreshNavbar();

    // Refresh after switching browser tabs.
    window.addEventListener("focus", refreshNavbar);

    // Refresh when authentication changes in another tab.
    window.addEventListener("storage", refreshNavbar);

    return () => {
      mounted = false;
      activeRequest?.abort();

      window.removeEventListener("focus", refreshNavbar);
      window.removeEventListener("storage", refreshNavbar);
    };
  }, [pathname]);

  const aiAdminDesktopLink = isAiAdmin ? (
    <Link
      href="/admin/ai"
      className="whitespace-nowrap rounded-full bg-[#B38A25] px-5 py-2 font-bold text-white transition hover:bg-[#896716]"
    >
      🤖 AI Admin
    </Link>
  ) : null;

  const aiAdminMobileLink = isAiAdmin ? (
    <Link
      href="/admin/ai"
      className="whitespace-nowrap rounded-full bg-[#B38A25] px-4 py-2 text-sm font-bold text-white"
    >
      🤖 AI Admin
    </Link>
  ) : null;

  return (
    <nav className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">

        {/* LOGO */}
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo.png"
            alt="GoldMart"
            width={150}
            height={50}
            className="h-12 w-auto object-contain"
            priority
          />
        </Link>

        {/* DESKTOP NAVIGATION */}
        <div className="hidden items-center gap-5 md:flex">

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

          {/* VERIFIED GOLDMART ADMIN ONLY */}
          {aiAdminDesktopLink}

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

          {user ? (
            <Link
              href="/account"
              className="rounded-full bg-black px-5 py-2 font-bold text-white transition hover:bg-yellow-600"
            >
              👤 Account
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-black px-5 py-2 font-bold text-white transition hover:bg-yellow-600"
            >
              👤 Login
            </Link>
          )}

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

          <Link
            href="/cart"
            className="whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium"
          >
            🛒 Cart
          </Link>

          {user?.role === "seller" ? (
            <Link
              href="/seller"
              className="whitespace-nowrap rounded-full bg-black px-4 py-2 text-sm font-bold text-white"
            >
              🏪 Seller
            </Link>
          ) : (
            <Link
              href="/become-seller"
              className="whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold text-yellow-600"
            >
              Sell on GoldMart
            </Link>
          )}

          {/* VERIFIED GOLDMART ADMIN ONLY */}
          {aiAdminMobileLink}

          {user ? (
            <Link
              href="/account"
              className="whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold"
            >
              👤 Account
            </Link>
          ) : (
            <Link
              href="/login"
              className="whitespace-nowrap rounded-full bg-black px-4 py-2 text-sm font-bold text-white"
            >
              👤 Login
            </Link>
          )}

        </div>
      </div>
    </nav>
  );
}
