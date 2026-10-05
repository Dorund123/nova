"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const selectedId = searchParams.get("user");

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    loadFriends(userId);
  }, [userId]);

  useEffect(() => {
    if (!userId || !selectedFriend) return;

    loadMessages(userId, selectedFriend.id);

    const channel = supabase
      .channel(`messages-${userId}-${selectedFriend.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const message = payload.new as Message;

          const belongsToChat =
            (message.sender_id === userId &&
              message.receiver_id === selectedFriend.id) ||
            (message.sender_id === selectedFriend.id &&
              message.receiver_id === userId);

          if (!belongsToChat) return;

          setMessages((current) => {
            if (current.some((item) => item.id === message.id)) {
              return current;
            }

            return [...current, message];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    setProfile(data);

    setLoading(false);
  }

  async function loadFriends(currentUserId: string) {
    const { data: friendships, error } = await supabase
      .from("friendships")
      .select("user_id, friend_id")
      .or(
        `user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`
      );

    if (error) {
      console.error(error);
      return;
    }

    const friendIds = ((friendships || []) as Friendship[]).map((friend) =>
      friend.user_id === currentUserId ? friend.friend_id : friend.user_id
    );

    if (friendIds.length === 0) {
      setFriends([]);
      return;
    }

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", friendIds);

    if (profileError) {
      console.error(profileError);
      return;
    }

    setFriends(profiles || []);

    const requestedFriend = selectedId
      ? (profiles || []).find((friend) => friend.id === selectedId)
      : null;

    if (requestedFriend) {
      setSelectedFriend(requestedFriend);
    } else if (!selectedFriend && profiles && profiles.length > 0) {
      setSelectedFriend(profiles[0]);
    }
  }

  async function loadMessages(
    currentUserId: string,
    friendId: string
  ) {
    setMessagesLoading(true);

    const { data, error } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id, content, created_at")
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${currentUserId})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      setMessages([]);
    } else {
      setMessages(data || []);
    }

    setMessagesLoading(false);
  }

  async function sendMessage() {
    if (!userId || !selectedFriend || !text.trim() || sending) {
      return;
    }

    const messageText = text.trim();

    setSending(true);
    setText("");

    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      receiver_id: selectedFriend.id,
      content: messageText,
    });

    if (error) {
      console.error(error);
      setText(messageText);
    }

    setSending(false);
  }

  const friendCountText = useMemo(() => {
    return `${friends.length} ${friends.length === 1 ? "friend" : "friends"}`;
  }, [friends.length]);

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f3f3] text-gray-500">
        Loading Messages...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f3f3] text-[#191919]">
      <header className="sticky top-0 z-50 h-16 border-b border-gray-200 bg-white">
        <div className="flex h-full items-center justify-between px-4 md:px-8">
          <button
            onClick={() => router.push("/")}
            className="text-2xl font-black tracking-tight text-[#5865f2]"
          >
            Nova
          </button>

          <div className="hidden items-center gap-8 md:flex">
            <button
              onClick={() => router.push("/")}
              className="text-sm font-semibold text-gray-600 hover:text-[#5865f2]"
            >
              Home
            </button>

            <button
              onClick={() => router.push("/friends")}
              className="text-sm font-semibold text-gray-600 hover:text-[#5865f2]"
            >
              Friends
            </button>

            <button
              className="text-sm font-semibold text-[#5865f2]"
            >
              Messages
            </button>
          </div>

          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5865f2] font-bold text-white">
                {profile?.username?.charAt(0).toUpperCase() || "N"}
              </div>
            )}

            <span className="hidden text-sm font-bold sm:block">
              {profile?.username}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 p-4 md:p-6">
        <aside className="hidden w-80 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white md:block">
          <div className="border-b border-gray-100 p-5">
            <h1 className="text-xl font-black">Messages</h1>
            <p className="mt-1 text-sm text-gray-500">
              {friendCountText}
            </p>
          </div>

          <div className="p-3">
            {friends.length === 0 ? (
              <div className="rounded-xl bg-gray-50 p-6 text-center">
                <div className="text-3xl">👥</div>
                <p className="mt-2 font-bold">No friends yet</p>
                <button
                  onClick={() => router.push("/friends")}
                  className="mt-4 rounded-lg bg-[#5865f2] px-4 py-2 text-sm font-bold text-white"
                >
                  Find Friends
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => {
                      setSelectedFriend(friend);
                      router.push(`/messages?user=${friend.id}`);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                      selectedFriend?.id === friend.id
                        ? "bg-[#eef0ff]"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="relative">
                      {friend.avatar_url ? (
                        <img
                          src={friend.avatar_url}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5865f2] font-bold text-white">
                          {friend.username.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-bold">
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

        <section className="flex min-h-[calc(100vh-7rem)] flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {!selectedFriend ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="text-6xl">💬</div>
              <h2 className="mt-5 text-2xl font-black">
                Your Messages
              </h2>
              <p className="mt-2 max-w-md text-gray-500">
                Choose a friend and start a conversation.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-gray-100 p-4">
                <button
                  onClick={() => router.push("/friends")}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
                >
                  ←
                </button>

                {selectedFriend.avatar_url ? (
                  <img
                    src={selectedFriend.avatar_url}
                    alt=""
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5865f2] font-bold text-white">
                    {selectedFriend.username.charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  <h2 className="font-black">
                    {selectedFriend.username}
                  </h2>

                  <p className="text-xs text-green-600">
                    ● Online
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-[#fafafa] p-4 md:p-6">
                {messagesLoading ? (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="text-5xl">👋</div>
                    <p className="mt-4 font-bold">
                      No messages yet
                    </p>
                    <p className="text-sm text-gray-500">
                      Send the first message.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const mine = message.sender_id === userId;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          mine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
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
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="border-t border-gray-100 bg-white p-4"
              >
                <div className="flex gap-2">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={`Message ${selectedFriend.username}...`}
                    className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#5865f2] focus:bg-white"
                  />

                  <button
                    type="submit"
                    disabled={!text.trim() || sending}
                    className="rounded-xl bg-[#5865f2] px-5 py-3 font-bold text-white transition hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? "..." : "Send"}
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