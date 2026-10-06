"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type World = {
  id: string;
  name: string;
  description: string;
  max_players: number;
  published: boolean;
  objects: unknown[];
  scripts: unknown[];
};

export default function StudioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const worldId = searchParams.get("world");

  const [world, setWorld] = useState<World | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!worldId) {
      router.push("/create");
      return;
    }

    loadWorld(worldId);
  }, [worldId]);

  async function loadWorld(id: string) {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("worlds")
        .select(
          "id,name,description,max_players,published,objects,scripts"
        )
        .eq("id", id)
        .eq("owner_id", user.id)
        .single();

      if (error) {
        throw error;
      }

      setWorld(data as World);
    } catch (error) {
      console.error(error);
      alert("Could not open this experience.");
      router.push("/create");
    } finally {
      setLoading(false);
    }
  }

  async function saveWorld() {
    if (!world) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("worlds")
        .update({
          name: world.name,
          description: world.description,
          max_players: world.max_players,
          objects: world.objects,
          scripts: world.scripts,
          updated_at: new Date().toISOString(),
        })
        .eq("id", world.id);

      if (error) {
        throw error;
      }

      alert("Experience saved!");
    } catch (error) {
      console.error(error);
      alert("Could not save experience.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#111214] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />

          <p className="mt-4 font-bold text-slate-500">
            Opening Nova Studio...
          </p>
        </div>
      </main>
    );
  }

  if (!world) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#0d0e10] text-white">
      {/* TOP BAR */}

      <header className="flex h-[64px] items-center border-b border-[#292b30] bg-[#17181b] px-5">
        <button
          onClick={() => router.push("/create")}
          className="mr-5 rounded-lg px-3 py-2 text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-white"
        >
          ← Experiences
        </button>

        <div className="h-7 w-px bg-[#303238]" />

        <div className="ml-5">
          <div className="text-xs font-black uppercase tracking-[0.15em] text-cyan-400">
            NOVA STUDIO
          </div>

          <div className="font-black">
            {world.name}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => alert("Play mode coming next.")}
            className="rounded-lg bg-emerald-400 px-4 py-2 text-xs font-black text-black hover:bg-emerald-300"
          >
            ▶ Play
          </button>

          <button
            onClick={saveWorld}
            disabled={saving}
            className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-black text-black hover:bg-cyan-300 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-64px)]">
        {/* LEFT */}

        <aside className="w-[220px] border-r border-[#292b30] bg-[#17181b] p-4">
          <div className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
            Studio
          </div>

          <button className="mb-1 flex w-full items-center gap-3 rounded-lg bg-[#2b2d32] px-3 py-3 text-left text-sm font-bold">
            🧱 Build
          </button>

          <button className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-white">
            📜 Scripts
          </button>

          <button className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-white">
            ⚙️ Settings
          </button>
        </aside>

        {/* CENTER */}

        <section className="flex flex-1 flex-col">
          <div className="flex-1 bg-[#0f1114] p-8">
            <div className="flex h-full min-h-[600px] items-center justify-center rounded-xl border border-[#292b30] bg-[#15171a]">
              <div className="text-center">
                <div className="text-7xl">
                  🎮
                </div>

                <h2 className="mt-5 text-2xl font-black">
                  {world.name}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Nova Studio
                </p>

                <p className="mt-6 text-xs text-slate-600">
                  Objects:{" "}
                  {world.objects?.length ?? 0}
                  {"  "}•{"  "}
                  Scripts:{" "}
                  {world.scripts?.length ?? 0}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT */}

        <aside className="hidden w-[260px] border-l border-[#292b30] bg-[#17181b] p-5 xl:block">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
            Experience
          </div>

          <div className="mt-5 rounded-xl border border-[#292b30] bg-[#1d1f23] p-4">
            <div className="text-xs font-bold text-slate-500">
              Name
            </div>

            <div className="mt-1 font-black">
              {world.name}
            </div>

            <div className="mt-4 text-xs font-bold text-slate-500">
              Maximum Players
            </div>

            <div className="mt-1 font-black">
              {world.max_players}
            </div>

            <div className="mt-4 text-xs font-bold text-slate-500">
              Status
            </div>

            <div className="mt-1 font-black">
              {world.published
                ? "Public"
                : "Private"}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}