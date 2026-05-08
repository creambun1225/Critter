"use client";

import "./globals.css";

import Link from "next/link";

import {
  useEffect,
  useState
} from "react";

import {
  auth
} from "../lib/firebase";

import {
  onAuthStateChanged
} from "firebase/auth";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const [loggedIn, setLoggedIn] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    return onAuthStateChanged(auth, (user) => {

      setLoggedIn(!!user);

      setLoading(false);

    });

  }, []);

  if (loading) {

    return (
      <html lang="ja">
        <body className="bg-black text-white">
          <div className="h-screen flex items-center justify-center">
            Loading...
          </div>
        </body>
      </html>
    );

  }

  return (
    <html lang="ja">

      <body className="bg-black text-white">

        {/* ログインしてない */}
        {!loggedIn ? (

          <main className="min-h-screen">
            {children}
          </main>

        ) : (

          /* ログイン済み */
          <main className="flex justify-center">

            {/* 左 */}
            <div className="hidden md:flex w-[280px] fixed left-0 top-0 h-screen px-6 py-4 border-r border-zinc-800 bg-black flex-col">

              <h1 className="text-4xl font-bold mb-10">
                Critter
              </h1>

              <div className="flex flex-col gap-2">

                <Link
                  href="/"
                  className="text-2xl hover:bg-zinc-900 transition px-4 py-3 rounded-full font-bold"
                >
                  🏠 ホーム
                </Link>

                <Link
                  href="/notifications"
                  className="text-2xl hover:bg-zinc-900 transition px-4 py-3 rounded-full font-bold"
                >
                  🔔 通知
                </Link>

                <Link
                  href="/profile"
                  className="text-2xl hover:bg-zinc-900 transition px-4 py-3 rounded-full font-bold"
                >
                  👤 プロフィール
                </Link>

                <Link
                  href="/bookmarks"
                  className="text-2xl hover:bg-zinc-900 transition px-4 py-3 rounded-full font-bold"
                >
                  🔖 ブックマーク
                </Link>

                <Link
                  href="/settings"
                  className="text-2xl hover:bg-zinc-900 transition px-4 py-3 rounded-full font-bold"
                >
                  ⚙️ 設定
                </Link>

              </div>

              {/* ポスト */}
              <button className="mt-8 bg-blue-500 hover:bg-blue-600 transition py-4 rounded-full font-bold text-xl">
                ポスト
              </button>

            </div>

            {/* 真ん中 */}
            <div className="w-full md:w-[600px] md:ml-[280px] md:mr-[350px] border-x border-zinc-800 min-h-screen">

              {children}

            </div>

            {/* 右 */}
            <div className="hidden xl:block w-[350px] fixed right-0 top-0 h-screen p-4">

              <div className="bg-zinc-950 rounded-3xl p-5">

                <h2 className="text-3xl font-bold mb-4">
                  トレンド
                </h2>

                <div className="space-y-5">

                  <div>
                    <p className="text-zinc-500 text-sm">
                      トレンド
                    </p>

                    <p className="font-bold text-xl">
                      AI
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-500 text-sm">
                      ゲーム
                    </p>

                    <p className="font-bold text-xl">
                      Minecraft
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </main>

        )}

      </body>

    </html>
  );
}