"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  TransformControls,
  Environment,
} from "@react-three/drei";
import * as THREE from "three";

// ✅ FIXED: correct path from app/studio/page.tsx
import { supabase } from ".././lib/supabase";

type Tool = "select" | "move" | "rotate" | "scale";

type WorldObject = {
  id: string;
  type: "part" | "tree" | "vehicle";
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
};

type WorldData = {
  version: number;
  objects: WorldObject[];
  spawn: {
    x: number;
    y: number;
    z: number;
  };
};

function CameraController() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(12, 10, 14);
    camera.lookAt(0, 2, 0);
  }, [camera]);

  return null;
}

type ObjectProps = {
  object: WorldObject;
  selected: boolean;
  tool: Tool;
  onSelect: () => void;
  onChange: (
    id: string,
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number]
  ) => void;
};

/* =========================
   PART
========================= */

function Part({
  object,
  selected,
  tool,
  onSelect,
  onChange,
}: ObjectProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  function handleChange() {
    if (!meshRef.current) return;

    onChange(
      object.id,
      [
        meshRef.current.position.x,
        meshRef.current.position.y,
        meshRef.current.position.z,
      ],
      [
        meshRef.current.rotation.x,
        meshRef.current.rotation.y,
        meshRef.current.rotation.z,
      ],
      [
        meshRef.current.scale.x,
        meshRef.current.scale.y,
        meshRef.current.scale.z,
      ]
    );
  }

  return (
    <>
      <mesh
        ref={meshRef}
        position={object.position}
        rotation={object.rotation}
        scale={object.scale}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[2, 1, 2]} />

        <meshStandardMaterial
          color={selected ? "#3b82f6" : object.color}
          roughness={0.65}
          metalness={0.1}
        />
      </mesh>

      {selected && meshRef.current && tool !== "select" && (
        <TransformControls
          object={meshRef.current}
          mode={
            tool === "move"
              ? "translate"
              : tool === "rotate"
              ? "rotate"
              : "scale"
          }
          onObjectChange={handleChange}
        />
      )}
    </>
  );
}

/* =========================
   REALISTIC TREE
========================= */

