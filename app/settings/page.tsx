"use client";

import { useState } from "react";

import {
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";

import {
  auth,
  db
} from "@/lib/firebase";

import {
  doc,
  setDoc
} from "firebase/firestore";

export default function RegisterPage() {

  const [name, setName] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const register =
    async () => {

      if (
        !name ||
        !username ||
        !email ||
        !password
      ) {

        alert(
          "全部入力してください"
        );

        return;

      }

      try {

        const result =
          await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );

        const user =
          result.user;

        // authの名前
        await updateProfile(
          user,
          {
            displayName: name
          }
        );

        // firestore保存
        await setDoc(
          doc(
            db,
            "users",
            user.uid
          ),
          {
            uid:
              user.uid,

            name,

            username,

            email,

            bio: "",

            icon: "",

            // 青認証
            verified: false,

            // 金認証
            admin: false,

            createdAt:
              Date.now()
          }
        );

        alert(
          "登録成功"
        );

        location.href =
          "/";

      } catch (e:any) {

        alert(
          e.message
        );

      }

    };

  return (

    <div className="bg-black min-h-screen flex items-center justify-center text-white">

      <div className="w-full max-w-md bg-zinc-900 rounded-3xl p-8">

        <h1 className="text-4xl font-bold mb-8 text-center">

          新規登録

        </h1>

        <input
          type="text"
          placeholder="名前"
          value={name}
          onChange={(e)=>
            setName(
              e.target.value
            )
          }
          className="w-full bg-black border border-zinc-700 rounded-xl p-4 mb-4 outline-none"
        />

        <input
          type="text"
          placeholder="@ユーザー名"
          value={username}
          onChange={(e)=>
            setUsername(
              e.target.value
            )
          }
          className="w-full bg-black border border-zinc-700 rounded-xl p-4 mb-4 outline-none"
        />

        <input
          type="email"
          placeholder="メール"
          value={email}
          onChange={(e)=>
            setEmail(
              e.target.value
            )
          }
          className="w-full bg-black border border-zinc-700 rounded-xl p-4 mb-4 outline-none"
        />

        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e)=>
            setPassword(
              e.target.value
            )
          }
          className="w-full bg-black border border-zinc-700 rounded-xl p-4 mb-6 outline-none"
        />

        <button
          onClick={register}
          className="w-full bg-blue-500 hover:bg-blue-600 transition rounded-xl py-4 text-xl font-bold"
        >

          登録

        </button>

      </div>

    </div>

  );

}