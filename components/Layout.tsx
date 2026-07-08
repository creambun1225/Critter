"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, limit, getDocs, orderBy, where } from "firebase/firestore";

interface LayoutProps {
  children: React.ReactNode;
  currentUser?: any;
  onAccountSwitch?: (uid: string) => void;
}

export default function Layout({ children, currentUser, onAccountSwitch }: LayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("critter_accounts");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAccounts(Array.isArray(parsed) ? parsed : []);
      } catch {}
    }
  }, []);

  // トレンド取得（直近1週間のハッシュタグ）
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const q = query(
          collection(db, "posts"),
          where("createdAt", ">", oneWeekAgo),
          orderBy("createdAt", "desc"),
          limit(100)
        );
        const snap = await getDocs(q);
        
        const hashtagMap = new Map<string, number>();
        snap.docs.forEach((doc) => {
          const hashtags = doc.data().hashtags || [];
          hashtags.forEach((tag: string) => {
            hashtagMap.set(tag, (hashtagMap.get(tag) || 0) + 1);
          });
        });

        const topTrends = Array.from(hashtagMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([tag, count]) => ({ tag, count }));

        setTrends(topTrends);
      } catch (e) {
        console.error("Trends fetch error:", e);
      }
    };

    fetchTrends();
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
    <div className="min-h-screen bg-black text-white">
      {/* PC レイアウト */}
      <div className="hidden md:grid md:grid-cols-[minmax(280px,1fr)_2fr_minmax(280px,1fr)] gap-0 min-h-screen">
        {/* 左メニュー */}
        <aside className="border-r border-zinc-800 flex flex-col sticky top-0 h-screen">
          <div className="flex-1 px-4 py-4 overflow-y-auto">
            <Link href="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition">
              <img src="/logo.png" className="w-10 h-10 rounded-full" alt="Critter" />
              <span className="text-2xl font-bold">Critter</span>
            </Link>

            <nav className="space-y-4">
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
          </div>

          {/* 左下アカウント表示 */}
          <div className="border-t border-zinc-800 p-4">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-full flex items-center gap-3 hover:bg-zinc-900 rounded-full px-3 py-2 transition relative"
            >
              <img src={currentUser?.icon || "/default.png"} className="w-10 h-10 rounded-full object-cover" />
              <div className="text-left min-w-0 flex-1">
                <div className="font-bold text-sm truncate">{currentUser?.name || "ユーザー"}</div>
                <div className="text-xs text-zinc-500 truncate">@{currentUser?.username || "user"}</div>
              </div>
              <span className="text-xl">⋯</span>

              {menuOpen && (
                <div className="absolute bottom-full left-0 bg-black border border-zinc-700 rounded-2xl w-56 mb-2 z-50 shadow-2xl">
                  {accounts.length > 1 && (
                    <>
                      <div className="p-4 border-b border-zinc-800">
                        <p className="text-xs text-zinc-500 mb-2">アカウント切り替え</p>
                        {accounts.map((acc) => (
                          <button
                            key={acc.uid}
                            onClick={() => {
                              switchAccount(acc.uid);
                              setMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs mb-1 transition ${
                              currentUser?.uid === acc.uid ? "bg-zinc-800" : "hover:bg-zinc-900"
                            }`}
                          >
                            <img src={acc.icon || "/default.png"} className="w-6 h-6 rounded-full object-cover" />
                            <div className="min-w-0 flex-1">
                              <div className="font-bold truncate">{acc.name}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 hover:bg-zinc-900 text-sm border-b border-zinc-800"
                  >
                    ⚙️ 設定
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
              )}
            </button>

            <div className="text-xs text-zinc-600 px-4 mt-2 pt-2 border-t border-zinc-800">
              Critter v1.0.7
            </div>
          </div>
        </aside>

        {/* メインコンテンツ */}
        <main className="border-r border-zinc-800 overflow-y-auto">
          {children}
        </main>

        {/* 右サイドバー */}
        <aside className="px-4 py-4 overflow-y-auto">
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
            <h3 className="font-bold text-lg mb-4">トレンド</h3>
            <div className="space-y-4">
              {trends.length > 0 ? (
                trends.map((trend) => (
                  <Link key={trend.tag} href={`/search?q=%23${trend.tag}`} className="block hover:bg-zinc-800 px-3 py-2 rounded transition">
                    <div className="text-xs text-zinc-500">話題</div>
                    <div className="font-bold">#{trend.tag}</div>
                    <div className="text-xs text-zinc-500">{trend.count}件のクリート</div>
                  </Link>
                ))
              ) : (
                <div className="text-xs text-zinc-500">トレンド情報を読み込み中...</div>
              )}
            </div>
          </div>

          {/* おすすめユーザー */}
          <div className="mt-6 bg-zinc-900 rounded-2xl p-4">
            <h3 className="font-bold text-lg mb-4">おすすめユーザー</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between hover:bg-zinc-800 px-3 py-2 rounded transition">
                <Link href="/user/critter_official" className="min-w-0 flex-1">
                  <div className="font-bold text-sm">Critter Official</div>
                  <div className="text-xs text-zinc-500">@critter_official</div>
                </Link>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    alert("フォロー機能はユーザー個別ページで行ってください");
                  }}
                  className="bg-white text-black px-4 py-1 rounded-full font-bold text-sm hover:bg-zinc-200 transition shrink-0">
                  フォロー
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* モバイル レイアウト */}
      <div className="md:hidden">
        {children}

        {/* モバイル下メニュー */}
        <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 flex items-center justify-around px-2 py-2 z-40">
          {menus.slice(0, 5).map((menu) => (
            <Link key={menu.href} href={menu.href} className="flex-1 flex flex-col items-center gap-1 py-2">
              <img src={menu.icon} className="w-6 h-6" alt={menu.label} />
              <span className="text-xs">{menu.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex-1 flex flex-col items-center gap-1 py-2"
          >
            <span className="text-2xl">☰</span>
            <span className="text-xs">その他</span>
          </button>

          {sidebarOpen && (
            <>
              <div className="fixed inset-0 z-30 bg-black/70" onClick={() => setSidebarOpen(false)} />
              <div className="absolute bottom-16 right-4 bg-black border border-zinc-700 rounded-2xl overflow-hidden w-64 z-50 shadow-2xl max-h-96 overflow-y-auto">
                {accounts.length > 1 && (
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
                  ⚙️ 設定
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

        <div className="h-16" />
      </div>
    </div>
  );
}