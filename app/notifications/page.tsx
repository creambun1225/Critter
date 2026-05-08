export default function NotificationsPage() {
  return (
    <div className="min-h-screen">

      {/* 上 */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-zinc-800 p-4">

        <h1 className="text-xl font-bold">
          通知
        </h1>

      </div>

      {/* 通知一覧 */}
      <div>

        <div className="border-b border-zinc-800 p-4 hover:bg-zinc-950 transition cursor-pointer">

          <div className="flex gap-3">

            <div className="w-10 h-10 rounded-full bg-blue-500 shrink-0" />

            <div>

              <p className="text-sm text-zinc-500">
                いいね
              </p>

              <p>
                誰かがあなたの投稿をいいねしました
              </p>

            </div>

          </div>

        </div>

        <div className="border-b border-zinc-800 p-4 hover:bg-zinc-950 transition cursor-pointer">

          <div className="flex gap-3">

            <div className="w-10 h-10 rounded-full bg-green-500 shrink-0" />

            <div>

              <p className="text-sm text-zinc-500">
                フォロー
              </p>

              <p>
                新しいフォロワーがいます
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}