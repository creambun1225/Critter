"use client";

import { useEffect, useState } from "react";

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

  const [uid, setUid] =
    useState("");

  const [name, setName] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [icon, setIcon] =
    useState("");

  // 読み込み
  useEffect(() => {

    return onAuthStateChanged(
      auth,
      async (user) => {

        if (!user) {

          location.href =
            "/login";

          return;

        }

        setUid(user.uid);

        const ref =
          doc(
            db,
            "users",
            user.uid
          );

        const snap =
          await getDoc(ref);

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

      if (!uid) return;

      await updateDoc(
        doc(
          db,
          "users",
          uid
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
        `/user/${uid}`;

    };

  // 画像アップロード
  const uploadImage =
    (
      e:any
    ) => {

      const file =
        e.target.files?.[0];

      if (!file) return;

      const reader =
        new FileReader();

      reader.onload =
        () => {

          setIcon(
            reader.result as string
          );

        };

      reader.readAsDataURL(
        file
      );

    };

  return (

    <div className="bg-black min-h-screen text-white">

      {/* 上 */}
      <div className="border-b border-zinc-800 p-4 text-2xl font-bold">

        プロフィール編集

      </div>

      <div className="p-6 max-w-2xl mx-auto">

        {/* アイコン */}
        <div className="mb-6">

          <div className="w-28 h-28 rounded-full overflow-hidden bg-zinc-800 mb-4">

            {icon ? (

              <img
                src={icon}
                className="w-full h-full object-cover"
              />

            ) : null}

          </div>

          <input
            type="file"
            accept="image/*"
            onChange={uploadImage}
            className="text-sm"
          />

        </div>

        {/* 名前 */}
        <div className="mb-5">

          <div className="mb-2 text-zinc-400">
            名前
          </div>

          <input
            value={name}
            onChange={(e)=>
              setName(
                e.target.value
              )
            }
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white"
          />

        </div>

        {/* username */}
        <div className="mb-5">

          <div className="mb-2 text-zinc-400">
            @ユーザー名
          </div>

          <input
            value={username}
            onChange={(e)=>
              setUsername(
                e.target.value
              )
            }
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white"
          />

        </div>

        {/* bio */}
        <div className="mb-6">

          <div className="mb-2 text-zinc-400">
            自己紹介
          </div>

          <textarea
            value={bio}
            onChange={(e)=>
              setBio(
                e.target.value
              )
            }
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white min-h-[120px]"
          />

        </div>

        {/* 保存 */}
        <button
          onClick={saveProfile}
          className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-full font-bold"
        >
          保存
        </button>

      </div>

    </div>

  );

}