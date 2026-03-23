"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import { useParams } from "next/navigation";

export default function Profile() {
  const params = useParams();
  const uid = params?.uid as string;

  const [data, setData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    // ユーザー取得
    getDoc(doc(db, "users", uid))
      .then((d) => {
        if (d.exists()) {
          setData(d.data());
        } else {
          setData({ username: "unknown" });
        }
      })
      .catch(() => {
        setData({ username: "error" });
      });

    // 投稿取得
    const q = query(collection(db, "posts"), where("uid", "==", uid));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => d.data());
      setPosts(list);
      setLoading(false);
    });

    return () => unsub();
  }, [uid]);

  // ロード失敗対策
  if (loading) {
    return (
      <div className="p-10 text-center">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">

      {/* ヘッダー */}
      <div className="h-40 bg-gray-300"></div>

      {/* アイコン */}
      <div className="w-24 h-24 bg-gray-400 rounded-full -mt-12 ml-4 border-4 border-white"></div>

      {/* 情報 */}
      <div className="p-4">
        <h1 className="text-xl font-bold">
          {data?.username || "unknown"}
        </h1>

        <p className="text-gray-500">@{data?.username}</p>

        {/* 投稿一覧 */}
        <div className="mt-6 border-t">
          {posts.length === 0 ? (
            <p className="p-4 text-gray-400">
              まだ投稿がありません
            </p>
          ) : (
            posts.map((p, i) => (
              <div key={i} className="border-b p-4">
                {p.text}
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}