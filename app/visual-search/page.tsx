"use client";

import Link from "next/link";
import { useRef, useState } from "react";

export default function VisualSearchPage() {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [image, setImage] =
    useState<string | null>(null);

  function chooseImage() {
    fileInputRef.current?.click();
  }

  function handleImage(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    const imageUrl =
      URL.createObjectURL(file);

    setImage(imageUrl);
  }

  return (
    <main className="min-h-screen bg-white text-black">

      {/* HEADER */}
      <header className="border-b border-black/10 bg-white">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">

          <Link
            href="/"
            className="text-2xl font-black"
          >
            Gold
            <span className="text-[#D4AF37]">
              Mart
            </span>
          </Link>

          <Link
            href="/shop"
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-bold hover:border-[#D4AF37]"
          >
            Shop
          </Link>

        </div>

      </header>

      {/* MAIN */}
      <section className="mx-auto max-w-2xl px-4 py-12 text-center">

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-black text-4xl">
          📷
        </div>

        <h1 className="mt-6 text-3xl font-black sm:text-4xl">
          Visual Search
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
          Take a photo or choose a product
          image to search GoldMart.
        </p>

        {/* HIDDEN FILE INPUT */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImage}
          className="hidden"
        />

        {!image ? (
          <button
            type="button"
            onClick={chooseImage}
            className="mt-8 rounded-full bg-gradient-to-r from-[#9A7617] via-[#D4AF37] to-[#F5D76E] px-8 py-4 font-black text-black shadow-lg transition hover:scale-[1.02]"
          >
            📷 Take Photo / Choose Image
          </button>
        ) : (
          <div className="mt-8">

            {/* IMAGE PREVIEW */}
            <div className="overflow-hidden rounded-3xl border border-black/10 bg-gray-50">

              <img
                src={image}
                alt="Selected product"
                className="mx-auto max-h-[450px] w-full object-contain"
              />

            </div>

            {/* ACTIONS */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">

              <button
                type="button"
                onClick={chooseImage}
                className="rounded-full border border-black/10 px-6 py-3 text-sm font-black hover:border-[#D4AF37]"
              >
                📷 Choose Another
              </button>

              <Link
                href="/shop"
                className="rounded-full bg-black px-6 py-3 text-sm font-black text-white hover:bg-[#D4AF37] hover:text-black"
              >
                🔎 Browse Products
              </Link>

            </div>

          </div>
        )}

        {/* INFORMATION */}
        <div className="mt-10 rounded-3xl border border-[#D4AF37]/30 bg-[#F8F7F3] p-6 text-left">

          <h2 className="font-black">
            ✦ How it works
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Upload a product photo and
            GoldMart will use it as the
            starting point for visual
            product discovery.
          </p>

        </div>

      </section>

    </main>
  );
        }
