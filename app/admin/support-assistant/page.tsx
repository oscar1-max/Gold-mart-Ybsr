
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

// ==============================================
// GOLDMART ADMIN SUPPORT ASSISTANT
// FREE RULE-BASED EDITION
// ==============================================
//
// - No paid AI API
// - Administrator-only backend
// - Creates support drafts
// - Never automatically sends messages
// - Never approves refunds or payments
//
// ==============================================

const API_URL =
  "https://goldmart-backend-yoxc.onrender.com";

type Audience = "buyer" | "seller";

type Issue = {
  id: string;
  name: string;
};

type ServiceResponse = {
  success: boolean;
  service?: string;
  issues?: Issue[];
  message?: string;
};

type DraftResponse = {
  success: boolean;
  audience: Audience;
  issue: string;
  issue_name: string;
  draft: string;
  review_checklist: string[];
  requires_human_review: boolean;
  automatically_sent: boolean;
  message?: string;
};

export default function AdminSupportAssistantPage() {
  const [authorized, setAuthorized] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [issues, setIssues] =
    useState<Issue[]>([]);

  const [audience, setAudience] =
    useState<Audience>("buyer");

  const [issue, setIssue] =
    useState("");

  const [draft, setDraft] =
    useState<DraftResponse | null>(null);

  const [editableDraft, setEditableDraft] =
    useState("");

  const [generating, setGenerating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  // ============================================
  // LOAD SUPPORT SERVICE
  // ============================================

  const loadService = useCallback(async () => {
    setLoading(true);
    setError("");
    setAuthorized(false);

    try {
      const token =
        localStorage.getItem("goldmart_token");

      if (!token) {
        throw new Error(
          "Please sign in with your GoldMart administrator account."
        );
      }

      const response = await fetch(
        `${API_URL}/api/admin-support-drafts`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      const result = (await response
        .json()
        .catch(() => null)) as
        | ServiceResponse
        | null;

      if (response.status === 401) {
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "Administrator access denied."
        );
      }

      if (
        !response.ok ||
        !result?.success ||
        !Array.isArray(result.issues)
      ) {
        throw new Error(
          result?.message ||
            "Unable to load the support assistant."
        );
      }

      const validIssues = result.issues.filter(
        (item): item is Issue =>
          typeof item?.id === "string" &&
          typeof item?.name === "string"
      );

      setIssues(validIssues);
      setIssue((current) =>
        validIssues.some(
          (item) => item.id === current
        )
          ? current
          : validIssues[0]?.id || ""
      );

      setAuthorized(true);
    } catch (err) {
      setIssues([]);
      setDraft(null);
      setEditableDraft("");

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load support assistant."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadService();
  }, [loadService]);

  // ============================================
  // GENERATE A SUPPORT DRAFT
  // ============================================

  async function generateDraft(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      generating ||
      !authorized ||
      !issue
    ) {
      return;
    }

    setGenerating(true);
    setError("");
    setNotice("");
    setDraft(null);
    setEditableDraft("");

    try {
      const token =
        localStorage.getItem("goldmart_token");

      if (!token) {
        throw new Error(
          "Please sign in again."
        );
      }

      const response = await fetch(
        `${API_URL}/api/admin-support-drafts/draft`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            audience,
            issue,
          }),
        }
      );

      const result = (await response
        .json()
        .catch(() => null)) as
        | DraftResponse
        | null;

      if (response.status === 401) {
        throw new Error(
          "Session expired. Please sign in again."
        );
      }

      if (response.status === 403) {
        throw new Error(
          "Administrator access denied."
        );
      }

      if (
        !response.ok ||
        !result?.success ||
        typeof result.draft !== "string" ||
        !Array.isArray(
          result.review_checklist
        )
      ) {
        throw new Error(
          result?.message ||
            "Unable to generate the support draft."
        );
      }

      setDraft(result);
      setEditableDraft(result.draft);

      setNotice(
        "Draft prepared successfully. Review the checklist and edit the reply before using it."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Support draft request failed."
      );
    } finally {
      setGenerating(false);
    }
  }

  // ============================================
  // COPY THE EDITED DRAFT
  // ============================================

  async function copyDraft() {
    if (!editableDraft.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        editableDraft
      );

      setNotice(
        "Message copied. Review the actual case before sending it."
      );
      setError("");
    } catch {
      setNotice("");
      setError(
        "Could not copy automatically. Select the draft text and copy it manually."
      );
    }
  }

  function resetDraft() {
    setDraft(null);
    setEditableDraft("");
    setNotice("");
    setError("");
  }

  // ============================================
  // PAGE
  // ============================================

  return (
    <main className="min-h-screen bg-[#FFFFFF] pb-32 text-[#0A1F1A] md:pb-12">
      {/* Admin visual identity: existing permissions and actions remain authoritative */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="relative overflow-hidden rounded-[28px] px-6 py-8 text-white shadow-[0_18px_38px_rgba(22,39,46,0.13)] sm:px-10 sm:py-11" style={{background:"linear-gradient(135deg, #0A1F1A 0%, #1A3C32 50%, #D4AF37 100%)"}}>
          <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-12 text-[150px] leading-none opacity-10">✎</span>
          <div className="relative">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.23em]" style={{color:"#F7F7F5"}}>GOLDMART PRIVATE ADMIN · DRAFT WORKSPACE</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Support Assistant</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">Thoughtful support replies, prepared with clarity.</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[11px] font-bold text-white/90"><span className="h-2 w-2 rounded-full bg-[#F7F7F5]"/>Authorized access required</div>
          </div>
        </div>
        <nav aria-label="Admin workspaces" className="og-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2">
          <Link href="/admin" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#F7F7F5] bg-white text-[#1A3C32] hover:border-[#F5E6A3] hover:bg-[#F7F7F5]">Overview</Link>
          <Link href="/admin/ai" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#F7F7F5] bg-white text-[#1A3C32] hover:border-[#F5E6A3] hover:bg-[#F7F7F5]">AI Admin</Link>
          <Link href="/admin/monitoring" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#F7F7F5] bg-white text-[#1A3C32] hover:border-[#F5E6A3] hover:bg-[#F7F7F5]">Monitoring</Link>
          <Link href="/admin/support-assistant" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#1A3C32] bg-[#1A3C32] text-white">Assistant</Link>
          <Link href="/admin/reports" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#F7F7F5] bg-white text-[#1A3C32] hover:border-[#F5E6A3] hover:bg-[#F7F7F5]">Reports</Link>
          <Link href="/admin/refunds" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#F7F7F5] bg-white text-[#1A3C32] hover:border-[#F5E6A3] hover:bg-[#F7F7F5]">Refunds</Link>
          <Link href="/admin/support" className="shrink-0 rounded-full border px-4 py-2.5 text-xs font-bold transition border-[#F7F7F5] bg-white text-[#1A3C32] hover:border-[#F5E6A3] hover:bg-[#F7F7F5]">Support</Link>
        </nav>
      </div>

      {/* HEADER */}

      <header className="border-b border-[#F5E6A3] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5">
          <Link
            href="/"
            className="text-2xl font-black"
          >
            Gold
            <span className="text-[#1A3C32]">
              Mart
            </span>
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/ai"
              className="rounded-full border px-4 py-2 text-sm font-bold"
            >
              🤖 AI Admin
            </Link>

            <Link
              href="/admin/monitoring"
              className="rounded-full border px-4 py-2 text-sm font-bold"
            >
              🛡️ Monitoring
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 pb-40">
        {/* TITLE */}

        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-[#D4AF37]">
            GoldMart Administration
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            💬 Customer Support Assistant
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
            Prepare professional replies to buyer
            and seller concerns using free,
            predefined support templates.
          </p>
        </div>

        {/* SECURITY */}

        <section className="rounded-2xl border border-[#F7F7F5] bg-white p-5">
          <p className="font-black">
            🔒 Secure support drafting
          </p>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            This assistant creates message drafts
            only. It does not send them, approve
            refunds, confirm payments or make
            decisions about customer accounts.
          </p>
        </section>

        {/* LOADING */}

        {loading && (
          <div className="rounded-[21px] border border-[#F7F7F5] bg-white shadow-[0_5px_18px_rgba(26,43,48,0.035)] p-8 text-center">
            Loading GoldMart Support Assistant...
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
          >
            <p>{error}</p>

            {!authorized && (
              <button
                type="button"
                onClick={() =>
                  void loadService()
                }
                className="mt-3 font-bold underline"
              >
                Try Again
              </button>
            )}
          </div>
        )}

        {/* AUTHORIZED INTERFACE */}

        {!loading && authorized && (
          <>
            {/* DRAFT FORM */}

            <section className="rounded-[25px] border border-[#F7F7F5] bg-white shadow-[0_7px_24px_rgba(26,43,48,0.045)] p-5 shadow-sm sm:p-7">
              <h2 className="text-xl font-black">
                Create a Support Reply
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Select who you're replying to and
                what their concern is.
              </p>

              <form
                onSubmit={generateDraft}
                className="mt-6 space-y-5"
              >
                {/* AUDIENCE */}

                <fieldset>
                  <legend className="mb-3 text-sm font-bold">
                    Who needs a response?
                  </legend>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAudience("buyer");
                        resetDraft();
                      }}
                      className={`rounded-2xl border p-4 font-bold ${
                        audience === "buyer"
                          ? "border-[#1A3C32] bg-[#F7F7F5]"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      🛒 Buyer
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAudience("seller");
                        resetDraft();
                      }}
                      className={`rounded-2xl border p-4 font-bold ${
                        audience === "seller"
                          ? "border-[#1A3C32] bg-[#F7F7F5]"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      🏪 Seller
                    </button>
                  </div>
                </fieldset>

                {/* ISSUE */}

                <div>
                  <label
                    htmlFor="support-issue"
                    className="mb-2 block text-sm font-bold"
                  >
                    Select the support issue
                  </label>

                  <select
                    id="support-issue"
                    value={issue}
                    onChange={(event) => {
                      setIssue(
                        event.target.value
                      );
                      resetDraft();
                    }}
                    className="w-full rounded-2xl border border-gray-300 bg-white p-4 text-sm outline-none focus:border-[#1A3C32]"
                  >
                    {issues.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={
                    generating ||
                    !issue
                  }
                  className="w-full rounded-full bg-[#0A1F1A] px-6 py-4 text-sm font-black text-white disabled:opacity-50"
                >
                  {generating
                    ? "Preparing Reply..."
                    : "✨ Generate Support Draft"}
                </button>
              </form>
            </section>

            {/* SUCCESS NOTICE */}

            {notice && (
              <div
                role="status"
                className="rounded-2xl border border-[#F5E6A3] bg-[#F7F7F5] p-4 text-sm"
              >
                {notice}
              </div>
            )}

            {/* GENERATED DRAFT */}

            {draft && (
              <section className="space-y-5">
                <div className="rounded-[25px] border border-[#F7F7F5] bg-white shadow-[0_7px_24px_rgba(26,43,48,0.045)] p-5 shadow-sm sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black">
                        Prepared Reply
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        {draft.issue_name} •{" "}
                        {draft.audience === "buyer"
                          ? "Buyer"
                          : "Seller"}
                      </p>
                    </div>

                    <span className="rounded-full border px-3 py-2 text-xs font-bold">
                      Human review required
                    </span>
                  </div>

                  <label
                    htmlFor="support-draft"
                    className="mt-5 block text-sm font-bold"
                  >
                    Edit the reply before using it
                  </label>

                  <textarea
                    id="support-draft"
                    value={editableDraft}
                    onChange={(event) =>
                      setEditableDraft(
                        event.target.value
                      )
                    }
                    rows={13}
                    className="mt-2 w-full resize-y rounded-2xl border border-gray-300 bg-[#FFFFFF] p-4 text-sm leading-7 outline-none focus:border-[#1A3C32]"
                  />

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        void copyDraft()
                      }
                      disabled={
                        !editableDraft.trim()
                      }
                      className="rounded-full bg-[#1A3C32] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
                    >
                      📋 Copy Reply
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditableDraft(
                          draft.draft
                        );
                        setNotice(
                          "Original template restored."
                        );
                      }}
                      className="rounded-full border px-5 py-3 text-sm font-bold"
                    >
                      Reset Draft
                    </button>
                  </div>
                </div>

                {/* REVIEW CHECKLIST */}

                <div className="rounded-[25px] border border-[#F7F7F5] bg-white shadow-[0_7px_24px_rgba(26,43,48,0.045)] p-5 shadow-sm sm:p-7">
                  <h2 className="text-xl font-black">
                    ✅ Review Before Sending
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Complete the relevant checks
                    using actual GoldMart records.
                  </p>

                  <ul className="mt-5 space-y-3">
                    {draft.review_checklist.map(
                      (item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 rounded-xl border p-3 text-sm leading-6"
                        >
                          <span className="font-black text-[#D4AF37]">
                            {index + 1}.
                          </span>

                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* WARNING */}

                <div className="rounded-2xl border border-[#F7F7F5] bg-white p-5 text-sm leading-6 text-gray-600">
                  <strong className="text-gray-900">
                    Important:
                  </strong>{" "}
                  The response has not been sent.
                  The assistant has not investigated
                  a specific order or verified any
                  customer claim. Check the facts
                  and applicable customer rights
                  before sending a reply.
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
