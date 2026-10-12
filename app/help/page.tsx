
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
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f7] text-black">

      <header className="border-b bg-white p-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-black"
          >
            Gold
            <span className="text-[#C49A29]">
              Mart
            </span>
          </Link>

          <Link
            href="/account"
            className="text-sm font-bold"
          >
            My Account
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10">

        <Link
          href="/"
          className="text-sm font-bold text-[#9A7617]"
        >
          ← Back to Home
        </Link>

        <h1 className="mt-6 text-3xl font-black">
          🎧 Help Centre
        </h1>

        <p className="mt-3 text-gray-600">
          Welcome to GoldMart Support.
          How can we help you?
        </p>

        {/* QUICK HELP */}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">

          <Link
            href="/track-order"
            className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="text-3xl">
              📦
            </div>

            <h2 className="mt-3 text-xl font-black">
              Track Order
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Check the current status
              of your purchases.
            </p>
          </Link>

          <Link
            href="/order-protection"
            className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="text-3xl">
              🛡️
            </div>

            <h2 className="mt-3 text-xl font-black">
              Buyer Protection
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Request cancellations,
              returns and refunds.
            </p>
          </Link>

          <Link
            href="/orders"
            className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="text-3xl">
              🛍️
            </div>

            <h2 className="mt-3 text-xl font-black">
              My Orders
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              View your purchase history.
            </p>
          </Link>

          <Link
            href="/chat"
            className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="text-3xl">
              💬
            </div>

            <h2 className="mt-3 text-xl font-black">
              Messages
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Open your conversations
              with sellers.
            </p>
          </Link>

        </div>

        {/* FREQUENTLY ASKED QUESTIONS */}

        <section className="mt-12">

          <h2 className="text-2xl font-black">
            Frequently Asked Questions
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Tap a question to see the answer.
          </p>

          <div className="mt-5 space-y-3">

            {questions.map((item) => (
              <details
                key={item.question}
                className="rounded-2xl bg-white p-5 shadow-sm"
              >
                <summary className="cursor-pointer font-bold">
                  {item.question}
                </summary>

                <p className="mt-4 text-sm leading-6 text-gray-600">
                  {item.answer}
                </p>
              </details>
            ))}

          </div>
        </section>

        {/* SUPPORT INFORMATION */}

        <section className="mt-10 rounded-2xl bg-[#FFF6DB] p-6">

          <h2 className="text-xl font-black">
            Need More Help?
          </h2>

          <p className="mt-3 text-sm leading-6 text-gray-700">
            If you have a problem with an order,
            use Buyer Protection to submit a
            request for review. A dedicated
            support-ticket system will be added
            later.
          </p>

          <Link
            href="/order-protection"
            className="mt-5 inline-block rounded-xl bg-black px-6 py-3 text-sm font-bold text-white"
          >
            Request Order Support →
          </Link>

        </section>

      </section>
    </main>
  );
}
