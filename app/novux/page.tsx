"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from ".././lib/supabase";

type Package = {
  novux: number;
  price: number;
  popular?: boolean;
};

const packages: Package[] = [
  {
    novux: 300,
    price: 2,
  },
  {
    novux: 750,
    price: 5,
  },
  {
    novux: 1500,
    price: 9,
    popular: true,
  },
  {
    novux: 3000,
    price: 17,
  },
  {
    novux: 7500,
    price: 40,
  },
  {
    novux: 15000,
    price: 75,
  },
];

export default function NovuxPage() {
  const router = useRouter();

  const [balance, setBalance] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBalance();
  }, []);

  async function loadBalance() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("novux_balance")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Balance error:", error);
      setLoading(false);
      return;
    }

    setBalance(data.novux_balance);
    setLoading(false);
  }

  function handleBuy(pack: Package) {
    setSelectedPackage(pack);
  }

  function closeModal() {
    setSelectedPackage(null);
  }

  return (
    <main className="min-h-screen bg-[#f3f3f3] text-[#191919]">
      {/* SUCCESS NOTIFICATION */}
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
                  Your Novux has been added to your balance.
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

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <button
            onClick={() => router.push("/")}
            className="text-3xl font-black tracking-tight"
          >
            <span className="text-black">N</span>
            <span className="text-blue-600">ova</span>
          </button>

          <div className="flex items-center gap-2">
            {/* BALANCE */}
            <div className="rounded-xl bg-blue-50 px-3 py-2">
              <span className="mr-1">💎</span>

              <span className="text-sm font-black text-blue-600">
                {loading
                  ? "..."
                  : balance?.toLocaleString() ?? "0"}
              </span>
            </div>

            <button
              onClick={() => router.push("/")}
              className="rounded-xl px-3 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-100 hover:text-black sm:px-4"
            >
              <span className="hidden sm:inline">← Home</span>
              <span className="sm:hidden">←</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
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
              Get Novux and use them across Nova for games,
              items, avatars and more.
            </p>

            <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <span className="text-2xl">💎</span>

              <div>
                <p className="text-xs font-bold text-blue-100">
                  Current Balance
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

        {/* PACKAGES */}
        <div className="mt-10">
          <div className="mb-6">
            <h2 className="text-2xl font-black sm:text-3xl">
              Choose your package
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select the amount of Novux you want.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pack) => (
              <div
                key={pack.novux}
                className={`group relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                  pack.popular
                    ? "ring-2 ring-blue-500"
                    : "ring-1 ring-gray-100"
                }`}
              >
                {/* POPULAR */}
                {pack.popular && (
                  <div className="absolute right-4 top-4 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                    Popular
                  </div>
                )}

                {/* ICON */}
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl transition duration-300 group-hover:scale-110 group-hover:rotate-3">
                  💎
                </div>

                {/* AMOUNT */}
                <div className="mt-6">
                  <h3 className="text-3xl font-black">
                    {pack.novux.toLocaleString()}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-gray-400">
                    Novux
                  </p>
                </div>

                {/* PRICE */}
                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-black">
                      ${pack.price}
                    </span>

                    <p className="mt-1 text-xs text-gray-400">
                      One-time purchase
                    </p>
                  </div>

                  <button
                    onClick={() => handleBuy(pack)}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-md transition duration-200 hover:scale-105 hover:bg-blue-700 active:scale-95"
                  >
                    Buy
                  </button>
                </div>

                {/* HOVER LINE */}
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-blue-600 transition-all duration-300 group-hover:w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* SECURITY */}
        <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-xl">
              🛡️
            </div>

            <div>
              <h3 className="font-black">
                Secure purchases
              </h3>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Payments are verified on Nova's server before
                Novux is added to your account.
              </p>
            </div>
          </div>
        </div>

        {/* INFO */}
        <div className="mt-5 pb-10 text-center text-xs text-gray-400">
          Novux purchases are securely processed and linked to
          your Nova account.
        </div>
      </section>

      {/* PURCHASE MODAL */}
      {selectedPackage && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md animate-[modalIn_.25s_ease-out] rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-4xl">
                💎
              </div>

              <h2 className="mt-5 text-2xl font-black">
                Buy Novux
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                You selected{" "}
                <strong>
                  {selectedPackage.novux.toLocaleString()} Novux
                </strong>
              </p>
            </div>

            <div className="mt-6 rounded-2xl bg-gray-50 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500">
                  Novux
                </span>

                <span className="font-black">
                  💎{" "}
                  {selectedPackage.novux.toLocaleString()}
                </span>
              </div>

              <div className="my-4 border-t border-gray-200" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500">
                  Price
                </span>

                <span className="text-xl font-black">
                  ${selectedPackage.price}
                </span>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-xs leading-5 text-yellow-800">
              🛡️ Payment must be verified by the Nova
              server before Novux can be added.
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-black text-gray-600 transition hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  closeModal();

                  /*
                    IMPORTANT:
                    რეალური გადახდის შემდეგ აქ უნდა
                    გამოვიძახოთ server API.
                  */

                  setTimeout(() => {
                    setShowSuccess(true);
                  }, 300);
                }}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

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

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }

          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </main>
  );
}