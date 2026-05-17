"use client";

import { useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  doc,
  deleteDoc,
  addDoc,
  collection,
  updateDoc,
  serverTimestamp,
  increment,
  arrayUnion,
} from "firebase/firestore";

// ───────────────────────────────────────
// 引用元カード（PostCard内に直接定義）
// ───────────────────────────────────────
function QuotePostCard({ post }: { post: any }) {
  if (!post) {
    return (
      <div className="border border-zinc-700 rounded-xl p-3 mt-3 text-zinc-500 text-sm">
        この投稿は削除されました
      </div>
    );
  }

  const createdAt =
    post.createdAt?.toDate?.()
      ? post.createdAt.toDate()
      : new Date(post.createdAt ?? Date.now());

  return (
    <div className="border border-zinc-700 rounded-xl p-3 mt-3 hover:bg-zinc-900 transition cursor-pointer">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <img
          src={post.icon || "/default.png"}
          className="w-5 h-5 rounded-full object-cover bg-zinc-700"
        />
        <span className="font-bold text-white text-sm">{post.name}</span>
        {post.verified && (
          <img src="/verified-blue.png" className="w-4 h-4" />
        )}
        {post.admin && (
          <img src="/verified-gold.png" className="w-4 h-4" />
        )}
        <span className="text-zinc-500 text-sm">@{post.username}</span>
        <span className="text-zinc-600 text-xs ml-auto">
          {createdAt.toLocaleString("ja-JP")}
        </span>
      </div>

      {/* テキスト */}
      {post.text && (
        <p className="text-sm text-white whitespace-pre-wrap break-words line-clamp-3">
          {post.text}
        </p>
      )}

      {/* 画像 */}
      {post.image && (
        <img
          src={post.image}
          className="mt-2 rounded-lg max-h-40 object-cover border border-zinc-800 w-full"
        />
      )}
    </div>
  );
}

// ───────────────────────────────────────
// リポスト選択モーダル
// ───────────────────────────────────────
function RepostModal({
  isReposted,
  onClose,
  onRepost,
  onQuote,
}: {
  isReposted: boolean;
  onClose: () => void;
  onRepost: () => void;
  onQuote: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-10 bg-black border border-zinc-700 rounded-2xl overflow-hidden w-64 z-50 shadow-2xl">
        {/* リポスト */}
        <button
          onClick={() => { onRepost(); onClose(); }}
          className="w-full text-left px-4 py-3 hover:bg-zinc-900 flex items-center gap-3"
        >
          <span className="text-xl">🔁</span>
          <div>
            <p className={`font-bold text-sm ${isReposted ? "text-green-400" : "text-white"}`}>
              {isReposted ? "リポストを取り消す" : "リポスト"}
            </p>
            <p className="text-zinc-500 text-xs">
              {isReposted ? "タイムラインから削除" : "すぐに投稿"}
            </p>
          </div>
        </button>

        <div className="border-t border-zinc-800" />

        {/* 引用リポスト */}
        <button
          onClick={() => { onQuote(); onClose(); }}
          className="w-full text-left px-4 py-3 hover:bg-zinc-900 flex items-center gap-3"
        >
          <span className="text-xl">✏️</span>
          <div>
            <p className="font-bold text-sm text-white">引用リポスト</p>
            <p className="text-zinc-500 text-xs">コメントを添えて投稿</p>
          </div>
        </button>

        <div className="border-t border-zinc-800" />

        {/* キャンセル */}
        <button
          onClick={onClose}
          className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-zinc-400 text-sm"
        >
          キャンセル
        </button>
      </div>
    </>
  );
}