function RealisticTree({
  object,
  selected,
  tool,
  onSelect,
  onChange,
}: ObjectProps) {
  const groupRef = useRef<THREE.Group>(null);

  function handleChange() {
    if (!groupRef.current) return;

    onChange(
      object.id,
      [
        groupRef.current.position.x,
        groupRef.current.position.y,
        groupRef.current.position.z,
      ],
      [
        groupRef.current.rotation.x,
        groupRef.current.rotation.y,
        groupRef.current.rotation.z,
      ],
      [
        groupRef.current.scale.x,
        groupRef.current.scale.y,
        groupRef.current.scale.z,
      ]
    );
  }

  const leaves = [
    [-1.15, 4.0, 0.15, 1.15],
    [1.05, 4.2, -0.1, 1.25],
    [0, 5.0, 0.15, 1.35],
    [-0.55, 5.45, -0.15, 1.05],
    [0.7, 5.55, 0.1, 1.1],
    [0, 6.15, 0, 0.9],
  ];

  return (
    <>
      <group
        ref={groupRef}
        position={object.position}
        rotation={object.rotation}
        scale={object.scale}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <mesh
          position={[0, 2.1, 0]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.48, 0.7, 4.2, 12]} />

          <meshStandardMaterial
            color={selected ? "#8b5a35" : "#5b3820"}
            roughness={1}
          />
        </mesh>

        <mesh
          position={[-0.7, 3.45, 0]}
          rotation={[0, 0, -0.65]}
          castShadow
        >
          <cylinderGeometry args={[0.16, 0.28, 2.4, 10]} />

          <meshStandardMaterial
            color="#51321d"
            roughness={1}
          />
        </mesh>

        <mesh
          position={[0.7, 3.6, -0.05]}
          rotation={[0, 0, 0.65]}
          castShadow
        >
          <cylinderGeometry args={[0.16, 0.28, 2.5, 10]} />

          <meshStandardMaterial
            color="#51321d"
            roughness={1}
          />
        </mesh>

        <mesh
          position={[0, 4.25, 0]}
          rotation={[0.12, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.13, 0.22, 2, 10]} />

          <meshStandardMaterial
            color="#54341f"
            roughness={1}
          />
        </mesh>

        {leaves.map(
          ([x, y, z, size], index) => (
            <mesh
              key={index}
              position={[x, y, z]}
              scale={[
                size,
                size * 0.85,
                size,
              ]}
              castShadow
              receiveShadow
            >
              <icosahedronGeometry args={[1, 2]} />

              <meshStandardMaterial
                color={
                  selected
                    ? "#3b82f6"
                    : index % 2 === 0
                    ? "#267a32"
                    : "#328b3c"
                }
                roughness={0.95}
              />
            </mesh>
          )
        )}

        <mesh
          position={[-0.35, 5.2, 0]}
          rotation={[0, 0, -0.4]}
          castShadow
        >
          <cylinderGeometry args={[0.08, 0.14, 1.5, 8]} />

          <meshStandardMaterial
            color="#51321d"
            roughness={1}
          />
        </mesh>

        <mesh
          position={[0.4, 5.35, 0.05]}
          rotation={[0, 0, 0.45]}
          castShadow
        >
          <cylinderGeometry args={[0.08, 0.14, 1.4, 8]} />

          <meshStandardMaterial
            color="#51321d"
            roughness={1}
          />
        </mesh>
      </group>

      {selected &&
        groupRef.current &&
        tool !== "select" && (
          <TransformControls
            object={groupRef.current}
            mode={
              tool === "move"
                ? "translate"
                : tool === "rotate"
                ? "rotate"
                : "scale"
            }
            onObjectChange={handleChange}
          />
        )}
    </>
  );
}

/* =========================
   CAR
========================= */

