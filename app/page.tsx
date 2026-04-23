"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, auth } from "../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  runTransaction,
  deleteDoc,
  arrayUnion
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

/* 型 */
type Post = {
  id: string;
  uid: string;
  username: string;
  text: string;
  image?: string;
  createdAt: number;
  likes: number;
  reposts: number;
  replies: number;
  views: number;
};

export default function Home(){

  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);

  const [text,setText]=useState("");
  const [image,setImage]=useState("");
  const [posts,setPosts]=useState<Post[]>([]);
  const [open,setOpen]=useState(false);
  const [trends,setTrends]=useState<any[]>([]);

  // ログイン
  useEffect(()=>{
    return onAuthStateChanged(auth,(u)=>{
      if(!u) window.location.href="/login";
      else setUser(u);
    });
  },[]);

  // ユーザー情報
  useEffect(()=>{
    if(!user) return;

    getDoc(doc(db,"users",user.uid)).then(async d=>{
      if(!d.exists()){
        await updateDoc(doc(db,"users",user.uid),{
          username:"user",
          followers:[],
          following:[]
        });
      }
      setUserData(d.data());
    });
  },[user]);

  // 投稿取得
  useEffect(()=>{
    if(!userData) return;

    const q=query(collection(db,"posts"),orderBy("createdAt","desc"));

    const unsub=onSnapshot(q,(snap)=>{

      let list:Post[] = snap.docs.map((d:any)=>{
        const data = d.data() as any;

        return {
          id: d.id || "",
          uid: data.uid || "",
          username: data.username || "unknown",
          text: data.text || "",
          image: data.image || "",
          createdAt: data.createdAt || 0,
          likes: data.likes || 0,
          reposts: data.reposts || 0,
          replies: data.replies || 0,
          views: data.views || 0
        };
      });

      // フォローTL
      list = list.filter(p =>
        userData.following?.includes(p.uid) || p.uid === user.uid
      );

      setPosts(list);

      // トレンド
      const texts = list.slice(0,100).map(p=>p.text);
      const words:any = {};

      texts.forEach(t=>{
        t.split(/\s+/).forEach((w:string)=>{
          if(!w || w.length<=1) return;
          words[w]=(words[w]||0)+1;
        });
      });

      const sorted = Object.entries(words)
        .sort((a:any,b:any)=>b[1]-a[1])
        .slice(0,5);

      setTrends(sorted);
    });

    return ()=>unsub();
  },[userData]);

  // 投稿
  const post=async()=>{
    if(!text) return;

    await addDoc(collection(db,"posts"),{
      text,
      image,
      uid:user.uid,
      username:userData?.username || "unknown",
      createdAt:Date.now(),
      likes:0,
      reposts:0,
      replies:0,
      views:0
    });

    setText("");
    setImage("");
  };

  // いいね
  const like=async(p:Post)=>{
    const ref=doc(db,"posts",p.id);
    await runTransaction(db,async(tx)=>{
      const snap=await tx.get(ref);
      const current=snap.data()?.likes||0;
      tx.update(ref,{likes:current+1});
    });
  };

  // リポスト
  const repost=async(p:Post)=>{
    const ref=doc(db,"posts",p.id);
    await runTransaction(db,async(tx)=>{
      const snap=await tx.get(ref);
      const current=snap.data()?.reposts||0;
      tx.update(ref,{reposts:current+1});
    });
  };

  // フォロー
  const follow=async(targetId:string)=>{
    await updateDoc(doc(db,"users",user.uid),{
      following:arrayUnion(targetId)
    });

    await updateDoc(doc(db,"users",targetId),{
      followers:arrayUnion(user.uid)
    });
  };

  // 削除
  const remove=async(id:string)=>{
    if(confirm("削除する？")){
      await deleteDoc(doc(db,"posts",id));
    }
  };

  if(!user) return <div>loading...</div>;

  return (
    <main className="flex justify-center bg-[#f5f8fa] h-screen">

      {/* 左 */}
      <div className="w-[250px] fixed left-0 top-0 h-screen flex flex-col justify-between p-6 border-r bg-white">

        <div>
          <h1 className="text-3xl font-bold text-blue-500 mb-10">Critter</h1>

          <div className="flex flex-col gap-8 text-xl">
            <Link href="/">🏠 ホーム</Link>
            <Link href="/notifications">🔔 通知</Link>
            <Link href="/profile">👤 プロフィール</Link>
            <Link href="/bookmarks">🔖 ブックマーク</Link>
            <Link href="/settings">⚙️ 設定</Link>
          </div>
        </div>

        <button
          onClick={()=>setOpen(true)}
          className="bg-blue-500 text-white py-3 rounded-full text-lg"
        >
          ＋クリート
        </button>
      </div>

      {/* 真ん中 */}
      <div className="w-[600px] ml-[250px] mr-[250px] overflow-y-scroll h-screen bg-white">

        {posts.map((p)=>(
          <div key={p.id} className="border-b p-4 relative">

            {p.uid===user.uid && (
              <button onClick={()=>remove(p.id)} className="absolute right-2 top-2">
                ⋮
              </button>
            )}

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <p className="font-bold">{p.username}</p>

              {p.uid!==user.uid && (
                <button
                  onClick={()=>follow(p.uid)}
                  className="ml-2 text-blue-500"
                >
                  フォロー
                </button>
              )}
            </div>

            <p className="mt-2">{p.text}</p>

            {p.image && (
              <img src={p.image} className="mt-2 rounded-xl" />
            )}

            <div className="flex gap-6 mt-3 text-gray-500">
              <span>💬 {p.replies}</span>
              <button onClick={()=>repost(p)}>🔁 {p.reposts}</button>
              <button onClick={()=>like(p)}>❤️ {p.likes}</button>
              <span>👀 {p.views}</span>
            </div>

          </div>
        ))}

      </div>

      {/* 右 */}
      <div className="w-[250px] fixed right-0 top-0 h-screen p-4">
        <div className="bg-white p-4 rounded-xl">
          <h2 className="font-bold mb-3">🔥 トレンド</h2>
          {trends.map((t:any,i)=>(
            <p key={i}>{t[0]}（{t[1]}件）</p>
          ))}
        </div>
      </div>

      {/* モーダル */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex justify-center items-start pt-20 z-50">
          <div className="bg-white w-[500px] rounded-xl p-4">

            <div className="flex items-center gap-3 mb-4">
              <button onClick={()=>setOpen(false)}>✖</button>
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
            </div>

            <textarea
              className="w-full text-xl outline-none"
              placeholder="いまどうしてる？"
              value={text}
              onChange={(e)=>setText(e.target.value)}
            />

            <input
              type="text"
              placeholder="画像URL"
              className="w-full border p-2 mt-2"
              value={image}
              onChange={(e)=>setImage(e.target.value)}
            />

            <div className="flex justify-end mt-4">
              <button
                onClick={()=>{post();setOpen(false);}}
                className="bg-blue-500 text-white px-4 py-2 rounded-full"
              >
                ポストする
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}