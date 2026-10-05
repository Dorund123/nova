"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Profile = {
  username: string;
  display_name: string;
  avatar_url?: string | null;
  novux_balance: number;
};

export default function HomePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [search, setSearch] = useState("");

  const [showNameEditor, setShowNameEditor] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [changingName, setChangingName] = useState(false);
  const [nameMessage, setNameMessage] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url, novux_balance")
      .eq("id", user.id)
      .maybeSingle();

    setProfile(data);
  }

  async function changeName() {
    const name = newDisplayName.trim();

    if (name.length < 3) {
      setNameMessage("Name must be at least 3 characters.");
      return;
    }

    if (name.length > 20) {
      setNameMessage("Name must be maximum 20 characters.");
      return;
    }

    if (!profile) return;

    if (profile.novux_balance < 1000) {
      setNameMessage("❌ You need 1,000 Novux to change your name.");
      return;
    }

    if (name === profile.display_name) {
      setNameMessage("This is already your current name.");
      return;
    }

    setChangingName(true);
    setNameMessage("");

    const { data, error } = await supabase.rpc(
      "change_display_name",
      {
        new_name: name,
      }
    );

    if (error) {
      setChangingName(false);
      setNameMessage(error.message);
      return;
    }

    setProfile({
      ...profile,
      display_name: data.display_name,
      novux_balance: data.novux_balance,
    });

    setNewDisplayName("");
    setShowNameEditor(false);
    setChangingName(false);
    setNameMessage("");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const avatarLetter =
    profile?.username?.charAt(0)?.toUpperCase() || "N";

  return (
    <main className="min-h-screen bg-[#f3f3f3] text-[#191919]">

      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-50 h-16 border-b border-gray-200 bg-white">

        <div className="flex h-full items-center px-4">

          {/* LOGO */}
          <button
            onClick={() => router.push("/")}
            className="mr-8 text-3xl font-black tracking-tight"
          >
            <span className="text-black">N</span>
            <span className="text-blue-600">ova</span>
          </button>

          {/* SEARCH */}
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

          {/* RIGHT */}
          <div className="ml-auto flex items-center gap-2">

            {/* NOVUX */}
            {profile && (
              <button
                onClick={() => {}}
                className="hidden rounded-xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-600 transition hover:bg-blue-100 md:block"
              >
                💎 {profile.novux_balance.toLocaleString()}
              </button>
            )}

            <button
              onClick={() => router.push("/profile")}
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 md:block"
            >
              Profile
            </button>

            <button
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

                <span className="hidden max-w-[120px] truncate text-sm font-bold sm:block">
                  {profile.display_name || profile.username}
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

            <SidebarItem
              icon="🏠"
              text="Home"
              active
              onClick={() => router.push("/")}
            />

            <SidebarItem
              icon="🔎"
              text="Discover"
              onClick={() => {}}
            />

            <SidebarItem
              icon="🎮"
              text="Games"
              onClick={() => {}}
            />

            <SidebarItem
              icon="⭐"
              text="Favorites"
              onClick={() => {}}
            />

            <SidebarItem
              icon="👥"
              text="Friends"
              onClick={() => {}}
            />

          </div>

          <div className="my-6 border-t border-gray-200" />

          <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            Account
          </p>

          <div className="space-y-1">

            <SidebarItem
              icon="👤"
              text="My Profile"
              onClick={() => router.push("/profile")}
            />

            <SidebarItem
              icon="🎨"
              text="Avatar"
              onClick={() => router.push("/avatar")}
            />

            <SidebarItem
              icon="⚙️"
              text="Settings"
              onClick={() => {}}
            />

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

                    <p className="text-sm font-semibold text-gray-400">
                      Welcome back
                    </p>

                    <h1 className="mt-1 text-3xl font-black">
                      {profile.display_name || profile.username}
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                      @{profile.username}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3">

                      <div className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-600">
                        💎 {profile.novux_balance.toLocaleString()} Novux
                      </div>

                      <button
                        onClick={() => {
                          setNewDisplayName(
                            profile.display_name || ""
                          );
                          setNameMessage("");
                          setShowNameEditor(true);
                        }}
                        className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-200"
                      >
                        ✏️ Edit Name
                      </button>

                    </div>

                  </div>

                  <div className="flex gap-2">

                    <button
                      onClick={() => router.push("/profile")}
                      className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
                    >
                      Profile
                    </button>

                    <button
                      className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-100"
                    >
                      Friends
                    </button>

                  </div>

                </div>

              </div>

            </section>
          )}

          {/* CONTINUE PLAYING */}
          <GameSection
            title="Continue Playing"
            subtitle="Jump back into your recent games."
          >

            <GameCard
              title="Your Games"
              players="Start playing"
              icon="🎮"
            />

            <GameCard
              title="Discover"
              players="Explore Nova"
              icon="🌎"
            />

            <GameCard
              title="Create"
              players="Build a game"
              icon="🛠️"
            />

            <GameCard
              title="Play Together"
              players="Find friends"
              icon="👥"
            />

          </GameSection>

          {/* POPULAR */}
          <GameSection
            title="Popular on Nova"
            subtitle="Games players are checking out."
          >

            <GameCard
              title="Adventure World"
              players="1.2K players"
              icon="🏔️"
            />

            <GameCard
              title="City Life"
              players="842 players"
              icon="🏙️"
            />

            <GameCard
              title="Speed Racing"
              players="726 players"
              icon="🏎️"
            />

            <GameCard
              title="Island Survival"
              players="531 players"
              icon="🏝️"
            />

          </GameSection>

          {/* CATEGORIES */}
          <section className="mt-12">

            <div className="mb-5">

              <h2 className="text-2xl font-black">
                Explore Categories
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Find games based on what you like.
              </p>

            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">

              <CategoryCard
                icon="⚔️"
                title="Adventure"
              />

              <CategoryCard
                icon="🏎️"
                title="Racing"
              />

              <CategoryCard
                icon="🏙️"
                title="Roleplay"
              />

              <CategoryCard
                icon="🏗️"
                title="Tycoon"
              />

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

      {/* CHANGE NAME MODAL */}
      {showNameEditor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">

            {/* HEADER */}
            <div className="flex items-start justify-between">

              <div>

                <h2 className="text-2xl font-black text-gray-900">
                  Change Display Name
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Choose a new name for your Nova profile.
                </p>

              </div>

              <button
                onClick={() => {
                  setShowNameEditor(false);
                  setNameMessage("");
                }}
                className="rounded-xl px-3 py-2 text-xl text-gray-400 hover:bg-gray-100 hover:text-black"
              >
                ✕
              </button>

            </div>

            {/* INPUT */}
            <div className="mt-6">

              <label className="mb-2 block text-sm font-bold text-gray-700">
                New Display Name
              </label>

              <input
                value={newDisplayName}
                onChange={(e) =>
                  setNewDisplayName(e.target.value)
                }
                maxLength={20}
                placeholder="Enter new name..."
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white"
              />

              <div className="mt-2 flex justify-between text-xs text-gray-400">
                <span>3–20 characters</span>
                <span>{newDisplayName.length}/20</span>
              </div>

            </div>

            {/* PRICE */}
            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">

              <div className="flex items-center justify-between">

                <span className="font-bold text-gray-700">
                  Name change
                </span>

                <span className="font-black text-blue-600">
                  💎 1,000 Novux
                </span>

              </div>

              <div className="mt-2 text-xs text-gray-500">
                Your balance:{" "}

                <span className="font-bold text-gray-700">
                  💎{" "}
                  {profile?.novux_balance.toLocaleString()} Novux
                </span>

              </div>

            </div>

            {/* ERROR */}
            {nameMessage && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">
                {nameMessage}
              </div>
            )}

            {/* CHANGE BUTTON */}
            <button
              onClick={changeName}
              disabled={changingName}
              className="mt-5 w-full rounded-xl bg-blue-600 py-3.5 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changingName
                ? "Changing Name..."
                : "💎 Change Name — 1,000 Novux"}
            </button>

            {/* CANCEL */}
            <button
              onClick={() => {
                setShowNameEditor(false);
                setNameMessage("");
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

/* SIDEBAR */

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
      <span className="w-6 text-center text-lg">
        {icon}
      </span>

      {text}
    </button>
  );
}

