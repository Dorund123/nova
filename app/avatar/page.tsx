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
  skinColor: string;
};

const hairColors = [
  { name: "Black", value: "#171717" },
  { name: "Brown", value: "#4a2c1d" },
  { name: "Blonde", value: "#c48a45" },
  { name: "Red", value: "#8f3f28" },
];

const skinColors = [
  { name: "Light", value: "#f1c5a3" },
  { name: "Warm", value: "#d99a72" },
  { name: "Tan", value: "#b97852" },
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
        {/* Hair top - placed behind forehead */}
        <mesh
          position={[0, 3.18, -0.1]}
          scale={[1.03, 0.62, 0.98]}
        >
          <sphereGeometry args={[0.68, 40, 28]} />
          <meshStandardMaterial
            color={color}
            roughness={0.62}
          />
        </mesh>

        {/* Small front hair pieces - above forehead, NOT over eyes */}
        {[-0.3, 0, 0.3].map((x, index) => (
          <mesh
            key={index}
            position={[x, 3.02, 0.43]}
            rotation={[
              -0.12,
              0,
              x * 0.12,
            ]}
          >
            <sphereGeometry args={[0.16, 20, 16]} />
            <meshStandardMaterial
              color={color}
              roughness={0.62}
            />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group>
      {/* Girl hair top */}
      <mesh
        position={[0, 3.16, -0.1]}
        scale={[1.05, 0.64, 1]}
      >
        <sphereGeometry args={[0.7, 40, 28]} />
        <meshStandardMaterial
          color={color}
          roughness={0.62}
        />
      </mesh>

      {/* Left hair */}
      <mesh
        position={[-0.53, 2.46, -0.12]}
        scale={[0.74, 1.58, 0.64]}
      >
        <sphereGeometry args={[0.35, 28, 28]} />
        <meshStandardMaterial
          color={color}
          roughness={0.62}
        />
      </mesh>

      {/* Right hair */}
      <mesh
        position={[0.53, 2.46, -0.12]}
        scale={[0.74, 1.58, 0.64]}
      >
        <sphereGeometry args={[0.35, 28, 28]} />
        <meshStandardMaterial
          color={color}
          roughness={0.62}
        />
      </mesh>

      {/* Girl bangs - kept high, away from eyes */}
      {[-0.28, 0, 0.28].map((x, index) => (
        <mesh
          key={index}
          position={[x, 3.0, 0.42]}
        >
          <sphereGeometry args={[0.16, 20, 16]} />
          <meshStandardMaterial
            color={color}
            roughness={0.62}
          />
        </mesh>
      ))}
    </group>
  );
}

function Face({
  skin,
}: {
  skin: string;
}) {
  return (
    <group>
      {/* Ears */}
      <mesh position={[-0.68, 2.72, 0]}>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial
          color={skin}
          roughness={0.72}
        />
      </mesh>

      <mesh position={[0.68, 2.72, 0]}>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial
          color={skin}
          roughness={0.72}
        />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.21, 2.79, 0.63]}>
        <sphereGeometry args={[0.078, 24, 24]} />
        <meshStandardMaterial color="#111111" />
      </mesh>

      <mesh position={[0.21, 2.79, 0.63]}>
        <sphereGeometry args={[0.078, 24, 24]} />
        <meshStandardMaterial color="#111111" />
      </mesh>

      {/* Eye highlights */}
      <mesh position={[-0.19, 2.82, 0.69]}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshStandardMaterial color="white" />
      </mesh>

      <mesh position={[0.23, 2.82, 0.69]}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Eyebrows */}
      <RoundedBox
        position={[-0.21, 2.94, 0.61]}
        args={[0.23, 0.04, 0.035]}
        radius={0.012}
        smoothness={2}
        rotation={[0, 0, -0.08]}
      >
        <meshStandardMaterial color="#39251b" />
      </RoundedBox>

      <RoundedBox
        position={[0.21, 2.94, 0.61]}
        args={[0.23, 0.04, 0.035]}
        radius={0.012}
        smoothness={2}
        rotation={[0, 0, 0.08]}
      >
        <meshStandardMaterial color="#39251b" />
      </RoundedBox>

      {/* Nose */}
      <mesh position={[0, 2.64, 0.66]}>
        <sphereGeometry args={[0.07, 18, 18]} />
        <meshStandardMaterial color={skin} />
      </mesh>

      {/* Mouth */}
      <RoundedBox
        position={[0, 2.47, 0.64]}
        args={[0.2, 0.04, 0.025]}
        radius={0.012}
        smoothness={2}
      >
        <meshStandardMaterial color="#934651" />
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

    group.current.position.y =
      Math.sin(clock.getElapsedTime() * 1.4) * 0.02;
  });

  const isGirl = settings.gender === "girl";

  /*
    Height now changes the BODY proportions,
    instead of scaling the whole character in one block.
  */
  const h = settings.height;

  const legHeight = 1.25 * h;
  const torsoHeight = 1.25 * h;
  const armHeight = 1.08 * h;

  const legY = 0.06 + legHeight / 2;
  const waistY = 0.06 + legHeight + 0.12;
  const bodyY = waistY + 0.12 + torsoHeight / 2;

  const neckY = bodyY + torsoHeight / 2 + 0.18;
  const headY = neckY + 0.38;

  const eyeY = headY + 0.1;
  const browY = headY + 0.25;
  const noseY = headY - 0.03;
  const mouthY = headY - 0.2;
  const earY = headY + 0.02;

  const shirtColor = isGirl ? "#ec4899" : "#2563eb";
  const pantsColor = isGirl ? "#334155" : "#111827";

  return (
    <group
      ref={group}
      position={[0, -2.15, 0]}
    >
      {/* SHOES */}
      <RoundedBox
        position={[-0.26, 0.03, 0.1]}
        args={[0.54, 0.24, 0.78]}
        radius={0.09}
        smoothness={5}
      >
        <meshStandardMaterial
          color="#f4f4f5"
          roughness={0.42}
        />
      </RoundedBox>

      <RoundedBox
        position={[0.26, 0.03, 0.1]}
        args={[0.54, 0.24, 0.78]}
        radius={0.09}
        smoothness={5}
      >
        <meshStandardMaterial
          color="#f4f4f5"
          roughness={0.42}
        />
      </RoundedBox>

      {/* LEGS */}
      <RoundedBox
        position={[-0.26, legY, 0]}
        args={[
          isGirl ? 0.4 : 0.46,
          legHeight,
          0.47,
        ]}
        radius={0.11}
        smoothness={6}
      >
        <meshStandardMaterial
          color={pantsColor}
          roughness={0.78}
        />
      </RoundedBox>

      <RoundedBox
        position={[0.26, legY, 0]}
        args={[
          isGirl ? 0.4 : 0.46,
          legHeight,
          0.47,
        ]}
        radius={0.11}
        smoothness={6}
      >
        <meshStandardMaterial
          color={pantsColor}
          roughness={0.78}
        />
      </RoundedBox>

      {/* WAIST */}
      <RoundedBox
        position={[0, waistY, 0]}
        args={[
          isGirl ? 0.88 : 1.02,
          0.2,
          0.68,
        ]}
        radius={0.07}
        smoothness={4}
      >
        <meshStandardMaterial
          color={pantsColor}
          roughness={0.8}
        />
      </RoundedBox>

      {/* BODY */}
      <RoundedBox
        position={[0, bodyY, 0]}
        args={[
          isGirl ? 1.08 : 1.28,
          torsoHeight,
          0.74,
        ]}
        radius={0.21}
        smoothness={8}
      >
        <meshStandardMaterial
          color={shirtColor}
          roughness={0.68}
        />
      </RoundedBox>

      {/* ARMS */}
      <RoundedBox
        position={[
          -0.9,
          bodyY + 0.02,
          0,
        ]}
        args={[0.31, armHeight, 0.35]}
        radius={0.13}
        smoothness={6}
        rotation={[0, 0, -0.04]}
      >
        <meshStandardMaterial
          color={settings.skinColor}
          roughness={0.72}
        />
      </RoundedBox>

      <RoundedBox
        position={[
          0.9,
          bodyY + 0.02,
          0,
        ]}
        args={[0.31, armHeight, 0.35]}
        radius={0.13}
        smoothness={6}
        rotation={[0, 0, 0.04]}
      >
        <meshStandardMaterial
          color={settings.skinColor}
          roughness={0.72}
        />
      </RoundedBox>

      {/* HANDS */}
      <mesh
        position={[
          -0.9,
          bodyY + 0.02 - armHeight / 2 - 0.09,
          0,
        ]}
      >
        <sphereGeometry args={[0.19, 22, 22]} />
        <meshStandardMaterial
          color={settings.skinColor}
          roughness={0.72}
        />
      </mesh>

      <mesh
        position={[
          0.9,
          bodyY + 0.02 - armHeight / 2 - 0.09,
          0,
        ]}
      >
        <sphereGeometry args={[0.19, 22, 22]} />
        <meshStandardMaterial
          color={settings.skinColor}
          roughness={0.72}
        />
      </mesh>

      {/* NECK */}
      <mesh position={[0, neckY, 0]}>
        <cylinderGeometry
          args={[0.21, 0.21, 0.3, 24]}
        />
        <meshStandardMaterial
          color={settings.skinColor}
          roughness={0.72}
        />
      </mesh>

      {/* HEAD */}
      <mesh
        position={[0, headY, 0]}
        scale={[
          isGirl ? 0.97 : 1,
          1.08,
          0.97,
        ]}
      >
        <sphereGeometry
          args={[0.68, 40, 32]}
        />
        <meshStandardMaterial
          color={settings.skinColor}
          roughness={0.68}
        />
      </mesh>

      {/* FACE */}
      <group>
        <mesh position={[-0.68, earY, 0]}>
          <sphereGeometry args={[0.13, 20, 20]} />
          <meshStandardMaterial color={settings.skinColor} />
        </mesh>

        <mesh position={[0.68, earY, 0]}>
          <sphereGeometry args={[0.13, 20, 20]} />
          <meshStandardMaterial color={settings.skinColor} />
        </mesh>

        <mesh position={[-0.21, eyeY, 0.63]}>
          <sphereGeometry args={[0.078, 24, 24]} />
          <meshStandardMaterial color="#111111" />
        </mesh>

        <mesh position={[0.21, eyeY, 0.63]}>
          <sphereGeometry args={[0.078, 24, 24]} />
          <meshStandardMaterial color="#111111" />
        </mesh>

        <mesh position={[-0.19, eyeY + 0.03, 0.69]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshStandardMaterial color="white" />
        </mesh>

        <mesh position={[0.23, eyeY + 0.03, 0.69]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshStandardMaterial color="white" />
        </mesh>

        <RoundedBox
          position={[-0.21, browY, 0.61]}
          args={[0.23, 0.04, 0.035]}
          radius={0.012}
          smoothness={2}
          rotation={[0, 0, -0.08]}
        >
          <meshStandardMaterial color="#39251b" />
        </RoundedBox>

        <RoundedBox
          position={[0.21, browY, 0.61]}
          args={[0.23, 0.04, 0.035]}
          radius={0.012}
          smoothness={2}
          rotation={[0, 0, 0.08]}
        >
          <meshStandardMaterial color="#39251b" />
        </RoundedBox>

        <mesh position={[0, noseY, 0.66]}>
          <sphereGeometry args={[0.07, 18, 18]} />
          <meshStandardMaterial
            color={settings.skinColor}
          />
        </mesh>

        <RoundedBox
          position={[0, mouthY, 0.64]}
          args={[0.2, 0.04, 0.025]}
          radius={0.012}
          smoothness={2}
        >
          <meshStandardMaterial color="#934651" />
        </RoundedBox>
      </group>

      {/* HAIR */}
      <group
        position={[
          0,
          h !== 1
            ? (h - 1) * 0.2
            : 0,
          0,
        ]}
      >
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
      hairColor: "#171717",
      skinColor: "#f1c5a3",
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
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_380px]">
        {/* 3D */}
        <section className="relative min-h-[720px] overflow-hidden bg-[radial-gradient(circle_at_top,#3a5fa3_0%,#192843_40%,#060911_100%)]">
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
              position: [0, 0.8, 7.5],
              fov: 33,
            }}
          >
            <ambientLight intensity={1.55} />

            <directionalLight
              position={[4, 7, 5]}
              intensity={3.4}
              castShadow
            />

            <directionalLight
              position={[-4, 3, 2]}
              intensity={1.25}
            />

            <Environment preset="city" />

            <Character settings={settings} />

            <ContactShadows
              position={[0, -2.1, 0]}
              opacity={0.45}
              scale={7}
              blur={2.4}
              far={5}
            />

            <OrbitControls
              enablePan={false}
              minDistance={4.7}
              maxDistance={9}
              minPolarAngle={Math.PI / 2.3}
              maxPolarAngle={Math.PI / 1.6}
            />
          </Canvas>
        </section>

        {/* PANEL */}
        <aside className="border-l border-white/10 bg-[#101827] p-7">
          <h1 className="text-2xl font-black">
            Avatar Studio
          </h1>

          <p className="mt-1 text-sm text-white/45">
            Customize your Nova character.
          </p>

          {/* Gender */}
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
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="text-4xl">👨</div>

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
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="text-4xl">👩</div>

                <div className="mt-3 font-bold">
                  Girl
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
              min="0.85"
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
              className="w-full accent-blue-500"
            />

            <div className="mt-2 flex justify-between text-xs text-white/35">
              <span>Short</span>
              <span>Tall</span>
            </div>
          </div>

          {/* HAIR */}
          <div className="mt-8">
            <div className="mb-3 text-sm font-bold">
              Hair Color
            </div>

            <div className="grid grid-cols-4 gap-3">
              {hairColors.map((hair) => (
                <button
                  key={hair.value}
                  type="button"
                  title={hair.name}
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      hairColor:
                        hair.value,
                    }))
                  }
                  className={`flex h-12 items-center justify-center rounded-xl border-2 transition ${
                    settings.hairColor ===
                    hair.value
                      ? "scale-105 border-white"
                      : "border-white/10"
                  }`}
                  style={{
                    backgroundColor:
                      hair.value,
                  }}
                >
                  {settings.hairColor ===
                    hair.value && (
                    <span className="font-black">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* SKIN */}
          <div className="mt-8">
            <div className="mb-3 text-sm font-bold">
              Skin
            </div>

            <div className="flex gap-3">
              {skinColors.map((skin) => (
                <button
                  key={skin.value}
                  type="button"
                  title={skin.name}
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      skinColor:
                        skin.value,
                    }))
                  }
                  className={`h-11 w-11 rounded-full border-2 transition ${
                    settings.skinColor ===
                    skin.value
                      ? "scale-110 border-white"
                      : "border-white/10"
                  }`}
                  style={{
                    backgroundColor:
                      skin.value,
                  }}
                />
              ))}
            </div>
          </div>

          {/* SAVE */}
          <button
            type="button"
            onClick={saveAvatar}
            className="mt-8 w-full rounded-2xl bg-blue-600 py-4 font-black transition hover:bg-blue-500"
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