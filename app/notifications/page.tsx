"use client";

import {
  useEffect,
  useState
} from "react";

import Link from "next/link";

import Layout from "@/components/Layout";

import {
  auth,
  db
} from "@/lib/firebase";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc
} from "firebase/firestore";

export default function NotificationsPage() {

  const [currentUser,setCurrentUser] =
    useState<any>(null);

  const [notifications,setNotifications] =
    useState<any[]>([]);

  useEffect(()=>{

    const unsub =
      onAuthStateChanged(
        auth,
        async(user)=>{

          if(!user){

            location.href =
              "/login";

            return;

          }

          const snap =
            await getDoc(
              doc(
                db,
                "users",
                user.uid
              )
            );

          if(
            snap.exists()
          ){

            const data =
              snap.data();

            setCurrentUser({

              uid:user.uid,

              ...data

            });

          }

        }
      );

    return ()=>unsub();

  },[]);

  useEffect(()=>{

    if(
      !currentUser?.admin
    ) return;

    const q =
      query(
        collection(
          db,
          "notifications"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );

    const unsub =
      onSnapshot(
        q,
        (snap)=>{

          setNotifications(

            snap.docs.map(
              (d:any)=>({

                id:d.id,

                ...d.data()

              })
            )

          );

        }
      );

    return ()=>unsub();

  },[currentUser]);

  return(

<Layout currentUser={currentUser}>

<div className="text-white">

<div className="sticky top-0 bg-black/90 backdrop-blur border-b border-zinc-800 p-4 z-50">

<div className="text-3xl font-bold">

通知

</div>

</div>

{!currentUser?.admin ? (

<div className="p-6 text-zinc-500">

管理者通知はありません

</div>

) : (

<div>

{notifications.map((n:any)=>(

<div
key={n.id}
className="border-b border-zinc-800 p-5"
>

<div className="font-bold text-lg">

{n.message}

</div>

{n.type==="report" && (

<Link
href={`/post/${n.postId}`}
className="text-blue-500 mt-3 inline-block"
>

通報されたクリートを表示

</Link>

)}

</div>

))}

</div>

)}

</div>

</Layout>

);

}