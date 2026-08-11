"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "https://goldmart-backend-yoxc.onrender.com";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"customer" | "seller">("customer");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Registration failed.");
      }

      // Save authentication information.
      localStorage.setItem("goldmart_token", data.token);
      localStorage.setItem(
        "goldmart_user",
        JSON.stringify(data.user)
      );

      // Send the user to the correct area.
      if (data.user.role === "seller") {
        router.push("/seller");
      } else {
        router.push("/");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect to GoldMart."
      );
    } finally {
      setLoading(false);
    }
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
            Join GoldMart and start shopping or selling.
          </p>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >

            {/* ACCOUNT TYPE */}
            <div>
              <label className="mb-3 block text-sm font-bold">
                Account Type
              </label>

              <div className="grid grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() => setRole("customer")}
                  className={`rounded-xl border p-4 text-left transition ${
                    role === "customer"
                      ? "border-[#D4AF37] bg-yellow-50 ring-2 ring-[#D4AF37]"
                      : "border-gray-200 hover:border-[#D4AF37]"
                  }`}
                >
                  <div className="text-2xl">🛒</div>

                  <p className="mt-2 font-black">
                    Customer
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Shop on GoldMart
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("seller")}
                  className={`rounded-xl border p-4 text-left transition ${
                    role === "seller"
                      ? "border-[#D4AF37] bg-yellow-50 ring-2 ring-[#D4AF37]"
                      : "border-gray-200 hover:border-[#D4AF37]"
                  }`}
                >
                  <div className="text-2xl">🏪</div>

                  <p className="mt-2 font-black">
                    Seller
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Sell on GoldMart
                  </p>
                </button>

              </div>
            </div>

            {/* NAME */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Full Name
              </label>

              <input
                type="text"
                required
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Your full name"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Email
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Password
              </label>

              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="At least 6 characters"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Confirm Password
              </label>

              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Enter password again"
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black py-3 font-bold text-white transition hover:bg-[#D4AF37] hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating Account..."
                : role === "seller"
                ? "Create Seller Account"
                : "Create Customer Account"}
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
