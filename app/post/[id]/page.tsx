"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";
import { db, auth } from "@/lib/firebase";
import {
  doc, getDoc, collection, query, where,
  orderBy, onSnapshot, updateDoc, increment,
  arrayUnion, arrayRemove, addDoc, getDocs, deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const [analyticsPost, setAnalyticsPost] = useState<any>(null);
  const [replyMenuOpen, setReplyMenuOpen] = useState<string | null>(null);
  const [replyAnalyticsPost, setReplyAnalyticsPost] = useState<any>(null);

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
    const postSnap = getDoc(doc(db, "posts", postId));
    const repliesQ = query(
      collection(db, "posts", postId, "replies"),
      orderBy("createdAt", "asc")
    );

    Promise.resolve(postSnap).then((snap) => {
      if (snap.exists()) setPost({ id: postId, ...snap.data() });
    });

    const unsubReplies = onSnapshot(repliesQ, (snap) => {
      setReplies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsubReplies();
  }, [postId]);

  const submitReply = async () => {
    if (!replyText.trim() || !currentUser) return;
    setReplying(true);
    try {
      const replyColl = collection(db, "posts", postId, "replies");
      await addDoc(replyColl, {
        text: replyText.trim(),
        uid: currentUser.uid,
        name: currentUser.name || "ユーザー",
        username: currentUser.username || "user",
        icon: currentUser.icon || "",
        verified: currentUser.verified || false,
        admin: currentUser.admin || false,
        likedUsers: [],
        repostedUsers: [],
        impressions: 0,
        createdAt: Date.now(),
      });

      await updateDoc(doc(db, "posts", postId), {
        replies: increment(1),
      });

      if (post.uid !== currentUser.uid) {
        await addDoc(collection(db, "notifications"), {
          type: "reply",
          toUid: post.uid,
          fromUid: currentUser.uid,
          fromName: currentUser.name,
          fromIcon: currentUser.icon ?? "",
          fromUsername: currentUser.username,
          postId: postId,
          postText: post.text ?? "",
          readBy: [],
          createdAt: Date.now(),
        });
      }

      setReplyText("");
    } catch (e) {
      console.error(e);
      alert("リプライに失敗しました");
    } finally {
      setReplying(false);
    }
  };

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
    setPost((prev: any) => ({ ...prev, likedUsers: newLikedUsers, likes: newLikedUsers.length }));

    if (!alreadyLiked && post.uid !== currentUser.uid) {
      await addDoc(collection(db, "notifications"), {
        type: "like",
        toUid: post.uid,
        fromUid: currentUser.uid,
        fromName: currentUser.name,
        fromIcon: currentUser.icon ?? "",
        fromUsername: currentUser.username,
        postId: postId,
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
    setPost((prev: any) => ({ ...prev, repostedUsers: newRepostedUsers, reposts: newRepostedUsers.length }));

    if (!alreadyReposted && post.uid !== currentUser.uid) {
      await addDoc(collection(db, "notifications"), {
        type: "repost",
        toUid: post.uid,
        fromUid: currentUser.uid,
        fromName: currentUser.name,
        fromIcon: currentUser.icon ?? "",
        fromUsername: currentUser.username,
        postId: postId,
        postText: post.text ?? "",
        readBy: [],
        createdAt: Date.now(),
      });
    }
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
    setPost((prev: any) => ({ ...prev, bookmarkedUsers: newBookmarkedUsers, bookmarks: newBookmarkedUsers.length }));
  };

  const reportPost = async () => {
    if (!currentUser || !post) return;
    await addDoc(collection(db, "notifications"), {
      type: "report",
      message: `${currentUser.name}さんがクリートを通報しました`,
      postId: postId,
      postText: post.text || "",
      reportedBy: currentUser.uid,
      reportedByName: currentUser.name,
      targetUid: post.uid,
      readBy: [],
      createdAt: Date.now(),
    });
    await addDoc(collection(db, "reports"), {
      postId: postId,
      text: post.text,
      reportedBy: currentUser.name,
      createdAt: Date.now(),
    });
    alert("通報しました");
  };

  const deletePost = async () => {
    if (!currentUser || !post) return;
    const ok = confirm("投稿を削除しますか？");
    if (!ok) return;
    try {
      // リプライも削除
      const repliesDocs = await getDocs(collection(db, "posts", postId, "replies"));
      for (const rDoc of repliesDocs.docs) {
        await deleteDoc(rDoc.ref);
      }
      await deleteDoc(doc(db, "posts", postId));
      router.push("/");
    } catch (e) {
      console.error(e);
      alert("削除に失敗しました");
    }
  };

  if (!post) return (
    <Layout currentUser={currentUser}>
      <div className="text-center text-zinc-600 py-20">読み込み中...</div>
    </Layout>
  );

  const isLiked = post.likedUsers?.includes(currentUser?.uid);
  const isReposted = post.repostedUsers?.includes(currentUser?.uid);
  const isBookmarked = post.bookmarkedUsers?.includes(currentUser?.uid);
  const isOwner = currentUser?.uid === post.uid;
  const impressions = (post.likes || 0) + (post.reposts || 0) + (post.replies || 0) + (post.bookmarks || 0) + (post.impressions || 0);

  return (
    <Layout currentUser={currentUser}>
      <div className="border-b border-zinc-800 p-4">

        {/* 元投稿 */}
        <div className="flex gap-3">
          <Link href={`/user/${post.uid}`}>
            <img src={post.icon || "/default.png"} className="w-12 h-12 rounded-full object-cover bg-zinc-700" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/user/${post.uid}`} className="font-bold text-white hover:underline">{post.name}</Link>
              {post.verified && <img src="/verified-blue.png" className="w-5 h-5" />}
              {post.admin && <img src="/verified-gold.png" className="w-5 h-5" />}
              <span className="text-zinc-500">@{post.username}</span>
              <span className="text-zinc-500 text-sm">{new Date(post.createdAt).toLocaleString("ja-JP")}</span>
            </div>
            <p className="mt-4 text-white text-lg whitespace-pre-wrap break-words">{post.text}</p>
            {post.image && <img src={post.image} className="mt-4 rounded-2xl max-h-[400px] object-cover w-full border border-zinc-800" />}

            {/* アクション */}
            <div className="flex justify-between mt-6 max-w-md text-zinc-500">
              <span className="flex items-center gap-2">{post.replies || 0}</span>
              <span className="flex items-center gap-2">{post.reposts || 0}</span>
              <span className="flex items-center gap-2">{post.likes || 0}</span>
              <span className="flex items-center gap-2">{post.bookmarks || 0}</span>
              <span className="flex items-center gap-2 text-zinc-600">{impressions.toLocaleString()}</span>
            </div>

            {/* ボタン */}
            <div className="flex justify-between mt-4 pt-4 border-t border-zinc-800 max-w-md text-zinc-500">
              <button onClick={submitReply} className="hover:text-sky-400 flex items-center gap-2 transition">💬</button>
              <button onClick={repostPost} className={`flex items-center gap-2 transition ${isReposted ? "text-green-400" : "hover:text-green-400"}`}>🔁</button>
              <button onClick={likePost} className={`flex items-center gap-2 transition ${isLiked ? "text-pink-400" : "hover:text-pink-400"}`}>❤️</button>
              <button onClick={bookmarkPost} className={`flex items-center gap-2 transition ${isBookmarked ? "text-yellow-400" : "hover:text-yellow-400"}`}>🔖</button>
              <button onClick={reportPost} className="hover:text-red-400 flex items-center gap-2 transition">⚠️</button>
              {isOwner && <button onClick={deletePost} className="hover:text-red-500 flex items-center gap-2 transition">🗑️</button>}
            </div>
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
              className="bg-blue-500 hover:bg-blue-600 transition px-6 py-2 rounded-full font-bold text-white disabled:opacity-40">
              {replying ? "送信中..." : "リプライ"}
            </button>
          </div>
        </div>
      </div>

      {/* リプライ一覧 */}
      <div>
        {replies.length === 0 ? (
          <p className="text-center text-zinc-600 py-10">リプライはまだありません</p>
        ) : (
          replies.map((reply) => {
            const isReplyLiked = reply.likedUsers?.includes(currentUser?.uid);
            const isReplyReposted = reply.repostedUsers?.includes(currentUser?.uid);
            const isReplyOwner = currentUser?.uid === reply.uid;
            const canDeleteReply = isReplyOwner || currentUser?.admin;
            const replyImpressions = (reply.likedUsers?.length || 0) + (reply.repostedUsers?.length || 0) + (reply.impressions || 0);

            return (
              <div key={reply.id} className="border-b border-zinc-800 p-4 hover:bg-zinc-950 transition">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex gap-3 flex-1 min-w-0">
                    <Link href={`/user/${reply.uid}`} className="shrink-0">
                      <img src={reply.icon || "/default.png"} className="w-10 h-10 rounded-full object-cover bg-zinc-700" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/user/${reply.uid}`} className="font-bold text-white hover:underline text-sm">{reply.name}</Link>
                        {reply.verified && <img src="/verified-blue.png" className="w-4 h-4" />}
                        {reply.admin && <img src="/verified-gold.png" className="w-4 h-4" />}
                        <span className="text-zinc-500 text-sm">@{reply.username}</span>
                        <span className="text-zinc-600 text-xs">{new Date(reply.createdAt).toLocaleString("ja-JP")}</span>
                      </div>
                      <p className="mt-2 text-white text-sm whitespace-pre-wrap break-words">{reply.text}</p>

                      {/* リプライのアクションボタン */}
                      <div className="flex justify-between mt-3 max-w-md text-zinc-500">
                        {/* 返信 */}
                        <span className="flex items-center gap-1.5 text-sm">💬 0</span>

                        {/* リクリート */}
                        <button onClick={async () => {
                          if (!currentUser) return;
                          const repostedUsers = reply.repostedUsers || [];
                          const alreadyReposted = repostedUsers.includes(currentUser.uid);
                          const newRepostedUsers = alreadyReposted
                            ? repostedUsers.filter((id: string) => id !== currentUser.uid)
                            : [...repostedUsers, currentUser.uid];
                          const replyDocRef = doc(db, "posts", postId, "replies", reply.id);
                          await updateDoc(replyDocRef, {
                            repostedUsers: newRepostedUsers,
                          });
                          setReplies((prev) =>
                            prev.map((r) =>
                              r.id === reply.id ? { ...r, repostedUsers: newRepostedUsers } : r
                            )
                          );
                        }}
                          className={`flex items-center gap-1.5 text-sm transition ${isReplyReposted ? "text-green-400" : "hover:text-green-400"}`}>
                          🔁 {reply.repostedUsers?.length || 0}
                        </button>

                        {/* いいね */}
                        <button onClick={async () => {
                          if (!currentUser) return;
                          const likedUsers = reply.likedUsers || [];
                          const alreadyLiked = likedUsers.includes(currentUser.uid);
                          const newLikedUsers = alreadyLiked
                            ? likedUsers.filter((id: string) => id !== currentUser.uid)
                            : [...likedUsers, currentUser.uid];
                          const replyDocRef = doc(db, "posts", postId, "replies", reply.id);
                          await updateDoc(replyDocRef, {
                            likedUsers: newLikedUsers,
                          });
                          setReplies((prev) =>
                            prev.map((r) =>
                              r.id === reply.id ? { ...r, likedUsers: newLikedUsers } : r
                            )
                          );
                        }}
                          className={`flex items-center gap-1.5 text-sm transition ${isReplyLiked ? "text-pink-400" : "hover:text-pink-400"}`}>
                          ❤️ {reply.likedUsers?.length || 0}
                        </button>

                        {/* ブックマーク（非表示） */}
                        <span className="flex items-center gap-1.5 text-sm">🔖 0</span>

                        {/* インプレッション */}
                        <span className="flex items-center gap-1.5 text-sm text-zinc-600">📊 {replyImpressions}</span>
                      </div>
                    </div>
                  </div>

                  {/* ⋯ メニュー */}
                  <div className="relative shrink-0">
                    <button onClick={() => setReplyMenuOpen(replyMenuOpen === reply.id ? null : reply.id)}
                      className="text-zinc-500 hover:text-white text-2xl px-2">⋯</button>
                    {replyMenuOpen === reply.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setReplyMenuOpen(null)} />
                        <div className="absolute right-0 top-10 bg-black border border-zinc-700 rounded-2xl overflow-hidden w-56 z-50 shadow-2xl">
                          {canDeleteReply && (
                            <>
                              <button onClick={() => {
                                setReplyAnalyticsPost({ id: reply.id, ...reply });
                                setReplyMenuOpen(null);
                              }}
                                className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-white flex items-center gap-2">
                                <span>📊</span><span>アナリティクス</span>
                              </button>
                              <div className="border-t border-zinc-800" />
                            </>
                          )}
                          <button onClick={async () => {
                            if (!currentUser) return;
                            await addDoc(collection(db, "notifications"), {
                              type: "report",
                              message: `${currentUser.name}さんがリプライを通報しました`,
                              postId: postId,
                              replyId: reply.id,
                              postText: reply.text || "",
                              reportedBy: currentUser.uid,
                              reportedByName: currentUser.name,
                              targetUid: reply.uid,
                              readBy: [],
                              createdAt: Date.now(),
                            });
                            alert("通報しました");
                            setReplyMenuOpen(null);
                          }}
                            className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-red-400">
                            このリプライを通報
                          </button>
                          {canDeleteReply && (
                            <button onClick={async () => {
                              const ok = confirm("リプライを削除しますか？");
                              if (!ok) return;
                              try {
                                await deleteDoc(doc(db, "posts", postId, "replies", reply.id));
                                await updateDoc(doc(db, "posts", postId), {
                                  replies: increment(-1),
                                });
                                setReplies((prev) => prev.filter((r) => r.id !== reply.id));
                              } catch (e) {
                                console.error(e);
                                alert("削除に失敗しました");
                              }
                              setReplyMenuOpen(null);
                            }}
                              className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-red-500 border-t border-zinc-800">
                              リプライを削除
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* リプライのアナリティクスモーダル */}
                {replyAnalyticsPost?.id === reply.id && (
                  <div className="mt-4 bg-zinc-900 rounded-2xl p-4">
                    <div className="text-sm">
                      <div className="flex gap-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-pink-400">{reply.likedUsers?.length || 0}</div>
                          <div className="text-xs text-zinc-500">いいね</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-400">{reply.repostedUsers?.length || 0}</div>
                          <div className="text-xs text-zinc-500">リクリート</div>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setReplyAnalyticsPost(null)} className="mt-3 w-full bg-zinc-700 hover:bg-zinc-600 rounded-xl py-2 text-sm font-bold transition">閉じる</button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Layout>
  );
}