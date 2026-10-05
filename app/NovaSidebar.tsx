"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    name: "Home",
    icon: "🏠",
    href: "/",
  },
  {
    name: "Discover",
    icon: "🔎",
    href: "/discover",
  },
  {
    name: "Games",
    icon: "🎮",
    href: "/games",
  },
  {
    name: "Favorites",
    icon: "⭐",
    href: "/favorites",
  },
  {
    name: "Friends",
    icon: "👥",
    href: "/friends",
  },
  {
    name: "Chat",
    icon: "💬",
    href: "/chat",
  },
];

export default function NovaSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-white/10 bg-[#050914] p-4 text-white">

      {/* NOVA LOGO */}
      <Link
        href="/"
        className="mb-8 flex items-center px-3 text-3xl font-black"
      >
        <span className="text-white">N</span>
        <span className="text-blue-500">ova</span>
      </Link>

      {/* MAIN MENU */}
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const active =
            pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 font-bold transition-all duration-200 ${
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-xl">
                {item.icon}
              </span>

              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* ACCOUNT */}
      <div className="mt-10">
        <p className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-600">
          Account
        </p>

        {/* AVATAR */}
        <Link
          href="/avatar"
          className={`flex items-center gap-3 rounded-xl px-4 py-3 font-bold transition-all duration-200 ${
            pathname === "/avatar"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-gray-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <span className="text-xl">
            👤
          </span>

          <span>Avatar</span>
        </Link>

        {/* SETTINGS */}
        <Link
          href="/settings"
          className={`mt-2 flex items-center gap-3 rounded-xl px-4 py-3 font-bold transition-all duration-200 ${
            pathname === "/settings"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-gray-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <span className="text-xl">
            ⚙️
          </span>

          <span>Settings</span>
        </Link>
      </div>

      {/* BOTTOM */}
      <div className="mt-auto rounded-2xl border border-white/5 bg-white/[0.03] p-4">
        <p className="text-sm font-bold text-white">
          Nova
        </p>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          Create. Play. Explore.
        </p>
      </div>
    </aside>
  );
}