function Car({
  object,
  selected,
  tool,
  onSelect,
  onChange,
}: ObjectProps) {
  const groupRef = useRef<THREE.Group>(null);

  function handleChange() {
    if (!groupRef.current) return;

    onChange(
      object.id,
      [
        groupRef.current.position.x,
        groupRef.current.position.y,
        groupRef.current.position.z,
      ],
      [
        groupRef.current.rotation.x,
        groupRef.current.rotation.y,
        groupRef.current.rotation.z,
      ],
      [
        groupRef.current.scale.x,
        groupRef.current.scale.y,
        groupRef.current.scale.z,
      ]
    );
  }

  const bodyColor = selected
    ? "#3b82f6"
    : object.color;

  const wheels = [
    [1.45, 0.45, 1.05],
    [1.45, 0.45, -1.05],
    [-1.45, 0.45, 1.05],
    [-1.45, 0.45, -1.05],
  ];

  return (
    <>
      <group
        ref={groupRef}
        position={object.position}
        rotation={object.rotation}
        scale={object.scale}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {/* MAIN BODY */}

        <mesh
          position={[0, 0.85, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[4.6, 0.9, 2]} />

          <meshStandardMaterial
            color={bodyColor}
            metalness={0.35}
            roughness={0.3}
          />
        </mesh>

        {/* HOOD */}

        <mesh
          position={[1.65, 1.2, 0]}
          castShadow
        >
          <boxGeometry args={[1.25, 0.35, 1.8]} />

          <meshStandardMaterial
            color={bodyColor}
            metalness={0.35}
            roughness={0.3}
          />
        </mesh>

        {/* CABIN */}

        <mesh
          position={[-0.35, 1.55, 0]}
          castShadow
        >
          <boxGeometry args={[2.4, 1.05, 1.75]} />

          <meshStandardMaterial
            color={bodyColor}
            metalness={0.3}
            roughness={0.3}
          />
        </mesh>

        {/* ROOF */}

        <mesh
          position={[-0.35, 2.1, 0]}
          castShadow
        >
          <boxGeometry args={[1.9, 0.12, 1.55]} />

          <meshStandardMaterial
            color={bodyColor}
            metalness={0.35}
            roughness={0.25}
          />
        </mesh>

        {/* FRONT WINDOW */}

        <mesh
          position={[0.48, 1.65, 0]}
        >
          <boxGeometry args={[0.05, 0.72, 1.5]} />

          <meshStandardMaterial
            color="#162536"
            metalness={0.4}
            roughness={0.12}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* REAR WINDOW */}

        <mesh
          position={[-1.18, 1.65, 0]}
        >
          <boxGeometry args={[0.05, 0.7, 1.45]} />

          <meshStandardMaterial
            color="#162536"
            metalness={0.4}
            roughness={0.12}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* LEFT SIDE WINDOW */}

        <mesh
          position={[-0.35, 1.65, 0.89]}
        >
          <boxGeometry args={[1.65, 0.68, 0.04]} />

          <meshStandardMaterial
            color="#162536"
            metalness={0.4}
            roughness={0.12}
          />
        </mesh>

        {/* RIGHT SIDE WINDOW */}

        <mesh
          position={[-0.35, 1.65, -0.89]}
        >
          <boxGeometry args={[1.65, 0.68, 0.04]} />

          <meshStandardMaterial
            color="#162536"
            metalness={0.4}
            roughness={0.12}
          />
        </mesh>

        {/* WHEELS */}

        {wheels.map(
          ([x, y, z], index) => (
            <group
              key={index}
              position={[x, y, z]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <mesh castShadow>
                <cylinderGeometry
                  args={[0.5, 0.5, 0.34, 24]}
                />

                <meshStandardMaterial
                  color="#111111"
                  roughness={0.9}
                />
              </mesh>

              <mesh position={[0, 0.18, 0]}>
                <cylinderGeometry
                  args={[0.24, 0.24, 0.36, 20]}
                />

                <meshStandardMaterial
                  color="#9ca3af"
                  metalness={0.8}
                  roughness={0.25}
                />
              </mesh>
            </group>
          )
        )}

        {/* FRONT HEADLIGHTS */}

        <mesh
          position={[2.32, 1.02, 0.65]}
        >
          <boxGeometry args={[0.08, 0.28, 0.42]} />

          <meshStandardMaterial
            color="#fffbd1"
            emissive="#fff4a3"
            emissiveIntensity={3}
          />
        </mesh>

        <mesh
          position={[2.32, 1.02, -0.65]}
        >
          <boxGeometry args={[0.08, 0.28, 0.42]} />

          <meshStandardMaterial
            color="#fffbd1"
            emissive="#fff4a3"
            emissiveIntensity={3}
          />
        </mesh>

        {/* REAR LIGHTS */}

        <mesh
          position={[-2.32, 1.02, 0.65]}
        >
          <boxGeometry args={[0.08, 0.28, 0.4]} />

          <meshStandardMaterial
            color="#ff2020"
            emissive="#ff0000"
            emissiveIntensity={2}
          />
        </mesh>

        <mesh
          position={[-2.32, 1.02, -0.65]}
        >
          <boxGeometry args={[0.08, 0.28, 0.4]} />

          <meshStandardMaterial
            color="#ff2020"
            emissive="#ff0000"
            emissiveIntensity={2}
          />
        </mesh>

        {/* FRONT BUMPER */}

        <mesh
          position={[2.38, 0.68, 0]}
        >
          <boxGeometry args={[0.18, 0.28, 1.85]} />

          <meshStandardMaterial
            color="#202020"
            roughness={0.65}
          />
        </mesh>

        {/* REAR BUMPER */}

        <mesh
          position={[-2.38, 0.68, 0]}
        >
          <boxGeometry args={[0.18, 0.28, 1.85]} />

          <meshStandardMaterial
            color="#202020"
            roughness={0.65}
          />
        </mesh>

        {/* FRONT GRILLE */}

        <mesh
          position={[2.41, 0.9, 0]}
        >
          <boxGeometry args={[0.04, 0.3, 0.75]} />

          <meshStandardMaterial
            color="#080808"
            roughness={0.8}
          />
        </mesh>

        {/* SIDE MIRRORS */}

        <mesh
          position={[0.15, 1.85, 1.02]}
        >
          <sphereGeometry args={[0.12, 12, 12]} />

          <meshStandardMaterial
            color="#111111"
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>

        <mesh
          position={[0.15, 1.85, -1.02]}
        >
          <sphereGeometry args={[0.12, 12, 12]} />

          <meshStandardMaterial
            color="#111111"
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>
      </group>

      {selected &&
        groupRef.current &&
        tool !== "select" && (
          <TransformControls
            object={groupRef.current}
            mode={
              tool === "move"
                ? "translate"
                : tool === "rotate"
                ? "rotate"
                : "scale"
            }
            onObjectChange={handleChange}
          />
        )}
    </>
  );
}

