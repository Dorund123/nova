"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-[250px] border-r border-white/10 bg-[#0c101b] p-5">
        {/* Logo */}
        <div
          onClick={() => router.push("/")}
          className="mb-10 cursor-pointer text-3xl font-black"
        >
          <span className="text-white">N</span>
          <span className="text-blue-500">ova</span>
        </div>

        {/* Main */}
        <div>
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-gray-500">
            Main
          </p>

          <nav className="space-y-1">
            <button
              onClick={() => router.push("/")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              🏠
              <span>Home</span>
            </button>

            <button
              onClick={() => router.push("/discover")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              🔎
              <span>Discover</span>
            </button>

            <button
              onClick={() => router.push("/games")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              🎮
              <span>Games</span>
            </button>

            <button
              onClick={() => router.push("/favorites")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              ⭐
              <span>Favorites</span>
            </button>

            <button
              onClick={() => router.push("/friends")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              👥
              <span>Friends</span>
            </button>
          </nav>
        </div>

        {/* Account */}
        <div className="mt-8">
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-gray-500">
            Account
          </p>

          <nav className="space-y-1">
            <button
              onClick={() => router.push("/profile")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              👤
              <span>My Profile</span>
            </button>

            <button
              onClick={() => router.push("/avatar")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              🎨
              <span>Avatar</span>
            </button>

            {/* Active Settings */}
            <button
              onClick={() => router.push("/settings")}
              className="flex w-full items-center gap-3 rounded-xl bg-blue-600/15 px-4 py-3 font-semibold text-blue-400"
            >
              ⚙️
              <span>Settings</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <section className="ml-[250px] min-h-screen p-10">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-10">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-4xl">⚙️</span>

              <h1 className="text-4xl font-black">
                Settings
              </h1>
            </div>

            <p className="text-gray-400">
              Manage your Nova account and preferences.
            </p>
          </div>

          {/* Account */}
          <section className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-[#0d121f]">
            <div className="border-b border-white/10 p-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👤</span>

                <div>
                  <h2 className="text-xl font-bold">
                    Account
                  </h2>

                  <p className="text-sm text-gray-500">
                    Manage your Nova account
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-white/10">
              <button
                onClick={() => router.push("/profile")}
                className="flex w-full items-center justify-between p-6 text-left transition hover:bg-white/5"
              >
                <div>
                  <p className="font-semibold">
                    My Profile
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    View and edit your profile
                  </p>
                </div>

                <span className="text-gray-500">
                  →
                </span>
              </button>

              <button
                onClick={() => router.push("/avatar")}
                className="flex w-full items-center justify-between p-6 text-left transition hover:bg-white/5"
              >
                <div>
                  <p className="font-semibold">
                    Avatar
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Customize your Nova avatar
                  </p>
                </div>

                <span className="text-gray-500">
                  →
                </span>
              </button>
            </div>
          </section>

          {/* Notifications */}
          <section className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-[#0d121f]">
            <div className="border-b border-white/10 p-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔔</span>

                <div>
                  <h2 className="text-xl font-bold">
                    Notifications
                  </h2>

                  <p className="text-sm text-gray-500">
                    Choose what notifications you receive
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-6">
              <div>
                <p className="font-semibold">
                  Notifications
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Receive Nova notifications
                </p>
              </div>

              <button
                onClick={() =>
                  setNotifications(!notifications)
                }
                className={`relative h-7 w-12 rounded-full transition ${
                  notifications
                    ? "bg-blue-600"
                    : "bg-gray-700"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    notifications
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Appearance */}
          <section className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-[#0d121f]">
            <div className="border-b border-white/10 p-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎨</span>

                <div>
                  <h2 className="text-xl font-bold">
                    Appearance
                  </h2>

                  <p className="text-sm text-gray-500">
                    Customize how Nova looks
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-6">
              <div>
                <p className="font-semibold">
                  Dark Mode
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Use Nova's dark appearance
                </p>
              </div>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative h-7 w-12 rounded-full transition ${
                  darkMode
                    ? "bg-blue-600"
                    : "bg-gray-700"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    darkMode
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Privacy */}
          <section className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-[#0d121f]">
            <div className="border-b border-white/10 p-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>

                <div>
                  <h2 className="text-xl font-bold">
                    Privacy
                  </h2>

                  <p className="text-sm text-gray-500">
                    Control your profile visibility
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-6">
              <div>
                <p className="font-semibold">
                  Private Profile
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Hide your profile from other players
                </p>
              </div>

              <button
                onClick={() =>
                  setPrivateProfile(!privateProfile)
                }
                className={`relative h-7 w-12 rounded-full transition ${
                  privateProfile
                    ? "bg-blue-600"
                    : "bg-gray-700"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    privateProfile
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Logout */}
          <section className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
            <div className="flex items-center justify-between gap-5">
              <div>
                <h2 className="font-bold text-red-400">
                  Log Out
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Sign out of your Nova account.
                </p>
              </div>

              <button
                onClick={() => router.push("/login")}
                className="rounded-xl border border-red-500/30 px-5 py-3 font-semibold text-red-400 transition hover:bg-red-500/10"
              >
                Log Out
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}