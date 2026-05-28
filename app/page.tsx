"use client";

import { useEffect, useState } from "react";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  db,
  auth,
  storage
} from "@/lib/firebase";

import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";

export default function Home() {

  const [text, setText] =
    useState("");

  const [image, setImage] =
    useState<any>(null);

  const [posts, setPosts] =
    useState<any[]>([]);

  const [currentUser, setCurrentUser] =
    useState<any>(null);

  const [userData, setUserData] =
    useState<any>(null);

  // ログイン確認
  useEffect(() => {

    const unsub =
      onAuthStateChanged(
        auth,

        async (user) => {

          if (!user) {

            location.href =
              "/login";

            return;

          }

          try {

            const snap =
              await getDoc(
                doc(
                  db,
                  "users",
                  user.uid
                )
              );

            if (snap.exists()) {

              const data =
                snap.data();

              setCurrentUser({

                uid:
                  user.uid,

                email:
                  user.email,

                photoURL:
                  user.photoURL,

                displayName:
                  user.displayName,

                ...data

              });

              setUserData(data);

            }

          } catch (err) {

            console.error(err);

          }

        }

      );

    return () => unsub();

  }, []);

  // 投稿取得
  useEffect(() => {

    if (!db) return;

    try {

      const q = query(

        collection(
          db,
          "posts"
        ),

        orderBy(
          "createdAt",
          "desc"
        )

      );

      const unsub =
        onSnapshot(
          q,
          (snap) => {

            setPosts(

              snap.docs.map(
                (doc:any) => ({

                  id: doc.id,

                  ...doc.data()

                })
              )

            );

          }
        );

      return () => unsub();

    } catch (err) {

      console.error(err);

    }

  }, []);

  // 投稿
  const createPost =
    async () => {

      if (
        !currentUser ||
        !userData
      ) return;

      if (
        !text.trim() &&
        !image
      ) return;

      let imageUrl = "";

      try {

        // 画像アップロード
        if (image) {

          const imageRef =
            ref(
              storage,
              `posts/${Date.now()}_${image.name}`
            );

          await uploadBytes(
            imageRef,
            image
          );

          imageUrl =
            await getDownloadURL(
              imageRef
            );

        }

        // ハッシュタグ抽出
        const hashtags =
          text.match(
            /#\w+/g
          ) || [];

        // 投稿保存
        await addDoc(

          collection(
            db,
            "posts"
          ),

          {

            text,

            image:
              imageUrl,

            hashtags,

            uid:
              currentUser.uid,

            name:
              userData?.name ||
              "ユーザー",

            username:
              userData?.username ||
              "user",

            icon:
              userData?.icon ||
              "",

            verified:
              currentUser?.verified ||
              false,

            admin:
              currentUser?.admin ||
              false,

            replies:
              0,

            reposts:
              0,

            likes:
              0,

            bookmarks:
              0,

            likedUsers: [],

            repostedUsers: [],

            bookmarkedUsers: [],

            createdAt:
              Date.now()

          }

        );

        setText("");
        setImage(null);

      } catch (err) {

        console.error(err);

        alert(
          "投稿に失敗しました"
        );

      }

    };

  // ローディング
  if (!currentUser) {

    return (

      <div className="bg-black min-h-screen" />

    );

  }

  return (

    <Layout currentUser={currentUser}>

{/* 上ヘッダー */}
<div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-zinc-800">

  {/* タイトル */}
  <div className="p-4">

    <div className="text-3xl md:text-4xl font-bold">

      ホーム

    </div>

  </div>

  {/* タブ */}
  <div className="flex">

    <button
      className="
        flex-1
        py-4
        font-bold
        border-b-2
        border-white
        text-white
        hover:bg-zinc-900
        transition
      "
    >

      おすすめ

    </button>

    <button
      className="
        flex-1
        py-4
        font-bold
        border-b-2
        border-transparent
        text-zinc-500
        hover:bg-zinc-900
        hover:text-white
        transition
      "
    >

      フォロー中

    </button>

    <button
      className="
        flex-1
        py-4
        font-bold
        border-b-2
        border-transparent
        text-zinc-500
        hover:bg-zinc-900
        hover:text-white
        transition
      "
    >

      新着

    </button>

  </div>

</div>

      {/* 投稿フォーム */}
      <div className="border-b border-zinc-800 p-4 flex gap-4">

        {/* アイコン */}
        <img
          src={
            userData?.icon ||
            "/default.png"
          }
          className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover bg-zinc-700 flex-shrink-0"
        />

        <div className="flex-1">

          {/* テキスト */}
          <textarea
            value={text}
            onChange={(e)=>
              setText(
                e.target.value
              )
            }
            placeholder="いまどうしてる？"
            className="w-full bg-black outline-none resize-none text-lg md:text-xl min-h-[120px]"
          />

          {/* 画像 */}
          <input
            type="file"
            accept="image/*"
            onChange={(e)=>
              setImage(
                e.target.files?.[0]
              )
            }
            className="mt-4"
          />

          {/* プレビュー */}
          {image && (

            <img
              src={
                URL.createObjectURL(
                  image
                )
              }
              className="mt-4 rounded-2xl max-h-[350px] object-cover"
            />

          )}

          {/* ボタン */}
          <div className="flex justify-end mt-4">

            <button
              onClick={createPost}
              className="bg-blue-500 hover:bg-blue-600 transition px-6 md:px-8 py-3 rounded-full text-lg font-bold"
            >

              クリート

            </button>

          </div>

        </div>

      </div>

      {/* 投稿一覧 */}
      <div>

        {posts.map((post:any)=>(

          <PostCard
            key={post.id}
            post={post}
            currentUser={
              currentUser || null
            }
          />

        ))}

      </div>

    </Layout>

  );

}