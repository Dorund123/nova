"use client";

import dynamic from "next/dynamic";

const NovaCityGame = dynamic(
  () => import("@/games/nova-city/NovaCityGame"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-[#020617] text-white">
        <p className="text-xl font-black">Loading Nova City…</p>
      </div>
    ),
  },
);

export default function NovaCityClient() {
  return <NovaCityGame />;
}
