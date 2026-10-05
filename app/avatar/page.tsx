"use client";

import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
} from "@react-three/drei";
import PlayerModel from "../PlayerModel";

export default function AvatarPage() {
  return (
    <main className="min-h-screen bg-[#030712] text-white">
      {/* TOP BAR */}
      <header className="flex h-16 items-center justify-between border-b border-white/10 bg-black/30 px-6 backdrop-blur-xl">
        <Link
          href="/"
          className="text-xl font-black transition hover:scale-105"
        >
          <span className="text-white">N</span>
          <span className="text-blue-500">ova</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 font-bold transition hover:bg-white/10"
          >
            Home
          </Link>

          <span className="rounded-xl bg-blue-600 px-5 py-2 font-bold">
            Avatar
          </span>
        </div>
      </header>

      {/* AVATAR */}
      <section className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6">
        <div className="h-[700px] w-full max-w-[1100px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#111827] to-[#030712] shadow-2xl">
          <Canvas
            camera={{
              position: [0, 1.2, 6],
              fov: 45,
            }}
          >
            <ambientLight intensity={1.5} />

            <directionalLight
              position={[5, 8, 5]}
              intensity={2}
            />

            <Environment preset="city" />

            <PlayerModel
              body="Default"
              clothing="Default Outfit"
              accessory="None"
              hair="Default Hair"
              hairSize={1}
            />

            <OrbitControls
              target={[0, 0.5, 0]}
              minDistance={3}
              maxDistance={8}
            />
          </Canvas>
        </div>
      </section>
    </main>
  );
}