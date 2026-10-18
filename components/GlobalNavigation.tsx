
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
  color: "#17191D",

  border: "1px solid #D4AF37",
  borderRadius: "999px",

  boxShadow:
    "0 4px 14px rgba(0,0,0,0.18)",

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
  backgroundColor: "#B38A25",
  color: "#FFFFFF",
  borderColor: "#896716",
};

const monitoringButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: "#17191D",
  color: "#FFFFFF",
  borderColor: "#17191D",
};

const supportButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: "#FFFFFF",
  color: "#896716",
  borderColor: "#B38A25",
};

// =====================================================
// GLOBAL NAVIGATION COMPONENT
// =====================================================

export default function GlobalNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const [isAdmin, setIsAdmin] =
    useState(false);

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

  // ===================================================
  // INTERFACE
  // ===================================================

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

      {/* ADMIN-ONLY BUTTONS */}

      {isAdmin && (
        <>
          <button
            type="button"
            onClick={goAiAdmin}
            style={aiButtonStyle}
          >
            🤖 AI Admin
          </button>

          <button
            type="button"
            onClick={goMonitoring}
            style={monitoringButtonStyle}
          >
            🛡️ Monitoring
          </button>

          <button
            type="button"
            onClick={goSupportAssistant}
            style={supportButtonStyle}
          >
            💬 Support Assistant
          </button>
        </>
      )}
    </nav>
  );
}