// ───────────────────────────────────────
// 引用テキスト入力モーダル
// ───────────────────────────────────────
function QuoteModal({
  targetPost,
  currentUser,
  onClose,
}: {
  targetPost: any;
  currentUser: any;
  onClose: () => void;
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
      // ハッシュタグ抽出
      const hashtags =
        text.match(/#[\w\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]+/g)?.map(
          (t) => t.slice(1)
        ) ?? [];

      // 引用元スナップショット（削除後も表示できるよう埋め込む）
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

      // 新規投稿として保存
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
        likes: 0,
        reposts: 0,
        bookmarks: 0,
        replies: 0,
        likedUsers: [],
        repostedUsers: [],
        bookmarkedUsers: [],
        isQuoteRepost: true,
        quotePostId: targetPost.id,
        quotePost: quoteSnap,
        createdAt: Date.now(),
      });

      // 引用元のリポスト数をインクリメント
      await updateDoc(doc(db, "posts", targetPost.id), {
        reposts: increment(1),
        repostedUsers: arrayUnion(currentUser.uid),
      });

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
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 z-40 bg-black/70"
        onClick={onClose}
      />

      {/* モーダル本体 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-black border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

          {/* ヘッダー */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white text-2xl px-1"
            >
              ✕
            </button>
            <h2 className="font-bold text-white">引用リポスト</h2>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="bg-white text-black font-bold text-sm px-4 py-1.5 rounded-full disabled:opacity-40 hover:bg-zinc-200 transition"
            >
              {loading ? "投稿中..." : "投稿する"}
            </button>
          </div>

          {/* 入力エリア */}
          <div className="flex gap-3 p-4 overflow-y-auto">
            {/* アイコン */}
            <img
              src={currentUser?.icon || "/default.png"}
              className="w-10 h-10 rounded-full object-cover bg-zinc-700 shrink-0"
            />

            <div className="flex-1 min-w-0">
              {/* ユーザー名 */}
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white text-sm">
                  {currentUser?.name}
                </span>
                {currentUser?.verified && (
                  <img src="/verified-blue.png" className="w-4 h-4" />
                )}
                {currentUser?.admin && (
                  <img src="/verified-gold.png" className="w-4 h-4" />
                )}
                <span className="text-zinc-500 text-sm">
                  @{currentUser?.username}
                </span>
              </div>

              {/* テキスト入力 */}
              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="コメントを追加..."
                rows={4}
                className="w-full bg-transparent text-white placeholder-zinc-600 resize-none outline-none text-base leading-relaxed"
              />

              {/* 引用元カード */}
              <QuotePostCard post={targetPost} />
            </div>
          </div>

          {/* フッター（文字数） */}
          <div className="flex items-center justify-end px-4 py-3 border-t border-zinc-800 shrink-0">
            <span
              className={`text-sm font-medium ${
                remaining < 0
                  ? "text-red-500"
                  : remaining < 20
                  ? "text-yellow-500"
                  : "text-zinc-500"
              }`}
            >
              {remaining}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ───────────────────────────────────────
// メイン PostCard
// ───────────────────────────────────────
export default function PostCard({ post, currentUser }: any) {
  const [open, setOpen] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const isLiked = post.likedUsers?.includes(currentUser?.uid);
  const isReposted = post.repostedUsers?.includes(currentUser?.uid);
  const isBookmarked = post.bookmarkedUsers?.includes(currentUser?.uid);

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
      createdAt: Date.now(),
    });

    await addDoc(collection(db, "reports"), {
      postId: post.id,
      text: post.text,
      createdAt: Date.now(),
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

  const canDelete =
    currentUser?.uid === post.uid || currentUser?.admin;

  return (
    <div className="border-b border-zinc-800 p-4 hover:bg-zinc-950 transition">

      {/* 上 */}
      <div className="flex justify-between items-start gap-3">

        {/* 左（プロフィールリンク） */}
        <Link href={`/user/${post.uid}`} className="flex gap-3 flex-1">

          {/* アイコン */}
          <img
            src={post.icon || "/default.png"}
            className="w-12 h-12 rounded-full object-cover shrink-0 bg-zinc-700"
          />

          {/* 本体 */}
          <div className="flex-1 min-w-0">

            {/* 名前・バッジ・ID・時間 */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-bold text-white text-[17px]">{post.name}</div>

              {post.verified && (
                <img src="/verified-blue.png" className="w-5 h-5" />
              )}
              {post.admin && (
                <img src="/verified-gold.png" className="w-5 h-5" />
              )}

              <div className="text-zinc-500">@{post.username}</div>
              <div className="text-zinc-500 text-sm">
                · {new Date(post.createdAt).toLocaleString("ja-JP")}
              </div>
            </div>

            {/* 引用リポストラベル */}
            {post.isQuoteRepost && (
              <div className="text-zinc-500 text-xs mt-1 flex items-center gap-1">
                <span>🔁</span>
                <span>引用リポスト</span>
              </div>
            )}

            {/* 本文 */}
            <div className="mt-2 whitespace-pre-wrap break-words text-[16px]">
              {post.text}
            </div>

            {/* 通常画像 */}
            {post.image && (
              <img
                src={post.image}
                className="mt-4 rounded-2xl max-h-[500px] object-cover border border-zinc-800"
              />
            )}

            {/* 引用元カード */}
            {post.isQuoteRepost && (
              <QuotePostCard post={post.quotePost ?? null} />
            )}

            {/* ハッシュタグ */}
            {post.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {post.hashtags.map((tag: string, index: number) => (
                  <div key={index} className="text-blue-400">
                    {tag}
                  </div>
                ))}
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex justify-between mt-5 max-w-md text-zinc-500">

              {/* リプライ */}
              <button className="hover:text-sky-400 flex items-center gap-2 transition">
                <span>💬</span>
                <span>{post.replies || 0}</span>
              </button>

              {/* リポスト（モーダル経由） */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowRepostModal((prev) => !prev);
                  }}
                  className={`flex items-center gap-2 transition ${
                    isReposted
                      ? "text-green-400"
                      : "hover:text-green-400"
                  }`}
                >
                  <span>🔁</span>
                  <span>{post.reposts || 0}</span>
                </button>

                {showRepostModal && (
                  <RepostModal
                    isReposted={isReposted}
                    onClose={() => setShowRepostModal(false)}
                    onRepost={repostPost}
                    onQuote={() => setShowQuoteModal(true)}
                  />
                )}
              </div>

              {/* いいね */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  likePost();
                }}
                className={`flex items-center gap-2 transition ${
                  isLiked ? "text-pink-400" : "hover:text-pink-400"
                }`}
              >
                <span>❤️</span>
                <span>{post.likes || 0}</span>
              </button>

              {/* ブックマーク */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  bookmarkPost();
                }}
                className={`flex items-center gap-2 transition ${
                  isBookmarked ? "text-yellow-400" : "hover:text-yellow-400"
                }`}
              >
                <span>🔖</span>
                <span>{post.bookmarks || 0}</span>
              </button>

            </div>
          </div>
        </Link>

        {/* ⋯ メニュー */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="text-zinc-500 hover:text-white text-2xl px-2"
          >
            ⋯
          </button>

          {open && (
            <div className="absolute right-0 top-10 bg-black border border-zinc-700 rounded-2xl overflow-hidden w-56 z-50 shadow-2xl">
              <button
                onClick={reportPost}
                className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-red-400"
              >
                このクリートを通報
              </button>

              {canDelete && (
                <button
                  onClick={deletePost}
                  className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-red-500 border-t border-zinc-800"
                >
                  クリートを削除
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 引用モーダル（全画面） */}
      {showQuoteModal && (
        <QuoteModal
          targetPost={post}
          currentUser={currentUser}
          onClose={() => setShowQuoteModal(false)}
        />
      )}
    </div>
  );
}
