export default function BookmarksPage() {
  return (
    <div className="min-h-screen">

      {/* 上 */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-zinc-800 p-4">

        <h1 className="text-xl font-bold">
          ブックマーク
        </h1>

      </div>

      {/* 中身 */}
      <div className="p-8 text-center text-zinc-500">

        <h2 className="text-2xl font-bold text-white mb-2">
          保存済みの投稿
        </h2>

        <p>
          ブックマークした投稿がここに表示されます
        </p>

      </div>

    </div>
  );
}