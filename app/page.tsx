"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const [text, setText] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>({});
  const [likes, setLikes] = useState<any>({});

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) window.location.href = "/login";
      else {
        setUser(u);
        const d = await getDoc(doc(db, "users", u.uid));
        setUserData(d.data());
      }
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // 👍いいね
  const toggleLike = async (postId: string) => {
    const ref = doc(db, "likes", user.uid + "_" + postId);
    if (likes[postId]) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, { uid: user.uid, postId });
    }
  };

  // 👍いいね取得
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "likes"), (snap) => {
      const data:any = {};
      snap.docs.forEach(d=>{
        const v = d.data();
        if(v.uid===user?.uid) data[v.postId]=true;
      });
      setLikes(data);
    });
    return () => unsub();
  }, [user]);

  const handlePost = async () => {
    if (!text) return;

    await addDoc(collection(db, "posts"), {
      text,
      createdAt: Date.now(),
      uid: user.uid,
      username: userData.username,
    });

    setText("");
  };

  if (!user) return null;

  return (
    <main className="flex justify-center bg-gray-100 min-h-screen">

      {/* 左 */}
      <div className="w-[250px] p-4">
        <h1 className="text-2xl font-bold mb-6">Karotter</h1>
        <Link href="/">🏠 ホーム</Link><br/>
        <Link href="/profile">👤 プロフィール</Link>
      </div>

      {/* 中央 */}
      <div className="w-[600px] bg-white border-x">

        <div className="p-4 border-b">
          <textarea
            className="w-full p-2 border"
            value={text}
            onChange={(e)=>setText(e.target.value)}
          />
          <button onClick={handlePost} className="bg-blue-500 text-white px-3 py-1 mt-2">
            投稿
          </button>
        </div>

        {posts.map(p => (
          <div key={p.id} className="p-4 border-b">

            <Link href={`/user/${p.uid}`}>
              <p className="font-bold cursor-pointer">{p.username}</p>
            </Link>

            <p>{p.text}</p>

            <div className="flex gap-4 mt-2">

              {/* 👍 */}
              <button onClick={()=>toggleLike(p.id)}>
                {likes[p.id] ? "❤️" : "🤍"}
              </button>

              {/* 💬返信 */}
              <Link href={`/post/${p.id}`}>💬</Link>

            </div>
          </div>
        ))}

      </div>

      {/* 右 */}
      <div className="w-[250px] p-4">
        <h2>トレンド</h2>
      </div>

    </main>
  );
}