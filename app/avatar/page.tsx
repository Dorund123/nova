"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  RoundedBox,
} from "@react-three/drei";
import * as THREE from "three";

type Gender = "boy" | "girl";

type AvatarSettings = {
  gender: Gender;
  height: number;
  hairColor: string;
};

const hairColors = [
  "#111111",
  "#4a2a1a",
  "#d4a05a",
  "#9b3f26",
  "#e7e7e7",
];

function Hair({
  gender,
  color,
}: {
  gender: Gender;
  color: string;
}) {
  if (gender === "boy") {
    return (
      <group>
        {/* TOP HAIR */}
        <mesh
          position={[0, 3.35, -0.08]}
          scale={[1.02, 0.62, 0.98]}
        >
          <sphereGeometry args={[0.68, 36, 26]} />
          <meshStandardMaterial
            color={color}
            roughness={0.55}
          />
        </mesh>

        {/* FRONT HAIR */}
        {[-0.28, 0, 0.28].map((x) => (
          <mesh
            key={x}
            position={[x, 3.16, 0.42]}
            rotation={[-0.15, 0, x * 0.2]}
          >
            <sphereGeometry args={[0.15, 20, 16]} />
            <meshStandardMaterial
              color={color}
              roughness={0.55}
            />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group>
      {/* GIRL TOP HAIR */}
      <mesh
        position={[0, 3.35, -0.08]}
        scale={[1.04, 0.66, 1]}
      >
        <sphereGeometry args={[0.7, 36, 26]} />
        <meshStandardMaterial
          color={color}
          roughness={0.55}
        />
      </mesh>

      {/* LEFT LONG HAIR */}
      <mesh
        position={[-0.52, 2.65, -0.12]}
        scale={[0.75, 1.45, 0.68]}
      >
        <sphereGeometry args={[0.35, 26, 26]} />
        <meshStandardMaterial
          color={color}
          roughness={0.55}
        />
      </mesh>

      {/* RIGHT LONG HAIR */}
      <mesh
        position={[0.52, 2.65, -0.12]}
        scale={[0.75, 1.45, 0.68]}
      >
        <sphereGeometry args={[0.35, 26, 26]} />
        <meshStandardMaterial
          color={color}
          roughness={0.55}
        />
      </mesh>

      {/* FRONT HAIR */}
      {[-0.28, 0, 0.28].map((x) => (
        <mesh
          key={x}
          position={[x, 3.12, 0.42]}
        >
          <sphereGeometry args={[0.16, 20, 16]} />
          <meshStandardMaterial
            color={color}
            roughness={0.55}
          />
        </mesh>
      ))}
    </group>
  );
}

function Face({
  gender,
  skin,
}: {
  gender: Gender;
  skin: string;
}) {
  return (
    <group>
      {/* EARS */}
      <mesh position={[-0.7, 3.0, 0]}>
        <sphereGeometry args={[0.12, 20, 20]} />
        <meshStandardMaterial color={skin} />
      </mesh>

      <mesh position={[0.7, 3.0, 0]}>
        <sphereGeometry args={[0.12, 20, 20]} />
        <meshStandardMaterial color={skin} />
      </mesh>

      {/* BIG SOFT EYES */}
      <mesh position={[-0.22, 3.09, 0.67]}>
        <sphereGeometry args={[0.095, 28, 28]} />
        <meshStandardMaterial color="#111111" />
      </mesh>

      <mesh position={[0.22, 3.09, 0.67]}>
        <sphereGeometry args={[0.095, 28, 28]} />
        <meshStandardMaterial color="#111111" />
      </mesh>

      {/* EYE HIGHLIGHTS */}
      <mesh position={[-0.19, 3.13, 0.745]}>
        <sphereGeometry args={[0.028, 14, 14]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      <mesh position={[0.25, 3.13, 0.745]}>
        <sphereGeometry args={[0.028, 14, 14]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* EYEBROWS */}
      <RoundedBox
        position={[-0.22, 3.29, 0.63]}
        args={[0.25, 0.035, 0.03]}
        radius={0.01}
        smoothness={3}
        rotation={[0, 0, -0.05]}
      >
        <meshStandardMaterial color="#4a3024" />
      </RoundedBox>

      <RoundedBox
        position={[0.22, 3.29, 0.63]}
        args={[0.25, 0.035, 0.03]}
        radius={0.01}
        smoothness={3}
        rotation={[0, 0, 0.05]}
      >
        <meshStandardMaterial color="#4a3024" />
      </RoundedBox>

      {/* SMALL NOSE */}
      <mesh position={[0, 2.94, 0.69]}>
        <sphereGeometry args={[0.055, 20, 20]} />
        <meshStandardMaterial color={skin} />
      </mesh>

      {/* NOSE TIP */}
      <mesh position={[0, 2.91, 0.73]}>
        <sphereGeometry args={[0.038, 16, 16]} />
        <meshStandardMaterial color={skin} />
      </mesh>

      {/* LIPS */}
      <RoundedBox
        position={[0, 2.75, 0.665]}
        args={[
          gender === "girl" ? 0.24 : 0.22,
          0.045,
          0.03,
        ]}
        radius={0.018}
        smoothness={4}
      >
        <meshStandardMaterial
          color={
            gender === "girl"
              ? "#b85c72"
              : "#a45465"
          }
          roughness={0.5}
        />
      </RoundedBox>

      {/* LOWER LIP */}
      <RoundedBox
        position={[0, 2.72, 0.67]}
        args={[0.14, 0.025, 0.025]}
        radius={0.012}
        smoothness={3}
      >
        <meshStandardMaterial
          color={
            gender === "girl"
              ? "#c66a7e"
              : "#b25b6c"
          }
          roughness={0.5}
        />
      </RoundedBox>

      {/* CHEEKS */}
      <mesh position={[-0.34, 2.87, 0.58]}>
        <sphereGeometry args={[0.11, 18, 18]} />
        <meshStandardMaterial
          color="#e9a7a0"
          transparent
          opacity={0.16}
        />
      </mesh>

      <mesh position={[0.34, 2.87, 0.58]}>
        <sphereGeometry args={[0.11, 18, 18]} />
        <meshStandardMaterial
          color="#e9a7a0"
          transparent
          opacity={0.16}
        />
      </mesh>
    </group>
  );
}

function Character({
  settings,
}: {
  settings: AvatarSettings;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;

    group.current.position.y =
      Math.sin(clock.getElapsedTime() * 1.3) * 0.02;
  });

  const isGirl = settings.gender === "girl";

  const skin = isGirl
    ? "#f0c3a4"
    : "#d89a73";

  const shirt = isGirl
    ? "#ec4899"
    : "#2563eb";

  const pants = isGirl
    ? "#334155"
    : "#111827";

  const h = settings.height;

  /*
    BODY LAYOUT
    ფეხიდან ზემოთ ყველაფერი ერთმანეთზეა მიბმული
  */

  const shoeY = 0.05;

  const legHeight = 1.28 * h;
  const legY = shoeY + 0.11 + legHeight / 2;

  const bodyHeight = 1.18 * h;
  const bodyY =
    shoeY +
    0.11 +
    legHeight +
    bodyHeight / 2;

  const shoulderY =
    bodyY +
    bodyHeight / 2 -
    0.08;

  const armHeight = 0.98 * h;

  const neckY =
    bodyY +
    bodyHeight / 2 +
    0.16;

  const headY =
    neckY + 0.42;

  /*
    Face და Hair ჩვეულებრივ 3.0-ის გარშემო იყო.
    აქ მთელ group-ს ვწევთ headY-ს შესაბამისად,
    რათა height შეცვლისას სახე/თმაც სწორ ადგილზე დარჩეს.
  */

  const faceOffsetY = headY - 3.0;

  return (
    <group
      ref={group}
      position={[0, -1.95, 0]}
    >
      {/* LEFT SHOE */}
      <RoundedBox
        position={[-0.27, shoeY, 0.12]}
        args={[0.55, 0.22, 0.78]}
        radius={0.09}
        smoothness={5}
      >
        <meshStandardMaterial
          color="#f5f5f5"
          roughness={0.42}
        />
      </RoundedBox>

      {/* RIGHT SHOE */}
      <RoundedBox
        position={[0.27, shoeY, 0.12]}
        args={[0.55, 0.22, 0.78]}
        radius={0.09}
        smoothness={5}
      >
        <meshStandardMaterial
          color="#f5f5f5"
          roughness={0.42}
        />
      </RoundedBox>

      {/* LEFT LEG */}
      <RoundedBox
        position={[-0.27, legY, 0]}
        args={[
          isGirl ? 0.42 : 0.48,
          legHeight,
          0.48,
        ]}
        radius={0.11}
        smoothness={6}
      >
        <meshStandardMaterial
          color={pants}
          roughness={0.78}
        />
      </RoundedBox>

      {/* RIGHT LEG */}
      <RoundedBox
        position={[0.27, legY, 0]}
        args={[
          isGirl ? 0.42 : 0.48,
          legHeight,
          0.48,
        ]}
        radius={0.11}
        smoothness={6}
      >
        <meshStandardMaterial
          color={pants}
          roughness={0.78}
        />
      </RoundedBox>

      {/* WAIST */}
      <RoundedBox
        position={[
          0,
          shoeY +
            0.11 +
            legHeight +
            0.08,
          0,
        ]}
        args={[
          isGirl ? 0.9 : 1.05,
          0.18,
          0.68,
        ]}
        radius={0.07}
        smoothness={4}
      >
        <meshStandardMaterial
          color={pants}
          roughness={0.8}
        />
      </RoundedBox>

      {/* BODY */}
      <RoundedBox
        position={[0, bodyY, 0]}
        args={[
          isGirl ? 1.08 : 1.32,
          bodyHeight,
          0.74,
        ]}
        radius={0.2}
        smoothness={7}
      >
        <meshStandardMaterial
          color={shirt}
          roughness={0.68}
        />
      </RoundedBox>

      {/* LEFT ARM */}
      <RoundedBox
        position={[
          -0.84,
          shoulderY - 0.13,
          0,
        ]}
        args={[0.3, armHeight, 0.34]}
        radius={0.12}
        smoothness={6}
        rotation={[0, 0, -0.05]}
      >
        <meshStandardMaterial
          color={skin}
          roughness={0.72}
        />
      </RoundedBox>

      {/* RIGHT ARM */}
      <RoundedBox
        position={[
          0.84,
          shoulderY - 0.13,
          0,
        ]}
        args={[0.3, armHeight, 0.34]}
        radius={0.12}
        smoothness={6}
        rotation={[0, 0, 0.05]}
      >
        <meshStandardMaterial
          color={skin}
          roughness={0.72}
        />
      </RoundedBox>

      {/* LEFT HAND */}
      <mesh
        position={[
          -0.84,
          shoulderY -
            0.13 -
            armHeight / 2 -
            0.09,
          0,
        ]}
      >
        <sphereGeometry args={[0.18, 20, 20]} />
        <meshStandardMaterial color={skin} />
      </mesh>

      {/* RIGHT HAND */}
      <mesh
        position={[
          0.84,
          shoulderY -
            0.13 -
            armHeight / 2 -
            0.09,
          0,
        ]}
      >
        <sphereGeometry args={[0.18, 20, 20]} />
        <meshStandardMaterial color={skin} />
      </mesh>

      {/* NECK */}
      <mesh position={[0, neckY, 0]}>
        <cylinderGeometry
          args={[0.2, 0.2, 0.28, 24]}
        />
        <meshStandardMaterial
          color={skin}
          roughness={0.72}
        />
      </mesh>

      {/* HEAD */}
      <mesh
        position={[0, headY, 0]}
        scale={[
          isGirl ? 0.98 : 1,
          1.08,
          0.98,
        ]}
      >
        <sphereGeometry
          args={[0.68, 40, 32]}
        />
        <meshStandardMaterial
          color={skin}
          roughness={0.68}
        />
      </mesh>

      {/* FACE */}
      <group position={[0, faceOffsetY, 0]}>
        <Face
          gender={settings.gender}
          skin={skin}
        />
      </group>

      {/* HAIR */}
      <group position={[0, faceOffsetY, 0]}>
        <Hair
          gender={settings.gender}
          color={settings.hairColor}
        />
      </group>
    </group>
  );
}

export default function AvatarPage() {
  const [settings, setSettings] =
    useState<AvatarSettings>({
      gender: "boy",
      height: 1,
      hairColor: "#111111",
    });

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_380px]">

        {/* 3D VIEW */}
        <section className="relative min-h-[720px] overflow-hidden bg-[radial-gradient(circle_at_top,#4168ad_0%,#1b2b49_42%,#060911_100%)]">

          <div className="absolute left-7 top-7 z-20">
            <div className="text-4xl font-black">
              Nova
              <span className="text-blue-500">
                .
              </span>
            </div>

            <div className="mt-1 text-sm text-white/45">
              Avatar Studio
            </div>
          </div>

          <div className="absolute right-7 top-7 z-20 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs text-white/55 backdrop-blur-md">
            Drag to rotate • Scroll to zoom
          </div>

          <Canvas
            shadows
            camera={{
              position: [0, 0.8, 7.8],
              fov: 40,
            }}
          >
            <ambientLight intensity={1.5} />

            <directionalLight
              position={[4, 7, 5]}
              intensity={3.2}
              castShadow
            />

            <directionalLight
              position={[-4, 3, 2]}
              intensity={1.2}
            />

            <Environment preset="city" />

            <Character settings={settings} />

            <ContactShadows
              position={[0, -1.96, 0]}
              opacity={0.45}
              scale={6.5}
              blur={2.4}
              far={4}
            />

            <OrbitControls
              enablePan={false}
              target={[0, 0.55, 0]}
              minDistance={5}
              maxDistance={9.5}
              minPolarAngle={Math.PI / 2.35}
              maxPolarAngle={Math.PI / 1.55}
            />
          </Canvas>
        </section>

        {/* PANEL */}
        <aside className="border-l border-white/10 bg-[#101827] p-7">

          <h1 className="text-2xl font-black">
            Nova Avatar
          </h1>

          <p className="mt-1 text-sm text-white/45">
            Customize your character.
          </p>

          {/* CHARACTER */}
          <div className="mt-8">
            <div className="mb-3 text-sm font-bold">
              Character
            </div>

            <div className="grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={() =>
                  setSettings((current) => ({
                    ...current,
                    gender: "boy",
                  }))
                }
                className={`rounded-2xl border p-5 text-left transition ${
                  settings.gender === "boy"
                    ? "border-blue-400 bg-blue-500/15"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="text-4xl">
                  👨
                </div>

                <div className="mt-3 font-bold">
                  Boy
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setSettings((current) => ({
                    ...current,
                    gender: "girl",
                  }))
                }
                className={`rounded-2xl border p-5 text-left transition ${
                  settings.gender === "girl"
                    ? "border-pink-400 bg-pink-500/15"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="text-4xl">
                  👩
                </div>

                <div className="mt-3 font-bold">
                  Girl
                </div>
              </button>

            </div>
          </div>

          {/* HEIGHT */}
          <div className="mt-8">
            <div className="mb-3 flex justify-between">

              <span className="text-sm font-bold">
                Height
              </span>

              <span className="text-xs text-white/50">
                {Math.round(
                  settings.height * 100
                )}
                %
              </span>

            </div>

            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.01"
              value={settings.height}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  height: Number(
                    event.target.value
                  ),
                }))
              }
              className="w-full cursor-pointer accent-blue-500"
            />

            <div className="mt-2 flex justify-between text-xs text-white/35">
              <span>Short</span>
              <span>Tall</span>
            </div>
          </div>

          {/* HAIR COLOR */}
          <div className="mt-8">
            <div className="mb-3 text-sm font-bold">
              Hair Color
            </div>

            <div className="grid grid-cols-5 gap-2">
              {hairColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      hairColor: color,
                    }))
                  }
                  className={`h-11 rounded-xl border-2 transition ${
                    settings.hairColor === color
                      ? "scale-105 border-white"
                      : "border-white/10 hover:border-white/30"
                  }`}
                  style={{
                    backgroundColor: color,
                  }}
                >
                  {settings.hairColor ===
                    color && (
                    <span className="text-sm font-black text-white">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}