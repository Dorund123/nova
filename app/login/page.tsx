"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setMessage("Welcome back! 🎉");

      setTimeout(() => {
        router.push("/profile");
      }, 700);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      {/* Stars */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute left-[10%] top-[15%] h-1 w-1 rounded-full bg-white" />
        <div className="absolute left-[25%] top-[30%] h-1 w-1 rounded-full bg-white" />
        <div className="absolute left-[70%] top-[20%] h-1 w-1 rounded-full bg-white" />
        <div className="absolute left-[85%] top-[40%] h-1 w-1 rounded-full bg-white" />
        <div className="absolute left-[15%] top-[75%] h-1 w-1 rounded-full bg-white" />
        <div className="absolute left-[80%] top-[80%] h-1 w-1 rounded-full bg-white" />
        <div className="absolute left-[50%] top-[10%] h-1 w-1 rounded-full bg-white" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">

        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="mb-8 text-center">
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="text-4xl font-black tracking-tight transition hover:scale-105"
            >
              <span className="text-white">N</span>
              <span className="text-blue-500">ova</span>
            </button>

            <p className="mt-3 text-sm text-gray-400">
              Welcome back to Nova
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">

            <div className="mb-7">
              <h1 className="text-2xl font-bold">
                Sign in to your account
              </h1>

              <p className="mt-2 text-sm text-gray-400">
                Enter your account details below.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">

              {/* Email */}
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
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Password */}
              <div>

                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-200">
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={() => router.push("/forgot-password")}
                    className="text-xs font-medium text-blue-400 transition hover:text-blue-300 hover:underline"
                  >
                    Reset Password
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 pr-16 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-gray-400 transition hover:bg-white/5 hover:text-white"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Message */}
              {message && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    message.includes("Welcome")
                      ? "border-green-500/20 bg-green-500/10 text-green-400"
                      : "border-red-500/20 bg-red-500/10 text-red-400"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* Login */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-gray-600">OR</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Create Account */}
            <div className="text-center">
              <p className="text-sm text-gray-400">
                Don't have a Nova account?{" "}

                <button
                  type="button"
                  onClick={() => router.push("/signup")}
                  className="font-semibold text-blue-400 transition hover:text-blue-300 hover:underline"
                >
                  Create Account
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} Nova. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}