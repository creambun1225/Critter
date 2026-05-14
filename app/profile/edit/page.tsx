"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function EditProfilePage(){

const [currentUser,setCurrentUser]=useState<any>(null);
const [name,setName]=useState("");
const [username,setUsername]=useState("");
const [bio,setBio]=useState("");
const [icon,setIcon]=useState("");
const [image,setImage]=useState<any>(null);

useEffect(()=>{

const unsub=
onAuthStateChanged(
auth,
async(user)=>{

if(!user){
location.href="/login";
return;
}

setCurrentUser(user);

const snap=
await getDoc(
doc(db,"users",user.uid)
);

if(snap.exists()){
const data=snap.data();
setName(data.name||"");
setUsername(data.username||"");
setBio(data.bio||"");
setIcon(data.icon||"");
}

}
);

return ()=>unsub();

},[]);

const saveProfile=async()=>{

try{

if(!currentUser)return;

let iconUrl=icon;

if(image){

const formData=new FormData();

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

iconUrl=data.secure_url;

}

await updateDoc(
doc(
db,
"users",
currentUser.uid
),
{
name,
username,
bio,
icon:iconUrl
}
);

alert("保存しました");
location.href=`/user/${currentUser.uid}`;

}catch(e){
console.log(e);
alert("保存失敗");
}

};

return(
<Layout currentUser={currentUser}>
<div className="p-6 text-white">

<h1 className="text-3xl font-bold mb-6">
プロフィール編集
</h1>

<div className="space-y-5">

<input
value={name}
onChange={(e)=>setName(e.target.value)}
placeholder="名前"
className="w-full bg-zinc-900 p-3 rounded-xl"
/>

<input
value={username}
onChange={(e)=>setUsername(e.target.value)}
placeholder="ユーザー名"
className="w-full bg-zinc-900 p-3 rounded-xl"
/>

<textarea
value={bio}
onChange={(e)=>setBio(e.target.value)}
placeholder="自己紹介"
className="w-full bg-zinc-900 p-3 rounded-xl min-h-[120px]"
/>

<input
type="file"
accept="image/*"
onChange={(e)=>setImage(e.target.files?.[0])}
/>

<img
src={image?URL.createObjectURL(image):(icon||"/default.png")}
className="w-32 h-32 rounded-full object-cover"
/>

<button
onClick={saveProfile}
className="bg-blue-500 px-6 py-3 rounded-full font-bold"
>
保存
</button>

</div>

</div>
</Layout>
);
}
