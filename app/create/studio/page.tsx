"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid, OrbitControls, TransformControls } from "@react-three/drei";
import * as THREE from "three";
import { supabase } from "../.././lib/supabase";

/* =========================================================
   TYPES
========================================================= */

type PartObject = {
  id: string;
  type: "part";
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
};

type ScriptObject = {
  id: string;
  type: "script";
  name: string;
  source: string;
};

type WorldObject = PartObject | ScriptObject;

type World = {
  id: string;
  name: string;
  description: string | null;
  max_players: number;
  published: boolean;
  objects: WorldObject[];
};

/* =========================================================
   HELPERS
========================================================= */

function isPart(object: WorldObject): object is PartObject {
  return object.type === "part";
}

function isScript(object: WorldObject): object is ScriptObject {
  return object.type === "script";
}

/* =========================================================
   PART
========================================================= */

function PartMesh({
  part,
  selected,
  tool,
  onSelect,
  onChange,
}: {
  part: PartObject;
  selected: boolean;
  tool: "select" | "move" | "rotate" | "scale";
  onSelect: () => void;
  onChange: (
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number]
  ) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const [dragging, setDragging] = useState(false);

  useFrame(() => {
    if (!meshRef.current) return;

    if (!dragging) {
      meshRef.current.position.set(...part.position);
      meshRef.current.rotation.set(...part.rotation);
      meshRef.current.scale.set(...part.scale);
    }
  });

  const transformMode =
    tool === "move"
      ? "translate"
      : tool === "rotate"
        ? "rotate"
        : tool === "scale"
          ? "scale"
          : undefined;

  return (
    <>
      <mesh
        ref={meshRef}
        position={part.position}
        rotation={part.rotation}
        scale={part.scale}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <boxGeometry args={[1, 1, 1]} />

        <meshStandardMaterial
          color={part.color}
          emissive={selected ? "#2563eb" : "#000000"}
          emissiveIntensity={selected ? 0.25 : 0}
        />
      </mesh>

      {selected && transformMode && meshRef.current && (
        <TransformControls
          object={meshRef.current}
          mode={transformMode}
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => {
            setDragging(false);

            if (!meshRef.current) return;

            const p = meshRef.current.position;
            const r = meshRef.current.rotation;
            const s = meshRef.current.scale;

            onChange(
              [p.x, p.y, p.z],
              [r.x, r.y, r.z],
              [s.x, s.y, s.z]
            );
          }}
        />
      )}
    </>
  );
}

/* =========================================================
   CAMERA CLICK
========================================================= */

function SceneClickHandler({
  onClear,
}: {
  onClear: () => void;
}) {
  const { gl } = useThree();

  useEffect(() => {
    const element = gl.domElement;

    const handler = (event: MouseEvent) => {
      if (event.target === element) {
        onClear();
      }
    };

    element.addEventListener("click", handler);

    return () => {
      element.removeEventListener("click", handler);
    };
  }, [gl, onClear]);

  return null;
}

/* =========================================================
   MAIN
========================================================= */

