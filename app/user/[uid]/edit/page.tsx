"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/components/Layout";

import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export default function EditProfilePage() {
  const params = useParams();
  const router = useRouter();

  const uid = params.uid as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [icon, setIcon] = useState("");
  const [banner, setBanner] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("");

  const [iconFile, setIconFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      if (user.uid !== uid) {
        router.push(`/user/${uid}`);
        return;
      }

      setCurrentUser(user);

      try {
        const snap = await getDoc(doc(db, "users", uid));

        if (!snap.exists()) {
          alert("ユーザーが見つかりません");
          router.push("/");
          return;
        }

        const data = snap.data();

        setIcon(data.icon || "");
        setBanner(data.banner || data.headerImage || "");
        setName(data.name || "");
        setUsername(data.username || "");
        setBio(data.bio || "");
        setLink(data.link || data.website || "");

        setLoading(false);
      } catch (error) {
        console.error(error);
        alert("プロフィール情報の取得に失敗しました");
        router.push(`/user/${uid}`);
      }
    });

    return () => unsubscribe();
  }, [uid, router]);

  const handleIconChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("画像ファイルを選択してください");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("アイコンは5MB以下にしてください");
      return;
    }

    setIconFile(file);
    setIcon(URL.createObjectURL(file));
  };

  const handleBannerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("画像ファイルを選択してください");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("バナーは10MB以下にしてください");
      return;
    }

    setBannerFile(file);
    setBanner(URL.createObjectURL(file));
  };

  const uploadImage = async (
    file: File,
    type: "icon" | "banner"
  ) => {
    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileRef = ref(
      storage,
      `users/${uid}/${type}_${Date.now()}.${extension}`
    );

    await uploadBytes(fileRef, file);

    return await getDownloadURL(fileRef);
  };

  const saveProfile = async () => {
    if (!currentUser) return;

    if (!name.trim()) {
      alert("表示名を入力してください");
      return;
    }

    if (!username.trim()) {
      alert("ユーザー名を入力してください");
      return;
    }

    setSaving(true);

    try {
      let newIcon = icon;
      let newBanner = banner;

      if (iconFile) {
        newIcon = await uploadImage(iconFile, "icon");
      }

      if (bannerFile) {
        newBanner = await uploadImage(bannerFile, "banner");
      }

      await updateDoc(doc(db, "users", uid), {
        name: name.trim(),
        username: username.trim().replace(/^@/, ""),
        bio: bio.trim(),
        link: link.trim(),
        icon: newIcon,
        banner: newBanner,
      });

      alert("プロフィールを更新しました");

      router.push(`/user/${uid}`);
      router.refresh();
    } catch (error) {
      console.error("Profile update error:", error);
      alert("プロフィールの更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout currentUser={currentUser}>
        <div className="min-h-screen flex items-center justify-center text-zinc-400">
          読み込み中...
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentUser={currentUser}>
      <div className="min-h-screen bg-black text-white">

        {/* 編集ページヘッダー */}
        <header className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-zinc-800">
          <div className="px-4 py-3 flex items-center gap-4">

            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full hover:bg-zinc-900 flex items-center justify-center text-xl transition"
            >
              ←
            </button>

            <div className="flex-1">
              <h1 className="text-xl font-bold">
                プロフィールを編集
              </h1>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              className={`px-5 py-2 rounded-full font-bold transition ${
                saving
                  ? "bg-zinc-700 text-zinc-400"
                  : "bg-white text-black hover:bg-zinc-200"
              }`}
            >
              {saving ? "保存中..." : "保存"}
            </button>

          </div>
        </header>

        {/* バナー */}
        <div className="relative">

          <div className="w-full h-48 bg-zinc-800 overflow-hidden">
            {banner ? (
              <img
                src={banner}
                alt="バナー"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-400 to-blue-600" />
            )}
          </div>

          <label
            htmlFor="banner-upload"
            className="absolute inset-0 flex items-center justify-center cursor-pointer group"
          >
            <div className="bg-black/60 rounded-full w-14 h-14 flex items-center justify-center text-2xl opacity-80 group-hover:opacity-100 transition">
              📷
            </div>
          </label>

          <input
            id="banner-upload"
            type="file"
            accept="image/*"
            onChange={handleBannerChange}
            className="hidden"
          />

          {/* アイコン */}
          <div className="absolute left-5 -bottom-16">

            <label
              htmlFor="icon-upload"
              className="block relative w-32 h-32 rounded-full cursor-pointer group"
            >
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-black bg-zinc-800">

                <img
                  src={icon || "/default.png"}
                  alt="アイコン"
                  className="w-full h-full object-cover"
                />

              </div>

              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <span className="text-2xl">
                  📷
                </span>
              </div>
            </label>

            <input
              id="icon-upload"
              type="file"
              accept="image/*"
              onChange={handleIconChange}
              className="hidden"
            />

          </div>
        </div>

        {/* フォーム */}
        <div className="px-5 pt-24 pb-20">

          {/* 表示名 */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-zinc-300 mb-2">
              表示名
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              placeholder="表示名"
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition"
            />

            <div className="text-right text-xs text-zinc-500 mt-1">
              {name.length}/50
            </div>
          </div>

          {/* ユーザー名 */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-zinc-300 mb-2">
              ユーザー名
            </label>

            <div className="flex items-center bg-black border border-zinc-700 rounded-xl overflow-hidden focus-within:border-blue-500 transition">

              <span className="pl-4 text-zinc-500">
                @
              </span>

              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                      .replace(/^@/, "")
                      .replace(/\s/g, "")
                  )
                }
                maxLength={30}
                placeholder="username"
                className="flex-1 bg-transparent px-2 py-3 outline-none"
              />

            </div>
          </div>

          {/* 自己紹介 */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-zinc-300 mb-2">
              自己紹介
            </label>

            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={5}
              placeholder="自己紹介を入力してください"
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition resize-none"
            />

            <div className="text-right text-xs text-zinc-500 mt-1">
              {bio.length}/160
            </div>
          </div>

          {/* リンク */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-zinc-300 mb-2">
              リンク
            </label>

            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition"
            />

            <p className="text-xs text-zinc-500 mt-2">
              YouTubeやSNSなどのリンクを設定できます。
            </p>
          </div>

          {/* 保存 */}
          <button
            onClick={saveProfile}
            disabled={saving}
            className={`w-full py-4 rounded-xl font-bold text-lg transition ${
              saving
                ? "bg-zinc-700 text-zinc-400"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {saving ? "保存中..." : "プロフィールを保存"}
          </button>

          {/* キャンセル */}
          <button
            onClick={() => router.back()}
            disabled={saving}
            className="w-full mt-3 py-4 rounded-xl border border-zinc-700 hover:bg-zinc-900 transition font-bold"
          >
            キャンセル
          </button>

        </div>
      </div>
    </Layout>
  );
}