/* GAME SECTION */

function GameSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">

      <div className="mb-5 flex items-end justify-between">

        <div>

          <h2 className="text-2xl font-black">
            {title}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {subtitle}
          </p>

        </div>

        <button className="hidden text-sm font-bold text-blue-600 hover:text-blue-700 sm:block">
          See All
        </button>

      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {children}
      </div>

    </section>
  );
}

/* GAME CARD */

function GameCard({
  title,
  players,
  icon,
}: {
  title: string;
  players: string;
  icon: string;
}) {
  return (
    <button className="group overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl">

      <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">

        <span className="text-7xl transition duration-300 group-hover:scale-110">
          {icon}
        </span>

        <div className="absolute bottom-3 left-3 rounded-lg bg-black/70 px-2 py-1 text-xs font-bold text-white">
          ▶ Play
        </div>

      </div>

      <div className="p-4">

        <h3 className="font-black">
          {title}
        </h3>

        <p className="mt-1 text-xs text-gray-400">
          {players}
        </p>

      </div>

    </button>
  );
}

/* CATEGORY */

function CategoryCard({
  icon,
  title,
}: {
  icon: string;
  title: string;
}) {
  return (
    <button className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md">

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-2xl">
        {icon}
      </div>

      <div>

        <h3 className="font-black">
          {title}
        </h3>

        <p className="mt-1 text-xs text-gray-400">
          Explore
        </p>

      </div>

    </button>
  );
}