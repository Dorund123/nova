"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  RoundedBox,
} from "@react-three/drei";
import * as THREE from "three";

type Gender = "boy" | "girl";

type HairStyle =
  | "classic"
  | "side"
  | "spiky"
  | "curly"
  | "long"
  | "bob"
  | "ponytail"
  | "twintails";

type AvatarSettings = {
  gender: Gender;
  height: number;
  hairColor: string;
  hairStyle: HairStyle;
};

const STORAGE_KEY = "nova_avatar";

const hairColors = [
  "#111111",
  "#4a2a1a",
  "#d4a05a",
  "#9b3f26",
  "#e7e7e7",
];

const boyHairStyles: {
  value: HairStyle;
  label: string;
}[] = [
  {
    value: "classic",
    label: "Classic",
  },
  {
    value: "side",
    label: "Side",
  },
  {
    value: "spiky",
    label: "Spiky",
  },
  {
    value: "curly",
    label: "Curly",
  },
];

const girlHairStyles: {
  value: HairStyle;
  label: string;
}[] = [
  {
    value: "long",
    label: "Long",
  },
  {
    value: "bob",
    label: "Bob",
  },
  {
    value: "ponytail",
    label: "Ponytail",
  },
  {
    value: "twintails",
    label: "Twin Tails",
  },
];

/* =========================================================
   HAIR
========================================================= */

