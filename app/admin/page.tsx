
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

type ModuleKey = "reports" | "refunds" | "support";

type ModuleState = "ready" | "denied" | "error";

type ModuleResult = {
  state: ModuleState;
  total: number;
  attention: number;
  message: string;
};

type DashboardState =
  | "loading"
  | "ready"
  | "login"
  | "denied"
  | "unavailable";

const EMPTY_RESULT: ModuleResult = {
  state: "error",
  total: 0,
  attention: 0,
  message: "Not loaded",
};

const ADMIN_MODULES: {
  key: ModuleKey;
  title: string;
  description: string;
  href: string;
  icon: string;
  button: string;
}[] = [
  {
    key: "reports",
    title: "Reports & Users",
    description:
      "Review marketplace complaints and manage reported accounts.",
    href: "/admin/reports",
    icon: "🛡️",
    button: "Manage Reports",
  },
  {
    key: "refunds",
    title: "Refund Management",
    description:
      "Review buyer refund requests and monitor their statuses.",
    href: "/admin/refunds",
    icon: "💳",
    button: "Manage Refunds",
  },
  {
    key: "support",
    title: "Customer Support",
    description:
      "Read customer tickets, reply to messages, and update ticket statuses.",
    href: "/admin/support",
    icon: "🎧",
    button: "Open Support Inbox",
  },
];

function initialModules(): Record<
  ModuleKey,
  ModuleResult
> {
  return {
    reports: { ...EMPTY_RESULT },
    refunds: { ...EMPTY_RESULT },
    support: { ...EMPTY_RESULT },
  };
}

