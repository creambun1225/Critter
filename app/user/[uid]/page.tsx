"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import Link from "next/link";

import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";

import {
  db,
  auth
} from "@/lib/firebase";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";

import {
  onAuthStateChanged,
  deleteUser
} from "firebase/auth";

export default function UserProfile() {

  const params =
    useParams();

  const uid =
    params.uid as string;

  const [profile, setProfile] =
    useState<any>(null);

  const [me, setMe] =
    useState<any>(null);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [posts, setPosts] =
    useState<any[]>([]);

  // ユーザー取得
  useEffect(() => {

    const unsub =
      onAuthStateChanged(
        auth,
        async (u) => {

          if (!u) {

            location.href =
              "/login";

            return;

          }

          setMe(u);

          const snap =
            await getDoc(
              doc(
                db,
                "users",
                uid
              )
            );

          if (snap.exists()) {

            setProfile({
              uid,
              ...snap.data()
            });

          }

        }
      );

    return () => unsub();

  }, [uid]);

  // 投稿取得
  useEffect(() => {

    const q =
      query(
        collection(db, "posts"),
        where("uid", "==", uid)
      );

    const unsub =
      onSnapshot(
        q,
        (snap) => {

          setPosts(

            snap.docs.map((d) => ({
              id: d.id,
              ...d.data()
            }))

          );

        }
      );

    return () => unsub();

  }, [uid]);

  // アカウント削除
  const deleteAccount =
    async () => {

      const ok =
        confirm(
          "本当にアカウント削除しますか？"
        );

      if (!ok) return;

      try {

        if (auth.currentUser) {

          await deleteUser(
            auth.currentUser
          );

          alert(
            "削除しました"
          );

          location.href =
            "/login";

        }

      } catch {

        alert(
          "再ログインしてください"
        );

      }

    };

  if (!profile)
    return null;

  return (

    <Layout currentUser={me}>

      {/* ヘッダー */}
      <div className="relative border-b border-zinc-800">

        {/* バナー */}
        <div className="h-52 bg-zinc-700" />

        {/* アイコン */}
        <div className="absolute -bottom-16 left-6">

          <img
            src={
              profile.icon ||
              "/default.png"
            }
            className="w-32 h-32 rounded-full border-4 border-black object-cover bg-zinc-700"
          />

        </div>

        {/* 詳細 */}
        {me?.uid !== uid &&
          me?.uid && (

          <div className="absolute top-4 right-4">

            <button
              onClick={() =>
                setMenuOpen(
                  !menuOpen
                )
              }
              className="text-3xl px-3 py-1 rounded-full hover:bg-zinc-800"
            >

              ⋯

            </button>

            {menuOpen && (

              <div className="absolute right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden w-64 z-50">

                {/* 認証 */}
                {profile.admin && (

                  <button
                    onClick={async () => {

                      const ref =
                        doc(
                          db,
                          "users",
                          profile.uid
                        );

                      await updateDoc(
                        ref,
                        {
                          verified:
                            !profile.verified
                        }
                      );

                      location.reload();

                    }}
                    className="w-full text-left px-4 py-3 hover:bg-zinc-800"
                  >

                    {profile.verified
                      ? "認証マークを削除"
                      : "認証マークを付ける"}

                  </button>

                )}

              </div>

            )}

          </div>

        )}

      </div>

      {/* プロフィール */}
      <div className="pt-20 px-6 border-b border-zinc-800 pb-6">

        <div className="flex items-center gap-2 flex-wrap">

          <h1 className="text-3xl font-bold">

            {profile.name}

          </h1>

          {/* 青認証 */}
          {profile.verified && (

            <img
              src="/verified-blue.png"
              className="w-6 h-6"
            />

          )}

          {/* 金認証 */}
          {profile.admin && (

            <img
              src="/verified-gold.png"
              className="w-6 h-6"
            />

          )}

        </div>

        <p className="text-zinc-400 text-lg mt-1">

          @{profile.username}

        </p>

        <p className="mt-4 whitespace-pre-wrap">

          {profile.bio}

        </p>

        {/* 自分 */}
        {me?.uid === uid && (

          <div className="mt-6 flex gap-3">

            <Link
              href="/profile/edit"
              className="px-4 py-2 rounded-full border border-zinc-700 hover:bg-zinc-900"
            >

              プロフィール編集

            </Link>

            <button
              onClick={deleteAccount}
              className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700"
            >

              アカウント削除

            </button>

          </div>

        )}

      </div>

      {/* 投稿 */}
      <div>

        {posts.map((p:any) => (

          <PostCard
            key={p.id}
            post={p}
            currentUser={me}
          />

        ))}

      </div>

    </Layout>

  );

}