
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
    tone: "from-[#FFF8F2] to-[#FFFFFF]",
  },
  {
    href: "/track-order",
    icon: "🚚",
    title: "Track Orders",
    detail: "Delivery updates",
    tone: "from-[#FFF8F2] to-[#FFFFFF]",
  },
  {
    href: "/order-protection",
    icon: "🛡️",
    title: "Buyer Protection",
    detail: "Returns & requests",
    tone: "from-[#FFF8F2] to-[#FFFFFF]",
  },
  {
    href: "/cart",
    icon: "🛒",
    title: "Shopping Cart",
    detail: "Items saved to buy",
    tone: "from-[#FFF8F2] to-[#FFFFFF]",
  },
  {
    href: "/chat",
    icon: "💬",
    title: "Messages",
    detail: "Conversations",
    tone: "from-[#FFF8F2] to-[#FFFFFF]",
  },
  {
    href: "/wishlist",
    icon: "🤍",
    title: "Wishlist",
    detail: "Your favourites",
    tone: "from-[#FFF8F2] to-[#FFFFFF]",
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
      <main className="flex min-h-screen items-center justify-center bg-[#FFFFFF] text-[#14263D]">
        <p className="text-sm font-medium text-[#FF6B00]">
          Loading your account...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#FFFFFF] px-4 py-10 text-[#14263D]">
        <div className="mx-auto max-w-lg">
          <Link
            href="/"
            className="text-sm font-semibold text-[#243B53]"
          >
            ← Back to GoldMart
          </Link>

          <section className="mt-8 overflow-hidden rounded-[28px] border border-[#FFF8F2] bg-white shadow-[0_16px_45px_rgba(23,25,29,0.06)]">
            <div className="h-2 bg-gradient-to-r from-[#243B53] via-[#FFF8F2] to-[#FF6B00]" />

            <div className="px-7 py-12 text-center sm:px-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#FFF8F2] bg-[#FFFFFF] text-4xl">
                👤
              </div>

              <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-[#243B53]">
                The GoldMart Experience
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight">
                Welcome to GoldMart
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#FF6B00]">
                Sign in to manage orders, messages,
                buyer protection and your account.
              </p>

              <Link
                href="/login"
                className="mt-8 block rounded-full bg-[#14263D] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#243B53]"
              >
                Sign In →
              </Link>

              <Link
                href="/register"
                className="mt-3 block rounded-full border border-[#FFE9CC] bg-white px-6 py-3.5 text-sm font-bold text-[#14263D] transition hover:bg-[#FFFFFF]"
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
    <main className="gm-account-syncra min-h-screen bg-[#FFFFFF] pb-28 text-[#14263D] md:pb-12">
      <div className="h-1 bg-gradient-to-r from-[#243B53] via-[#FFF8F2] to-[#FF6B00]" />

      {/* HEADER */}

      <header className="border-b border-[#FFF8F2] bg-white/95 px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Link
            href="/"
            className="text-xl font-black tracking-tight"
            aria-label="GoldMart home"
          >
            Gold
            <span className="text-[#FF6B00]">
              Mart
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/shop"
              className="text-xs font-semibold text-[#FF6B00] transition hover:text-[#243B53] sm:text-sm"
            >
              Continue Shopping
            </Link>

            <Link
              href="/notifications"
              aria-label="Notifications"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#FFF8F2] bg-[#FFFFFF] text-lg transition hover:border-[#FF6B00]"
            >
              🔔
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#243B53]">
              Your GoldMart
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
              My Account
            </h1>
          </div>

          <Link
            href="/"
            className="rounded-full border border-[#FFF8F2] bg-white px-4 py-2 text-xs font-bold transition hover:border-[#FF6B00]"
          >
            ← Home
          </Link>
        </div>

        {/* PREMIUM PROFILE HEADER */}

        <section className="gm-account-profile relative overflow-hidden rounded-[29px] bg-[linear-gradient(135deg,#0A1F1A_0%,#1A3C32_50%,#D4AF37_100%)] px-5 py-8 text-white shadow-[0_16px_45px_rgba(23,25,29,0.14)] sm:px-8 sm:py-11">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-[#FF6B00]/25" />

          <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-[#FF6B00]/10 blur-xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="gm-account-avatar flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] border border-white/40 bg-[linear-gradient(135deg,#0A1F1A_0%,#1A3C32_50%,#D4AF37_100%)] text-2xl font-black text-[#243B53] shadow-lg">
              {initials(displayName)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFF8F2]">
                Welcome back
              </p>

              <h2 className="mt-1 break-words text-2xl font-black tracking-tight sm:text-3xl">
                {displayName}
              </h2>

              <p className="mt-1 break-all text-sm text-[#FFF8F2]">
                {user.email || "Email not provided"}
              </p>
            </div>

            <span className="w-fit rounded-full border border-[#FF6B00]/60 bg-[#FF6B00]/15 px-4 py-2 text-xs font-bold text-[#FFF8F2]">
              {isSeller
                ? "✦ Seller Account"
                : "✦ Buyer Account"}
            </span>
          </div>

          <div className="relative mt-7 border-t border-white/15 pt-5 text-xs text-[#FFF8F2]">
            Your shopping, orders and account tools
            in one place. Choose a shortcut below to get started.
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
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#243B53]">
                Everything you need
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight">
                My Shopping
              </h2>
            </div>

            <Link
              href="/shop"
              className="text-xs font-bold text-[#243B53] hover:underline"
            >
              Browse Shop →
            </Link>
          </div>

          <div className="gm-account-cards grid grid-cols-2 gap-3 md:grid-cols-3">
            {shoppingLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group min-w-0 rounded-[23px] border border-[#FFF8F2] bg-gradient-to-br ${item.tone} p-4 shadow-[0_6px_18px_rgba(23,25,29,0.04)] transition duration-200 hover:-translate-y-1 hover:border-[#FFE9CC] hover:shadow-[0_12px_28px_rgba(23,25,29,0.09)] sm:p-5`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/60 bg-white/80 text-2xl shadow-sm">
                    {item.icon}
                  </span>

                  <span className="text-sm text-[#FF6B00] transition group-hover:translate-x-0.5">
                    ↗
                  </span>
                </div>

                <h3 className="mt-4 text-sm font-extrabold sm:text-base">
                  {item.title}
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#FF6B00]">
                  {item.detail}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* BUYER / SELLER SWITCH */}

        <section className="mt-8 overflow-hidden rounded-[24px] border border-[#FFE9CC] bg-gradient-to-br from-[#FFF8F2] via-[#FFFFFF] to-[#FFF8F2] p-5 shadow-[0_7px_26px_rgba(23,25,29,0.04)] sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              {isSeller ? "🛍️" : "🏪"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#243B53]">
                Account Modes
              </p>

              <h2 className="mt-1 text-xl font-black">
                {isSeller
                  ? "Switch to Buyer"
                  : "Switch to Seller"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#243B53]">
                {isSeller
                  ? "Return to shopping and browse GoldMart as a buyer."
                  : "Start selling and manage products from your seller dashboard."}
              </p>

              <button
                type="button"
                onClick={handleSwitchRole}
                disabled={switching}
                className="mt-5 rounded-full bg-[#243B53] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#FF6B00] disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="ml-3 inline-flex py-3 text-sm font-bold text-[#243B53] hover:underline"
                >
                  Seller Dashboard →
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ADMIN DASHBOARD */}

        {showAdminSection && (
          <section className="mt-8 rounded-[26px] border border-[#FFF8F2] bg-[linear-gradient(135deg,#0A1F1A_0%,#1A3C32_50%,#D4AF37_100%)] p-5 shadow-[0_10px_30px_rgba(22,42,46,0.06)] sm:p-7">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#14263D] text-2xl text-white">
                🛡️
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#243B53]">
                  Administration
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Admin Dashboard
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#FF6B00]">
                  Manage marketplace reports, refunds and
                  customer support.
                </p>

                {/* ADMIN OVERVIEW BUTTON - ADDED */}

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/admin"
                    className="rounded-2xl bg-[#243B53] px-5 py-3 text-sm font-black text-white transition hover:bg-[#FF6B00]"
                  >
                    🛡️ Admin Overview →
                  </Link>

                  {isAiAdmin && (
                    <>
                      <Link href="/admin/ai" className="rounded-2xl bg-[#FF6B00] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#FF6B00]">🤖 AI Admin</Link>
                      <Link href="/admin/monitoring" className="rounded-2xl border border-[#FFE9CC] bg-[#FFF8F2] px-5 py-3 text-sm font-bold text-[#243B53] transition hover:bg-[#FFF8F2]">◎ AI Monitoring</Link>
                      <Link href="/admin/support-assistant" className="rounded-2xl border border-[#FFF8F2] bg-[#FFF8F2] px-5 py-3 text-sm font-bold text-[#FF6B00] transition hover:bg-[#FFF8F2]">✎ Support Assistant</Link>
                    </>
                  )}
                  {isLegacyReportsAdmin && (
                    <Link
                      href="/admin/reports"
                      className="rounded-2xl border border-[#FFF8F2] bg-[#FFF8F2] px-5 py-3 text-sm font-bold text-[#FF6B00] transition hover:bg-[#FFF8F2]"
                    >
                      📩 Reports & Users
                    </Link>
                  )}

                  {isRefundAdmin && (
                    <Link
                      href="/admin/refunds"
                      className="rounded-2xl bg-[#FF6B00] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#FF6B00]"
                    >
                      💳 Manage Refunds
                    </Link>
                  )}

                  {isSupportAdmin && (
                    <Link
                      href="/admin/support"
                      className="rounded-2xl border border-[#FFF8F2] bg-[#FFF8F2] px-5 py-3 text-sm font-bold text-[#FF6B00] transition hover:bg-[#FFF8F2]"
                    >
                      🎧 Support Inbox
                    </Link>
                  )}
                </div>

                {isRefundAdmin && (
                  <p className="mt-4 text-xs leading-5 text-[#FF6B00]">
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

          <div className="mt-4 overflow-hidden rounded-[24px] border border-[#FFF8F2] bg-white shadow-[0_7px_20px_rgba(23,25,29,0.035)]">
            <Link
              href="/notifications"
              className="flex items-center justify-between gap-4 border-b border-[#FFF8F2] px-5 py-4 text-sm font-bold transition hover:bg-[#FFFFFF]"
            >
              <span>🔔 &nbsp; Notifications</span>
              <span className="text-[#243B53]">→</span>
            </Link>

            <Link
              href="/categories"
              className="flex items-center justify-between gap-4 border-b border-[#FFF8F2] px-5 py-4 text-sm font-bold transition hover:bg-[#FFFFFF]"
            >
              <span>🛍️ &nbsp; Shop Categories</span>
              <span className="text-[#243B53]">→</span>
            </Link>

            <Link href="/privacy" className="flex items-center justify-between gap-4 border-b border-[#FFF8F2] px-5 py-4 text-sm font-bold transition hover:bg-[#FFFFFF]">
              <span>🔒 &nbsp; Privacy notice</span><span>→</span>
            </Link>
            <Link href="/account-deletion" className="flex items-center justify-between gap-4 border-b border-[#FFF8F2] px-5 py-4 text-sm font-bold transition hover:bg-[#FFFFFF]">
              <span>🗑️ &nbsp; Request account deletion</span><span>→</span>
            </Link>
            <Link href="/terms" className="flex items-center justify-between gap-4 border-b border-[#FFF8F2] px-5 py-4 text-sm font-bold transition hover:bg-[#FFFFFF]">
              <span>📄 &nbsp; Marketplace terms</span><span>→</span>
            </Link>
            <Link
              href="/help"
              className="flex items-center justify-between gap-4 px-5 py-4 text-sm font-bold transition hover:bg-[#FFFFFF]"
            >
              <span>🎧 &nbsp; Help Centre</span>
              <span className="text-[#243B53]">→</span>
            </Link>
          </div>
        </section>

        {/* LOG OUT */}

        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 w-full rounded-full border border-[#FFF8F2] bg-[#FFFFFF] px-6 py-4 text-sm font-extrabold text-[#8F555A] transition hover:border-[#FFE9CC] hover:bg-[#FFF8F2]"
        >
          🚪 Log Out
        </button>

        <p className="mt-7 text-center text-xs text-[#FF6B00]">
          GoldMart · Shop beautifully. Shop confidently.
        </p>
      </div>
    </main>
  );
}
