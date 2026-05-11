"use client";

import Link from "next/link";

export default function Layout({
  children,
  currentUser
}: {
  children: React.ReactNode;
  currentUser?: any;
}) {

  return (

    <div className="bg-black text-white min-h-screen flex justify-center">

      <div className="w-full max-w-7xl flex">

        {/* 左メニュー */}
        <div className="w-[260px] h-screen sticky top-0 border-r border-gray-800 p-4 flex flex-col">

          {/* ロゴ */}
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black text-3xl font-bold mb-8">

            C

          </div>

          {/* メニュー */}
          <nav className="flex flex-col gap-6 text-2xl font-bold">

            <Link href="/">
              🏠 ホーム
            </Link>

            <Link href="/search">
              🔎 検索
            </Link>

            <Link href="/notifications">
              🔔 通知
            </Link>

            <Link
              href={`/user/${currentUser?.uid}`}
            >
              👤 プロフィール
            </Link>

            <Link href="/bookmarks">
              🔖 ブックマーク
            </Link>

            <Link href="/settings">
              ⚙️ 設定
            </Link>

          </nav>

          {/* クリート */}
          <button className="mt-auto bg-blue-500 hover:bg-blue-600 transition rounded-full py-3 text-xl font-bold">

            クリート

          </button>

          {/* バージョン */}
          <div className="text-gray-500 text-sm mt-4">

            Critter v1.0.2

          </div>

        </div>

        {/* 真ん中 */}
        <div className="flex-1 border-r border-l border-gray-800 min-h-screen">

          {children}

        </div>

        {/* 右 */}
        <div className="w-[350px] p-4">

          <div className="bg-zinc-900 rounded-3xl p-6 sticky top-4">

            <h2 className="text-4xl font-bold mb-6">

              トレンド

            </h2>

            <div className="mb-5">

              <div className="text-gray-500 text-sm">

                トレンド

              </div>

              <div className="font-bold text-3xl">

                #AI

              </div>

            </div>

            <div>

              <div className="text-gray-500 text-sm">

                ゲーム

              </div>

              <div className="font-bold text-3xl">

                #Minecraft

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}