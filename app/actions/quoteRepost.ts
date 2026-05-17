import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // 既存のfirebase初期化ファイルに合わせて変更
import { Post } from "@/types/post";

type CurrentUser = {
  uid: string;
  name: string;
  username: string;
  icon: string;
  verified: boolean;
  admin: boolean;
};

type QuoteRepostParams = {
  text: string;
  currentUser: CurrentUser;
  targetPost: Post;
};

export async function submitQuoteRepost({
  text,
  currentUser,
  targetPost,
}: QuoteRepostParams): Promise<void> {
  // 引用元のスナップショットを埋め込む（削除されても表示できるように）
  const quotedPostSnapshot = {
    id: targetPost.id,
    text: targetPost.text,
    image: targetPost.image ?? null,
    uid: targetPost.uid,
    name: targetPost.name,
    username: targetPost.username,
    icon: targetPost.icon,
    verified: targetPost.verified,
    createdAt: targetPost.createdAt,
  };

  // 新しい引用リポスト投稿を作成
  await addDoc(collection(db, "posts"), {
    text,
    image: null,
    hashtags: extractHashtags(text),
    uid: currentUser.uid,
    name: currentUser.name,
    username: currentUser.username,
    icon: currentUser.icon,
    verified: currentUser.verified,
    admin: currentUser.admin,
    likes: 0,
    reposts: 0,
    bookmarks: 0,
    replies: 0,
    likedUsers: [],
    repostedUsers: [],
    bookmarkedUsers: [],
    isQuoteRepost: true,
    quotePostId: targetPost.id,
    quotePost: quotedPostSnapshot,      // スナップショット埋め込み
    createdAt: serverTimestamp(),
  });

  // 引用元投稿のreposts数をインクリメント
  const targetPostRef = doc(db, "posts", targetPost.id);
  await updateDoc(targetPostRef, {
    reposts: increment(1),
    repostedUsers: arrayUnion(currentUser.uid),
  });
}

// ハッシュタグ抽出（既存ロジックがあれば差し替えてください）
function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]+/g);
  return matches ? matches.map((tag) => tag.slice(1)) : [];
}