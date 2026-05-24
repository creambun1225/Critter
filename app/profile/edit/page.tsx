"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

// ファイル → Base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function EditProfilePage() {

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [icon, setIcon] = useState("");
  const [headerImage, setHeaderImage] = useState("");

  // 選択中のファイル
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [headerFile, setHeaderFile] = useState<File | null>(null);

  // プレビュー
  const [iconPreview, setIconPreview] = useState("");
  const [headerPreview, setHeaderPreview] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { location.href = "/login"; return; }
      setCurrentUser(user);
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setName(data.name || "");
        setUsername(data.username || "");
        setBio(data.bio || "");
        setIcon(data.icon || "");
        setHeaderImage(data.headerImage || "");
      }
    });
    return () => unsub();
  }, []);

  const handleIconSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("5MB以下にしてください"); return; }
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
  };

  const handleHeaderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("5MB以下にしてください"); return; }
    setHeaderFile(file);
    setHeaderPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      let iconUrl = icon;
      let headerUrl = headerImage;

      if (iconFile) iconUrl = await fileToBase64(iconFile);
      if (headerFile) headerUrl = await fileToBase64(headerFile);

      await updateDoc(doc(db, "users", currentUser.uid), {
        name,
        username,
        bio,
        icon: iconUrl,
        headerImage: headerUrl,
      });

      alert("保存しました");
      location.href = `/user/${currentUser.uid}`;
    } catch {
      alert("保存失敗");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout currentUser={currentUser}>
      <div className="text-white">

        {/* ヘッダー画像プレビュー */}
        <div className="relative">
          <div
            className="h-40 bg-zinc-800 overflow-hidden cursor-pointer relative group"
            onClick={() => document.getElementById("headerInput")?.click()}
          >
            {(headerPreview || headerImage) ? (
              <img
                src={headerPreview || headerImage}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-zinc-800" />
            )}
            {/* オーバーレイ */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <span className="text-white text-sm font-bold">🖼 ヘッダーを変更</span>
            </div>
          </div>
          <input
            id="headerInput"
            type="file"
            accept="image/*"
            onChange={handleHeaderSelect}
            className="hidden"
          />

          {/* アイコン */}
          <div
            className="absolute -bottom-12 left-6 cursor-pointer group"
            onClick={() => document.getElementById("iconInput")?.click()}
          >
            <div className="relative">
              <img
                src={iconPreview || icon || "/default.png"}
                className="w-24 h-24 rounded-full border-4 border-black object-cover bg-zinc-700"
              />
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <span className="text-white text-xs font-bold">変更</span>
              </div>
            </div>
          </div>
          <input
            id="iconInput"
            type="file"
            accept="image/*"
            onChange={handleIconSelect}
            className="hidden"
          />
        </div>

        {/* フォーム */}
        <div className="pt-16 px-6 pb-6">
          <h1 className="text-2xl font-bold mb-6">プロフィール編集</h1>

          <div className="space-y-5">

            <div>
              <div className="text-zinc-400 mb-2 text-sm font-bold">名前</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="表示名を入力"
                className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <div className="text-zinc-400 mb-2 text-sm font-bold">ユーザー名</div>
              <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden focus-within:border-blue-500 transition">
                <span className="px-3 text-zinc-500">@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="flex-1 bg-transparent p-3 text-white outline-none"
                />
              </div>
            </div>

            <div>
              <div className="text-zinc-400 mb-2 text-sm font-bold">自己紹介</div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="自己紹介を書く"
                rows={4}
                className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl text-white outline-none resize-none focus:border-blue-500 transition"
              />
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full bg-blue-500 hover:bg-blue-600 transition px-6 py-3 rounded-full font-bold text-lg disabled:opacity-40"
            >
              {saving ? "保存中..." : "保存"}
            </button>

          </div>
        </div>
      </div>
    </Layout>
  );
}