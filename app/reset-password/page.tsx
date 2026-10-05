"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleResetPassword(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setMessage("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("You must be signed in to change your password.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Password updated successfully!");

    setPassword("");
    setConfirmPassword("");

    setTimeout(() => {
      router.push("/profile");
    }, 1500);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] px-4 text-white">
      <div className="w-full max-w-md">

        <div className="mb-8 text-center">
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="text-4xl font-black"
          >
            <span className="text-white">N</span>
            <span className="text-blue-500">ova</span>
          </button>

          <p className="mt-3 text-sm text-gray-400">
            Change your Nova password
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">

          <h1 className="text-2xl font-bold">
            Reset Password
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Create a new password for your account.
          </p>

          <form
            onSubmit={handleResetPassword}
            className="mt-7 space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-medium">
                New Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 pr-16 text-white outline-none focus:border-blue-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Confirm Password
              </label>

              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            {message && (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-semibold transition hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="mt-6 w-full text-center text-sm font-semibold text-blue-400 hover:text-blue-300"
          >
            ← Back to Profile
          </button>

        </div>
      </div>
    </main>
  );
}