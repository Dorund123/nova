"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/* =========================================================
   TYPES
========================================================= */

type JobId = "delivery" | "taxi" | "mechanic" | "police";

type Job = {
  id: JobId;
  name: string;
  icon: string;
  reward: number;
  xp: number;
  description: string;
};

type Upgrade = {
  id: "speed" | "pay" | "vehicle" | "multiplier";
  name: string;
  icon: string;
  price: number;
  description: string;
};

type AvatarData = {
  hairColor?: string;
  skinColor?: string;
  skin?: string;
};

type GamePhase =
  | "idle"
  | "goToPickup"
  | "pickup"
  | "goToDestination"
  | "complete";

type Mission = {
  job: Job;
  pickup: THREE.Vector3;
  destination: THREE.Vector3;
};

/* =========================================================
   JOBS
========================================================= */

const jobs: Job[] = [
  {
    id: "delivery",
    name: "Package Delivery",
    icon: "📦",
    reward: 150,
    xp: 35,
    description: "Pick up a package and deliver it to the customer.",
  },
  {
    id: "taxi",
    name: "Taxi Driver",
    icon: "🚕",
    reward: 220,
    xp: 45,
    description: "Pick up a passenger and take them to their destination.",
  },
  {
    id: "mechanic",
    name: "Mechanic",
    icon: "🔧",
    reward: 300,
    xp: 60,
    description: "Travel to a broken vehicle and repair it.",
  },
  {
    id: "police",
    name: "Police Officer",
    icon: "👮",
    reward: 400,
    xp: 80,
    description: "Respond to an incident around Nova City.",
  },
];

/* =========================================================
   UPGRADES
========================================================= */

const upgrades: Upgrade[] = [
  {
    id: "speed",
    name: "Movement Speed",
    icon: "⚡",
    price: 500,
    description: "Move faster around Nova City.",
  },
  {
    id: "pay",
    name: "Job Pay",
    icon: "💰",
    price: 750,
    description: "Increase your job rewards.",
  },
  {
    id: "vehicle",
    name: "Better Vehicle",
    icon: "🚗",
    price: 1500,
    description: "Unlock a faster vehicle.",
  },
  {
    id: "multiplier",
    name: "Money Multiplier",
    icon: "🔥",
    price: 3000,
    description: "Greatly increase job rewards.",
  },
];

/* =========================================================
   BUILDINGS
========================================================= */

const buildings = [
  [-31, -31, 8, 14, 8],
  [-18, -31, 9, 20, 9],
  [-4, -31, 10, 13, 9],
  [10, -31, 8, 18, 8],
  [25, -31, 10, 23, 9],

  [-31, -16, 10, 17, 9],
  [31, -16, 9, 14, 9],

  [-31, 15, 9, 16, 9],
  [-18, 15, 8, 11, 8],
  [18, 15, 10, 20, 9],
  [31, 15, 8, 13, 8],

  [-31, 31, 10, 20, 9],
  [-17, 31, 8, 14, 8],
  [-2, 31, 11, 18, 10],
  [14, 31, 9, 24, 9],
  [29, 31, 9, 16, 9],
];

/* =========================================================
   TREES
========================================================= */

const treePositions: [number, number][] = [
  [-44, -44],
  [-35, -44],
  [-25, -44],
  [-15, -44],
  [15, -44],
  [25, -44],
  [35, -44],
  [44, -44],

  [-44, 44],
  [-35, 44],
  [-25, 44],
  [-15, 44],
  [15, 44],
  [25, 44],
  [35, 44],
  [44, 44],

  [-44, -7],
  [44, -7],
  [-44, 7],
  [44, 7],
];

/* =========================================================
   MISSION LOCATIONS
========================================================= */

const missionLocations: [number, number][] = [
  [-22, -5],
  [23, -7],
  [-22, 8],
  [22, 9],
  [0, -18],
  [0, 20],
  [-10, 18],
  [12, -18],
];

/* =========================================================
   BUILDING
========================================================= */

