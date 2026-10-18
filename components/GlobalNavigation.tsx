
"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";

const STORAGE_KEY =
  "goldmart_navigation_history_v2";

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

// ==========================================
// PAGE HISTORY
// ==========================================

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
    // Navigation can still fall back to Home.
  }
}

// ==========================================
// FLOATING NAVIGATION STYLES
// ==========================================

const navigationStyle: CSSProperties = {
  position: "fixed",
  right: "12px",
  bottom:
    "calc(100px + env(safe-area-inset-bottom, 0px))",
  zIndex: 2147483000,

  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",

  maxWidth: "calc(100vw - 24px)",
  pointerEvents: "auto",
};

const buttonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",

  minHeight: "42px",
  padding: "9px 12px",

  backgroundColor: "#FFFFFF",
  color: "#17191D",

  border: "1px solid #D4AF37",
  borderRadius: "999px",

  boxShadow:
    "0 4px 14px rgba(0, 0, 0, 0.18)",

  fontSize: "13px",
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

  backgroundColor: "#B38A25",
  color: "#FFFFFF",
  border: "1px solid #896716",
};

const monitoringButtonStyle: CSSProperties = {
  ...buttonStyle,

  backgroundColor: "#17191D",
  color: "#FFFFFF",
  border: "1px solid #17191D",
};

// ==========================================
// GLOBAL NAVIGATION
// ==========================================

export default function GlobalNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const [isAiAdmin, setIsAiAdmin] =
    useState(false);

  // ========================================
  // REMEMBER VISITED GOLDMART PAGES
  // ========================================

  useEffect(() => {
    if (!pathname) return;

    let history = readHistory();

    if (
      history[history.length - 1] === pathname
    ) {
      return;
    }

    const existingIndex =
      history.lastIndexOf(pathname);

    if (existingIndex !== -1) {
      history = history.slice(
        0,
        existingIndex + 1
      );
    } else {
      history.push(pathname);
    }

    saveHistory(history);
  }, [pathname]);

  // ========================================
  // VERIFY AUTHORIZED ADMINISTRATOR
  // ========================================
  //
  // Never trust localStorage role or ID
  // as proof of administrator access.
  //
  // Both AI Admin and Monitoring require
  // server-side authorization.
  //
  // ========================================

  useEffect(() => {
    let mounted = true;

    let activeController:
      | AbortController
      | null = null;

    async function verifyAdministrator() {
      activeController?.abort();

      const controller =
        new AbortController();

      activeController = controller;

      setIsAiAdmin(false);

      const token =
        localStorage.getItem(
          "goldmart_token"
        );

      if (!token) {
        return;
      }

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
          setIsAiAdmin(response.ok);
        }
      } catch {
        if (
          mounted &&
          !controller.signal.aborted
        ) {
          setIsAiAdmin(false);
        }
      }
    }

    function refreshNavigation() {
      void verifyAdministrator();
    }

    function onVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void verifyAdministrator();
      }
    }

    void verifyAdministrator();

    window.addEventListener(
      "focus",
      refreshNavigation
    );

    window.addEventListener(
      "storage",
      refreshNavigation
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
        refreshNavigation
      );

      window.removeEventListener(
        "storage",
        refreshNavigation
      );

      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange
      );
    };
  }, [pathname]);

  // ========================================
  // BACK BUTTON
  // ========================================

  function goBack() {
    const currentPath =
      pathname || "/";

    const history = readHistory();

    if (history.length > 1) {
      if (
        history[history.length - 1] ===
        currentPath
      ) {
        history.pop();
      }

      const previousPage =
        history[history.length - 1];

      if (
        previousPage &&
        previousPage !== currentPath
      ) {
        saveHistory(history);

        router.push(previousPage);
        return;
      }
    }

    router.push("/");
  }

  // ========================================
  // HOME BUTTON
  // ========================================

  function goHome() {
    router.push("/");
  }

  // ========================================
  // AI ADMIN BUTTON
  // ========================================

  function goToAiAdmin() {
    router.push("/admin/ai");
  }

  // ========================================
  // NEW MONITORING CENTER BUTTON
  // ========================================

  function goToMonitoring() {
    router.push("/admin/monitoring");
  }

  // ========================================
  // INTERFACE
  // ========================================

  return (
    <nav
      aria-label="GoldMart page navigation"
      style={navigationStyle}
    >
      {/* BACK */}

      <button
        type="button"
        onClick={goBack}
        style={buttonStyle}
        aria-label="Go back"
        title="Previous GoldMart page"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>

        Back
      </button>

      {/* HOME */}

      <button
        type="button"
        onClick={goHome}
        style={buttonStyle}
        aria-label="Go to homepage"
        title="GoldMart homepage"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m3 10 9-7 9 7" />
          <path d="M5 9v12h14V9" />
          <path d="M9 21v-8h6v8" />
        </svg>

        Home
      </button>

      {/* ADMIN-ONLY AI ASSISTANT */}

      {isAiAdmin && (
        <button
          type="button"
          onClick={goToAiAdmin}
          style={aiButtonStyle}
          aria-label="Open GoldMart AI Admin"
          title="GoldMart AI Admin"
        >
          🤖 AI Admin
        </button>
      )}

      {/* ADMIN-ONLY MONITORING CENTER */}

      {isAiAdmin && (
        <button
          type="button"
          onClick={goToMonitoring}
          style={monitoringButtonStyle}
          aria-label="Open GoldMart Monitoring Center"
          title="GoldMart Monitoring Control Center"
        >
          🛡️ Monitoring
        </button>
      )}
    </nav>
  );
}
