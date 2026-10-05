"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const PLAYER_OPTIONS = [1, 5, 10, 20, 50, 100];

export default function NewExperiencePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function createExperience() {
    setError("");

    if (!name.trim()) {
      setError("Enter an experience name.");
      return;
    }

    setCreating(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("worlds")
        .insert({
          owner_id: user.id,
          name: name.trim(),
          description: description.trim(),
          max_players: maxPlayers,
          objects: [],
          scripts: [],
          published: false,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      if (!data) {
        throw new Error("Experience was not created.");
      }

      router.push("/create");
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create experience."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#111214] text-white">
      <header className="border-b border-[#292b30] bg-[#18191c]">
        <div className="mx-auto flex h-[72px] max-w-[900px] items-center justify-between px-5">
          <button
            onClick={() => router.push("/create")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 font-black text-black">
              N
            </div>

            <div>
              <div className="font-black">
                NOVA
              </div>

              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                CREATOR
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push("/create")}
            className="text-sm font-bold text-slate-400 hover:text-white"
          >
            ← Back
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[800px] px-5 py-10">
        <div className="mb-8">
          <div className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
            CREATIONS
          </div>

          <h1 className="text-4xl font-black">
            Create Experience
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Create your new Nova game.
          </p>
        </div>

        <div className="rounded-2xl border border-[#292b30] bg-[#18191c] p-6 sm:p-8">
          <label className="block">
            <div className="mb-2 text-sm font-black">
              Experience Name
            </div>

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="My Awesome Game"
              className="h-12 w-full rounded-lg border border-[#303238] bg-[#202126] px-4 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400"
            />
          </label>

          <label className="mt-6 block">
            <div className="mb-2 text-sm font-black">
              Description
            </div>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="What is your game about?"
              rows={5}
              className="w-full resize-none rounded-lg border border-[#303238] bg-[#202126] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400"
            />
          </label>

          <div className="mt-6">
            <div className="mb-2 text-sm font-black">
              Maximum Players
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {PLAYER_OPTIONS.map((number) => (
                <button
                  key={number}
                  onClick={() =>
                    setMaxPlayers(number)
                  }
                  className={`rounded-lg border py-3 text-sm font-black ${
                    maxPlayers === number
                      ? "border-cyan-400 bg-cyan-400 text-black"
                      : "border-[#303238] bg-[#202126] text-slate-400 hover:text-white"
                  }`}
                >
                  {number}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
              {error}
            </div>
          )}

          <button
            onClick={createExperience}
            disabled={creating}
            className="mt-7 w-full rounded-xl bg-cyan-400 py-4 text-sm font-black text-black hover:bg-cyan-300 disabled:opacity-50"
          >
            {creating
              ? "Creating Experience..."
              : "Create Experience"}
          </button>
        </div>
      </div>
    </main>
  );
}