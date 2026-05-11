"use client";

import { useEffect, useState } from "react";

import Layout from "@/components/Layout";

import {
  auth,
  db
} from "@/lib/firebase";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";

export default function EditProfilePage() {

  const [currentUser, setCurrentUser] =
    useState<any>(null);

  const [name, setName] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [icon, setIcon] =
    useState("");

  // ユーザー取得
  useEffect(() => {

    return onAuthStateChanged(
      auth,
      async (user) => {

        if (!user) {

          location.href =
            "/login";

          return;

        }

        setCurrentUser(user);

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

          setName(
            data.name || ""
          );

          setUsername(
            data.username || ""
          );

          setBio(
            data.bio || ""
          );

          setIcon(
            data.icon || ""
          );

        }

      }
    );

  }, []);

  // 保存
  const saveProfile =
    async () => {

      if (!currentUser) return;

      await updateDoc(
        doc(
          db,
          "users",
          currentUser.uid
        ),
        {
          name,
          username,
          bio,
          icon
        }
      );

      alert(
        "保存しました"
      );

      location.href =
        `/user/${currentUser.uid}`;

    };

  return (

    <Layout currentUser={currentUser}>

      {/* タイトル */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-zinc-800 p-4">

        <div className="text-4xl font-bold">

          プロフィール編集

        </div>

      </div>

      {/* 内容 */}
      <div className="p-6">

        {/* アイコン */}
        <div className="mb-6">

          <div className="text-zinc-400 mb-2">

            アイコンURL

          </div>

          <input
            value={icon}
            onChange={(e)=>
              setIcon(
                e.target.value
              )
            }
            placeholder="https://..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4 outline-none"
          />

        </div>

        {/* プレビュー */}
        <div className="mb-8 flex justify-center">

          <img
            src={
              icon ||
              "/default.png"
            }
            className="w-32 h-32 rounded-full object-cover bg-zinc-700"
          />

        </div>

        {/* 名前 */}
        <div className="mb-6">

          <div className="text-zinc-400 mb-2">

            名前

          </div>

          <input
            value={name}
            onChange={(e)=>
              setName(
                e.target.value
              )
            }
            placeholder="名前"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4 outline-none"
          />

        </div>

        {/* username */}
        <div className="mb-6">

          <div className="text-zinc-400 mb-2">

            ユーザー名

          </div>

          <input
            value={username}
            onChange={(e)=>
              setUsername(
                e.target.value
              )
            }
            placeholder="username"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4 outline-none"
          />

        </div>

        {/* bio */}
        <div className="mb-6">

          <div className="text-zinc-400 mb-2">

            自己紹介

          </div>

          <textarea
            value={bio}
            onChange={(e)=>
              setBio(
                e.target.value
              )
            }
            placeholder="自己紹介"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4 outline-none resize-none min-h-[140px]"
          />

        </div>

        {/* 保存 */}
        <button
          onClick={saveProfile}
          className="w-full bg-blue-500 hover:bg-blue-600 transition rounded-full py-4 text-xl font-bold"
        >

          保存

        </button>

      </div>

    </Layout>

  );

}