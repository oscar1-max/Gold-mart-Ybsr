
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

type User = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
};

const shoppingLinks = [
  {
    href: "/orders",
    icon: "📦",
    title: "My Orders",
    detail: "Purchases & history",
  },
  {
    href: "/track-order",
    icon: "🚚",
    title: "Track Orders",
    detail: "Delivery updates",
  },
  {
    href: "/order-protection",
    icon: "🛡️",
    title: "Buyer Protection",
    detail: "Returns & requests",
  },
  {
    href: "/cart",
    icon: "🛒",
    title: "Shopping Cart",
    detail: "Items saved to buy",
  },
  {
    href: "/chat",
    icon: "💬",
    title: "Messages",
    detail: "Conversations",
  },
  {
    href: "/wishlist",
    icon: "🤍",
    title: "Wishlist",
    detail: "Your favourites",
  },
];

function initials(name?: string) {
  const words = (name || "GoldMart Member")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");

  const [isRefundAdmin, setIsRefundAdmin] =
    useState(false);

  const [isSupportAdmin, setIsSupportAdmin] =
    useState(false);
  const [isAiAdmin, setIsAiAdmin] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const savedUser =
      localStorage.getItem("goldmart_user");

    const token =
      localStorage.getItem("goldmart_token");

    if (!savedUser || !token) {
      setChecking(false);
      return () => controller.abort();
    }

    try {
      const parsed = JSON.parse(savedUser) as User;

      if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid user session");
      }

      setUser(parsed);
    } catch {
      localStorage.removeItem("goldmart_user");
      localStorage.removeItem("goldmart_token");
      setChecking(false);

      return () => controller.abort();
    }

    setChecking(false);

    // Backend checks refund administrator access.
    async function checkRefundAdmin() {
      try {
        const response = await fetch(
          `${API_URL}/api/admin/refunds?page=1`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!controller.signal.aborted) {
          setIsRefundAdmin(response.ok);
        }
      } catch {
        if (!controller.signal.aborted) {
          setIsRefundAdmin(false);
        }
      }
    }

    // Backend checks support administrator access.
    async function checkSupportAdmin() {
      try {
        const response = await fetch(
          `${API_URL}/api/support/admin/tickets`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!controller.signal.aborted) {
          setIsSupportAdmin(response.ok);
        }
      } catch {
        if (!controller.signal.aborted) {
          setIsSupportAdmin(false);
        }
      }
    }

    async function checkAiAdmin() {
      try {
        const response = await fetch(`${API_URL}/api/ai-admin`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          cache: "no-store", signal: controller.signal,
        });
        if (!controller.signal.aborted) setIsAiAdmin(response.ok);
      } catch {
        if (!controller.signal.aborted) setIsAiAdmin(false);
      }
    }
    void checkRefundAdmin();
    void checkSupportAdmin();
    void checkAiAdmin();

    return () => controller.abort();
  }, []);

  function handleLogout() {
    localStorage.removeItem("goldmart_user");
    localStorage.removeItem("goldmart_token");

    setUser(null);
    setIsRefundAdmin(false);
    setIsSupportAdmin(false);
    setIsAiAdmin(false);

    window.location.href = "/";
  }

  async function handleSwitchRole() {
    if (switching) return;

    setSwitching(true);
    setError("");

    try {
      const token =
        localStorage.getItem("goldmart_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/auth/switch-role`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (
        !response.ok ||
        !data.success ||
        !data.user ||
        !data.token
      ) {
        throw new Error(
          data.message ||
            "Could not switch account mode."
        );
      }

      localStorage.setItem(
        "goldmart_user",
        JSON.stringify(data.user)
      );

      localStorage.setItem(
        "goldmart_token",
        data.token
      );

      setUser(data.user);

      window.location.href =
        data.user.role === "seller"
          ? "/seller"
          : "/";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not switch account mode."
      );

      setSwitching(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF8F3] text-[#17191D]">
        <p className="text-sm font-medium text-[#74716B]">
          Loading your account...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#FAF8F3] px-4 py-10 text-[#17191D]">
        <div className="mx-auto max-w-lg">
          <Link
            href="/"
            className="text-sm font-semibold text-[#96713D]"
          >
            ← Back to GoldMart
          </Link>

          <section className="mt-8 overflow-hidden rounded-[28px] border border-[#E8E1D5] bg-white shadow-[0_16px_45px_rgba(23,25,29,0.06)]">
            <div className="h-2 bg-gradient-to-r from-[#96713D] via-[#E9D9BB] to-[#C5A46D]" />

            <div className="px-7 py-12 text-center sm:px-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#E9D9BB] bg-[#FAF8F3] text-4xl">
                👤
              </div>

              <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-[#96713D]">
                The GoldMart Experience
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight">
                Welcome to GoldMart
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#74716B]">
                Sign in to manage orders, messages,
                buyer protection and your account.
              </p>

              <Link
                href="/login"
                className="mt-8 block rounded-full bg-[#17191D] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#96713D]"
              >
                Sign In →
              </Link>

              <Link
                href="/register"
                className="mt-3 block rounded-full border border-[#D7BF97] bg-white px-6 py-3.5 text-sm font-bold text-[#17191D] transition hover:bg-[#FAF8F3]"
              >
                Create an Account
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const isSeller = user.role === "seller";

  // Existing reports shortcut.
  // Backend must independently enforce permissions.
  const isLegacyReportsAdmin =
    Number(user.id) === 1 ||
    Number(user.id) === 3;

  const showAdminSection =
    isLegacyReportsAdmin ||
    isRefundAdmin ||
    isSupportAdmin ||
    isAiAdmin;

  const displayName =
    user.name?.trim() ||
    "GoldMart Member";

  return (
    <main className="min-h-screen bg-[#FAF8F3] pb-16 text-[#17191D]">
      <div className="h-1 bg-gradient-to-r from-[#96713D] via-[#E9D9BB] to-[#C5A46D]" />

      {/* HEADER */}

      <header className="border-b border-[#EEE6DA] bg-white/95 px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Link
            href="/"
            className="text-xl font-black tracking-tight"
            aria-label="GoldMart home"
          >
            Gold
            <span className="text-[#B08A50]">
              Mart
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/shop"
              className="text-xs font-semibold text-[#74716B] transition hover:text-[#96713D] sm:text-sm"
            >
              Continue Shopping
            </Link>

            <Link
              href="/notifications"
              aria-label="Notifications"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E1D5] bg-[#FAF8F3] text-lg transition hover:border-[#C5A46D]"
            >
              🔔
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#96713D]">
              Your GoldMart
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
              My Account
            </h1>
          </div>

          <Link
            href="/"
            className="rounded-full border border-[#E8E1D5] bg-white px-4 py-2 text-xs font-bold transition hover:border-[#C5A46D]"
          >
            ← Home
          </Link>
        </div>

        {/* PREMIUM PROFILE HEADER */}

        <section className="relative overflow-hidden rounded-[28px] bg-[#17191D] px-5 py-7 text-white shadow-[0_16px_45px_rgba(23,25,29,0.14)] sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-[#C5A46D]/25" />

          <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-[#C5A46D]/10 blur-xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[#E9D9BB]/50 bg-[#C5A46D] text-2xl font-black text-[#17191D]">
              {initials(displayName)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E9D9BB]">
                Welcome back
              </p>

              <h2 className="mt-1 break-words text-2xl font-black tracking-tight sm:text-3xl">
                {displayName}
              </h2>

              <p className="mt-1 break-all text-sm text-[#E4E1DB]">
                {user.email || "Email not provided"}
              </p>
            </div>

            <span className="w-fit rounded-full border border-[#C5A46D]/60 bg-[#C5A46D]/15 px-4 py-2 text-xs font-bold text-[#E9D9BB]">
              {isSeller
                ? "✦ Seller Account"
                : "✦ Buyer Account"}
            </span>
          </div>

          <div className="relative mt-7 border-t border-white/15 pt-5 text-xs text-[#D8D1C4]">
            Your shopping, orders and account tools
            in one place.
          </div>
        </section>

        {/* ERROR MESSAGE */}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {/* SHOPPING DASHBOARD */}

        <section className="mt-9">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#96713D]">
                Everything you need
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight">
                My Shopping
              </h2>
            </div>

            <Link
              href="/shop"
              className="text-xs font-bold text-[#96713D] hover:underline"
            >
              Browse Shop →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {shoppingLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group min-w-0 rounded-2xl border border-[#E8E1D5] bg-white p-4 shadow-[0_5px_16px_rgba(23,25,29,0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-[#C5A46D] hover:shadow-[0_12px_28px_rgba(23,25,29,0.08)] sm:p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5F1E9] text-xl">
                    {item.icon}
                  </span>

                  <span className="text-sm text-[#B69B70] transition group-hover:translate-x-0.5">
                    ↗
                  </span>
                </div>

                <h3 className="mt-4 text-sm font-extrabold sm:text-base">
                  {item.title}
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#74716B]">
                  {item.detail}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* BUYER / SELLER SWITCH */}

        <section className="mt-8 overflow-hidden rounded-[24px] border border-[#E4D4B9] bg-gradient-to-br from-[#FFFDF8] to-[#F3E9D7] p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              {isSeller ? "🛍️" : "🏪"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#96713D]">
                Account Modes
              </p>

              <h2 className="mt-1 text-xl font-black">
                {isSeller
                  ? "Switch to Buyer"
                  : "Switch to Seller"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#665F55]">
                {isSeller
                  ? "Return to shopping and browse GoldMart as a buyer."
                  : "Start selling and manage products from your seller dashboard."}
              </p>

              <button
                type="button"
                onClick={handleSwitchRole}
                disabled={switching}
                className="mt-5 rounded-full bg-[#17191D] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#96713D] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {switching
                  ? "Switching..."
                  : isSeller
                    ? "🛍️ Switch to Buyer"
                    : "🏪 Switch to Seller"}
              </button>

              {isSeller && (
                <Link
                  href="/seller"
                  className="ml-3 inline-flex py-3 text-sm font-bold text-[#96713D] hover:underline"
                >
                  Seller Dashboard →
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ADMIN DASHBOARD */}

        {showAdminSection && (
          <section className="mt-8 rounded-[24px] border border-[#D7BF97] bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#17191D] text-2xl text-white">
                🛡️
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#96713D]">
                  Administration
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Admin Dashboard
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#74716B]">
                  Manage marketplace reports, refunds and
                  customer support.
                </p>

                {/* ADMIN OVERVIEW BUTTON - ADDED */}

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/admin"
                    className="rounded-full bg-[#C5A46D] px-5 py-3 text-sm font-black text-[#17191D] transition hover:bg-[#E9D9BB]"
                  >
                    🛡️ Admin Overview →
                  </Link>

                  {isAiAdmin && (
                    <>
                      <Link href="/admin/ai" className="rounded-full bg-[#17191D] px-5 py-3 text-sm font-bold text-white">🤖 AI Admin</Link>
                      <Link href="/admin/monitoring" className="rounded-full border border-[#D7BF97] px-5 py-3 text-sm font-bold">AI Monitoring</Link>
                      <Link href="/admin/support-assistant" className="rounded-full border border-[#D7BF97] px-5 py-3 text-sm font-bold">Support Assistant</Link>
                    </>
                  )}
                  {isLegacyReportsAdmin && (
                    <Link
                      href="/admin/reports"
                      className="rounded-full border border-[#D7BF97] px-5 py-3 text-sm font-bold transition hover:bg-[#FAF8F3]"
                    >
                      📩 Reports & Users
                    </Link>
                  )}

                  {isRefundAdmin && (
                    <Link
                      href="/admin/refunds"
                      className="rounded-full bg-[#17191D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#96713D]"
                    >
                      💳 Manage Refunds
                    </Link>
                  )}

                  {isSupportAdmin && (
                    <Link
                      href="/admin/support"
                      className="rounded-full border border-[#D7BF97] bg-[#FAF8F3] px-5 py-3 text-sm font-bold transition hover:border-[#C5A46D] hover:bg-[#F3E9D7]"
                    >
                      🎧 Support Inbox
                    </Link>
                  )}
                </div>

                {isRefundAdmin && (
                  <p className="mt-4 text-xs leading-5 text-[#74716B]">
                    Approving a refund request
                    does not itself send money
                    to a buyer.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* MORE GOLDMART TOOLS */}

        <section className="mt-9">
          <h2 className="text-2xl font-black tracking-tight">
            More from GoldMart
          </h2>

          <div className="mt-4 overflow-hidden rounded-[24px] border border-[#E8E1D5] bg-white">
            <Link
              href="/notifications"
              className="flex items-center justify-between gap-4 border-b border-[#F0ECE5] px-5 py-4 text-sm font-bold transition hover:bg-[#FAF8F3]"
            >
              <span>🔔 &nbsp; Notifications</span>
              <span className="text-[#96713D]">→</span>
            </Link>

            <Link
              href="/categories"
              className="flex items-center justify-between gap-4 border-b border-[#F0ECE5] px-5 py-4 text-sm font-bold transition hover:bg-[#FAF8F3]"
            >
              <span>🛍️ &nbsp; Shop Categories</span>
              <span className="text-[#96713D]">→</span>
            </Link>

            <Link
              href="/help"
              className="flex items-center justify-between gap-4 px-5 py-4 text-sm font-bold transition hover:bg-[#FAF8F3]"
            >
              <span>🎧 &nbsp; Help Centre</span>
              <span className="text-[#96713D]">→</span>
            </Link>
          </div>
        </section>

        {/* LOG OUT */}

        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 w-full rounded-full border border-[#D7BF97] bg-white px-6 py-4 text-sm font-extrabold text-[#17191D] transition hover:border-[#96713D] hover:bg-[#F5F1E9]"
        >
          🚪 Log Out
        </button>

        <p className="mt-7 text-center text-xs text-[#89847A]">
          GoldMart · Shop beautifully. Shop confidently.
        </p>
      </div>
    </main>
  );
}
