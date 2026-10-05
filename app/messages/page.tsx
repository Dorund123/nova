"use client";

import { useRouter } from "next/navigation";
import MessagesClient from "./MessagesClient";

export default function MessagesPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#f3f3f3]">
      {/* Nova Header */}
      <header className="sticky top-0 z-50 h-16 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold text-gray-500 transition hover:bg-gray-100 hover:text-[#5865f2]"
              aria-label="Go back"
            >
              ←
            </button>

            <button
              onClick={() => router.push("/")}
              className="text-2xl font-black tracking-tight text-[#5865f2] transition hover:opacity-80"
            >
              Nova
            </button>

            <div className="hidden h-6 w-px bg-gray-200 sm:block" />

            <span className="hidden text-sm font-semibold text-gray-500 sm:block">
              Messages
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />

            <span className="text-xs font-bold text-green-600">
              Online
            </span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="mx-auto max-w-7xl">
        <MessagesClient />
      </div>
    </main>
  );
}