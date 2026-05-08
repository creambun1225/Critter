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

        <div className="max-w-7xl mx-auto flex min-h-screen">

          {/* 左 */}
          <aside className="hidden lg:flex w-[275px] h-screen sticky top-0 flex-col px-4 py-2">

            <h1 className="text-3xl font-bold mb-8 px-4 py-3">
              Critter
            </h1>

            <nav className="flex flex-col gap-2 text-xl">

              <Link
                href="/"
                className="hover:bg-zinc-900 px-4 py-3 rounded-full transition"
              >
                🏠 ホーム
              </Link>

              <Link
                href="/notifications"
                className="hover:bg-zinc-900 px-4 py-3 rounded-full transition"
              >
                🔔 通知
              </Link>

              <Link
                href="/profile"
                className="hover:bg-zinc-900 px-4 py-3 rounded-full transition"
              >
                👤 プロフィール
              </Link>

              <Link
                href="/bookmarks"
                className="hover:bg-zinc-900 px-4 py-3 rounded-full transition"
              >
                🔖 ブックマーク
              </Link>

              <Link
                href="/settings"
                className="hover:bg-zinc-900 px-4 py-3 rounded-full transition"
              >
                ⚙️ 設定
              </Link>

            </nav>

            <button className="mt-6 bg-blue-500 hover:bg-blue-600 transition rounded-full py-3 font-bold">
              ポスト
            </button>

          </aside>

          {/* 真ん中 */}
          <main className="flex-1 border-x border-zinc-800 min-h-screen max-w-2xl">

            {children}

          </main>

          {/* 右 */}
          <aside className="hidden xl:block w-[350px] px-4 py-4">

            <div className="bg-zinc-900 rounded-2xl p-4 sticky top-4">

              <h2 className="font-bold text-xl mb-4">
                トレンド
              </h2>

              <div className="space-y-4">

                <div>
                  <p className="text-sm text-zinc-500">
                    トレンド
                  </p>
                  <p className="font-bold">
                    AI
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">
                    ゲーム
                  </p>
                  <p className="font-bold">
                    Minecraft
                  </p>
                </div>

              </div>

            </div>

          </aside>

        </div>

      </body>
    </html>
  );
}