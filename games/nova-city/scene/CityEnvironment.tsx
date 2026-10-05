"use client";

import { BUILDINGS } from "../constants";

function Building({
  x,
  z,
  w,
  d,
  h,
  color,
  accent,
}: {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  accent?: string;
}) {
  return (
    <group position={[x, h / 2, z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.38} metalness={0.12} />
      </mesh>
      <mesh position={[0, h * 0.18, d / 2 + 0.05]}>
        <boxGeometry args={[w * 0.7, h * 0.55, 0.08]} />
        <meshStandardMaterial
          color={accent ?? "#dbeafe"}
          emissive={accent ?? "#93c5fd"}
          emissiveIntensity={0.25}
        />
      </mesh>
    </group>
  );
}

function StreetLamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 3.2, 8]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0, 3.25, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial
          color="#fde68a"
          emissive="#fbbf24"
          emissiveIntensity={1.4}
        />
      </mesh>
      <pointLight position={[0, 3.2, 0]} intensity={4} distance={12} color="#fde68a" />
    </group>
  );
}

export default function CityEnvironment() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#86a0b8" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[14, 120]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[120, 14]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[0.28, 120]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[120, 0.28]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>

      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[7.5, 32]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[2.2, 2.4, 0.4, 24]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[1.4, 1.4, 0.3, 24]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.7}
          roughness={0.1}
        />
      </mesh>

      {BUILDINGS.map((building, index) => (
        <Building key={index} {...building} />
      ))}

      <StreetLamp x={-8} z={8} />
      <StreetLamp x={8} z={8} />
      <StreetLamp x={-8} z={-8} />
      <StreetLamp x={8} z={-8} />
      <StreetLamp x={0} z={18} />
      <StreetLamp x={0} z={-18} />
    </group>
  );
}
