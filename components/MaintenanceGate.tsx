// components/MaintenanceGate.tsx
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

export default function MaintenanceGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubSite = onSnapshot(
      doc(db, "settings", "site"),
      (snap) => {
        if (snap.exists()) {
          setMaintenance(!!snap.data().maintenance);
        } else {
          setMaintenance(false);
        }
      }
    );

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));

        if (userSnap.exists()) {
          setIsAdmin(userSnap.data().admin === true);
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => {
      unsubSite();
      unsubAuth();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        読み込み中...
      </div>
    );
  }

  if (maintenance && !isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-7xl mb-6">🛠️</div>

          <h1 className="text-3xl font-bold text-white mb-4">
            メンテナンス中
          </h1>

          <p className="text-zinc-400 leading-7">
            一時メンテナンスのためサイトを閉鎖しています。<br />
            ご不便をおかけいたしますが、しばらくお待ちください。
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}