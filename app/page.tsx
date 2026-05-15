"use client";

import { useEffect, useState } from "react";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  where,
  getDocs,
  deleteDoc
} from "firebase/firestore";

import {
  onAuthStateChanged
} from "firebase/auth";

import {
  db,
  auth
} from "@/lib/firebase";

import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";

export default function Home() {

  const [text,setText]=
    useState("");

  const [image,setImage]=
    useState<any>(null);

  const [posts,setPosts]=
    useState<any[]>([]);

  const [currentUser,setCurrentUser]=
    useState<any>(null);

  const [userData,setUserData]=
    useState<any>(null);

  // ログイン確認
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

          const snap=
            await getDoc(
              doc(
                db,
                "users",
                user.uid
              )
            );

          if(snap.exists()){

            const data=
              snap.data();

            setCurrentUser({

              uid:user.uid,

              email:user.email,

              photoURL:
                user.photoURL,

              displayName:
                user.displayName,

              ...data

            });

            setUserData(
              data
            );

          }

        }

      );

    return ()=>unsub();

  },[]);

  // 投稿取得
  useEffect(()=>{

    const q=query(

      collection(
        db,
        "posts"
      ),

      orderBy(
        "createdAt",
        "desc"
      )

    );

    const unsub=
      onSnapshot(
        q,
        (snap)=>{

          setPosts(

            snap.docs.map(
              (doc:any)=>({

                id:doc.id,

                ...doc.data()

              })
            )

          );

        }
      );

    return ()=>unsub();

  },[]);

  // 投稿
  const createPost=
    async()=>{

      if(
        !text.trim() &&
        !image
      ) return;

      let imageUrl="";

      // Cloudinary画像アップロード
      if(image){

        const formData=
          new FormData();

        formData.append(
          "file",
          image
        );

        formData.append(
          "upload_preset",
          "critter_upload"
        );

        const res=
          await fetch(
            "https://api.cloudinary.com/v1_1/dp16ulupy/image/upload",
            {
              method:"POST",
              body:formData
            }
          );

        const data=
          await res.json();

        imageUrl=
          data.secure_url;

      }

      // スパム判定
      const now=
        Date.now();

      const spamQuery=
        query(

          collection(
            db,
            "posts"
          ),

          where(
            "uid",
            "==",
            currentUser.uid
          ),

          where(
            "text",
            "==",
            text
          )

        );

      const spamSnap=
        await getDocs(
          spamQuery
        );

      const recentPosts=
        spamSnap.docs.filter(
          (d:any)=>

            now -
            d.data()
              .createdAt

            <= 3000
        );

      // 3回以上で削除
      if(
        recentPosts.length
        >=2
      ){

        for(
          const p of
          recentPosts
        ){

          await deleteDoc(

            doc(
              db,
              "posts",
              p.id
            )

          );

        }

        alert(
          "同じクリートを3秒以内に3回行ったため削除しました"
        );

        return;

      }

      // ハッシュタグ
      const hashtags=
        text.match(
          /#\w+/g
        ) || [];

      // 投稿保存
      await addDoc(

        collection(
          db,
          "posts"
        ),

        {

          text,

          image:
            imageUrl,

          hashtags,

          uid:
            currentUser.uid,

          name:
            userData?.name ||
            "ユーザー",

          username:
            userData?.username ||
            "user",

          icon:
            userData?.icon ||
            "",

          verified:
            currentUser?.verified ||
            false,

          admin:
            currentUser?.admin ||
            false,

          replies:
            0,

          reposts:
            0,

          likes:
            0,

          bookmarks:
            0,

          createdAt:
            Date.now()

        }

      );

      setText("");

      setImage(null);

    };

  return(

<Layout currentUser={currentUser}>

<div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-zinc-800 p-4">

<div className="text-3xl md:text-4xl font-bold">

ホーム

</div>

</div>

<div className="border-b border-zinc-800 p-4 flex gap-4">

<img
src={
userData?.icon ||
"/default.png"
}
className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover bg-zinc-700 flex-shrink-0"
/>

<div className="flex-1">

<textarea
value={text}
onChange={(e)=>
setText(
e.target.value
)
}
placeholder="いまどうしてる？"
className="w-full bg-black outline-none resize-none text-lg md:text-xl min-h-[120px]"
/>

<input
type="file"
accept="image/*"
onChange={(e)=>
setImage(
e.target.files?.[0]
)
}
className="mt-4"
/>

{image&&(

<img
src={
URL.createObjectURL(
image
)
}
className="mt-4 rounded-2xl max-h-[350px] object-cover"
/>

)}

<div className="flex justify-end mt-4">

<button
onClick={createPost}
className="bg-blue-500 hover:bg-blue-600 transition px-6 md:px-8 py-3 rounded-full text-lg font-bold"
>

クリート

</button>

</div>

</div>

</div>

<div>

{posts.map((post:any)=>(

<PostCard
key={post.id}
post={post}
currentUser={currentUser}
/>

))}

</div>

</Layout>

);

}