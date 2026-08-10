"use client";

import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    alert(
      "Account registration will be connected to GoldMart's backend."
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">

        <Link
          href="/"
          className="mb-8 block text-center text-3xl font-black"
        >
          Gold<span className="text-[#D4AF37]">Mart</span>
        </Link>

        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">

          <h1 className="text-3xl font-black">
            Create Account
          </h1>

          <p className="mt-2 text-gray-500">
            Join GoldMart and start shopping.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >

            <div>
              <label className="mb-2 block text-sm font-bold">
                Full Name
              </label>

              <input
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your full name"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Email
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Password
              </label>

              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Confirm Password
              </label>

              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Enter password again"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-black py-3 font-bold text-white transition hover:bg-[#D4AF37] hover:text-black"
            >
              Create Account
            </button>

          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-[#A67C00]"
            >
              Sign In
            </Link>
          </p>

        </div>
      </div>
    </main>
  );
}
