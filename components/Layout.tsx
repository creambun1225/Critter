"use client";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  useEffect,
  useState,
  useRef,
} from "react";

import {
  db,
  auth,
} from "@/lib/firebase";

import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  addDoc,
  getDocs,
} from "firebase/firestore";

import {
  signOut,
  signInWithEmailAndPassword,
} from "firebase/auth";

// ───────────────────────────────────────
// 投稿モーダル
// ───────────────────────────────────────
function PostModal({
  currentUser,
  onClose,
}: {
  currentUser: any;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [posting, setPosting] = useState(false);
  const MAX = 280;
  const remaining = MAX - text.length;
  const canSubmit = (text.trim().length > 0 || image) && remaining >= 0 && !posting;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("画像は5MB以下にしてください"); return; }
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!currentUser || !canSubmit) return;
    setPosting(true);
    try {
      let imageUrl = "";
      if (image) {
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(image);
        });
      }
      const hashtags = text.match(/#[^\s#]+/g)?.map((t) => t.slice(1)) || [];
      await addDoc(collection(db, "posts"), {
        text, image: imageUrl, hashtags,
        uid: currentUser.uid,
        name: currentUser.name || "ユーザー",
        username: currentUser.username || "user",
        icon: currentUser.icon || "",
        verified: currentUser.verified || false,
        admin: currentUser.admin || false,
        replies: 0, reposts: 0, likes: 0, bookmarks: 0,
        likedUsers: [], repostedUsers: [], bookmarkedUsers: [],
        createdAt: Date.now(),
      });

      const mentions = text.match(/@([a-zA-Z0-9_]+)/g);
      if (mentions) {
        const usernames = [...new Set(mentions.map((m) => m.slice(1)))];
        for (const username of usernames) {
          if (username === currentUser.username) continue;
          const q = query(collection(db, "users"), where("username", "==", username));
          const snap = await getDocs(q);
          if (!snap.empty) {
            await addDoc(collection(db, "notifications"), {
              type: "mention",
              toUid: snap.docs[0].id,
              fromUid: currentUser.uid,
              fromName: currentUser.name,
              fromIcon: currentUser.icon ?? "",
              fromUsername: currentUser.username,
              postText: text,
              readBy: [],
              createdAt: Date.now(),
            });
          }
        }
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert("投稿に失敗しました");
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
        <div className="w-full max-w-lg bg-black border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
            <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-900 transition">✕</button>
            <button onClick={handleSubmit} disabled={!canSubmit} className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm px-5 py-2 rounded-full disabled:opacity-40 transition">
              {posting ? "投稿中..." : "クリート"}
            </button>
          </div>
          <div className="flex gap-3 p-4 overflow-y-auto flex-1">
            <img src={currentUser?.icon || "/default.png"} className="w-11 h-11 rounded-full object-cover bg-zinc-700 shrink-0" />
            <div className="flex-1 min-w-0">
              <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="いまどうしてる？" rows={5}
                className="w-full bg-transparent text-white placeholder-zinc-600 resize-none outline-none text-xl leading-relaxed" />
              {imagePreview && (
                <div className="relative mt-3 inline-block">
                  <img src={imagePreview} className="rounded-2xl max-h-[250px] object-cover" />
                  <button onClick={() => { setImage(null); setImagePreview(""); }}
                    className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black transition text-sm">✕</button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 shrink-0">
            <label className="cursor-pointer text-blue-400 hover:text-blue-300 transition text-2xl">
              🖼
              <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </label>
            <span className={`text-sm font-medium ${remaining < 0 ? "text-red-500" : remaining < 20 ? "text-yellow-500" : "text-zinc-500"}`}>{remaining}</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ───────────────────────────────────────
// メイン Layout
// ───────────────────────────────────────
export default function Layout({
  children,
  currentUser
}: {
  children: React.ReactNode;
  currentUser?: any;
}) {

  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  const [notificationCount, setNotificationCount] = useState(0);
  const [trends, setTrends] = useState<{ tag: string; count: number }[]>([]);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [recommendedUsers, setRecommendedUsers] = useState<any[]>([]);

  const [switchTarget, setSwitchTarget] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [switchError, setSwitchError] = useState("");
  const [switchLoading, setSwitchLoading] = useState(false);

  const [savedAccounts, setSavedAccounts] = useState<
    { uid: string; name: string; username: string; icon: string; email: string }[]
  >([]);

  // おすすめユーザー取得
  useEffect(() => {
    const fetchRecommended = async () => {
      const targets = ["creambun", "critter_Official"];
      const results: any[] = [];
      for (const username of targets) {
        const q = query(collection(db, "users"), where("username", "==", username));
        const snap = await getDocs(q);
        if (!snap.empty) results.push({ uid: snap.docs[0].id, ...snap.docs[0].data() });
      }
      setRecommendedUsers(results);
    };
    fetchRecommended();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("critter_accounts");
      if (raw) setSavedAccounts(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (!currentUser?.uid || !currentUser?.email) return;
    try {
      const raw = localStorage.getItem("critter_accounts");
      const existing: any[] = raw ? JSON.parse(raw) : [];
      const filtered = existing.filter((a) => a.uid !== currentUser.uid);
      const updated = [
        { uid: currentUser.uid, name: currentUser.name || "ユーザー", username: currentUser.username || "user", icon: currentUser.icon || "", email: currentUser.email || "" },
        ...filtered,
      ].slice(0, 5);
      localStorage.setItem("critter_accounts", JSON.stringify(updated));
      setSavedAccounts(updated);
    } catch {}
  }, [currentUser?.uid]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowAccountMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    try {
      const raw = localStorage.getItem("critter_accounts");
      const existing: any[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem("critter_accounts", JSON.stringify(existing.filter((a) => a.uid !== currentUser?.uid)));
    } catch {}
    location.href = "/login";
  };

  const openSwitchModal = (account: any) => {
    setSwitchTarget(account); setPassword(""); setSwitchError(""); setShowAccountMenu(false);
  };

  const handleSwitch = async () => {
    if (!switchTarget || !password) return;
    setSwitchLoading(true); setSwitchError("");
    try {
      await signOut(auth);
      await signInWithEmailAndPassword(auth, switchTarget.email, password);
      setSwitchTarget(null); setPassword("");
      location.href = "/";
    } catch (e: any) {
      const code = e?.code || "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") setSwitchError("パスワードが間違っています");
      else if (code === "auth/too-many-requests") setSwitchError("試行回数が多すぎます。しばらくしてから再試行してください");
      else setSwitchError("切り替えに失敗しました");
    } finally {
      setSwitchLoading(false);
    }
  };

  // 通知バッジ
  useEffect(() => {
    if (!currentUser?.uid) return;
    let personalUnread = 0;
    let reportUnread = 0;

    const personalQ = query(collection(db, "notifications"), where("toUid", "==", currentUser.uid));
    const unsubPersonal = onSnapshot(personalQ, (snap) => {
      personalUnread = 0;
      snap.docs.forEach((d: any) => { if (!(d.data().readBy || []).includes(currentUser.uid)) personalUnread++; });
      setNotificationCount(personalUnread + reportUnread);
    });

    let unsubReport: (() => void) | null = null;
    if (currentUser.admin) {
      const reportQ = query(collection(db, "notifications"), where("type", "==", "report"));
      unsubReport = onSnapshot(reportQ, (snap) => {
        reportUnread = 0;
        snap.docs.forEach((d: any) => { if (!(d.data().readBy || []).includes(currentUser.uid)) reportUnread++; });
        setNotificationCount(personalUnread + reportUnread);
      });
    }
    return () => { unsubPersonal(); if (unsubReport) unsubReport(); };
  }, [currentUser?.uid, currentUser?.admin]);

  // トレンド集計
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      const tagCount: Record<string, number> = {};
      const stopWords = new Set(["の","に","は","を","が","で","と","た","て","も","な","い","る","し","れ","さ","ん","だ","か","ら","や","よ","ね","わ","け","ど","あ","う","え","お","http","https","www","rt","the","a","an","is","in","it","of","to","and","or","for"]);
      snap.docs.forEach((d: any) => {
        const normalized = (d.data().text || "").replace(/#/g, "");
        normalized.split(/[\s\u3000、。！？!?,.]+/).map((w: string) => w.toLowerCase().trim())
          .filter((w: string) => w.length >= 2 && !stopWords.has(w) && !/^\d+$/.test(w))
          .forEach((word: string) => { tagCount[word] = (tagCount[word] || 0) + 1; });
      });
      setTrends(Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tag, count]) => ({ tag, count })));
    });
    return () => unsub();
  }, []);

  // メニュー定義（PNG アイコン使用）
  const menus = [
    { href: "/",                         icon: "/icon-home.png",         label: "ホーム" },
    { href: "/search",                   icon: "/icon-search.png",       label: "検索" },
    { href: "/notifications",            icon: "/icon-notification.png", label: "通知" },
    { href: `/user/${currentUser?.uid}`, icon: "/icon-profile.png",      label: "プロフィール" },
    { href: "/bookmarks",                icon: "/icon-bookmarks.png",    label: "ブックマーク" },
    { href: "/settings",                 icon: "/icon-settings.png",     label: "設定" },
  ];

  // モバイル用メニュー（絵文字のまま）
  const mobileMenus = [
    { href: "/",                         emoji: "🏠" },
    { href: "/search",                   emoji: "🔎" },
    { href: "/notifications",            emoji: "🔔", badge: true },
    { href: "/bookmarks",                emoji: "🔖" },
    { href: `/user/${currentUser?.uid}`, emoji: "👤" },
    { href: "/settings",                 emoji: "⚙️" },
  ];

  const otherAccounts = savedAccounts.filter((a) => a.uid !== currentUser?.uid);

  return (
    <div className="bg-black text-white min-h-screen flex justify-center overflow-x-hidden">
      <div className="w-full max-w-7xl flex">

        {/* 左メニュー */}
        <div className="hidden md:flex w-[275px] h-screen sticky top-0 border-r border-zinc-800 px-4 py-3 flex-col">

          <Link href="/" className="w-14 h-14 rounded-full hover:bg-zinc-900 flex items-center justify-center mb-4 overflow-hidden">
            <img src="/logo.png" className="w-full h-full object-cover" />
          </Link>

          <div className="flex flex-col gap-1">
            {menus.map((menu) => (
              <Link key={menu.href} href={menu.href}
                className={`flex items-center gap-5 px-5 py-4 rounded-full text-2xl font-bold transition hover:bg-zinc-900 ${pathname === menu.href ? "bg-zinc-900" : ""}`}>
                <div className="relative w-8 h-8 shrink-0">
                  {/* PNG アイコン */}
                  <img
                    src={menu.icon}
                    alt={menu.label}
                    className="w-8 h-8 object-contain"
                  />
                  {/* 通知バッジ */}
                  {menu.href === "/notifications" && notificationCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center font-bold">
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </div>
                  )}
                </div>
                <span>{menu.label}</span>
              </Link>
            ))}
          </div>

          <button onClick={() => setShowPostModal(true)}
            className="mt-6 bg-blue-500 hover:bg-blue-600 transition rounded-full py-4 text-xl font-bold">
            クリート
          </button>

          {/* アカウントメニュー */}
          <div className="mt-auto relative" ref={menuRef}>
            {showAccountMenu && (
              <div className="absolute bottom-20 left-0 w-72 bg-black border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                <Link href={`/user/${currentUser?.uid}`} onClick={() => setShowAccountMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 transition">
                  <img src={currentUser?.icon || "/default.png"} className="w-10 h-10 rounded-full object-cover bg-zinc-700 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white truncate">{currentUser?.name || "ユーザー"}</div>
                    <div className="text-zinc-500 text-sm truncate">@{currentUser?.username || "user"}</div>
                  </div>
                  <span className="text-blue-400 text-xl shrink-0">✓</span>
                </Link>
                {otherAccounts.map((account) => (
                  <button key={account.uid} onClick={() => openSwitchModal(account)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 transition border-t border-zinc-800 w-full text-left">
                    <img src={account.icon || "/default.png"} className="w-10 h-10 rounded-full object-cover bg-zinc-700 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white truncate">{account.name}</div>
                      <div className="text-zinc-500 text-sm truncate">@{account.username}</div>
                    </div>
                  </button>
                ))}
                <div className="border-t border-zinc-800" />
                <Link href="/login" onClick={() => setShowAccountMenu(false)} className="block px-4 py-3 hover:bg-zinc-900 transition text-white font-bold">既存のアカウントを追加</Link>
                <div className="border-t border-zinc-800" />
                <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-zinc-900 transition text-white font-bold">
                  @{currentUser?.username || "user"} からログアウト
                </button>
              </div>
            )}
            <button onClick={() => setShowAccountMenu((prev) => !prev)}
              className="flex items-center gap-3 hover:bg-zinc-900 rounded-full p-3 transition w-full text-left">
              <img src={currentUser?.icon || "/default.png"} className="w-12 h-12 rounded-full object-cover bg-zinc-700 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{currentUser?.name || "ユーザー"}</div>
                <div className="text-zinc-500 text-sm truncate">@{currentUser?.username || "user"}</div>
              </div>
              <span className="text-zinc-500 text-lg">···</span>
            </button>
          </div>
        </div>

        {/* 真ん中 */}
        <main className="flex-1 border-r border-l border-zinc-800 min-h-screen max-w-[700px] w-full">
          {children}
        </main>

        {/* 右 */}
        <div className="hidden xl:block w-[350px] p-4">
          <div className="sticky top-4 space-y-4">
            <input placeholder="検索" className="w-full bg-zinc-900 rounded-full px-5 py-4 outline-none text-lg" />

            {/* トレンド */}
            <div className="bg-zinc-900 rounded-3xl overflow-hidden">
              <div className="p-5 text-2xl font-bold border-b border-zinc-800">トレンド</div>
              {trends.length === 0 ? (
                <div className="p-5 text-zinc-500 text-sm">トレンドはまだありません</div>
              ) : (
                trends.map((trend, i) => (
                  <Link key={i} href={`/search?q=${encodeURIComponent(trend.tag)}`}
                    className="block p-5 hover:bg-zinc-800 transition cursor-pointer border-t border-zinc-800 first:border-t-0">
                    <div className="text-zinc-500 text-sm">トレンド · {trend.count}件</div>
                    <div className="font-bold text-xl">{trend.tag}</div>
                  </Link>
                ))
              )}
            </div>

            {/* おすすめユーザー */}
            <div className="bg-zinc-900 rounded-3xl overflow-hidden">
              <div className="p-5 text-xl font-bold border-b border-zinc-800">おすすめユーザー</div>
              {recommendedUsers.length === 0 ? (
                <div className="p-5 text-zinc-500 text-sm">読み込み中...</div>
              ) : (
                recommendedUsers.map((user) => (
                  <Link key={user.uid} href={`/user/${user.uid}`}
                    className="flex items-center gap-3 p-4 hover:bg-zinc-800 transition border-t border-zinc-800 first:border-t-0">
                    <img src={user.icon || "/default.png"} className="w-12 h-12 rounded-full object-cover bg-zinc-700 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-bold text-white truncate">{user.name}</span>
                        {user.verified && <img src="/verified-blue.png" className="w-4 h-4 shrink-0" />}
                        {user.admin && <img src="/verified-gold.png" className="w-4 h-4 shrink-0" />}
                      </div>
                      <div className="text-zinc-500 text-sm truncate">@{user.username}</div>
                      <div className="text-zinc-500 text-xs mt-0.5">フォロワー {(user.followers || []).length.toLocaleString()}人</div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="text-zinc-500 text-sm px-2">Critter v1.0.5</div>
          </div>
        </div>

      </div>

      {/* モバイル下メニュー（絵文字のまま） */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 flex justify-around py-3 md:hidden z-50">
        {mobileMenus.map((m) => (
          <Link key={m.href} href={m.href} className="relative">
            {m.emoji}
            {m.badge && notificationCount > 0 && (
              <div className="absolute -top-2 -right-3 bg-blue-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold">
                {notificationCount > 99 ? "99+" : notificationCount}
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* 投稿モーダル */}
      {showPostModal && <PostModal currentUser={currentUser} onClose={() => setShowPostModal(false)} />}

      {/* アカウント切り替えモーダル */}
      {switchTarget && (
        <>
          <div className="fixed inset-0 z-40 bg-black/70" onClick={() => { setSwitchTarget(null); setPassword(""); setSwitchError(""); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="w-full max-w-sm bg-black border border-zinc-700 rounded-2xl shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <img src={switchTarget.icon || "/default.png"} className="w-12 h-12 rounded-full object-cover bg-zinc-700" />
                <div>
                  <div className="font-bold text-white">{switchTarget.name}</div>
                  <div className="text-zinc-500 text-sm">@{switchTarget.username}</div>
                </div>
              </div>
              <h2 className="font-bold text-white text-lg mb-1">パスワードを入力</h2>
              <p className="text-zinc-500 text-sm mb-4">アカウントを切り替えるにはパスワードが必要です</p>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSwitch(); }}
                placeholder="パスワード" autoFocus
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition mb-3" />
              {switchError && <p className="text-red-500 text-sm mb-3">{switchError}</p>}
              <div className="flex gap-3">
                <button onClick={() => { setSwitchTarget(null); setPassword(""); setSwitchError(""); }}
                  className="flex-1 border border-zinc-700 py-2.5 rounded-full font-bold hover:bg-zinc-900 transition">キャンセル</button>
                <button onClick={handleSwitch} disabled={!password || switchLoading}
                  className="flex-1 bg-white text-black py-2.5 rounded-full font-bold disabled:opacity-40 hover:bg-zinc-200 transition">
                  {switchLoading ? "切り替え中..." : "切り替え"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}