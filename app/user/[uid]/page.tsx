"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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

  const params = useParams();

  const uid = params.uid as string;

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

    const q = query(
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

      } catch (e:any) {

        alert(
          "再ログインしてください"
        );

      }

    };

  if (!profile)
    return null;

  return (

    <div className="bg-black min-h-screen text-white">

      {/* ヘッダー */}
      <div className="relative">

        <div className="h-40 bg-zinc-700" />

        {/* アイコン */}
        <div className="absolute -bottom-16 left-6">

          <div className="w-32 h-32 rounded-full border-4 border-black overflow-hidden bg-zinc-700">

            {profile.icon ? (

              <img
                src={profile.icon}
                className="w-full h-full object-cover"
              />

            ) : (

              <div className="w-full h-full bg-zinc-700" />

            )}

          </div>

        </div>

        {/* 詳細ボタン */}
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
      <div className="pt-20 px-6">

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

        {/* 自分の時 */}
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
      <div className="mt-10 border-t border-zinc-800">

        {posts.map((p:any) => (

          <div
            key={p.id}
            className="border-b border-zinc-800 p-4"
          >

            <div className="flex gap-3">

              {/* アイコン */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">

                {p.icon ? (

                  <img
                    src={p.icon}
                    className="w-full h-full object-cover"
                  />

                ) : (

                  <div className="w-full h-full bg-zinc-700" />

                )}

              </div>

              <div>

                <div className="flex items-center gap-2 flex-wrap">

                  <span className="font-bold">
                    {p.name}
                  </span>

                  {p.verified && (

                    <img
                      src="/verified-blue.png"
                      className="w-5 h-5"
                    />

                  )}

                  {p.admin && (

                    <img
                      src="/verified-gold.png"
                      className="w-5 h-5"
                    />

                  )}

                  <span className="text-zinc-500">
                    @{p.username}
                  </span>

                </div>

                <p className="mt-2 whitespace-pre-wrap">
                  {p.text}
                </p>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}