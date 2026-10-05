"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from ".././lib/supabase";

type Package = {
  novux: number;
  price: number;
};

const packageData: Package = {
  novux: 1500,
  price: 9,
};

export default function NovuxPage() {
  const router = useRouter();

  const [balance, setBalance] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingNovux, setAddingNovux] = useState(false);

  // =========================================
  // LOAD USER BALANCE
  // =========================================
  useEffect(() => {
    loadBalance();
  }, []);

  async function loadBalance() {
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("User error:", userError);
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, novux_balance")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        return;
      }

      setBalance(Number(profile?.novux_balance ?? 0));
    } catch (error) {
      console.error("Load balance error:", error);
    } finally {
      setLoading(false);
    }
  }

  // =========================================
  // BUY 1,500 NOVUX
  // =========================================
  async function buy1500Novux() {
    if (addingNovux) return;

    setAddingNovux(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        alert(
          `Could not verify your account.\n\n${userError.message}`
        );
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      // Get current balance
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("novux_balance")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);

        alert(
          `Could not load your balance.\n\n${profileError.message}`
        );

        return;
      }

      const currentBalance = Number(
        profile?.novux_balance ?? 0
      );

      // Add exactly 1,500
      const newBalance = currentBalance + 1500;

      // Save balance
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          novux_balance: newBalance,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Novux update error:", updateError);

        alert(
          `Could not add 1,500 Novux.\n\nSupabase error:\n${updateError.message}`
        );

        return;
      }

      // Update screen
      setBalance(newBalance);
      setShowSuccess(true);

      console.log("Novux purchase successful.");
      console.log("Old balance:", currentBalance);
      console.log("Added:", 1500);
      console.log("New balance:", newBalance);

      setTimeout(() => {
        setShowSuccess(false);
      }, 4000);
    } catch (error) {
      console.error("Novux error:", error);

      alert(
        "Something went wrong while adding Novux."
      );
    } finally {
      setAddingNovux(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f3f3] text-[#191919]">

      {/* =========================================
          SUCCESS
      ========================================= */}
      {showSuccess && (
        <div className="fixed right-4 top-20 z-[100] w-[calc(100%-32px)] max-w-sm animate-[slideIn_.35s_ease-out]">
          <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-2xl">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-xl">
                ✓
              </div>

              <div className="flex-1">
                <h3 className="font-black text-gray-900">
                  Purchase Successful
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  1,500 Novux has been added to your account.
                </p>
              </div>

              <button
                onClick={() => setShowSuccess(false)}
                className="text-gray-400 hover:text-black"
              >
                ×
              </button>

            </div>

          </div>
        </div>
      )}

      {/* =========================================
          HEADER
      ========================================= */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">

          <button
            onClick={() => router.push("/")}
            className="text-3xl font-black tracking-tight"
          >
            <span className="text-black">
              N
            </span>

            <span className="text-blue-600">
              ova
            </span>
          </button>

          <div className="flex items-center gap-2">

            {/* BALANCE */}
            <div className="rounded-xl bg-blue-50 px-3 py-2">

              <span className="mr-1">
                💎
              </span>

              <span className="text-sm font-black text-blue-600">
                {loading
                  ? "..."
                  : balance?.toLocaleString() ?? "0"}
              </span>

            </div>

            {/* HOME */}
            <button
              onClick={() => router.push("/")}
              className="rounded-xl px-3 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-100 hover:text-black sm:px-4"
            >
              <span className="hidden sm:inline">
                ← Home
              </span>

              <span className="sm:hidden">
                ←
              </span>
            </button>

          </div>

        </div>

      </header>

      {/* =========================================
          CONTENT
      ========================================= */}
      <section className="mx-auto max-w-5xl px-4 py-6 sm:py-10">

        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-purple-700 p-6 text-white shadow-xl sm:p-10">

          <div className="relative z-10">

            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black backdrop-blur">
              💎 NOVUX STORE
            </div>

            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
              Buy Novux
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
              Get 1,500 Novux for your Nova account.
              Use Novux across Nova for games, items,
              avatars and more.
            </p>

            {/* BALANCE */}
            <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">

              <span className="text-2xl">
                💎
              </span>

              <div>

                <p className="text-xs font-bold text-blue-100">
                  Your Balance
                </p>

                <p className="text-xl font-black">
                  {loading
                    ? "..."
                    : `${balance?.toLocaleString() ?? 0} Novux`}
                </p>

              </div>

            </div>

          </div>

          {/* DECORATION */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

          <div className="absolute -bottom-20 right-20 h-48 w-48 rounded-full bg-purple-400/20 blur-3xl" />

        </div>

        {/* =========================================
            PACKAGE
        ========================================= */}
        <div className="mx-auto mt-10 max-w-md">

          <div className="mb-6 text-center">

            <h2 className="text-2xl font-black sm:text-3xl">
              Get Novux
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              One simple package.
            </p>

          </div>

          <div className="group relative overflow-hidden rounded-3xl bg-white p-7 shadow-lg ring-2 ring-blue-500 transition duration-300 hover:-translate-y-2 hover:shadow-2xl sm:p-8">

            {/* AVAILABLE */}
            <div className="absolute right-5 top-5 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
              Available
            </div>

            {/* ICON */}
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-4xl transition duration-300 group-hover:scale-110">
              💎
            </div>

            {/* AMOUNT */}
            <div className="mt-7">

              <h3 className="text-4xl font-black">
                {packageData.novux.toLocaleString()}
              </h3>

              <p className="mt-1 text-sm font-semibold text-gray-400">
                Novux
              </p>

            </div>

            {/* PRICE */}
            <div className="mt-7">

              <span className="text-4xl font-black">
                ${packageData.price}
              </span>

              <p className="mt-1 text-xs text-gray-400">
                One-time purchase
              </p>

            </div>

            {/* BUY */}
            <button
              onClick={buy1500Novux}
              disabled={addingNovux}
              className="mt-7 w-full rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-lg transition duration-200 hover:scale-[1.02] hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {addingNovux
                ? "Adding 1,500 Novux..."
                : "Buy 1,500 Novux"}
            </button>

            {/* BOTTOM LINE */}
            <div className="absolute bottom-0 left-0 h-1 w-full bg-blue-600" />

          </div>

        </div>

        {/* =========================================
            INFO
        ========================================= */}
        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-xl">
              🛡️
            </div>

            <div>

              <h3 className="font-black">
                Nova Novux
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                New accounts start with 0 Novux.
                Buy 1,500 Novux to add them to your account.
              </p>

            </div>

          </div>

        </div>

        {/* INFO */}
        <div className="mt-5 pb-10 text-center text-xs text-gray-400">
          1,500 Novux · ${packageData.price}
        </div>

      </section>

      {/* =========================================
          ANIMATION
      ========================================= */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(30px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

    </main>
  );
}