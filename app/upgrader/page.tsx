"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type UpgradeResponse = {
  success?: boolean;
  won?: boolean;
  roll?: number;
  chance?: number;
  bet?: number;
  multiplier?: number;
  payout?: number;
  previousBalance?: number;
  newBalance?: number;
  balance?: number;
  error?: string;
  details?: string;
};

type HistoryItem = {
  id: number;
  won: boolean;
  roll: number;
  bet: number;
  payout: number;
};

type SpinItem = {
  value: number;
  id: number;
};

/*
============================================================
SETTINGS
============================================================
*/

const QUICK_BETS = [
  1,
  2,
  5,
  10,
  25,
  50,
  100,
];

const CHANCES = [
  50,
  25,
  20,
  10,
  5,
];

/*
Card = 110px
Gap = 8px
Total movement step = 118px
*/

const ITEM_WIDTH = 110;
const ITEM_GAP = 8;
const ITEM_STEP = ITEM_WIDTH + ITEM_GAP;

/*
Important:

We keep the target near the end of the reel.
This gives us a long case-opening animation
without ever running into empty black space.
*/

const TARGET_INDEX = 72;
const TOTAL_ITEMS = 90;

export default function UpgraderPage() {
  const router = useRouter();

  const [bet, setBet] =
    useState("2");

  const [chance, setChance] =
    useState(50);

  const [balance, setBalance] =
    useState<number>(41);

  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState<UpgradeResponse | null>(
      null
    );

  const [error, setError] =
    useState("");

  const [displayRoll, setDisplayRoll] =
    useState(0);

  const [spinOffset, setSpinOffset] =
    useState(0);

  const [history, setHistory] =
    useState<HistoryItem[]>([]);

  const [isFlashing, setIsFlashing] =
    useState(false);

  /*
  Target card gets replaced with
  the real server result before animation.
  */

  const [displayItems, setDisplayItems] =
    useState<SpinItem[]>([]);

  const animationFrame =
    useRef<number | null>(null);

  const stripViewportRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const spinOffsetRef =
    useRef(0);

  const amount = Number(bet);

  const multiplier = useMemo(() => {
    return 100 / chance;
  }, [chance]);

  const possiblePayout =
    useMemo(() => {
      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return 0;
      }

      return Math.floor(
        amount * multiplier
      );
    }, [amount, multiplier]);

  /*
  ============================================================
  GENERATE CASE ITEMS
  ============================================================
  */

  const spinItems = useMemo<SpinItem[]>(
    () => {
      const items: SpinItem[] = [];

      for (
        let i = 0;
        i < TOTAL_ITEMS;
        i++
      ) {
        const value =
          ((i * 37.731 +
            i * i * 3.217 +
            17.41) %
            100 +
            100) %
          100;

        items.push({
          id: i,
          value: Number(
            value.toFixed(2)
          ),
        });
      }

      return items;
    },
    []
  );

  /*
  ============================================================
  INITIALIZE DISPLAY ITEMS
  ============================================================
  */

  useEffect(() => {
    setDisplayItems(
      spinItems
    );
  }, [spinItems]);

  /*
  ============================================================
  LOAD BALANCE
  ============================================================
  */

  useEffect(() => {
    loadBalance();

    return () => {
      if (
        animationFrame.current
      ) {
        cancelAnimationFrame(
          animationFrame.current
        );

        animationFrame.current =
          null;
      }
    };
  }, []);

  async function loadBalance() {
    try {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from("profiles")
          .select(
            "novux_balance"
          )
          .eq("id", user.id)
          .single();

      if (error) {
        console.error(
          "BALANCE LOAD ERROR:",
          error
        );

        setError(
          "Could not load your Novux balance."
        );

        return;
      }

      setBalance(
        Number(
          data?.novux_balance ?? 0
        )
      );
    } catch (err) {
      console.error(
        "BALANCE ERROR:",
        err
      );

      setError(
        "Could not load your balance."
      );
    }
  }

  /*
  ============================================================
  CASE ANIMATION
  ============================================================

  IMPORTANT:

  The server already decided the result.

  This animation does NOT decide win/loss.

  It only visually moves the reel toward
  the server-selected target card.
  ============================================================
  */

  function animateCase(
    target: number
  ) {
    return new Promise<void>(
      (resolve) => {
        const viewport =
          stripViewportRef.current;

        if (!viewport) {
          setDisplayRoll(target);
          resolve();
          return;
        }

        /*
        Cancel previous animation
        just in case.
        */

        if (
          animationFrame.current
        ) {
          cancelAnimationFrame(
            animationFrame.current
          );

          animationFrame.current =
            null;
        }

        /*
        ========================================================
        RESET REEL
        ========================================================
        */

        spinOffsetRef.current = 0;

        setSpinOffset(0);

        /*
        Wait one frame so the browser
        actually renders the reset.
        */

        requestAnimationFrame(() => {
          const duration = 5600;

          const startTime =
            performance.now();

          const viewportWidth =
            viewport.getBoundingClientRect()
              .width;

          /*
          ======================================================
          TARGET CARD CENTER
          ======================================================
          */

          const targetItemCenter =
            TARGET_INDEX *
              ITEM_STEP +
            ITEM_WIDTH / 2;

          /*
          ======================================================
          VIEWPORT CENTER
          ======================================================
          */

          const viewportCenter =
            viewportWidth / 2;

          /*
          ======================================================
          EXACT FINAL OFFSET
          ======================================================

          This is the ONLY final position.

          No extra movement.
          No moving past target.
          No jump back.
          ======================================================
          */

          const finalOffset =
            viewportCenter -
            targetItemCenter;

          const startOffset = 0;

          /*
          ======================================================
          EASING

          Very fast at the beginning,
          then increasingly slow.
          ======================================================
          */

          function easeOutQuint(
            value: number
          ) {
            return (
              1 -
              Math.pow(
                1 - value,
                5
              )
            );
          }

          function animate(
            currentTime: number
          ) {
            const elapsed =
              currentTime -
              startTime;

            const progress =
              Math.min(
                elapsed / duration,
                1
              );

            const eased =
              easeOutQuint(
                progress
              );

            /*
            ====================================================
            MOVE REEL
            ====================================================
            */

            const offset =
              startOffset +
              (finalOffset -
                startOffset) *
                eased;

            spinOffsetRef.current =
              offset;

            setSpinOffset(
              offset
            );

            /*
            ====================================================
            DISPLAY ROLL
            ====================================================
            */

            if (progress < 0.82) {
              /*
              Fast random values.
              */

              setDisplayRoll(
                Number(
                  (
                    Math.random() *
                    100
                  ).toFixed(2)
                )
              );
            } else {
              /*
              Final 18% gradually approaches
              the real server roll.
              */

              const finishProgress =
                (progress - 0.82) /
                0.18;

              const finishEase =
                1 -
                Math.pow(
                  1 -
                    finishProgress,
                  3
                );

              const randomValue =
                Math.random() *
                100;

              const value =
                randomValue +
                (target -
                  randomValue) *
                  finishEase;

              setDisplayRoll(
                Math.max(
                  0,
                  Math.min(
                    100,
                    value
                  )
                )
              );
            }

            /*
            ====================================================
            CONTINUE
            ====================================================
            */

            if (
              progress < 1
            ) {
              animationFrame.current =
                requestAnimationFrame(
                  animate
                );

              return;
            }

            /*
            ====================================================
            FINAL POSITION
            ====================================================

            Exact target.
            This is NOT another movement.
            ====================================================
            */

            spinOffsetRef.current =
              finalOffset;

            setSpinOffset(
              finalOffset
            );

            setDisplayRoll(
              target
            );

            if (
              animationFrame.current
            ) {
              cancelAnimationFrame(
                animationFrame.current
              );

              animationFrame.current =
                null;
            }

            resolve();
          }

          animationFrame.current =
            requestAnimationFrame(
              animate
            );
        });
      }
    );
  }

  /*
  ============================================================
  PLAY
  ============================================================
  */

  async function handleUpgrade() {
    if (loading) return;

    setError("");
    setResult(null);
    setDisplayRoll(0);

    const numericBet =
      Number(bet);

    /*
    ============================================================
    VALIDATION
    ============================================================
    */

    if (
      !Number.isFinite(
        numericBet
      ) ||
      numericBet <= 0
    ) {
      setError(
        "Enter a valid Novux bet."
      );

      return;
    }

    if (
      !Number.isInteger(
        numericBet
      )
    ) {
      setError(
        "Bet must be a whole number."
      );

      return;
    }

    if (
      numericBet > balance
    ) {
      setError(
        "Not enough Novux."
      );

      return;
    }

    if (
      chance <= 0 ||
      chance >= 100
    ) {
      setError(
        "Choose a valid chance."
      );

      return;
    }

    const balanceBeforeSpin =
      balance;

    /*
    ============================================================
    OPTIMISTIC BALANCE
    ============================================================
    */

    setBalance(
      balanceBeforeSpin -
        numericBet
    );

    setLoading(true);

    try {
      /*
      ============================================================
      SESSION
      ============================================================
      */

      const {
        data: { session },
        error:
          sessionError,
      } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.error(
          "SESSION ERROR:",
          sessionError
        );

        setBalance(
          balanceBeforeSpin
        );

        setError(
          "Could not verify your session."
        );

        return;
      }

      if (
        !session?.access_token
      ) {
        setBalance(
          balanceBeforeSpin
        );

        router.replace(
          "/login"
        );

        return;
      }

      /*
      ============================================================
      SERVER DECIDES RESULT
      ============================================================
      */

      const response =
        await fetch(
          "/api/upgrader",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body: JSON.stringify({
              bet: numericBet,
              chance,
            }),
          }
        );

      let data: UpgradeResponse =
        {};

      const text =
        await response.text();

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        console.error(
          "INVALID API JSON:",
          text
        );
      }

      /*
      ============================================================
      API ERROR
      ============================================================
      */

      if (!response.ok) {
        setBalance(
          balanceBeforeSpin
        );

        if (
          response.status === 401
        ) {
          setError(
            data.details ||
              data.error ||
              "Your session expired."
          );

          await supabase.auth.signOut();

          setTimeout(() => {
            router.replace(
              "/login"
            );
          }, 1000);

          return;
        }

        setError(
          data.details ||
            data.error ||
            `Upgrader request failed (${response.status}).`
        );

        return;
      }

      /*
      ============================================================
      GAME ERROR
      ============================================================
      */

      if (!data.success) {
        setBalance(
          balanceBeforeSpin
        );

        setError(
          data.error ||
            "Upgrade failed."
        );

        return;
      }

      /*
      ============================================================
      SERVER RESULT
      ============================================================
      */

      if (
        typeof data.roll ===
        "number"
      ) {
        /*
        ========================================================
        PUT SERVER RESULT INTO TARGET CARD
        ========================================================
        */

        const nextItems =
          spinItems.map(
            (item, index) => {
              if (
                index ===
                TARGET_INDEX
              ) {
                return {
                  ...item,
                  value:
                    data.roll!,
                };
              }

              return item;
            }
          );

        /*
        Update reel BEFORE animation.
        */

        setDisplayItems(
          nextItems
        );

        /*
        Start case animation.
        */

        await animateCase(
          data.roll
        );
      }

      /*
      ============================================================
      RESULT FLASH
      ============================================================
      */

      setIsFlashing(true);

      setTimeout(() => {
        setIsFlashing(false);
      }, 1000);

      setResult(data);

      /*
      ============================================================
      SERVER BALANCE
      ============================================================
      */

      if (
        typeof data.newBalance ===
        "number"
      ) {
        setBalance(
          data.newBalance
        );
      } else {
        setBalance(
          data.won
            ? balanceBeforeSpin -
                numericBet +
                (data.payout ?? 0)
            : balanceBeforeSpin -
                numericBet
        );
      }

      /*
      ============================================================
      HISTORY
      ============================================================
      */

      setHistory(
        (previous) => [
          {
            id: Date.now(),

            won: Boolean(
              data.won
            ),

            roll:
              data.roll ?? 0,

            bet:
              data.bet ??
              numericBet,

            payout:
              data.won
                ? data.payout ?? 0
                : 0,
          },

          ...previous,
        ].slice(0, 10)
      );
    } catch (err) {
      console.error(
        "UPGRADER ERROR:",
        err
      );

      setBalance(
        balanceBeforeSpin
      );

      setError(
        "Could not connect to the Upgrader server."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
  ============================================================
  COLORS
  ============================================================
  */

  function getItemColor(
    value: number
  ) {
    return value < chance
      ? "green"
      : "red";
  }

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <main className="min-h-screen overflow-hidden bg-[#020308] text-white">

      {/* BACKGROUND */}

      <div className="pointer-events-none fixed inset-0">

        <div className="absolute left-[-300px] top-[-300px] h-[700px] w-[700px] rounded-full bg-cyan-500/10 blur-[180px]" />

        <div className="absolute bottom-[-300px] right-[-300px] h-[700px] w-[700px] rounded-full bg-purple-500/10 blur-[180px]" />

        <div
          className={`absolute left-1/2 top-1/2 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[180px] transition-all duration-700 ${
            isFlashing
              ? result?.won
                ? "bg-green-500/20"
                : "bg-red-500/20"
              : "bg-cyan-500/5"
          }`}
        />

      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}

        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <button
              onClick={() =>
                router.push("/")
              }
              className="mb-4 text-sm font-semibold text-white/40 transition hover:text-white"
            >
              ← Back to Nova
            </button>

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-xl font-black text-cyan-300 shadow-[0_0_35px_rgba(34,211,238,0.2)]">
                N
              </div>

              <div>

                <h1 className="text-3xl font-black sm:text-4xl">
                  NOVA{" "}
                  <span className="text-cyan-400">
                    UPGRADER
                  </span>
                </h1>

                <p className="text-sm text-white/35">
                  Open your chance. Beat the odds.
                </p>

              </div>

            </div>

          </div>

          {/* BALANCE */}

          <div className="rounded-2xl border border-cyan-400/15 bg-white/[0.035] px-6 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">

            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/35">
              Available Novux
            </div>

            <div className="mt-1 flex items-center gap-2">

              <div className="h-3 w-3 rotate-45 rounded-[3px] bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]" />

              <span className="text-2xl font-black text-cyan-300">
                {balance.toLocaleString()}
              </span>

            </div>

          </div>

        </header>

        {/* STATS */}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">

            <div className="text-[10px] font-black uppercase tracking-widest text-white/30">
              Win Chance
            </div>

            <div className="mt-1 text-xl font-black text-green-400">
              {chance}%
            </div>

          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">

            <div className="text-[10px] font-black uppercase tracking-widest text-white/30">
              Multiplier
            </div>

            <div className="mt-1 text-xl font-black text-cyan-400">
              x{multiplier.toFixed(2)}
            </div>

          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">

            <div className="text-[10px] font-black uppercase tracking-widest text-white/30">
              Bet
            </div>

            <div className="mt-1 text-xl font-black">
              {amount || 0}
            </div>

          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">

            <div className="text-[10px] font-black uppercase tracking-widest text-white/30">
              Payout
            </div>

            <div className="mt-1 text-xl font-black text-yellow-300">
              {possiblePayout}
            </div>

          </div>

        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">

          {/* MAIN GAME */}

          <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#070911] shadow-[0_30px_100px_rgba(0,0,0,0.65)]">

            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            <div className="p-5 sm:p-10">

              <div className="mb-8 flex items-center justify-between">

                <div>

                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                    Nova Case
                  </div>

                  <h2 className="mt-1 text-2xl font-black">
                    Open & Upgrade
                  </h2>

                </div>

                <div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-2">

                  <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />

                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                    LIVE
                  </span>

                </div>

              </div>

              {/* CASE OPENING */}

              <div className="relative">

                <div className="mb-3 flex items-center justify-between px-2">

                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/25">
                    CASE OPENING
                  </span>

                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                    {loading
                      ? "OPENING..."
                      : "READY"}
                  </span>

                </div>

                {/* CASE WINDOW */}

                <div
                  ref={
                    stripViewportRef
                  }
                  className="relative h-[190px] overflow-hidden rounded-[26px] border border-white/10 bg-[#03050a] shadow-[inset_0_0_80px_rgba(0,0,0,0.9),0_20px_60px_rgba(0,0,0,0.4)]"
                >

                  {/* LEFT MASK */}

                  <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-36 bg-gradient-to-r from-[#03050a] via-[#03050a]/90 to-transparent" />

                  {/* RIGHT MASK */}

                  <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-36 bg-gradient-to-l from-[#03050a] via-[#03050a]/90 to-transparent" />

                  {/* TOP SHINE */}

                  <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-14 bg-gradient-to-b from-white/[0.07] to-transparent" />

                  {/* BOTTOM SHINE */}

                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-10 bg-gradient-to-t from-black/60 to-transparent" />

                  {/* MOVING REEL */}

                  <div
                    className="absolute left-0 top-1/2 flex h-[145px] -translate-y-1/2 items-center gap-2 will-change-transform"
                    style={{
                      transform:
                        `translate3d(${spinOffset}px, -50%, 0)`,
                    }}
                  >

                    {displayItems.map(
                      (
                        item,
                        index
                      ) => {

                        const isTarget =
                          index ===
                          TARGET_INDEX;

                        const itemValue =
                          item.value;

                        const color =
                          getItemColor(
                            itemValue
                          );

                        return (
                          <div
                            key={
                              item.id
                            }
                            className="relative flex h-[138px] w-[110px] shrink-0 items-center justify-center"
                          >

                            <div
                              className={`relative h-[128px] w-[106px] overflow-hidden rounded-2xl border transition-all duration-300 ${
                                color ===
                                "green"
                                  ? "border-green-400/40 bg-gradient-to-b from-green-500/20 via-green-500/10 to-[#07120b] shadow-[inset_0_0_25px_rgba(34,197,94,0.08),0_0_20px_rgba(34,197,94,0.08)]"
                                  : "border-red-400/30 bg-gradient-to-b from-red-500/20 via-red-500/10 to-[#140707] shadow-[inset_0_0_25px_rgba(239,68,68,0.06)]"
                              } ${
                                isTarget
                                  ? "scale-[1.03]"
                                  : ""
                              }`}
                            >

                              {/* TOP LINE */}

                              <div
                                className={`absolute left-0 right-0 top-0 h-[3px] ${
                                  color ===
                                  "green"
                                    ? "bg-green-400"
                                    : "bg-red-500"
                                }`}
                              />

                              {/* TARGET GLOW */}

                              {isTarget && (
                                <div
                                  className={`absolute inset-0 ${
                                    color ===
                                    "green"
                                      ? "bg-green-400/[0.04]"
                                      : "bg-red-400/[0.04]"
                                  }`}
                                />
                              )}

                              {/* CONTENT */}

                              <div className="relative flex h-full flex-col items-center justify-center">

                                <div
                                  className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl border ${
                                    color ===
                                    "green"
                                      ? "border-green-400/30 bg-green-400/10 text-green-300"
                                      : "border-red-400/20 bg-red-400/10 text-red-300"
                                  }`}
                                >

                                  <span className="text-2xl font-black">
                                    {color ===
                                    "green"
                                      ? "✓"
                                      : "×"}
                                  </span>

                                </div>

                                <div
                                  className={`text-lg font-black ${
                                    color ===
                                    "green"
                                      ? "text-green-300"
                                      : "text-red-300"
                                  }`}
                                >
                                  {itemValue.toFixed(
                                    2
                                  )}
                                </div>

                                <div
                                  className={`mt-1 text-[8px] font-black uppercase tracking-[0.2em] ${
                                    color ===
                                    "green"
                                      ? "text-green-400/50"
                                      : "text-red-400/50"
                                  }`}
                                >
                                  {color ===
                                  "green"
                                    ? "WIN"
                                    : "LOSS"}
                                </div>

                              </div>

                              {/* BOTTOM GLOW */}

                              <div
                                className={`absolute bottom-0 left-1/2 h-10 w-16 -translate-x-1/2 rounded-full blur-2xl ${
                                  color ===
                                  "green"
                                    ? "bg-green-500/20"
                                    : "bg-red-500/15"
                                }`}
                              />

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>

                  {/* CENTER POINTER */}

                  <div className="pointer-events-none absolute left-1/2 top-0 z-40 h-full -translate-x-1/2">

                    {/* POINTER GLOW */}

                    <div
                      className={`absolute left-1/2 top-0 h-24 w-32 -translate-x-1/2 rounded-full blur-3xl ${
                        loading
                          ? "bg-cyan-400/30"
                          : result?.won
                            ? "bg-green-400/30"
                            : result
                              ? "bg-red-400/30"
                              : "bg-white/10"
                      }`}
                    />

                    {/* TOP TRIANGLE */}

                    <div
                      className={`absolute left-1/2 top-[-2px] h-0 w-0 -translate-x-1/2 border-l-[18px] border-r-[18px] border-t-[28px] border-l-transparent border-r-transparent ${
                        loading
                          ? "border-t-cyan-300"
                          : result?.won
                            ? "border-t-green-400"
                            : result
                              ? "border-t-red-400"
                              : "border-t-white"
                      }`}
                    />

                    {/* CENTER LINE */}

                    <div
                      className={`absolute left-1/2 top-5 h-[145px] w-[3px] -translate-x-1/2 ${
                        loading
                          ? "bg-cyan-400/80 shadow-[0_0_18px_rgba(34,211,238,0.9)]"
                          : result?.won
                            ? "bg-green-400/80 shadow-[0_0_18px_rgba(34,197,94,0.9)]"
                            : result
                              ? "bg-red-400/80 shadow-[0_0_18px_rgba(239,68,68,0.9)]"
                              : "bg-white/20"
                      }`}
                    />

                    {/* BOTTOM TRIANGLE */}

                    <div
                      className={`absolute bottom-[-2px] left-1/2 h-0 w-0 -translate-x-1/2 border-b-[28px] border-l-[18px] border-r-[18px] border-l-transparent border-r-transparent ${
                        loading
                          ? "border-b-cyan-300"
                          : result?.won
                            ? "border-b-green-400"
                            : result
                              ? "border-b-red-400"
                              : "border-b-white"
                      }`}
                    />

                  </div>

                </div>

                {/* RESULT NUMBER */}

                <div className="mt-5 text-center">

                  <div className="text-[9px] font-black uppercase tracking-[0.35em] text-white/25">
                    RESULT
                  </div>

                  <div
                    className={`mt-1 text-4xl font-black tabular-nums ${
                      loading
                        ? "text-white"
                        : result
                          ? result.won
                            ? "text-green-400"
                            : "text-red-400"
                          : "text-cyan-300"
                    }`}
                  >
                    {displayRoll.toFixed(
                      2
                    )}
                  </div>

                  <div
                    className={`mt-1 text-[9px] font-black uppercase tracking-[0.25em] ${
                      loading
                        ? "text-cyan-300/40"
                        : result
                          ? result.won
                            ? "text-green-400/60"
                            : "text-red-400/60"
                          : "text-white/20"
                    }`}
                  >
                    {loading
                      ? "OPENING CASE"
                      : result
                        ? result.won
                          ? "WIN"
                          : "LOSS"
                        : "READY"}
                  </div>

                </div>

              </div>

              {/* RESULT MESSAGE */}

              <div className="mt-8 text-center">

                {loading ? (
                  <>
                    <div className="text-3xl font-black text-white">
                      OPENING...
                    </div>

                    <div className="mt-2 text-sm text-white/30">
                      Your result is being revealed
                    </div>
                  </>
                ) : result ? (
                  <>
                    <div
                      className={`text-4xl font-black ${
                        result.won
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {result.won
                        ? "YOU WON!"
                        : "YOU LOST!"}
                    </div>

                    <div className="mt-2 text-sm text-white/35">
                      Final roll
                    </div>

                    <div
                      className={`mt-1 text-2xl font-black ${
                        result.won
                          ? "text-green-300"
                          : "text-red-300"
                      }`}
                    >
                      {result.roll?.toFixed(
                        2
                      )}
                    </div>

                    <div className="mt-3 font-black">

                      {result.won
                        ? `+${result.payout} Novux`
                        : `-${result.bet} Novux`}

                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-black text-white/15">
                      READY
                    </div>

                    <div className="mt-2 text-sm text-white/30">
                      Place your bet and open the case
                    </div>
                  </>
                )}

              </div>

              {/* ERROR */}

              {error && (
                <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm font-semibold text-red-300">
                  {error}
                </div>
              )}

              {/* OPEN BUTTON */}

              <button
                onClick={
                  handleUpgrade
                }
                disabled={loading}
                className="group relative mt-7 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 px-6 py-5 text-lg font-black text-black shadow-[0_10px_40px_rgba(34,211,238,0.2)] transition hover:scale-[1.01] hover:shadow-[0_15px_50px_rgba(34,211,238,0.35)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >

                <span className="relative z-10">
                  {loading
                    ? "OPENING..."
                    : `OPEN CASE • ${amount || 0} NOVUX`}
                </span>

                <div className="absolute inset-0 -translate-x-full bg-white/30 transition duration-700 group-hover:translate-x-full" />

              </button>

            </div>

          </section>

          {/* SIDEBAR */}

          <aside className="space-y-5">

            {/* SETTINGS */}

            <section className="rounded-[26px] border border-white/10 bg-[#070911] p-6">

              <div className="mb-6">

                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">
                  Settings
                </div>

                <h2 className="mt-1 text-xl font-black">
                  Your Bet
                </h2>

              </div>

              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-white/35">
                Novux Bet
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={bet}
                disabled={loading}
                onChange={(event) =>
                  setBet(
                    event.target.value
                  )
                }
                className="mb-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-xl font-black outline-none focus:border-cyan-400/50"
              />

              <div className="mb-7 grid grid-cols-4 gap-2">

                {QUICK_BETS.map(
                  (value) => (
                    <button
                      key={value}
                      disabled={loading}
                      onClick={() =>
                        setBet(
                          String(value)
                        )
                      }
                      className={`rounded-xl border py-2.5 text-xs font-black transition ${
                        Number(bet) ===
                        value
                          ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
                          : "border-white/5 bg-white/[0.025] text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {value}
                    </button>
                  )
                )}

              </div>

              <label className="mb-3 block text-xs font-black uppercase tracking-widest text-white/35">
                Win Chance
              </label>

              <div className="grid grid-cols-5 gap-2">

                {CHANCES.map(
                  (value) => (
                    <button
                      key={value}
                      disabled={loading}
                      onClick={() =>
                        setChance(
                          value
                        )
                      }
                      className={`rounded-xl py-3 text-xs font-black transition ${
                        chance === value
                          ? "bg-green-400 text-black shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                          : "bg-white/[0.025] text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {value}%
                    </button>
                  )
                )}

              </div>

              {/* ODDS */}

              <div className="mt-6 rounded-2xl border border-white/5 bg-black/20 p-4">

                <div className="mb-3 flex justify-between text-sm">

                  <span className="text-white/35">
                    Multiplier
                  </span>

                  <span className="font-black text-cyan-400">
                    x{multiplier.toFixed(
                      2
                    )}
                  </span>

                </div>

                <div className="mb-3 flex justify-between text-sm">

                  <span className="text-white/35">
                    Potential payout
                  </span>

                  <span className="font-black text-yellow-300">
                    {possiblePayout}
                  </span>

                </div>

                <div className="flex justify-between text-sm">

                  <span className="text-white/35">
                    Win zone
                  </span>

                  <span className="font-black text-green-400">
                    0–{chance}
                  </span>

                </div>

              </div>

              {/* LEGEND */}

              <div className="mt-4 grid grid-cols-2 gap-2">

                <div className="rounded-xl border border-green-400/20 bg-green-400/5 px-3 py-3 text-center">

                  <div className="text-xs font-black text-green-400">
                    GREEN
                  </div>

                  <div className="mt-1 text-[9px] font-bold text-green-400/40">
                    WIN
                  </div>

                </div>

                <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-3 text-center">

                  <div className="text-xs font-black text-red-400">
                    RED
                  </div>

                  <div className="mt-1 text-[9px] font-bold text-red-400/40">
                    LOSS
                  </div>

                </div>

              </div>

            </section>

            {/* HISTORY */}

            <section className="rounded-[26px] border border-white/10 bg-[#070911] p-6">

              <div className="mb-5 flex items-center justify-between">

                <div>

                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">
                    Recent
                  </div>

                  <h2 className="mt-1 text-lg font-black">
                    Roll History
                  </h2>

                </div>

                <div className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-black text-white/30">
                  {history.length}/10
                </div>

              </div>

              {history.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 py-8 text-center">

                  <div className="text-3xl text-white/10">
                    ◎
                  </div>

                  <div className="mt-2 text-xs text-white/25">
                    No spins yet
                  </div>

                </div>
              ) : (
                <div className="space-y-2">

                  {history.map(
                    (item) => (
                      <div
                        key={
                          item.id
                        }
                        className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.025] px-3 py-2.5"
                      >

                        <div className="flex items-center gap-3">

                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black ${
                              item.won
                                ? "bg-green-400/10 text-green-400"
                                : "bg-red-400/10 text-red-400"
                            }`}
                          >
                            {item.won
                              ? "W"
                              : "L"}
                          </div>

                          <div>

                            <div className="text-xs font-black">
                              {item.roll.toFixed(
                                2
                              )}
                            </div>

                            <div className="text-[9px] text-white/25">
                              Bet{" "}
                              {
                                item.bet
                              }
                            </div>

                          </div>

                        </div>

                        <div
                          className={`text-xs font-black ${
                            item.won
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {item.won
                            ? `+${item.payout}`
                            : `-${item.bet}`}
                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

            </section>

          </aside>

        </div>

        <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4 text-center text-xs text-white/20">
          Server-side result • Secure Novux balance
        </div>

      </div>

    </main>
  );
}