async function fetchAdminModule(
  key: ModuleKey,
  token: string,
  signal: AbortSignal
): Promise<ModuleResult> {
  const paths: Record<ModuleKey, string> = {
    reports: "/api/reports",
    refunds: "/api/admin/refunds?page=1",
    support: "/api/support/admin/tickets",
  };

  const arrayKeys: Record<ModuleKey, string> = {
    reports: "reports",
    refunds: "requests",
    support: "tickets",
  };

  try {
    const response = await fetch(
      `${API_URL}${paths[key]}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal,
      }
    );

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      return {
        state: "denied",
        total: 0,
        attention: 0,
        message:
          response.status === 401
            ? "Sign in again"
            : "Access restricted",
      };
    }

    if (!response.ok) {
      return {
        state: "error",
        total: 0,
        attention: 0,
        message: `API error ${response.status}`,
      };
    }

    const data = await response.json();

    if (data?.success === false) {
      throw new Error(
        data?.message || "Unable to load"
      );
    }

    const collection = data?.[arrayKeys[key]];

    if (!Array.isArray(collection)) {
      throw new Error(
        "Unexpected API response"
      );
    }

    let attention = 0;

    if (key === "reports") {
      attention = collection.filter(
        (item: { status?: string }) =>
          item.status === "pending"
      ).length;
    }

    if (key === "refunds") {
      attention = collection.filter(
        (item: { status?: string }) =>
          item.status === "requested" ||
          item.status === "under_review"
      ).length;
    }

    if (key === "support") {
      attention = collection.filter(
        (item: { status?: string }) =>
          item.status === "open" ||
          item.status === "in_progress"
      ).length;
    }

    return {
      state: "ready",
      total: collection.length,
      attention,
      message: "Connected",
    };
  } catch (error) {
    if (signal.aborted) {
      return {
        state: "error",
        total: 0,
        attention: 0,
        message: "Cancelled",
      };
    }

    return {
      state: "error",
      total: 0,
      attention: 0,
      message:
        error instanceof Error
          ? error.message
          : "Connection failed",
    };
  }
}

export default function AdminOverviewPage() {
  const [dashboardState, setDashboardState] =
    useState<DashboardState>("loading");

  const [modules, setModules] = useState<
    Record<ModuleKey, ModuleResult>
  >(initialModules);

  const controllerRef =
    useRef<AbortController | null>(null);

  const loadDashboard = useCallback(
    async () => {
      controllerRef.current?.abort();

      const controller = new AbortController();
      controllerRef.current = controller;

      const token =
        localStorage.getItem("goldmart_token");

      if (!token) {
        setModules(initialModules());
        setDashboardState("login");
        return;
      }

      setDashboardState("loading");

      const keys: ModuleKey[] = [
        "reports",
        "refunds",
        "support",
      ];

      const results = await Promise.all(
        keys.map((key) =>
          fetchAdminModule(
            key,
            token,
            controller.signal
          )
        )
      );

      if (controller.signal.aborted) {
        return;
      }

      const nextModules = {
        reports: results[0],
        refunds: results[1],
        support: results[2],
      };

      setModules(nextModules);

      const allowed = results.some(
        (result) => result.state === "ready"
      );

      if (allowed) {
        setDashboardState("ready");
        return;
      }

      const allDenied = results.every(
        (result) => result.state === "denied"
      );

      const someDenied = results.some(
        (result) => result.state === "denied"
      );

      if (allDenied || someDenied) {
        setDashboardState("denied");
      } else {
        setDashboardState("unavailable");
      }
    },
    []
  );

  useEffect(() => {
    void loadDashboard();

    return () => {
      controllerRef.current?.abort();
    };
  }, [loadDashboard]);

  const connectedModules = Object.values(
    modules
  ).filter(
    (item) => item.state === "ready"
  ).length;

  const stats = [
    {
      label: "Available Admin Tools",
      value: connectedModules,
      icon: "🛠️",
    },
    {
      label: "Reports Awaiting Review",
      value:
        modules.reports.state === "ready"
          ? modules.reports.attention
          : "—",
      icon: "📋",
    },
    {
      label: "Refunds Awaiting Review",
      value:
        modules.refunds.state === "ready"
          ? modules.refunds.attention
          : "—",
      icon: "💳",
    },
    {
      label: "Active Support Tickets",
      value:
        modules.support.state === "ready"
          ? modules.support.attention
          : "—",
      icon: "🎧",
    },
  ];

  return (
    <main className="min-h-screen bg-[#FAF8F3] pb-16 text-[#17191D]">
      <div className="h-1 bg-gradient-to-r from-[#96713D] via-[#E9D9BB] to-[#C5A46D]" />

      {/* HEADER */}

      <header className="border-b border-[#E8E1D5] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight"
          >
            Gold
            <span className="text-[#B08A50]">
              Mart
            </span>
          </Link>

          <Link
            href="/account"
            className="rounded-full border border-[#D7BF97] px-4 py-2 text-xs font-bold hover:bg-[#FAF8F3]"
          >
            ← My Account
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* HERO */}

        <section className="relative overflow-hidden rounded-[28px] bg-[#17191D] p-7 text-white sm:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full border border-[#C5A46D]/30"
          />

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E9D9BB]">
              GoldMart Administration
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Admin Overview
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#E5DDD1]">
              Your central control centre for
              marketplace reports, refund reviews,
              and customer support.
            </p>

            {dashboardState === "ready" && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[#C5A46D]/50 bg-[#C5A46D]/15 px-4 py-2 text-xs font-bold text-[#E9D9BB]">
                  🛡️ Administrator Tools
                </span>

                <button
                  type="button"
                  onClick={() =>
                    void loadDashboard()
                  }
                  className="rounded-full bg-[#C5A46D] px-5 py-2.5 text-sm font-bold text-[#17191D] hover:bg-[#E9D9BB]"
                >
                  ↻ Refresh Overview
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ACCESS CHECK */}

        {dashboardState === "loading" && (
          <div className="mt-8 rounded-3xl border border-[#E8E1D5] bg-white p-8 text-center">
            <p className="text-sm text-[#716B62]">
              Checking administrator access
              and loading your dashboard...
            </p>
          </div>
        )}

        {/* LOGIN REQUIRED */}

        {dashboardState === "login" && (
          <section className="mt-8 rounded-3xl border border-[#E8E1D5] bg-white p-8 text-center">
            <div className="text-4xl">🔐</div>

            <h2 className="mt-4 text-xl font-black">
              Please Sign In
            </h2>

            <p className="mt-3 text-sm text-[#716B62]">
              Sign in with your authorized
              GoldMart administrator account.
            </p>

            <Link
              href="/login"
              className="mt-6 inline-block rounded-full bg-[#17191D] px-6 py-3 text-sm font-bold text-white"
            >
              Go to Login
            </Link>
          </section>
        )}

        {/* ACCESS RESTRICTED */}

        {dashboardState === "denied" && (
          <section className="mt-8 rounded-3xl border border-[#E8E1D5] bg-white p-8 text-center">
            <div className="text-4xl">🔒</div>

            <h2 className="mt-4 text-xl font-black">
              Administrator Access Required
            </h2>

            <p className="mt-3 text-sm text-[#716B62]">
              Your account could not be verified
              for these administration tools.
              Sign in with the correct account
              or check your backend permissions.
            </p>

            <Link
              href="/account"
              className="mt-6 inline-block rounded-full bg-[#17191D] px-6 py-3 text-sm font-bold text-white"
            >
              Back to My Account
            </Link>
          </section>
        )}

        {/* SERVER ERROR */}

        {dashboardState === "unavailable" && (
          <section className="mt-8 rounded-3xl border border-[#E8E1D5] bg-white p-8 text-center">
            <div className="text-4xl">⚠️</div>

            <h2 className="mt-4 text-xl font-black">
              Dashboard Temporarily Unavailable
            </h2>

            <p className="mt-3 text-sm text-[#716B62]">
              The admin services could not be
              loaded. Please try again.
            </p>

            <button
              type="button"
              onClick={() =>
                void loadDashboard()
              }
              className="mt-6 rounded-full bg-[#17191D] px-6 py-3 text-sm font-bold text-white"
            >
              Try Again
            </button>
          </section>
        )}

        {/* ADMIN DASHBOARD */}

        {dashboardState === "ready" && (
          <>
            {/* SUMMARY CARDS */}

            <section className="mt-9">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#96713D]">
                Marketplace Operations
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Dashboard Summary
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[22px] border border-[#E8E1D5] bg-white p-4 shadow-sm sm:p-5"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5F1E9] text-xl">
                      {item.icon}
                    </span>

                    <p className="mt-4 text-xs font-semibold leading-5 text-[#716B62]">
                      {item.label}
                    </p>

                    <p className="mt-2 text-3xl font-black">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-xs leading-5 text-[#716B62]">
                Summary figures are based on the
                records returned by the existing
                APIs. Refund figures include only
                the first page; support results may
                also be limited.
              </p>
            </section>

            {/* MANAGEMENT TOOLS */}

            <section className="mt-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#96713D]">
                  Administration
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Management Tools
                </h2>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {ADMIN_MODULES.map((item) => {
                  const module = modules[item.key];

                  return (
                    <article
                      key={item.key}
                      className="flex flex-col rounded-[24px] border border-[#E8E1D5] bg-white p-6 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F1E9] text-2xl">
                          {item.icon}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            module.state === "ready"
                              ? "bg-emerald-50 text-emerald-800"
                              : module.state === "denied"
                                ? "bg-stone-100 text-stone-700"
                                : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {module.state === "ready"
                            ? "Connected"
                            : module.state === "denied"
                              ? "Restricted"
                              : "Unavailable"}
                        </span>
                      </div>

                      <h3 className="mt-5 text-xl font-black">
                        {item.title}
                      </h3>

                      <p className="mt-3 flex-1 text-sm leading-6 text-[#716B62]">
                        {item.description}
                      </p>

                      {module.state === "ready" && (
                        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-[#FAF8F3] p-4">
                          <div>
                            <p className="text-xs text-[#716B62]">
                              Loaded
                            </p>

                            <p className="mt-1 text-2xl font-black">
                              {module.total}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-[#716B62]">
                              Needs Attention
                            </p>

                            <p className="mt-1 text-2xl font-black">
                              {module.attention}
                            </p>
                          </div>
                        </div>
                      )}

                      {module.state === "error" && (
                        <p className="mt-5 break-words rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                          {module.message}
                        </p>
                      )}

                      {module.state === "ready" ? (
                        <Link
                          href={item.href}
                          className="mt-5 block rounded-full bg-[#17191D] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#96713D]"
                        >
                          {item.button} →
                        </Link>
                      ) : (
                        <p className="mt-5 rounded-full border border-[#E8E1D5] px-5 py-3 text-center text-xs font-semibold text-[#716B62]">
                          {module.message}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>

            {/* SAFETY INFORMATION */}

            <section className="mt-9 rounded-[24px] border border-[#E2D5BE] bg-[#FFF9EE] p-6">
              <h2 className="text-lg font-black">
                🛡️ Admin Safety
              </h2>

              <p className="mt-3 text-sm leading-7 text-[#665F55]">
                Reports and account restrictions
                must be reviewed carefully.
                Approving a refund request
                records an administrative
                decision only; it does not
                automatically send money.
                Actual permissions are enforced
                by the backend.
              </p>
            </section>
          </>
        )}

        <p className="mt-9 text-center text-xs text-[#89847A]">
          GoldMart Administration ·
          Marketplace Control Centre
        </p>
      </div>
    </main>
  );
}