/* =========================
   WORLD SCENE
========================= */

function WorldScene({
  objects,
  selectedId,
  tool,
  onSelect,
  onChange,
}: {
  objects: WorldObject[];
  selectedId: string | null;
  tool: Tool;
  onSelect: (id: string) => void;
  onChange: (
    id: string,
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number]
  ) => void;
}) {
  return (
    <>
      <CameraController />

      <ambientLight intensity={0.7} />

      <directionalLight
        position={[10, 18, 10]}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <Environment preset="city" />

      <Grid
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.7}
        cellColor="#475569"
        sectionSize={5}
        sectionThickness={1.2}
        sectionColor="#64748b"
        fadeDistance={70}
        fadeStrength={1}
        infiniteGrid
      />

      {/* SPAWN */}

      <mesh
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[1.2, 32]} />

        <meshBasicMaterial
          color="#2563eb"
          transparent
          opacity={0.35}
        />
      </mesh>

      <mesh
        position={[0, 0.07, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[1.2, 1.35, 32]} />

        <meshBasicMaterial color="#60a5fa" />
      </mesh>

      {/* OBJECTS */}

      {objects.map((object) => {
        if (object.type === "tree") {
          return (
            <RealisticTree
              key={object.id}
              object={object}
              selected={
                selectedId === object.id
              }
              tool={tool}
              onSelect={() =>
                onSelect(object.id)
              }
              onChange={onChange}
            />
          );
        }

        if (object.type === "vehicle") {
          return (
            <Car
              key={object.id}
              object={object}
              selected={
                selectedId === object.id
              }
              tool={tool}
              onSelect={() =>
                onSelect(object.id)
              }
              onChange={onChange}
            />
          );
        }

        return (
          <Part
            key={object.id}
            object={object}
            selected={
              selectedId === object.id
            }
            tool={tool}
            onSelect={() =>
              onSelect(object.id)
            }
            onChange={onChange}
          />
        );
      })}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={80}
      />
    </>
  );
}

/* =========================
   STUDIO
========================= */

