"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

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

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [friends, setFriends] = useState<Profile[]>([]);
  const [selectedFriend, setSelectedFriend] =
    useState<Profile | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] =
    useState(false);
  const [sending, setSending] = useState(false);

  const selectedId = searchParams.get("user");

  /*
    ==========================================
    LOAD CURRENT USER
    ==========================================
  */

  useEffect(() => {
    loadUser();
  }, []);

  /*
    ==========================================
    LOAD FRIENDS
    ==========================================
  */

  useEffect(() => {
    if (!userId) return;

    loadFriends(userId);
  }, [userId, selectedId]);

  /*
    ==========================================
    LOAD CHAT
    ==========================================
  */

  useEffect(() => {
    if (!userId || !selectedFriend) return;

    loadMessages(userId, selectedFriend.id);

    const channel = supabase
      .channel(
        `nova-messages-${userId}-${selectedFriend.id}`
      )
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
            if (
              current.some(
                (item) => item.id === message.id
              )
            ) {
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

  /*
    ==========================================
    AUTO SCROLL
    ==========================================
  */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /*
    ==========================================
    CURRENT USER
    ==========================================
  */

  async function loadUser() {
    setLoading(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error(
        "Auth error:",
        authError
      );
    }

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .select(
        "id, username, display_name, avatar_url"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error(
        "Profile error:",
        error
      );
    }

    setProfile(data || null);
    setLoading(false);
  }

  /*
    ==========================================
    LOAD ONLY REAL FRIENDS
    ==========================================
  */

  async function loadFriends(
    currentUserId: string
  ) {
    const {
      data: friendships,
      error,
    } = await supabase
      .from("friendships")
      .select(
        "user_id, friend_id"
      )
      .or(
        `user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`
      );

    if (error) {
      console.error(
        "Friendships error:",
        error
      );

      setFriends([]);
      setSelectedFriend(null);

      return;
    }

    const friendIds = (
      (friendships || []) as Friendship[]
    )
      .map((friendship) => {
        if (
          friendship.user_id ===
          currentUserId
        ) {
          return friendship.friend_id;
        }

        return friendship.user_id;
      })
      .filter(Boolean);

    /*
      No real friends
    */

    if (friendIds.length === 0) {
      setFriends([]);
      setSelectedFriend(null);
      setMessages([]);

      return;
    }

    /*
      Load profiles ONLY for friends
    */

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
        "Friends profiles error:",
        profileError
      );

      return;
    }

    const loadedFriends =
      (profiles || []) as Profile[];

    setFriends(loadedFriends);

    /*
      If URL contains ?user=ID,
      make sure that person is actually
      a friend before opening the chat.
    */

    if (selectedId) {
      const requestedFriend =
        loadedFriends.find(
          (friend) =>
            friend.id === selectedId
        );

      if (requestedFriend) {
        setSelectedFriend(
          requestedFriend
        );

        return;
      }
    }

    /*
      Keep current friend if still a friend
    */

    setSelectedFriend((current) => {
      if (
        current &&
        loadedFriends.some(
          (friend) =>
            friend.id === current.id
        )
      ) {
        return current;
      }

      return loadedFriends[0] || null;
    });
  }

  /*
    ==========================================
    LOAD MESSAGES
    ==========================================
  */

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
        "Messages load error:",
        error
      );

      setMessages([]);

      setMessagesLoading(false);

      return;
    }

    setMessages(
      (data || []) as Message[]
    );

    setMessagesLoading(false);
  }

  /*
    ==========================================
    CHECK FRIENDSHIP
    ==========================================
  */

  async function checkFriendship(
    currentUserId: string,
    friendId: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("friendships")
      .select(
        "id"
      )
      .or(
        `and(user_id.eq.${currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`
      )
      .maybeSingle();

    if (error) {
      console.error(
        "Friendship check error:",
        error
      );

      return false;
    }

    return Boolean(data);
  }

  /*
    ==========================================
    SEND MESSAGE
    ==========================================
  */

  async function sendMessage() {
    if (
      !userId ||
      !selectedFriend ||
      !text.trim() ||
      sending
    ) {
      return;
    }

    const messageText =
      text.trim();

    /*
      Double-check that the person
      is actually our friend.
    */

    const areFriends =
      await checkFriendship(
        userId,
        selectedFriend.id
      );

    if (!areFriends) {
      alert(
        "You can only message your friends."
      );

      await loadFriends(userId);

      return;
    }

    setSending(true);
    setText("");

    const {
      data,
      error,
    } = await supabase
      .from("messages")
      .insert({
        sender_id: userId,
        receiver_id:
          selectedFriend.id,
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

    /*
      Realtime normally adds this automatically.
      This check prevents duplicate messages.
    */

    if (data) {
      const newMessage =
        data as Message;

      setMessages((current) => {
        if (
          current.some(
            (item) =>
              item.id ===
              newMessage.id
          )
        ) {
          return current;
        }

        return [
          ...current,
          newMessage,
        ];
      });
    }

    setSending(false);
  }

  /*
    ==========================================
    SELECT FRIEND
    ==========================================
  */

  function openFriendChat(
    friend: Profile
  ) {
    setSelectedFriend(friend);

    router.push(
      `/messages?user=${friend.id}`
    );
  }

  /*
    ==========================================
    FRIEND COUNT
    ==========================================
  */

  const friendCountText =
    useMemo(() => {
      return `${friends.length} ${
        friends.length === 1
          ? "friend"
          : "friends"
      }`;
    }, [friends.length]);

  /*
    ==========================================
    FORMAT MESSAGE TIME
    ==========================================
  */

  function formatTime(
    date: string
  ) {
    return new Date(
      date
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /*
    ==========================================
    LOADING
    ==========================================
  */

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f3f3f3]">
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5865f2] text-2xl font-black text-white shadow-lg">
            N
          </div>

          <div className="mt-5 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#5865f2]" />

          <p className="mt-4 text-sm font-semibold text-gray-500">
            Loading Messages...
          </p>
        </div>
      </main>
    );
  }

  /*
    ==========================================
    MAIN UI
    ==========================================
  */

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f3f3f3] p-4 md:p-6">
      <div className="mx-auto flex max-w-7xl gap-6">

        {/* =====================================
            FRIEND LIST
        ====================================== */}

        <aside className="hidden w-80 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">

          <div className="border-b border-gray-100 p-5">
            <h1 className="text-xl font-black">
              Messages
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {friendCountText}
            </p>
          </div>

          <div className="p-3">

            {friends.length === 0 ? (
              <div className="rounded-xl bg-gray-50 p-6 text-center">

                <div className="text-3xl">
                  👥
                </div>

                <p className="mt-2 font-bold">
                  No friends yet
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Add someone as a friend
                  to start chatting.
                </p>

                <button
                  onClick={() =>
                    router.push(
                      "/friends"
                    )
                  }
                  className="mt-4 rounded-lg bg-[#5865f2] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#4752c4]"
                >
                  Find Friends
                </button>

              </div>
            ) : (

              <div className="space-y-1">

                {friends.map(
                  (friend) => (
                    <button
                      key={friend.id}
                      onClick={() =>
                        openFriendChat(
                          friend
                        )
                      }
                      className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                        selectedFriend?.id ===
                        friend.id
                          ? "bg-[#eef0ff]"
                          : "hover:bg-gray-50"
                      }`}
                    >

                      <div className="relative">

                        {friend.avatar_url ? (
                          <img
                            src={
                              friend.avatar_url
                            }
                            alt=""
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5865f2] font-bold text-white">
                            {friend.username
                              .charAt(
                                0
                              )
                              .toUpperCase()}
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
                  )
                )}

              </div>

            )}

          </div>
        </aside>

        {/* =====================================
            CHAT
        ====================================== */}

        <section className="flex min-h-[calc(100vh-8rem)] flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {!selectedFriend ? (

            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">

              <div className="text-6xl">
                💬
              </div>

              <h2 className="mt-5 text-2xl font-black">
                Your Messages
              </h2>

              <p className="mt-2 max-w-md text-gray-500">
                Add a friend first,
                then you can start
                chatting.
              </p>

              <button
                onClick={() =>
                  router.push(
                    "/friends"
                  )
                }
                className="mt-5 rounded-xl bg-[#5865f2] px-5 py-3 font-bold text-white transition hover:bg-[#4752c4]"
              >
                Find Friends
              </button>

            </div>

          ) : (

            <>

              {/* CHAT HEADER */}

              <div className="flex items-center gap-3 border-b border-gray-100 bg-white p-4">

                <button
                  onClick={() =>
                    router.push(
                      "/friends"
                    )
                  }
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
                >
                  ←
                </button>

                {selectedFriend.avatar_url ? (
                  <img
                    src={
                      selectedFriend.avatar_url
                    }
                    alt=""
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5865f2] font-bold text-white">
                    {selectedFriend.username
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">

                  <h2 className="truncate font-black">
                    {selectedFriend.username}
                  </h2>

                  <p className="text-xs text-green-600">
                    ● Friend
                  </p>

                </div>

              </div>

              {/* MESSAGES */}

              <div className="flex-1 space-y-3 overflow-y-auto bg-[#fafafa] p-4 md:p-6">

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

                  messages.map(
                    (message) => {

                      const mine =
                        message.sender_id ===
                        userId;

                      return (
                        <div
                          key={
                            message.id
                          }
                          className={`flex ${
                            mine
                              ? "justify-end"
                              : "justify-start"
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
                              {
                                message.content
                              }
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
                    }
                  )

                )}

                <div ref={bottomRef} />

              </div>

              {/* MESSAGE INPUT */}

              <form
                onSubmit={(event) => {
                  event.preventDefault();

                  sendMessage();
                }}
                className="border-t border-gray-100 bg-white p-4"
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
                    className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#5865f2] focus:bg-white"
                  />

                  <button
                    type="submit"
                    disabled={
                      !text.trim() ||
                      sending
                    }
                    className="rounded-xl bg-[#5865f2] px-5 py-3 font-bold text-white transition hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-50"
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

/*
====================================================
LOADING COMPONENT
====================================================
*/

function MessagesLoading() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f3f3f3]">

      <div className="flex flex-col items-center">

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5865f2] text-2xl font-black text-white shadow-lg">
          N
        </div>

        <div className="mt-5 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#5865f2]" />

        <p className="mt-4 text-sm font-semibold text-gray-500">
          Loading Messages...
        </p>

      </div>

    </main>
  );
}

/*
====================================================
MAIN EXPORT
====================================================
*/

export default function MessagesClient() {
  return (
    <Suspense
      fallback={
        <MessagesLoading />
      }
    >
      <MessagesContent />
    </Suspense>
  );
}