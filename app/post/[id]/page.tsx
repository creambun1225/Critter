"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  doc, getDoc, updateDoc, onSnapshot, query, collection, where, getDocs, addDoc, orderBy, deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import Layout from "@/components/Layout";

export default function PostDetail() {
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [loading, setLoading] = useState(true);

  // リプライのアクション状態
  const [replyRepostModal, setReplyRepostModal] = useState<string | null>(null);
  const [replyQuoteModal, setReplyQuoteModal] = useState<string | null>(null);
  const [replyBookmarks, setReplyBookmarks] = useState<Set<string>>(new Set());
  const [replyQuoteText, setReplyQuoteText] = useState<{ [key: string]: string }>({});

  // メニュー
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // 投稿のアクション
  const isLiked = post?.likedUsers?.includes(currentUser?.uid);
  const isReposted = post?.repostedUsers?.includes(currentUser?.uid);
  const isBookmarked = post?.bookmarkedUsers?.includes(currentUser?.uid);
  const isOwner = currentUser?.uid === post?.uid;
  const impressions = post?.impressions || 0;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { location.href = "/login"; return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setCurrentUser({ uid: user.uid, email: user.email, ...snap.data() });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!postId) return;
    const unsub = onSnapshot(doc(db, "posts", postId), (snap) => {
      if (snap.exists()) {
        setPost({ id: snap.id, ...snap.data() });
      } else {
        setPost(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [postId]);

  useEffect(() => {
    if (!postId) return;
    const q = query(collection(db, "posts", postId, "replies"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setReplies(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [postId]);

  const likePost = async () => {
    if (!currentUser || !post) return;
    const likedUsers = post.likedUsers || [];
    const alreadyLiked = likedUsers.includes(currentUser.uid);
    const newLikedUsers = alreadyLiked
      ? likedUsers.filter((id: string) => id !== currentUser.uid)
      : [...likedUsers, currentUser.uid];
    await updateDoc(doc(db, "posts", postId), {
      likedUsers: newLikedUsers,
      likes: newLikedUsers.length,
    });
    if (!alreadyLiked && post.uid !== currentUser.uid) {
      await addDoc(collection(db, "notifications"), {
        type: "like",
        toUid: post.uid,
        fromUid: currentUser.uid,
        fromName: currentUser.name,
        fromIcon: currentUser.icon ?? "",
        fromUsername: currentUser.username,
        postId,
        postText: post.text ?? "",
        readBy: [],
        createdAt: Date.now(),
      });
    }
  };

  const repostPost = async () => {
    if (!currentUser || !post) return;
    const repostedUsers = post.repostedUsers || [];
    const alreadyReposted = repostedUsers.includes(currentUser.uid);
    const newRepostedUsers = alreadyReposted
      ? repostedUsers.filter((id: string) => id !== currentUser.uid)
      : [...repostedUsers, currentUser.uid];
    await updateDoc(doc(db, "posts", postId), {
      repostedUsers: newRepostedUsers,
      reposts: newRepostedUsers.length,
    });
  };

  const bookmarkPost = async () => {
    if (!currentUser || !post) return;
    const bookmarkedUsers = post.bookmarkedUsers || [];
    const alreadyBookmarked = bookmarkedUsers.includes(currentUser.uid);
    const newBookmarkedUsers = alreadyBookmarked
      ? bookmarkedUsers.filter((id: string) => id !== currentUser.uid)
      : [...bookmarkedUsers, currentUser.uid];
    await updateDoc(doc(db, "posts", postId), {
      bookmarkedUsers: newBookmarkedUsers,
      bookmarks: newBookmarkedUsers.length,
    });
  };

  const reportPost = async () => {
    if (!currentUser || !post) return;
    await addDoc(collection(db, "reports"), {
      postId,
      text: post.text,
      reportedBy: currentUser.uid,
      createdAt: Date.now(),
    });
    alert("投稿を通報しました");
  };

  const deletePost = async () => {
    if (!postId) return;
    if (!confirm("本当に削除しますか？")) return;
    await deleteDoc(doc(db, "posts", postId));
    location.href = "/";
  };

  const submitReply = async () => {
    if (!replyText.trim() || !currentUser || !postId) return;
    if (replying) return;
    setReplying(true);
    try {
      await addDoc(collection(db, "posts", postId, "replies"), {
        text: replyText,
        uid: currentUser.uid,
        name: currentUser.name,
        username: currentUser.username,
        icon: currentUser.icon || "",
        verified: currentUser.verified || false,
        admin: currentUser.admin || false,
        likedUsers: [],
        repostedUsers: [],
        bookmarkedUsers: [],
        impressions: 0,
        createdAt: Date.now(),
      });
      await updateDoc(doc(db, "posts", postId), {
        replies: (post.replies || 0) + 1,
      });
      setReplyText("");

      if (post.uid !== currentUser.uid) {
        await addDoc(collection(db, "notifications"), {
          type: "reply",
          toUid: post.uid,
          fromUid: currentUser.uid,
          fromName: currentUser.name,
          fromIcon: currentUser.icon ?? "",
          fromUsername: currentUser.username,
          postId,
          postText: replyText,
          readBy: [],
          createdAt: Date.now(),
        });
      }
    } catch (e) {
      console.error(e);
      alert("リプライに失敗しました");
    } finally {
      setReplying(false);
    }
  };

  if (loading) return <Layout currentUser={currentUser}><div className="text-center py-20 text-zinc-500">読み込み中...</div></Layout>;
  if (!post) return <Layout currentUser={currentUser}><div className="text-center py-20 text-zinc-500">投稿が見つかりません</div></Layout>;

  return (
    <Layout currentUser={currentUser}>
      <div className="border-b border-zinc-800 p-4">
        {/* ユーザー情報 */}
        <Link href={`/user/${post.uid}`} className="flex items-center gap-3 hover:opacity-70 transition mb-4">
          <img src={post.icon || "/default.png"} className="w-12 h-12 rounded-full object-cover bg-zinc-700" />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-white">{post.name}</span>
              {post.verified && <img src="/verified-blue.png" className="w-4 h-4" />}
              {post.admin && <img src="/verified-gold.png" className="w-4 h-4" />}
            </div>
            <div className="text-zinc-500 text-sm">@{post.username}</div>
          </div>
        </Link>

        {/* テキスト */}
        <p className="text-white text-2xl mb-4">{post.text}</p>

        {/* 画像・動画 */}
        {post.image && <img src={post.image} className="rounded-2xl max-h-[400px] object-cover w-full border border-zinc-800 mb-4" />}
        {post.video && <video src={post.video} className="rounded-2xl max-h-[400px] object-cover w-full border border-zinc-800 mb-4" controls />}

        {/* 日時 */}
        <div className="text-zinc-500 text-sm mb-4">
          {new Date(post.createdAt).toLocaleString("ja-JP")}
        </div>

        {/* アクション数 */}
        <div className="flex justify-between py-4 max-w-md text-zinc-500 border-t border-b border-zinc-800">
          <span className="flex items-center gap-2"><img src="/reply.png" className="w-5 h-5" /> {post.replies || 0}</span>
          <span className="flex items-center gap-2"><img src="/repost.png" className="w-5 h-5" /> {post.reposts || 0}</span>
          <span className="flex items-center gap-2"><img src={isLiked ? "/like-active.png" : "/like-inactive.png"} className="w-5 h-5" /> {post.likes || 0}</span>
          <span className="flex items-center gap-2"><img src={isBookmarked ? "/bookmark-active.png" : "/bookmark-inactive.png"} className="w-5 h-5" /> {post.bookmarks || 0}</span>
          <span className="flex items-center gap-2 text-zinc-600"><img src="/impression.png" className="w-5 h-5" /> {impressions.toLocaleString()}</span>
        </div>

        {/* ボタン */}
        <div className="flex justify-between mt-4 pt-4 max-w-md text-zinc-500">
          <button onClick={submitReply} className="hover:opacity-70 flex items-center gap-2 transition"><img src="/reply.png" className="w-5 h-5" /></button>
          <button onClick={repostPost} className="hover:opacity-70 flex items-center gap-2 transition"><img src="/repost.png" className="w-5 h-5" /></button>
          <button onClick={likePost} className="hover:opacity-70 flex items-center gap-2 transition"><img src={isLiked ? "/like-active.png" : "/like-inactive.png"} className="w-5 h-5" /></button>
          <button onClick={bookmarkPost} className="hover:opacity-70 flex items-center gap-2 transition"><img src={isBookmarked ? "/bookmark-active.png" : "/bookmark-inactive.png"} className="w-5 h-5" /></button>
          <div className="relative">
            <button onClick={() => setMenuOpen(menuOpen ? null : "post")} className="hover:opacity-70 flex items-center gap-2 transition">⋯</button>
            {menuOpen === "post" && (
              <div className="absolute right-0 top-10 bg-black border border-zinc-700 rounded-2xl overflow-hidden w-56 z-50 shadow-2xl">
                <button onClick={() => { reportPost(); setMenuOpen(null); }} className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-red-400 text-sm">
                  ⚠️ このクリートを通報
                </button>
                {isOwner && <button onClick={() => { deletePost(); setMenuOpen(null); }} className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-red-500 text-sm border-t border-zinc-800">
                  🗑️ クリートを削除
                </button>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* リプライ投稿フォーム */}
      <div className="border-b border-zinc-800 p-4 flex gap-3">
        <img src={currentUser?.icon || "/default.png"} className="w-10 h-10 rounded-full object-cover bg-zinc-700 shrink-0" />
        <div className="flex-1">
          <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
            placeholder="リプライを入力..." rows={3}
            className="w-full bg-black outline-none resize-none text-white placeholder-zinc-600" />
          <div className="flex justify-end mt-2">
            <button onClick={submitReply} disabled={replying || !replyText.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-40 px-6 py-2 rounded-full font-bold text-white transition">
              {replying ? "投稿中..." : "リプライ"}
            </button>
          </div>
        </div>
      </div>

      {/* リプライ一覧 */}
      <div>
        {replies.map((reply) => {
          const isReplyLiked = reply.likedUsers?.includes(currentUser?.uid);
          const isReplyReposted = reply.repostedUsers?.includes(currentUser?.uid);
          const isReplyBookmarked = replyBookmarks.has(reply.id);
          const isReplyOwner = currentUser?.uid === reply.uid;
          const replyImpressions = reply.impressions || 0;

          return (
            <div key={reply.id} className="border-b border-zinc-800 p-4 hover:bg-zinc-900/30 transition">
              <div className="flex gap-3">
                <Link href={`/user/${reply.uid}`}>
                  <img src={reply.icon || "/default.png"} className="w-10 h-10 rounded-full object-cover bg-zinc-700" />
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Link href={`/user/${reply.uid}`} className="hover:opacity-70 transition">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-white">{reply.name}</span>
                        {reply.verified && <img src="/verified-blue.png" className="w-4 h-4" />}
                        {reply.admin && <img src="/verified-gold.png" className="w-4 h-4" />}
                      </div>
                      <div className="text-zinc-500 text-sm">@{reply.username}</div>
                    </Link>
                    <div className="relative">
                      <button onClick={() => setMenuOpen(menuOpen === reply.id ? null : reply.id)}
                        className="text-zinc-500 hover:text-white text-2xl px-2">⋯</button>
                      {menuOpen === reply.id && (
                        <div className="absolute right-0 top-10 bg-black border border-zinc-700 rounded-2xl overflow-hidden w-56 z-50 shadow-2xl">
                          {isReplyOwner && <button onClick={async () => {
                            await deleteDoc(doc(db, "posts", postId, "replies", reply.id));
                            await updateDoc(doc(db, "posts", postId), { replies: Math.max(0, (post.replies || 1) - 1) });
                            setMenuOpen(null);
                          }} className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-red-500 text-sm">
                            🗑️ リプライを削除
                          </button>}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-white mt-2">{reply.text}</p>

                  <div className="text-zinc-500 text-sm mt-2 mb-3">
                    {new Date(reply.createdAt).toLocaleString("ja-JP")}
                  </div>

                  {/* リプライのアクション */}
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-1.5"><img src="/reply.png" className="w-4 h-4" /> 0</span>

                    {/* リクリート選択ボタン */}
                    <div className="relative">
                      <button onClick={() => setReplyRepostModal(replyRepostModal === reply.id ? null : reply.id)}
                        className="hover:opacity-70 flex items-center gap-1.5 text-sm transition">
                        <img src="/repost.png" className="w-4 h-4" /> {reply.repostedUsers?.length || 0}
                      </button>
                      {replyRepostModal === reply.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setReplyRepostModal(null)} />
                          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black border border-zinc-700 rounded-2xl overflow-hidden w-64 z-50 shadow-2xl">
                            <button onClick={async () => {
                              if (!currentUser) return;
                              const repostedUsers = reply.repostedUsers || [];
                              const alreadyReposted = repostedUsers.includes(currentUser.uid);
                              const newRepostedUsers = alreadyReposted
                                ? repostedUsers.filter((id: string) => id !== currentUser.uid)
                                : [...repostedUsers, currentUser.uid];
                              await updateDoc(doc(db, "posts", postId, "replies", reply.id), {
                                repostedUsers: newRepostedUsers,
                              });
                              setReplies((prev) =>
                                prev.map((r) =>
                                  r.id === reply.id ? { ...r, repostedUsers: newRepostedUsers } : r
                                )
                              );
                              setReplyRepostModal(null);
                            }} className="w-full text-left px-4 py-3 hover:bg-zinc-900 flex items-center gap-3">
                              <span className="text-xl">🔁</span>
                              <div>
                                <p className={`font-bold text-sm ${isReplyReposted ? "text-green-400" : "text-white"}`}>
                                  {isReplyReposted ? "リクリートを取り消す" : "リクリート"}
                                </p>
                                <p className="text-zinc-500 text-xs">{isReplyReposted ? "削除" : "すぐに投稿"}</p>
                              </div>
                            </button>
                            <div className="border-t border-zinc-800" />
                            <button onClick={() => {
                              setReplyQuoteModal(replyQuoteModal === reply.id ? null : reply.id);
                              setReplyRepostModal(null);
                            }} className="w-full text-left px-4 py-3 hover:bg-zinc-900 flex items-center gap-3">
                              <span className="text-xl">✏️</span>
                              <div>
                                <p className="font-bold text-sm text-white">引用リクリート</p>
                                <p className="text-zinc-500 text-xs">コメントを添えて投稿</p>
                              </div>
                            </button>
                            <div className="border-t border-zinc-800" />
                            <button onClick={() => setReplyRepostModal(null)} className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-zinc-400 text-sm">
                              キャンセル
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* いいね */}
                    <button onClick={async () => {
                      if (!currentUser) return;
                      const likedUsers = reply.likedUsers || [];
                      const alreadyLiked = likedUsers.includes(currentUser.uid);
                      const newLikedUsers = alreadyLiked
                        ? likedUsers.filter((id: string) => id !== currentUser.uid)
                        : [...likedUsers, currentUser.uid];
                      await updateDoc(doc(db, "posts", postId, "replies", reply.id), {
                        likedUsers: newLikedUsers,
                      });
                      setReplies((prev) =>
                        prev.map((r) =>
                          r.id === reply.id ? { ...r, likedUsers: newLikedUsers } : r
                        )
                      );
                    }} className="hover:opacity-70 flex items-center gap-1.5 text-sm transition">
                      <img src={isReplyLiked ? "/like-active.png" : "/like-inactive.png"} className="w-4 h-4" /> {reply.likedUsers?.length || 0}
                    </button>

                    {/* ブックマーク */}
                    <button onClick={() => {
                      const newSet = new Set(replyBookmarks);
                      if (newSet.has(reply.id)) {
                        newSet.delete(reply.id);
                      } else {
                        newSet.add(reply.id);
                      }
                      setReplyBookmarks(newSet);
                    }} className="hover:opacity-70 flex items-center gap-1.5 text-sm transition">
                      <img src={isReplyBookmarked ? "/bookmark-active.png" : "/bookmark-inactive.png"} className="w-4 h-4" /> 0
                    </button>

                    {/* インプレッション */}
                    <span className="flex items-center gap-1.5 text-sm text-zinc-600">
                      <img src="/impression.png" className="w-4 h-4" /> {replyImpressions}
                    </span>
                  </div>
                </div>
              </div>

              {/* 引用リクリート投稿フォーム */}
              {replyQuoteModal === reply.id && (
                <div className="mt-4 ml-13 p-3 border border-zinc-700 rounded-2xl bg-zinc-900/30">
                  <textarea
                    value={replyQuoteText[reply.id] || ""}
                    onChange={(e) => setReplyQuoteText({ ...replyQuoteText, [reply.id]: e.target.value })}
                    placeholder="コメントを追加..."
                    rows={2}
                    className="w-full bg-black outline-none resize-none text-white placeholder-zinc-600 text-sm"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => {
                        setReplyQuoteModal(null);
                        setReplyQuoteText({ ...replyQuoteText, [reply.id]: "" });
                      }}
                      className="text-zinc-400 hover:text-white px-4 py-1 rounded-full text-sm transition"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={async () => {
                        if (!currentUser) return;
                        const text = replyQuoteText[reply.id] || "";
                        await addDoc(collection(db, "posts"), {
                          text,
                          quotePostId: postId,
                          quotePost: {
                            id: reply.id,
                            text: reply.text,
                            uid: reply.uid,
                            name: reply.name,
                            username: reply.username,
                            icon: reply.icon,
                          },
                          uid: currentUser.uid,
                          name: currentUser.name,
                          username: currentUser.username,
                          icon: currentUser.icon || "",
                          verified: currentUser.verified || false,
                          admin: currentUser.admin || false,
                          replies: 0, reposts: 0, likes: 0, bookmarks: 0,
                          likedUsers: [], repostedUsers: [], bookmarkedUsers: [],
                          impressions: 0,
                          createdAt: Date.now(),
                        });
                        setReplyQuoteModal(null);
                        setReplyQuoteText({ ...replyQuoteText, [reply.id]: "" });
                      }}
                      disabled={!replyQuoteText[reply.id]?.trim()}
                      className="bg-blue-500 hover:bg-blue-600 disabled:opacity-40 px-4 py-1 rounded-full text-sm font-bold text-white transition"
                    >
                      投稿
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Layout>
  );
}