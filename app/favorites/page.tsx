"use client";

import { useRouter } from "next/navigation";

export default function FavoritesPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-[250px] border-r border-white/10 bg-[#0c101b] p-5">
        {/* Logo */}
        <div
          onClick={() => router.push("/")}
          className="mb-10 cursor-pointer text-3xl font-black"
        >
          <span className="text-white">N</span>
          <span className="text-blue-500">ova</span>
        </div>

        {/* Main */}
        <div>
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-gray-500">
            Main
          </p>

          <nav className="space-y-1">
            <button
              onClick={() => router.push("/")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              🏠
              <span>Home</span>
            </button>

            <button
              onClick={() => router.push("/discover")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              🔎
              <span>Discover</span>
            </button>

            <button
              onClick={() => router.push("/games")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              🎮
              <span>Games</span>
            </button>

            {/* Active Favorites */}
            <button
              onClick={() => router.push("/favorites")}
              className="flex w-full items-center gap-3 rounded-xl bg-blue-600/15 px-4 py-3 font-semibold text-blue-400"
            >
              ⭐
              <span>Favorites</span>
            </button>

            <button
              onClick={() => router.push("/friends")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              👥
              <span>Friends</span>
            </button>
          </nav>
        </div>

        {/* Account */}
        <div className="mt-8">
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-gray-500">
            Account
          </p>

          <nav className="space-y-1">
            <button
              onClick={() => router.push("/profile")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              👤
              <span>My Profile</span>
            </button>

            <button
              onClick={() => router.push("/avatar")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              🎨
              <span>Avatar</span>
            </button>

            <button
              onClick={() => router.push("/settings")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              ⚙️
              <span>Settings</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <section className="ml-[250px] min-h-screen p-10">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-10">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-4xl">⭐</span>

              <h1 className="text-4xl font-black">
                Favorites
              </h1>
            </div>

            <p className="text-gray-400">
              Your favorite Nova games in one place.
            </p>
          </div>

          {/* Empty Favorites */}
          <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-white/10 bg-[#0d121f]">
            <div className="max-w-md text-center">
              {/* Star */}
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-yellow-400/10 text-5xl">
                ⭐
              </div>

              <h2 className="mb-3 text-3xl font-black">
                No favorites yet
              </h2>

              <p className="mb-8 leading-7 text-gray-400">
                You haven't favorited any games yet.
                <br />
                Find a game you love and add it to your
                favorites.
              </p>

              <button
                onClick={() => router.push("/games")}
                className="rounded-xl bg-blue-600 px-7 py-3 font-bold transition hover:bg-blue-500"
              >
                🎮 Browse Games
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}