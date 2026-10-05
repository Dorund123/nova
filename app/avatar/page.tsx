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
  { name: "Black", value: "#111111" },
  { name: "Brown", value: "#4a2a1a" },
  { name: "Blonde", value: "#d4a05a" },
  { name: "Red", value: "#9b3f26" },
  { name: "White", value: "#e7e7e7" },
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
          position={[0, 3.34, -0.04]}
          scale={[1.04, 0.7, 1]}
        >
          <sphereGeometry args={[0.72, 40, 28]} />
          <meshStandardMaterial
            color={color}
            roughness={0.55}
          />
        </mesh>

        {/* FRONT SPIKES */}
        {[-0.36, -0.12, 0.12, 0.36].map(
          (x, index) => (
            <mesh
              key={index}
              position={[x, 3.15, 0.48]}
              rotation={[
                -0.45,
                0,
                x * 0.4,
              ]}
            >
              <coneGeometry
                args={[0.16, 0.42, 14]}
              />
              <meshStandardMaterial
                color={color}
                roughness={0.55}
              />
            </mesh>
          )
        )}

        {/* SIDE HAIR */}
        <mesh
          position={[-0.56, 3.06, 0.05]}
          scale={[0.35, 0.7, 0.5]}
        >
          <sphereGeometry args={[0.26, 24, 20]} />
          <meshStandardMaterial color={color} />
        </mesh>

        <mesh
          position={[0.56, 3.06, 0.05]}
          scale={[0.35, 0.7, 0.5]}
        >
          <sphereGeometry args={[0.26, 24, 20]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {/* GIRL TOP HAIR */}
      <mesh
        position={[0, 3.34, -0.05]}
        scale={[1.06, 0.74, 1]}
      >
        <sphereGeometry args={[0.74, 40, 28]} />
        <meshStandardMaterial
          color={color}
          roughness={0.55}
        />
      </mesh>

      {/* LEFT LONG HAIR */}
      <mesh
        position={[-0.57, 2.55, -0.06]}
        scale={[0.78, 1.55, 0.72]}
      >
        <sphereGeometry args={[0.36, 28, 28]} />
        <meshStandardMaterial
          color={color}
          roughness={0.55}
        />
      </mesh>

      {/* RIGHT LONG HAIR */}
      <mesh
        position={[0.57, 2.55, -0.06]}
        scale={[0.78, 1.55, 0.72]}
      >
        <sphereGeometry args={[0.36, 28, 28]} />
        <meshStandardMaterial
          color={color}
          roughness={0.55}
        />
      </mesh>

      {/* BANGS */}
      {[-0.3, 0, 0.3].map((x, index) => (
        <mesh
          key={index}
          position={[x, 3.15, 0.46]}
          scale={[
            0.85,
            1,
            0.7,
          ]}
        >
          <sphereGeometry args={[0.18, 24, 18]} />
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
  headY,
  skin,
}: {
  gender: Gender;
  headY: number;
  skin: string;
}) {
  const eyeSize = gender === "girl" ? 0.085 : 0.075;

  return (
    <group>
      {/* EARS */}
      <mesh position={[-0.7, headY, 0]}>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial color={skin} />
      </mesh>

      <mesh position={[0.7, headY, 0]}>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial color={skin} />
      </mesh>

      {/* EYES */}
      <mesh
        position={[-0.22, headY + 0.08, 0.66]}
      >
        <sphereGeometry args={[eyeSize, 24, 24]} />
        <meshStandardMaterial color="#111111" />
      </mesh>

      <mesh
        position={[0.22, headY + 0.08, 0.66]}
      >
        <sphereGeometry args={[eyeSize, 24, 24]} />
        <meshStandardMaterial color="#111111" />
      </mesh>

      {/* EYE HIGHLIGHTS */}
      <mesh
        position={[-0.19, headY + 0.11, 0.72]}
      >
        <sphereGeometry args={[0.023, 12, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      <mesh
        position={[0.25, headY + 0.11, 0.72]}
      >
        <sphereGeometry args={[0.023, 12, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* EYEBROWS */}
      <RoundedBox
        position={[-0.22, headY + 0.28, 0.63]}
        args={[0.24, 0.045, 0.035]}
        radius={0.012}
        smoothness={2}
        rotation={[0, 0, -0.1]}
      >
        <meshStandardMaterial color="#362318" />
      </RoundedBox>

      <RoundedBox
        position={[0.22, headY + 0.28, 0.63]}
        args={[0.24, 0.045, 0.035]}
        radius={0.012}
        smoothness={2}
        rotation={[0, 0, 0.1]}
      >
        <meshStandardMaterial color="#362318" />
      </RoundedBox>

      {/* NOSE */}
      <mesh position={[0, headY - 0.03, 0.69]}>
        <sphereGeometry args={[0.075, 18, 18]} />
        <meshStandardMaterial color={skin} />
      </mesh>

      {/* MOUTH */}
      <RoundedBox
        position={[0, headY - 0.22, 0.65]}
        args={[
          gender === "girl" ? 0.18 : 0.21,
          0.04,
          0.025,
        ]}
        radius={0.012}
        smoothness={2}
      >
        <meshStandardMaterial
          color={
            gender === "girl"
              ? "#a94668"
              : "#87444d"
          }
        />
      </RoundedBox>
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

    const t = clock.getElapsedTime();

    group.current.rotation.y =
      Math.sin(t * 0.45) * 0.03;
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

  const legHeight = 1.38 * h;
  const bodyHeight = 1.32 * h;
  const armHeight = 1.15 * h;

  const legY =
    0.08 + legHeight / 2;

  const waistY =
    0.08 + legHeight + 0.12;

  const bodyY =
    waistY + 0.1 + bodyHeight / 2;

  const shoulderY =
    bodyY + bodyHeight / 2 - 0.15;

  const neckY =
    bodyY + bodyHeight / 2 + 0.12;

  const headY =
    neckY + 0.42;

  return (
    <group
      ref={group}
      position={[0, -2.15, 0]}
      scale={[1, 1, 1]}
    >
      {/* SHOES */}
      <RoundedBox
        position={[-0.27, 0.04, 0.12]}
        args={[0.56, 0.25, 0.82]}
        radius={0.1}
        smoothness={6}
      >
        <meshStandardMaterial
          color="#f5f5f5"
          roughness={0.4}
        />
      </RoundedBox>

      <RoundedBox
        position={[0.27, 0.04, 0.12]}
        args={[0.56, 0.25, 0.82]}
        radius={0.1}
        smoothness={6}
      >
        <meshStandardMaterial
          color="#f5f5f5"
          roughness={0.4}
        />
      </RoundedBox>

      {/* LEGS */}
      <RoundedBox
        position={[-0.27, legY, 0]}
        args={[
          isGirl ? 0.42 : 0.48,
          legHeight,
          0.48,
        ]}
        radius={0.12}
        smoothness={6}
      >
        <meshStandardMaterial
          color={pants}
          roughness={0.78}
        />
      </RoundedBox>

      <RoundedBox
        position={[0.27, legY, 0]}
        args={[
          isGirl ? 0.42 : 0.48,
          legHeight,
          0.48,
        ]}
        radius={0.12}
        smoothness={6}
      >
        <meshStandardMaterial
          color={pants}
          roughness={0.78}
        />
      </RoundedBox>

      {/* WAIST */}
      <RoundedBox
        position={[0, waistY, 0]}
        args={[
          isGirl ? 0.9 : 1.06,
          0.2,
          0.7,
        ]}
        radius={0.08}
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
          isGirl ? 1.12 : 1.38,
          bodyHeight,
          0.76,
        ]}
        radius={0.22}
        smoothness={8}
      >
        <meshStandardMaterial
          color={shirt}
          roughness={0.67}
        />
      </RoundedBox>

      {/* BOY SHOULDERS */}
      {!isGirl && (
        <>
          <RoundedBox
            position={[-0.68, shoulderY, 0]}
            args={[0.35, 0.32, 0.68]}
            radius={0.12}
            smoothness={5}
            rotation={[0, 0, -0.12]}
          >
            <meshStandardMaterial color={shirt} />
          </RoundedBox>

          <RoundedBox
            position={[0.68, shoulderY, 0]}
            args={[0.35, 0.32, 0.68]}
            radius={0.12}
            smoothness={5}
            rotation={[0, 0, 0.12]}
          >
            <meshStandardMaterial color={shirt} />
          </RoundedBox>
        </>
      )}

      {/* ARMS */}
      <RoundedBox
        position={[-0.91, shoulderY - 0.18, 0]}
        args={[0.31, armHeight, 0.36]}
        radius={0.13}
        smoothness={6}
        rotation={[0, 0, -0.05]}
      >
        <meshStandardMaterial
          color={skin}
          roughness={0.72}
        />
      </RoundedBox>

      <RoundedBox
        position={[0.91, shoulderY - 0.18, 0]}
        args={[0.31, armHeight, 0.36]}
        radius={0.13}
        smoothness={6}
        rotation={[0, 0, 0.05]}
      >
        <meshStandardMaterial
          color={skin}
          roughness={0.72}
        />
      </RoundedBox>

      {/* HANDS */}
      <mesh
        position={[
          -0.91,
          shoulderY -
            0.18 -
            armHeight / 2 -
            0.1,
          0,
        ]}
      >
        <sphereGeometry args={[0.19, 22, 22]} />
        <meshStandardMaterial color={skin} />
      </mesh>

      <mesh
        position={[
          0.91,
          shoulderY -
            0.18 -
            armHeight / 2 -
            0.1,
          0,
        ]}
      >
        <sphereGeometry args={[0.19, 22, 22]} />
        <meshStandardMaterial color={skin} />
      </mesh>

      {/* NECK */}
      <mesh position={[0, neckY, 0]}>
        <cylinderGeometry
          args={[0.21, 0.21, 0.3, 24]}
        />
        <meshStandardMaterial color={skin} />
      </mesh>

      {/* HEAD */}
      <mesh
        position={[0, headY, 0]}
        scale={[
          isGirl ? 0.98 : 1,
          1.09,
          0.98,
        ]}
      >
        <sphereGeometry
          args={[0.7, 42, 34]}
        />
        <meshStandardMaterial
          color={skin}
          roughness={0.66}
        />
      </mesh>

      <Face
        gender={settings.gender}
        headY={headY}
        skin={skin}
      />

      {/* HAIR */}
      <group
        position={[
          0,
          headY - 3.0,
          0,
        ]}
      >
        <Hair
          gender={settings.gender}
          color={settings.hairColor}
        />
      </group>

      {/* BOY HOODIE DETAIL */}
      {!isGirl && (
        <>
          <RoundedBox
            position={[0, bodyY - 0.15, 0.41]}
            args={[0.55, 0.18, 0.06]}
            radius={0.04}
            smoothness={3}
          >
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={0.16}
            />
          </RoundedBox>

          <mesh
            position={[-0.1, bodyY + 0.32, 0.41]}
          >
            <sphereGeometry args={[0.025, 12, 12]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>

          <mesh
            position={[0.1, bodyY + 0.32, 0.41]}
          >
            <sphereGeometry args={[0.025, 12, 12]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </>
      )}

      {/* GIRL NECKLACE */}
      {isGirl && (
        <mesh position={[0, neckY - 0.08, 0.24]}>
          <torusGeometry
            args={[0.23, 0.025, 10, 32]}
          />
          <meshStandardMaterial color="#f3d16c" />
        </mesh>
      )}
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

  const [saved, setSaved] =
    useState(false);

  function saveAvatar() {
    localStorage.setItem(
      "nova_avatar",
      JSON.stringify(settings)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 1800);
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_390px]">
        {/* 3D AREA */}
        <section className="relative min-h-[720px] overflow-hidden bg-[radial-gradient(circle_at_top,#4168ad_0%,#1b2b49_42%,#060911_100%)]">
          <div className="absolute left-7 top-7 z-20">
            <div className="text-4xl font-black">
              Nova
              <span className="text-blue-500">.</span>
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
              position: [0, 0.7, 7.7],
              fov: 33,
            }}
          >
            <ambientLight intensity={1.5} />

            <directionalLight
              position={[5, 8, 6]}
              intensity={3.6}
              castShadow
            />

            <directionalLight
              position={[-4, 3, 2]}
              intensity={1.3}
            />

            <Environment preset="city" />

            <Character settings={settings} />

            <ContactShadows
              position={[0, -2.15, 0]}
              opacity={0.46}
              scale={7}
              blur={2.3}
              far={5}
            />

            <OrbitControls
              enablePan={false}
              minDistance={4.6}
              maxDistance={9.2}
              minPolarAngle={Math.PI / 2.3}
              maxPolarAngle={Math.PI / 1.58}
            />
          </Canvas>
        </section>

        {/* CONTROLS */}
        <aside className="border-l border-white/10 bg-[#101827] p-7">
          <h1 className="text-2xl font-black">
            Nova Avatar
          </h1>

          <p className="mt-1 text-sm text-white/45">
            Create your own character.
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
                  Cool Boy
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
                  Cool Girl
                </div>
              </button>
            </div>
          </div>

          {/* HEIGHT */}
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold">
                Height
              </span>

              <span className="rounded-lg bg-white/5 px-2 py-1 text-xs text-white/55">
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
              onChange={(e) =>
                setSettings((current) => ({
                  ...current,
                  height: Number(
                    e.target.value
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
              {hairColors.map((hair) => (
                <button
                  key={hair.value}
                  type="button"
                  title={hair.name}
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      hairColor: hair.value,
                    }))
                  }
                  className={`h-11 rounded-xl border-2 transition ${
                    settings.hairColor ===
                    hair.value
                      ? "scale-105 border-white"
                      : "border-white/10 hover:border-white/30"
                  }`}
                  style={{
                    backgroundColor:
                      hair.value,
                  }}
                >
                  {settings.hairColor ===
                    hair.value && (
                    <span className="font-black text-white">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* SELECTED */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-wider text-white/35">
              Selected
            </div>

            <div className="mt-2 text-xl font-black">
              {settings.gender === "boy"
                ? "Cool Boy"
                : "Cool Girl"}
            </div>

            <div className="mt-2 text-sm text-white/45">
              Height:{" "}
              {Math.round(
                settings.height * 100
              )}
              %
            </div>
          </div>

          <button
            type="button"
            onClick={saveAvatar}
            className="mt-8 w-full rounded-2xl bg-blue-600 py-4 font-black transition hover:bg-blue-500 active:scale-[0.98]"
          >
            {saved
              ? "Avatar Saved ✓"
              : "Save Avatar"}
          </button>
        </aside>
      </div>
    </main>
  );
}