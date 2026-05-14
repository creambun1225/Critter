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
  arrayUnion,
  arrayRemove
} from "firebase/firestore";

import {
  onAuthStateChanged
} from "firebase/auth";

export default function UserProfile() {

  const params =
    useParams();

  const uid =
    params.uid as string;

  const [profile,setProfile] =
    useState<any>(null);

  const [me,setMe] =
    useState<any>(null);

  const [followers,setFollowers] =
    useState<string[]>([]);

  const [following,setFollowing] =
    useState<string[]>([]);

  useEffect(()=>{

    const unsub=
      onAuthStateChanged(
        auth,
        async(user)=>{

          if(!user){

            location.href=
              "/login";

            return;

          }

          setMe(user);

          // 相手プロフィール
          const profileSnap=
            await getDoc(
              doc(
                db,
                "users",
                uid
              )
            );

          if(
            profileSnap.exists()
          ){

            const data=
              profileSnap.data();

            setProfile({

              uid,

              ...data

            });

            setFollowers(
              data.followers || []
            );

          }

          // 自分
          const mySnap=
            await getDoc(
              doc(
                db,
                "users",
                user.uid
              )
            );

          if(
            mySnap.exists()
          ){

            setFollowing(
              mySnap.data()
                .following || []
            );

          }

        }
      );

    return ()=>unsub();

  },[uid]);

  const toggleFollow=
    async()=>{

      if(!me)return;

      const already=
        followers.includes(
          me.uid
        );

      const profileRef=
        doc(
          db,
          "users",
          uid
        );

      const myRef=
        doc(
          db,
          "users",
          me.uid
        );

      if(already){

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
              arrayRemove(
                uid
              )
          }
        );

        setFollowers(
          followers.filter(
            (id)=>
              id!==me.uid
          )
        );

        setFollowing(
          following.filter(
            (id)=>
              id!==uid
          )
        );

      }else{

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
              arrayUnion(
                uid
              )
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

      }

    };

  if(!profile)
    return null;

  return(

<Layout currentUser={me}>

<div className="bg-black min-h-screen text-white">

<div className="h-40 bg-zinc-800"/>

<div className="-mt-16 px-6">

<img
src={
profile.icon ||
"/default.png"
}
className="w-32 h-32 rounded-full border-4 border-black object-cover"
/>

<div className="flex justify-between mt-5">

<div>

<h1 className="text-3xl font-bold">

{profile.name}

</h1>

<div className="text-zinc-500">

@{profile.username}

</div>

</div>

{me?.uid!==uid&&(

<button
onClick={toggleFollow}
className="bg-white text-black px-5 py-2 rounded-full font-bold"
>

{followers.includes(
me.uid
)
?
"フォロー中"
:
"フォロー"}

</button>

)}

</div>

<p className="mt-5">

{profile.bio}

</p>

<div className="flex gap-8 mt-5">

<div>

<span className="font-bold">

{
(profile.following || [])
.length
}

</span>

フォロー中

</div>

<div>

<span className="font-bold">

{
followers.length
}

</span>

フォロワー

</div>

</div>

{me?.uid===uid&&(

<Link
href="/profile/edit"
>

<button
className="mt-5 border border-zinc-700 px-5 py-2 rounded-full"
>

プロフィール編集

</button>

</Link>

)}

</div>

</div>

</Layout>

);

}