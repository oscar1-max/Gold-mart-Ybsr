
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
    tone: "from-[#E5F0E8] to-[#F5FBF6]",
  },
  {
    href: "/track-order",
    icon: "🚚",
    title: "Track Orders",
    detail: "Delivery updates",
    tone: "from-[#DFEEF3] to-[#F4FAFC]",
  },
  {
    href: "/order-protection",
    icon: "🛡️",
    title: "Buyer Protection",
    detail: "Returns & requests",
    tone: "from-[#EEE6F7] to-[#FCF8FF]",
  },
  {
    href: "/cart",
    icon: "🛒",
    title: "Shopping Cart",
    detail: "Items saved to buy",
    tone: "from-[#F6EBD9] to-[#FFF9F1]",
  },
  {
    href: "/chat",
    icon: "💬",
    title: "Messages",
    detail: "Conversations",
    tone: "from-[#E4EAF9] to-[#F8F9FF]",
  },
  {
    href: "/wishlist",
    icon: "🤍",
    title: "Wishlist",
    detail: "Your favourites",
    tone: "from-[#F9E7EE] to-[#FFF8FB]",
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
      <main className="flex min-h-screen items-center justify-center bg-[#f5f8f5] text-[#162e25]">
        <p className="text-sm font-medium text-[#647a6d]">
          Loading your account...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#f5f8f5] px-4 py-10 text-[#162e25]">
        <div className="mx-auto max-w-lg">
          <Link
            href="/"
            className="text-sm font-semibold text-[#176c52]"
          >
            ← Back to GoldMart
          </Link>

          <section className="mt-8 overflow-hidden rounded-[28px] border border-[#e0eae3] bg-white shadow-[0_16px_45px_rgba(23,25,29,0.06)]">
            <div className="h-2 bg-gradient-to-r from-[#176c52] via-[#ddf1e3] to-[#68a98c]" />

            <div className="px-7 py-12 text-center sm:px-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#ddf1e3] bg-[#f5f8f5] text-4xl">
                👤
              </div>

              <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-[#176c52]">
                The GoldMart Experience
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight">
                Welcome to GoldMart
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#647a6d]">
                Sign in to manage orders, messages,
                buyer protection and your account.
              </p>

              <Link
                href="/login"
                className="mt-8 block rounded-full bg-[#162e25] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#176c52]"
              >
                Sign In →
              </Link>

              <Link
                href="/register"
                className="mt-3 block rounded-full border border-[#D7BF97] bg-white px-6 py-3.5 text-sm font-bold text-[#162e25] transition hover:bg-[#f5f8f5]"
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
    <main className="min-h-screen bg-[#f6f8f6] pb-28 text-[#1b3329] md:pb-12">
      <div className="h-1 bg-gradient-to-r from-[#176c52] via-[#ddf1e3] to-[#68a98c]" />

      {/* HEADER */}

      <header className="border-b border-[#EEE6DA] bg-white/95 px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Link
            href="/"
            className="text-xl font-black tracking-tight"
            aria-label="GoldMart home"
          >
            Gold
            <span className="text-[#4e9776]">
              Mart
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/shop"
              className="text-xs font-semibold text-[#647a6d] transition hover:text-[#176c52] sm:text-sm"
            >
              Continue Shopping
            </Link>

            <Link
              href="/notifications"
              aria-label="Notifications"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e0eae3] bg-[#f5f8f5] text-lg transition hover:border-[#68a98c]"
            >
              🔔
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#176c52]">
              Your GoldMart
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
              My Account
            </h1>
          </div>

          <Link
            href="/"
            className="rounded-full border border-[#e0eae3] bg-white px-4 py-2 text-xs font-bold transition hover:border-[#68a98c]"
          >
            ← Home
          </Link>
        </div>

        {/* PREMIUM PROFILE HEADER */}

        <section className="relative overflow-hidden rounded-[29px] bg-[linear-gradient(115deg,#1D3440_0%,#376C6A_58%,#8B745C_100%)] px-5 py-8 text-white shadow-[0_16px_45px_rgba(23,25,29,0.14)] sm:px-8 sm:py-11">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-[#68a98c]/25" />

          <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-[#68a98c]/10 blur-xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] border border-white/40 bg-[linear-gradient(135deg,#F2D7A9,#F8EEE0)] text-2xl font-black text-[#1C3A40] shadow-lg">
              {initials(displayName)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ddf1e3]">
                Welcome back
              </p>

              <h2 className="mt-1 break-words text-2xl font-black tracking-tight sm:text-3xl">
                {displayName}
              </h2>

              <p className="mt-1 break-all text-sm text-[#E4E1DB]">
                {user.email || "Email not provided"}
              </p>
            </div>

            <span className="w-fit rounded-full border border-[#68a98c]/60 bg-[#68a98c]/15 px-4 py-2 text-xs font-bold text-[#ddf1e3]">
              {isSeller
                ? "✦ Seller Account"
                : "✦ Buyer Account"}
            </span>
          </div>

          <div className="relative mt-7 border-t border-white/15 pt-5 text-xs text-[#D8D1C4]">
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
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176c52]">
                Everything you need
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight">
                My Shopping
              </h2>
            </div>

            <Link
              href="/shop"
              className="text-xs font-bold text-[#176c52] hover:underline"
            >
              Browse Shop →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {shoppingLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group min-w-0 rounded-[23px] border border-[#E7E9E6] bg-gradient-to-br ${item.tone} p-4 shadow-[0_6px_18px_rgba(23,25,29,0.04)] transition duration-200 hover:-translate-y-1 hover:border-[#BDB49F] hover:shadow-[0_12px_28px_rgba(23,25,29,0.09)] sm:p-5`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/60 bg-white/80 text-2xl shadow-sm">
                    {item.icon}
                  </span>

                  <span className="text-sm text-[#B69B70] transition group-hover:translate-x-0.5">
                    ↗
                  </span>
                </div>

                <h3 className="mt-4 text-sm font-extrabold sm:text-base">
                  {item.title}
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#647a6d]">
                  {item.detail}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* BUYER / SELLER SWITCH */}

        <section className="mt-8 overflow-hidden rounded-[24px] border border-[#B9D9D1] bg-gradient-to-br from-[#ECF7F2] via-[#F8FBF5] to-[#F4E7D8] p-5 shadow-[0_7px_26px_rgba(23,25,29,0.04)] sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              {isSeller ? "🛍️" : "🏪"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176c52]">
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
                className="mt-5 rounded-full bg-[#274D50] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#36746F] disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="ml-3 inline-flex py-3 text-sm font-bold text-[#176c52] hover:underline"
                >
                  Seller Dashboard →
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ADMIN DASHBOARD */}

        {showAdminSection && (
          <section className="mt-8 rounded-[26px] border border-[#C5D8D3] bg-[linear-gradient(135deg,#F0F8F5,#F8F5F0,#F3F0FA)] p-5 shadow-[0_10px_30px_rgba(22,42,46,0.06)] sm:p-7">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#162e25] text-2xl text-white">
                🛡️
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#176c52]">
                  Administration
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Admin Dashboard
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#647a6d]">
                  Manage marketplace reports, refunds and
                  customer support.
                </p>

                {/* ADMIN OVERVIEW BUTTON - ADDED */}

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/admin"
                    className="rounded-2xl bg-[#274E52] px-5 py-3 text-sm font-black text-white transition hover:bg-[#36756E]"
                  >
                    🛡️ Admin Overview →
                  </Link>

                  {isAiAdmin && (
                    <>
                      <Link href="/admin/ai" className="rounded-2xl bg-[#463D78] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#5E52A0]">🤖 AI Admin</Link>
                      <Link href="/admin/monitoring" className="rounded-2xl border border-[#B8D8D2] bg-[#E5F5EF] px-5 py-3 text-sm font-bold text-[#265D59] transition hover:bg-[#D3EDE5]">◎ AI Monitoring</Link>
                      <Link href="/admin/support-assistant" className="rounded-2xl border border-[#E9D0DD] bg-[#FAEAF1] px-5 py-3 text-sm font-bold text-[#86526A] transition hover:bg-[#F5DDE9]">✎ Support Assistant</Link>
                    </>
                  )}
                  {isLegacyReportsAdmin && (
                    <Link
                      href="/admin/reports"
                      className="rounded-2xl border border-[#CCDCEE] bg-[#E9F2FC] px-5 py-3 text-sm font-bold text-[#3F6289] transition hover:bg-[#D9EAF9]"
                    >
                      📩 Reports & Users
                    </Link>
                  )}

                  {isRefundAdmin && (
                    <Link
                      href="/admin/refunds"
                      className="rounded-2xl bg-[#715436] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#946E47]"
                    >
                      💳 Manage Refunds
                    </Link>
                  )}

                  {isSupportAdmin && (
                    <Link
                      href="/admin/support"
                      className="rounded-2xl border border-[#C5E2E7] bg-[#E7F5F8] px-5 py-3 text-sm font-bold text-[#306879] transition hover:bg-[#D9F0F5]"
                    >
                      🎧 Support Inbox
                    </Link>
                  )}
                </div>

                {isRefundAdmin && (
                  <p className="mt-4 text-xs leading-5 text-[#647a6d]">
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

          <div className="mt-4 overflow-hidden rounded-[24px] border border-[#DFE6DF] bg-white shadow-[0_7px_20px_rgba(23,25,29,0.035)]">
            <Link
              href="/notifications"
              className="flex items-center justify-between gap-4 border-b border-[#F0ECE5] px-5 py-4 text-sm font-bold transition hover:bg-[#f5f8f5]"
            >
              <span>🔔 &nbsp; Notifications</span>
              <span className="text-[#176c52]">→</span>
            </Link>

            <Link
              href="/categories"
              className="flex items-center justify-between gap-4 border-b border-[#F0ECE5] px-5 py-4 text-sm font-bold transition hover:bg-[#f5f8f5]"
            >
              <span>🛍️ &nbsp; Shop Categories</span>
              <span className="text-[#176c52]">→</span>
            </Link>

            <Link
              href="/help"
              className="flex items-center justify-between gap-4 px-5 py-4 text-sm font-bold transition hover:bg-[#f5f8f5]"
            >
              <span>🎧 &nbsp; Help Centre</span>
              <span className="text-[#176c52]">→</span>
            </Link>
          </div>
        </section>

        {/* LOG OUT */}

        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 w-full rounded-full border border-[#E6C9CA] bg-[#FFF8F8] px-6 py-4 text-sm font-extrabold text-[#8F555A] transition hover:border-[#CC999A] hover:bg-[#FCEDEE]"
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
