"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import Layout from "@/components/Layout";

type ViewMode = "profile" | "followers" | "following";

export default function UserPage() {
  const params = useParams();
  const uid = params.uid as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);

  const [showMenu, setShowMenu] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("profile");

  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!uid) return;

      try {
        const targetSnap = await getDoc(doc(db, "users", uid));

        if (targetSnap.exists()) {
          setUserData({
            uid,
            ...targetSnap.data(),
          });
        }

        if (auth.currentUser) {
          const meSnap = await getDoc(
            doc(db, "users", auth.currentUser.uid)
          );

          if (meSnap.exists()) {
            const me = meSnap.data();

            setCurrentUser({
              uid: auth.currentUser.uid,
              ...me,
            });

            setIsFollowing(
              Array.isArray(me.following) &&
                me.following.includes(uid)
            );
          }
        }
      } catch (error) {
        console.error("プロフィール読み込みエラー:", error);
      }
    };

    load();
  }, [uid]);

  /* =========================
     フォロワー取得
  ========================= */

  const loadFollowers = async () => {
    setLoadingList(true);

    try {
      const q = query(
        collection(db, "users"),
        where("following", "array-contains", uid)
      );

      const snap = await getDocs(q);

      const users = snap.docs.map((item) => ({
        uid: item.id,
        ...item.data(),
      }));

      setFollowers(users);
      setViewMode("followers");
    } catch (error) {
      console.error("フォロワー取得エラー:", error);
    } finally {
      setLoadingList(false);
    }
  };

  /* =========================
     フォロー中取得
  ========================= */

  const loadFollowing = async () => {
    setLoadingList(true);

    try {
      const targetSnap = await getDoc(
        doc(db, "users", uid)
      );

      if (!targetSnap.exists()) {
        setFollowing([]);
        setViewMode("following");
        return;
      }

      const data = targetSnap.data();

      const followingIds = Array.isArray(data.following)
        ? data.following
        : [];

      const users: any[] = [];

      for (const followingUid of followingIds) {
        try {
          const snap = await getDoc(
            doc(db, "users", followingUid)
          );

          if (snap.exists()) {
            users.push({
              uid: followingUid,
              ...snap.data(),
            });
          }
        } catch (error) {
          console.error(error);
        }
      }

      setFollowing(users);
      setViewMode("following");
    } catch (error) {
      console.error("フォロー中取得エラー:", error);
    } finally {
      setLoadingList(false);
    }
  };

  /* =========================
     フォロー / フォロー解除
  ========================= */

  const followUser = async () => {
    if (!auth.currentUser) return;
    if (auth.currentUser.uid === uid) return;

    try {
      const meRef = doc(
        db,
        "users",
        auth.currentUser.uid
      );

      const targetRef = doc(
        db,
        "users",
        uid
      );

      if (isFollowing) {
        await updateDoc(meRef, {
          following: arrayRemove(uid),
        });

        await updateDoc(targetRef, {
          followers: arrayRemove(auth.currentUser.uid),
        });

        setIsFollowing(false);

        setUserData((prev: any) => ({
          ...prev,
          followers: Array.isArray(prev.followers)
            ? prev.followers.filter(
                (id: string) =>
                  id !== auth.currentUser?.uid
              )
            : [],
        }));
      } else {
        await updateDoc(meRef, {
          following: arrayUnion(uid),
        });

        await updateDoc(targetRef, {
          followers: arrayUnion(
            auth.currentUser.uid
          ),
        });

        setIsFollowing(true);

        setUserData((prev: any) => ({
          ...prev,
          followers: [
            ...(Array.isArray(prev.followers)
              ? prev.followers
              : []),
            auth.currentUser?.uid,
          ],
        }));
      }
    } catch (error) {
      console.error(error);
      alert("フォロー処理に失敗しました");
    }
  };

  /* =========================
     認証マーク付与
  ========================= */

  const giveVerification = async () => {
    if (!auth.currentUser) return;

    try {
      const meSnap = await getDoc(
        doc(db, "users", auth.currentUser.uid)
      );

      if (
        !meSnap.exists() ||
        meSnap.data()?.admin !== true
      ) {
        alert("管理者権限が必要です");
        return;
      }

      await updateDoc(
        doc(db, "users", uid),
        {
          verified: true,
        }
      );

      setUserData((prev: any) => ({
        ...prev,
        verified: true,
      }));

      setShowMenu(false);

      alert("認証マークを付与しました");
    } catch (error) {
      console.error(error);
      alert("認証マークの付与に失敗しました");
    }
  };

  /* =========================
     戻る
  ========================= */

  const goBackToProfile = () => {
    setViewMode("profile");
  };

  /* =========================
     ユーザー一覧
  ========================= */

  const renderUserList = (
    users: any[],
    title: string
  ) => {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* 一覧ヘッダー */}

        <div className="sticky top-0 z-30 bg-black/90 backdrop-blur border-b border-zinc-800">
          <div className="h-16 px-4 flex items-center gap-4">
            <button
              onClick={goBackToProfile}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-900 transition text-2xl"
            >
              ←
            </button>

            <div>
              <h1 className="font-bold text-xl">
                {title}
              </h1>

              <p className="text-xs text-zinc-500">
                {userData?.name || "ユーザー"}
              </p>
            </div>
          </div>
        </div>

        {/* 一覧 */}

        {loadingList ? (
          <div className="py-16 text-center text-zinc-500">
            読み込み中...
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-zinc-500">
            {title === "フォロワー"
              ? "フォロワーはいません"
              : "フォロー中のユーザーはいません"}
          </div>
        ) : (
          <div>
            {users.map((user) => (
              <Link
                key={user.uid}
                href={`/user/${user.uid}`}
                className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800 hover:bg-zinc-900 transition"
              >
                <img
                  src={user.icon || "/default.png"}
                  className="w-12 h-12 rounded-full object-cover bg-zinc-800 shrink-0"
                  alt=""
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-bold truncate">
                      {user.name || "ユーザー"}
                    </span>

                    {user.verified === true && (
                      <span
                        title="認証済み"
                        className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0"
                      >
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-zinc-500 truncate">
                    @{user.username || "user"}
                  </div>

                  {user.bio && (
                    <div className="text-sm text-zinc-400 mt-1 truncate">
                      {user.bio}
                    </div>
                  )}
                </div>

                {auth.currentUser?.uid !==
                  user.uid && (
                  <span className="border border-zinc-600 rounded-full px-4 py-1.5 text-sm font-bold shrink-0">
                    プロフィール
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  /* =========================
     読み込み中
  ========================= */

  if (!userData) {
    return (
      <Layout currentUser={currentUser}>
        <div className="p-6 text-white">
          読み込み中...
        </div>
      </Layout>
    );
  }

  const followerCount = Array.isArray(
    userData.followers
  )
    ? userData.followers.length
    : 0;

  const followingCount = Array.isArray(
    userData.following
  )
    ? userData.following.length
    : 0;

  /* =========================
     フォロワー / フォロー中画面
  ========================= */

  if (viewMode === "followers") {
    return (
      <Layout currentUser={currentUser}>
        {renderUserList(
          followers,
          "フォロワー"
        )}
      </Layout>
    );
  }

  if (viewMode === "following") {
    return (
      <Layout currentUser={currentUser}>
        {renderUserList(
          following,
          "フォロー中"
        )}
      </Layout>
    );
  }

  /* =========================
     プロフィール画面
  ========================= */

  return (
    <Layout currentUser={currentUser}>
      <div className="text-white min-h-screen bg-black">

        {/* =========================
            プロフィール上部
        ========================= */}

        <div className="sticky top-0 z-30 bg-black/90 backdrop-blur border-b border-zinc-800">
          <div className="h-16 px-4 flex items-center gap-4">

            <Link
              href="/"
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-900 transition text-2xl"
            >
              ←
            </Link>

            <div className="min-w-0">
              <h1 className="font-bold text-xl truncate">
                {userData.name || "ユーザー"}
                {userData.verified === true && (
                  <span className="inline-flex ml-1 align-middle w-5 h-5 rounded-full bg-blue-500 text-white items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                )}
              </h1>

              <p className="text-xs text-zinc-500">
                {userData.postsCount ??
                  userData.postCount ??
                  0}{" "}
                件のクリート
              </p>
            </div>

            {/* 右上メニュー */}

            <div className="ml-auto relative">

              <button
                onClick={() =>
                  setShowMenu(!showMenu)
                }
                className="w-10 h-10 rounded-full hover:bg-zinc-900 flex items-center justify-center text-2xl"
              >
                ⋯
              </button>

              {showMenu && (
                <div className="absolute right-0 top-12 w-60 bg-black border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden z-50">

                  <button
                    onClick={giveVerification}
                    className="w-full text-left px-4 py-3 hover:bg-zinc-900 transition"
                  >
                    ☑️ 認証マークを付与
                  </button>

                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================
            ヘッダー画像
        ========================= */}

        <div className="relative">

          <div className="w-full aspect-[3/1] bg-zinc-900 overflow-hidden">
            {userData.banner ? (
              <img
                src={userData.banner}
                className="w-full h-full object-cover"
                alt=""
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-sky-300 via-blue-300 to-blue-500 flex items-center justify-center">
                <span className="text-white/80 text-3xl font-bold">
                  {userData.name || "Critter"}
                </span>
              </div>
            )}
          </div>

          {/* =========================
              アイコン
          ========================= */}

          <div className="absolute left-4 -bottom-14">
            <div className="w-28 h-28 rounded-full bg-black p-1">
              <img
                src={userData.icon || "/default.png"}
                className="w-full h-full rounded-full object-cover bg-zinc-800"
                alt=""
              />
            </div>
          </div>
        </div>

        {/* =========================
            プロフィール情報
        ========================= */}

        <div className="px-4 pt-16 pb-5 border-b border-zinc-800">

          {/* プロフィール編集 / フォロー */}

          <div className="flex justify-end mb-4">

            {auth.currentUser?.uid === uid ? (
              <button
                onClick={() =>
                  (location.href = "/settings")
                }
                className="border border-zinc-600 hover:bg-zinc-900 px-5 py-2 rounded-full font-bold transition"
              >
                プロフィールを編集
              </button>
            ) : (
              <button
                onClick={followUser}
                className={`px-6 py-2 rounded-full font-bold transition ${
                  isFollowing
                    ? "bg-transparent border border-zinc-600 text-white hover:bg-red-500/10 hover:text-red-400 hover:border-red-400"
                    : "bg-white text-black hover:bg-zinc-200"
                }`}
              >
                {isFollowing
                  ? "フォロー中"
                  : "フォロー"}
              </button>
            )}

          </div>

          {/* 名前 */}

          <div className="flex items-center gap-1">
            <h2 className="text-2xl font-bold">
              {userData.name || "ユーザー"}
            </h2>

            {userData.verified === true && (
              <span
                title="認証済み"
                className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold"
              >
                ✓
              </span>
            )}
          </div>

          {/* ユーザー名 */}

          <p className="text-zinc-500 mt-1">
            @{userData.username || "user"}
          </p>

          {/* 自己紹介 */}

          {userData.bio && (
            <p className="mt-4 whitespace-pre-wrap leading-relaxed">
              {userData.bio}
            </p>
          )}

          {/* プロフィール詳細 */}

          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-zinc-500">

            {userData.website && (
              <a
                href={userData.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                🔗 {userData.website}
              </a>
            )}

            {userData.birthday && (
              <span>
                🎂 {userData.birthday}
              </span>
            )}

            {userData.createdAt && (
              <span>
                📅 Critterに参加
              </span>
            )}

          </div>

          {/* =========================
              フォロー数
          ========================= */}

          <div className="flex gap-6 mt-5">

            <button
              onClick={loadFollowing}
              className="hover:underline"
            >
              <span className="font-bold">
                {followingCount}
              </span>{" "}
              <span className="text-zinc-500">
                フォロー中
              </span>
            </button>

            <button
              onClick={loadFollowers}
              className="hover:underline"
            >
              <span className="font-bold">
                {followerCount}
              </span>{" "}
              <span className="text-zinc-500">
                フォロワー
              </span>
            </button>

          </div>
        </div>

        {/* =========================
            認証案内
        ========================= */}

        {userData.verified !== true &&
          auth.currentUser?.uid === uid && (
            <div className="mx-4 my-4 bg-green-950 border border-green-900 rounded-2xl p-5">

              <div className="flex items-start justify-between gap-3">

                <div>
                  <div className="text-xl font-bold text-green-200">
                    まだ認証されていません ✓
                  </div>

                  <p className="text-sm text-green-300 mt-2 leading-relaxed">
                    認証を受けると、返信の強化、アナリティクス、
                    広告のないブラウジングなどを利用できます。
                  </p>

                  <button
                    onClick={() =>
                      alert(
                        "認証機能は現在準備中です"
                      )
                    }
                    className="mt-4 bg-white text-black px-5 py-2 rounded-full font-bold hover:bg-zinc-200"
                  >
                    認証される
                  </button>
                </div>

                <button className="text-green-300 text-xl">
                  ×
                </button>

              </div>
            </div>
          )}

        {/* =========================
            投稿タブ
        ========================= */}

        <div className="grid grid-cols-4 border-b border-zinc-800">

          <button className="relative py-4 text-sm font-bold hover:bg-zinc-900">
            ポスト
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-blue-500 rounded-full" />
          </button>

          <button className="py-4 text-sm text-zinc-500 hover:bg-zinc-900">
            返信
          </button>

          <button className="py-4 text-sm text-zinc-500 hover:bg-zinc-900">
            リポスト
          </button>

          <button className="py-4 text-sm text-zinc-500 hover:bg-zinc-900">
            メディア
          </button>

        </div>

        {/* =========================
            投稿エリア
        ========================= */}

        <div className="px-6 py-8 text-center text-zinc-500">
          このユーザーのクリートがここに表示されます。
        </div>

      </div>
    </Layout>
  );
}