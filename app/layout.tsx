import "./globals.css";

import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="ja">

      <body className="bg-black text-white">

        <main className="flex justify-center">

          {/* 左 */}
          <div className="hidden md:flex w-[280px] fixed left-0 top-0 h-screen border-r border-zinc-800 bg-black flex-col px-6 py-4">

            {/* 上 */}
            <div>

              {/* ロゴ */}
              <Link href="/">

                <div className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center text-4xl font-black mb-8">
                  C
                </div>

              </Link>

              {/* メニュー */}
              <div className="flex flex-col gap-2">

                <Link
                  href="/"
                  className="text-2xl hover:bg-zinc-900 transition px-4 py-3 rounded-full font-bold"
                >
                  🏠 ホーム
                </Link>

                <Link
                  href="/search"
                  className="text-2xl hover:bg-zinc-900 transition px-4 py-3 rounded-full font-bold"
                >
                  🔍 検索
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

              {/* クリート */}
              <Link href="/">

                <button className="mt-8 bg-blue-500 hover:bg-blue-600 transition rounded-full py-4 text-xl font-bold w-full">
                  クリート
                </button>

              </Link>

            </div>

            {/* 下 */}
            <div className="mt-auto pt-6 text-zinc-500 text-sm">

              Critter v1.0.1

            </div>

          </div>

          {/* 中央 */}
          <div className="w-full md:w-[600px] md:ml-[280px] md:mr-[350px] border-x border-zinc-800 min-h-screen">

            {children}

          </div>

          {/* 右 */}
          <div className="hidden lg:block w-[320px] fixed right-0 top-0 h-screen p-4">

            <div className="bg-zinc-900 rounded-3xl p-5">

              <h2 className="font-bold text-2xl mb-4">
                トレンド
              </h2>

              <div className="space-y-4">

                <div>

                  <p className="text-zinc-500 text-sm">
                    トレンド
                  </p>

                  <p className="font-bold">
                    #AI
                  </p>

                </div>

                <div>

                  <p className="text-zinc-500 text-sm">
                    ゲーム
                  </p>

                  <p className="font-bold">
                    #Minecraft
                  </p>

                </div>

              </div>

            </div>

          </div>

        </main>

      </body>

    </html>
  );
}