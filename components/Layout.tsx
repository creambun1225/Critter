"use client";

import Link from "next/link";

import {
  usePathname
} from "next/navigation";

import {
  useEffect,
  useState
} from "react";

import {
  db
} from "@/lib/firebase";

import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";

export default function Layout({
  children,
  currentUser
}: {
  children: React.ReactNode;
  currentUser?: any;
}) {

  const pathname =
    usePathname();

  const [notificationCount,
    setNotificationCount] =
    useState(0);

  // トレンド（ハッシュタグ上位3件）
  const [trends, setTrends] =
    useState<{ tag: string; count: number }[]>([]);

  // 通知バッジ
  useEffect(() => {

    if (!currentUser?.uid) return;

    let personalUnread = 0;
    let reportUnread = 0;

    const personalQ = query(
      collection(db, "notifications"),
      where("toUid", "==", currentUser.uid)
    );

    const unsubPersonal = onSnapshot(personalQ, (snap) => {

      personalUnread = 0;

      snap.docs.forEach((d: any) => {
        const data = d.data();
        const readBy = data.readBy || [];
        if (!readBy.includes(currentUser.uid)) {
          personalUnread++;
        }
      });

      setNotificationCount(personalUnread + reportUnread);

    });

    let unsubReport: (() => void) | null = null;

    if (currentUser.admin) {

      const reportQ = query(
        collection(db, "notifications"),
        where("type", "==", "report")
      );

      unsubReport = onSnapshot(reportQ, (snap) => {

        reportUnread = 0;

        snap.docs.forEach((d: any) => {
          const data = d.data();
          const readBy = data.readBy || [];
          if (!readBy.includes(currentUser.uid)) {
            reportUnread++;
          }
        });

        setNotificationCount(personalUnread + reportUnread);

      });

    }

    return () => {
      unsubPersonal();
      if (unsubReport) unsubReport();
    };

  }, [currentUser?.uid, currentUser?.admin]);

  // トレンド集計（最新20投稿のハッシュタグ）
  useEffect(() => {

    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(q, (snap) => {

      const tagCount: Record<string, number> = {};

      snap.docs.forEach((d: any) => {

        const data = d.data();
        const text: string = data.text || "";

        // テキストから #タグ を抽出
        const tags = text.match(/#[^\s#]+/g) || [];

        tags.forEach((tag) => {
          const normalized = tag.toLowerCase();
          tagCount[normalized] =
            (tagCount[normalized] || 0) + 1;
        });

      });

      // 出現回数順にソートして上位3件
      const sorted = Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag, count]) => ({
          tag: tag.slice(1), // # を除く
          count,
        }));

      setTrends(sorted);

    });

    return () => unsub();

  }, []);

  const menus = [

    {
      href: "/",
      icon: "🏠",
      label: "ホーム"
    },

    {
      href: "/search",
      icon: "🔎",
      label: "検索"
    },

    {
      href: "/notifications",
      icon: "🔔",
      label: "通知"
    },

    {
      href:
        `/user/${currentUser?.uid}`,
      icon: "👤",
      label: "プロフィール"
    },

    {
      href: "/bookmarks",
      icon: "🔖",
      label: "ブックマーク"
    },

    {
      href: "/settings",
      icon: "⚙️",
      label: "設定"
    }

  ];

  return (

    <div className="bg-black text-white min-h-screen flex justify-center overflow-x-hidden">

      <div className="w-full max-w-7xl flex">

        {/* 左 */}
        <div className="hidden md:flex w-[275px] h-screen sticky top-0 border-r border-zinc-800 px-4 py-3 flex-col">

          {/* ロゴ */}
          <Link
            href="/"
            className="w-14 h-14 rounded-full hover:bg-zinc-900 flex items-center justify-center mb-4 overflow-hidden"
          >

            <img
              src="/logo.png"
              className="w-full h-full object-cover"
            />

          </Link>

          {/* メニュー */}
          <div className="flex flex-col gap-1">

            {menus.map((menu)=>(

              <Link
                key={menu.href}
                href={menu.href}
                className={`
                  flex items-center gap-5
                  px-5 py-4
                  rounded-full
                  text-2xl
                  font-bold
                  transition
                  hover:bg-zinc-900

                  ${
                    pathname === menu.href
                    ? "bg-zinc-900"
                    : ""
                  }
                `}
              >

                <div className="relative">

                  <span className="text-3xl">

                    {menu.icon}

                  </span>

                  {/* 通知バッジ */}
                  {menu.href ===
                    "/notifications" &&
                    notificationCount > 0 && (

                    <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center font-bold">

                      {notificationCount > 99 ? "99+" : notificationCount}

                    </div>

                  )}

                </div>

                <span>

                  {menu.label}

                </span>

              </Link>

            ))}

          </div>

          {/* ボタン */}
          <button className="mt-6 bg-blue-500 hover:bg-blue-600 transition rounded-full py-4 text-xl font-bold">

            クリート

          </button>

          {/* ユーザー */}
          <div className="mt-auto">

            <Link
              href={`/user/${currentUser?.uid}`}
              className="flex items-center gap-3 hover:bg-zinc-900 rounded-full p-3 transition"
            >

              <img
                src={
                  currentUser?.icon ||
                  "/default.png"
                }
                className="w-12 h-12 rounded-full object-cover bg-zinc-700"
              />

              <div className="min-w-0">

                <div className="font-bold truncate">

                  {currentUser?.name ||
                    "ユーザー"}

                </div>

                <div className="text-zinc-500 text-sm truncate">

                  @{
                    currentUser?.username ||
                    "user"
                  }

                </div>

              </div>

            </Link>

          </div>

        </div>

        {/* 真ん中 */}
        <main className="flex-1 border-r border-l border-zinc-800 min-h-screen max-w-[700px] w-full">

          {children}

        </main>

        {/* 右 */}
        <div className="hidden xl:block w-[350px] p-4">

          <div className="sticky top-4">

            <input
              placeholder="検索"
              className="w-full bg-zinc-900 rounded-full px-5 py-4 outline-none text-lg mb-4"
            />

            <div className="bg-zinc-900 rounded-3xl overflow-hidden">

              <div className="p-5 text-2xl font-bold border-b border-zinc-800">

                トレンド

              </div>

              {trends.length === 0 ? (

                <div className="p-5 text-zinc-500 text-sm">

                  トレンドはまだありません

                </div>

              ) : (

                trends.map((trend, i) => (

                  <Link
                    key={i}
                    href={`/search?q=${encodeURIComponent(trend.tag)}`}
                    className="block p-5 hover:bg-zinc-800 transition cursor-pointer border-t border-zinc-800 first:border-t-0"
                  >

                    <div className="text-zinc-500 text-sm">

                      トレンド · {trend.count}件

                    </div>

                    <div className="font-bold text-xl">

                      #{trend.tag}

                    </div>

                  </Link>

                ))

              )}

            </div>

            <div className="text-zinc-500 text-sm mt-4 px-2">

              Critter v1.0.3

            </div>

          </div>

        </div>

      </div>

      {/* モバイル */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 flex justify-around py-3 md:hidden z-50">

        <Link href="/">
          🏠
        </Link>

        <Link href="/search">
          🔎
        </Link>

        <Link
          href="/notifications"
          className="relative"
        >

          🔔

          {notificationCount > 0 && (

            <div className="absolute -top-2 -right-3 bg-blue-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold">

              {notificationCount > 99 ? "99+" : notificationCount}

            </div>

          )}

        </Link>

        <Link href="/bookmarks">
          🔖
        </Link>

        <Link
          href={`/user/${currentUser?.uid}`}
        >
          👤
        </Link>

        <Link href="/settings">
          ⚙️
        </Link>

      </div>

    </div>

  );

}