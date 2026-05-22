"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";

import {
  auth,
  db
} from "@/lib/firebase";

import {
  signOut,
  deleteUser,
  onAuthStateChanged,
  updatePassword
} from "firebase/auth";

import {
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";

export default function SettingsPage() {

  const [currentUser, setCurrentUser] =
    useState<any>(null);

  const [userData, setUserData] =
    useState<any>(null);

  const [newPassword, setNewPassword] =
    useState("");

  const [adminPassword, setAdminPassword] =
    useState("");

  useEffect(() => {

    const unsub =
      onAuthStateChanged(
        auth,
        async (user) => {

          if (!user) {
            location.href = "/login";
            return;
          }

          setCurrentUser(user);

          const snap = await getDoc(
            doc(db,"users",user.uid)
          );

          if (snap.exists()) {
            setUserData(snap.data());
          }

        }
      );

    return () => unsub();

  }, []);

  const logout = async () => {
    await signOut(auth);
    location.href="/login";
  };

  const changePassword = async () => {

    if(!newPassword)return;

    try{

      if(auth.currentUser){

        await updatePassword(
          auth.currentUser,
          newPassword
        );

        alert("変更しました");
        setNewPassword("");

      }

    }catch{

      alert("再ログインしてください");

    }

  };

  const becomeAdmin=async()=>{

    if(adminPassword!=="annpannmann"){
      alert("パスワードが違います");
      return;
    }

    await updateDoc(
      doc(db,"users",currentUser.uid),
      {
        admin:true,
        verified:true
      }
    );

    alert("管理者になりました");
    location.reload();

  };

  const removeAccount=async()=>{

    const ok=confirm(
      "本当に削除しますか？"
    );

    if(!ok)return;

    await deleteUser(
      auth.currentUser!
    );

  };

  if(!currentUser)return null;

  return(

    <Layout currentUser={{...currentUser,...userData}}>

      <div className="p-6 text-white">

        <h1 className="text-4xl font-bold mb-8">
          設定
        </h1>

        <div className="bg-zinc-900 rounded-2xl p-5 mb-6">

          <div className="text-xl font-bold mb-4">
            アカウント情報
          </div>

          <div>
            名前: {userData?.name}
          </div>

          <div className="text-zinc-500 mt-2">
            @{userData?.username}
          </div>

        </div>

        <div className="bg-zinc-900 rounded-2xl p-5 mb-6">

          <div className="text-xl font-bold mb-4">
            パスワード変更
          </div>

          <input
          type="password"
          value={newPassword}
          onChange={(e)=>setNewPassword(e.target.value)}
          placeholder="新しいパスワード"
          className="w-full bg-black border border-zinc-700 rounded-xl p-3 mb-4"
          />

          <button
          onClick={changePassword}
          className="bg-blue-500 px-5 py-3 rounded-xl"
          >
            変更する
          </button>

        </div>

        <div className="bg-zinc-900 rounded-2xl p-5 mb-6">

          <div className="text-xl font-bold mb-4">
            管理者権限付与
          </div>

          <input
          type="password"
          value={adminPassword}
          onChange={(e)=>setAdminPassword(e.target.value)}
          placeholder="管理者パスワード"
          className="w-full bg-black border border-zinc-700 rounded-xl p-3 mb-4"
          />

          <button
          onClick={becomeAdmin}
          className="bg-yellow-500 text-black px-5 py-3 rounded-xl"
          >
            管理者になる
          </button>

        </div>

        <button
        onClick={logout}
        className="w-full bg-zinc-800 rounded-xl p-4 mb-4"
        >
          ログアウト
        </button>

        <button
        onClick={removeAccount}
        className="w-full bg-red-600 rounded-xl p-4 mb-4"
        >
          アカウント削除
        </button>

        <Link
        href="/terms"
        className="w-full block bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-left mb-4"
        >
          利用規約
        </Link>

        {/* プライバシーポリシー（利用規約の下に追加） */}
        <Link
        href="/privacy"
        className="w-full block bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-left"
        >
          プライバシーポリシー
        </Link>

      </div>

    </Layout>

  )
}