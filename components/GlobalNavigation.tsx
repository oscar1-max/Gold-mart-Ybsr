
"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

// =====================================================
// GOLDMART GLOBAL NAVIGATION
// =====================================================
//
// Back and Home: everyone
//
// AI Admin, Monitoring and Support Assistant:
// only authorized GoldMart administrators.
//
// Administrator access is checked with backend.
// The backend must still protect every admin route.
//
// =====================================================

const STORAGE_KEY =
  "goldmart_navigation_history_v2";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

// =====================================================
// PAGE HISTORY
// =====================================================

function readHistory(): string[] {
  try {
    const saved =
      sessionStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    const parsed: unknown =
      JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item): item is string =>
          typeof item === "string" &&
          item.startsWith("/") &&
          !item.startsWith("//")
      )
      .slice(-30);
  } catch {
    return [];
  }
}

function saveHistory(history: string[]) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(history.slice(-30))
    );
  } catch {
    // Back button can fall back to Home.
  }
}

// =====================================================
// STYLES
// =====================================================

const navigationStyle: CSSProperties = {
  position: "fixed",
  right: "12px",
  bottom:
    "calc(100px + env(safe-area-inset-bottom, 0px))",
  zIndex: 2147483000,

  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "8px",

  maxWidth: "calc(100vw - 24px)",
  pointerEvents: "auto",
};

const buttonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  minHeight: "42px",

  padding: "9px 12px",
  backgroundColor: "#FFFFFF",
  color: "#173e30",

  border: "1px solid #9ccdb5",
  borderRadius: "999px",

  boxShadow:
    "0 4px 14px rgba(17,64,45,0.12)",

  fontSize: "12px",
  fontWeight: 700,
  fontFamily: "Arial, sans-serif",
  lineHeight: 1.2,

  whiteSpace: "nowrap",
  cursor: "pointer",
  opacity: 1,
  visibility: "visible",
};

const aiButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: "#12664e",
  color: "#FFFFFF",
  borderColor: "#0e5945",
};

const monitoringButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: "#173e30",
  color: "#FFFFFF",
  borderColor: "#173e30",
};

const supportButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: "#FFFFFF",
  color: "#0e5945",
  borderColor: "#12664e",
};

// =====================================================
// GLOBAL NAVIGATION COMPONENT
// =====================================================

