"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface LayoutProps {
  children: React.ReactNode;
  currentUser?: any;
  onAccountSwitch?: (uid: string) => void;
}

export default function Layout({ children, currentUser, onAccountSwitch }: LayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("critter_accounts");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAccounts(Array.isArray(parsed) ? parsed : []);
      } catch {}
    }
  }, []);

  const switchAccount = (uid: string) => {
    if (onAccountSwitch) {
      onAccountSwitch(uid);
    }
    setTimeout(() => {
      location.reload();
    }, 100);
  };

  const menus = [
    { icon: "/icon-home.png", label: "ホーム", href: "/" },
    { icon: "/icon-search.png", label: "検索", href: "/search" },
    { icon: "/icon-notification.png", label: "通知", href: "/notifications", badge: true },
    { icon: "/icon-profile.png", label: "プロフィール", href: currentUser?.uid ? `/user/${currentUser.uid}` : "#" },
    { icon: "/icon-bookmarks.png", label: "ブックマーク", href: "/bookmarks" },
    { icon: "/icon-settings.png", label: "設定", href: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-black text-white grid grid-cols-1 md:grid-cols-[280px_1fr_350px] gap-0">
      {/* 左メニュー（PC） */}
      <aside className="hidden md:flex flex-col sticky top-0 h-screen bg-black border-r border-zinc-800 px-4 py-4 overflow-y-auto">
        <Link href="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition">
          <img src="/logo.png" className="w-10 h-10 rounded-full" alt="Critter" />
          <span className="text-2xl font-bold">Critter</span>
        </Link>

        <nav className="flex-1 space-y-4">
          {menus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-full transition ${
                pathname === menu.href
                  ? "bg-zinc-900 text-white font-bold"
                  : "text-zinc-300 hover:bg-zinc-900"
              }`}
            >
              <img src={menu.icon} className="w-6 h-6" alt={menu.label} />
              <span className="text-xl">{menu.label}</span>
            </Link>
          ))}
        </nav>

        {/* アカウント部分 */}
        <div className="border-t border-zinc-800 pt-4">
          <p className="text-xs text-zinc-500 px-4 mb-2">アカウント</p>
          {accounts.map((acc) => (
            <button
              key={acc.uid}
              onClick={() => switchAccount(acc.uid)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-full transition text-left mb-2 ${
                currentUser?.uid === acc.uid
                  ? "bg-zinc-800"
                  : "hover:bg-zinc-900 text-zinc-400"
              }`}
            >
              <img src={acc.icon || "/default.png"} className="w-8 h-8 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold truncate">{acc.name}</div>
                <div className="text-xs text-zinc-500 truncate">@{acc.username}</div>
              </div>
            </button>
          ))}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-full hover:bg-zinc-900 transition text-zinc-300 text-sm mt-2"
          >
            ☰ その他
          </button>

          {sidebarOpen && (
            <div className="bg-zinc-900 rounded-xl p-2 mt-2 space-y-1">
              <Link
                href="/settings"
                className="block px-3 py-2 hover:bg-zinc-800 rounded text-sm"
                onClick={() => setSidebarOpen(false)}
              >
                アカウント設定
              </Link>
              <button
                onClick={async () => {
                  await auth.signOut();
                  location.href = "/login";
                }}
                className="w-full text-left px-3 py-2 hover:bg-zinc-800 rounded text-sm text-red-400"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>

        {/* バージョン表記 */}
        <div className="text-xs text-zinc-600 px-4 mt-4 pt-4 border-t border-zinc-800">
          Critter v1.0.7
        </div>
      </aside>

      {/* メインコンテンツ（幅制限あり） */}
      <main className="border-r border-zinc-800 flex justify-center">
        <div className="w-full max-w-2xl border-r border-zinc-800">
          {children}
        </div>
      </main>

      {/* 右カラム（PC） */}
      <aside className="hidden lg:block sticky top-0 h-screen bg-black border-l border-zinc-800 px-4 py-4 overflow-y-auto">
        {/* 検索 */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="検索"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* トレンド */}
        <div className="bg-zinc-900 rounded-2xl p-4">
          <h3 className="font-bold text-xl mb-4">トレンド</h3>
          <div className="space-y-4">
            <Link href="#" className="block hover:bg-zinc-800 px-3 py-2 rounded transition">
              <div className="text-xs text-zinc-500">トレンド</div>
              <div className="font-bold">いいね</div>
              <div className="text-xs text-zinc-500">10.5K件</div>
            </Link>
          </div>
        </div>

        {/* おすすめユーザー */}
        <div className="mt-6 bg-zinc-900 rounded-2xl p-4">
          <h3 className="font-bold text-xl mb-4">おすすめユーザー</h3>
          <div className="space-y-3">
            {["creambun", "critter_Official"].map((user) => (
              <Link key={user} href={`/user/${user}`} className="flex items-center justify-between hover:bg-zinc-800 px-3 py-2 rounded transition">
                <div>
                  <div className="font-bold text-sm">{user}</div>
                  <div className="text-xs text-zinc-500">@{user}</div>
                </div>
                <button className="bg-white text-black px-4 py-1 rounded-full font-bold text-sm hover:bg-zinc-200 transition">
                  フォロー
                </button>
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* モバイル下メニュー */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 flex items-center justify-around px-2 py-2 z-40">
        {menus.slice(0, 5).map((menu) => (
          <Link key={menu.href} href={menu.href} className="flex-1 flex flex-col items-center gap-1 py-2">
            <img src={menu.icon} className="w-6 h-6" alt={menu.label} />
            <span className="text-xs">{menu.label}</span>
          </Link>
        ))}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex-1 flex flex-col items-center gap-1 py-2 relative"
        >
          <span className="text-2xl">☰</span>
          <span className="text-xs">その他</span>
        </button>

        {sidebarOpen && (
          <>
            <div className="fixed inset-0 z-30 bg-black/70" onClick={() => setSidebarOpen(false)} />
            <div className="absolute bottom-16 right-4 bg-black border border-zinc-700 rounded-2xl overflow-hidden w-64 z-50 shadow-2xl max-h-96 overflow-y-auto">
              {accounts.length > 0 && (
                <>
                  <div className="p-4 border-b border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-3">アカウント切り替え</p>
                    <div className="space-y-2">
                      {accounts.map((acc) => (
                        <button
                          key={acc.uid}
                          onClick={() => {
                            switchAccount(acc.uid);
                            setSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left text-sm transition ${
                            currentUser?.uid === acc.uid
                              ? "bg-zinc-800"
                              : "hover:bg-zinc-900"
                          }`}
                        >
                          <img src={acc.icon || "/default.png"} className="w-6 h-6 rounded-full object-cover" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold truncate">{acc.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <Link
                href="/settings"
                onClick={() => setSidebarOpen(false)}
                className="block px-4 py-3 hover:bg-zinc-900 text-sm border-b border-zinc-800"
              >
                ⚙️ アカウント設定
              </Link>
              <button
                onClick={async () => {
                  await auth.signOut();
                  location.href = "/login";
                }}
                className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-sm text-red-400"
              >
                🚪 ログアウト
              </button>
            </div>
          </>
        )}
      </nav>

      {/* モバイル用フッター補完 */}
      <div className="md:hidden h-16" />
    </div>
  );
}