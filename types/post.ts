export type Post = {
  id: string;
  text: string;
  image?: string;
  hashtags?: string[];
  uid: string;
  name: string;
  username: string;
  icon: string;
  verified: boolean;
  admin: boolean;
  likes: number;
  reposts: number;
  bookmarks: number;
  replies: number;
  likedUsers: string[];
  repostedUsers: string[];
  bookmarkedUsers: string[];
  createdAt: any;

  // 引用リポスト用フィールド
  quotePostId?: string;       // 引用元の投稿ID
  quotePost?: QuotedPost;     // 引用元の埋め込みスナップショット
  isQuoteRepost?: boolean;    // 引用リポストかどうか
};

// 引用元スナップショット（削除されても表示用に保持）
export type QuotedPost = {
  id: string;
  text: string;
  image?: string;
  uid: string;
  name: string;
  username: string;
  icon: string;
  verified: boolean;
  createdAt: any;
};