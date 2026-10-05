"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  RoundedBox,
} from "@react-three/drei";
import * as THREE from "three";

type Gender = "boy" | "girl";
type HairStyle = "boyHair" | "girlHair";

type AvatarSettings = {
  gender: Gender;
  hair: HairStyle;
  skin: string;
  shirt: string;
  pants: string;
};

const SKIN_COLORS = [
  "#f1c7a5",
  "#d99b72",
  "#b96f48",
  "#8d512f",
];

const SHIRT_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#ef4444",
  "#16a34a",
  "#111827",
];

const PANTS_COLORS = [
  "#111827",
  "#1e3a8a",
  "#374151",
  "#4b5563",
];

function Hair({
  style,
  color,
}: {
  style: HairStyle;
  color: string;
}) {
  if (style === "boyHair") {
    return (
      <group position={[0, 2.36, 0]}>
        <mesh position={[0, 0.08, -0.02]}>
          <sphereGeometry args={[0.59, 32, 24]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>

        <mesh position={[0, -0.04, 0.5]}>
          <boxGeometry args={[0.82, 0.22, 0.18]} />
          <meshStandardMaterial color={color} roughness={0.75} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[0, 2.28, -0.02]}>
      <mesh position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.61, 32, 24]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>

      <mesh position={[-0.43, -0.22, -0.02]}>
        <capsuleGeometry args={[0.2, 0.9, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>

      <mesh position={[0.43, -0.22, -0.02]}>
        <capsuleGeometry args={[0.2, 0.9, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
    </group>
  );
}

function Face() {
  return (
    <group position={[0, 2.18, 0.52]}>
      {/* Eyes */}
      <mesh position={[-0.17, 0.06, 0]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color="#111111" roughness={0.4} />
      </mesh>

      <mesh position={[0.17, 0.06, 0]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color="#111111" roughness={0.4} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, -0.05, 0.03]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial color="#d89a72" roughness={0.7} />
      </mesh>

      {/* Mouth */}
      <mesh position={[0, -0.16, 0]}>
        <boxGeometry args={[0.12, 0.02, 0.02]} />
        <meshStandardMaterial color="#7f1d1d" />
      </mesh>
    </group>
  );
}

function Character({
  settings,
}: {
  settings: AvatarSettings;
}) {
  const hairColor = "#171717";

  const armX = settings.gender === "girl" ? 0.84 : 0.9;

  return (
    <group position={[0, -1.35, 0]}>
      {/* Legs */}
      <RoundedBox
        args={[0.38, 1.05, 0.4]}
        radius={0.09}
        smoothness={4}
        position={[-0.23, 0.55, 0]}
      >
        <meshStandardMaterial
          color={settings.pants}
          roughness={0.8}
        />
      </RoundedBox>

      <RoundedBox
        args={[0.38, 1.05, 0.4]}
        radius={0.09}
        smoothness={4}
        position={[0.23, 0.55, 0]}
      >
        <meshStandardMaterial
          color={settings.pants}
          roughness={0.8}
        />
      </RoundedBox>

      {/* Shoes */}
      <RoundedBox
        args={[0.48, 0.2, 0.62]}
        radius={0.08}
        smoothness={4}
        position={[-0.23, 0.03, 0.08]}
      >
        <meshStandardMaterial color="#f5f5f5" roughness={0.7} />
      </RoundedBox>

      <RoundedBox
        args={[0.48, 0.2, 0.62]}
        radius={0.08}
        smoothness={4}
        position={[0.23, 0.03, 0.08]}
      >
        <meshStandardMaterial color="#f5f5f5" roughness={0.7} />
      </RoundedBox>

      {/* Body */}
      <RoundedBox
        args={[
          settings.gender === "girl" ? 1.14 : 1.24,
          1.2,
          0.62,
        ]}
        radius={0.18}
        smoothness={5}
        position={[0, 1.45, 0]}
      >
        <meshStandardMaterial
          color={settings.shirt}
          roughness={0.72}
        />
      </RoundedBox>

      {/* Arms */}
      <RoundedBox
        args={[0.28, 1.0, 0.3]}
        radius={0.11}
        smoothness={4}
        rotation={[0, 0, -0.08]}
        position={[-armX, 1.42, 0]}
      >
        <meshStandardMaterial
          color={settings.skin}
          roughness={0.78}
        />
      </RoundedBox>

      <RoundedBox
        args={[0.28, 1.0, 0.3]}
        radius={0.11}
        smoothness={4}
        rotation={[0, 0, 0.08]}
        position={[armX, 1.42, 0]}
      >
        <meshStandardMaterial
          color={settings.skin}
          roughness={0.78}
        />
      </RoundedBox>

      {/* Hands */}
      <mesh position={[-armX, 0.88, 0]}>
        <sphereGeometry args={[0.17, 20, 20]} />
        <meshStandardMaterial
          color={settings.skin}
          roughness={0.78}
        />
      </mesh>

      <mesh position={[armX, 0.88, 0]}>
        <sphereGeometry args={[0.17, 20, 20]} />
        <meshStandardMaterial
          color={settings.skin}
          roughness={0.78}
        />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 2.03, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.25, 24]} />
        <meshStandardMaterial
          color={settings.skin}
          roughness={0.75}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 2.34, 0]}>
        <sphereGeometry args={[0.59, 32, 24]} />
        <meshStandardMaterial
          color={settings.skin}
          roughness={0.72}
        />
      </mesh>

      <Face />

      <Hair
        style={settings.hair}
        color={hairColor}
      />
    </group>
  );
}

export default function AvatarPage() {
  const [settings, setSettings] = useState<AvatarSettings>({
    gender: "boy",
    hair: "boyHair",
    skin: SKIN_COLORS[0],
    shirt: SHIRT_COLORS[0],
    pants: PANTS_COLORS[0],
  });

  const currentHair = useMemo(() => {
    return settings.gender === "boy" ? "boyHair" : "girlHair";
  }, [settings.gender]);

  function chooseGender(gender: Gender) {
    setSettings((current) => ({
      ...current,
      gender,
      hair: gender === "boy" ? "boyHair" : "girlHair",
    }));
  }

  function saveAvatar() {
    localStorage.setItem(
      "nova_avatar",
      JSON.stringify(settings)
    );

    alert("Nova Avatar saved ✅");
  }

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1500px] grid-cols-1 lg:grid-cols-[1fr_380px]">
        {/* 3D VIEW */}
        <section className="relative min-h-[650px] overflow-hidden bg-[radial-gradient(circle_at_top,#243b70_0%,#10172c_42%,#070b16_100%)]">
          <div className="absolute left-6 top-6 z-10">
            <div className="text-3xl font-black tracking-tight">
              Nova<span className="text-blue-400">.</span>
            </div>

            <div className="mt-1 text-sm text-white/50">
              Avatar Studio
            </div>
          </div>

          <div className="absolute right-6 top-6 z-10 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60 backdrop-blur">
            Drag to rotate • Scroll to zoom
          </div>

          <Canvas
            camera={{
              position: [0, 1.2, 6.5],
              fov: 35,
            }}
          >
            <ambientLight intensity={1.6} />

            <directionalLight
              position={[4, 6, 5]}
              intensity={3}
            />

            <directionalLight
              position={[-4, 3, 2]}
              intensity={1.2}
            />

            <Environment preset="city" />

            <Character settings={settings} />

            <ContactShadows
              position={[0, -1.28, 0]}
              opacity={0.45}
              scale={7}
              blur={2.5}
              far={4}
            />

            <OrbitControls
              enablePan={false}
              minDistance={4.2}
              maxDistance={8}
              minPolarAngle={Math.PI / 2.5}
              maxPolarAngle={Math.PI / 1.7}
            />
          </Canvas>

          <div className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-black/25 px-5 py-2 text-xs text-white/50 backdrop-blur">
            Your Nova character
          </div>
        </section>

        {/* CONTROLS */}
        <section className="border-l border-white/10 bg-[#111827] p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-black">
              Customize Avatar
            </h1>

            <p className="mt-1 text-sm text-white/50">
              Create your own Nova character.
            </p>
          </div>

          {/* Gender */}
          <div className="mt-8">
            <div className="mb-3 text-sm font-bold text-white/80">
              Character
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => chooseGender("boy")}
                className={`rounded-2xl border p-4 text-left transition ${
                  settings.gender === "boy"
                    ? "border-blue-400 bg-blue-500/15"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="text-2xl">👦</div>
                <div className="mt-2 font-bold">
                  Boy
                </div>
              </button>

              <button
                onClick={() => chooseGender("girl")}
                className={`rounded-2xl border p-4 text-left transition ${
                  settings.gender === "girl"
                    ? "border-pink-400 bg-pink-500/15"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="text-2xl">👧</div>
                <div className="mt-2 font-bold">
                  Girl
                </div>
              </button>
            </div>
          </div>

          {/* Hair */}
          <div className="mt-7">
            <div className="mb-3 text-sm font-bold text-white/80">
              Hair
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-bold">
                {settings.hair === "boyHair"
                  ? "Boy Hair"
                  : "Girl Hair"}
              </div>

              <div className="mt-1 text-xs text-white/45">
                Hair automatically changes with your character.
              </div>

              <div className="mt-4 flex gap-2">
                <div className="h-10 w-10 rounded-xl bg-[#171717]" />
                <div className="h-10 w-10 rounded-xl bg-[#4b2e20]" />
                <div className="h-10 w-10 rounded-xl bg-[#7c4a2d]" />
              </div>
            </div>
          </div>

          {/* Skin */}
          <div className="mt-7">
            <div className="mb-3 text-sm font-bold text-white/80">
              Skin
            </div>

            <div className="flex flex-wrap gap-3">
              {SKIN_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      skin: color,
                    }))
                  }
                  className={`h-11 w-11 rounded-full border-2 transition ${
                    settings.skin === color
                      ? "scale-110 border-white"
                      : "border-white/10"
                  }`}
                  style={{
                    backgroundColor: color,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Shirt */}
          <div className="mt-7">
            <div className="mb-3 text-sm font-bold text-white/80">
              Shirt
            </div>

            <div className="flex flex-wrap gap-3">
              {SHIRT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      shirt: color,
                    }))
                  }
                  className={`h-10 w-10 rounded-xl border-2 transition ${
                    settings.shirt === color
                      ? "scale-110 border-white"
                      : "border-white/10"
                  }`}
                  style={{
                    backgroundColor: color,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Pants */}
          <div className="mt-7">
            <div className="mb-3 text-sm font-bold text-white/80">
              Pants
            </div>

            <div className="flex flex-wrap gap-3">
              {PANTS_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      pants: color,
                    }))
                  }
                  className={`h-10 w-10 rounded-xl border-2 transition ${
                    settings.pants === color
                      ? "scale-110 border-white"
                      : "border-white/10"
                  }`}
                  style={{
                    backgroundColor: color,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Save */}
          <button
            onClick={saveAvatar}
            className="mt-10 w-full rounded-2xl bg-blue-600 px-5 py-4 font-black transition hover:bg-blue-500 active:scale-[0.98]"
          >
            Save Avatar
          </button>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-5 text-white/45">
            Your current avatar settings are saved in this
            browser. Later we can connect this directly to
            your Nova Supabase profile.
          </div>
        </section>
      </div>
    </main>
  );
}