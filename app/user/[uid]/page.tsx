"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function UserProfile() {
  const params = useParams();
  const uid = params.uid as string;

  const [profile, setProfile] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        location.href = "/login";
        return;
      }

      setMe(u);

      const snap = await getDoc(doc(db, "users", uid));

      if (snap.exists()) {
        const data = snap.data();
        setProfile({ uid, ...data });
        setFollowers(data.followers || []);
      }

      const mySnap = await getDoc(doc(db, "users", u.uid));

      if (mySnap.exists()) {
        setFollowing(mySnap.data().following || []);
      }
    });

    return () => unsub();
  }, [uid]);

  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      where("uid", "==", uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      setPosts(
        snap.docs.map((d: any) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });

    return () => unsub();
  }, [uid]);

  const toggleFollow = async () => {
    if (!me) return;

    const already = followers.includes(me.uid);

    const profileRef = doc(db, "users", uid);
    const myRef = doc(db, "users", me.uid);

    if (already) {
      await updateDoc(profileRef, {
        followers: arrayRemove(me.uid),
      });

      await updateDoc(myRef, {
        following: arrayRemove(uid),
      });

      setFollowers(followers.filter((id) => id !== me.uid));
      setFollowing(following.filter((id) => id !== uid));
    } else {
      await updateDoc(profileRef, {
        followers: arrayUnion(me.uid),
      });

      await updateDoc(myRef, {
        following: arrayUnion(uid),
      });

      setFollowers([...followers, me.uid]);
      setFollowing([...following, uid]);
    }
  };

  if (!profile) return null;

  return (
    <Layout currentUser={me}>
      <div className="bg-black min-h-screen text-white">

        <div className="relative">
          <div className="h-40 bg-zinc-800" />

          <div className="absolute -bottom-16 left-6">
            <div className="w-32 h-32 rounded-full border-4 border-black overflow-hidden bg-zinc-700">
              <img
                src={profile.icon || "/default.png"}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="pt-20 px-6">
          <div className="flex justify-between items-center flex-wrap">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">
                {profile.name}
              </h1>
            </div>

            {me?.uid !== uid && (
              <button
                onClick={toggleFollow}
                className="bg-white text-black px-5 py-2 rounded-full font-bold"
              >
                {followers.includes(me.uid)
                  ? "フォロー中"
                  : "フォロー"}
              </button>
            )}
          </div>

          <div className="text-zinc-400 mt-2">
            @{profile.username}
          </div>

          <div className="mt-4">
            {profile.bio}
          </div>

          <div className="flex gap-6 mt-5 text-zinc-400">
            <div>
              <span className="text-white font-bold">
                {following.length}
              </span>
              フォロー中
            </div>

            <div>
              <span className="text-white font-bold">
                {followers.length}
              </span>
              フォロワー
            </div>
          </div>

          {me?.uid === uid && (
            <div className="mt-6">
              <Link
                href="/profile/edit"
                className="px-4 py-2 rounded-full border border-zinc-700 hover:bg-zinc-900"
              >
                プロフィール編集
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
