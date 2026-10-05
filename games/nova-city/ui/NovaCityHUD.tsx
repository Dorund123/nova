"use client";

import Link from "next/link";

type NovaCityHUDProps = {
  pointerLocked: boolean;
  onPlay: () => void;
};

export default function NovaCityHUD({
  pointerLocked,
  onPlay,
}: NovaCityHUDProps) {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between p-4">
        <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-white backdrop-blur-md">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
            Nova Game
          </p>
          <h1 className="text-2xl font-black">Nova City</h1>
          <p className="mt-1 text-xs text-white/70">Explore the first playable city.</p>
        </div>

        <Link
          href="/games"
          className="pointer-events-auto rounded-xl bg-white px-4 py-2 text-sm font-black text-black hover:bg-blue-100"
        >
          Leave Game
        </Link>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center p-4">
        <div className="rounded-2xl border border-white/10 bg-black/60 px-5 py-3 text-center text-sm text-white backdrop-blur-md">
          <p className="font-bold">WASD move · Mouse look · Space jump · Shift sprint</p>
          <p className="mt-1 text-xs text-white/60">Esc releases the mouse</p>
        </div>
      </div>

      {!pointerLocked && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/25">
          <button
            type="button"
            onClick={onPlay}
            className="pointer-events-auto rounded-2xl bg-blue-600 px-10 py-5 text-2xl font-black text-white shadow-2xl hover:bg-blue-500"
          >
            Click to Play Nova City
          </button>
        </div>
      )}
    </>
  );
}