function Hair({
  gender,
  color,
  style,
}: {
  gender: Gender;
  color: string;
  style: HairStyle;
}) {
  const material = (
    <meshStandardMaterial
      color={color}
      roughness={0.55}
    />
  );

  if (gender === "boy") {
    if (style === "side") {
      return (
        <group>
          <mesh
            position={[-0.12, 3.34, -0.08]}
            scale={[1.05, 0.6, 0.98]}
          >
            <sphereGeometry args={[0.68, 36, 26]} />
            {material}
          </mesh>

          <mesh
            position={[0.38, 3.18, 0.34]}
            rotation={[0, 0, -0.3]}
            scale={[0.6, 0.45, 0.58]}
          >
            <sphereGeometry args={[0.3, 26, 22]} />
            {material}
          </mesh>

          <mesh
            position={[-0.34, 3.12, 0.42]}
            rotation={[-0.12, 0, -0.08]}
          >
            <sphereGeometry args={[0.14, 20, 16]} />
            {material}
          </mesh>
        </group>
      );
    }

    if (style === "spiky") {
      const spikes = [
        [-0.42, 3.55, 0],
        [-0.21, 3.68, 0.02],
        [0, 3.72, 0.04],
        [0.21, 3.68, 0.02],
        [0.42, 3.55, 0],
      ];

      return (
        <group>
          <mesh
            position={[0, 3.3, -0.08]}
            scale={[1.02, 0.58, 0.98]}
          >
            <sphereGeometry args={[0.68, 36, 26]} />
            {material}
          </mesh>

          {spikes.map((position, index) => (
            <mesh
              key={index}
              position={[
                position[0],
                position[1],
                position[2],
              ]}
              rotation={[
                -0.15,
                0,
                -position[0] * 0.25,
              ]}
            >
              <coneGeometry
                args={[0.18, 0.48, 18]}
              />
              {material}
            </mesh>
          ))}
        </group>
      );
    }

    if (style === "curly") {
      const curls = [
        [-0.5, 3.25, 0],
        [-0.3, 3.45, 0],
        [0, 3.5, 0],
        [0.3, 3.45, 0],
        [0.5, 3.25, 0],
        [-0.44, 3.02, 0.26],
        [-0.18, 3.12, 0.32],
        [0.18, 3.12, 0.32],
        [0.44, 3.02, 0.26],
      ];

      return (
        <group>
          {curls.map((position, index) => (
            <mesh
              key={index}
              position={[
                position[0],
                position[1],
                position[2],
              ]}
              scale={[
                index >= 5 ? 0.85 : 1,
                index >= 5 ? 0.85 : 1,
                index >= 5 ? 0.85 : 1,
              ]}
            >
              <sphereGeometry
                args={[0.27, 24, 20]}
              />
              {material}
            </mesh>
          ))}
        </group>
      );
    }

    return (
      <group>
        <mesh
          position={[0, 3.35, -0.08]}
          scale={[1.02, 0.62, 0.98]}
        >
          <sphereGeometry args={[0.68, 36, 26]} />
          {material}
        </mesh>

        {[-0.28, 0, 0.28].map((x) => (
          <mesh
            key={x}
            position={[x, 3.15, 0.42]}
            rotation={[-0.15, 0, x * 0.2]}
          >
            <sphereGeometry
              args={[0.15, 20, 16]}
            />
            {material}
          </mesh>
        ))}
      </group>
    );
  }

  if (style === "bob") {
    return (
      <group>
        <mesh
          position={[0, 3.34, -0.08]}
          scale={[1.04, 0.66, 1]}
        >
          <sphereGeometry args={[0.7, 36, 26]} />
          {material}
        </mesh>

        <mesh
          position={[-0.56, 2.94, -0.08]}
          scale={[0.42, 0.92, 0.55]}
        >
          <sphereGeometry args={[0.34, 24, 24]} />
          {material}
        </mesh>

        <mesh
          position={[0.56, 2.94, -0.08]}
          scale={[0.42, 0.92, 0.55]}
        >
          <sphereGeometry args={[0.34, 24, 24]} />
          {material}
        </mesh>

        {[-0.28, 0, 0.28].map((x) => (
          <mesh
            key={x}
            position={[x, 3.14, 0.42]}
          >
            <sphereGeometry
              args={[0.15, 20, 16]}
            />
            {material}
          </mesh>
        ))}
      </group>
    );
  }

  if (style === "ponytail") {
    return (
      <group>
        <mesh
          position={[0, 3.35, -0.08]}
          scale={[1.04, 0.66, 1]}
        >
          <sphereGeometry args={[0.7, 36, 26]} />
          {material}
        </mesh>

        <mesh
          position={[0, 3.05, -0.58]}
          scale={[0.55, 1.35, 0.55]}
        >
          <sphereGeometry
            args={[0.34, 28, 24]}
          />
          {material}
        </mesh>

        <mesh
          position={[0, 3.46, -0.6]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry
            args={[0.2, 0.055, 12, 24]}
          />
          {material}
        </mesh>

        {[-0.28, 0, 0.28].map((x) => (
          <mesh
            key={x}
            position={[x, 3.12, 0.42]}
          >
            <sphereGeometry
              args={[0.16, 20, 16]}
            />
            {material}
          </mesh>
        ))}
      </group>
    );
  }

  if (style === "twintails") {
    return (
      <group>
        <mesh
          position={[0, 3.35, -0.08]}
          scale={[1.04, 0.66, 1]}
        >
          <sphereGeometry args={[0.7, 36, 26]} />
          {material}
        </mesh>

        <mesh
          position={[-0.62, 2.92, -0.18]}
          scale={[0.38, 1.3, 0.48]}
        >
          <sphereGeometry
            args={[0.34, 26, 24]}
          />
          {material}
        </mesh>

        <mesh
          position={[0.62, 2.92, -0.18]}
          scale={[0.38, 1.3, 0.48]}
        >
          <sphereGeometry
            args={[0.34, 26, 24]}
          />
          {material}
        </mesh>

        <mesh
          position={[-0.62, 3.46, 0]}
        >
          <torusGeometry
            args={[0.16, 0.045, 12, 20]}
          />
          {material}
        </mesh>

        <mesh
          position={[0.62, 3.46, 0]}
        >
          <torusGeometry
            args={[0.16, 0.045, 12, 20]}
          />
          {material}
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <mesh
        position={[0, 3.35, -0.08]}
        scale={[1.04, 0.66, 1]}
      >
        <sphereGeometry args={[0.7, 36, 26]} />
        {material}
      </mesh>

      <mesh
        position={[-0.52, 2.58, -0.12]}
        scale={[0.75, 1.55, 0.68]}
      >
        <sphereGeometry
          args={[0.35, 26, 26]}
        />
        {material}
      </mesh>

      <mesh
        position={[0.52, 2.58, -0.12]}
        scale={[0.75, 1.55, 0.68]}
      >
        <sphereGeometry
          args={[0.35, 26, 26]}
        />
        {material}
      </mesh>

      {[-0.28, 0, 0.28].map((x) => (
        <mesh
          key={x}
          position={[x, 3.12, 0.42]}
        >
          <sphereGeometry
            args={[0.16, 20, 16]}
          />
          {material}
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================
   FACE
========================================================= */

function Face({
  gender,
  skin,
}: {
  gender: Gender;
  skin: string;
}) {
  const isBoy = gender === "boy";

  return (
    <group>
      <mesh position={[-0.7, 3.0, 0]}>
        <sphereGeometry args={[0.12, 20, 20]} />
        <meshStandardMaterial color={skin} />
      </mesh>

      <mesh position={[0.7, 3.0, 0]}>
        <sphereGeometry args={[0.12, 20, 20]} />
        <meshStandardMaterial color={skin} />
      </mesh>

      <mesh position={[-0.22, 3.09, 0.67]}>
        <sphereGeometry
          args={[
            isBoy ? 0.078 : 0.095,
            26,
            26,
          ]}
        />
        <meshStandardMaterial color="#111111" />
      </mesh>

      <mesh position={[0.22, 3.09, 0.67]}>
        <sphereGeometry
          args={[
            isBoy ? 0.078 : 0.095,
            26,
            26,
          ]}
        />
        <meshStandardMaterial color="#111111" />
      </mesh>

      <mesh position={[-0.19, 3.13, 0.745]}>
        <sphereGeometry args={[0.025, 14, 14]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      <mesh position={[0.25, 3.13, 0.745]}>
        <sphereGeometry args={[0.025, 14, 14]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      <RoundedBox
        position={[-0.22, 3.29, 0.63]}
        args={[
          isBoy ? 0.28 : 0.25,
          isBoy ? 0.06 : 0.035,
          0.03,
        ]}
        radius={0.012}
        smoothness={3}
        rotation={[
          0,
          0,
          isBoy ? -0.08 : -0.05,
        ]}
      >
        <meshStandardMaterial
          color={
            isBoy ? "#241812" : "#4a3024"
          }
        />
      </RoundedBox>

      <RoundedBox
        position={[0.22, 3.29, 0.63]}
        args={[
          isBoy ? 0.28 : 0.25,
          isBoy ? 0.06 : 0.035,
          0.03,
        ]}
        radius={0.012}
        smoothness={3}
        rotation={[
          0,
          0,
          isBoy ? 0.08 : 0.05,
        ]}
      >
        <meshStandardMaterial
          color={
            isBoy ? "#241812" : "#4a3024"
          }
        />
      </RoundedBox>

      <mesh position={[0, 2.94, 0.69]}>
        <sphereGeometry
          args={[
            isBoy ? 0.07 : 0.055,
            20,
            20,
          ]}
        />
        <meshStandardMaterial color={skin} />
      </mesh>

      <mesh position={[0, 2.91, 0.73]}>
        <sphereGeometry args={[0.038, 16, 16]} />
        <meshStandardMaterial color={skin} />
      </mesh>

      <RoundedBox
        position={[0, 2.75, 0.665]}
        args={[
          isBoy ? 0.21 : 0.24,
          0.04,
          0.03,
        ]}
        radius={0.014}
        smoothness={4}
      >
        <meshStandardMaterial
          color={
            isBoy ? "#8f4b57" : "#b85c72"
          }
          roughness={0.5}
        />
      </RoundedBox>

      {!isBoy && (
        <>
          <mesh position={[-0.34, 2.87, 0.58]}>
            <sphereGeometry
              args={[0.11, 18, 18]}
            />
            <meshStandardMaterial
              color="#e9a7a0"
              transparent
              opacity={0.16}
            />
          </mesh>

          <mesh position={[0.34, 2.87, 0.58]}>
            <sphereGeometry
              args={[0.11, 18, 18]}
            />
            <meshStandardMaterial
              color="#e9a7a0"
              transparent
              opacity={0.16}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

/* =========================================================
   CHARACTER
========================================================= */

function Character({
  settings,
}: {
  settings: AvatarSettings;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;

    group.current.position.y =
      Math.sin(clock.getElapsedTime() * 1.3) *
      0.02;
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

  const shoeY = 0.05;

  const legHeight = 1.28 * h;

  const legY =
    shoeY +
    0.11 +
    legHeight / 2;

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

  const headY = neckY + 0.42;

  const faceOffsetY =
    headY - 3.0;

  return (
    <group
      ref={group}
      position={[0, -1.35, 0]}
      scale={[0.62, 0.62, 0.62]}
    >
      {/* SHOES */}
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

      {/* LEGS */}
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

      {/* SHOULDERS */}
      {!isGirl && (
        <>
          <RoundedBox
            position={[-0.66, shoulderY, 0]}
            args={[0.36, 0.3, 0.68]}
            radius={0.12}
            smoothness={5}
            rotation={[0, 0, -0.1]}
          >
            <meshStandardMaterial
              color={shirt}
            />
          </RoundedBox>

          <RoundedBox
            position={[0.66, shoulderY, 0]}
            args={[0.36, 0.3, 0.68]}
            radius={0.12}
            smoothness={5}
            rotation={[0, 0, 0.1]}
          >
            <meshStandardMaterial
              color={shirt}
            />
          </RoundedBox>
        </>
      )}

      {/* ARMS */}
      <RoundedBox
        position={[
          -0.84,
          shoulderY - 0.13,
          0,
        ]}
        args={[0.3, armHeight, 0.34]}
        radius={0.12}
        smoothness={6}
        rotation={[0, 0, -0.04]}
      >
        <meshStandardMaterial color={skin} />
      </RoundedBox>

      <RoundedBox
        position={[
          0.84,
          shoulderY - 0.13,
          0,
        ]}
        args={[0.3, armHeight, 0.34]}
        radius={0.12}
        smoothness={6}
        rotation={[0, 0, 0.04]}
      >
        <meshStandardMaterial color={skin} />
      </RoundedBox>

      {/* HANDS */}
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
        <meshStandardMaterial color={skin} />
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
      <group
        position={[0, faceOffsetY, 0]}
      >
        <Face
          gender={settings.gender}
          skin={skin}
        />
      </group>

      {/* HAIR */}
      <group
        position={[0, faceOffsetY, 0]}
      >
        <Hair
          gender={settings.gender}
          color={settings.hairColor}
          style={settings.hairStyle}
        />
      </group>
    </group>
  );
}

/* =========================================================
   AVATAR PAGE
========================================================= */

export default function AvatarPage() {
  const [settings, setSettings] =
    useState<AvatarSettings>({
      gender: "boy",
      height: 1,
      hairColor: "#111111",
      hairStyle: "classic",
    });

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(STORAGE_KEY);

      if (!stored) return;

      const parsed =
        JSON.parse(stored) as AvatarSettings;

      if (
        parsed.gender &&
        typeof parsed.height === "number" &&
        parsed.hairColor &&
        parsed.hairStyle
      ) {
        setSettings(parsed);
      }
    } catch {
      console.log(
        "Could not load Nova avatar."
      );
    }
  }, []);

  const availableHairStyles =
    settings.gender === "boy"
      ? boyHairStyles
      : girlHairStyles;

  function saveAvatar() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

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
              position: [0, 0.8, 10.5],
              fov: 50,
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

            <Character
              settings={settings}
            />

            <ContactShadows
              position={[0, -1.4, 0]}
              opacity={0.4}
              scale={5}
              blur={2.3}
              far={4}
            />

            <OrbitControls
              enablePan={false}
              target={[0, 0.9, 0]}
              minDistance={6.5}
              maxDistance={12}
              minPolarAngle={Math.PI / 2.25}
              maxPolarAngle={Math.PI / 1.6}
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

              {/* BOY */}
              <button
                type="button"
                onClick={() =>
                  setSettings(
                    (current) => ({
                      ...current,
                      gender: "boy",
                      hairStyle: "classic",
                    })
                  )
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

                <div className="mt-1 text-xs text-white/40">
                  Classic, Side, Spiky, Curly
                </div>
              </button>

              {/* GIRL */}
              <button
                type="button"
                onClick={() =>
                  setSettings(
                    (current) => ({
                      ...current,
                      gender: "girl",
                      hairStyle: "long",
                    })
                  )
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

                <div className="mt-1 text-xs text-white/40">
                  Long, Bob, Ponytail, Twin Tails
                </div>
              </button>
            </div>
          </div>

          {/* HAIR */}
          <div className="mt-8">
            <div className="mb-3 text-sm font-bold">
              Hairstyle
            </div>

            <div className="grid grid-cols-2 gap-2">
              {availableHairStyles.map(
                (hair) => (
                  <button
                    key={hair.value}
                    type="button"
                    onClick={() =>
                      setSettings(
                        (current) => ({
                          ...current,
                          hairStyle:
                            hair.value,
                        })
                      )
                    }
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      settings.hairStyle ===
                      hair.value
                        ? "border-blue-400 bg-blue-500/15 text-white"
                        : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {hair.label}
                  </button>
                )
              )}
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
                setSettings(
                  (current) => ({
                    ...current,
                    height: Number(
                      event.target.value
                    ),
                  })
                )
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
                    setSettings(
                      (current) => ({
                        ...current,
                        hairColor: color,
                      })
                    )
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
                    <span className="font-black text-white">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* SAVE */}
          <button
            type="button"
            onClick={saveAvatar}
            className={`mt-8 w-full rounded-2xl py-4 font-black transition ${
              saved
                ? "bg-green-500 text-white"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {saved
              ? "✓ Avatar Saved"
              : "Save Avatar"}
          </button>

          <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center text-xs text-white/30">
            Your avatar is saved automatically
            on this device.
          </div>
        </aside>
      </div>
    </main>
  );
}