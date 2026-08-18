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

export default function UserPage() {
  const params = useParams();
  const uid = params.uid as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);

  const [showMenu, setShowMenu] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!uid) return;

      const targetSnap = await getDoc(doc(db, "users", uid));

      if (targetSnap.exists()) {
        setUserData({
          uid,
          ...targetSnap.data(),
        });
      }

      if (auth.currentUser) {
        const meSnap = await getDoc(doc(db, "users", auth.currentUser.uid));

        if (meSnap.exists()) {
          const me = meSnap.data();

          setCurrentUser({
            uid: auth.currentUser.uid,
            ...me,
          });

          setIsFollowing(
            Array.isArray(me.following) && me.following.includes(uid)
          );
        }
      }
    };

    load();
  }, [uid]);

  const loadFollowers = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("following", "array-contains", uid)
      );

      const snap = await getDocs(q);

      setFollowers(
        snap.docs.map((item) => ({
          uid: item.id,
          ...item.data(),
        }))
      );

      setShowFollowers(true);
    } catch (error) {
      console.error(error);
    }
  };

  const loadFollowing = async () => {
    try {
      const targetSnap = await getDoc(doc(db, "users", uid));

      if (!targetSnap.exists()) return;

      const data = targetSnap.data();
      const followingIds = Array.isArray(data.following)
        ? data.following
        : [];

      const users: any[] = [];

      for (const followingUid of followingIds) {
        const snap = await getDoc(doc(db, "users", followingUid));

        if (snap.exists()) {
          users.push({
            uid: followingUid,
            ...snap.data(),
          });
        }
      }

      setFollowing(users);
      setShowFollowing(true);
    } catch (error) {
      console.error(error);
    }
  };

  const followUser = async () => {
    if (!auth.currentUser || auth.currentUser.uid === uid) return;

    try {
      const meRef = doc(db, "users", auth.currentUser.uid);
      const targetRef = doc(db, "users", uid);

      if (isFollowing) {
        await updateDoc(meRef, {
          following: arrayRemove(uid),
        });

        await updateDoc(targetRef, {
          followers: arrayRemove(auth.currentUser.uid),
        });

        setIsFollowing(false);
      } else {
        await updateDoc(meRef, {
          following: arrayUnion(uid),
        });

        await updateDoc(targetRef, {
          followers: arrayUnion(auth.currentUser.uid),
        });

        setIsFollowing(true);
      }
    } catch (error) {
      console.error(error);
      alert("フォロー処理に失敗しました");
    }
  };

  const giveVerification = async () => {
    if (!auth.currentUser) return;

    try {
      const meSnap = await getDoc(
        doc(db, "users", auth.currentUser.uid)
      );

      if (!meSnap.exists() || meSnap.data()?.admin !== true) {
        alert("管理者権限が必要です");
        return;
      }

      await updateDoc(doc(db, "users", uid), {
        verified: true,
      });

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

  if (!userData) {
    return (
      <Layout currentUser={currentUser}>
        <div className="p-6 text-white">読み込み中...</div>
      </Layout>
    );
  }

  const followerCount = Array.isArray(userData.followers)
    ? userData.followers.length
    : 0;

  const followingCount = Array.isArray(userData.following)
    ? userData.following.length
    : 0;

  return (
    <Layout currentUser={currentUser}>
      <div className="text-white">
        {/* ヘッダー */}
        <div className="sticky top-0 z-20 bg-black/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="text-2xl hover:bg-zinc-900 rounded-full w-10 h-10 flex items-center justify-center"
          >
            ←
          </Link>

          <div>
            <h1 className="font-bold text-xl">プロフィール</h1>
          </div>

          <div className="ml-auto relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 rounded-full hover:bg-zinc-900 flex items-center justify-center text-2xl"
            >
              ⋯
            </button>

            {showMenu && (
              <div className="absolute right-0 top-12 w-56 bg-black border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden z-50">
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

        {/* プロフィール */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-start justify-between">
            <img
              src={userData.icon || "/default.png"}
              className="w-24 h-24 rounded-full object-cover bg-zinc-800"
              alt=""
            />

            {auth.currentUser?.uid !== uid && (
              <button
                onClick={followUser}
                className={`px-6 py-2 rounded-full font-bold transition ${
                  isFollowing
                    ? "bg-transparent border border-zinc-600 text-white hover:bg-red-500/10 hover:text-red-400 hover:border-red-400"
                    : "bg-white text-black hover:bg-zinc-200"
                }`}
              >
                {isFollowing ? "フォロー中" : "フォロー"}
              </button>
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2">
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

            <p className="text-zinc-500">
              @{userData.username || "user"}
            </p>

            {userData.bio && (
              <p className="mt-4 whitespace-pre-wrap">{userData.bio}</p>
            )}
          </div>

          {/* フォロー・フォロワー */}
          <div className="flex gap-6 mt-5">
            <button
              onClick={loadFollowing}
              className="hover:underline"
            >
              <span className="font-bold">{followingCount}</span>{" "}
              <span className="text-zinc-500">フォロー中</span>
            </button>

            <button
              onClick={loadFollowers}
              className="hover:underline"
            >
              <span className="font-bold">{followerCount}</span>{" "}
              <span className="text-zinc-500">フォロワー</span>
            </button>
          </div>
        </div>

        {/* フォロー中一覧 */}
        {showFollowing && (
          <div className="border-b border-zinc-800">
            <div className="flex items-center justify-between px-6 py-4">
              <h3 className="text-xl font-bold">フォロー中</h3>

              <button
                onClick={() => setShowFollowing(false)}
                className="text-zinc-500 hover:text-white"
              >
                閉じる
              </button>
            </div>

            {following.length === 0 ? (
              <p className="text-center text-zinc-500 py-8">
                フォロー中のユーザーはいません
              </p>
            ) : (
              following.map((user) => (
                <Link
                  key={user.uid}
                  href={`/user/${user.uid}`}
                  className="flex items-center gap-3 px-6 py-4 hover:bg-zinc-900 border-t border-zinc-800"
                >
                  <img
                    src={user.icon || "/default.png"}
                    className="w-12 h-12 rounded-full object-cover"
                    alt=""
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold truncate">
                        {user.name || "ユーザー"}
                      </span>

                      {user.verified === true && (
                        <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-zinc-500 truncate">
                      @{user.username || "user"}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* フォロワー一覧 */}
        {showFollowers && (
          <div className="border-b border-zinc-800">
            <div className="flex items-center justify-between px-6 py-4">
              <h3 className="text-xl font-bold">フォロワー</h3>

              <button
                onClick={() => setShowFollowers(false)}
                className="text-zinc-500 hover:text-white"
              >
                閉じる
              </button>
            </div>

            {followers.length === 0 ? (
              <p className="text-center text-zinc-500 py-8">
                フォロワーはいません
              </p>
            ) : (
              followers.map((user) => (
                <Link
                  key={user.uid}
                  href={`/user/${user.uid}`}
                  className="flex items-center gap-3 px-6 py-4 hover:bg-zinc-900 border-t border-zinc-800"
                >
                  <img
                    src={user.icon || "/default.png"}
                    className="w-12 h-12 rounded-full object-cover"
                    alt=""
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold truncate">
                        {user.name || "ユーザー"}
                      </span>

                      {user.verified === true && (
                        <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-zinc-500 truncate">
                      @{user.username || "user"}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* 投稿部分 */}
        <div className="px-6 py-8 text-center text-zinc-500">
          このユーザーのクリートがここに表示されます。
        </div>
      </div>
    </Layout>
  );
}