export default function StudioPage() {
  const [world, setWorld] = useState<World | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [tool, setTool] = useState<
    "select" | "move" | "rotate" | "scale"
  >("select");

  const [scriptEditorOpen, setScriptEditorOpen] = useState(false);

  const [scriptName, setScriptName] = useState("");
  const [scriptSource, setScriptSource] = useState("");

  const [activeLeftPanel, setActiveLeftPanel] = useState<
    "studio" | "build" | "settings"
  >("studio");

  const [worldName, setWorldName] = useState("");
  const [worldDescription, setWorldDescription] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [published, setPublished] = useState(false);

  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;

  const worldId = searchParams?.get("world");

  /* =========================================================
     LOAD WORLD
  ========================================================= */

  useEffect(() => {
    async function loadWorld() {
      if (!worldId) {
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("worlds")
        .select("*")
        .eq("id", worldId)
        .eq("owner_id", user.id)
        .single();

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const objects: WorldObject[] = Array.isArray(data.objects)
        ? data.objects
        : [];

      const loadedWorld: World = {
        ...data,
        objects,
      };

      setWorld(loadedWorld);

      setWorldName(data.name || "");
      setWorldDescription(data.description || "");
      setMaxPlayers(data.max_players || 10);
      setPublished(Boolean(data.published));

      setLoading(false);
    }

    loadWorld();
  }, [worldId]);

  /* =========================================================
     OBJECTS
  ========================================================= */

  const objects = world?.objects ?? [];

  const parts = useMemo(
    () => objects.filter(isPart),
    [objects]
  );

  const scripts = useMemo(
    () => objects.filter(isScript),
    [objects]
  );

  const selectedObject = useMemo(
    () =>
      objects.find((object) => object.id === selectedId) ??
      null,
    [objects, selectedId]
  );

  /* =========================================================
     UPDATE OBJECTS
  ========================================================= */

  function updateObjects(nextObjects: WorldObject[]) {
    setWorld((current) =>
      current
        ? {
            ...current,
            objects: nextObjects,
          }
        : current
    );
  }

  /* =========================================================
     ADD PART
  ========================================================= */

  function addPart() {
    if (!world) return;

    const newPart: PartObject = {
      id: crypto.randomUUID(),
      type: "part",
      name: `Part ${parts.length + 1}`,
      position: [0, 0.5, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: "#3b82f6",
    };

    updateObjects([...objects, newPart]);

    setSelectedId(newPart.id);
    setScriptEditorOpen(false);
  }

  /* =========================================================
     ADD SCRIPT
  ========================================================= */

  function addScript() {
    if (!world) return;

    const newScript: ScriptObject = {
      id: crypto.randomUUID(),
      type: "script",
      name: `Script ${scripts.length + 1}`,
      source:
        '-- Welcome to Nova scripting!\n\nprint("Hello Nova!")\n',
    };

    updateObjects([...objects, newScript]);

    setSelectedId(newScript.id);

    setScriptName(newScript.name);
    setScriptSource(newScript.source);

    setScriptEditorOpen(true);
  }

  /* =========================================================
     OPEN SCRIPT
  ========================================================= */

  function openScript(script: ScriptObject) {
    setSelectedId(script.id);

    setScriptName(script.name);
    setScriptSource(script.source);

    setScriptEditorOpen(true);
  }

  /* =========================================================
     SAVE SCRIPT
  ========================================================= */

  function saveScript() {
    if (!world || !selectedId) return;

    const nextObjects = objects.map((object) => {
      if (
        object.id !== selectedId ||
        object.type !== "script"
      ) {
        return object;
      }

      return {
        ...object,
        name: scriptName || "Script",
        source: scriptSource,
      };
    });

    updateObjects(nextObjects);
  }

  /* =========================================================
     UPDATE PART
  ========================================================= */

  function updatePart(
    id: string,
    changes: Partial<PartObject>
  ) {
    if (!world) return;

    const nextObjects = objects.map((object) => {
      if (
        object.id !== id ||
        object.type !== "part"
      ) {
        return object;
      }

      return {
        ...object,
        ...changes,
      };
    });

    updateObjects(nextObjects);
  }

  /* =========================================================
     DELETE SELECTED
  ========================================================= */

  function deleteSelected() {
    if (!world || !selectedId) return;

    const nextObjects = objects.filter(
      (object) => object.id !== selectedId
    );

    updateObjects(nextObjects);

    setSelectedId(null);
    setScriptEditorOpen(false);
  }

  /* =========================================================
     SAVE WORLD
  ========================================================= */

  async function saveWorld() {
    if (!world) return;

    setSaving(true);

    const { error } = await supabase
      .from("worlds")
      .update({
        name: worldName,
        description: worldDescription,
        max_players: maxPlayers,
        published,
        objects: world.objects,
        updated_at: new Date().toISOString(),
      })
      .eq("id", world.id);

    if (error) {
      console.error(error);
      alert("World could not be saved.");
    }

    setSaving(false);
  }

  /* =========================================================
     AUTO SAVE
  ========================================================= */

  useEffect(() => {
    if (!world) return;

    const timer = setTimeout(() => {
      saveWorld();
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    world?.objects,
    worldName,
    worldDescription,
    maxPlayers,
    published,
  ]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center">
        <div className="text-lg font-semibold">
          Loading Nova Studio...
        </div>
      </div>
    );
  }

  if (!world) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-5">
          World could not be loaded.
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="h-screen w-full overflow-hidden bg-[#080b12] text-white flex flex-col">
      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <header className="h-14 shrink-0 border-b border-white/10 bg-[#0d111b] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="text-xl font-black tracking-tight">
            Nova
          </div>

          <div className="h-6 w-px bg-white/10" />

          <div>
            <div className="text-sm font-semibold">
              {world.name}
            </div>

            <div className="text-[11px] text-gray-500">
              Studio
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={saveWorld}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="flex flex-1 min-h-0">
        {/* ===================================================
            LEFT TOOLBAR
        =================================================== */}

        <aside className="w-16 shrink-0 border-r border-white/10 bg-[#0b0f18] flex flex-col items-center py-3 gap-2">
          <button
            onClick={() => {
              setTool("select");
              setActiveLeftPanel("studio");
            }}
            className={`w-12 h-12 rounded-xl text-xs ${
              tool === "select"
                ? "bg-blue-600"
                : "bg-white/5 hover:bg-white/10"
            }`}
          >
            🖱️
            <div>Select</div>
          </button>

          <button
            onClick={() => {
              setTool("move");
              setActiveLeftPanel("studio");
            }}
            className={`w-12 h-12 rounded-xl text-xs ${
              tool === "move"
                ? "bg-blue-600"
                : "bg-white/5 hover:bg-white/10"
            }`}
          >
            ↔️
            <div>Move</div>
          </button>

          <button
            onClick={() => {
              setTool("rotate");
              setActiveLeftPanel("studio");
            }}
            className={`w-12 h-12 rounded-xl text-xs ${
              tool === "rotate"
                ? "bg-blue-600"
                : "bg-white/5 hover:bg-white/10"
            }`}
          >
            🔄
            <div>Rotate</div>
          </button>

          <button
            onClick={() => {
              setTool("scale");
              setActiveLeftPanel("studio");
            }}
            className={`w-12 h-12 rounded-xl text-xs ${
              tool === "scale"
                ? "bg-blue-600"
                : "bg-white/5 hover:bg-white/10"
            }`}
          >
            🔲
            <div>Scale</div>
          </button>

          <div className="my-2 h-px w-10 bg-white/10" />

          <button
            onClick={() => setActiveLeftPanel("build")}
            className={`w-12 h-12 rounded-xl text-xs ${
              activeLeftPanel === "build"
                ? "bg-purple-600"
                : "bg-white/5 hover:bg-white/10"
            }`}
          >
            🧱
            <div>Build</div>
          </button>

          <button
            onClick={() => setActiveLeftPanel("settings")}
            className={`w-12 h-12 rounded-xl text-xs ${
              activeLeftPanel === "settings"
                ? "bg-purple-600"
                : "bg-white/5 hover:bg-white/10"
            }`}
          >
            ⚙️
            <div>Settings</div>
          </button>
        </aside>

        {/* ===================================================
            CENTER
        =================================================== */}

        <main className="flex-1 min-w-0 relative bg-[#111722]">
          <Canvas
            camera={{
              position: [8, 7, 8],
              fov: 50,
            }}
            onPointerMissed={() => {
              setSelectedId(null);
              setScriptEditorOpen(false);
            }}
          >
            <color
              attach="background"
              args={["#111722"]}
            />

            <ambientLight intensity={1.5} />

            <directionalLight
              position={[5, 10, 5]}
              intensity={2}
            />

            <Grid
              args={[100, 100]}
              cellSize={1}
              cellThickness={0.5}
              sectionSize={5}
              sectionThickness={1}
              fadeDistance={100}
              fadeStrength={1}
            />

            <OrbitControls makeDefault />

            <SceneClickHandler
              onClear={() => {
                setSelectedId(null);
                setScriptEditorOpen(false);
              }}
            />

            {parts.map((part) => (
              <PartMesh
                key={part.id}
                part={part}
                selected={selectedId === part.id}
                tool={tool}
                onSelect={() => {
                  setSelectedId(part.id);
                  setScriptEditorOpen(false);
                }}
                onChange={(position, rotation, scale) => {
                  updatePart(part.id, {
                    position,
                    rotation,
                    scale,
                  });
                }}
              />
            ))}
          </Canvas>

          {/* =================================================
              TOP CENTER TOOLS
          ================================================= */}

          <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0c111b]/90 backdrop-blur px-2 py-2 flex gap-1">
            <button
              onClick={addPart}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500"
            >
              + Part
            </button>

            <button
              onClick={addScript}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-500"
            >
              📜 Script
            </button>
          </div>

          {/* =================================================
              LEFT PANEL
          ================================================= */}

          <div className="absolute left-4 top-4 bottom-4 w-64 pointer-events-none">
            <div className="pointer-events-auto h-full rounded-2xl border border-white/10 bg-[#0b1019]/95 backdrop-blur overflow-hidden">
              {activeLeftPanel === "studio" && (
                <>
                  <div className="px-4 py-4 border-b border-white/10">
                    <div className="font-bold">
                      Studio
                    </div>

                    <div className="text-xs text-gray-500 mt-1">
                      Build your Nova world
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <button
                      onClick={addPart}
                      className="w-full rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-500"
                    >
                      🧱 Add Part
                    </button>

                    <button
                      onClick={addScript}
                      className="w-full rounded-xl bg-purple-600 py-3 font-semibold hover:bg-purple-500"
                    >
                      📜 Add Script
                    </button>

                    <button
                      onClick={deleteSelected}
                      disabled={!selectedId}
                      className="w-full rounded-xl bg-red-600/80 py-3 font-semibold disabled:opacity-30"
                    >
                      🗑 Delete Selected
                    </button>
                  </div>
                </>
              )}

              {activeLeftPanel === "build" && (
                <>
                  <div className="px-4 py-4 border-b border-white/10">
                    <div className="font-bold">
                      Build
                    </div>

                    <div className="text-xs text-gray-500 mt-1">
                      Add objects to Workspace
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <button
                      onClick={addPart}
                      className="w-full rounded-xl bg-blue-600 py-3 font-semibold"
                    >
                      🧱 Create Part
                    </button>

                    <button
                      onClick={addScript}
                      className="w-full rounded-xl bg-purple-600 py-3 font-semibold"
                    >
                      📜 Create Script
                    </button>
                  </div>
                </>
              )}

              {activeLeftPanel === "settings" && (
                <>
                  <div className="px-4 py-4 border-b border-white/10">
                    <div className="font-bold">
                      World Settings
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div>
                      <label className="text-xs text-gray-400">
                        World Name
                      </label>

                      <input
                        value={worldName}
                        onChange={(e) =>
                          setWorldName(e.target.value)
                        }
                        className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400">
                        Description
                      </label>

                      <textarea
                        value={worldDescription}
                        onChange={(e) =>
                          setWorldDescription(e.target.value)
                        }
                        className="mt-1 w-full h-24 rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400">
                        Max Players
                      </label>

                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={maxPlayers}
                        onChange={(e) =>
                          setMaxPlayers(
                            Number(e.target.value)
                          )
                        }
                        className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none"
                      />
                    </div>

                    <label className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={published}
                        onChange={(e) =>
                          setPublished(e.target.checked)
                        }
                      />

                      Published
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>

        {/* ===================================================
            RIGHT SIDE - WORLD EXPLORER
        =================================================== */}

        <aside className="w-[350px] shrink-0 border-l border-white/10 bg-[#090d15] flex flex-col">
          {/* WORLD HEADER */}

          <div className="px-4 py-4 border-b border-white/10 bg-[#0d121c]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-black tracking-wide">
                  🌎 WORLD
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  Explorer
                </div>
              </div>
            </div>
          </div>

          {/* EXPLORER */}

          <div className="border-b border-white/10">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="font-semibold text-sm">
                Explorer
              </div>

              <div className="flex gap-1">
                <button
                  onClick={addPart}
                  title="Add Part"
                  className="w-7 h-7 rounded-md bg-blue-600 hover:bg-blue-500 text-sm"
                >
                  +
                </button>

                <button
                  onClick={addScript}
                  title="Add Script"
                  className="w-7 h-7 rounded-md bg-purple-600 hover:bg-purple-500 text-sm"
                >
                  📜
                </button>
              </div>
            </div>

            <div className="px-3 pb-3">
              <div className="rounded-lg bg-white/[0.03] border border-white/5 overflow-hidden">
                {/* WORKSPACE */}

                <div className="px-3 py-2 bg-white/[0.03] flex items-center gap-2 text-sm font-semibold">
                  <span>▼</span>
                  <span>📁</span>
                  <span>Workspace</span>
                </div>

                {/* PARTS */}

                {parts.map((part) => (
                  <button
                    key={part.id}
                    onClick={() => {
                      setSelectedId(part.id);
                      setScriptEditorOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 pl-8 flex items-center gap-2 text-sm border-t border-white/5 ${
                      selectedId === part.id
                        ? "bg-blue-600/30 text-white"
                        : "hover:bg-white/5 text-gray-300"
                    }`}
                  >
                    <span>🧱</span>

                    <span className="truncate">
                      {part.name}
                    </span>
                  </button>
                ))}

                {/* SCRIPTS */}

                {scripts.map((script) => (
                  <button
                    key={script.id}
                    onClick={() => openScript(script)}
                    className={`w-full text-left px-3 py-2 pl-8 flex items-center gap-2 text-sm border-t border-white/5 ${
                      selectedId === script.id
                        ? "bg-purple-600/30 text-white"
                        : "hover:bg-white/5 text-gray-300"
                    }`}
                  >
                    <span>📜</span>

                    <span className="truncate">
                      {script.name}
                    </span>
                  </button>
                ))}

                {objects.length === 0 && (
                  <div className="px-8 py-5 text-xs text-gray-500">
                    Workspace is empty.
                    <br />
                    Add a Part or Script.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SCRIPT EDITOR */}

          {scriptEditorOpen &&
            selectedObject &&
            isScript(selectedObject) && (
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 bg-[#0d121c]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold">
                        📜 Script Editor
                      </div>

                      <div className="text-[11px] text-gray-500">
                        Edit your script
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setScriptEditorOpen(false);
                        setSelectedId(null);
                      }}
                      className="text-gray-500 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-3 overflow-auto">
                  <div>
                    <label className="text-xs text-gray-400">
                      Script Name
                    </label>

                    <input
                      value={scriptName}
                      onChange={(e) =>
                        setScriptName(e.target.value)
                      }
                      className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400">
                      Source
                    </label>

                    <textarea
                      value={scriptSource}
                      onChange={(e) =>
                        setScriptSource(e.target.value)
                      }
                      spellCheck={false}
                      className="mt-1 w-full h-64 rounded-lg bg-[#05070b] border border-white/10 px-3 py-3 text-xs font-mono leading-5 text-green-300 outline-none resize-none focus:border-purple-500"
                    />
                  </div>

                  <button
                    onClick={saveScript}
                    className="w-full rounded-lg bg-purple-600 py-2.5 text-sm font-bold hover:bg-purple-500"
                  >
                    💾 Save Script
                  </button>

                  <button
                    onClick={deleteSelected}
                    className="w-full rounded-lg bg-red-600/20 border border-red-500/20 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-600/30"
                  >
                    🗑 Delete Script
                  </button>
                </div>
              </div>
            )}

          {/* INSPECTOR */}

          {selectedObject &&
            isPart(selectedObject) &&
            !scriptEditorOpen && (
              <div className="flex-1 min-h-0 overflow-auto">
                <div className="px-4 py-3 border-b border-white/10 bg-[#0d121c]">
                  <div className="text-sm font-bold">
                    Inspector
                  </div>

                  <div className="text-[11px] text-gray-500">
                    {selectedObject.name}
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* NAME */}

                  <div>
                    <label className="text-xs text-gray-400">
                      Name
                    </label>

                    <input
                      value={selectedObject.name}
                      onChange={(e) =>
                        updatePart(selectedObject.id, {
                          name: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none"
                    />
                  </div>

                  {/* POSITION */}

                  <div>
                    <div className="text-xs font-semibold text-gray-300 mb-2">
                      Position
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {(["x", "y", "z"] as const).map(
                        (axis, index) => (
                          <input
                            key={axis}
                            type="number"
                            step="0.1"
                            value={
                              selectedObject.position[index]
                            }
                            onChange={(e) => {
                              const next = [
                                ...selectedObject.position,
                              ] as [
                                number,
                                number,
                                number
                              ];

                              next[index] =
                                Number(e.target.value);

                              updatePart(
                                selectedObject.id,
                                {
                                  position: next,
                                }
                              );
                            }}
                            className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-2 text-xs outline-none"
                          />
                        )
                      )}
                    </div>
                  </div>

                  {/* ROTATION */}

                  <div>
                    <div className="text-xs font-semibold text-gray-300 mb-2">
                      Rotation
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {(["x", "y", "z"] as const).map(
                        (axis, index) => (
                          <input
                            key={axis}
                            type="number"
                            step="0.1"
                            value={
                              selectedObject.rotation[index]
                            }
                            onChange={(e) => {
                              const next = [
                                ...selectedObject.rotation,
                              ] as [
                                number,
                                number,
                                number
                              ];

                              next[index] =
                                Number(e.target.value);

                              updatePart(
                                selectedObject.id,
                                {
                                  rotation: next,
                                }
                              );
                            }}
                            className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-2 text-xs outline-none"
                          />
                        )
                      )}
                    </div>
                  </div>

                  {/* SCALE */}

                  <div>
                    <div className="text-xs font-semibold text-gray-300 mb-2">
                      Scale
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {(["x", "y", "z"] as const).map(
                        (axis, index) => (
                          <input
                            key={axis}
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={
                              selectedObject.scale[index]
                            }
                            onChange={(e) => {
                              const next = [
                                ...selectedObject.scale,
                              ] as [
                                number,
                                number,
                                number
                              ];

                              next[index] =
                                Number(e.target.value);

                              updatePart(
                                selectedObject.id,
                                {
                                  scale: next,
                                }
                              );
                            }}
                            className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-2 text-xs outline-none"
                          />
                        )
                      )}
                    </div>
                  </div>

                  {/* COLOR */}

                  <div>
                    <label className="text-xs text-gray-400">
                      Color
                    </label>

                    <input
                      type="color"
                      value={selectedObject.color}
                      onChange={(e) =>
                        updatePart(selectedObject.id, {
                          color: e.target.value,
                        })
                      }
                      className="mt-2 h-10 w-full rounded-lg bg-white/5 border border-white/10 cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={deleteSelected}
                    className="w-full rounded-lg bg-red-600/20 border border-red-500/20 py-2.5 text-sm font-semibold text-red-300"
                  >
                    🗑 Delete Part
                  </button>
                </div>
              </div>
            )}

          {/* NOTHING SELECTED */}

          {!selectedObject && !scriptEditorOpen && (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div>
                <div className="text-3xl mb-3">
                  🌎
                </div>

                <div className="text-sm font-semibold text-gray-300">
                  Select an object
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  Choose a Part or Script from Workspace.
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}