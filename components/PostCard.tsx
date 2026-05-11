"use client";

export default function PostCard({
  post,
  currentUser
}: any) {

  return (

    <div className="border-b border-zinc-800 p-4 text-white">

      <div className="font-bold text-xl">

        {post.name}

      </div>

      <div className="text-zinc-500 mb-3">

        @{post.username}

      </div>

      <div>

        {post.text}

      </div>

    </div>

  );

}