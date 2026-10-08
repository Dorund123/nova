"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState<"Boy" | "Girl" | "">("");

  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function getPasswordStrength() {
    let score = 0;

    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return score;
  }

  const passwordStrength = getPasswordStrength();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const cleanUsername = username.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 3) {
      setMessage("Username must contain at least 3 characters.");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setMessage(
        "Username can only contain English letters, numbers and underscores."
      );
      return;
    }

    if (cleanDisplayName.length < 2) {
      setMessage("Please enter your display name.");
      return;
    }

    if (!gender) {
      setMessage("Please select your gender.");
      return;
    }

    if (!cleanEmail) {
      setMessage("Please enter your email.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setMessage("Please agree to Nova's Terms of Service.");
      return;
    }

    setLoading(true);

    try {
      const { data: existingProfile, error: usernameCheckError } =
        await supabase
          .from("profiles")
          .select("id")
          .eq("username", cleanUsername)
          .maybeSingle();

      if (usernameCheckError) {
        console.error("Username check error:", usernameCheckError);
        setMessage(usernameCheckError.message);
        setLoading(false);
        return;
      }

      if (existingProfile) {
        setMessage("This username is already taken.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
            display_name: cleanDisplayName,
            gender,
          },
        },
      });

      if (error) {
        console.error("Signup error:", error);
        setMessage(error.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setMessage("Account creation failed.");
        setLoading(false);
        return;
      }

      if (!data.session) {
        setMessage(
          "🎉 Account created! Please check your email to confirm your account."
        );

        setTimeout(() => {
          router.push("/login");
        }, 1800);

        return;
      }

      setMessage("🎉 Your Nova account has been created!");

      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-md">
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
            Create your Nova account
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <h1 className="text-2xl font-bold">Create your account</h1>

          <p className="mt-2 text-sm text-gray-400">
            Join Nova and start your gaming journey.
          </p>

          <form onSubmit={handleSignup} className="mt-7 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="nova_player"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Display Name
              </label>

              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nova Player"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Gender
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender("Boy")}
                  className={`rounded-xl border px-4 py-3 ${
                    gender === "Boy"
                      ? "border-blue-500 bg-blue-500/20"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  Boy
                </button>

                <button
                  type="button"
                  onClick={() => setGender("Girl")}
                  className={`rounded-xl border px-4 py-3 ${
                    gender === "Girl"
                      ? "border-pink-500 bg-pink-500/20"
                      : "border-white/10 bg-black/20"
                  }`}
                >
                  Girl
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 pr-16 text-white outline-none focus:border-blue-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {password && (
                <p className="mt-2 text-xs text-gray-400">
                  Password strength: {passwordStrength}/5
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Confirm Password
              </label>

              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <label className="flex items-start gap-3 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1"
              />

              <span>I agree to Nova's Terms of Service.</span>
            </label>

            {message && (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-semibold transition hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-gray-600">OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              Already have a Nova account?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="font-semibold text-blue-400 hover:text-blue-300"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} Nova. All rights reserved.
        </p>
      </div>
    </main>
  );
}