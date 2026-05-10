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
  updateDoc
} from "firebase/firestore";

import {
  onAuthStateChanged
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

        {/* 詳細 */}
        {me?.uid !== profile.uid &&
          profile.admin && (

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
                <button
                  onClick={async () => {

                    const ref =
                      doc(
                        db,
                        "users",
                        profile.uid
                      );

                    if (
                      profile.verified
                    ) {

                      await updateDoc(
                        ref,
                        {
                          verified:
                            false
                        }
                      );

                    } else {

                      await updateDoc(
                        ref,
                        {
                          verified:
                            true
                        }
                      );

                    }

                    location.reload();

                  }}
                  className="w-full text-left px-4 py-3 hover:bg-zinc-800"
                >

                  {profile.verified
                    ? "認証マークを削除"
                    : "認証マークを付ける"}

                </button>

              </div>

            )}

          </div>

        )}

      </div>

      {/* プロフィール */}
      <div className="pt-20 px-6">

        <div className="flex items-center gap-2 flex-wrap">

          <h1 className="text-5xl font-bold">
            {profile.name}
          </h1>

          {/* 青認証 */}
          {profile.verified && (

            <img
              src="/verified-blue.png"
              className="w-8 h-8"
            />

          )}

          {/* 金認証 */}
          {profile.admin && (

            <img
              src="/verified-gold.png"
              className="w-8 h-8"
            />

          )}

        </div>

        <p className="text-zinc-400 text-2xl mt-2">
          @{profile.username}
        </p>

        <p className="mt-6 text-xl whitespace-pre-wrap">
          {profile.bio}
        </p>

      </div>

    </div>

  );

}