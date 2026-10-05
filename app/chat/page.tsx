"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

type Friendship = {
  user_id: string;
  friend_id: string;
};

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

export default function ChatPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [selectedFriend, setSelectedFriend] =
    useState<Profile | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] =
    useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    loadFriends(userId);
  }, [userId]);

  useEffect(() => {
    if (!userId || !selectedFriend) {
      setMessages([]);
      return;
    }

    loadMessages(userId, selectedFriend.id);
  }, [userId, selectedFriend]);

  async function loadUser() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);
    setLoading(false);
  }

  async function loadFriends(currentUserId: string) {
    const {
      data: friendships,
      error,
    } = await supabase
      .from("friendships")
      .select("user_id, friend_id")
      .or(
        `user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`
      );

    if (error) {
      console.error("Friendships error:", error);
      setFriends([]);
      setSelectedFriend(null);
      return;
    }

    const friendIds = Array.from(
      new Set(
        ((friendships || []) as Friendship[]).map(
          (friendship) => {
            if (friendship.user_id === currentUserId) {
              return friendship.friend_id;
            }

            return friendship.user_id;
          }
        )
      )
    );

    if (friendIds.length === 0) {
      setFriends([]);
      setSelectedFriend(null);
      return;
    }

    const {
      data: profiles,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(
        "id, username, display_name, avatar_url"
      )
      .in("id", friendIds);

    if (profileError) {
      console.error(
        "Profiles error:",
        profileError
      );

      setFriends([]);
      setSelectedFriend(null);
      return;
    }

    const loadedFriends =
      (profiles || []) as Profile[];

    setFriends(loadedFriends);

    setSelectedFriend((current) => {
      if (
        current &&
        loadedFriends.some(
          (friend) => friend.id === current.id
        )
      ) {
        return current;
      }

      return loadedFriends[0] || null;
    });
  }

  async function loadMessages(
    currentUserId: string,
    friendId: string
  ) {
    setMessagesLoading(true);

    const {
      data,
      error,
    } = await supabase
      .from("messages")
      .select(
        "id, sender_id, receiver_id, content, created_at"
      )
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUserId})`
      )
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Messages error:",
        error
      );

      setMessages([]);
    } else {
      setMessages(
        (data || []) as Message[]
      );
    }

    setMessagesLoading(false);
  }

  async function sendMessage() {
    if (
      !userId ||
      !selectedFriend ||
      !text.trim() ||
      sending
    ) {
      return;
    }

    const messageText = text.trim();

    setSending(true);
    setText("");

    const {
      data,
      error,
    } = await supabase
      .from("messages")
      .insert({
        sender_id: userId,
        receiver_id: selectedFriend.id,
        content: messageText,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Send message error:",
        error
      );

      setText(messageText);

      alert(
        `Could not send message.\n\n${error.message}`
      );

      setSending(false);
      return;
    }

    if (data) {
      setMessages((current) => [
        ...current,
        data as Message,
      ]);
    }

    setSending(false);
  }

  function avatar(friend: Profile) {
    if (friend.avatar_url) {
      return (
        <img
          src={friend.avatar_url}
          alt=""
          className="h-12 w-12 rounded-full object-cover"
        />
      );
    }

    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5865f2] font-black text-white">
        {friend.username
          .charAt(0)
          .toUpperCase()}
      </div>
    );
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f3f3]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5865f2] text-2xl font-black text-white">
            N
          </div>

          <p className="mt-4 font-semibold text-gray-500">
            Loading...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f3f3] p-4 md:p-6">
      <div className="mx-auto flex max-w-7xl gap-6">
        {/* FRIENDS */}

        <aside className="w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <button
              onClick={() => router.push("/")}
              className="mb-4 text-sm font-bold text-[#5865f2]"
            >
              ← Back to Nova
            </button>

            <h1 className="text-2xl font-black">
              Messages
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Chat with your friends
            </p>
          </div>

          <div className="p-3">
            {friends.length === 0 ? (
              <div className="rounded-xl bg-gray-50 p-6 text-center">
                <div className="text-4xl">
                  👥
                </div>

                <h2 className="mt-3 font-black">
                  No friends yet
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Add someone as a friend
                  to start chatting.
                </p>

                <button
                  onClick={() =>
                    router.push("/friends")
                  }
                  className="mt-4 rounded-xl bg-[#5865f2] px-5 py-3 font-bold text-white transition hover:opacity-90"
                >
                  Find Friends
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() =>
                      setSelectedFriend(friend)
                    }
                    className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                      selectedFriend?.id ===
                      friend.id
                        ? "bg-[#eef0ff]"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="relative">
                      {avatar(friend)}

                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-black">
                        {friend.username}
                      </p>

                      <p className="truncate text-xs text-gray-500">
                        {friend.display_name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* CHAT */}

        <section className="hidden min-h-[calc(100vh-3rem)] flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:flex">
          {!selectedFriend ? (
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="text-6xl">
                💬
              </div>

              <h2 className="mt-5 text-2xl font-black">
                Your Messages
              </h2>

              <p className="mt-2 text-gray-500">
                Select a friend to start chatting.
              </p>
            </div>
          ) : (
            <>
              {/* CHAT HEADER */}

              <div className="flex items-center gap-3 border-b border-gray-100 p-5">
                {avatar(selectedFriend)}

                <div>
                  <h2 className="font-black">
                    {selectedFriend.username}
                  </h2>

                  <p className="text-xs text-green-600">
                    ● Friend
                  </p>
                </div>
              </div>

              {/* MESSAGES */}

              <div className="flex-1 space-y-3 overflow-y-auto bg-[#fafafa] p-6">
                {messagesLoading ? (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="text-5xl">
                      👋
                    </div>

                    <p className="mt-4 font-bold">
                      No messages yet
                    </p>

                    <p className="text-sm text-gray-500">
                      Send the first message.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const mine =
                      message.sender_id ===
                      userId;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          mine
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                            mine
                              ? "rounded-br-md bg-[#5865f2] text-white"
                              : "rounded-bl-md bg-white text-gray-900 shadow-sm"
                          }`}
                        >
                          <p className="break-words text-sm">
                            {message.content}
                          </p>

                          <p
                            className={`mt-1 text-[10px] ${
                              mine
                                ? "text-white/70"
                                : "text-gray-400"
                            }`}
                          >
                            {formatTime(
                              message.created_at
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* MESSAGE INPUT */}

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  sendMessage();
                }}
                className="border-t border-gray-100 p-4"
              >
                <div className="flex gap-2">
                  <input
                    value={text}
                    onChange={(event) =>
                      setText(
                        event.target.value
                      )
                    }
                    placeholder={`Message ${selectedFriend.username}...`}
                    maxLength={2000}
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-[#5865f2]"
                  />

                  <button
                    type="submit"
                    disabled={
                      !text.trim() ||
                      sending
                    }
                    className="rounded-xl bg-[#5865f2] px-6 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending
                      ? "..."
                      : "Send"}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}