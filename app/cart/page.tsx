"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "../../components/CartProvider";

function getPrice(price: string) {
  return Number(price.replace(/[^0-9.]/g, ""));
}

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  const total = cart.reduce(
    (sum, item) => sum + getPrice(item.price) * item.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-gray-50 text-black">

      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <Link href="/" className="text-2xl font-black">
            Gold<span className="text-[#D4AF37]">Mart</span>
          </Link>

          <Link
            href="/shop"
            className="rounded-full border px-5 py-2 text-sm font-bold"
          >
            Continue Shopping
          </Link>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-6xl px-4 py-10">

        <h1 className="text-3xl font-black sm:text-4xl">
          Your Cart
        </h1>

        {cart.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-white p-10 text-center shadow-sm">

            <div className="text-6xl">🛒</div>

            <h2 className="mt-5 text-2xl font-black">
              Your cart is empty
            </h2>

            <p className="mt-2 text-gray-500">
              Add some products to your cart and they will appear here.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-block rounded-full bg-black px-7 py-3 font-bold text-white"
            >
              Start Shopping
            </Link>

          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_350px]">

            {/* CART ITEMS */}
            <section className="space-y-4">

              {cart.map((item) => (
                <article
                  key={item.id}
                  className="flex gap-4 rounded-2xl border bg-white p-4"
                >

                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>

                  <div className="min-w-0 flex-1">

                    <h2 className="font-bold">
                      {item.name}
                    </h2>

                    <p className="mt-1 font-black text-[#A67C00]">
                      {item.price}
                    </p>

                    <div className="mt-4 flex items-center gap-3">

                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="h-9 w-9 rounded-lg border font-bold"
                      >
                        −
                      </button>

                      <span className="min-w-5 text-center font-bold">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="h-9 w-9 rounded-lg border font-bold"
                      >
                        +
                      </button>

                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="self-start text-sm font-bold text-red-500"
                  >
                    Remove
                  </button>

                </article>
              ))}

              <button
                onClick={clearCart}
                className="text-sm font-bold text-red-500"
              >
                Clear Cart
              </button>

            </section>

            {/* SUMMARY */}
            <aside className="h-fit rounded-2xl border bg-white p-6">

              <h2 className="text-xl font-black">
                Order Summary
              </h2>

              <div className="mt-6 flex justify-between text-sm">
                <span className="text-gray-500">
                  Items
                </span>

                <span className="font-bold">
                  {cart.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  )}
                </span>
              </div>

              <div className="mt-4 flex justify-between">
                <span className="text-gray-500">
                  Subtotal
                </span>

                <span className="font-black">
                  ${total.toFixed(2)}
                </span>
              </div>

              <div className="my-6 border-t" />

              <div className="flex justify-between text-lg">
                <span className="font-bold">
                  Total
                </span>

                <span className="font-black text-[#A67C00]">
                  ${total.toFixed(2)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="mt-6 block rounded-xl bg-black py-3 text-center font-bold text-white"
              >
                Proceed to Checkout
              </Link>

            </aside>

          </div>
        )}

      </div>
    </main>
  );
                    }
