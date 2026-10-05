"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setMessage("Please enter your email address.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      cleanEmail,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Password reset email sent! Check your inbox.");
    setLoading(false);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 text-white">

      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">

        <div className="mb-8 text-center">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-4xl font-black"
          >
            <span className="text-white">N</span>
            <span className="text-blue-500">ova</span>
          </button>

          <p className="mt-3 text-sm text-gray-400">
            Reset your Nova password
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">

          <h1 className="text-2xl font-bold">
            Reset Password
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Enter your email and we'll send you a password reset link.
          </p>

          <form
            onSubmit={handleReset}
            className="mt-7 space-y-5"
          >

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-200">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {message && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  message.includes("sent")
                    ? "border-green-500/20 bg-green-500/10 text-green-400"
                    : "border-red-500/20 bg-red-500/10 text-red-400"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

          </form>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mt-6 w-full text-center text-sm font-semibold text-blue-400 transition hover:text-blue-300"
          >
            ← Back to Login
          </button>

        </div>
      </div>
    </main>
  );
}