export default function StudioPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const worldId = searchParams.get("world");

  const [worldName, setWorldName] =
    useState("Loading...");

  const [objects, setObjects] =
    useState<WorldObject[]>([]);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [tool, setTool] =
    useState<Tool>("select");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const selectedObject = useMemo(
    () =>
      objects.find(
        (object) =>
          object.id === selectedId
      ) ?? null,
    [objects, selectedId]
  );

  /* LOAD WORLD */

  useEffect(() => {
    async function loadWorld() {
      if (!worldId) {
        setMessage(
          "World ID is missing."
        );
        setLoading(false);
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: world, error } =
          await supabase
            .from("worlds")
            .select(
              "id, name, owner_id, world_data"
            )
            .eq("id", worldId)
            .single();

        if (error) {
          console.error(error);
          setMessage(
            "Could not load this world."
          );
          setLoading(false);
          return;
        }

        if (world.owner_id !== user.id) {
          setMessage(
            "You do not own this world."
          );
          setLoading(false);
          return;
        }

        setWorldName(world.name);

        const data =
          world.world_data as WorldData | null;

        if (data?.objects) {
          setObjects(data.objects);
        } else {
          setObjects([]);
        }
      } catch (error) {
        console.error(error);
        setMessage(
          "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadWorld();
  }, [worldId, router]);

  /* ADD PART */

  function addPart() {
    const newPart: WorldObject = {
      id: crypto.randomUUID(),
      type: "part",
      name: `Part ${objects.length + 1}`,
      position: [0, 0.5, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: "#64748b",
    };

    setObjects((current) => [
      ...current,
      newPart,
    ]);

    setSelectedId(newPart.id);
    setTool("move");
  }

  /* ADD TREE */

  function addTree() {
    const newTree: WorldObject = {
      id: crypto.randomUUID(),
      type: "tree",
      name: `Tree ${objects.length + 1}`,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: "#267a32",
    };

    setObjects((current) => [
      ...current,
      newTree,
    ]);

    setSelectedId(newTree.id);
    setTool("move");
  }

  /* ADD VEHICLE */

  function addVehicle() {
    const newVehicle: WorldObject = {
      id: crypto.randomUUID(),
      type: "vehicle",
      name: `Car ${objects.length + 1}`,
      position: [0, 0.5, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: "#c62828",
    };

    setObjects((current) => [
      ...current,
      newVehicle,
    ]);

    setSelectedId(newVehicle.id);
    setTool("move");
  }

  /* DELETE */

  function deleteSelected() {
    if (!selectedId) return;

    setObjects((current) =>
      current.filter(
        (object) =>
          object.id !== selectedId
      )
    );

    setSelectedId(null);
  }

  /* DUPLICATE */

  function duplicateSelected() {
    if (!selectedObject) return;

    const copy: WorldObject = {
      ...selectedObject,
      id: crypto.randomUUID(),
      name: `${selectedObject.name} Copy`,
      position: [
        selectedObject.position[0] + 3,
        selectedObject.position[1],
        selectedObject.position[2] + 3,
      ],
    };

    setObjects((current) => [
      ...current,
      copy,
    ]);

    setSelectedId(copy.id);
  }

  /* UPDATE */

  function updateObject(
    id: string,
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number]
  ) {
    setObjects((current) =>
      current.map((object) =>
        object.id === id
          ? {
              ...object,
              position,
              rotation,
              scale,
            }
          : object
      )
    );
  }

  /* SAVE */

  async function saveWorld() {
    if (!worldId) return;

    setSaving(true);
    setMessage("");

    try {
      const worldData: WorldData = {
        version: 1,
        objects,
        spawn: {
          x: 0,
          y: 1,
          z: 0,
        },
      };

      const { error } =
        await supabase
          .from("worlds")
          .update({
            world_data: worldData,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", worldId);

      if (error) {
        console.error(error);
        setMessage("Save failed.");
        return;
      }

      setMessage(
        "World saved successfully."
      );

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (error) {
      console.error(error);
      setMessage("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  /* KEYBOARD */

  function handleKeyDown(
    event: React.KeyboardEvent
  ) {
    if (event.key === "Delete") {
      deleteSelected();
    }

    if (event.key === "Escape") {
      setSelectedId(null);
      setTool("select");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070a12] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-blue-500 text-2xl font-bold">
            NOVA STUDIO
          </div>

          <div className="text-gray-400 mt-3">
            Loading world...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="h-screen w-screen overflow-hidden bg-[#070a12] text-white"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* TOP BAR */}

      <header className="h-16 bg-[#0b0f19] border-b border-white/10 flex items-center px-4">
        <button
          onClick={() => router.push("/")}
          className="mr-6 text-xl font-bold"
        >
          <span className="text-white">
            N
          </span>

          <span className="text-blue-500">
            OVA
          </span>
        </button>

        <div className="h-7 w-px bg-white/10 mr-5" />

        <div>
          <div className="text-sm font-semibold">
            {worldName}
          </div>

          <div className="text-xs text-gray-500">
            Nova Studio
          </div>
        </div>

        {/* TOOLS */}

        <div className="ml-8 flex items-center gap-1">
          {(
            [
              ["select", "🖱 Select"],
              ["move", "↔ Move"],
              ["rotate", "↻ Rotate"],
              ["scale", "⛶ Scale"],
            ] as [Tool, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() =>
                setTool(value)
              }
              className={`px-4 py-2 rounded-lg text-sm ${
                tool === value
                  ? "bg-blue-600"
                  : "bg-[#151b2a] hover:bg-[#20283a]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {message && (
            <div className="text-sm text-green-400 mr-3">
              {message}
            </div>
          )}

          <button
            onClick={saveWorld}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-semibold"
          >
            {saving
              ? "Saving..."
              : "💾 Save"}
          </button>

          {/* =========================
              PLAY BUTTON
          ========================= */}

          <button
            onClick={() => {
              if (!worldId) {
                setMessage(
                  "World ID is missing."
                );
                return;
              }

              router.push(
                `/play?world=${worldId}`
              );
            }}
            className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500 font-semibold"
          >
            ▶ Play
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">

        {/* LEFT TOOLBOX */}

        <aside className="w-64 bg-[#0b0f19] border-r border-white/10 p-4">
          <h2 className="font-bold text-lg">
            Toolbox
          </h2>

          <p className="text-xs text-gray-500 mt-1 mb-5">
            Build your world
          </p>

          <button
            onClick={addPart}
            className="w-full bg-blue-600 hover:bg-blue-500 rounded-xl py-3 font-bold"
          >
            ＋ Add Part
          </button>

          <div className="mt-5 grid grid-cols-2 gap-2">

            {/* PART */}

            <button
              onClick={addPart}
              className="bg-[#151b2a] hover:bg-[#20283a] rounded-xl p-4 text-center"
            >
              <div className="text-2xl">
                🧱
              </div>

              <div className="text-xs text-gray-400 mt-2">
                Part
              </div>
            </button>

            {/* TREE */}

            <button
              onClick={addTree}
              className="bg-[#151b2a] hover:bg-[#20283a] rounded-xl p-4 text-center"
            >
              <div className="text-2xl">
                🌳
              </div>

              <div className="text-xs text-gray-400 mt-2">
                Realistic Tree
              </div>
            </button>

            {/* MODEL */}

            <button
              onClick={() =>
                setMessage(
                  "Models coming soon."
                )
              }
              className="bg-[#151b2a] hover:bg-[#20283a] rounded-xl p-4 text-center"
            >
              <div className="text-2xl">
                🏠
              </div>

              <div className="text-xs text-gray-400 mt-2">
                Model
              </div>
            </button>

            {/* VEHICLE */}

            <button
              onClick={addVehicle}
              className="bg-[#151b2a] hover:bg-[#20283a] rounded-xl p-4 text-center"
            >
              <div className="text-2xl">
                🚗
              </div>

              <div className="text-xs text-gray-400 mt-2">
                Vehicle
              </div>
            </button>
          </div>

          <div className="mt-8 border-t border-white/10 pt-5">
            <h3 className="text-sm font-semibold">
              Controls
            </h3>

            <div className="text-xs text-gray-500 mt-3 space-y-2">
              <div>
                🖱 Drag — Camera
              </div>

              <div>
                🖱 Click — Select
              </div>

              <div>
                Delete — Delete
              </div>

              <div>
                ESC — Deselect
              </div>
            </div>
          </div>
        </aside>

        {/* 3D VIEWPORT */}

        <section className="flex-1 relative bg-[#111827]">
          <Canvas
            shadows
            camera={{
              position: [12, 10, 14],
              fov: 50,
            }}
            onPointerMissed={() =>
              setSelectedId(null)
            }
          >
            <color
              attach="background"
              args={["#111827"]}
            />

            <WorldScene
              objects={objects}
              selectedId={selectedId}
              tool={tool}
              onSelect={setSelectedId}
              onChange={updateObject}
            />
          </Canvas>

          {objects.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="bg-black/50 backdrop-blur border border-white/10 rounded-2xl px-8 py-6 text-center">
                <div className="text-4xl mb-2">
                  🌎
                </div>

                <h2 className="font-bold text-lg">
                  Empty World
                </h2>

                <p className="text-sm text-gray-400 mt-2">
                  Add Parts, Trees or Vehicles.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* RIGHT EXPLORER */}

        <aside className="w-72 bg-[#0b0f19] border-l border-white/10">

          <div className="p-4 border-b border-white/10">
            <h2 className="font-bold">
              Explorer
            </h2>
          </div>

          <div className="p-3">

            <div className="bg-[#151b2a] rounded-lg px-3 py-2 text-sm">
              🌎 {worldName}
            </div>

            <div className="mt-2 space-y-1">
              {objects.map(
                (object) => (
                  <button
                    key={object.id}
                    onClick={() =>
                      setSelectedId(
                        object.id
                      )
                    }
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      selectedId ===
                      object.id
                        ? "bg-blue-600/30 text-blue-300"
                        : "hover:bg-[#151b2a] text-gray-400"
                    }`}
                  >
                    {object.type ===
                    "tree"
                      ? "🌳"
                      : object.type ===
                        "vehicle"
                      ? "🚗"
                      : "🧱"}{" "}
                    {object.name}
                  </button>
                )
              )}

              {objects.length === 0 && (
                <div className="text-xs text-gray-600 px-3 py-3">
                  No objects
                </div>
              )}
            </div>
          </div>

          {/* PROPERTIES */}

          <div className="border-t border-white/10 p-4">

            <h2 className="font-bold mb-4">
              Properties
            </h2>

            {!selectedObject ? (
              <div className="text-sm text-gray-500">
                Select an object to edit its properties.
              </div>
            ) : (
              <div className="space-y-4">

                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    NAME
                  </div>

                  <div className="bg-[#151b2a] rounded-lg px-3 py-2 text-sm">
                    {selectedObject.name}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    TYPE
                  </div>

                  <div className="bg-[#151b2a] rounded-lg px-3 py-2 text-sm">
                    {selectedObject.type ===
                    "tree"
                      ? "🌳 Realistic Tree"
                      : selectedObject.type ===
                        "vehicle"
                      ? "🚗 Vehicle"
                      : "🧱 Part"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    POSITION
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    {selectedObject.position.map(
                      (value, index) => (
                        <div
                          key={index}
                          className="bg-[#151b2a] rounded-lg px-2 py-2 text-xs text-gray-400"
                        >
                          {value.toFixed(2)}
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    SCALE
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    {selectedObject.scale.map(
                      (value, index) => (
                        <div
                          key={index}
                          className="bg-[#151b2a] rounded-lg px-2 py-2 text-xs text-gray-400"
                        >
                          {value.toFixed(2)}
                        </div>
                      )
                    )}
                  </div>
                </div>

                <button
                  onClick={
                    duplicateSelected
                  }
                  className="w-full bg-[#151b2a] hover:bg-[#20283a] rounded-lg py-2 text-sm"
                >
                  Duplicate
                </button>

                <button
                  onClick={
                    deleteSelected
                  }
                  className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg py-2 text-sm"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}