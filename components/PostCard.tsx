"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  deleteDoc,
  addDoc,
  collection,
  updateDoc,
  increment,
  arrayUnion,
  query,
  where,
  getDocs,
} from "firebase/firestore";

// ───────────────────────────────────────
// 本文パーサー（ハッシュタグ・メンションを青リンクに）
// ───────────────────────────────────────
function PostText({
  text,
  currentUser,
}: {
  text: string;
  currentUser: any;
}) {
  const router = useRouter();
  if (!text) return null;

  // #タグ と @メンション を同時にパース
  const parts = text.split(/(#[^\s#]+|@[a-zA-Z0-9_]+)/g);

  const handleMentionClick = async (
    e: React.MouseEvent,
    username: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // username からユーザーを検索してプロフィールへ
    try {
      const q = query(
        collection(db, "users"),
        where("username", "==", username)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const uid = snap.docs[0].id;
        router.push(`/user/${uid}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <span className="whitespace-pre-wrap break-words text-[16px] text-white">
      {parts.map((part, i) => {
        // ハッシュタグ
        if (/^#[^\s#]+/.test(part)) {
          const word = part.slice(1);
          return (
            <span
              key={i}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/search?q=${encodeURIComponent(word)}`);
              }}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              {part}
            </span>
          );
        }

        // メンション
        if (/^@[a-zA-Z0-9_]+/.test(part)) {
          const username = part.slice(1);
          return (
            <span
              key={i}
              onClick={(e) => handleMentionClick(e, username)}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              {part}
            </span>
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

// ───────────────────────────────────────
// 引用元カード
// ───────────────────────────────────────
function QuotePostCard({ post }: { post: any }) {
  if (!post) {
    return (
      <div className="border border-zinc-700 rounded-xl p-3 mt-3 text-zinc-500 text-sm">
        この投稿は削除されました
      </div>
    );
  }
  const createdAt = post.createdAt?.toDate?.()
    ? post.createdAt.toDate()
    : new Date(post.createdAt ?? Date.now());
  return (
    <Link
      href={`/post/${post.id}`}
      onClick={(e) => e.stopPropagation()}
      className="block border border-zinc-700 rounded-xl p-3 mt-3 hover:bg-zinc-900 transition"
    >
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <img src={post.icon || "/default.png"} className="w-5 h-5 rounded-full object-cover bg-zinc-700" />
        <span className="font-bold text-white text-sm">{post.name}</span>
        {post.verified && <img src="/verified-blue.png" className="w-4 h-4" />}
        {post.admin && <img src="/verified-gold.png" className="w-4 h-4" />}
        <span className="text-zinc-500 text-sm">@{post.username}</span>
        <span className="text-zinc-600 text-xs ml-auto">{createdAt.toLocaleString("ja-JP")}</span>
      </div>
      {post.text && (
        <p className="text-sm text-white whitespace-pre-wrap break-words line-clamp-3">{post.text}</p>
      )}
      {post.image && (
        <img src={post.image} className="mt-2 rounded-lg max-h-40 object-cover border border-zinc-800 w-full" />
      )}
    </Link>
  );
}

// ───────────────────────────────────────
// リポスト選択モーダル
// ───────────────────────────────────────
function RepostModal({
  isReposted, onClose, onRepost, onQuote,
}: {
  isReposted: boolean; onClose: () => void; onRepost: () => void; onQuote: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-10 bg-black border border-zinc-700 rounded-2xl overflow-hidden w-64 z-50 shadow-2xl">
        <button onClick={() => { onRepost(); onClose(); }} className="w-full text-left px-4 py-3 hover:bg-zinc-900 flex items-center gap-3">
          <span className="text-xl">🔁</span>
          <div>
            <p className={`font-bold text-sm ${isReposted ? "text-green-400" : "text-white"}`}>
              {isReposted ? "リポストを取り消す" : "リポスト"}
            </p>
            <p className="text-zinc-500 text-xs">{isReposted ? "タイムラインから削除" : "すぐに投稿"}</p>
          </div>
        </button>
        <div className="border-t border-zinc-800" />
        <button onClick={() => { onQuote(); onClose(); }} className="w-full text-left px-4 py-3 hover:bg-zinc-900 flex items-center gap-3">
          <span className="text-xl">✏️</span>
          <div>
            <p className="font-bold text-sm text-white">引用リポスト</p>
            <p className="text-zinc-500 text-xs">コメントを添えて投稿</p>
          </div>
        </button>
        <div className="border-t border-zinc-800" />
        <button onClick={onClose} className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-zinc-400 text-sm">キャンセル</button>
      </div>
    </>
  );
}

// ───────────────────────────────────────
// 引用テキスト入力モーダル
// ───────────────────────────────────────
function QuoteModal({
  targetPost, currentUser, onClose,
}: {
  targetPost: any; currentUser: any; onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const MAX = 280;
  const remaining = MAX - text.length;
  const canSubmit = text.trim().length > 0 && remaining >= 0 && !loading;

  const handleSubmit = async () => {
    if (!currentUser || !canSubmit) return;
    setLoading(true);
    try {
      const hashtags = text.match(/#[^\s#]+/g)?.map((t) => t.slice(1)) ?? [];
      const quoteSnap = {
        id: targetPost.id,
        text: targetPost.text ?? "",
        image: targetPost.image ?? null,
        uid: targetPost.uid,
        name: targetPost.name,
        username: targetPost.username,
        icon: targetPost.icon ?? "",
        verified: targetPost.verified ?? false,
        admin: targetPost.admin ?? false,
        createdAt: targetPost.createdAt ?? null,
      };

      await addDoc(collection(db, "posts"), {
        text: text.trim(),
        image: null,
        hashtags,
        uid: currentUser.uid,
        name: currentUser.name,
        username: currentUser.username,
        icon: currentUser.icon ?? "",
        verified: currentUser.verified ?? false,
        admin: currentUser.admin ?? false,
        likes: 0, reposts: 0, bookmarks: 0, replies: 0,
        likedUsers: [], repostedUsers: [], bookmarkedUsers: [],
        isQuoteRepost: true,
        quotePostId: targetPost.id,
        quotePost: quoteSnap,
        createdAt: Date.now(),
      });

      await updateDoc(doc(db, "posts", targetPost.id), {
        reposts: increment(1),
        repostedUsers: arrayUnion(currentUser.uid),
      });

      if (targetPost.uid !== currentUser.uid) {
        await addDoc(collection(db, "notifications"), {
          type: "quote",
          toUid: targetPost.uid,
          fromUid: currentUser.uid,
          fromName: currentUser.name,
          fromIcon: currentUser.icon ?? "",
          fromUsername: currentUser.username,
          postId: targetPost.id,
          postText: targetPost.text ?? "",
          readBy: [],
          createdAt: Date.now(),
        });
      }

      // メンション通知
      await sendMentionNotifications(text, currentUser);

      onClose();
    } catch (e) {
      console.error(e);
      alert("投稿に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-black border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
            <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl px-1">✕</button>
            <h2 className="font-bold text-white">引用リポスト</h2>
            <button onClick={handleSubmit} disabled={!canSubmit}
              className="bg-white text-black font-bold text-sm px-4 py-1.5 rounded-full disabled:opacity-40 hover:bg-zinc-200 transition">
              {loading ? "投稿中..." : "投稿する"}
            </button>
          </div>
          <div className="flex gap-3 p-4 overflow-y-auto">
            <img src={currentUser?.icon || "/default.png"} className="w-10 h-10 rounded-full object-cover bg-zinc-700 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white text-sm">{currentUser?.name}</span>
                {currentUser?.verified && <img src="/verified-blue.png" className="w-4 h-4" />}
                {currentUser?.admin && <img src="/verified-gold.png" className="w-4 h-4" />}
                <span className="text-zinc-500 text-sm">@{currentUser?.username}</span>
              </div>
              <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)}
                placeholder="コメントを追加..." rows={4}
                className="w-full bg-transparent text-white placeholder-zinc-600 resize-none outline-none text-base leading-relaxed" />
              <QuotePostCard post={targetPost} />
            </div>
          </div>
          <div className="flex items-center justify-end px-4 py-3 border-t border-zinc-800 shrink-0">
            <span className={`text-sm font-medium ${remaining < 0 ? "text-red-500" : remaining < 20 ? "text-yellow-500" : "text-zinc-500"}`}>
              {remaining}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ───────────────────────────────────────
// メンション通知送信（共通ユーティリティ）
// ───────────────────────────────────────
async function sendMentionNotifications(text: string, currentUser: any) {
  const mentions = text.match(/@([a-zA-Z0-9_]+)/g);
  if (!mentions) return;

  const usernames = [...new Set(mentions.map((m) => m.slice(1)))];

  for (const username of usernames) {
    // 自分自身へのメンションは除外
    if (username === currentUser.username) continue;

    try {
      const q = query(
        collection(db, "users"),
        where("username", "==", username)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const targetUid = snap.docs[0].id;
        await addDoc(collection(db, "notifications"), {
          type: "mention",
          toUid: targetUid,
          fromUid: currentUser.uid,
          fromName: currentUser.name,
          fromIcon: currentUser.icon ?? "",
          fromUsername: currentUser.username,
          postText: text,
          readBy: [],
          createdAt: Date.now(),
        });
      }
    } catch (e) {
      console.error(e);
    }
  }
}

// ───────────────────────────────────────
// メイン PostCard
// ───────────────────────────────────────
export default function PostCard({
  post, currentUser, onAnalytics,
}: {
  post: any; currentUser: any; onAnalytics?: (post: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const isLiked = post.likedUsers?.includes(currentUser?.uid);
  const isReposted = post.repostedUsers?.includes(currentUser?.uid);
  const isBookmarked = post.bookmarkedUsers?.includes(currentUser?.uid);
  const isOwner = currentUser?.uid === post.uid;
  const canDelete = isOwner || currentUser?.admin;

  // 通報
  const reportPost = async () => {
    if (!currentUser) return;
    await addDoc(collection(db, "notifications"), {
      type: "report",
      message: "クリートが通報されました",
      postId: post.id,
      postText: post.text || "",
      postImage: post.image || "",
      reportedBy: currentUser.uid,
      targetUid: post.uid,
      readBy: [],
      createdAt: Date.now(),
    });
    await addDoc(collection(db, "reports"), {
      postId: post.id, text: post.text, createdAt: Date.now(),
    });
    alert("通報しました");
    setOpen(false);
  };

  // 削除
  const deletePost = async () => {
    await deleteDoc(doc(db, "posts", post.id));
  };

  // いいね
  const likePost = async () => {
    if (!currentUser) return;
    const likedUsers = post.likedUsers || [];
    const alreadyLiked = likedUsers.includes(currentUser.uid);
    const newLikedUsers = alreadyLiked
      ? likedUsers.filter((id: string) => id !== currentUser.uid)
      : [...likedUsers, currentUser.uid];
    await updateDoc(doc(db, "posts", post.id), {
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
        postId: post.id,
        postText: post.text ?? "",
        readBy: [],
        createdAt: Date.now(),
      });
    }
  };

  // リポスト（通常）
  const repostPost = async () => {
    if (!currentUser) return;
    const repostedUsers = post.repostedUsers || [];
    const alreadyReposted = repostedUsers.includes(currentUser.uid);
    const newRepostedUsers = alreadyReposted
      ? repostedUsers.filter((id: string) => id !== currentUser.uid)
      : [...repostedUsers, currentUser.uid];
    await updateDoc(doc(db, "posts", post.id), {
      repostedUsers: newRepostedUsers,
      reposts: newRepostedUsers.length,
    });
    if (!alreadyReposted && post.uid !== currentUser.uid) {
      await addDoc(collection(db, "notifications"), {
        type: "repost",
        toUid: post.uid,
        fromUid: currentUser.uid,
        fromName: currentUser.name,
        fromIcon: currentUser.icon ?? "",
        fromUsername: currentUser.username,
        postId: post.id,
        postText: post.text ?? "",
        readBy: [],
        createdAt: Date.now(),
      });
    }
  };

  // ブックマーク
  const bookmarkPost = async () => {
    if (!currentUser) return;
    const bookmarkedUsers = post.bookmarkedUsers || [];
    const alreadyBookmarked = bookmarkedUsers.includes(currentUser.uid);
    const newBookmarkedUsers = alreadyBookmarked
      ? bookmarkedUsers.filter((id: string) => id !== currentUser.uid)
      : [...bookmarkedUsers, currentUser.uid];
    await updateDoc(doc(db, "posts", post.id), {
      bookmarkedUsers: newBookmarkedUsers,
      bookmarks: newBookmarkedUsers.length,
    });
  };

  return (
    <div className="border-b border-zinc-800 p-4 hover:bg-zinc-950 transition">
      <div className="flex justify-between items-start gap-3">
        <div className="flex gap-3 flex-1 min-w-0">

          {/* アイコン */}
          <Link href={`/user/${post.uid}`} onClick={(e) => e.stopPropagation()} className="shrink-0">
            <img src={post.icon || "/default.png"} className="w-12 h-12 rounded-full object-cover bg-zinc-700" />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/user/${post.uid}`} onClick={(e) => e.stopPropagation()}
                className="font-bold text-white text-[17px] hover:underline">
                {post.name}
              </Link>
              {post.verified && <img src="/verified-blue.png" className="w-5 h-5" />}
              {post.admin && <img src="/verified-gold.png" className="w-5 h-5" />}
              <span className="text-zinc-500">@{post.username}</span>
              <span className="text-zinc-500 text-sm">
                · {new Date(post.createdAt).toLocaleString("ja-JP")}
              </span>
            </div>

            {post.isQuoteRepost && (
              <div className="text-zinc-500 text-xs mt-1 flex items-center gap-1">
                <span>🔁</span><span>引用リポスト</span>
              </div>
            )}

            {/* 本文（ハッシュタグ・メンション青リンク） */}
            <Link href={`/post/${post.id}`} className="block mt-2"
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.tagName === "SPAN" && target.classList.contains("text-blue-400")) {
                  e.preventDefault();
                }
              }}>
              <PostText text={post.text} currentUser={currentUser} />
            </Link>

            {/* 画像 */}
            {post.image && (
              <Link href={`/post/${post.id}`}>
                <img src={post.image} className="mt-4 rounded-2xl max-h-[500px] object-cover border border-zinc-800 w-full" />
              </Link>
            )}

            {post.isQuoteRepost && <QuotePostCard post={post.quotePost ?? null} />}

            {/* アクションボタン */}
            <div className="flex justify-between mt-5 max-w-md text-zinc-500">

              <Link href={`/post/${post.id}`} className="hover:text-sky-400 flex items-center gap-2 transition">
                <span>💬</span><span>{post.replies || 0}</span>
              </Link>

              <div className="relative">
                <button onClick={(e) => { e.preventDefault(); setShowRepostModal((p) => !p); }}
                  className={`flex items-center gap-2 transition ${isReposted ? "text-green-400" : "hover:text-green-400"}`}>
                  <span>🔁</span><span>{post.reposts || 0}</span>
                </button>
                {showRepostModal && (
                  <RepostModal isReposted={isReposted} onClose={() => setShowRepostModal(false)}
                    onRepost={repostPost} onQuote={() => setShowQuoteModal(true)} />
                )}
              </div>

              <button onClick={(e) => { e.preventDefault(); likePost(); }}
                className={`flex items-center gap-2 transition ${isLiked ? "text-pink-400" : "hover:text-pink-400"}`}>
                <span>❤️</span><span>{post.likes || 0}</span>
              </button>

              <button onClick={(e) => { e.preventDefault(); bookmarkPost(); }}
                className={`flex items-center gap-2 transition ${isBookmarked ? "text-yellow-400" : "hover:text-yellow-400"}`}>
                <span>🔖</span><span>{post.bookmarks || 0}</span>
              </button>

            </div>
          </div>
        </div>

        {/* ⋯ メニュー */}
        <div className="relative shrink-0">
          <button onClick={() => setOpen(!open)} className="text-zinc-500 hover:text-white text-2xl px-2">⋯</button>
          {open && (
            <div className="absolute right-0 top-10 bg-black border border-zinc-700 rounded-2xl overflow-hidden w-56 z-50 shadow-2xl">
              {(isOwner || currentUser?.admin) && onAnalytics && (
                <>
                  <button onClick={() => { onAnalytics(post); setOpen(false); }}
                    className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-white flex items-center gap-2">
                    <span>📊</span><span>アナリティクス</span>
                  </button>
                  <div className="border-t border-zinc-800" />
                </>
              )}
              <button onClick={reportPost} className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-red-400">
                このクリートを通報
              </button>
              {canDelete && (
                <button onClick={deletePost} className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-red-500 border-t border-zinc-800">
                  クリートを削除
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showQuoteModal && (
        <QuoteModal targetPost={post} currentUser={currentUser} onClose={() => setShowQuoteModal(false)} />
      )}
    </div>
  );
}