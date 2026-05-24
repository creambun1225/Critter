"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import {
  doc, getDoc, collection, addDoc, onSnapshot,
  query, orderBy, updateDoc, increment,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Layout from "@/components/Layout";

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
  const createdAt = post.createdAt?.toDate?.() ? post.createdAt.toDate() : new Date(post.createdAt ?? Date.now());
  return (
    <div className="border border-zinc-700 rounded-xl p-3 mt-3">
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <img src={post.icon || "/default.png"} className="w-5 h-5 rounded-full object-cover bg-zinc-700" />
        <span className="font-bold text-white text-sm">{post.name}</span>
        {post.verified && <img src="/verified-blue.png" className="w-4 h-4" />}
        {post.admin && <img src="/verified-gold.png" className="w-4 h-4" />}
        <span className="text-zinc-500 text-sm">@{post.username}</span>
        <span className="text-zinc-600 text-xs ml-auto">{createdAt.toLocaleString("ja-JP")}</span>
      </div>
      {post.text && <p className="text-sm text-white whitespace-pre-wrap break-words line-clamp-3">{post.text}</p>}
      {post.image && <img src={post.image} className="mt-2 rounded-lg max-h-40 object-cover border border-zinc-800 w-full" />}
    </div>
  );
}

// ───────────────────────────────────────
// リプライカード
// ───────────────────────────────────────
function ReplyCard({ reply }: { reply: any }) {
  const createdAt = reply.createdAt?.toDate?.() ? reply.createdAt.toDate() : new Date(reply.createdAt ?? Date.now());
  return (
    <div className="border-b border-zinc-800 p-4 hover:bg-zinc-950 transition">
      <div className="flex gap-3">
        <Link href={`/user/${reply.uid}`} className="shrink-0">
          <img src={reply.icon || "/default.png"} className="w-10 h-10 rounded-full object-cover bg-zinc-700" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/user/${reply.uid}`} className="font-bold text-white text-[15px] hover:underline">{reply.name}</Link>
            {reply.verified && <img src="/verified-blue.png" className="w-4 h-4" />}
            {reply.admin && <img src="/verified-gold.png" className="w-4 h-4" />}
            <span className="text-zinc-500 text-sm">@{reply.username}</span>
            <span className="text-zinc-500 text-sm">· {createdAt.toLocaleString("ja-JP")}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-[15px] text-white">{reply.text}</p>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────
// メインページ
// ───────────────────────────────────────
export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [post, setPost] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  const MAX = 280;
  const remaining = MAX - text.length;
  const canSubmit = text.trim().length > 0 && remaining >= 0 && !loading;

  // currentUser 取得
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { location.href = "/login"; return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setCurrentUser({ uid: user.uid, ...snap.data() });
    });
    return () => unsub();
  }, []);

  // 投稿取得
  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "posts", id as string), (snap) => {
      if (snap.exists()) setPost({ id: snap.id, ...snap.data() });
      else setNotFound(true);
    });
    return () => unsub();
  }, [id]);

  // リプライ一覧
  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, "posts", id as string, "replies"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setReplies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [id]);

  // リプライ投稿
  const submitReply = async () => {
    if (!currentUser || !canSubmit || !id || !post) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "posts", id as string, "replies"), {
        text: text.trim(),
        uid: currentUser.uid,
        name: currentUser.name,
        username: currentUser.username,
        icon: currentUser.icon ?? "",
        verified: currentUser.verified ?? false,
        admin: currentUser.admin ?? false,
        createdAt: Date.now(),
      });

      await updateDoc(doc(db, "posts", id as string), {
        replies: increment(1),
      });

      // リプライ通知（自分の投稿へのリプライは除外）
      if (post.uid !== currentUser.uid) {
        await addDoc(collection(db, "notifications"), {
          type: "reply",
          toUid: post.uid,
          fromUid: currentUser.uid,
          fromName: currentUser.name,
          fromIcon: currentUser.icon ?? "",
          fromUsername: currentUser.username,
          postId: id,
          postText: post.text ?? "",
          readBy: [],
          createdAt: Date.now(),
        });
      }

      setText("");
    } catch (e) {
      console.error(e);
      alert("リプライに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (notFound) {
    return (
      <Layout currentUser={currentUser}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-500">
          <p className="text-xl">投稿が見つかりません</p>
          <button onClick={() => router.back()} className="mt-4 text-blue-400 hover:underline">戻る</button>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout currentUser={currentUser}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-zinc-500">読み込み中...</p>
        </div>
      </Layout>
    );
  }

  const postCreatedAt = post.createdAt?.toDate?.() ? post.createdAt.toDate() : new Date(post.createdAt ?? Date.now());

  return (
    <Layout currentUser={currentUser}>

      {/* ヘッダー */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-4">
        <button onClick={() => router.back()}
          className="text-zinc-400 hover:text-white text-2xl transition w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-900">
          ←
        </button>
        <h1 className="font-bold text-white text-xl">クリート</h1>
      </div>

      {/* 元投稿 */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex gap-3">
          <Link href={`/user/${post.uid}`} className="shrink-0">
            <img src={post.icon || "/default.png"} className="w-12 h-12 rounded-full object-cover bg-zinc-700" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/user/${post.uid}`} className="font-bold text-white text-[17px] hover:underline">{post.name}</Link>
              {post.verified && <img src="/verified-blue.png" className="w-5 h-5" />}
              {post.admin && <img src="/verified-gold.png" className="w-5 h-5" />}
              <span className="text-zinc-500">@{post.username}</span>
            </div>

            {post.isQuoteRepost && (
              <div className="text-zinc-500 text-xs mt-1 flex items-center gap-1">
                <span>🔁</span><span>引用リクリート</span>
              </div>
            )}

            <p className="mt-3 text-[18px] whitespace-pre-wrap break-words leading-relaxed text-white">{post.text}</p>

            {post.image && (
              <img src={post.image} className="mt-4 rounded-2xl max-h-[500px] object-cover border border-zinc-800 w-full" />
            )}

            {post.isQuoteRepost && <QuotePostCard post={post.quotePost ?? null} />}

            {post.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {post.hashtags.map((tag: string, i: number) => (
                  <span key={i} className="text-blue-400">#{tag}</span>
                ))}
              </div>
            )}

            <div className="mt-4 text-zinc-500 text-sm border-t border-zinc-800 pt-3">
              {postCreatedAt.toLocaleString("ja-JP")}
            </div>

            <div className="flex gap-6 mt-3 border-t border-zinc-800 pt-3 text-sm text-zinc-400 flex-wrap">
              <span><span className="font-bold text-white">{post.reposts || 0}</span> リクリート</span>
              <span><span className="font-bold text-white">{post.likes || 0}</span> いいね</span>
              <span><span className="font-bold text-white">{post.replies || 0}</span> リプライ</span>
              <span><span className="font-bold text-white">{post.bookmarks || 0}</span> ブックマーク</span>
            </div>
          </div>
        </div>
      </div>

      {/* リプライ入力欄 */}
      {currentUser && (
        <div className="p-4 border-b border-zinc-800 flex gap-3">
          <img src={currentUser.icon || "/default.png"} className="w-10 h-10 rounded-full object-cover bg-zinc-700 shrink-0" />
          <div className="flex-1">
            <textarea value={text} onChange={(e) => setText(e.target.value)}
              placeholder={`@${post.username} へリプライ...`} rows={3}
              className="w-full bg-black outline-none resize-none text-lg text-white placeholder-zinc-600" />
            <div className="flex items-center justify-end gap-3 mt-2">
              <span className={`text-sm ${remaining < 0 ? "text-red-500" : remaining < 20 ? "text-yellow-500" : "text-zinc-500"}`}>
                {remaining}
              </span>
              <button onClick={submitReply} disabled={!canSubmit}
                className="bg-blue-500 hover:bg-blue-600 transition px-6 py-2 rounded-full text-base font-bold disabled:opacity-40">
                {loading ? "送信中..." : "リプライ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* リプライ一覧 */}
      <div>
        {replies.length === 0 ? (
          <p className="text-center text-zinc-600 py-10">まだリプライはありません</p>
        ) : (
          replies.map((reply) => <ReplyCard key={reply.id} reply={reply} />)
        )}
      </div>

    </Layout>
  );
}