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

type FriendRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
};

type Friend = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

export default function FriendsPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Profile[]>([]);

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    await Promise.all([
      loadFriends(user.id),
      loadRequests(user.id),
    ]);

    setLoading(false);
  }

  async function loadFriends(id: string) {
    const { data, error } = await supabase
      .from("friendships")
      .select("id, user_id, friend_id")
      .or(`user_id.eq.${id},friend_id.eq.${id}`);

    if (error) {
      console.error("Friends error:", error);
      setFriends([]);
      return;
    }

    const friendIds = (data || []).map((friendship) =>
      friendship.user_id === id
        ? friendship.friend_id
        : friendship.user_id
    );

    if (friendIds.length === 0) {
      setFriends([]);
      return;
    }

    const { data: profiles, error: profilesError } =
      await supabase
        .from("profiles")
        .select(
          "id, username, display_name, avatar_url"
        )
        .in("id", friendIds);

    if (profilesError) {
      console.error(
        "Friend profiles error:",
        profilesError
      );
      setFriends([]);
      return;
    }

    setFriends(profiles || []);
  }

  async function loadRequests(id: string) {
    const { data, error } = await supabase
      .from("friend_requests")
      .select("*")
      .or(`receiver_id.eq.${id},sender_id.eq.${id}`)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Requests error:", error);
      setRequests([]);
      setSentRequests([]);
      return;
    }

    const allRequests = data || [];

    const incoming = allRequests.filter(
      (request) =>
        request.receiver_id === id &&
        request.status === "pending"
    );

    const outgoing = allRequests.filter(
      (request) =>
        request.sender_id === id &&
        request.status === "pending"
    );

    const profileIds = Array.from(
      new Set(
        allRequests.flatMap((request) => [
          request.sender_id,
          request.receiver_id,
        ])
      )
    );

    let profiles: Profile[] = [];

    if (profileIds.length > 0) {
      const { data: profileData } =
        await supabase
          .from("profiles")
          .select(
            "id, username, display_name, avatar_url"
          )
          .in("id", profileIds);

      profiles = profileData || [];
    }

    const profileMap = new Map(
      profiles.map((profile) => [
        profile.id,
        profile,
      ])
    );

    const attachProfiles = (
      items: FriendRequest[]
    ) =>
      items.map((request) => ({
        ...request,
        sender: profileMap.get(
          request.sender_id
        ),
        receiver: profileMap.get(
          request.receiver_id
        ),
      }));

    setRequests(attachProfiles(incoming));
    setSentRequests(attachProfiles(outgoing));
  }

  async function searchUsers() {
    const query = search.trim();

    if (!query) {
      setResults([]);
      return;
    }

    setSearching(true);

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, username, display_name, avatar_url"
      )
      .ilike("username", `%${query}%`)
      .limit(20);

    if (error) {
      console.error("Search error:", error);
      setSearching(false);
      return;
    }

    setResults(
      (data || []).filter(
        (profile) => profile.id !== userId
      )
    );

    setSearching(false);
  }

  async function sendRequest(receiverId: string) {
    if (!userId) return;

    // უკვე მეგობარია?
    const alreadyFriend = friends.some(
      (friend) => friend.id === receiverId
    );

    if (alreadyFriend) {
      alert("You are already friends.");
      return;
    }

    // უკვე გაგზავნილია?
    const alreadySent = sentRequests.some(
      (request) =>
        request.receiver_id === receiverId &&
        request.status === "pending"
    );

    if (alreadySent) {
      alert("Friend request already sent.");
      return;
    }

    // მეორე მომხმარებელმა ხომ არ გამოგიგზავნა?
    const incomingRequest = requests.some(
      (request) =>
        request.sender_id === receiverId &&
        request.status === "pending"
    );

    if (incomingRequest) {
      alert(
        "This player already sent you a friend request."
      );
      return;
    }

    const { error } = await supabase
      .from("friend_requests")
      .insert({
        sender_id: userId,
        receiver_id: receiverId,
        status: "pending",
      });

    if (error) {
      console.error(
        "Send request error:",
        error
      );

      alert("Could not send friend request.");
      return;
    }

    alert("Friend request sent!");

    await loadRequests(userId);
  }

  async function acceptRequest(
    request: FriendRequest
  ) {
    if (!userId) return;

    const { error: updateError } =
      await supabase
        .from("friend_requests")
        .update({
          status: "accepted",
        })
        .eq("id", request.id)
        .eq("receiver_id", userId);

    if (updateError) {
      console.error(updateError);
      alert("Could not accept request.");
      return;
    }

    // ერთი friendship record საკმარისია,
    // რადგან loadFriends ორივე მიმართულებას ამოწმებს.
    const { error: friendshipError } =
      await supabase
        .from("friendships")
        .insert({
          user_id: request.sender_id,
          friend_id: request.receiver_id,
        });

    if (friendshipError) {
      console.error(
        "Friendship error:",
        friendshipError
      );

      alert("Could not create friendship.");
      return;
    }

    await loadFriends(userId);
    await loadRequests(userId);
  }

  async function declineRequest(
    requestId: string
  ) {
    if (!userId) return;

    const { error } = await supabase
      .from("friend_requests")
      .update({
        status: "declined",
      })
      .eq("id", requestId)
      .eq("receiver_id", userId);

    if (error) {
      console.error(error);
      return;
    }

    await loadRequests(userId);
  }

  async function cancelRequest(
    requestId: string
  ) {
    if (!userId) return;

    const { error } = await supabase
      .from("friend_requests")
      .delete()
      .eq("id", requestId)
      .eq("sender_id", userId);

    if (error) {
      console.error(error);
      return;
    }

    await loadRequests(userId);
  }

  async function removeFriend(friendId: string) {
    if (!userId) return;

    const { error } = await supabase
      .from("friendships")
      .delete()
      .or(
        `and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`
      );

    if (error) {
      console.error(error);
      return;
    }

    await loadFriends(userId);
  }

  function avatar(profile: {
    username: string;
    avatar_url: string | null;
  }) {
    if (profile.avatar_url) {
      return (
        <img
          src={profile.avatar_url}
          alt={profile.username}
          className="h-full w-full object-cover"
        />
      );
    }

    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-black text-white">
        {profile.username
          ?.charAt(0)
          .toUpperCase() || "N"}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0c101b]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <button
            onClick={() => router.push("/")}
            className="text-3xl font-black"
          >
            <span className="text-white">N</span>
            <span className="text-blue-500">
              ova
            </span>
          </button>

          <button
            onClick={() => router.push("/")}
            className="rounded-xl px-4 py-2 text-sm font-bold text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            ← Home
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        {/* TITLE */}
        <div>
          <h1 className="text-4xl font-black sm:text-5xl">
            👥 Friends
          </h1>

          <p className="mt-2 text-gray-400">
            Find players and connect with your
            Nova friends.
          </p>
        </div>

        {/* SEARCH */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-[#0d121f] p-5">
          <h2 className="text-lg font-black">
            🔎 Find People
          </h2>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchUsers();
                }
              }}
              placeholder="Search by username..."
              className="flex-1 rounded-xl border border-white/10 bg-[#080b14] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500"
            />

            <button
              onClick={searchUsers}
              disabled={searching}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {searching
                ? "Searching..."
                : "Search"}
            </button>
          </div>

          {/* SEARCH RESULTS */}
          {results.length > 0 && (
            <div className="mt-5 space-y-3">
              {results.map((profile) => {
                const alreadyFriend =
                  friends.some(
                    (friend) =>
                      friend.id === profile.id
                  );

                const pending =
                  sentRequests.some(
                    (request) =>
                      request.receiver_id ===
                        profile.id &&
                      request.status === "pending"
                  );

                return (
                  <div
                    key={profile.id}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#080b14] p-3"
                  >
                    <div className="h-12 w-12 overflow-hidden rounded-full">
                      {avatar(profile)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black">
                        {profile.username}
                      </p>

                      <p className="truncate text-xs text-gray-500">
                        {profile.display_name}
                      </p>
                    </div>

                    {alreadyFriend ? (
                      <span className="rounded-xl bg-green-500/10 px-4 py-2 text-xs font-black text-green-400">
                        ✓ Friends
                      </span>
                    ) : pending ? (
                      <button
                        onClick={() => {
                          const request =
                            sentRequests.find(
                              (item) =>
                                item.receiver_id ===
                                profile.id
                            );

                          if (request) {
                            cancelRequest(
                              request.id
                            );
                          }
                        }}
                        className="rounded-xl bg-yellow-500/10 px-4 py-2 text-xs font-black text-yellow-400 transition hover:bg-yellow-500/20"
                      >
                        Pending
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          sendRequest(profile.id)
                        }
                        className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-500"
                      >
                        + Add Friend
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {search.trim() &&
            !searching &&
            results.length === 0 && (
              <p className="mt-5 text-sm text-gray-500">
                No users found.
              </p>
            )}
        </div>

        {/* FRIEND REQUESTS */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black">
                Friend Requests
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Requests waiting for your response.
              </p>
            </div>

            {requests.length > 0 && (
              <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black">
                {requests.length}
              </span>
            )}
          </div>

          <div className="mt-4 rounded-3xl border border-white/10 bg-[#0d121f] p-5">
            {requests.length === 0 ? (
              <div className="py-8 text-center">
                <div className="text-4xl">
                  📭
                </div>

                <p className="mt-3 text-sm text-gray-500">
                  No pending friend requests.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#080b14] p-3"
                  >
                    {request.sender && (
                      <div className="h-12 w-12 overflow-hidden rounded-full">
                        {avatar(
                          request.sender
                        )}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="font-black">
                        {request.sender
                          ?.username || "User"}
                      </p>

                      <p className="text-xs text-gray-500">
                        sent you a friend request
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          acceptRequest(request)
                        }
                        className="rounded-xl bg-green-500 px-4 py-2 text-xs font-black text-white transition hover:bg-green-600"
                      >
                        Accept
                      </button>

                      <button
                        onClick={() =>
                          declineRequest(
                            request.id
                          )
                        }
                        className="rounded-xl bg-white/5 px-4 py-2 text-xs font-black text-gray-400 transition hover:bg-white/10"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SENT REQUESTS */}
        <div className="mt-8">
          <h2 className="text-2xl font-black">
            Sent Requests
          </h2>

          <div className="mt-4 rounded-3xl border border-white/10 bg-[#0d121f] p-5">
            {sentRequests.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-gray-500">
                  You haven't sent any friend requests.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#080b14] p-3"
                  >
                    {request.receiver && (
                      <div className="h-12 w-12 overflow-hidden rounded-full">
                        {avatar(
                          request.receiver
                        )}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="font-black">
                        {request.receiver
                          ?.username || "User"}
                      </p>

                      <p className="text-xs text-yellow-500">
                        Waiting for response
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        cancelRequest(request.id)
                      }
                      className="rounded-xl bg-white/5 px-4 py-2 text-xs font-bold text-gray-400 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MY FRIENDS */}
        <div className="mt-8 pb-10">
          <div>
            <h2 className="text-2xl font-black">
              My Friends
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {friends.length} friend
              {friends.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="rounded-3xl border border-white/10 bg-[#0d121f] p-10 text-center">
                <p className="text-sm text-gray-500">
                  Loading friends...
                </p>
              </div>
            ) : friends.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-[#0d121f] p-12 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-500/10 text-4xl">
                  👥
                </div>

                <h3 className="mt-5 text-xl font-black">
                  No friends yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                  You don't have any friends yet.
                  Search for players above and send
                  them a friend request.
                </p>

                <button
                  onClick={() =>
                    document
                      .querySelector("input")
                      ?.focus()
                  }
                  className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-black transition hover:bg-blue-500"
                >
                  🔎 Find Players
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="rounded-3xl border border-white/10 bg-[#0d121f] p-5 text-center transition hover:-translate-y-1 hover:border-blue-500/30"
                  >
                    <div className="mx-auto h-20 w-20 overflow-hidden rounded-full">
                      {avatar(friend)}
                    </div>

                    <p className="mt-4 truncate font-black">
                      {friend.username}
                    </p>

                    <p className="mt-1 truncate text-xs text-gray-500">
                      {friend.display_name}
                    </p>

                    <button
                      onClick={() =>
                        removeFriend(friend.id)
                      }
                      className="mt-4 w-full rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-gray-500 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      Remove Friend
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}