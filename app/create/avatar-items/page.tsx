"use client";

import { useRouter } from "next/navigation";

export default function AvatarItemsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#111214] text-white">
      <div className="border-b border-[#292b30] bg-[#18191c]">
        <div className="mx-auto flex h-[72px] max-w-[1100px] items-center justify-between px-5">
          <h1 className="text-xl font-black">
            NOVA CREATOR
          </h1>

          <button
            onClick={() => router.push("/create")}
            className="text-sm font-bold text-slate-400 hover:text-white"
          >
            ← Experiences
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1000px] px-5 py-12">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
          CREATIONS
        </div>

        <h2 className="mt-2 text-4xl font-black">
          Avatar Items
        </h2>

        <div className="mt-8 rounded-xl border border-dashed border-[#303238] bg-[#18191c] p-16 text-center">
          <div className="text-6xl">👕</div>

          <h3 className="mt-5 text-xl font-black">
            Avatar Items
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Your created avatar items will appear here.
          </p>
        </div>
      </div>
    </main>
  );
}