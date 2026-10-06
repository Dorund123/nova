"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type World = {
  id: string;
  name: string;
  description: string | null;
  max_players: number;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export default function CreatePage() {
  const router = useRouter();

  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadExperiences();
  }, []);

  async function loadExperiences() {
    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("worlds")
        .select(
          "id,name,description,max_players,published,created_at,updated_at"
        )
        .eq("owner_id", user.id)
        .order("updated_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setWorlds((data || []) as World[]);
    } catch (error) {
      console.error("LOAD EXPERIENCES ERROR:", error);
      setWorlds([]);
    } finally {
      setLoading(false);
    }
  }

  function openStudio(worldId: string) {
    router.push(`/create/studio?world=${worldId}`);
  }

  function playWorld(worldId: string) {
    router.push(`/play?world=${worldId}`);
  }

  async function deleteWorld(id: string) {
    const world = worlds.find((item) => item.id === id);

    if (!world) return;

    const confirmed = window.confirm(
      `Delete "${world.name}"?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("worlds")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setWorlds((current) =>
      current.filter((item) => item.id !== id)
    );

    setMenuId(null);
  }

  const filteredWorlds = worlds.filter((world) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    const name = world.name?.toLowerCase() || "";
    const description =
      world.description?.toLowerCase() || "";

    return (
      name.includes(query) ||
      description.includes(query)
    );
  });

  return (
    <main
      className="min-h-screen bg-[#111214] text-white"
      onClick={() => setMenuId(null)}
    >
      {/* SIDEBAR */}

      <aside className="fixed inset-y-0 left-0 hidden w-[250px] border-r border-[#2a2c31] bg-[#18191c] lg:block">
        <div className="flex h-[72px] items-center border-b border-[#2a2c31] px-6">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 font-black text-black">
              N
            </div>

            <div>
              <div className="text-lg font-black">
                NOVA
              </div>

              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                Creator
              </div>
            </div>
          </button>
        </div>

        <div className="p-4">
          <div className="mb-3 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            Creations
          </div>

          <button
            onClick={() => router.push("/create")}
            className="flex w-full items-center gap-3 rounded-lg bg-[#2b2d32] px-3 py-3 text-left text-sm font-black"
          >
            <span>🎮</span>
            <span>Experiences</span>
          </button>

          <button
            onClick={() => router.push("/create/share-links")}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-bold text-slate-500 hover:bg-white/5 hover:text-white"
          >
            🔗
            <span>Share Links</span>
          </button>

          <button
            onClick={() => router.push("/create/avatar-items")}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-bold text-slate-500 hover:bg-white/5 hover:text-white"
          >
            👕
            <span>Avatar Items</span>
          </button>

          <button
            onClick={() =>
              router.push("/create/development-items")
            }
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-bold text-slate-500 hover:bg-white/5 hover:text-white"
          >
            🧩
            <span>Development Items</span>
          </button>

          <div className="my-5 border-t border-[#2a2c31]" />

          <button
            onClick={() => router.push("/")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-bold text-slate-500 hover:bg-white/5 hover:text-white"
          >
            ←
            <span>Back to Nova</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <div className="lg:ml-[250px]">
        {/* HEADER */}

        <header className="sticky top-0 z-40 h-[72px] border-b border-[#2a2c31] bg-[#111214]/95 backdrop-blur">
          <div className="flex h-full items-center px-5 sm:px-8">
            <div className="relative w-full max-w-[430px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                🔍
              </span>

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search Experiences"
                className="h-10 w-full rounded-lg border border-[#303238] bg-[#1a1b1f] pl-11 pr-4 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white"
              >
                🔔
              </button>

              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 font-black text-black"
              >
                N
              </button>
            </div>
          </div>
        </header>

        {/* CONTENT */}

        <section className="mx-auto max-w-[1250px] px-5 py-9 sm:px-8">
          {/* BREADCRUMB */}

          <div className="text-sm font-bold text-slate-600">
            Creations
            <span className="mx-2">/</span>
            <span className="text-white">
              Experiences
            </span>
          </div>

          {/* TITLE */}

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                CREATIONS
              </div>

              <h1 className="text-4xl font-black">
                Experiences
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Your created games and worlds.
              </p>
            </div>

            <button
              onClick={() => router.push("/create/new")}
              className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-black text-black hover:bg-cyan-300"
            >
              + Create Experience
            </button>
          </div>

          {/* TABS */}

          <div className="mt-8 border-b border-[#292b30]">
            <button className="border-b-2 border-cyan-400 pb-4 text-sm font-black text-white">
              My Experiences
            </button>

            <button className="ml-7 pb-4 text-sm font-bold text-slate-500">
              Shared With Me
            </button>
          </div>

          {/* EXPERIENCE LIST */}

          <div className="mt-8">
            <div className="mb-5">
              <h2 className="text-2xl font-black">
                My Experiences
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                {worlds.length} created
              </p>
            </div>

            {/* LOADING */}

            {loading && (
              <div className="rounded-xl border border-[#292b30] bg-[#18191c] p-16 text-center">
                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />

                <p className="mt-4 text-sm font-bold text-slate-500">
                  Loading experiences...
                </p>
              </div>
            )}

            {/* EMPTY */}

            {!loading &&
              filteredWorlds.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#303238] bg-[#18191c] p-16 text-center">
                  <div className="text-6xl">
                    🎮
                  </div>

                  <h3 className="mt-5 text-xl font-black">
                    No Experiences Yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                    Create your first game and it
                    will appear here automatically.
                  </p>

                  <button
                    onClick={() =>
                      router.push("/create/new")
                    }
                    className="mt-6 rounded-lg bg-cyan-400 px-6 py-3 text-sm font-black text-black hover:bg-cyan-300"
                  >
                    Create Experience
                  </button>
                </div>
              )}

            {/* CARDS */}

            {!loading &&
              filteredWorlds.length > 0 && (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredWorlds.map((world) => (
                    <div
                      key={world.id}
                      className="overflow-visible rounded-xl border border-[#292b30] bg-[#18191c] transition hover:border-[#4a4d55]"
                    >
                      {/* THUMBNAIL */}

                      <div className="relative flex h-[190px] items-center justify-center overflow-visible rounded-t-xl bg-gradient-to-br from-[#123049] via-[#1b2532] to-[#2b1b40]">
                        <div className="text-7xl transition duration-300 hover:scale-110">
                          🎮
                        </div>

                        <span
                          className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-[10px] font-black uppercase ${
                            world.published
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-black/50 text-slate-300"
                          }`}
                        >
                          {world.published
                            ? "Public"
                            : "Private"}
                        </span>

                        {/* MENU */}

                        <div className="absolute right-3 top-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();

                              setMenuId(
                                menuId === world.id
                                  ? null
                                  : world.id
                              );
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/50 text-xl font-black hover:bg-black/70"
                          >
                            ⋮
                          </button>

                          {menuId === world.id && (
                            <div
                              onClick={(e) =>
                                e.stopPropagation()
                              }
                              className="absolute right-0 top-11 z-50 w-48 rounded-xl border border-[#3a3c43] bg-[#202126] p-1.5 shadow-2xl"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuId(null);
                                  openStudio(world.id);
                                }}
                                className="w-full rounded-lg px-3 py-3 text-left text-sm font-bold hover:bg-white/10"
                              >
                                ✏️ Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setMenuId(null);
                                  playWorld(world.id);
                                }}
                                className="w-full rounded-lg px-3 py-3 text-left text-sm font-bold hover:bg-white/10"
                              >
                                ▶️ Play
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setMenuId(null);

                                  alert(
                                    `Players: ${world.max_players}`
                                  );
                                }}
                                className="w-full rounded-lg px-3 py-3 text-left text-sm font-bold hover:bg-white/10"
                              >
                                ⚙️ Settings
                              </button>

                              <div className="my-1 border-t border-[#3a3c43]" />

                              <button
                                type="button"
                                onClick={() =>
                                  deleteWorld(world.id)
                                }
                                className="w-full rounded-lg px-3 py-3 text-left text-sm font-bold text-red-300 hover:bg-red-500/10"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* INFO */}

                      <div className="p-4">
                        <h3 className="truncate text-lg font-black">
                          {world.name}
                        </h3>

                        <p className="mt-2 min-h-[40px] text-sm text-slate-600">
                          {world.description ||
                            "No description"}
                        </p>

                        <div className="mt-4 flex gap-2">
                          <span className="rounded-md bg-[#22242a] px-2.5 py-1.5 text-[10px] font-bold text-slate-500">
                            👥 {world.max_players} Players
                          </span>

                          <span className="rounded-md bg-[#22242a] px-2.5 py-1.5 text-[10px] font-bold text-slate-500">
                            🎮 Experience
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            openStudio(world.id)
                          }
                          className="mt-4 w-full rounded-lg border border-[#303238] bg-[#212329] py-3 text-xs font-black hover:border-cyan-400 hover:bg-cyan-400 hover:text-black"
                        >
                          Open in Studio
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </section>
      </div>
    </main>
  );
}
