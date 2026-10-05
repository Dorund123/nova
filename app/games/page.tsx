"use client";

import { useRouter } from "next/navigation";

export default function GamesPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">

      <div className="mx-auto max-w-6xl">

        <button
          onClick={() => router.push("/")}
          className="mb-8 rounded-xl bg-black px-5 py-3 font-bold text-white"
        >
          ← Back to Nova
        </button>

        <h1 className="text-4xl font-black">
          Nova Games 🎮
        </h1>

        <p className="mt-2 text-gray-500">
          Choose a game and start playing.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          <Game
            name="Nova City"
            icon="🌆"
            href="/games/nova-city"
            description="Playable 3D city"
          />

          <Game
            name="Adventure World"
            icon="🏔️"
          />

          <Game
            name="City Life"
            icon="🏙️"
          />

          <Game
            name="Speed Racing"
            icon="🏎️"
          />

          <Game
            name="Battle Arena"
            icon="⚔️"
          />

          <Game
            name="Island Survival"
            icon="🏝️"
          />

          <Game
            name="Nova Tycoon"
            icon="🏗️"
          />

        </div>

      </div>

    </main>
  );
}

function Game({
  name,
  icon,
  href,
  description,
}: {
  name: string;
  icon: string;
  href?: string;
  description?: string;
}) {
  const router = useRouter();

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md">

      <div className="flex h-40 items-center justify-center rounded-xl bg-gray-200 text-7xl">
        {icon}
      </div>

      <h2 className="mt-5 text-xl font-black">
        {name}
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        {description ?? "Nova game"}
      </p>

      <button
        onClick={() => {
          if (href) {
            router.push(href);
            return;
          }

          alert(`${name} is coming soon!`);
        }}
        className="mt-5 w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
      >
        ▶ Play
      </button>

    </div>
  );
}