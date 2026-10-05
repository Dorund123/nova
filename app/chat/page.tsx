"use client";

import Link from "next/link";
import { useState } from "react";

type Friend = {
  id: number;
  name: string;
  online: boolean;
  avatar: string;
};

const friends: Friend[] = [
  {
    id: 1,
    name: "Alex",
    online: true,
    avatar: "A",
  },
  {
    id: 2,
    name: "Mike",
    online: true,
    avatar: "M",
  },
  {
    id: 3,
    name: "John",
    online: false,
    avatar: "J",
  },
  {
    id: 4,
    name: "David",
    online: true,
    avatar: "D",
  },
];

export default function ChatPage() {
  const [selectedFriend, setSelectedFriend] =
    useState<Friend>(friends[0]);

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      text: "Hey! 👋",
      mine: false,
    },
    {
      text: "Hey bro! What's up?",
      mine: true,
    },
  ]);

  function selectFriend(friend: Friend) {
    setSelectedFriend(friend);

    setMessages([
      {
        text: `Hey! I'm ${friend.name} 👋`,
        mine: false,
      },
    ]);
  }

  function sendMessage() {
    const cleanMessage = message.trim();

    if (!cleanMessage) return;

    setMessages((current) => [
      ...current,
      {
        text: cleanMessage,
        mine: true,
      },
    ]);

    setMessage("");
  }

  return (
    <main className="min-h-screen bg-[#f3f3f3] text-[#171717]">

      {/* HEADER */}
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">

        <div className="flex items-center gap-8">

          <Link
            href="/"
            className="text-3xl font-black"
          >
            <span className="text-black">N</span>
            <span className="text-blue-600">ova</span>
          </Link>

          <Link
            href="/"
            className="rounded-xl px-4 py-2 font-bold text-gray-500 transition hover:bg-gray-100"
          >
            🏠 Home
          </Link>

          <span className="rounded-xl bg-blue-50 px-4 py-2 font-black text-blue-600">
            💬 Chat
          </span>

        </div>

        {/* GAME STATS */}
        <div className="hidden items-center gap-3 md:flex">

          <div className="rounded-xl bg-green-50 px-4 py-2">
            <span className="text-green-600">🟢</span>{" "}
            <b>1,248</b>{" "}
            <span className="text-gray-500">
              Online
            </span>
          </div>

          <div className="rounded-xl bg-blue-50 px-4 py-2">
            <span className="text-blue-600">👁️</span>{" "}
            <b>24,891</b>{" "}
            <span className="text-gray-500">
              Visited
            </span>
          </div>

          <div className="rounded-xl bg-purple-50 px-4 py-2">
            <span className="text-purple-600">👤</span>{" "}
            <b>5,432</b>{" "}
            <span className="text-gray-500">
              Registered
            </span>
          </div>

        </div>

      </header>

      {/* CHAT */}
      <div className="mx-auto flex h-[calc(100vh-64px)] max-w-[1400px] p-5">

        <div className="flex w-full overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

          {/* FRIENDS */}
          <aside className="w-80 border-r border-gray-200">

            <div className="border-b border-gray-200 p-5">

              <h1 className="text-2xl font-black">
                Messages
              </h1>

              <p className="mt-1 text-sm text-gray-400">
                Chat with your friends
              </p>

            </div>

            <div className="p-3">

              {friends.map((friend) => {

                const active =
                  selectedFriend.id === friend.id;

                return (
                  <button
                    key={friend.id}
                    onClick={() =>
                      selectFriend(friend)
                    }
                    className={`mb-2 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                      active
                        ? "bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                  >

                    <div className="relative">

                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-black text-white">
                        {friend.avatar}
                      </div>

                      {friend.online && (
                        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
                      )}

                    </div>

                    <div>

                      <p className="font-black">
                        {friend.name}
                      </p>

                      <p
                        className={`text-xs ${
                          friend.online
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                      >
                        {friend.online
                          ? "Online"
                          : "Offline"}
                      </p>

                    </div>

                  </button>
                );
              })}

            </div>

          </aside>

          {/* CHAT WINDOW */}
          <section className="flex min-w-0 flex-1 flex-col">

            {/* FRIEND HEADER */}
            <div className="flex items-center gap-3 border-b border-gray-200 p-5">

              <div className="relative">

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-black text-white">
                  {selectedFriend.avatar}
                </div>

                {selectedFriend.online && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                )}

              </div>

              <div>

                <h2 className="font-black">
                  {selectedFriend.name}
                </h2>

                <p className="text-xs text-gray-400">
                  {selectedFriend.online
                    ? "Online"
                    : "Offline"}
                </p>

              </div>

            </div>

            {/* MESSAGES */}
            <div className="flex-1 space-y-4 overflow-y-auto p-6">

              {messages.map((item, index) => (

                <div
                  key={index}
                  className={`flex ${
                    item.mine
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      item.mine
                        ? "rounded-br-md bg-blue-600 text-white"
                        : "rounded-bl-md bg-gray-100 text-gray-800"
                    }`}
                  >
                    {item.text}
                  </div>

                </div>

              ))}

            </div>

            {/* MESSAGE INPUT */}
            <div className="border-t border-gray-200 p-4">

              <div className="flex gap-3">

                <input
                  value={message}
                  onChange={(e) =>
                    setMessage(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendMessage();
                    }
                  }}
                  placeholder={`Message ${selectedFriend.name}...`}
                  className="h-12 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 outline-none focus:border-blue-500 focus:bg-white"
                />

                <button
                  onClick={sendMessage}
                  className="rounded-xl bg-blue-600 px-6 font-black text-white transition hover:bg-blue-700"
                >
                  Send
                </button>

              </div>

            </div>

          </section>

        </div>

      </div>

    </main>
  );
}