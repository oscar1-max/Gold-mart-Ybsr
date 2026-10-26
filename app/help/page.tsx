
import Link from "next/link";

const questions = [
  {
    question: "How can I track my order?",
    answer:
      "Go to Track Order, sign in and select your order. You will see the latest recorded order status.",
  },
  {
    question: "How can I cancel an order?",
    answer:
      "Open Buyer Protection, select the order and submit a cancellation request. GoldMart must review the request before any refund is processed.",
  },
  {
    question: "How can I request a refund?",
    answer:
      "Visit Buyer Protection, select your order and explain the problem. Your request will be reviewed. Approval does not mean the refund has already been paid.",
  },
  {
    question: "What if my product is damaged?",
    answer:
      "Submit a refund or return request through Buyer Protection. Explain the damage and keep photos and order details for review.",
  },
  {
    question: "How can I contact a seller?",
    answer:
      "Open Messages to view your existing conversations with sellers.",
  },
  {
    question: "When should I confirm delivery?",
    answer:
      "Only confirm delivery after you have actually received and checked your order.",
  },
  {
    question: "How do I request account deletion?",
    answer: "Open Account Deletion from My Account, then create a support ticket under Account help. Deletion requests are reviewed manually.",
  },
  {
    question: "Are delivery fees and live payments enabled?",
    answer: "Not yet. GoldMart checkout currently uses payment test mode, and delivery fees and providers have not been finalized.",
  },
  {
    question: "How can I contact GoldMart Support?",
    answer:
      "Select Contact Support to create a private support ticket. You can view your ticket status and send follow-up messages.",
  },
];

const quickHelp = [
  {
    icon: "🎫",
    title: "Contact Support",
    description:
      "Create a ticket and get help from GoldMart Support.",
    href: "/support",
  },
  {
    icon: "📦",
    title: "Track Order",
    description:
      "Check the current status of your purchases.",
    href: "/track-order",
  },
  {
    icon: "🛡️",
    title: "Buyer Protection",
    description:
      "Request cancellations, returns and refunds.",
    href: "/order-protection",
  },
  {
    icon: "🛍️",
    title: "My Orders",
    description:
      "View your purchase history.",
    href: "/orders",
  },
  {
    icon: "💬",
    title: "Messages",
    description:
      "Open your conversations with sellers.",
    href: "/chat",
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#FFFFFF] pb-28 text-[#14263D] md:pb-14">
      <section aria-label="Help centre introduction" className="relative mx-auto mt-5 max-w-7xl overflow-hidden rounded-[27px] px-6 py-8 text-white shadow-[0_15px_35px_rgba(25,39,46,0.13)] sm:mt-8 sm:px-10 sm:py-12" style={{ background: "linear-gradient(135deg, #14263D 0%, #243B53 50%, #FF6B00 100%)" }}>
        <div className="pointer-events-none absolute -right-8 -top-14 text-[150px] leading-none opacity-10" aria-hidden="true">🎧</div>
        <div className="relative">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#FFE9CC]">GoldMart · Help centre</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">We're here to help.</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/85">Find answers, contact support, and get help with orders or your account.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/shop" className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/25">Shop All ↗</Link>
            <Link href="/track-order" className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/25">Track Order ↗</Link>
            <Link href="/help" className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/25">Help Centre ↗</Link>
          </div>
        </div>
      </section>

      <div className="h-1 bg-gradient-to-r from-[#243B53] via-[#FFF8F2] to-[#FF6B00]" />

      <header className="border-b border-[#FFF8F2] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5">
          <Link
            href="/"
            className="text-2xl font-black tracking-tight"
          >
            Gold
            <span className="text-[#FF6B00]">
              Mart
            </span>
          </Link>

          <Link
            href="/account"
            className="rounded-full border border-[#FFF8F2] px-4 py-2 text-sm font-bold transition hover:border-[#FF6B00]"
          >
            My Account
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="text-sm font-bold text-[#243B53] hover:underline"
        >
          ← Back to Home
        </Link>

        {/* HELP CENTRE HERO */}

        <section className="mt-6 overflow-hidden rounded-[28px] bg-[#14263D] px-6 py-9 text-white sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFF8F2]">
            GoldMart Customer Care
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            🎧 Help & Support
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#FFF8F2]">
            Need assistance with shopping, orders,
            payments, deliveries or your seller account?
            We're here to help.
          </p>

          <Link
            href="/support"
            className="mt-7 inline-flex items-center justify-center rounded-full bg-[#FF6B00] px-7 py-3 text-sm font-extrabold text-[#14263D] transition hover:bg-[#FFF8F2]"
          >
            🎫 Contact GoldMart Support →
          </Link>
        </section>

        {/* QUICK HELP */}

        <section className="mt-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#243B53]">
            How can we help?
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Support Services
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickHelp.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-[22px] border border-[#FFF8F2] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#FF6B00] hover:shadow-md"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF8F2] text-2xl">
                  {item.icon}
                </span>

                <h3 className="mt-4 text-lg font-black">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#FF6B00]">
                  {item.description}
                </p>

                <span className="mt-4 inline-block text-sm font-bold text-[#243B53]">
                  Open →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}

        <section className="mt-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#243B53]">
            Common Questions
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Frequently Asked Questions
          </h2>

          <p className="mt-2 text-sm text-[#FF6B00]">
            Tap a question to see the answer.
          </p>

          <div className="mt-6 space-y-3">
            {questions.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-[#FFF8F2] bg-white p-5 shadow-sm"
              >
                <summary className="cursor-pointer font-bold">
                  {item.question}
                </summary>

                <p className="mt-4 text-sm leading-7 text-[#FF6B00]">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* CONTACT SUPPORT */}

        <section className="mt-12 rounded-[26px] bg-[#14263D] p-7 text-white sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFF8F2]">
            Need More Assistance?
          </p>

          <h2 className="mt-3 text-2xl font-black">
            We're Here to Help
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#FFF8F2]">
            Can't find the answer you're looking for?
            Create a private support ticket, track its
            progress and communicate with GoldMart Support.
          </p>

          <Link
            href="/support"
            className="mt-6 inline-flex rounded-full bg-[#FF6B00] px-7 py-3 text-sm font-bold text-[#14263D] transition hover:bg-[#FFF8F2]"
          >
            Open Support Ticket →
          </Link>
        </section>
      </div>
    </main>
  );
}
