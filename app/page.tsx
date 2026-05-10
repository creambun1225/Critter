"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  db,
  auth
} from "../lib/firebase";

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  runTransaction,
  getDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

import {
  onAuthStateChanged
} from "firebase/auth";

export default function Home() {

  const [user, setUser] = useState<any>(null);

  const [posts, setPosts] = useState<any[]>([]);

  const [text, setText] = useState("");

  const [profile, setProfile] = useState<any>(null);

  const [admin, setAdmin] = useState(false);

  useEffect(() => {

    return onAuthStateChanged(auth, async (u) => {

      if (!u) {

        location.href = "/login";

      } else {

        setUser(u);

        const snap = await getDoc(
          doc(db, "users", u.uid)
        );

        if (snap.exists()) {

          setProfile(snap.data());

          setAdmin(
            snap.data()?.admin || false
          );

        }

      }

    });

  }, []);

  useEffect(() => {

    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {

      setPosts(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );

    });

  }, []);

  // 投稿
  const post = async () => {

    if (!text.trim()) return;

    await addDoc(collection(db, "posts"), {

      text,

      uid: user.uid,

      username: profile?.username || "user",

      name: profile?.name || "user",

      icon: profile?.icon || "",

      createdAt: Date.now(),

      likes: 0,

      likedBy: [],

    });

    setText("");

  };

  // いいね
  const like = async (p: any) => {

    const ref = doc(db, "posts", p.id);

    await runTransaction(db, async (tx) => {

      const snap = await tx.get(ref);

      const data = snap.data();

      if (data?.likedBy?.includes(user.uid)) return;

      tx.update(ref, {

        likes: (data?.likes || 0) + 1,

        likedBy: [
          ...(data?.likedBy || []),
          user.uid
        ],

      });

    });

  };

  // ブックマーク
  const bookmark = async (postId: string) => {

    const ref = doc(db, "users", user.uid);

    const snap = await getDoc(ref);

    const data: any = snap.data();

    const bookmarks = data.bookmarks || [];

    if (bookmarks.includes(postId)) {

      await updateDoc(ref, {
        bookmarks: bookmarks.filter(
          (id: string) => id !== postId
        )
      });

    } else {

      await updateDoc(ref, {
        bookmarks: [
          ...bookmarks,
          postId
        ]
      });

    }

  };

  // 通報
  const reportPost = async (p: any) => {

    await addDoc(collection(db, "reports"), {

      postId: p.id,

      text: p.text,

      username: p.username,

      uid: p.uid,

      reportedBy: user.uid,

      createdAt: Date.now()

    });

    alert("通報しました");

  };

  // 削除
  const deletePost = async (postId: string) => {

    const ok = confirm(
      "削除しますか？"
    );

    if (!ok) return;

    await deleteDoc(
      doc(db, "posts", postId)
    );

  };

  if (!user || !profile) {

    return (
      <div className="flex justify-center items-center h-screen text-zinc-500">
        Loading...
      </div>
    );

  }

  return (
    <div className="min-h-screen bg-black text-white">

      {/* 上 */}
      <div className="sticky top-0 z-50 backdrop-blur bg-black/80 border-b border-zinc-800 p-4">

        <h1 className="text-2xl font-bold">
          ホーム
        </h1>

      </div>

      {/* 投稿欄 */}
      <div className="border-b border-zinc-800 p-4">

        <div className="flex gap-4">

          {profile.icon ? (

            <img
              src={profile.icon}
              className="w-12 h-12 rounded-full object-cover"
            />

          ) : (

            <div className="w-12 h-12 rounded-full bg-zinc-700" />

          )}

          <div className="flex-1">

            <textarea
              placeholder="いまどうしてる？"
              className="w-full bg-transparent text-xl resize-none outline-none min-h-[120px] placeholder:text-zinc-500"
              value={text}
              onChange={(e) =>
                setText(e.target.value)
              }
            />

            <div className="flex justify-end">

              <button
                onClick={post}
                className="bg-blue-500 hover:bg-blue-600 transition px-6 py-2 rounded-full font-bold"
              >
                クリート
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* 投稿一覧 */}
      {posts.map((p) => (

        <div
          key={p.id}
          className="border-b border-zinc-800 p-4 hover:bg-zinc-950 transition"
        >

          <div className="flex gap-4">

            {p.icon ? (

              <img
                src={p.icon}
                className="w-12 h-12 rounded-full object-cover"
              />

            ) : (

              <div className="w-12 h-12 rounded-full bg-zinc-700" />

            )}

            <div className="flex-1">

              {/* 上 */}
              <div className="flex justify-between">

                <Link href={`/user/${p.uid}`}>

                  <div className="flex items-center gap-2 hover:underline cursor-pointer">

                    <p className="font-bold">
                      {p.name}
                    </p>

                    <p className="text-zinc-500">
                      @{p.username}
                    </p>

                  </div>

                </Link>

                <details className="relative">

                  <summary className="cursor-pointer list-none text-zinc-500 hover:text-white">

                    ⋯

                  </summary>

                  <div className="absolute right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden w-48 z-50">

                    <button
                      onClick={() =>
                        reportPost(p)
                      }
                      className="w-full text-left px-4 py-3 hover:bg-zinc-800 transition"
                    >
                      このクリートを通報
                    </button>

                    {(p.uid === user.uid || admin) && (

                      <button
                        onClick={() =>
                          deletePost(p.id)
                        }
                        className="w-full text-left px-4 py-3 hover:bg-red-500/20 text-red-500 transition"
                      >
                        削除
                      </button>

                    )}

                  </div>

                </details>

              </div>

              <Link href={`/post/${p.id}`}>

                <p className="mt-2 whitespace-pre-wrap hover:underline">
                  {p.text}
                </p>

              </Link>

              {/* ボタン */}
              <div className="flex gap-8 mt-4 text-zinc-500">

                <Link href={`/post/${p.id}`}>

                  <button className="hover:text-sky-500 transition">
                    💬
                  </button>

                </Link>

                <button className="hover:text-green-500 transition">
                  🔁
                </button>

                <button
                  onClick={() => like(p)}
                  className={
                    p.likedBy?.includes(user.uid)
                      ? "text-pink-500"
                      : "hover:text-pink-500 transition"
                  }
                >
                  ❤️ {p.likes}
                </button>

                <button
                  onClick={() =>
                    bookmark(p.id)
                  }
                  className="hover:text-yellow-500 transition"
                >
                  🔖
                </button>

              </div>

            </div>

          </div>

        </div>

      ))}

    </div>
  );
}