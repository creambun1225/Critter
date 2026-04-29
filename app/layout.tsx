"use client";

import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-[#f5f8fa] text-black">

        <main className="flex justify-center">

          {/* 左 */}
          <div className="hidden md:flex w-[250px] fixed left-0 top-0 h-screen p-6 border-r bg-white flex-col justify-between">

            <div>
              <h1 className="text-3xl font-bold text-blue-500 mb-10">Critter</h1>

              <div className="flex flex-col gap-8 text-xl">
                <Link href="/">🏠 ホーム</Link>
                <Link href="/notifications">🔔 通知</Link>
                <Link href="/profile">👤 プロフィール</Link>
                <Link href="/bookmarks">🔖 ブックマーク</Link>
                <Link href="/settings">⚙️ 設定</Link>
              </div>
            </div>

          </div>

          {/* 真ん中 */}
          <div className="w-full md:w-[600px] md:ml-[250px] md:mr-[250px] min-h-screen bg-white">
            {children}
          </div>

          {/* 右 */}
          <div className="hidden md:block w-[250px] fixed right-0 top-0 h-screen p-4">
            <div className="bg-white p-4 rounded-xl">
              <h2 className="font-bold mb-2">🔥 トレンド</h2>
              <p>AI</p>
              <p>ゲーム</p>
              <p>マイクラ</p>
            </div>
          </div>

        </main>

      </body>
    </html>
  );
}