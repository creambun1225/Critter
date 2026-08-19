"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export default function ProfilePage() {
  const params = useParams();
  const uid = params.uid as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);

  const [showMenu, setShowMenu] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      try {
        const userSnap = await getDoc(doc(db, "users", uid));

        if (!userSnap.exists()) {
          setLoading(false);
          return;
        }

        const data = userSnap.data();
        setUserData(data);

        if (user) {
          const currentSnap = await getDoc(
            doc(db, "users", user.uid)
          );

          if (currentSnap.exists()) {
            const currentData = currentSnap.data();
            const followingList = currentData.following || [];

            setIsFollowing(
              followingList.includes(uid)
            );
          }
        }

        // フォロワー取得
        const followerQuery = query(
          collection(db, "users"),
          where("following", "array-contains", uid)
        );

        const followerSnap = await getDocs(
          followerQuery
        );

        setFollowers(
          followerSnap.docs.map((d) => ({
            uid: d.id,
            ...d.data(),
          }))
        );

        // フォロー中取得
        const followingIds = data.following || [];

        if (followingIds.length > 0) {
          const results: any[] = [];

          // Firestoreのwhere in制限を避けるため10件ずつ取得
          for (let i = 0; i < followingIds.length; i += 10) {
            const chunk = followingIds.slice(i, i + 10);

            const q = query(
              collection(db, "users"),
              where("__name__", "in", chunk)
            );

            const snap = await getDocs(q);

            snap.docs.forEach((d) => {
              results.push({
                uid: d.id,
                ...d.data(),
              });
            });
          }

          setFollowing(results);
        } else {
          setFollowing([]);
        }
      } catch (error) {
        console.error(
          "Profile loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [uid]);

  const followUser = async () => {
    if (!currentUser || currentUser.uid === uid) {
      return;
    }

    try {
      const currentRef = doc(
        db,
        "users",
        currentUser.uid
      );

      const targetRef = doc(
        db,
        "users",
        uid
      );

      const currentSnap = await getDoc(currentRef);
      const targetSnap = await getDoc(targetRef);

      if (
        !currentSnap.exists() ||
        !targetSnap.exists()
      ) {
        return;
      }

      const currentData = currentSnap.data();
      const targetData = targetSnap.data();

      const currentFollowing =
        currentData.following || [];

      const targetFollowers =
        targetData.followers || [];

      if (currentFollowing.includes(uid)) {
        await updateDoc(currentRef, {
          following: currentFollowing.filter(
            (id: string) => id !== uid
          ),
        });

        await updateDoc(targetRef, {
          followers: targetFollowers.filter(
            (id: string) =>
              id !== currentUser.uid
          ),
        });

        setIsFollowing(false);
      } else {
        await updateDoc(currentRef, {
          following: [
            ...currentFollowing,
            uid,
          ],
        });

        await updateDoc(targetRef, {
          followers: [
            ...targetFollowers,
            currentUser.uid,
          ],
        });

        setIsFollowing(true);
      }

      // フォロワー一覧を再取得
      const followerQuery = query(
        collection(db, "users"),
        where(
          "following",
          "array-contains",
          uid
        )
      );

      const followerSnap =
        await getDocs(followerQuery);

      setFollowers(
        followerSnap.docs.map((d) => ({
          uid: d.id,
          ...d.data(),
        }))
      );
    } catch (error) {
      console.error(
        "Follow error:",
        error
      );

      alert("フォロー処理に失敗しました");
    }
  };

  // 青色の認証マークを付与
  const grantVerification = async () => {
    if (!currentUser) return;

    try {
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

      alert(
        "認証マークの付与に失敗しました"
      );
    }
  };

  // 認証マーク
  const VerificationMark = ({
    user,
  }: {
    user: any;
  }) => {
    if (user?.admin === true) {
      return (
        <img
          src="/verified-gold.png"
          alt="管理者認証"
          title="管理者"
          className="w-5 h-5 object-contain shrink-0"
        />
      );
    }

    if (user?.verified === true) {
      return (
        <img
          src="/verified-blue.png"
          alt="認証済み"
          title="認証済み"
          className="w-5 h-5 object-contain shrink-0"
        />
      );
    }

    return null;
  };

  if (loading) {
    return (
      <Layout currentUser={currentUser}>
        <div className="min-h-screen flex items-center justify-center text-zinc-400">
          読み込み中...
        </div>
      </Layout>
    );
  }

  if (!userData) {
    return (
      <Layout currentUser={currentUser}>
        <div className="min-h-screen flex items-center justify-center text-zinc-400">
          ユーザーが見つかりません
        </div>
      </Layout>
    );
  }

  const isOwnProfile =
    currentUser?.uid === uid;

  return (
    <Layout
      currentUser={
        currentUser
          ? {
              ...currentUser,
              ...userData,
            }
          : null
      }
    >
      <div className="min-h-screen bg-black text-white">

        {/* プロフィール */}
        <div className="border-b border-zinc-800">

          {/* バナー */}
          <div className="h-48 bg-zinc-800 overflow-hidden">
            {userData.banner ||
            userData.headerImage ? (
              <img
                src={
                  userData.banner ||
                  userData.headerImage
                }
                alt="バナー"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-500 to-blue-700" />
            )}
          </div>

          <div className="px-5">

            {/* アイコン */}
            <div className="relative -mt-16 mb-4">
              <img
                src={
                  userData.icon ||
                  "/default.png"
                }
                alt="アイコン"
                className="w-32 h-32 rounded-full border-4 border-black object-cover bg-zinc-800"
              />
            </div>

            {/* ボタン */}
            <div className="flex justify-end -mt-16 mb-5 relative">

              {isOwnProfile ? (
                <Link
                  href={`/user/${uid}/edit`}
                  className="px-5 py-2.5 border border-zinc-700 rounded-full font-bold hover:bg-zinc-900 transition"
                >
                  プロフィールを編集
                </Link>
              ) : (
                <button
                  onClick={followUser}
                  className={`px-5 py-2.5 rounded-full font-bold transition ${
                    isFollowing
                      ? "border border-zinc-700 hover:bg-red-500/10"
                      : "bg-white text-black hover:bg-zinc-200"
                  }`}
                >
                  {isFollowing
                    ? "フォロー中"
                    : "フォロー"}
                </button>
              )}

              {/* 3点メニュー */}
              <div className="relative ml-2">

                <button
                  onClick={() =>
                    setShowMenu(!showMenu)
                  }
                  className="w-10 h-10 rounded-full border border-zinc-700 hover:bg-zinc-900 flex items-center justify-center"
                >
                  ⋯
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-12 w-56 bg-black border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden z-50">

                    <button
                      onClick={grantVerification}
                      className="w-full text-left px-4 py-3 hover:bg-zinc-900 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <img
                          src="/verified-blue.png"
                          alt=""
                          className="w-5 h-5 object-contain"
                        />
                        認証マークを付与
                      </span>
                    </button>

                  </div>
                )}

              </div>
            </div>

            {/* 名前 */}
            <div className="mb-5">

              <div className="flex items-center gap-2">

                <h1 className="text-2xl font-bold">
                  {userData.name ||
                    "ユーザー"}
                </h1>

                <VerificationMark
                  user={userData}
                />

              </div>

              <p className="text-zinc-500">
                @{userData.username ||
                  "user"}
              </p>

              {userData.bio && (
                <p className="mt-4 whitespace-pre-wrap">
                  {userData.bio}
                </p>
              )}

              {userData.link ||
              userData.website ? (
                <a
                  href={
                    userData.link ||
                    userData.website
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline block mt-3 break-all"
                >
                  🔗{" "}
                  {userData.link ||
                    userData.website}
                </a>
              ) : null}

            </div>

            {/* フォロー数 */}
            <div className="flex gap-5 pb-5">

              <button
                onClick={() => {
                  setShowFollowing(true);
                  setShowFollowers(false);
                }}
                className="hover:underline"
              >
                <span className="font-bold">
                  {following.length}
                </span>{" "}
                <span className="text-zinc-500">
                  フォロー中
                </span>
              </button>

              <button
                onClick={() => {
                  setShowFollowers(true);
                  setShowFollowing(false);
                }}
                className="hover:underline"
              >
                <span className="font-bold">
                  {followers.length}
                </span>{" "}
                <span className="text-zinc-500">
                  フォロワー
                </span>
              </button>

            </div>

          </div>
        </div>

        {/* フォロワー・フォロー中 */}
        {(showFollowers ||
          showFollowing) && (
          <div className="border-b border-zinc-800">

            {/* タブ */}
            <div className="flex border-b border-zinc-800">

              <button
                onClick={() => {
                  setShowFollowers(true);
                  setShowFollowing(false);
                }}
                className={`flex-1 py-4 font-bold ${
                  showFollowers
                    ? "border-b-2 border-blue-500"
                    : "text-zinc-500"
                }`}
              >
                フォロワー
              </button>

              <button
                onClick={() => {
                  setShowFollowing(true);
                  setShowFollowers(false);
                }}
                className={`flex-1 py-4 font-bold ${
                  showFollowing
                    ? "border-b-2 border-blue-500"
                    : "text-zinc-500"
                }`}
              >
                フォロー中
              </button>

            </div>

            {/* ユーザー一覧 */}
            <div>

              {(showFollowers
                ? followers
                : following
              ).length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  {showFollowers
                    ? "フォロワーはいません"
                    : "フォローしているユーザーはいません"}
                </div>
              ) : (
                (showFollowers
                  ? followers
                  : following
                ).map((user) => (
                  <Link
                    key={user.uid}
                    href={`/user/${user.uid}`}
                    className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800 hover:bg-zinc-900 transition"
                  >
                    <img
                      src={
                        user.icon ||
                        "/default.png"
                      }
                      className="w-12 h-12 rounded-full object-cover"
                      alt=""
                    />

                    <div className="min-w-0">

                      <div className="flex items-center gap-1">

                        <span className="font-bold truncate">
                          {user.name ||
                            "ユーザー"}
                        </span>

                        <VerificationMark
                          user={user}
                        />

                      </div>

                      <div className="text-sm text-zinc-500 truncate">
                        @
                        {user.username ||
                          "user"}
                      </div>

                    </div>
                  </Link>
                ))
              )}

            </div>
          </div>
        )}

        {/* 投稿 */}
        {!showFollowers &&
          !showFollowing && (
          <div className="py-16 text-center text-zinc-500">
            ここにユーザーのクリートが表示されます
          </div>
        )}

      </div>
    </Layout>
  );
}