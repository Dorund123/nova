"use client";

import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import { useGameInput } from "./input/useGameInput";
import ThirdPersonPlayer from "./player/ThirdPersonPlayer";
import CityEnvironment from "./scene/CityEnvironment";
import NovaCityHUD from "./ui/NovaCityHUD";

export default function NovaCityGame() {
  const { keys, yaw, pitch, pointerLocked } = useGameInput();
  const canvasRoot = useRef<HTMLDivElement>(null);

  function requestPointerLock() {
    canvasRoot.current
      ?.querySelector("canvas")
      ?.requestPointerLock();
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#020617] text-white">
      <div ref={canvasRoot} className="h-full w-full">
        <Canvas
          shadows
          camera={{ fov: 60, near: 0.1, far: 250, position: [0, 8, 16] }}
          onContextMenu={(event) => event.preventDefault()}
        >
          <color attach="background" args={["#87bfff"]} />
          <fog attach="fog" args={["#b9d7ff", 55, 140]} />
          <Sky sunPosition={[100, 80, 40]} turbidity={4} rayleigh={0.6} />
          <hemisphereLight args={["#ffffff", "#64748b", 1.15]} />
          <ambientLight intensity={1.05} />
          <directionalLight
            castShadow
            position={[30, 50, 20]}
            intensity={2.4}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={120}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
          />
          <CityEnvironment />
          <ThirdPersonPlayer keys={keys} yaw={yaw} pitch={pitch} />
        </Canvas>
      </div>

      <NovaCityHUD pointerLocked={pointerLocked} onPlay={requestPointerLock} />
    </div>
  );
}
