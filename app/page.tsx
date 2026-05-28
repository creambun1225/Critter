"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";
import { db, auth } from "@/lib/firebase";
import {
  doc, getDoc, updateDoc,
  arrayUnion, arrayRemove,
  collection, query, where,
  orderBy, getDocs, onSnapshot, addDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// ───────────────────────────────────────
// フォローリストモーダル
// ───────────────────────────────────────
function FollowListModal({ title, uids, onClose }: { title: string; uids: string[]; onClose: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    if (uids.length === 0) { setUsers([]); return; }
    Promise.all(uids.map(async (uid) => {
      const snap = await getDoc(doc(db, "users", uid));
      return snap.exists() ? { uid, ...snap.data() } : null;
    })).then((r) => setUsers(r.filter(Boolean)));
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
            {users.length === 0 ? <p className="text-center text-zinc-500 py-10">まだいません</p> : (
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
    { key: "likes", label: "いいね", count: post.likedUsers?.length || 0 },
    { key: "reposts", label: "リクリート", count: post.repostedUsers?.length || 0 },
    { key: "quotes", label: "引用", count: null },
    { key: "replies", label: "リプライ", count: post.replies || 0 },
  ] as const;

  useEffect(() => {
    setLoading(true); setUsers([]);
    const fetch = async () => {
      try {
        if (tab === "likes" || tab === "reposts") {
          const uids: string[] = tab === "likes" ? post.likedUsers || [] : post.repostedUsers || [];
          const results = await Promise.all(uids.map(async (uid) => { const s = await getDoc(doc(db, "users", uid)); return s.exists() ? { uid, ...s.data() } : null; }));
          setUsers(results.filter(Boolean));
        } else if (tab === "quotes") {
          const snap = await getDocs(query(collection(db, "posts"), where("quotePostId", "==", post.id)));
          const uids = [...new Set(snap.docs.map((d) => d.data().uid))] as string[];
          const results = await Promise.all(uids.map(async (uid) => { const s = await getDoc(doc(db, "users", uid)); return s.exists() ? { uid, ...s.data() } : null; }));
          setUsers(results.filter(Boolean));
        } else {
          const snap = await getDocs(query(collection(db, "posts", post.id, "replies"), orderBy("createdAt", "asc")));
          const uids = [...new Set(snap.docs.map((d) => d.data().uid))] as string[];
          const results = await Promise.all(uids.map(async (uid) => { const s = await getDoc(doc(db, "users", uid)); return s.exists() ? { uid, ...s.data() } : null; }));
          setUsers(results.filter(Boolean));
        }
      } finally { setLoading(false); }
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
                {t.label}{t.count !== null && <span className="ml-1 text-xs text-zinc-500">({t.count})</span>}
              </button>
            ))}
          </div>
          <div className="overflow-y-auto">
            {loading ? <p className="text-center text-zinc-500 py-10">読み込み中...</p> :
              users.length === 0 ? <p className="text-center text-zinc-500 py-10">まだいません</p> :
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
                ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ───────────────────────────────────────
// BANモーダル（管理者用）
// ───────────────────────────────────────
function BanModal({ targetUid, targetName, onClose }: { targetUid: string; targetName: string; onClose: () => void }) {
  const [step, setStep] = useState<"password" | "reason">("password");
  const [adminPw, setAdminPw] = useState("");
  const [reason, setReason] = useState("");
  const [banning, setBanning] = useState(false);
  const [pwError, setPwError] = useState("");

  const checkPassword = () => {
    if (adminPw !== "annpannmann") { setPwError("パスワードが違います"); return; }
    setStep("reason");
  };

  const executeBan = async () => {
    if (!reason.trim()) { alert("理由を入力してください"); return; }
    setBanning(true);
    try {
      await updateDoc(doc(db, "users", targetUid), {
        banned: true,
        banReason: reason.trim(),
      });
      alert(`${targetName} をBANしました`);
      onClose();
      location.reload();
    } catch (e) {
      console.error(e);
      alert("BANに失敗しました");
    } finally {
      setBanning(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-black border border-red-500/40 rounded-2xl shadow-2xl p-6">

          {step === "password" ? (
            <>
              <h2 className="font-bold text-white text-lg mb-1">🚫 アカウントをBAN</h2>
              <p className="text-zinc-500 text-sm mb-4">管理者パスワードを入力してください</p>
              <input type="password" value={adminPw} onChange={(e) => setAdminPw(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") checkPassword(); }}
                placeholder="管理者パスワード" autoFocus
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition mb-3" />
              {pwError && <p className="text-red-500 text-sm mb-3">{pwError}</p>}
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 border border-zinc-700 py-2.5 rounded-full font-bold hover:bg-zinc-900 transition text-white">キャンセル</button>
                <button onClick={checkPassword} className="flex-1 bg-red-500 hover:bg-red-600 py-2.5 rounded-full font-bold text-white transition">次へ</button>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-bold text-white text-lg mb-1">BAN理由を入力</h2>
              <p className="text-zinc-500 text-sm mb-4">@{targetName} へのBAN理由を記入してください</p>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="例）スパム行為・規約違反・荒らし行為など"
                rows={4} autoFocus
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none resize-none focus:border-red-500 transition mb-4" />
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 border border-zinc-700 py-2.5 rounded-full font-bold hover:bg-zinc-900 transition text-white">キャンセル</button>
                <button onClick={executeBan} disabled={banning || !reason.trim()}
                  className="flex-1 bg-red-500 hover:bg-red-600 py-2.5 rounded-full font-bold text-white transition disabled:opacity-40">
                  {banning ? "処理中..." : "BANする"}
                </button>
              </div>
            </>
          )}
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
  const [showMenu, setShowMenu] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

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
        setIsBlocked((myData.blockedUsers || []).includes(uid));
        setIsMuted((myData.mutedUsers || []).includes(uid));
      }
    });
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    const q = query(collection(db, "posts"), where("uid", "==", uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [uid]);

  const toggleFollow = async () => {
    if (!me) return;
    const already = followers.includes(me.uid);
    const profileRef = doc(db, "users", uid);
    const myRef = doc(db, "users", me.uid);
    if (already) {
      await updateDoc(profileRef, { followers: arrayRemove(me.uid) });
      await updateDoc(myRef, { following: arrayRemove(uid) });
      setFollowers(followers.filter((id) => id !== me.uid));
      setFollowing(following.filter((id) => id !== uid));
    } else {
      await updateDoc(profileRef, { followers: arrayUnion(me.uid) });
      await updateDoc(myRef, { following: arrayUnion(uid) });
      setFollowers([...followers, me.uid]);
      setFollowing([...following, uid]);
      if (uid !== me.uid) {
        await addDoc(collection(db, "notifications"), {
          type: "follow", toUid: uid, fromUid: me.uid,
          fromName: currentUser?.name ?? "", fromIcon: currentUser?.icon ?? "",
          fromUsername: currentUser?.username ?? "", readBy: [], createdAt: Date.now(),
        });
      }
    }
  };

  const toggleBlock = async () => {
    if (!me) return;
    const myRef = doc(db, "users", me.uid);
    if (isBlocked) {
      await updateDoc(myRef, { blockedUsers: arrayRemove(uid) });
      setIsBlocked(false);
    } else {
      await updateDoc(myRef, { blockedUsers: arrayUnion(uid) });
      setIsBlocked(true);
      if (followers.includes(me.uid)) {
        await updateDoc(doc(db, "users", uid), { followers: arrayRemove(me.uid) });
        await updateDoc(myRef, { following: arrayRemove(uid) });
        setFollowers(followers.filter((id) => id !== me.uid));
      }
    }
    setShowMenu(false);
  };

  const toggleMute = async () => {
    if (!me) return;
    const myRef = doc(db, "users", me.uid);
    if (isMuted) {
      await updateDoc(myRef, { mutedUsers: arrayRemove(uid) });
      setIsMuted(false);
    } else {
      await updateDoc(myRef, { mutedUsers: arrayUnion(uid) });
      setIsMuted(true);
    }
    setShowMenu(false);
  };

  const toggleVerified = async () => {
    if (!currentUser?.admin) return;
    const newVerified = !profile.verified;
    await updateDoc(doc(db, "users", uid), { verified: newVerified });
    setProfile((prev: any) => ({ ...prev, verified: newVerified }));
    setShowMenu(false);
    alert(newVerified ? "認証マークを付与しました" : "認証マークを削除しました");
  };

  if (!profile) return null;

  // BANされているプロフィールを表示
  if (profile.banned && me?.uid !== uid && !currentUser?.admin) {
    return (
      <Layout currentUser={currentUser}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-white mb-2">このアカウントはBANされました</h2>
          <p className="text-zinc-500 text-sm">このユーザーは利用規約に違反したためBANされています。</p>
        </div>
      </Layout>
    );
  }

  const filteredPosts = tab === "posts"
    ? posts.filter((p) => !p.isQuoteRepost || p.uid === uid)
    : posts.filter((p) => p.repostedUsers?.includes(uid));

  const displayPosts = isMuted ? [] : filteredPosts;
  const followingList = profile.following || [];
  const isMe = me?.uid === uid;
  const isAdmin = currentUser?.admin === true;

  return (
    <Layout currentUser={currentUser}>
      <div className="bg-black min-h-screen text-white">

        {/* ヘッダー画像 */}
        <div className="h-40 bg-zinc-800 overflow-hidden">
          {profile.headerImage && <img src={profile.headerImage} className="w-full h-full object-cover" />}
        </div>

        <div className="-mt-16 px-6">
          <div className="flex items-end justify-between">
            <img src={profile.icon || "/default.png"}
              className="w-32 h-32 rounded-full border-4 border-black object-cover bg-zinc-700" />

            <div className="flex items-center gap-2 pb-2">

              {/* ⋯ メニュー */}
              {(!isMe || isAdmin) && (
                <div className="relative">
                  <button onClick={() => setShowMenu((p) => !p)}
                    className="text-zinc-400 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-900 transition">
                    ⋯
                  </button>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                      <div className="absolute right-0 top-12 bg-black border border-zinc-700 rounded-2xl overflow-hidden w-56 z-50 shadow-2xl">

                        {/* 管理者：認証マーク */}
                        {isAdmin && (
                          <button onClick={toggleVerified}
                            className="w-full text-left px-4 py-3 hover:bg-zinc-900 transition flex items-center gap-2">
                            {profile.verified
                              ? <><img src="/verified-blue.png" className="w-5 h-5" /><span className="text-white font-bold text-sm">認証マークを削除</span></>
                              : <><span className="text-blue-400 text-lg">✓</span><span className="text-white font-bold text-sm">認証マークを付与</span></>
                            }
                          </button>
                        )}

                        {/* 管理者：BAN */}
                        {isAdmin && !isMe && !profile.banned && (
                          <button onClick={() => { setShowMenu(false); setShowBanModal(true); }}
                            className="w-full text-left px-4 py-3 hover:bg-zinc-900 transition flex items-center gap-2 border-t border-zinc-800">
                            <span className="text-xl">🚫</span>
                            <span className="text-red-400 font-bold text-sm">このアカウントをBAN</span>
                          </button>
                        )}

                        {/* 管理者：BAN解除 */}
                        {isAdmin && !isMe && profile.banned && (
                          <button onClick={async () => {
                            await updateDoc(doc(db, "users", uid), { banned: false, banReason: "" });
                            setProfile((p: any) => ({ ...p, banned: false }));
                            setShowMenu(false);
                            alert("BAN解除しました");
                          }}
                            className="w-full text-left px-4 py-3 hover:bg-zinc-900 transition flex items-center gap-2 border-t border-zinc-800">
                            <span className="text-xl">✅</span>
                            <span className="text-green-400 font-bold text-sm">BAN解除</span>
                          </button>
                        )}

                        {/* 自分以外：ミュート・ブロック */}
                        {!isMe && (
                          <>
                            <button onClick={toggleMute}
                              className="w-full text-left px-4 py-3 hover:bg-zinc-900 transition flex items-center gap-2 border-t border-zinc-800">
                              <span className="text-xl">{isMuted ? "🔊" : "🔇"}</span>
                              <span className="text-white font-bold text-sm">{isMuted ? "ミュートを解除" : "ミュートする"}</span>
                            </button>
                            <button onClick={toggleBlock}
                              className="w-full text-left px-4 py-3 hover:bg-zinc-900 transition flex items-center gap-2 border-t border-zinc-800">
                              <span className="text-xl">🚫</span>
                              <span className={`font-bold text-sm ${isBlocked ? "text-green-400" : "text-red-400"}`}>
                                {isBlocked ? "ブロックを解除" : "ブロックする"}
                              </span>
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* フォロー / 編集 */}
              {!isMe ? (
                !isBlocked && (
                  <button onClick={toggleFollow}
                    className="bg-white text-black px-5 py-2 rounded-full font-bold hover:bg-zinc-200 transition">
                    {followers.includes(me?.uid) ? "フォロー中" : "フォロー"}
                  </button>
                )
              ) : (
                <Link href="/profile/edit">
                  <button className="border border-zinc-700 px-5 py-2 rounded-full hover:bg-zinc-900 transition">
                    プロフィール編集
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* BANバナー（管理者向け） */}
          {profile.banned && isAdmin && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              🚫 このアカウントはBANされています｜理由: {profile.banReason || "記載なし"}
            </div>
          )}

          {isBlocked && !isMe && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              🚫 このユーザーをブロックしています
            </div>
          )}
          {isMuted && !isMe && (
            <div className="mt-4 bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-400 text-sm">
              🔇 このユーザーをミュートしています
            </div>
          )}

          <div className="mt-3">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{profile.name}</h1>
              {profile.verified && <img src="/verified-blue.png" className="w-6 h-6" />}
              {profile.admin && <img src="/verified-gold.png" className="w-6 h-6" />}
            </div>
            <div className="text-zinc-500">@{profile.username}</div>
          </div>

          <p className="mt-5 text-white">{profile.bio}</p>

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
        </div>

        {/* タブ */}
        <div className="flex border-b border-zinc-800 mt-6">
          <button onClick={() => setTab("posts")}
            className={`flex-1 py-4 font-bold text-sm transition border-b-2 ${tab === "posts" ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
            クリート
          </button>
          <button onClick={() => setTab("reposts")}
            className={`flex-1 py-4 font-bold text-sm transition border-b-2 ${tab === "reposts" ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
            リクリート
          </button>
        </div>

        <div>
          {isMuted && !isMe ? (
            <p className="text-center text-zinc-600 py-10">ミュート中のため投稿は非表示です</p>
          ) : isBlocked && !isMe ? (
            <p className="text-center text-zinc-600 py-10">ブロック中のため投稿は非表示です</p>
          ) : displayPosts.length === 0 ? (
            <p className="text-center text-zinc-600 py-10">
              {tab === "posts" ? "まだクリートがありません" : "まだリクリートがありません"}
            </p>
          ) : (
            displayPosts.map((post) => (
              <PostCard key={post.id} post={post} currentUser={currentUser} onAnalytics={() => setAnalyticsPost(post)} />
            ))
          )}
        </div>
      </div>

      {followModal === "following" && <FollowListModal title="フォロー中" uids={followingList} onClose={() => setFollowModal(null)} />}
      {followModal === "followers" && <FollowListModal title="フォロワー" uids={followers} onClose={() => setFollowModal(null)} />}
      {analyticsPost && <AnalyticsModal post={analyticsPost} onClose={() => setAnalyticsPost(null)} />}
      {showBanModal && <BanModal targetUid={uid} targetName={profile.username} onClose={() => setShowBanModal(false)} />}
    </Layout>
  );
}