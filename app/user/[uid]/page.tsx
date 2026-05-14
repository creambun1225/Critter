"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import {
  db,
  auth
} from "@/lib/firebase";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";

import {
  onAuthStateChanged
} from "firebase/auth";

export default function UserProfile(){

const params=useParams();
const uid=params.uid as string;

const [profile,setProfile]=useState<any>(null);
const [me,setMe]=useState<any>(null);
const [posts,setPosts]=useState<any[]>([]);
const [followers,setFollowers]=useState<string[]>([]);
const [following,setFollowing]=useState<string[]>([]);

useEffect(()=>{

const unsub=
onAuthStateChanged(
auth,
async(u)=>{

if(!u){
location.href="/login";
return;
}

setMe(u);

const snap=
await getDoc(
 doc(db,"users",uid)
);

if(snap.exists()){

const data=snap.data();

setProfile({
uid,
...data
});

setFollowers(
data.followers||[]
);

setFollowing(
data.following||[]
);

}

}
);

return()=>unsub();

},[uid]);

useEffect(()=>{

const q=query(
collection(db,"posts"),
where("uid","==",uid)
);

const unsub=
onSnapshot(q,(snap)=>{

setPosts(
snap.docs.map((d:any)=>(
{
id:d.id,
...d.data()
}
))
);

});

return()=>unsub();

},[uid]);

const toggleFollow=async()=>{

if(!me)return;

const already=
followers.includes(me.uid);

const profileRef=
doc(db,"users",uid);

const myRef=
doc(db,"users",me.uid);

if(already){

await updateDoc(
profileRef,
{
followers:arrayRemove(me.uid)
}
);

await updateDoc(
myRef,
{
following:arrayRemove(uid)
}
);

setFollowers(
followers.filter(
(id)=>id!==me.uid
)
);

}else{

await updateDoc(
profileRef,
{
followers:arrayUnion(me.uid)
}
);

await updateDoc(
myRef,
{
following:arrayUnion(uid)
}
);

setFollowers([
...followers,
me.uid
]);

}

};

if(!profile)return null;

return(
<div className="bg-black min-h-screen text-white">

<div className="h-40 bg-zinc-800"/>

<div className="px-6 pt-8">

<div className="flex justify-between items-center flex-wrap">

<div className="flex items-center gap-2 flex-wrap">

<h1 className="text-3xl font-bold">
{profile.name}
</h1>

{profile.verified&&(
<img
src="/verified-blue.png"
className="w-6 h-6"
/>
)}

{profile.admin&&(
<img
src="/verified-gold.png"
className="w-6 h-6"
/>
)}

</div>

{me?.uid!==uid&&(
<button
onClick={toggleFollow}
className="bg-white text-black px-5 py-2 rounded-full font-bold"
>
{followers.includes(me.uid)
?"フォロー中"
:"フォロー"}
</button>
)}

</div>

<div className="text-zinc-400 mt-1">
@{profile.username}
</div>

<div className="mt-4 whitespace-pre-wrap">
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

{me?.uid===uid&&(
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

<div className="mt-10 border-t border-zinc-800">

{posts.map((p:any)=>(
<div
key={p.id}
className="border-b border-zinc-800 p-4"
>
<div className="font-bold">
{p.name}
</div>
<div className="text-zinc-500">
@{p.username}
</div>
<div className="mt-2 whitespace-pre-wrap">
{p.text}
</div>
</div>
))}

</div>

</div>
)
}
