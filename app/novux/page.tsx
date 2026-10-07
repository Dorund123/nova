"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PayPalScriptProvider,
  PayPalButtons,
} from "@paypal/react-paypal-js";
import { supabase } from ".././lib/supabase";

type Package = {
  novux: number;
  price: number;
};

const packageData: Package = {
  novux: 1500,
  price: 9,
};

// შენი PayPal Sandbox Client ID
const PAYPAL_CLIENT_ID =
  "BAAr6qBvrQS_-Rmt50X1_nca_K3W_8_18CbzoW32QjHygyxJp1W3ALkTPaLMfGa_Wrzezq9Z9Umuxa_dtM";

// =========================================
// IMPORTANT
// =========================================
// შენი PayPal route უნდა იყოს:
//
// app/api/paypal/route.ts
//
// ამიტომ ყველა request მიდის:
// /api/paypal
//
const PAYPAL_API_ROUTE = "/api/paypal";

export default function NovuxPage() {
  const router = useRouter();

  const [balance, setBalance] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

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
  // SAFE JSON RESPONSE
  // =========================================
  async function readApiResponse(
    response: Response,
    defaultMessage: string
  ) {
    const text = await response.text();

    let data: any = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      console.error(
        "PayPal API returned non-JSON response:",
        text.substring(0, 500)
      );

      throw new Error(
        `${defaultMessage} Server returned an invalid response (${response.status}). Check app/api/paypal/route.ts.`
      );
    }

    return data;
  }

  // =========================================
  // OPEN PAYPAL CHECKOUT
  // =========================================
  async function openCheckout() {
    setPaymentError("");

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login");
        return;
      }

      setShowCheckout(true);
    } catch (error) {
      console.error("Open checkout error:", error);

      setPaymentError(
        error instanceof Error
          ? error.message
          : "Could not open PayPal checkout."
      );
    }
  }

  // =========================================
  // CREATE PAYPAL ORDER
  // =========================================
  async function createPayPalOrder() {
    setPaymentLoading(true);
    setPaymentError("");

    try {
      const response = await fetch(PAYPAL_API_ROUTE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create-order",
          novux: packageData.novux,
          price: packageData.price,
        }),
      });

      const data = await readApiResponse(
        response,
        "Could not create PayPal order."
      );

      if (!response.ok || !data.success || !data.orderID) {
        throw new Error(
          data?.error || "Could not create PayPal order."
        );
      }

      return data.orderID;
    } catch (error) {
      console.error("Create PayPal order error:", error);

      setPaymentError(
        error instanceof Error
          ? error.message
          : "Could not start PayPal checkout."
      );

      throw error;
    } finally {
      setPaymentLoading(false);
    }
  }

  // =========================================
  // CAPTURE PAYPAL ORDER
  // =========================================
  async function capturePayPalOrder(orderID: string) {
    setPaymentLoading(true);
    setPaymentError("");

    try {
      // Get logged-in user session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "Your login session expired. Please log in again."
        );
      }

      const response = await fetch(PAYPAL_API_ROUTE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "capture-order",
          orderID,
        }),
      });

      const data = await readApiResponse(
        response,
        "Payment could not be completed."
      );

      if (!response.ok || !data.success) {
        throw new Error(
          data?.error || "Payment could not be completed."
        );
      }

      // =========================================
      // PAYMENT SUCCESS
      // =========================================

      setShowCheckout(false);
      setShowSuccess(true);
      setPaymentError("");

      // Reload balance from Supabase
      await loadBalance();

      // Hide success notification
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);

      return data;
    } catch (error) {
      console.error("Capture PayPal order error:", error);

      setPaymentError(
        error instanceof Error
          ? error.message
          : "Payment could not be completed."
      );

      throw error;
    } finally {
      setPaymentLoading(false);
    }
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CLIENT_ID,
        currency: "USD",
        intent: "capture",
      }}
    >
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
                    Payment Successful
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

          {/* =========================================
              HERO
          ========================================= */}
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

              {/* =========================================
                  BUY BUTTON
              ========================================= */}
              {!showCheckout && (
                <button
                  onClick={openCheckout}
                  disabled={paymentLoading}
                  className="mt-7 w-full rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-lg transition duration-200 hover:scale-[1.02] hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {paymentLoading
                    ? "Opening PayPal..."
                    : "Buy 1,500 Novux"}
                </button>
              )}

              {/* =========================================
                  PAYPAL CHECKOUT
              ========================================= */}
              {showCheckout && (
                <div className="mt-7 rounded-2xl border border-gray-200 bg-gray-50 p-4">

                  {/* CHECKOUT HEADER */}
                  <div className="mb-4">

                    <div className="flex items-center justify-between">

                      <div>

                        <h3 className="font-black text-gray-900">
                          Checkout
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          1,500 Novux · $9 USD
                        </p>

                      </div>

                      <button
                        onClick={() => {
                          if (!paymentLoading) {
                            setShowCheckout(false);
                            setPaymentError("");
                          }
                        }}
                        disabled={paymentLoading}
                        className="rounded-lg px-3 py-1 text-gray-400 transition hover:bg-gray-200 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ×
                      </button>

                    </div>

                  </div>

                  {/* ERROR */}
                  {paymentError && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">

                      <div className="flex items-start gap-2">

                        <span className="mt-0.5">
                          ⚠️
                        </span>

                        <p className="leading-5">
                          {paymentError}
                        </p>

                      </div>

                    </div>
                  )}

                  {/* PAYPAL */}
                  <div className="rounded-xl bg-white p-3">

                    <PayPalButtons
                      style={{
                        layout: "vertical",
                        shape: "rect",
                        label: "paypal",
                        height: 48,
                      }}
                      disabled={paymentLoading}
                      createOrder={async () => {
                        return await createPayPalOrder();
                      }}
                      onApprove={async (data) => {
                        await capturePayPalOrder(data.orderID);
                      }}
                      onCancel={() => {
                        setPaymentError(
                          "Payment was cancelled."
                        );
                      }}
                      onError={(error) => {
                        console.error(
                          "PayPal button error:",
                          error
                        );

                        setPaymentError(
                          "PayPal checkout could not be completed."
                        );
                      }}
                    />

                  </div>

                  {/* SECURITY */}
                  <p className="mt-3 text-center text-[11px] leading-5 text-gray-400">
                    Secure checkout powered by PayPal.
                    Your card information is handled by PayPal.
                  </p>

                </div>
              )}

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
    </PayPalScriptProvider>
  );
}