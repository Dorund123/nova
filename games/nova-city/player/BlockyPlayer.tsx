"use client";

export default function BlockyPlayer() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 1.45, 0]} castShadow>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshStandardMaterial color="#f5d0b0" />
      </mesh>

      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[0.7, 0.7, 0.38]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>

      <mesh position={[-0.48, 0.95, 0]} castShadow>
        <boxGeometry args={[0.22, 0.7, 0.22]} />
        <meshStandardMaterial color="#1d4ed8" />
      </mesh>

      <mesh position={[0.48, 0.95, 0]} castShadow>
        <boxGeometry args={[0.22, 0.7, 0.22]} />
        <meshStandardMaterial color="#1d4ed8" />
      </mesh>

      <mesh position={[-0.18, 0.32, 0]} castShadow>
        <boxGeometry args={[0.28, 0.64, 0.28]} />
        <meshStandardMaterial color="#111827" />
      </mesh>

      <mesh position={[0.18, 0.32, 0]} castShadow>
        <boxGeometry args={[0.28, 0.64, 0.28]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
    </group>
  );
}
