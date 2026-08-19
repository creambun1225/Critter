"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  limit,
  getDocs,
  orderBy,
  where,
} from "firebase/firestore";

interface LayoutProps {
  children: React.ReactNode;
  currentUser?: any;
  onAccountSwitch?: (uid: string) => void;
}

export default function Layout({
  children,
  currentUser,
  onAccountSwitch,
}: LayoutProps) {
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);

  // 保存されているアカウントを取得
  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        "critter_accounts"
      );

      if (stored) {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          setAccounts(parsed);
        }
      }
    } catch (error) {
      console.error(
        "Account loading error:",
        error
      );
    }
  }, []);

  // 現在のアカウントを一覧の一番上にする
  useEffect(() => {
    if (!currentUser?.uid) return;

    try {
      const stored =
        localStorage.getItem(
          "critter_accounts"
        );

      let savedAccounts: any[] = [];

      if (stored) {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          savedAccounts = parsed;
        }
      }

      const currentAccount = {
        uid: currentUser.uid,
        name:
          currentUser.name ||
          "ユーザー",
        username:
          currentUser.username ||
          "user",
        icon:
          currentUser.icon ||
          "/default.png",
        verified:
          currentUser.verified ||
          false,
        admin:
          currentUser.admin ||
          false,
      };

      // 同じUIDを削除
      savedAccounts =
        savedAccounts.filter(
          (account) =>
            account.uid !== currentUser.uid
        );

      // 現在のアカウントを一番上に追加
      savedAccounts.unshift(
        currentAccount
      );

      localStorage.setItem(
        "critter_accounts",
        JSON.stringify(savedAccounts)
      );

      setAccounts(savedAccounts);
    } catch (error) {
      console.error(
        "Account save error:",
        error
      );
    }
  }, [
    currentUser?.uid,
    currentUser?.name,
    currentUser?.username,
    currentUser?.icon,
  ]);

  // トレンド取得
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const oneWeekAgo =
          Date.now() -
          7 * 24 * 60 * 60 * 1000;

        const q = query(
          collection(db, "posts"),
          where(
            "createdAt",
            ">",
            oneWeekAgo
          ),
          orderBy(
            "createdAt",
            "desc"
          ),
          limit(100)
        );

        const snap =
          await getDocs(q);

        const hashtagMap =
          new Map<string, number>();

        snap.docs.forEach((post) => {
          const hashtags =
            post.data().hashtags || [];

          hashtags.forEach(
            (tag: string) => {
              hashtagMap.set(
                tag,
                (hashtagMap.get(tag) ||
                  0) + 1
              );
            }
          );
        });

        const topTrends = Array.from(
          hashtagMap.entries()
        )
          .sort(
            (a, b) => b[1] - a[1]
          )
          .slice(0, 3)
          .map(
            ([tag, count]) => ({
              tag,
              count,
            })
          );

        setTrends(topTrends);
      } catch (error) {
        console.error(
          "Trends fetch error:",
          error
        );
      }
    };

    fetchTrends();
  }, []);

  // アカウント切り替え
  const switchAccount = (
    uid: string
  ) => {
    if (
      currentUser?.uid === uid
    ) {
      setMenuOpen(false);
      return;
    }

    if (onAccountSwitch) {
      onAccountSwitch(uid);
    }

    /*
     * 現在の実装ではアカウント情報を
     * localStorage に保持しています。
     *
     * 実際のFirebaseアカウント切り替え処理は
     * login側で行います。
     */
    localStorage.setItem(
      "critter_active_account",
      uid
    );

    setMenuOpen(false);

    setTimeout(() => {
      location.href = `/user/${uid}`;
    }, 100);
  };

  // アカウント追加
  const addAccount = () => {
    setMenuOpen(false);

    /*
     * アカウント追加用ログイン画面へ移動。
     *
     * ?addAccount=true を付けることで
     * 「アカウントを追加」から来たことを
     * ログインページ側で判別できます。
     */
    location.href =
      "/login?addAccount=true";
  };

  const menus = [
    {
      icon: "/icon-home.png",
      label: "ホーム",
      href: "/",
    },
    {
      icon: "/icon-search.png",
      label: "検索",
      href: "/search",
    },
    {
      icon: "/icon-notification.png",
      label: "通知",
      href: "/notifications",
      badge: true,
    },
    {
      icon: "/icon-profile.png",
      label: "プロフィール",
      href: currentUser?.uid
        ? `/user/${currentUser.uid}`
        : "#",
    },
    {
      icon: "/icon-bookmarks.png",
      label: "ブックマーク",
      href: "/bookmarks",
    },
    {
      icon: "/icon-settings.png",
      label: "設定",
      href: "/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">

      {/* =========================
          PC
      ========================= */}
      <div className="hidden md:flex justify-center min-h-screen bg-black">

        <div className="grid grid-cols-[minmax(260px,260px)_600px_minmax(280px,280px)] gap-0 w-full max-w-7xl">

          {/* =========================
              左メニュー
          ========================= */}
          <aside className="border-r border-zinc-800 flex flex-col sticky top-0 h-screen">

            <div className="flex-1 px-4 py-4 overflow-y-auto">

              {/* ロゴ */}
              <Link
                href="/"
                className="flex items-center gap-2 mb-8 hover:opacity-80 transition"
              >
                <img
                  src="/logo.png"
                  className="w-10 h-10 rounded-full"
                  alt="Critter"
                />

                <span className="text-2xl font-bold">
                  Critter
                </span>
              </Link>

              {/* メニュー */}
              <nav className="space-y-4">

                {menus.map((menu) => (
                  <Link
                    key={menu.href}
                    href={menu.href}
                    className={`flex items-center gap-4 px-4 py-3 rounded-full transition ${
                      pathname ===
                      menu.href
                        ? "bg-zinc-900 text-white font-bold"
                        : "text-zinc-300 hover:bg-zinc-900"
                    }`}
                  >
                    <img
                      src={menu.icon}
                      className="w-6 h-6"
                      alt={menu.label}
                    />

                    <span className="text-xl">
                      {menu.label}
                    </span>
                  </Link>
                ))}

              </nav>
            </div>

            {/* クリート */}
            <Link
              href="/#create-post"
              onClick={(e) => {
                e.preventDefault();

                const createPostBtn =
                  document.getElementById(
                    "open-create-post"
                  );

                if (createPostBtn) {
                  createPostBtn.click();
                }
              }}
              className="mx-4 mb-4 py-3 px-8 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full text-center transition w-[calc(100%-2rem)]"
            >
              ＋ クリート
            </Link>

            {/* =========================
                アカウント
            ========================= */}
            <div className="border-t border-zinc-800 p-4">

              <button
                onClick={() =>
                  setMenuOpen(
                    !menuOpen
                  )
                }
                className="w-full flex items-center gap-3 hover:bg-zinc-900 rounded-full px-3 py-2 transition relative"
              >

                <img
                  src={
                    currentUser?.icon ||
                    "/default.png"
                  }
                  className="w-10 h-10 rounded-full object-cover"
                  alt=""
                />

                <div className="text-left min-w-0 flex-1">

                  <div className="font-bold text-sm truncate">
                    {currentUser?.name ||
                      "ユーザー"}
                  </div>

                  <div className="text-xs text-zinc-500 truncate">
                    @
                    {currentUser?.username ||
                      "user"}
                  </div>

                </div>

                <span className="text-xl">
                  ⋯
                </span>

                {/* =========================
                    アカウントメニュー
                ========================= */}
                {menuOpen && (
                  <div
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                    className="absolute bottom-full left-0 bg-black border border-zinc-700 rounded-2xl w-64 mb-2 z-50 shadow-2xl overflow-hidden"
                  >

                    {/* アカウント一覧 */}
                    {accounts.length >
                      0 && (
                      <div className="p-3 border-b border-zinc-800">

                        <div className="space-y-1">

                          {accounts.map(
                            (acc) => (
                              <button
                                key={
                                  acc.uid
                                }
                                onClick={() =>
                                  switchAccount(
                                    acc.uid
                                  )
                                }
                                className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left transition ${
                                  currentUser?.uid ===
                                  acc.uid
                                    ? "bg-zinc-800"
                                    : "hover:bg-zinc-900"
                                }`}
                              >

                                <img
                                  src={
                                    acc.icon ||
                                    "/default.png"
                                  }
                                  className="w-9 h-9 rounded-full object-cover shrink-0"
                                  alt=""
                                />

                                <div className="min-w-0 flex-1">

                                  <div className="flex items-center gap-1">

                                    <span className="font-bold text-sm truncate">
                                      {acc.name ||
                                        "ユーザー"}
                                    </span>

                                    {acc.admin ===
                                      true && (
                                      <span className="text-yellow-400 text-xs">
                                        ✓
                                      </span>
                                    )}

                                  </div>

                                  <div className="text-xs text-zinc-500 truncate">
                                    @
                                    {acc.username ||
                                      "user"}
                                  </div>

                                </div>

                                {currentUser?.uid ===
                                  acc.uid && (
                                  <span className="text-green-400 text-sm">
                                    ●
                                  </span>
                                )}

                              </button>
                            )
                          )}

                        </div>

                      </div>
                    )}

                    {/* =========================
                        アカウントを追加
                    ========================= */}
                    <button
                      onClick={addAccount}
                      className="w-full flex items-center gap-3 px-4 py-4 hover:bg-zinc-900 transition text-left border-b border-zinc-800"
                    >

                      <div className="w-9 h-9 rounded-full border border-zinc-600 flex items-center justify-center text-xl">
                        +
                      </div>

                      <div>
                        <div className="font-bold text-sm">
                          アカウントを追加
                        </div>

                        <div className="text-xs text-zinc-500 mt-0.5">
                          別のアカウントを追加
                        </div>
                      </div>

                    </button>

                    {/* 設定 */}
                    <Link
                      href="/settings"
                      onClick={() =>
                        setMenuOpen(
                          false
                        )
                      }
                      className="block px-4 py-3 hover:bg-zinc-900 text-sm border-b border-zinc-800"
                    >
                      ⚙️ 設定
                    </Link>

                    {/* ログアウト */}
                    <button
                      onClick={async () => {
                        await auth.signOut();

                        localStorage.removeItem(
                          "critter_active_account"
                        );

                        location.href =
                          "/login";
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

          {/* =========================
              メイン
          ========================= */}
          <main className="border-r border-zinc-800 overflow-y-auto">
            {children}
          </main>

          {/* =========================
              右サイドバー
          ========================= */}
          <aside className="px-4 py-4 overflow-y-auto border-l border-zinc-800">

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

              <h3 className="font-bold text-lg mb-4">
                トレンド
              </h3>

              <div className="space-y-4">

                {trends.length >
                0 ? (
                  trends.map(
                    (trend) => (
                      <Link
                        key={
                          trend.tag
                        }
                        href={`/search?q=%23${trend.tag}`}
                        className="block hover:bg-zinc-800 px-3 py-2 rounded transition"
                      >

                        <div className="text-xs text-zinc-500">
                          話題
                        </div>

                        <div className="font-bold">
                          #
                          {
                            trend.tag
                          }
                        </div>

                        <div className="text-xs text-zinc-500">
                          {
                            trend.count
                          }
                          件のクリート
                        </div>

                      </Link>
                    )
                  )
                ) : (
                  <div className="text-xs text-zinc-500">
                    トレンド情報を読み込み中...
                  </div>
                )}

              </div>

            </div>

            {/* おすすめ */}
            <div className="mt-6 bg-zinc-900 rounded-2xl p-4">

              <h3 className="font-bold text-lg mb-4">
                おすすめユーザー
              </h3>

              <div className="space-y-3">

                <div className="flex items-center justify-between hover:bg-zinc-800 px-3 py-2 rounded transition">

                  <Link
                    href="/user/critter_official"
                    className="min-w-0 flex-1"
                  >
                    <div className="font-bold text-sm">
                      Critter Official
                    </div>

                    <div className="text-xs text-zinc-500">
                      @critter_official
                    </div>
                  </Link>

                  <button
                    onClick={(e) => {
                      e.preventDefault();

                      alert(
                        "フォロー機能はユーザー個別ページで行ってください"
                      );
                    }}
                    className="bg-white text-black px-4 py-1 rounded-full font-bold text-sm hover:bg-zinc-200 transition shrink-0"
                  >
                    フォロー
                  </button>

                </div>

              </div>

            </div>

          </aside>

        </div>

      </div>

      {/* =========================
          モバイル
      ========================= */}
      <div className="md:hidden">

        {children}

        <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 flex items-center justify-around px-2 py-2 z-40">

          {menus
            .slice(0, 5)
            .map((menu) => (
              <Link
                key={menu.href}
                href={menu.href}
                className="flex-1 flex flex-col items-center gap-1 py-2"
              >
                <img
                  src={menu.icon}
                  className="w-6 h-6"
                  alt={menu.label}
                />

                <span className="text-xs">
                  {menu.label}
                </span>
              </Link>
            ))}

          <button
            onClick={() =>
              setSidebarOpen(
                !sidebarOpen
              )
            }
            className="flex-1 flex flex-col items-center gap-1 py-2"
          >
            <span className="text-2xl">
              ☰
            </span>

            <span className="text-xs">
              その他
            </span>
          </button>

          {sidebarOpen && (
            <>
              <div
                className="fixed inset-0 z-30 bg-black/70"
                onClick={() =>
                  setSidebarOpen(false)
                }
              />

              <div className="absolute bottom-16 right-4 bg-black border border-zinc-700 rounded-2xl overflow-hidden w-64 z-50 shadow-2xl max-h-96 overflow-y-auto">

                {/* アカウント一覧 */}
                {accounts.length >
                  0 && (
                  <div className="p-3 border-b border-zinc-800">

                    <div className="space-y-1">

                      {accounts.map(
                        (acc) => (
                          <button
                            key={
                              acc.uid
                            }
                            onClick={() => {
                              switchAccount(
                                acc.uid
                              );
                              setSidebarOpen(
                                false
                              );
                            }}
                            className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left transition ${
                              currentUser?.uid ===
                              acc.uid
                                ? "bg-zinc-800"
                                : "hover:bg-zinc-900"
                            }`}
                          >

                            <img
                              src={
                                acc.icon ||
                                "/default.png"
                              }
                              className="w-9 h-9 rounded-full object-cover"
                              alt=""
                            />

                            <div className="min-w-0 flex-1">

                              <div className="font-bold text-sm truncate">
                                {acc.name ||
                                  "ユーザー"}
                              </div>

                              <div className="text-xs text-zinc-500 truncate">
                                @
                                {acc.username ||
                                  "user"}
                              </div>

                            </div>

                          </button>
                        )
                      )}

                    </div>

                  </div>
                )}

                {/* アカウント追加 */}
                <button
                  onClick={() => {
                    setSidebarOpen(
                      false
                    );
                    addAccount();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-4 hover:bg-zinc-900 transition text-left border-b border-zinc-800"
                >

                  <div className="w-9 h-9 rounded-full border border-zinc-600 flex items-center justify-center text-xl">
                    +
                  </div>

                  <div>
                    <div className="font-bold text-sm">
                      アカウントを追加
                    </div>

                    <div className="text-xs text-zinc-500">
                      別のアカウントを追加
                    </div>
                  </div>

                </button>

                {/* 設定 */}
                <Link
                  href="/settings"
                  onClick={() =>
                    setSidebarOpen(
                      false
                    )
                  }
                  className="block px-4 py-3 hover:bg-zinc-900 text-sm border-b border-zinc-800"
                >
                  ⚙️ 設定
                </Link>

                {/* ログアウト */}
                <button
                  onClick={async () => {
                    await auth.signOut();

                    localStorage.removeItem(
                      "critter_active_account"
                    );

                    location.href =
                      "/login";
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