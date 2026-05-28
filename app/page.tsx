"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";
import { db, auth } from "@/lib/firebase";

import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  addDoc,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

// ───────────────────────────────────────
// フォローリストモーダル
// ───────────────────────────────────────
function FollowListModal({
  title,
  uids,
  onClose
}: {
  title: string;
  uids: string[];
  onClose: () => void;
}) {

  const [users, setUsers] =
    useState<any[]>([]);

  useEffect(() => {

    if (uids.length === 0) {

      setUsers([]);
      return;

    }

    Promise.all(

      uids.map(async (uid) => {

        const snap =
          await getDoc(
            doc(db, "users", uid)
          );

        return snap.exists()
          ? {
              uid,
              ...snap.data()
            }
          : null;

      })

    ).then((r) =>
      setUsers(
        r.filter(Boolean)
      )
    );

  }, [uids]);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/70"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">

        <div className="w-full max-w-md bg-black border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">

          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">

            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-900"
            >

              ✕

            </button>

            <h2 className="font-bold text-white text-lg">

              {title}

            </h2>

            <div className="w-10" />

          </div>

          <div className="overflow-y-auto">

            {users.length === 0 ? (

              <p className="text-center text-zinc-500 py-10">

                まだいません

              </p>

            ) : (

              users.map((user) => (

                <Link
                  key={user.uid}
                  href={`/user/${user.uid}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 transition"
                >

                  <img
                    src={
                      user.icon ||
                      "/default.png"
                    }
                    className="w-10 h-10 rounded-full object-cover bg-zinc-700 shrink-0"
                  />

                  <div className="min-w-0">

                    <div className="flex items-center gap-1">

                      <span className="font-bold text-white truncate">

                        {user.name}

                      </span>

                      {user.verified && (

                        <img
                          src="/verified-blue.png"
                          className="w-4 h-4"
                        />

                      )}

                      {user.admin && (

                        <img
                          src="/verified-gold.png"
                          className="w-4 h-4"
                        />

                      )}

                    </div>

                    <div className="text-zinc-500 text-sm truncate">

                      @{user.username}

                    </div>

                  </div>

                </Link>

              ))

            )}

          </div>

        </div>

      </div>
    </>
  );

}

// ───────────────────────────────────────
// メインページ
// ───────────────────────────────────────
export default function UserProfile() {

  const params =
    useParams();

  // ← 修正ポイント
  const uid =
    typeof params.uid === "string"
      ? params.uid
      : "";

  const [profile, setProfile] =
    useState<any>(null);

  const [me, setMe] =
    useState<any>(null);

  const [currentUser, setCurrentUser] =
    useState<any>(null);

  const [followers, setFollowers] =
    useState<string[]>([]);

  const [following, setFollowing] =
    useState<string[]>([]);

  const [posts, setPosts] =
    useState<any[]>([]);

  const [tab, setTab] =
    useState<"posts" | "reposts">(
      "posts"
    );

  const [followModal, setFollowModal] =
    useState<
      null |
      "followers" |
      "following"
    >(null);

  // ─────────────────────
  // ユーザー取得
  // ─────────────────────
  useEffect(() => {

    // ← 修正ポイント
    if (!uid) return;

    const unsub =
      onAuthStateChanged(
        auth,

        async (user) => {

          if (!user) {

            location.href =
              "/login";

            return;

          }

          setMe(user);

          const profileSnap =
            await getDoc(
              doc(
                db,
                "users",
                uid
              )
            );

          if (
            profileSnap.exists()
          ) {

            const data =
              profileSnap.data();

            setProfile({
              uid,
              ...data
            });

            setFollowers(
              data.followers || []
            );

          }

          const mySnap =
            await getDoc(
              doc(
                db,
                "users",
                user.uid
              )
            );

          if (mySnap.exists()) {

            const myData =
              mySnap.data();

            setFollowing(
              myData.following || []
            );

            setCurrentUser({
              uid: user.uid,
              ...myData
            });

          }

        }

      );

    return () => unsub();

  }, [uid]);

  // ─────────────────────
  // 投稿取得
  // ─────────────────────
  useEffect(() => {

    // ← 修正ポイント
    if (!uid) return;

    const q = query(

      collection(
        db,
        "posts"
      ),

      where(
        "uid",
        "==",
        uid
      ),

      orderBy(
        "createdAt",
        "desc"
      )

    );

    const unsub =
      onSnapshot(
        q,
        (snap) => {

          setPosts(

            snap.docs.map((d) => ({

              id: d.id,

              ...d.data()

            }))

          );

        }
      );

    return () => unsub();

  }, [uid]);

  // ─────────────────────
  // フォロー
  // ─────────────────────
  const toggleFollow =
    async () => {

      if (!me) return;

      const already =
        followers.includes(
          me.uid
        );

      const profileRef =
        doc(
          db,
          "users",
          uid
        );

      const myRef =
        doc(
          db,
          "users",
          me.uid
        );

      if (already) {

        await updateDoc(
          profileRef,
          {
            followers:
              arrayRemove(
                me.uid
              )
          }
        );

        await updateDoc(
          myRef,
          {
            following:
              arrayRemove(uid)
          }
        );

        setFollowers(

          followers.filter(
            (id) =>
              id !== me.uid
          )

        );

        setFollowing(

          following.filter(
            (id) =>
              id !== uid
          )

        );

      } else {

        await updateDoc(
          profileRef,
          {
            followers:
              arrayUnion(
                me.uid
              )
          }
        );

        await updateDoc(
          myRef,
          {
            following:
              arrayUnion(uid)
          }
        );

        setFollowers([
          ...followers,
          me.uid
        ]);

        setFollowing([
          ...following,
          uid
        ]);

        await addDoc(
          collection(
            db,
            "notifications"
          ),
          {
            type: "follow",
            toUid: uid,
            fromUid: me.uid,
            createdAt:
              Date.now()
          }
        );

      }

    };

  if (!profile)
    return null;

  const followingList =
    profile.following || [];

  return (

    <Layout currentUser={currentUser}>

      <div className="bg-black min-h-screen text-white">

        {/* ヘッダー */}
        <div className="h-40 bg-zinc-800 overflow-hidden">

          {profile.headerImage && (

            <img
              src={
                profile.headerImage
              }
              className="w-full h-full object-cover"
            />

          )}

        </div>

        {/* プロフィール */}
        <div className="-mt-16 px-6">

          <div className="flex items-end justify-between">

            <img
              src={
                profile.icon ||
                "/default.png"
              }
              className="w-32 h-32 rounded-full border-4 border-black object-cover bg-zinc-700"
            />

            {me?.uid !== uid && (

              <button
                onClick={
                  toggleFollow
                }
                className="bg-white text-black px-5 py-2 rounded-full font-bold hover:bg-zinc-200 transition"
              >

                {followers.includes(
                  me?.uid
                )
                  ? "フォロー中"
                  : "フォロー"}

              </button>

            )}

          </div>

          {/* 名前 */}
          <div className="mt-3">

            <div className="flex items-center gap-2">

              <h1 className="text-3xl font-bold">

                {profile.name}

              </h1>

              {profile.verified && (

                <img
                  src="/verified-blue.png"
                  className="w-6 h-6"
                />

              )}

              {profile.admin && (

                <img
                  src="/verified-gold.png"
                  className="w-6 h-6"
                />

              )}

            </div>

            <div className="text-zinc-500">

              @{profile.username}

            </div>

          </div>

          {/* BIO */}
          <p className="mt-5 text-white">

            {profile.bio}

          </p>

          {/* フォロー */}
          <div className="flex gap-8 mt-5">

            <button
              onClick={()=>
                setFollowModal(
                  "following"
                )
              }
              className="hover:underline text-left"
            >

              <span className="font-bold text-white">

                {
                  followingList.length
                }

              </span>

              <span className="text-zinc-500 ml-1">

                フォロー中

              </span>

            </button>

            <button
              onClick={()=>
                setFollowModal(
                  "followers"
                )
              }
              className="hover:underline text-left"
            >

              <span className="font-bold text-white">

                {
                  followers.length
                }

              </span>

              <span className="text-zinc-500 ml-1">

                フォロワー

              </span>

            </button>

          </div>

        </div>

        {/* タブ */}
        <div className="flex border-b border-zinc-800 mt-6">

          <button
            onClick={()=>
              setTab("posts")
            }
            className={`flex-1 py-4 font-bold text-sm transition border-b-2 ${
              tab === "posts"
                ? "border-white text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >

            クリート

          </button>

          <button
            onClick={()=>
              setTab("reposts")
            }
            className={`flex-1 py-4 font-bold text-sm transition border-b-2 ${
              tab === "reposts"
                ? "border-white text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >

            リクリート

          </button>

        </div>

        {/* 投稿 */}
        <div>

          {posts.length === 0 ? (

            <p className="text-center text-zinc-600 py-10">

              まだクリートがありません

            </p>

          ) : (

            posts.map((post) => (

              <PostCard
                key={post.id}
                post={post}
                currentUser={
                  currentUser
                }
              />

            ))

          )}

        </div>

      </div>

      {/* モーダル */}
      {followModal ===
        "following" && (

        <FollowListModal
          title="フォロー中"
          uids={followingList}
          onClose={()=>
            setFollowModal(null)
          }
        />

      )}

      {followModal ===
        "followers" && (

        <FollowListModal
          title="フォロワー"
          uids={followers}
          onClose={()=>
            setFollowModal(null)
          }
        />

      )}

    </Layout>

  );

}