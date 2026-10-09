
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabase";

type Profile = {
  username: string;
  display_name: string;
  avatar_url?: string | null;
  novux_balance: number;
};

type NovuxPackageData = {
  amount: number;
  price: number;
  label: string;
};

/* =========================================================
   HOME PAGE
========================================================= */

export default function HomePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [search, setSearch] = useState("");

  const [showUsernameEditor, setShowUsernameEditor] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [changingUsername, setChangingUsername] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState("");

  const [showNovuxShop, setShowNovuxShop] = useState(false);
  const [selectedPackage, setSelectedPackage] =
    useState<NovuxPackageData | null>(null);

  /* XSOLLA PAYMENT */

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  /* STATS */

  const [registeredCount, setRegisteredCount] = useState(0);
  const [visitedCount, setVisitedCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);

  /* =========================================================
     LOAD USER / STATS
  ========================================================= */

  useEffect(() => {
    void loadUser();
    void registerVisitOnce();
    void updateOnlineStatus();
    void loadStats();

    const interval = setInterval(() => {
      void updateOnlineStatus();
      void loadStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  /* =========================================================
     LOAD USER
  ========================================================= */

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url, novux_balance")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Profile error:", error);
      return;
    }

    if (!data) return;

    setProfile({
      username: data.username ?? "",
      display_name: data.display_name ?? data.username ?? "",
      avatar_url: data.avatar_url ?? null,
      novux_balance: Number(data.novux_balance ?? 0),
    });
  }

  /* =========================================================
     LOAD STATS
  ========================================================= */

  async function loadStats() {
    const { data, error } = await supabase.rpc("get_nova_stats");

    if (error) {
      console.error("Stats error:", error);
    } else {
      setOnlineCount(Number(data?.online ?? 0));
      setVisitedCount(Number(data?.visits ?? 0));
    }

    const { count, error: registeredError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (registeredError) {
      console.error("Registered count error:", registeredError);
      return;
    }

    setRegisteredCount(count ?? 0);
  }

  /* =========================================================
     REGISTER VISIT ONCE
  ========================================================= */

  async function registerVisitOnce() {
    if (typeof window === "undefined") return;

    const alreadyVisited = localStorage.getItem("nova_site_visited");

    if (alreadyVisited === "true") return;

    const { data, error } = await supabase.rpc("add_site_view");

    if (error) {
      console.error("Visit error:", error);
      return;
    }

    localStorage.setItem("nova_site_visited", "true");
    setVisitedCount(Number(data ?? 0));
  }

  /* =========================================================
     ONLINE STATUS
  ========================================================= */

  async function updateOnlineStatus() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.rpc("update_online_status");

    if (error) console.error("Online status error:", error);
  }

  /* =========================================================
     CHANGE USERNAME
  ========================================================= */

  async function changeUsername() {
    const username = newUsername.trim();

    if (!profile) return;

    if (username.length < 3) {
      setUsernameMessage("Username must be at least 3 characters.");
      return;
    }

    if (username.length > 20) {
      setUsernameMessage("Username must be maximum 20 characters.");
      return;
    }

    if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      setUsernameMessage(
        "Username can only contain letters, numbers, dots and underscores."
      );
      return;
    }

    if (username.toLowerCase() === profile.username.toLowerCase()) {
      setUsernameMessage("This is already your current username.");
      return;
    }

    if (profile.novux_balance < 1000) {
      setUsernameMessage("❌ You need 1,000 Novux to change your username.");
      return;
    }

    setChangingUsername(true);
    setUsernameMessage("");

    const { data, error } = await supabase.rpc("change_username", {
      new_username: username,
    });

    if (error) {
      setChangingUsername(false);

      const errorText = error.message.toLowerCase();

      if (errorText.includes("already") || errorText.includes("duplicate")) {
        setUsernameMessage("❌ This username is already taken.");
      } else {
        setUsernameMessage(error.message);
      }

      return;
    }

    setProfile({
      ...profile,
      username: data.username,
      novux_balance: Number(data.novux_balance),
    });

    setNewUsername("");
    setShowUsernameEditor(false);
    setChangingUsername(false);
    setUsernameMessage("");
  }

  /* =========================================================
     SAFE API RESPONSE READER
  ========================================================= */

  async function readApiResponse(response: Response): Promise<any> {
    const text = await response.text();

    if (!text) return {};

    const contentType = response.headers.get("content-type") || "";
    const trimmed = text.trimStart().toLowerCase();

    if (
      contentType.includes("text/html") ||
      trimmed.startsWith("<!doctype") ||
      trimmed.startsWith("<html")
    ) {
      console.error(
        "API returned HTML instead of JSON:",
        text.slice(0, 1000)
      );

      throw new Error(
        `Server returned an invalid response (${response.status}). Check the API route and Vercel deployment.`
      );
    }

    try {
      return JSON.parse(text);
    } catch {
      console.error("API returned invalid JSON:", text.slice(0, 1000));

      throw new Error(`Server returned invalid JSON (${response.status}).`);
    }
  }

  /* =========================================================
     START XSOLLA PAYMENT
  ========================================================= */

  async function startXsollaPayment(pkg: NovuxPackageData) {
    if (!profile) {
      setPaymentMessage("Please log in first.");
      return;
    }

    setPaymentLoading(true);
    setPaymentMessage("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      if (!session?.access_token) {
        throw new Error("Your login session expired. Please log in again.");
      }

      const response = await fetch("/api/xsolla/create-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount: pkg.amount,
        }),
        cache: "no-store",
      });

      const data = await readApiResponse(response);

      if (!response.ok || !data?.success || !data?.checkoutUrl) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Could not start Xsolla checkout. Please try again."
        );
      }

      let checkoutUrl: URL;

      try {
        checkoutUrl = new URL(data.checkoutUrl);
      } catch {
        throw new Error("Xsolla returned an invalid checkout URL.");
      }

      const allowedHosts = [
        "secure.xsolla.com",
        "sandbox-secure.xsolla.com",
      ];

      if (
        checkoutUrl.protocol !== "https:" ||
        !allowedHosts.includes(checkoutUrl.hostname)
      ) {
        throw new Error("Xsolla returned an untrusted checkout URL.");
      }

      window.location.assign(checkoutUrl.toString());
    } catch (error) {
      console.error("Xsolla payment error:", error);

      setPaymentMessage(
        error instanceof Error
          ? error.message
          : "Could not start payment. Please try again."
      );

      setPaymentLoading(false);
    }
  }

  /* =========================================================
     OPEN PACKAGE
  ========================================================= */

  function openPackage(amount: number, price: number) {
    const pkg: NovuxPackageData = {
      amount,
      price,
      label: `${amount.toLocaleString()} Novux`,
    };

    setShowNovuxShop(false);
    setSelectedPackage(pkg);
    setPaymentMessage("");
  }

  /* =========================================================
     CLOSE PAYMENT MODAL
  ========================================================= */

  function closePaymentModal() {
    if (paymentLoading) return;

    setSelectedPackage(null);
    setPaymentMessage("");
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const avatarLetter = profile?.username?.charAt(0)?.toUpperCase() || "N";

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#f3f3f3] text-[#191919]">
      {/* TOP NAVBAR */}

      <header className="sticky top-0 z-50 h-16 border-b border-gray-200 bg-white">
        <div className="flex h-full items-center px-4">
          <button
            onClick={() => router.push("/")}
            className="mr-8 text-3xl font-black tracking-tight"
          >
            <span className="text-black">N</span>
            <span className="text-blue-600">ova</span>
          </button>

          <div className="relative hidden max-w-xl flex-1 md:block">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              🔎
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games, players, creators..."
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-100 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {profile && (
              <button
                onClick={() => setShowNovuxShop(true)}
                className="hidden rounded-xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-600 transition hover:bg-blue-100 md:block"
              >
                💎 {profile.novux_balance.toLocaleString()} Novux
              </button>
            )}

            <button
              onClick={() => router.push("/profile")}
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 md:block"
            >
              Profile
            </button>

            <button
              onClick={() => router.push("/friends")}
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 md:block"
            >
              Friends
            </button>

            {profile && (
              <button
                onClick={() => router.push("/profile")}
                className="ml-2 flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-100"
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-black text-white">
                    {avatarLetter}
                  </div>
                )}

                <span className="hidden max-w-[150px] truncate text-sm font-bold sm:block">
                  {profile.username}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* LAYOUT */}

      <div className="mx-auto flex max-w-[1500px]">
        {/* SIDEBAR */}

        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-gray-200 bg-white p-4 lg:block">
          <div className="space-y-1">
            <SidebarItem icon="🏠" text="Home" active onClick={() => router.push("/")} />
            <SidebarItem icon="🔎" text="Discover" onClick={() => router.push("/discover")} />
            <SidebarItem icon="🎮" text="Games" onClick={() => router.push("/games")} />
            <SidebarItem icon="⭐" text="Favorites" onClick={() => router.push("/favorites")} />
            <SidebarItem icon="⚡" text="Upgrader" onClick={() => router.push("/upgrader")} />
            <SidebarItem icon="👥" text="Friends" onClick={() => router.push("/friends")} />
            <SidebarItem icon="💬" text="Chat" onClick={() => router.push("/chat")} />
          </div>

          <div className="my-6 border-t border-gray-200" />

          <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            Account
          </p>

          <div className="space-y-1">
            <SidebarItem icon="👤" text="My Profile" onClick={() => router.push("/profile")} />
            <SidebarItem icon="🎨" text="Avatar" onClick={() => router.push("/avatar")} />
            <SidebarItem icon="⚙️" text="Settings" onClick={() => router.push("/settings")} />
          </div>

          <div className="absolute bottom-5 left-4 right-4">
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <span>↪</span>
              Logout
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {/* MOBILE SEARCH */}

          <div className="mb-6 md:hidden">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔎
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search games..."
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm outline-none"
              />
            </div>
          </div>

          {/* WELCOME */}

          {profile && (
            <section className="mb-8">
              <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username}
                      className="h-20 w-20 rounded-2xl object-cover shadow-sm"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-3xl font-black text-white shadow-sm">
                      {avatarLetter}
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-400">Welcome back</p>

                    <h1 className="mt-1 text-3xl font-black">
                      {profile.display_name || profile.username}
                    </h1>

                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-sm text-gray-500">@{profile.username}</p>

                      <button
                        onClick={() => {
                          setNewUsername(profile.username);
                          setUsernameMessage("");
                          setShowUsernameEditor(true);
                        }}
                        className="rounded-lg px-2 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50"
                      >
                        ✏️ Change
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <div className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-600">
                        💎 {profile.novux_balance.toLocaleString()} Novux
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => router.push("/profile")}
                      className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
                    >
                      Profile
                    </button>

                    <button
                      onClick={() => router.push("/friends")}
                      className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-100"
                    >
                      Friends
                    </button>

                    <button
                      onClick={() => router.push("/upgrader")}
                      className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-bold text-white hover:bg-black"
                    >
                      ⚡ Upgrader
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* NOVA STATS */}

          <section className="mb-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard icon="🟢" value={onlineCount} title="Online Now" bg="bg-green-50" />
              <StatCard icon="👁️" value={visitedCount} title="Players Visited" bg="bg-blue-50" />
              <StatCard icon="👤" value={registeredCount} title="Registered" bg="bg-purple-50" />
            </div>
          </section>

          {/* NOVA UPGRADER */}

          <section className="mb-12">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 p-6 text-white shadow-2xl sm:p-8">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-600/20 blur-3xl" />

              <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-xs font-black text-blue-300">
                    ⚡ NOVA UPGRADER
                  </div>

                  <h2 className="text-3xl font-black sm:text-4xl">
                    Risk your Novux.
                    <span className="block text-blue-400">Win more.</span>
                  </h2>

                  <p className="mt-4 max-w-xl text-sm leading-6 text-gray-300">
                    Choose how many Novux you want to bet and select your winning
                    chance. Higher risk means a bigger multiplier.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-gray-200">
                      🎯 Choose Chance
                    </span>
                    <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-gray-200">
                      💎 Bet Novux
                    </span>
                    <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-gray-200">
                      🎰 Roll &amp; Win
                    </span>
                  </div>

                  {profile && (
                    <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-xl">
                        💎
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400">Your Balance</p>
                        <p className="text-lg font-black text-white">
                          {profile.novux_balance.toLocaleString()} Novux
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative shrink-0">
                  <button
                    onClick={() => router.push("/upgrader")}
                    className="group w-full rounded-2xl bg-blue-600 px-8 py-5 text-sm font-black text-white shadow-xl shadow-blue-900/30 transition hover:scale-105 hover:bg-blue-500 lg:w-auto"
                  >
                    <span className="flex items-center justify-center gap-3">
                      <span className="text-xl">⚡</span>
                      Open Novux Upgrader
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </span>
                  </button>

                  <p className="mt-3 text-center text-xs font-semibold text-gray-500">
                    Choose your bet • Choose your chance • Roll
                  </p>
                </div>
              </div>

              <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-bold text-gray-500">BET</p>
                  <p className="mt-1 text-xl font-black">💎 2 Novux</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-bold text-gray-500">CHANCE</p>
                  <p className="mt-1 text-xl font-black text-green-400">50%</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-bold text-gray-500">WIN</p>
                  <p className="mt-1 text-xl font-black text-blue-400">💎 4 Novux</p>
                </div>
              </div>
            </div>
          </section>

          {/* CONTINUE PLAYING */}

          <GameSection title="Continue Playing" subtitle="Jump back into your recent games.">
            <GameCard title="Your Games" players="Start playing" icon="🎮" onClick={() => router.push("/games")} />
            <GameCard title="Discover" players="Explore Nova" icon="🌎" onClick={() => router.push("/discover")} />
            <GameCard title="Create" players="Build a game" icon="🛠️" onClick={() => router.push("/create")} />
            <GameCard title="Play Together" players="Find friends" icon="👥" onClick={() => router.push("/friends")} />
          </GameSection>

          {/* POPULAR */}

          <GameSection title="Popular on Nova" subtitle="Games players are checking out.">
            <GameCard title="Adventure World" players="1.2K players" icon="🏔️" onClick={() => router.push("/games")} />
            <GameCard title="City Life" players="842 players" icon="🏙️" onClick={() => router.push("/games")} />
            <GameCard title="Speed Racing" players="726 players" icon="🏎️" onClick={() => router.push("/games")} />
            <GameCard title="Island Survival" players="531 players" icon="🏝️" onClick={() => router.push("/games")} />
          </GameSection>

          {/* CATEGORIES */}

          <section className="mt-12">
            <div className="mb-5">
              <h2 className="text-2xl font-black">Explore Categories</h2>
              <p className="mt-1 text-sm text-gray-500">
                Find games based on what you like.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <CategoryCard icon="⚔️" title="Adventure" onClick={() => router.push("/games")} />
              <CategoryCard icon="🏎️" title="Racing" onClick={() => router.push("/games")} />
              <CategoryCard icon="🏙️" title="Roleplay" onClick={() => router.push("/games")} />
              <CategoryCard icon="🏗️" title="Tycoon" onClick={() => router.push("/games")} />
            </div>
          </section>

          {/* CREATE */}

          <section className="mt-12 mb-10">
            <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white">
              <div className="flex flex-col justify-between gap-8 p-8 sm:p-10 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-blue-400">
                    Nova Studio
                  </p>
                  <h2 className="mt-2 text-3xl font-black">
                    Create something amazing
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-gray-300">
                    Build your own game and share it with the Nova community.
                  </p>
                </div>

                <button
                  onClick={() => router.push("/create")}
                  className="shrink-0 rounded-xl bg-white px-6 py-3 text-sm font-black text-black hover:bg-gray-100"
                >
                  Create Game
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* =========================================================
          NOVUX SHOP
      ========================================================= */}

      {showNovuxShop && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowNovuxShop(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="mb-2 inline-flex rounded-xl bg-white/15 px-3 py-1.5 text-xs font-black">
                    💎 NOVA STORE
                  </div>
                  <h2 className="text-3xl font-black">Buy Novux</h2>
                  <p className="mt-1 text-sm text-blue-100">
                    Choose a Novux package and add more balance.
                  </p>
                </div>

                <button
                  onClick={() => setShowNovuxShop(false)}
                  className="rounded-xl px-3 py-2 text-xl text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-black/20 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-xl">
                  💎
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-100">
                    Your Current Balance
                  </p>
                  <p className="text-xl font-black">
                    {profile?.novux_balance.toLocaleString()} Novux
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <NovuxPackage amount="300" price="$3" icon="💎" onBuy={() => openPackage(300, 3)} />
                <NovuxPackage amount="1,000" price="$7" icon="💎" popular onBuy={() => openPackage(1000, 7)} />
                <NovuxPackage amount="2,500" price="$15" icon="💎" onBuy={() => openPackage(2500, 15)} />
                <NovuxPackage amount="5,000" price="$25" icon="💎" onBuy={() => openPackage(5000, 25)} />
                <NovuxPackage amount="10,000" price="$45" icon="💎" onBuy={() => openPackage(10000, 45)} />

                <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center">
                  <div>
                    <div className="text-3xl">🚀</div>
                    <p className="mt-2 font-black text-gray-800">
                      More packages coming
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Bigger Novux bundles will be added soon.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-center">
                <p className="text-xs font-semibold text-gray-400">
                  Secure payments • Novux crediting depends on verified payment confirmation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          XSOLLA PAYMENT MODAL
      ========================================================= */}

      {selectedPackage && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4"
          onClick={() => {
            if (!paymentLoading) closePaymentModal();
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            {/* HEADER */}

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-5 text-white sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-2 inline-flex rounded-xl bg-white/15 px-3 py-1.5 text-[10px] font-black tracking-wide">
                    💳 SECURE CHECKOUT
                  </div>
                  <h2 className="text-xl font-black sm:text-2xl">
                    Buy {selectedPackage.amount.toLocaleString()} Novux
                  </h2>
                  <p className="mt-1 text-sm text-blue-100">
                    Total: ${selectedPackage.price.toFixed(2)} USD
                  </p>
                </div>

                <button
                  type="button"
                  disabled={paymentLoading}
                  onClick={closePaymentModal}
                  className="shrink-0 rounded-xl px-3 py-2 text-xl text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* BODY */}

            <div className="p-5 sm:p-6">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-900">
                      Pay securely with Xsolla
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      You’ll continue to Xsolla’s secure checkout to complete your purchase.
                    </p>
                  </div>

                  <div className="shrink-0 text-3xl">💳</div>
                </div>

                <button
                  type="button"
                  disabled={paymentLoading}
                  onClick={() => void startXsollaPayment(selectedPackage)}
                  className="mt-5 w-full rounded-xl bg-blue-600 py-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {paymentLoading
                    ? "Opening checkout..."
                    : "Continue to Secure Checkout"}
                </button>
              </div>

              {paymentMessage && (
                <div className="mt-4 break-words rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">
                  {paymentMessage}
                </div>
              )}

              <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400">
                      Total to pay
                    </p>
                    <p className="text-xl font-black text-gray-900">
                      ${selectedPackage.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-400">
                      You receive
                    </p>
                    <p className="text-sm font-black text-blue-600">
                      💎 {selectedPackage.amount.toLocaleString()} Novux
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-4 text-center">
                <p className="text-xs font-semibold text-gray-400">
                  🔒 Secure payment powered by Xsolla
                </p>
                <p className="mt-1 text-[11px] leading-4 text-gray-400">
                  Nova does not store your payment details.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          CHANGE USERNAME MODAL
      ========================================================= */}

      {showUsernameEditor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-2 inline-flex rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-600">
                  USERNAME
                </div>
                <h2 className="text-2xl font-black text-gray-900">
                  Change Username
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  This is the name other players see on Nova.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowUsernameEditor(false);
                  setUsernameMessage("");
                }}
                className="rounded-xl px-3 py-2 text-xl text-gray-400 hover:bg-gray-100 hover:text-black"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Current Username
              </p>
              <p className="mt-1 text-lg font-black text-gray-900">
                @{profile?.username}
              </p>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-bold text-gray-700">
                New Username
              </label>

              <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-4 focus-within:border-blue-500 focus-within:bg-white">
                <span className="text-gray-400">@</span>
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  maxLength={20}
                  placeholder="new.username"
                  className="h-12 w-full bg-transparent px-2 text-gray-900 outline-none"
                />
              </div>

              <div className="mt-2 flex justify-between text-xs text-gray-400">
                <span>3–20 characters</span>
                <span>{newUsername.length}/20</span>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-700">Username change</span>
                <span className="font-black text-blue-600">💎 1,000 Novux</span>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                Your balance:
                <span className="ml-1 font-bold text-gray-700">
                  💎 {profile?.novux_balance.toLocaleString()} Novux
                </span>
              </div>
            </div>

            {usernameMessage && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
                {usernameMessage}
              </div>
            )}

            <button
              onClick={changeUsername}
              disabled={changingUsername}
              className="mt-5 w-full rounded-xl bg-blue-600 py-3.5 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changingUsername
                ? "Changing Username..."
                : "💎 Change Username — 1,000 Novux"}
            </button>

            <button
              onClick={() => {
                setShowUsernameEditor(false);
                setUsernameMessage("");
              }}
              className="mt-3 w-full rounded-xl py-3 font-bold text-gray-500 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  value,
  title,
  bg,
}: {
  icon: string;
  value: number;
  title: string;
  bg: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${bg}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-black text-gray-900">
            {value.toLocaleString()}
          </p>
          <p className="text-sm font-semibold text-gray-400">{title}</p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

function SidebarItem({
  icon,
  text,
  active,
  onClick,
}: {
  icon: string;
  text: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
        active
          ? "bg-blue-50 text-blue-600"
          : "text-gray-600 hover:bg-gray-100 hover:text-black"
      }`}
    >
      <span className="w-6 text-center text-lg">{icon}</span>
      {text}
    </button>
  );
}

/* =========================================================
   GAME SECTION
========================================================= */

function GameSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-12">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>

        <button
          onClick={() => {
            window.location.href = "/games";
          }}
          className="hidden text-sm font-bold text-blue-600 hover:text-blue-700 sm:block"
        >
          See All
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   GAME CARD
========================================================= */

function GameCard({
  title,
  players,
  icon,
  onClick,
}: {
  title: string;
  players: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <span className="text-7xl transition duration-300 group-hover:scale-110">
          {icon}
        </span>
        <div className="absolute bottom-3 left-3 rounded-lg bg-black/70 px-2 py-1 text-xs font-bold text-white">
          ▶ Play
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-black">{title}</h3>
        <p className="mt-1 text-xs text-gray-400">{players}</p>
      </div>
    </button>
  );
}

/* =========================================================
   NOVUX PACKAGE
========================================================= */

function NovuxPackage({
  amount,
  price,
  icon,
  popular,
  onBuy,
}: {
  amount: string;
  price: string;
  icon: string;
  popular?: boolean;
  onBuy: () => void;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-5 transition hover:-translate-y-1 hover:shadow-lg ${
        popular
          ? "border-blue-300 bg-blue-50/50"
          : "border-gray-200 bg-white"
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-4 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
          Most Popular
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-black text-gray-900">{amount}</p>
          <p className="text-sm font-semibold text-gray-400">Novux</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Price
          </p>
          <p className="mt-1 text-2xl font-black text-gray-900">{price}</p>
        </div>

        <button
          type="button"
          onClick={onBuy}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
        >
          Buy
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   CATEGORY
========================================================= */

function CategoryCard({
  icon,
  title,
  onClick,
}: {
  icon: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-2xl">
        {icon}
      </div>
      <div>
        <h3 className="font-black">{title}</h3>
        <p className="mt-1 text-xs text-gray-400">Explore</p>
      </div>
    </button>
  );
}