export default function GlobalNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  // ===================================================
  // TRACK GOLDMART PAGE HISTORY
  // ===================================================

  useEffect(() => {
    if (!pathname) return;

    let history = readHistory();

    if (
      history[history.length - 1] ===
      pathname
    ) {
      return;
    }

    const index =
      history.lastIndexOf(pathname);

    if (index !== -1) {
      history = history.slice(
        0,
        index + 1
      );
    } else {
      history.push(pathname);
    }

    saveHistory(history);
  }, [pathname]);

  // ===================================================
  // VERIFY ADMIN ACCESS WITH BACKEND
  // ===================================================

  useEffect(() => {
    let mounted = true;

    let activeController:
      | AbortController
      | null = null;

    async function verifyAdmin() {
      activeController?.abort();

      const controller =
        new AbortController();

      activeController = controller;

      setIsAdmin(false);

      const token =
        localStorage.getItem(
          "goldmart_token"
        );

      if (!token) return;

      try {
        const response = await fetch(
          `${API_URL}/api/ai-admin`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
              Accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (
          mounted &&
          !controller.signal.aborted
        ) {
          setIsAdmin(response.ok);
        }
      } catch {
        if (
          mounted &&
          !controller.signal.aborted
        ) {
          setIsAdmin(false);
        }
      }
    }

    function refreshAdmin() {
      void verifyAdmin();
    }

    function onVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void verifyAdmin();
      }
    }

    void verifyAdmin();

    window.addEventListener(
      "focus",
      refreshAdmin
    );

    window.addEventListener(
      "storage",
      refreshAdmin
    );

    document.addEventListener(
      "visibilitychange",
      onVisibilityChange
    );

    return () => {
      mounted = false;
      activeController?.abort();

      window.removeEventListener(
        "focus",
        refreshAdmin
      );

      window.removeEventListener(
        "storage",
        refreshAdmin
      );

      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange
      );
    };
  }, [pathname]);

  // ===================================================
  // NAVIGATION ACTIONS
  // ===================================================

  function goBack() {
    const currentPath = pathname || "/";
    const history = readHistory();

    if (history.length > 1) {
      if (
        history[history.length - 1] ===
        currentPath
      ) {
        history.pop();
      }

      const previous =
        history[history.length - 1];

      if (
        previous &&
        previous !== currentPath
      ) {
        saveHistory(history);
        router.push(previous);
        return;
      }
    }

    router.push("/");
  }

  function goHome() {
    router.push("/");
  }

  function goAiAdmin() {
    router.push("/admin/ai");
  }

  function goMonitoring() {
    router.push("/admin/monitoring");
  }

  function goSupportAssistant() {
    router.push("/admin/support-assistant");
  }

  // Keep the mobile dock consistent on every page; the homepage no longer
  // renders a competing bottom bar. AI Admin remains backend-authorized.
  const mobileTabs = [
    { href: "/", icon: "⌂", label: "Home" },
    { href: "/categories", icon: "▦", label: "Categories" },
    { href: "/orders", icon: "▤", label: "Orders" },
    { href: "/cart", icon: "🛒", label: "Cart" },
    { href: "/account", icon: "◉", label: "You" },
  ];

  return (
    <>
      <nav aria-label="GoldMart mobile navigation" className="fixed inset-x-0 bottom-0 z-[90] border-t border-[#dbe9df] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_35px_rgba(23,25,29,0.07)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid h-[66px] max-w-xl grid-cols-5 items-center px-2">
          {mobileTabs.map((tab) => {
            const active = pathname === tab.href || (tab.href !== "/" && pathname?.startsWith(tab.href + "/"));
            return (
              <button key={tab.href} type="button" onClick={() => router.push(tab.href)}
                aria-current={active ? "page" : undefined}
                className={`flex h-[58px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl text-center transition ${active ? "bg-[#e2f2e8] text-[#075f45]" : "text-[#617a6b] hover:bg-[#f4f8f5]"}`}>
                <span aria-hidden="true" className="text-[22px] leading-6">{tab.icon}</span>
                <span className="text-[10px] font-bold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {pathname !== "/" && (
        <button type="button" onClick={goBack} aria-label="Go back to the previous page"
          className="fixed bottom-[calc(82px+env(safe-area-inset-bottom))] left-3 z-[80] flex h-11 items-center gap-2 rounded-full border border-[#d7e6dc] bg-white/95 px-4 text-xs font-bold text-[#173e30] shadow-lg backdrop-blur hover:border-[#268468] md:bottom-6 md:left-6">
          ← Back
        </button>
      )}
      <button type="button" onClick={goHome} aria-label="Go to GoldMart homepage"
        className="fixed bottom-6 right-4 z-[80] hidden h-11 items-center gap-2 rounded-full border border-[#d7e6dc] bg-white/95 px-4 text-xs font-bold text-[#173e30] shadow-lg backdrop-blur hover:border-[#268468] md:flex">
        ⌂ Home
      </button>

      {isAdmin && (
        <div className="fixed bottom-[calc(82px+env(safe-area-inset-bottom))] right-3 z-[85] flex flex-col items-end gap-2 md:bottom-6 md:right-28">
          {adminMenuOpen && (
            <div className="flex flex-col gap-1.5 rounded-2xl border border-[#dce9df] bg-white p-2 shadow-xl" aria-label="Administrator shortcuts">
              <button type="button" onClick={() => { setAdminMenuOpen(false); goAiAdmin(); }} className="rounded-xl px-4 py-2.5 text-left text-xs font-bold hover:bg-[#f4f8f5]">🤖 AI Admin</button>
              <button type="button" onClick={() => { setAdminMenuOpen(false); goMonitoring(); }} className="rounded-xl px-4 py-2.5 text-left text-xs font-bold hover:bg-[#f4f8f5]">🛡️ Monitoring</button>
              <button type="button" onClick={() => { setAdminMenuOpen(false); goSupportAssistant(); }} className="rounded-xl px-4 py-2.5 text-left text-xs font-bold hover:bg-[#f4f8f5]">💬 Support Assistant</button>
            </div>
          )}
          <button type="button" aria-expanded={adminMenuOpen} aria-label="Toggle administrator tools"
            onClick={() => setAdminMenuOpen(value => !value)}
            className="rounded-full border border-[#268468] bg-[#173e30] px-4 py-3 text-xs font-extrabold text-[#e7f7ed] shadow-xl">
            {adminMenuOpen ? "✕ Close" : "✦ Admin Tools"}
          </button>
        </div>
      )}
    </>
  );
}
