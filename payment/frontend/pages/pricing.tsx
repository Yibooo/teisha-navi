/**
 * app/pricing/page.tsx — 料金プランページ
 *
 * Phase 2 実装時に app/pricing/page.tsx としてコピーして使用。
 */

"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/hooks/useSubscription";
import Link from "next/link";

export default function PricingPage() {
  const { isSignedIn, userId } = useAuth();
  const { isPremium, isLoading } = useSubscription();
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    if (!isSignedIn) {
      router.push("/sign-in?redirect=/pricing");
      return;
    }

    setIsCheckingOut(true);
    setError(null);

    try {
      // Clerk からメールを取得（実際は useUser().user.primaryEmailAddress を使う）
      const email = ""; // TODO: useUser().user?.primaryEmailAddress?.emailAddress

      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkUserId: userId, email }),
      });

      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "エラーが発生しました。もう一度お試しください。");
      }
    } catch {
      setError("ネットワークエラーが発生しました。");
    } finally {
      setIsCheckingOut(false);
    }
  }

  if (isLoading) {
    return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-slate-400">読み込み中...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <p className="text-sm font-semibold text-blue-600 tracking-widest uppercase mb-2">Pricing</p>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">料金プラン</h1>
        <p className="text-slate-500">定借マンションの資産価値データをフルで活用する</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* 無料プラン */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Free</p>
          <div className="mb-4">
            <span className="text-3xl font-bold text-slate-900">¥0</span>
            <span className="text-slate-400 text-sm"> / 月</span>
          </div>
          <ul className="space-y-2 text-sm text-slate-600 mb-6">
            <li className="flex items-center gap-2">✅ 資産価値グラフ（全体集計）</li>
            <li className="flex items-center gap-2">✅ シミュレーター（基本）</li>
            <li className="flex items-center gap-2">✅ 定借マンション解説ページ</li>
            <li className="flex items-center gap-2 text-slate-300">❌ 物件別詳細データ</li>
            <li className="flex items-center gap-2 text-slate-300">❌ CSV エクスポート</li>
          </ul>
          <div className="px-4 py-2.5 text-center text-sm text-slate-500 border border-slate-200 rounded-xl">
            現在のプラン
          </div>
        </div>

        {/* プレミアムプラン */}
        <div className="bg-slate-900 rounded-2xl border-2 border-slate-900 p-6 text-white relative overflow-hidden">
          <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            おすすめ
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Premium</p>
          <div className="mb-4">
            <span className="text-3xl font-bold text-white">¥500</span>
            <span className="text-slate-400 text-sm"> / 月（税込）</span>
          </div>
          <ul className="space-y-2 text-sm text-slate-300 mb-6">
            <li className="flex items-center gap-2">✅ 無料プランの全機能</li>
            <li className="flex items-center gap-2">✅ 物件別詳細データ（全57件）</li>
            <li className="flex items-center gap-2">✅ シミュレーター詳細条件</li>
            <li className="flex items-center gap-2">✅ CSV エクスポート</li>
            <li className="flex items-center gap-2">✅ 新着物件アラート（近日公開）</li>
          </ul>

          {isPremium ? (
            <Link
              href="/account"
              className="block text-center px-4 py-2.5 bg-white text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors"
            >
              プラン管理 →
            </Link>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={isCheckingOut}
              className="w-full px-4 py-2.5 bg-white text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-60"
            >
              {isCheckingOut ? "処理中..." : "今すぐ登録する →"}
            </button>
          )}
          {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
        </div>
      </div>

      {/* 注意事項 */}
      <div className="mt-8 text-xs text-slate-400 space-y-1 text-center">
        <p>• クレジットカード決済（Visa / Mastercard / JCB / Amex）</p>
        <p>• いつでもマイページから解約可能（解約後も期間末まで利用可）</p>
        <p>• 決済は <a href="https://stripe.com/jp" className="underline" target="_blank" rel="noopener noreferrer">Stripe</a> で安全に処理されます</p>
      </div>
    </div>
  );
}
