"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Game = {
  title: string;
  description: string;
  category: string;
  players: string;
  icon: string;
};

const games: Game[] = [
  {
    title: "Adventure World",
    description: "Explore mountains, caves and mysterious places.",
    category: "Adventure",
    players: "1.2K",
    icon: "🏔️",
  },
  {
    title: "City Life",
    description: "Create your own life in a huge city.",
    category: "Roleplay",
    players: "842",
    icon: "🏙️",
  },
  {
    title: "Speed Racing",
    description: "Race against other players and become the fastest.",
    category: "Racing",
    players: "726",
    icon: "🏎️",
  },
  {
    title: "Battle Arena",
    description: "Fight other players and survive the arena.",
    category: "Action",
    players: "624",
    icon: "⚔️",
  },
  {
    title: "Island Survival",
    description: "Survive on an island with your friends.",
    category: "Adventure",
    players: "531",
    icon: "🏝️",
  },
  {
    title: "Nova Tycoon",
    description: "Build your business and become the richest player.",
    category: "Tycoon",
    players: "418",
    icon: "🏗️",
  },
];

const categories = [
  "All",
  "Adventure",
  "Action",
  "Racing",
  "Roleplay",
  "Tycoon",
];

export default function DiscoverPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesSearch =
        game.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        game.description
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        category === "All" ||
        game.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <main className="min-h-screen bg-[#f3f3f3] text-gray-900">

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 h-16 border-b border-gray-200 bg-white">
        <div className="flex h-full items-center px-4 sm:px-6">

          <button
            onClick={() => router.push("/")}
            className="mr-8 text-3xl font-black"
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
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search games..."
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-100 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            />

          </div>

          <div className="ml-auto flex gap-2">

            <button
              onClick={() => router.push("/")}
              className="rounded-xl px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100"
            >
              Home
            </button>

            <button
              onClick={() => router.push("/games")}
              className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600"
            >
              Games
            </button>

          </div>

        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">

        {/* MOBILE SEARCH */}
        <div className="mb-6 md:hidden">

          <div className="relative">

            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              🔎
            </span>

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search games..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 outline-none"
            />

          </div>

        </div>

        {/* TITLE */}
        <section className="mb-8">

          <p className="text-sm font-black uppercase tracking-wider text-blue-600">
            Explore Nova
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Discover
          </h1>

          <p className="mt-2 text-gray-500">
            Find new games and discover something fun to play.
          </p>

        </section>

        {/* CATEGORIES */}
        <section className="mb-8">

          <div className="flex flex-wrap gap-2">

            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                  category === item
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item}
              </button>
            ))}

          </div>

        </section>

        {/* FEATURED */}
        {category === "All" && !search && (
          <section className="mb-10">

            <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-purple-700 text-white">

              <div className="flex flex-col justify-between gap-8 p-8 sm:p-10 md:flex-row md:items-center">

                <div>

                  <div className="mb-3 inline-flex rounded-xl bg-white/15 px-3 py-1.5 text-xs font-black">
                    ⭐ FEATURED GAME
                  </div>

                  <h2 className="text-3xl font-black">
                    Adventure World
                  </h2>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">
                    Explore a huge world, discover hidden places
                    and start your next adventure.
                  </p>

                  <button
                    onClick={() =>
                      alert(
                        "Adventure World will be playable soon!"
                      )
                    }
                    className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-black text-blue-700 hover:bg-gray-100"
                  >
                    ▶ Play Now
                  </button>

                </div>

                <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-3xl bg-white/10 text-8xl backdrop-blur-sm">
                  🏔️
                </div>

              </div>

            </div>

          </section>
        )}

        {/* RESULTS */}
        <section>

          <div className="mb-5 flex items-end justify-between">

            <div>

              <h2 className="text-2xl font-black">
                {category === "All"
                  ? "Popular Games"
                  : category}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredGames.length} games found
              </p>

            </div>

          </div>

          {filteredGames.length > 0 ? (

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {filteredGames.map((game) => (

                <button
                  key={game.title}
                  onClick={() =>
                    alert(
                      `${game.title} will be playable soon!`
                    )
                  }
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >

                  <div className="flex h-48 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">

                    <span className="text-8xl transition duration-300 group-hover:scale-110">
                      {game.icon}
                    </span>

                  </div>

                  <div className="p-5">

                    <div className="flex items-start justify-between gap-3">

                      <h3 className="text-lg font-black">
                        {game.title}
                      </h3>

                      <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-600">
                        {game.category}
                      </span>

                    </div>

                    <p className="mt-2 text-sm leading-5 text-gray-500">
                      {game.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">

                      <span className="text-xs font-bold text-gray-400">
                        👥 {game.players} playing
                      </span>

                      <span className="text-xs font-black text-blue-600">
                        PLAY →
                      </span>

                    </div>

                  </div>

                </button>

              ))}

            </div>

          ) : (

            <div className="rounded-3xl bg-white p-16 text-center shadow-sm">

              <div className="text-6xl">
                🔎
              </div>

              <h2 className="mt-5 text-2xl font-black">
                Nothing found
              </h2>

              <p className="mt-2 text-gray-500">
                Try another search or category.
              </p>

              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                }}
                className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
              >
                Clear Search
              </button>

            </div>

          )}

        </section>

      </div>

    </main>
  );
}