"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "../../components/CartProvider";

function getPrice(price: string | number) {
  if (typeof price === "number") {
    return price;
  }

  const cleaned = String(price)
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");

  const value = Number(cleaned);

  return Number.isFinite(value) ? value : 0;
}

function normalizeCurrency(
  currency?: string
) {
  return String(currency || "USD").toUpperCase();
}

function getCurrencySymbol(
  currency: string
) {
  switch (normalizeCurrency(currency)) {
    case "NGN":
      return "₦";

    case "USD":
      return "$";

    case "GBP":
      return "£";

    case "EUR":
      return "€";

    case "GHS":
      return "GH₵";

    case "ZAR":
      return "R";

    case "KES":
      return "KSh";

    case "XOF":
      return "CFA";

    default:
      return currency;
  }
}

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  const currencies = Array.from(
    new Set(
      cart.map((item) =>
        normalizeCurrency(item.currency)
      )
    )
  );

  const currency =
    currencies.length === 1
      ? currencies[0]
      : null;

  const total = cart.reduce(
    (sum, item) =>
      sum +
      getPrice(item.price) *
        Number(item.quantity),
    0
  );

  function formatPrice(
    amount: number,
    itemCurrency?: string
  ) {
    const currentCurrency =
      normalizeCurrency(
        itemCurrency || currency || "USD"
      );

    const symbol =
      getCurrencySymbol(
        currentCurrency
      );

    return `${symbol}${amount.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  const itemCount = cart.reduce((sum, item) => sum + Number(item.quantity), 0);

  return (
    <main className="min-h-screen bg-[#F7F8F6] pb-28 text-[#202A31] md:pb-12">
      <header className="border-b border-[#E5E8E6] bg-white/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="shrink-0 text-2xl font-black tracking-[-0.055em]">
            Gold<span className="text-[#B18D57]">Mart</span><span className="ml-1 align-top text-xs text-[#C5A46D]">✦</span>
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link href="/" className="hidden rounded-full border border-[#E1E7E2] bg-white px-4 py-2.5 text-xs font-bold hover:bg-[#F2F7F3] sm:inline-flex">Home</Link>
            <Link href="/shop" className="rounded-full bg-[#274D50] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#36736D]">Continue shopping ↗</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="relative overflow-hidden rounded-[29px] px-6 py-9 text-white shadow-[0_16px_38px_rgba(28,51,54,0.13)] sm:px-10 sm:py-12"
          style={{background:"linear-gradient(115deg,#223541 0%,#346E6F 55%,#B59168 100%)"}}>
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-white/10" aria-hidden="true" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#F3DFC1]">Your GoldMart bag</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Your cart, beautifully organized.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">Review your picks, adjust quantities, and continue when you are ready.</p>
            </div>
            <div className="w-fit shrink-0 rounded-2xl border border-white/25 bg-white/15 px-6 py-4 backdrop-blur-sm">
              <p className="text-3xl font-black">{itemCount}</p><p className="text-xs font-bold text-white/85">Items in your bag</p>
            </div>
          </div>
        </section>

        <nav aria-label="Cart quick links" className="mt-4 flex flex-wrap gap-2">
          <Link href="/shop" className="rounded-full border border-[#DDE5DF] bg-white px-4 py-2.5 text-xs font-bold text-[#315B5B] hover:bg-[#EDF6F2]">🛍️ Shop All ↗</Link>
          <Link href="/categories" className="rounded-full border border-[#DDE5DF] bg-white px-4 py-2.5 text-xs font-bold text-[#315B5B] hover:bg-[#EDF6F2]">▦ Categories ↗</Link>
          <Link href="/order-protection" className="rounded-full border border-[#DDE5DF] bg-white px-4 py-2.5 text-xs font-bold text-[#315B5B] hover:bg-[#EDF6F2]">🛡️ Buyer Protection ↗</Link>
        </nav>

        <div className="mt-8 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">Your selected items</h2>
          <span className="rounded-full bg-[#E8F2EC] px-3 py-1.5 text-xs font-bold text-[#336E58]">{cart.length} products</span>
        </div>

        {cart.length>0 && currency==="NGN" && <section className="mt-5 rounded-[24px] border border-[#BDD8CD] bg-[#EAF5EF] px-5 py-5 text-[#24564D]"><p className="text-sm font-black">🔒 Proposed Secure Delivery savings</p><p className="mt-2 text-sm">{total>=300000 ? "🎉 This order meets the ₦300,000 free-delivery threshold." : `Add ₦${Math.max(0,300000-total).toLocaleString("en-NG")} more to reach the proposed free-delivery threshold.`}</p><p className="mt-2 text-xs text-[#57776D]">Planned fee: ₦8,000 below ₦300,000; free from ₦300,000. Not yet applied at checkout. Insurance/returns require an active coverage policy and delivery partner.</p></section>}
        {currencies.length > 1 && (
          <div role="alert" className="mt-5 rounded-2xl border border-[#F2D9A7] bg-[#FFF8E8] p-4 text-sm font-semibold text-[#7D5B23]">
            Your cart contains products with different currencies. Please checkout each currency separately.
          </div>
        )}

        {cart.length === 0 ? (
          <section className="mt-6 rounded-[27px] border border-[#E3E8E3] bg-white p-9 text-center shadow-[0_8px_28px_rgba(25,45,48,0.045)] sm:p-14">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[linear-gradient(135deg,#DDF1EA,#FBEADE)] text-5xl" aria-hidden="true">🛒</div>
            <h2 className="mt-5 text-2xl font-black tracking-tight">A beautiful find is waiting.</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#6B7775]">Your cart is empty. Explore GoldMart and add something you love.</p>
            <Link href="/shop" className="mt-6 inline-flex rounded-full bg-[#284C50] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#3A7872]">Discover products ↗</Link>
          </section>
        ) : (
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_350px]">
            <section aria-label="Cart products" className="min-w-0 space-y-4">
              {cart.map((item) => {
                const itemCurrency = normalizeCurrency(item.currency);
                return (
                  <article key={item.id} className="flex gap-3 rounded-[23px] border border-[#E2E9E5] bg-white p-4 shadow-[0_5px_18px_rgba(25,45,48,0.045)] transition hover:border-[#B9D3C7] hover:shadow-md sm:gap-5 sm:p-5">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[17px] bg-[#F1F3F0] sm:h-28 sm:w-28">
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="(max-width: 640px) 80px, 112px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#96794F]">GoldMart selection</p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-extrabold leading-5 sm:text-base">{item.name}</h3>
                      <p className="mt-2 text-base font-black text-[#316D68]">{formatPrice(getPrice(item.price), itemCurrency)}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-[#DDE9E2] bg-[#F8FBF9] p-1">
                          <button type="button" aria-label={`Decrease quantity for ${item.name}`}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-8 w-8 rounded-lg bg-white text-lg font-black text-[#315855] transition hover:bg-[#E5F2EA]">−</button>
                          <span className="min-w-5 text-center text-sm font-bold" aria-label={`Quantity ${item.quantity}`}>{item.quantity}</span>
                          <button type="button" aria-label={`Increase quantity for ${item.name}`}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8 rounded-lg bg-white text-lg font-black text-[#315855] transition hover:bg-[#E5F2EA]">+</button>
                        </div>
                        <button type="button" onClick={() => removeFromCart(item.id)}
                          className="rounded-full border border-[#F0D7D9] bg-[#FFF8F8] px-3 py-2 text-xs font-bold text-[#A35E67] transition hover:bg-[#FBE9E9]">Remove</button>
                      </div>
                    </div>
                  </article>
                );
              })}
              <button type="button" onClick={clearCart} className="rounded-full border border-[#F0D7D9] bg-white px-4 py-2.5 text-xs font-bold text-[#A35E67] transition hover:bg-[#FFF5F5]">Clear Cart</button>
            </section>
            <aside className="h-fit overflow-hidden rounded-[24px] border border-[#DDE6E0] bg-white p-6 shadow-[0_10px_30px_rgba(25,45,48,0.065)] lg:sticky lg:top-24">
              <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E3F2EB] text-2xl" aria-hidden="true">✦</span>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#987647]">At a glance</p><h2 className="text-xl font-black">Order Summary</h2></div>
              </div>
              <div className="mt-7 flex justify-between text-sm"><span className="text-[#74807B]">Items</span><span className="font-bold">{itemCount}</span></div>
              <div className="mt-4 flex justify-between text-sm"><span className="text-[#74807B]">Subtotal</span>
                <span className="font-black">{currency ? formatPrice(total) : "Multiple currencies"}</span></div>
              <div className="mt-4 flex justify-between text-sm"><span className="text-[#74807B]">Delivery</span><span className="font-bold">Free</span></div>
              <div className="my-6 border-t border-[#E6ECE7]" />
              <div className="flex justify-between gap-3 text-lg"><span className="font-black">Total</span>
                <span className="text-right font-black text-[#2C756A]">{currency ? formatPrice(total) : "Calculated per currency"}</span></div>
              <Link href="/checkout" className="mt-6 block rounded-2xl bg-[#274D50] px-4 py-4 text-center text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(40,92,89,0.17)] transition hover:bg-[#35746E]">Proceed to Checkout ↗</Link>
              <p className="mt-4 text-center text-[11px] leading-5 text-[#697773]">Final payment details are confirmed at checkout.</p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
