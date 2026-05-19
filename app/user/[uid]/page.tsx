"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  addDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// ───────────────────────────────────────
// フォローリストモーダル
// ───────────────────────────────────────
function FollowListModal({
  title,
  uids,
  onClose,
}: {
  title: string;
  uids: string[];
  onClose: () => void;
}) {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (uids.length === 0) { setUsers([]); return; }
    Promise.all(
      uids.map(async (uid) => {
        const snap = await getDoc(doc(db, "users", uid));
        return snap.exists() ? { uid, ...snap.data() } : null;
      })
    ).then((results) => setUsers(results.filter(Boolean)));
  }, [uids]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-black border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
            <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-900">✕</button>
            <h2 className="font-bold text-white text-lg">{title}</h2>
            <div className="w-10" />
          </div>
          <div className="overflow-y-auto">
            {users.length === 0 ? (
              <p className="text-center text-zinc-500 py-10">まだいません</p>
            ) : (
              users.map((user) => (
                <Link key={user.uid} href={`/user/${user.uid}`} onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 transition">
                  <img src={user.icon || "/default.png"} className="w-10 h-10 rounded-full object-cover bg-zinc-700 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-white truncate">{user.name}</span>
                      {user.verified && <img src="/verified-blue.png" className="w-4 h-4" />}
                      {user.admin && <img src="/verified-gold.png" className="w-4 h-4" />}
                    </div>
                    <div className="text-zinc-500 text-sm truncate">@{user.username}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ───────────────────────────────────────
// アナリティクスモーダル
// ───────────────────────────────────────
function AnalyticsModal({ post, onClose }: { post: any; onClose: () => void }) {
  const [tab, setTab] = useState<"likes" | "reposts" | "quotes" | "replies">("likes");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { key: "likes",   label: "いいね",   count: post.likedUsers?.length || 0 },
    { key: "reposts", label: "リポスト", count: post.repostedUsers?.length || 0 },
    { key: "quotes",  label: "引用",     count: null },
    { key: "replies", label: "リプライ", count: post.replies || 0 },
  ] as const;

  useEffect(() => {
    setLoading(true);
    setUsers([]);
    const fetch = async () => {
      try {
        if (tab === "likes" || tab === "reposts") {
          const uids: string[] = tab === "likes" ? post.likedUsers || [] : post.repostedUsers || [];
          const results = await Promise.all(
            uids.map(async (uid) => {
              const snap = await getDoc(doc(db, "users", uid));
              return snap.exists() ? { uid, ...snap.data() } : null;
            })
          );
          setUsers(results.filter(Boolean));
        } else if (tab === "quotes") {
          const q = query(collection(db, "posts"), where("quotePostId", "==", post.id));
          const snap = await getDocs(q);
          const uids = [...new Set(snap.docs.map((d) => d.data().uid))] as string[];
          const results = await Promise.all(
            uids.map(async (uid) => {
              const s = await getDoc(doc(db, "users", uid));
              return s.exists() ? { uid, ...s.data() } : null;
            })
          );
          setUsers(results.filter(Boolean));
        } else if (tab === "replies") {
          const q = query(collection(db, "posts", post.id, "replies"), orderBy("createdAt", "asc"));
          const snap = await getDocs(q);
          const uids = [...new Set(snap.docs.map((d) => d.data().uid))] as string[];
          const results = await Promise.all(
            uids.map(async (uid) => {
              const s = await getDoc(doc(db, "users", uid));
              return s.exists() ? { uid, ...s.data() } : null;
            })
          );
          setUsers(results.filter(Boolean));
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [tab, post]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-black border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
            <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-900">✕</button>
            <h2 className="font-bold text-white text-lg">アナリティクス</h2>
            <div className="w-10" />
          </div>
          <div className="flex border-b border-zinc-800 shrink-0">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-3 text-sm font-bold transition border-b-2 ${tab === t.key ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
                {t.label}
                {t.count !== null && <span className="ml-1 text-xs text-zinc-500">({t.count})</span>}
              </button>
            ))}
          </div>
          <div className="overflow-y-auto">
            {loading ? (
              <p className="text-center text-zinc-500 py-10">読み込み中...</p>
            ) : users.length === 0 ? (
              <p className="text-center text-zinc-500 py-10">まだいません</p>
            ) : (
              users.map((user) => (
                <Link key={user.uid} href={`/user/${user.uid}`} onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 transition">
                  <img src={user.icon || "/default.png"} className="w-10 h-10 rounded-full object-cover bg-zinc-700 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-white truncate">{user.name}</span>
                      {user.verified && <img src="/verified-blue.png" className="w-4 h-4" />}
                      {user.admin && <img src="/verified-gold.png" className="w-4 h-4" />}
                    </div>
                    <div className="text-zinc-500 text-sm truncate">@{user.username}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ───────────────────────────────────────
// メインページ
// ───────────────────────────────────────
export default function UserProfile() {
  const params = useParams();
  const uid = params.uid as string;

  const [profile, setProfile] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [tab, setTab] = useState<"posts" | "reposts">("posts");
  const [followModal, setFollowModal] = useState<null | "followers" | "following">(null);
  const [analyticsPost, setAnalyticsPost] = useState<any>(null);

  // ユーザー・フォロー情報取得
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { location.href = "/login"; return; }
      setMe(user);

      const profileSnap = await getDoc(doc(db, "users", uid));
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        setProfile({ uid, ...data });
        setFollowers(data.followers || []);
      }

      const mySnap = await getDoc(doc(db, "users", user.uid));
      if (mySnap.exists()) {
        const myData = mySnap.data();
        setFollowing(myData.following || []);
        setCurrentUser({ uid: user.uid, ...myData });
      }
    });
    return () => unsub();
  }, [uid]);

  // 投稿取得（リアルタイム）
  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [uid]);

  // フォロー切り替え
  const toggleFollow = async () => {
    if (!me) return;
    const already = followers.includes(me.uid);
    const profileRef = doc(db, "users", uid);
    const myRef = doc(db, "users", me.uid);

    if (already) {
      // フォロー解除
      await updateDoc(profileRef, { followers: arrayRemove(me.uid) });
      await updateDoc(myRef, { following: arrayRemove(uid) });
      setFollowers(followers.filter((id) => id !== me.uid));
      setFollowing(following.filter((id) => id !== uid));
    } else {
      // フォロー
      await updateDoc(profileRef, { followers: arrayUnion(me.uid) });
      await updateDoc(myRef, { following: arrayUnion(uid) });
      setFollowers([...followers, me.uid]);
      setFollowing([...following, uid]);

      // フォロー通知（自分へのフォローは除外）
      if (uid !== me.uid) {
        await addDoc(collection(db, "notifications"), {
          type: "follow",
          toUid: uid,
          fromUid: me.uid,
          fromName: currentUser?.name ?? "",
          fromIcon: currentUser?.icon ?? "",
          fromUsername: currentUser?.username ?? "",
          readBy: [],
          createdAt: Date.now(),
        });
      }
    }
  };

  if (!profile) return null;

  const filteredPosts =
    tab === "posts"
      ? posts.filter((p) => !p.isQuoteRepost || p.uid === uid)
      : posts.filter((p) => p.repostedUsers?.includes(uid));

  const followingList = profile.following || [];

  return (
    <Layout currentUser={currentUser}>
      <div className="bg-black min-h-screen text-white">

        {/* ヘッダー画像 */}
        <div className="h-40 bg-zinc-800" />

        {/* プロフィール情報 */}
        <div className="-mt-16 px-6">
          <img
            src={profile.icon || "/default.png"}
            className="w-32 h-32 rounded-full border-4 border-black object-cover bg-zinc-700"
          />

          <div className="flex justify-between mt-5">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                {profile.verified && <img src="/verified-blue.png" className="w-6 h-6" />}
                {profile.admin && <img src="/verified-gold.png" className="w-6 h-6" />}
              </div>
              <div className="text-zinc-500">@{profile.username}</div>
            </div>

            {me?.uid !== uid && (
              <button
                onClick={toggleFollow}
                className="bg-white text-black px-5 py-2 rounded-full font-bold hover:bg-zinc-200 transition"
              >
                {followers.includes(me?.uid) ? "フォロー中" : "フォロー"}
              </button>
            )}
          </div>

          <p className="mt-5 text-white">{profile.bio}</p>

          {/* フォロー数・フォロワー数（クリックでモーダル） */}
          <div className="flex gap-8 mt-5">
            <button onClick={() => setFollowModal("following")} className="hover:underline text-left">
              <span className="font-bold text-white">{followingList.length}</span>
              <span className="text-zinc-500 ml-1">フォロー中</span>
            </button>
            <button onClick={() => setFollowModal("followers")} className="hover:underline text-left">
              <span className="font-bold text-white">{followers.length}</span>
              <span className="text-zinc-500 ml-1">フォロワー</span>
            </button>
          </div>

          {/* プロフィール編集ボタン */}
          {me?.uid === uid && (
            <Link href="/profile/edit">
              <button className="mt-5 border border-zinc-700 px-5 py-2 rounded-full hover:bg-zinc-900 transition">
                プロフィール編集
              </button>
            </Link>
          )}
        </div>

        {/* タブ */}
        <div className="flex border-b border-zinc-800 mt-6">
          <button
            onClick={() => setTab("posts")}
            className={`flex-1 py-4 font-bold text-sm transition border-b-2 ${
              tab === "posts" ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            クリート
          </button>
          <button
            onClick={() => setTab("reposts")}
            className={`flex-1 py-4 font-bold text-sm transition border-b-2 ${
              tab === "reposts" ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            リポスト
          </button>
        </div>

        {/* 投稿一覧 */}
        <div>
          {filteredPosts.length === 0 ? (
            <p className="text-center text-zinc-600 py-10">
              {tab === "posts" ? "まだクリートがありません" : "まだリポストがありません"}
            </p>
          ) : (
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onAnalytics={() => setAnalyticsPost(post)}
              />
            ))
          )}
        </div>
      </div>

      {/* フォローリストモーダル */}
      {followModal === "following" && (
        <FollowListModal title="フォロー中" uids={followingList} onClose={() => setFollowModal(null)} />
      )}
      {followModal === "followers" && (
        <FollowListModal title="フォロワー" uids={followers} onClose={() => setFollowModal(null)} />
      )}

      {/* アナリティクスモーダル */}
      {analyticsPost && (
        <AnalyticsModal post={analyticsPost} onClose={() => setAnalyticsPost(null)} />
      )}
    </Layout>
  );
}