function Building({
  x,
  z,
  width,
  height,
  depth,
}: {
  x: number;
  z: number;
  width: number;
  height: number;
  depth: number;
}) {
  const floors = Math.max(2, Math.floor(height / 3));

  return (
    <group position={[x, height / 2, z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color="#273449"
          roughness={0.75}
        />
      </mesh>

      {Array.from({ length: floors }).map((_, floor) => (
        <group key={floor}>
          <mesh
            position={[
              -width / 2 + 1.5,
              -height / 2 + 2 + floor * 3,
              depth / 2 + 0.03,
            ]}
          >
            <boxGeometry args={[1.3, 1.2, 0.08]} />
            <meshStandardMaterial
              color="#60a5fa"
              emissive="#2563eb"
              emissiveIntensity={0.8}
            />
          </mesh>

          <mesh
            position={[
              0,
              -height / 2 + 2 + floor * 3,
              depth / 2 + 0.03,
            ]}
          >
            <boxGeometry args={[1.3, 1.2, 0.08]} />
            <meshStandardMaterial
              color="#60a5fa"
              emissive="#2563eb"
              emissiveIntensity={0.8}
            />
          </mesh>

          <mesh
            position={[
              width / 2 - 1.5,
              -height / 2 + 2 + floor * 3,
              depth / 2 + 0.03,
            ]}
          >
            <boxGeometry args={[1.3, 1.2, 0.08]} />
            <meshStandardMaterial
              color="#60a5fa"
              emissive="#2563eb"
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* =========================================================
   TREE
========================================================= */

function Tree({
  x,
  z,
}: {
  x: number;
  z: number;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.45, 2.8, 8]} />
        <meshStandardMaterial color="#713f12" />
      </mesh>

      <mesh position={[0, 3, 0]} castShadow>
        <sphereGeometry args={[1.45, 16, 16]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
    </group>
  );
}

/* =========================================================
   CAR
========================================================= */

function Car({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[3.6, 0.8, 1.8]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      <mesh position={[0.25, 0.65, 0]} castShadow>
        <boxGeometry args={[1.7, 0.65, 1.35]} />
        <meshStandardMaterial color="#111827" />
      </mesh>

      <mesh position={[-1.2, -0.45, -0.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
        <meshStandardMaterial color="#050505" />
      </mesh>

      <mesh position={[1.2, -0.45, -0.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
        <meshStandardMaterial color="#050505" />
      </mesh>

      <mesh position={[-1.2, -0.45, 0.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
        <meshStandardMaterial color="#050505" />
      </mesh>

      <mesh position={[1.2, -0.45, 0.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
        <meshStandardMaterial color="#050505" />
      </mesh>
    </group>
  );
}

/* =========================================================
   INTERACTION MARKER
========================================================= */

function Marker({
  position,
  color,
  icon,
}: {
  position: THREE.Vector3;
  color: string;
  icon: string;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.position.y =
      0.8 + Math.sin(state.clock.elapsedTime * 3) * 0.2;

    ref.current.rotation.y =
      state.clock.elapsedTime * 1.5;
  });

  return (
    <group
      ref={ref}
      position={[position.x, 0.8, position.z]}
    >
      <mesh>
        <cylinderGeometry args={[1.1, 1.1, 0.15, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.7}
        />
      </mesh>

      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

/* =========================================================
   PLAYER AVATAR
========================================================= */

function PlayerAvatar({
  position,
  hairColor,
  skinColor,
}: {
  position: THREE.Vector3;
  hairColor: string;
  skinColor: string;
}) {
  return (
    <group
      position={[
        position.x,
        0,
        position.z,
      ]}
    >
      {/* Body */}
      <mesh position={[0, 1.45, 0]} castShadow>
        <boxGeometry args={[1, 1.7, 0.65]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>

      {/* Head */}
      <mesh position={[0, 2.75, 0]} castShadow>
        <sphereGeometry args={[0.55, 20, 20]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 3.14, 0]} castShadow>
        <sphereGeometry args={[0.57, 20, 12]} />
        <meshStandardMaterial color={hairColor} />
      </mesh>

      {/* Left Arm */}
      <mesh position={[-0.68, 1.45, 0]} castShadow>
        <boxGeometry args={[0.28, 1.5, 0.28]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* Right Arm */}
      <mesh position={[0.68, 1.45, 0]} castShadow>
        <boxGeometry args={[0.28, 1.5, 0.28]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>

      {/* Left Leg */}
      <mesh position={[-0.25, 0.3, 0]} castShadow>
        <boxGeometry args={[0.35, 1.15, 0.4]} />
        <meshStandardMaterial color="#111827" />
      </mesh>

      {/* Right Leg */}
      <mesh position={[0.25, 0.3, 0]} castShadow>
        <boxGeometry args={[0.35, 1.15, 0.4]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
    </group>
  );
}

/* =========================================================
   PLAYER CONTROLLER
========================================================= */

function PlayerController({
  speed,
  hairColor,
  skinColor,
  onMove,
}: {
  speed: number;
  hairColor: string;
  skinColor: string;
  onMove: (position: THREE.Vector3) => void;
}) {
  const position = useRef(
    new THREE.Vector3(0, 0, 5)
  );

  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      keys.current[event.key.toLowerCase()] = true;
    };

    const keyUp = (event: KeyboardEvent) => {
      keys.current[event.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, []);

  useFrame((_, delta) => {
    const move = speed * delta;

    let moved = false;

    if (
      keys.current["w"] ||
      keys.current["arrowup"]
    ) {
      position.current.z -= move;
      moved = true;
    }

    if (
      keys.current["s"] ||
      keys.current["arrowdown"]
    ) {
      position.current.z += move;
      moved = true;
    }

    if (
      keys.current["a"] ||
      keys.current["arrowleft"]
    ) {
      position.current.x -= move;
      moved = true;
    }

    if (
      keys.current["d"] ||
      keys.current["arrowright"]
    ) {
      position.current.x += move;
      moved = true;
    }

    position.current.x = THREE.MathUtils.clamp(
      position.current.x,
      -48,
      48
    );

    position.current.z = THREE.MathUtils.clamp(
      position.current.z,
      -48,
      48
    );

    if (moved) {
      onMove(position.current.clone());
    }
  });

  return (
    <PlayerAvatar
      position={position.current}
      hairColor={hairColor}
      skinColor={skinColor}
    />
  );
}

/* =========================================================
   WORLD
========================================================= */

function World({
  speed,
  hairColor,
  skinColor,
  mission,
  phase,
  onMove,
}: {
  speed: number;
  hairColor: string;
  skinColor: string;
  mission: Mission | null;
  phase: GamePhase;
  onMove: (position: THREE.Vector3) => void;
}) {
  return (
    <>
      {/* Ground */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[110, 110]} />
        <meshStandardMaterial color="#56616b" />
      </mesh>

      {/* Grass */}
      <mesh
        position={[0, 0.01, -50]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[110, 10]} />
        <meshStandardMaterial color="#166534" />
      </mesh>

      <mesh
        position={[0, 0.01, 50]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[110, 10]} />
        <meshStandardMaterial color="#166534" />
      </mesh>

      {/* Main roads */}
      <mesh
        position={[0, 0.03, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[110, 12]} />
        <meshStandardMaterial color="#20252b" />
      </mesh>

      <mesh
        position={[0, 0.04, 0]}
        rotation={[
          -Math.PI / 2,
          0,
          Math.PI / 2,
        ]}
      >
        <planeGeometry args={[110, 12]} />
        <meshStandardMaterial color="#20252b" />
      </mesh>

      {/* Road markings */}
      {Array.from({ length: 11 }).map(
        (_, index) => (
          <mesh
            key={`horizontal-${index}`}
            position={[
              -50 + index * 10,
              0.06,
              0,
            ]}
            rotation={[
              -Math.PI / 2,
              0,
              0,
            ]}
          >
            <planeGeometry args={[5, 0.16]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        )
      )}

      {Array.from({ length: 11 }).map(
        (_, index) => (
          <mesh
            key={`vertical-${index}`}
            position={[
              0,
              0.06,
              -50 + index * 10,
            ]}
            rotation={[
              -Math.PI / 2,
              0,
              Math.PI / 2,
            ]}
          >
            <planeGeometry args={[5, 0.16]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        )
      )}

      {/* Buildings */}
      {buildings.map((building, index) => (
        <Building
          key={index}
          x={building[0]}
          z={building[1]}
          width={building[2]}
          height={building[3]}
          depth={building[4]}
        />
      ))}

      {/* Trees */}
      {treePositions.map(([x, z], index) => (
        <Tree
          key={index}
          x={x}
          z={z}
        />
      ))}

      {/* Cars */}
      <Car
        position={[-12, 0.65, -6]}
        color="#ef4444"
      />

      <Car
        position={[12, 0.65, 7]}
        color="#3b82f6"
      />

      <Car
        position={[-8, 0.65, 22]}
        color="#22c55e"
      />

      <Car
        position={[8, 0.65, -22]}
        color="#f59e0b"
      />

      {/* Mission marker */}
      {mission && phase === "goToPickup" && (
        <Marker
          position={mission.pickup}
          color="#22c55e"
          icon="📦"
        />
      )}

      {mission && phase === "goToDestination" && (
        <Marker
          position={mission.destination}
          color="#3b82f6"
          icon="📍"
        />
      )}

      {/* Player */}
      <PlayerController
        speed={speed}
        hairColor={hairColor}
        skinColor={skinColor}
        onMove={onMove}
      />

      {/* Lights */}
      <ambientLight intensity={1.2} />

      <directionalLight
        position={[20, 35, 20]}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <hemisphereLight
        args={[
          "#87ceeb",
          "#166534",
          1,
        ]}
      />
    </>
  );
}

/* =========================================================
   MAIN GAME
========================================================= */

export default function NovaCityGame() {
  const [money, setMoney] = useState(1000);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);

  const [speed, setSpeed] = useState(7);
  const [payMultiplier, setPayMultiplier] = useState(1);

  const [hairColor, setHairColor] =
    useState("#111111");

  const [skinColor, setSkinColor] =
    useState("#f1c27d");

  const [position, setPosition] =
    useState(
      new THREE.Vector3(0, 0, 5)
    );

  const [mission, setMission] =
    useState<Mission | null>(null);

  const [phase, setPhase] =
    useState<GamePhase>("idle");

  const [showJobs, setShowJobs] =
    useState(false);

  const [showShop, setShowShop] =
    useState(false);

  const [message, setMessage] = useState(
    "Welcome to Nova City! Choose a job."
  );

  const [nearTarget, setNearTarget] =
    useState(false);

  /* =======================================================
     LOAD AVATAR
  ======================================================= */

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem("nova_avatar");

      if (!saved) return;

      const avatar: AvatarData =
        JSON.parse(saved);

      if (avatar.hairColor) {
        setHairColor(avatar.hairColor);
      }

      if (avatar.skinColor) {
        setSkinColor(avatar.skinColor);
      }

      if (avatar.skin) {
        setSkinColor(avatar.skin);
      }
    } catch (error) {
      console.error(
        "Avatar loading error:",
        error
      );
    }
  }, []);

  /* =======================================================
     DISTANCE CHECK
  ======================================================= */

  useEffect(() => {
    if (!mission) {
      setNearTarget(false);
      return;
    }

    const target =
      phase === "goToPickup"
        ? mission.pickup
        : phase === "goToDestination"
          ? mission.destination
          : null;

    if (!target) {
      setNearTarget(false);
      return;
    }

    const distance = position.distanceTo(
      target
    );

    setNearTarget(distance < 3.5);
  }, [
    position,
    mission,
    phase,
  ]);

  /* =======================================================
     KEY E INTERACTION
  ======================================================= */

  useEffect(() => {
    const handleKey = (
      event: KeyboardEvent
    ) => {
      if (
        event.key.toLowerCase() !== "e"
      ) {
        return;
      }

      if (!mission || !nearTarget) {
        return;
      }

      if (phase === "goToPickup") {
        setPhase("goToDestination");

        setMessage(
          `${mission.job.icon} Package picked up! Now go to the blue destination.`
        );

        return;
      }

      if (phase === "goToDestination") {
        const reward = Math.floor(
          mission.job.reward *
            payMultiplier
        );

        setMoney(
          (oldMoney) =>
            oldMoney + reward
        );

        setXp((oldXp) => {
          const total =
            oldXp + mission.job.xp;

          if (total >= 100) {
            setLevel(
              (oldLevel) =>
                oldLevel + 1
            );

            setMessage(
              `🎉 LEVEL UP! You reached Level ${
                level + 1
              }`
            );

            return total - 100;
          }

          return total;
        });

        setPhase("complete");

        setMessage(
          `✅ ${mission.job.name} complete! +$${reward} +${mission.job.xp} XP`
        );

        setMission(null);

        return;
      }
    };

    window.addEventListener(
      "keydown",
      handleKey
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKey
      );
    };
  }, [
    mission,
    nearTarget,
    phase,
    payMultiplier,
    level,
  ]);

  /* =======================================================
     START MISSION
  ======================================================= */

  function startJob(job: Job) {
    if (mission) {
      setMessage(
        "Finish your current mission first."
      );
      return;
    }

    const pickupIndex =
      Math.floor(
        Math.random() *
          missionLocations.length
      );

    let destinationIndex =
      Math.floor(
        Math.random() *
          missionLocations.length
      );

    while (
      destinationIndex ===
      pickupIndex
    ) {
      destinationIndex =
        Math.floor(
          Math.random() *
            missionLocations.length
        );
    }

    const pickup =
      new THREE.Vector3(
        missionLocations[pickupIndex][0],
        0,
        missionLocations[pickupIndex][1]
      );

    const destination =
      new THREE.Vector3(
        missionLocations[destinationIndex][0],
        0,
        missionLocations[destinationIndex][1]
      );

    setMission({
      job,
      pickup,
      destination,
    });

    setPhase("goToPickup");
    setShowJobs(false);

    setMessage(
      `${job.icon} Mission started! Go to the green marker.`
    );
  }

  /* =======================================================
     BUY UPGRADE
  ======================================================= */

  function buyUpgrade(
    upgrade: Upgrade
  ) {
    if (money < upgrade.price) {
      setMessage(
        "❌ You don't have enough money."
      );
      return;
    }

    setMoney(
      (oldMoney) =>
        oldMoney - upgrade.price
    );

    if (
      upgrade.id === "speed"
    ) {
      setSpeed(
        (oldSpeed) =>
          oldSpeed + 2
      );
    }

    if (
      upgrade.id === "pay"
    ) {
      setPayMultiplier(
        (old) =>
          old + 0.25
      );
    }

    if (
      upgrade.id === "vehicle"
    ) {
      setSpeed(
        (oldSpeed) =>
          oldSpeed + 3
      );
    }

    if (
      upgrade.id === "multiplier"
    ) {
      setPayMultiplier(
        (old) =>
          old + 0.5
      );
    }

    setMessage(
      `✅ ${upgrade.name} purchased!`
    );

    setShowShop(false);
  }

  /* =======================================================
     RESET
  ======================================================= */

  function cancelMission() {
    setMission(null);
    setPhase("idle");

    setMessage(
      "Mission cancelled."
    );
  }

  /* =======================================================
     CURRENT TARGET
  ======================================================= */

  const targetDistance =
    mission &&
    phase !== "complete"
      ? Math.round(
          position.distanceTo(
            phase === "goToPickup"
              ? mission.pickup
              : mission.destination
          )
        )
      : null;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      {/* =================================================
          3D GAME
      ================================================= */}

      <Canvas
        shadows
        camera={{
          position: [0, 9, 13],
          fov: 55,
        }}
      >
        <color
          attach="background"
          args={["#87ceeb"]}
        />

        <fog
          attach="fog"
          args={[
            "#87ceeb",
            45,
            105,
          ]}
        />

        <World
          speed={speed}
          hairColor={hairColor}
          skinColor={skinColor}
          mission={mission}
          phase={phase}
          onMove={(newPosition) => {
            setPosition(newPosition);
          }}
        />

        <OrbitControls
          target={[
            position.x,
            1.5,
            position.z,
          ]}
          enablePan={false}
          minDistance={5}
          maxDistance={18}
          maxPolarAngle={
            Math.PI / 2.05
          }
        />
      </Canvas>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="pointer-events-none absolute left-0 right-0 top-0 flex items-start justify-between p-4">
        <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/75 px-5 py-3 text-white shadow-2xl backdrop-blur-xl">
          <div className="text-2xl font-black">
            Nova{" "}
            <span className="text-blue-400">
              City
            </span>
          </div>

          <div className="text-xs text-gray-400">
            Life Simulator
          </div>
        </div>

        <div className="flex gap-2">
          {/* Level */}
          <div className="rounded-2xl bg-black/75 px-4 py-3 text-white backdrop-blur-xl">
            <div className="text-[10px] text-gray-400">
              LEVEL
            </div>

            <div className="text-lg font-black">
              {level}
            </div>

            <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{
                  width: `${xp}%`,
                }}
              />
            </div>

            <div className="mt-1 text-[9px] text-gray-500">
              {xp}/100 XP
            </div>
          </div>

          {/* Money */}
          <div className="rounded-2xl bg-black/75 px-4 py-3 text-white backdrop-blur-xl">
            <div className="text-[10px] text-gray-400">
              MONEY
            </div>

            <div className="font-black text-green-400">
              ${money.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          MISSION MESSAGE
      ================================================= */}

      <div className="absolute left-1/2 top-24 w-[min(90vw,650px)] -translate-x-1/2 text-center">
        <div className="rounded-full border border-white/10 bg-black/70 px-6 py-3 text-sm font-bold text-white shadow-2xl backdrop-blur-xl">
          {message}
        </div>
      </div>

      {/* =================================================
          MISSION HUD
      ================================================= */}

      {mission && (
        <div className="absolute left-5 top-28 w-[300px] rounded-3xl border border-white/10 bg-black/80 p-5 text-white shadow-2xl backdrop-blur-xl">
          <div className="text-[10px] font-black uppercase tracking-widest text-blue-400">
            Active Mission
          </div>

          <div className="mt-2 text-xl font-black">
            {mission.job.icon}{" "}
            {mission.job.name}
          </div>

          <div className="mt-3 text-sm text-gray-300">
            {phase === "goToPickup" &&
              "Go to the green marker and press E."}

            {phase === "goToDestination" &&
              "Package collected! Go to the blue marker and press E."}
          </div>

          {targetDistance !== null && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
              <span className="text-xs text-gray-400">
                Distance
              </span>

              <span className="font-black text-blue-400">
                {targetDistance}m
              </span>
            </div>
          )}

          <div className="mt-3 flex justify-between text-xs">
            <span className="text-gray-400">
              Reward
            </span>

            <span className="font-black text-green-400">
              +$
              {Math.floor(
                mission.job.reward *
                  payMultiplier
              )}
            </span>
          </div>

          <div className="mt-1 flex justify-between text-xs">
            <span className="text-gray-400">
              XP
            </span>

            <span className="font-black text-blue-400">
              +{mission.job.xp}
            </span>
          </div>

          <button
            onClick={cancelMission}
            className="mt-4 w-full rounded-xl bg-red-500/20 px-4 py-2 text-xs font-black text-red-300 transition hover:bg-red-500/30"
          >
            Cancel Mission
          </button>
        </div>
      )}

      {/* =================================================
          INTERACTION
      ================================================= */}

      {nearTarget && mission && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2">
          <div className="rounded-2xl border border-blue-400/30 bg-blue-600/90 px-7 py-4 text-center text-white shadow-2xl">
            <div className="text-2xl font-black">
              Press E
            </div>

            <div className="mt-1 text-xs text-blue-100">
              {phase === "goToPickup"
                ? "Pick up package"
                : "Complete delivery"}
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          LEFT MENU
      ================================================= */}

      <div className="absolute bottom-5 left-5 flex flex-col gap-2">
        <button
          onClick={() =>
            setShowJobs(
              (old) => !old
            )
          }
          disabled={!!mission}
          className="rounded-2xl bg-blue-600 px-6 py-4 text-left font-black text-white shadow-xl transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          💼 Jobs
        </button>

        <button
          onClick={() =>
            setShowShop(
              (old) => !old
            )
          }
          className="rounded-2xl bg-black/80 px-6 py-4 text-left font-black text-white shadow-xl backdrop-blur-xl transition hover:bg-black"
        >
          🛒 Upgrade Shop
        </button>
      </div>

      {/* =================================================
          JOB PANEL
      ================================================= */}

      {showJobs && !mission && (
        <div className="absolute bottom-5 left-[145px] w-[360px] max-w-[calc(100vw-165px)] rounded-3xl border border-white/10 bg-black/90 p-5 text-white shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">
              Choose a Job
            </h2>

            <button
              onClick={() =>
                setShowJobs(false)
              }
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() =>
                  startJob(job)
                }
                className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {job.icon}
                  </span>

                  <div className="flex-1">
                    <div className="font-black">
                      {job.name}
                    </div>

                    <div className="text-xs text-gray-400">
                      {job.description}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-green-400">
                      +$
                      {Math.floor(
                        job.reward *
                          payMultiplier
                      )}
                    </div>

                    <div className="text-[10px] text-blue-400">
                      +{job.xp} XP
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* =================================================
          SHOP
      ================================================= */}

      {showShop && (
        <div className="absolute bottom-5 left-[145px] w-[360px] max-w-[calc(100vw-165px)] rounded-3xl border border-white/10 bg-black/90 p-5 text-white shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">
              Upgrade Shop
            </h2>

            <button
              onClick={() =>
                setShowShop(false)
              }
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {upgrades.map(
              (upgrade) => (
                <button
                  key={upgrade.id}
                  onClick={() =>
                    buyUpgrade(
                      upgrade
                    )
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {upgrade.icon}
                    </span>

                    <div className="flex-1">
                      <div className="font-black">
                        {upgrade.name}
                      </div>

                      <div className="text-xs text-gray-400">
                        {
                          upgrade.description
                        }
                      </div>
                    </div>

                    <div className="font-black text-yellow-400">
                      $
                      {upgrade.price.toLocaleString()}
                    </div>
                  </div>
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* =================================================
          CONTROLS
      ================================================= */}

      <div className="absolute bottom-5 right-5 rounded-2xl border border-white/10 bg-black/75 px-5 py-4 text-white shadow-xl backdrop-blur-xl">
        <div className="text-xs font-black uppercase tracking-widest text-gray-400">
          Controls
        </div>

        <div className="mt-2 text-xs leading-6">
          <div>
            <b className="text-blue-400">
              W A S D
            </b>{" "}
            Move
          </div>

          <div>
            <b className="text-blue-400">
              Mouse
            </b>{" "}
            Camera
          </div>

          <div>
            <b className="text-blue-400">
              E
            </b>{" "}
            Interact
          </div>

          <div>
            <b className="text-blue-400">
              Jobs
            </b>{" "}
            Start missions
          </div>
        </div>
      </div>

      {/* =================================================
          AVATAR PANEL
      ================================================= */}

      <div className="absolute right-5 top-44 rounded-2xl border border-white/10 bg-black/70 p-4 text-white backdrop-blur-xl">
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          Your Avatar
        </div>

        <div className="mt-2 flex items-center gap-3">
          <div
            className="relative h-10 w-10 rounded-full border-2 border-white/20"
            style={{
              backgroundColor:
                skinColor,
            }}
          >
            <div
              className="absolute -top-1 left-1 h-4 w-8 rounded-full"
              style={{
                backgroundColor:
                  hairColor,
              }}
            />
          </div>

          <div>
            <div className="text-sm font-black">
              Nova Player
            </div>

            <div className="text-xs text-gray-400">
              Avatar Studio
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}