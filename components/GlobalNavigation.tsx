
"use client";

import { useEffect } from "react";
import type { CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";

const STORAGE_KEY = "goldmart_navigation_history_v2";

function readHistory(): string[] {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

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

const navigationStyle: CSSProperties = {
  position: "fixed",
  right: "12px",
  bottom:
    "calc(100px + env(safe-area-inset-bottom, 0px))",
  zIndex: 2147483000,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  pointerEvents: "auto",
};

const buttonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  minHeight: "42px",
  padding: "9px 14px",
  backgroundColor: "#FFFFFF",
  color: "#17191D",
  border: "1px solid #D4AF37",
  borderRadius: "999px",
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.18)",
  fontSize: "13px",
  fontWeight: 700,
  fontFamily: "Arial, sans-serif",
  lineHeight: 1.2,
  cursor: "pointer",
  opacity: 1,
  visibility: "visible",
};

export default function GlobalNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  // Remember visited GoldMart pages.
  useEffect(() => {
    if (!pathname) return;

    let history = readHistory();

    if (history[history.length - 1] === pathname) {
      return;
    }

    const existingIndex = history.lastIndexOf(pathname);

    if (existingIndex !== -1) {
      history = history.slice(0, existingIndex + 1);
    } else {
      history.push(pathname);
    }

    saveHistory(history);
  }, [pathname]);

  function goBack() {
    const currentPath = pathname || "/";
    const history = readHistory();

    if (history.length > 1) {
      // Remove the current page from the stack.
      if (
        history[history.length - 1] === currentPath
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

    // Someone who opened a page directly
    // should remain inside GoldMart.
    router.push("/");
  }

  function goHome() {
    router.push("/");
  }

  return (
    <nav
      aria-label="GoldMart page navigation"
      style={navigationStyle}
    >
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
    </nav>
  );
}
