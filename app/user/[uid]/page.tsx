"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";

export default function UserProfile() {
  const params = useParams();
  const uid = params.uid as string;

  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwn = currentUser?.uid === uid;
  const isFollowing = profile?.followers?.includes(currentUser?.uid);
  const isBlocked = currentUser?.blockedUsers?.includes(uid);
  const isMuted = currentUser?.mutedUsers?.includes(uid);

  useEffect(() => {
    setLoading(true);
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        location.href = "/login";
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          setCurrentUser({ uid: user.uid, ...snap.data() });
        }
      } catch (e) {
        console.error("Current user fetch error:", e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) return;

    setProfileLoading(true);
    const fetchProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          setProfile({ uid, ...snap.data() });
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.error("Profile fetch error:", e);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [uid]);

  // 投稿を取得
  useEffect(() => {
    if (!uid) return;

    setPostsLoading(true);
    const fetchPosts = async () => {
      try {
        const q = query(
          collection(db, "posts"),
          where("uid", "==", uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Posts fetch error:", e);
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, [uid]);

  const toggleFollow = async () => {
    if (!currentUser || !profile) return;
    const newFollowers = isFollowing
      ? (profile.followers || []).filter((id: string) => id !== currentUser.uid)
      : [...(profile.followers || []), currentUser.uid];

    const newFollowing = isFollowing
      ? (currentUser.following || []).filter((id: string) => id !== uid)
      : [...(currentUser.following || []), uid];

    try {
      await updateDoc(doc(db, "users", uid), { followers: newFollowers });
      await updateDoc(doc(db, "users", currentUser.uid), { following: newFollowing });
      setProfile({ ...profile, followers: newFollowers });
      setCurrentUser({ ...currentUser, following: newFollowing });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBlock = async () => {
    if (!currentUser) return;
    const newBlocked = isBlocked
      ? (currentUser.blockedUsers || []).filter((id: string) => id !== uid)
      : [...(currentUser.blockedUsers || []), uid];

    try {
      await updateDoc(doc(db, "users", currentUser.uid), { blockedUsers: newBlocked });
      setCurrentUser({ ...currentUser, blockedUsers: newBlocked });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMute = async () => {
    if (!currentUser) return;
    const newMuted = isMuted
      ? (currentUser.mutedUsers || []).filter((id: string) => id !== uid)
      : [...(currentUser.mutedUsers || []), uid];

    try {
      await updateDoc(doc(db, "users", currentUser.uid), { mutedUsers: newMuted });
      setCurrentUser({ ...currentUser, mutedUsers: newMuted });
    } catch (e) {
      console.error(e);
    }
  };

  const banUser = async () => {
    const password = prompt("管理者パスワード:");
    if (password !== "annpannmann") {
      alert("パスワードが間違っています");
      return;
    }

    const reason = prompt("BAN理由を入力してください:");
    if (!reason) return;

    try {
      await updateDoc(doc(db, "users", uid), {
        banned: true,
        banReason: reason,
      });
      setProfile({ ...profile, banned: true, banReason: reason });
      alert("ユーザーをBANしました");
    } catch (e) {
      console.error(e);
      alert("BANに失敗しました");
    }
  };

  if (loading) {
    return (
      <Layout currentUser={currentUser}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-zinc-700 border-t-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-zinc-500">読み込み中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (profileLoading) {
    return (
      <Layout currentUser={currentUser}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-zinc-700 border-t-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-zinc-500">プロフィール読み込み中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout currentUser={currentUser}>
        <div className="text-center py-20 text-zinc-500">ユーザーが見つかりません</div>
      </Layout>
    );
  }

  if (profile.banned) {
    return (
      <Layout currentUser={currentUser}>
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🚫</div>
          <p className="text-white font-bold">このアカウントはBANされました</p>
          <p className="text-zinc-500 text-sm mt-2">理由: {profile.banReason}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentUser={currentUser}>
      <div className="border-b border-zinc-800">
        {/* ヘッダー画像 */}
        <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600">
          {profile.headerImage && (
            <img src={profile.headerImage} className="w-full h-full object-cover" />
          )}
        </div>

        {/* プロフィール情報 */}
        <div className="px-4 pb-4">
          <div className="flex items-end justify-between mb-4 -mt-16">
            <img src={profile.icon || "/default.png"} className="w-32 h-32 rounded-full object-cover bg-zinc-700 border-4 border-black" />
            {!isOwn && (
              <div className="flex gap-2">
                <button onClick={toggleFollow} className={`px-6 py-2 rounded-full font-bold transition ${isFollowing ? "bg-zinc-700 text-white" : "bg-white text-black hover:bg-zinc-200"}`}>
                  {isFollowing ? "フォロー中" : "フォロー"}
                </button>
                <div className="relative">
                  <button onClick={() => setMenuOpen(menuOpen ? false : true)} className="text-2xl px-4 py-2 hover:bg-zinc-900 rounded-full transition">
                    ⋯
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 top-12 bg-black border border-zinc-700 rounded-2xl overflow-hidden w-56 z-50 shadow-2xl">
                        <button onClick={() => { toggleBlock(); setMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-red-400 text-sm">
                          {isBlocked ? "✓ ブロック中" : "🚫 ブロック"}
                        </button>
                        <button onClick={() => { toggleMute(); setMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-sm border-t border-zinc-800">
                          {isMuted ? "✓ ミュート中" : "🔕 ミュート"}
                        </button>
                        {currentUser?.admin && (
                          <button
                            onClick={() => {
                              banUser();
                              setMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-red-600 text-sm border-t border-zinc-800 font-bold"
                          >
                            🚫 BAN
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            {isOwn && (
              <Link href="/profile/edit" className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-zinc-200 transition">
                プロフィール編集
              </Link>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-1">
              {profile.name}
              {profile.verified && <img src="/verified-blue.png" className="w-5 h-5" />}
              {profile.admin && <img src="/verified-gold.png" className="w-5 h-5" />}
            </h1>
            <p className="text-zinc-500">@{profile.username}</p>
            <p className="text-white mt-3">{profile.bio}</p>
            <div className="flex gap-4 mt-3 text-sm text-zinc-500">
              <div>
                <span className="text-white font-bold">{(profile.followers || []).length}</span> フォロワー
              </div>
              <div>
                <span className="text-white font-bold">{(profile.following || []).length}</span> フォロー中
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="border-b border-zinc-800 sticky top-0 bg-black/90 backdrop-blur z-10">
        <button className="flex-1 py-4 px-4 border-b-2 border-white font-bold text-white hover:bg-zinc-900/50 transition w-full text-left">
          投稿
        </button>
      </div>

      {/* 投稿一覧 */}
      {postsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full border-4 border-zinc-700 border-t-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">投稿を読み込み中...</p>
          </div>
        </div>
      ) : posts.length === 0 ? (
        <p className="text-center text-zinc-600 py-16">投稿はまだありません</p>
      ) : (
        <div>
          {posts.map((post: any) => (
            <PostCard key={post.id} post={post} currentUser={currentUser} onAnalytics={() => {}} />
          ))}
        </div>
      )}
    </Layout>
  );
}