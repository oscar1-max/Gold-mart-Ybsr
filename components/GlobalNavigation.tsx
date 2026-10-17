
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const STORAGE_KEY = "goldmart_navigation_history_v1";

function readHistory(): string[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);

    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (path): path is string =>
          typeof path === "string" &&
          path.startsWith("/") &&
          !path.startsWith("//")
      )
      .slice(-30);
  } catch {
    return [];
  }
}

function saveHistory(paths: string[]) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(paths.slice(-30))
    );
  } catch {
    // Navigation still works without storage.
  }
}

export default function GlobalNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const [previousPath, setPreviousPath] =
    useState<string | null>(null);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!pathname) return;

    let history = readHistory();

    const existingIndex = history.lastIndexOf(pathname);

    if (existingIndex >= 0) {
      // Returning to an earlier page removes
      // the pages that came after it.
      history = history.slice(0, existingIndex + 1);
    } else {
      history.push(pathname);
    }

    saveHistory(history);

    setPreviousPath(
      history.length > 1
        ? history[history.length - 2]
        : null
    );

    setReady(true);
  }, [pathname]);

  function goBack() {
    const history = readHistory();

    if (
      pathname &&
      history.length > 1 &&
      history[history.length - 1] === pathname
    ) {
      history.pop();

      const destination =
        history[history.length - 1] || "/";

      saveHistory(history);
      router.push(destination);
      return;
    }

    if (previousPath && previousPath !== pathname) {
      router.push(previousPath);
      return;
    }

    // Safe fallback for direct page visits.
    router.push("/");
  }

  function goHome() {
    router.push("/");
  }

  if (!ready || !pathname) {
    return null;
  }

  // The homepage doesn't need a Home button.
  // Still show Back if the user came from
  // another GoldMart page.
  if (pathname === "/" && !previousPath) {
    return null;
  }

  const buttonClass =
    "flex items-center justify-center gap-2 " +
    "rounded-full border border-[#D4AF37]/40 " +
    "bg-white px-4 py-2.5 text-sm font-bold " +
    "text-[#17191D] shadow-lg " +
    "transition hover:bg-[#FFF6DA] " +
    "focus-visible:outline-none " +
    "focus-visible:ring-2 " +
    "focus-visible:ring-[#B58A16]";

  return (
    <nav
      aria-label="GoldMart quick navigation"
      className={
        "fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] " +
        "right-3 z-40 flex items-center gap-2 " +
        "md:bottom-6 md:right-6"
      }
    >
      <button
        type="button"
        onClick={goBack}
        className={buttonClass}
        aria-label="Go back to the previous GoldMart page"
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

        <span>Back</span>
      </button>

      {pathname !== "/" && (
        <button
          type="button"
          onClick={goHome}
          className={buttonClass}
          aria-label="Go to GoldMart homepage"
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

          <span>Home</span>
        </button>
      )}
    </nav>
  );
}
