/**
 * app/success/page.tsx — 決済完了ページ
 *
 * Phase 2 実装時に app/success/page.tsx としてコピーして使用。
 * Checkout 完了後にリダイレクトされる。
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";

export default function SuccessPage() {
  const { isPremium } = useSubscription();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    const t = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">{showConfetti ? "🎉" : "✅"}</div>
      <h1 className="text-2xl font-bold text-slate-900 mb-3">
        プレミアムプランへようこそ！
      </h1>
      <p className="text-slate-600 mb-8 leading-relaxed">
        決済が完了しました。すべてのプレミアム機能をご利用いただけます。
        {!isPremium && (
          <span className="block text-sm text-slate-400 mt-2">
            （反映まで数秒かかる場合があります）
          </span>
        )}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/analytics"
          className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors"
        >
          資産価値グラフを見る →
        </Link>
        <Link
          href="/account"
          className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
        >
          プラン管理
        </Link>
      </div>
    </div>
  );
}
