"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function PrivacyPage() {

  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { location.href = "/login"; return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setCurrentUser({ uid: user.uid, ...snap.data() });
      }
    });
    return () => unsub();
  }, []);

  return (
    <Layout currentUser={currentUser}>

      {/* ヘッダー */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-zinc-400 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-900 transition"
        >
          ←
        </button>
        <h1 className="font-bold text-white text-xl">プライバシーポリシー</h1>
      </div>

      {/* 本文 */}
      <div className="p-6 text-white max-w-2xl">

        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
          「クリームパン」（以下「運営者」といいます。）は、SNSサービス「Critter」（以下「本サービス」といいます。）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシーを定めます。
        </p>

        {/* 第1条 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-white">第1条（取得する情報）</h2>
          <p className="text-zinc-400 text-sm mb-3">運営者は、本サービスにおいて以下の情報を取得する場合があります。</p>
          <ol className="list-decimal list-inside text-zinc-400 text-sm space-y-1 pl-2">
            <li>メールアドレス</li>
            <li>ユーザー名</li>
            <li>プロフィール画像</li>
            <li>投稿内容、画像、プロフィール情報</li>
            <li>IPアドレス、ブラウザ情報等のアクセス情報</li>
            <li>Cookie等を利用した識別情報</li>
            <li>その他、本サービス利用時にユーザーが入力した情報</li>
          </ol>
        </section>

        {/* 第2条 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-white">第2条（利用目的）</h2>
          <p className="text-zinc-400 text-sm mb-3">取得した情報は、以下の目的で利用します。</p>
          <ol className="list-decimal list-inside text-zinc-400 text-sm space-y-1 pl-2">
            <li>本サービスの提供および運営</li>
            <li>ユーザー認証</li>
            <li>不正利用防止</li>
            <li>利用状況の分析</li>
            <li>お問い合わせ対応</li>
            <li>規約違反ユーザーへの対応</li>
            <li>サービス改善、新機能開発</li>
            <li>重要なお知らせの通知</li>
          </ol>
        </section>

        {/* 第3条 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-white">第3条（投稿内容について）</h2>
          <ol className="list-decimal list-inside text-zinc-400 text-sm space-y-2 pl-2">
            <li>ユーザーが本サービスへ投稿した内容は、他のユーザーから閲覧される場合があります。</li>
            <li>ユーザーは、公開された情報について自己責任で管理するものとします。</li>
            <li>運営者は、規約違反または不適切と判断した投稿を削除できるものとします。</li>
          </ol>
        </section>

        {/* 第4条 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-white">第4条（第三者提供）</h2>
          <p className="text-zinc-400 text-sm mb-3">運営者は、以下の場合を除き、ユーザー情報を第三者へ提供しません。</p>
          <ol className="list-decimal list-inside text-zinc-400 text-sm space-y-1 pl-2">
            <li>ユーザー本人の同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産保護のため必要な場合</li>
            <li>不正利用対策等で必要と判断した場合</li>
          </ol>
        </section>

        {/* 第5条 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-white">第5条（外部サービスについて）</h2>
          <p className="text-zinc-400 text-sm mb-3">本サービスでは、以下の外部サービスを利用する場合があります。</p>
          <ul className="text-zinc-400 text-sm space-y-1 pl-2">
            <li>・Firebase Authentication</li>
            <li>・Cloud Firestore</li>
            <li>・Cloudinary</li>
            <li>・Vercel</li>
          </ul>
          <p className="text-zinc-400 text-sm mt-3">
            これら外部サービスでは、それぞれのプライバシーポリシーに基づき情報が管理されます。
          </p>
        </section>

        {/* 第6条 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-white">第6条（Cookie等の利用）</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            本サービスでは、利便性向上やアクセス解析のため、Cookie等を使用する場合があります。
          </p>
        </section>

        {/* 第7条 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-white">第7条（未成年の利用）</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            未成年のユーザーは、保護者の同意を得たうえで本サービスを利用するものとします。
          </p>
        </section>

        {/* 第8条 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-white">第8条（情報の管理）</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            運営者は、取得した情報の漏えい、紛失、不正アクセス等を防止するため、適切な安全管理措置を講じます。
          </p>
        </section>

        {/* 第9条 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-white">第9条（プライバシーポリシーの変更）</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            運営者は、必要に応じて本ポリシーを変更できるものとします。
          </p>
        </section>

        {/* 第10条 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-white">第10条（お問い合わせ）</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            本ポリシーに関するお問い合わせは、本サービス内のお問い合わせ機能等からご連絡ください。
          </p>
        </section>


      </div>

    </Layout>
  );
}