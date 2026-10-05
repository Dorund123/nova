"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from ".././lib/supabase";

export default function CreatePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(20);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function createWorld() {
    setError("");

    if (!name.trim()) {
      setError("Please enter a world name.");
      return;
    }

    if (name.trim().length < 3) {
      setError("World name must be at least 3 characters.");
      return;
    }

    setCreating(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data: world, error: worldError } = await supabase
        .from("worlds")
        .insert({
          owner_id: user.id,
          name: name.trim(),
          description: description.trim(),
          max_players: maxPlayers,

          // ახალი World თავიდან ცარიელია
          world_data: {
            version: 1,
            objects: [],
            spawn: {
              x: 0,
              y: 1,
              z: 0,
            },
          },
        })
        .select("id, name")
        .single();

      if (worldError) {
        console.error("World creation error:", worldError);
        setError(worldError.message);
        return;
      }

      if (!world) {
        setError("World was not created.");
        return;
      }

      // World შეიქმნა → პირდაპირ Nova Studio-ში
      router.push(`/studio?world=${world.id}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while creating the world.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070a12] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">

        <div className="mb-8">
          <div className="text-blue-500 text-sm font-semibold mb-2">
            NOVA STUDIO
          </div>

          <h1 className="text-4xl font-bold">
            Create a New World
          </h1>

          <p className="text-gray-400 mt-3">
            Create an empty world and start building your own experience.
          </p>
        </div>

        <div className="bg-[#111625] border border-white/10 rounded-2xl p-7 space-y-6">

          {/* WORLD NAME */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              World Name
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Amazing World"
              maxLength={50}
              className="w-full bg-[#080b14] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your world..."
              maxLength={300}
              rows={4}
              className="w-full bg-[#080b14] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* PLAYERS */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Maximum Players
            </label>

            <select
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              className="w-full bg-[#080b14] border border-white/10 rounded-xl px-4 py-3 outline-none"
            >
              <option value={1}>1 Player</option>
              <option value={5}>5 Players</option>
              <option value={10}>10 Players</option>
              <option value={20}>20 Players</option>
              <option value={50}>50 Players</option>
              <option value={100}>100 Players</option>
            </select>
          </div>

          {/* ERROR */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm">
              {error}
            </div>
          )}

          {/* CREATE */}
          <button
            onClick={createWorld}
            disabled={creating}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl py-4 font-bold text-lg transition"
          >
            {creating ? "Creating World..." : "🚀 Create World"}
          </button>

        </div>

        <button
          onClick={() => router.push("/")}
          className="mt-5 text-gray-400 hover:text-white transition"
        >
          ← Back to Nova
        </button>

      </div>
    </main>
  );
}