/**
 * app/account/page.tsx — アカウント・サブスクリプション管理ページ
 *
 * Phase 2 実装時に app/account/page.tsx としてコピーして使用。
 */

"use client";

import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import Link from "next/link";

function formatDate(unixTimestamp: number): string {
  return new Date(unixTimestamp * 1000).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const statusLabel: Record<string, { text: string; color: string }> = {
  active:   { text: "有効",     color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  past_due: { text: "支払い遅延中", color: "text-amber-700 bg-amber-50 border-amber-200" },
  canceled: { text: "解約済み", color: "text-slate-500 bg-slate-50 border-slate-200" },
  free:     { text: "無料プラン", color: "text-slate-500 bg-slate-50 border-slate-200" },
};

export default function AccountPage() {
  const { isPremium, status, stripeCustomerId, currentPeriodEnd, isLoading } = useSubscription();
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  async function handleOpenPortal() {
    if (!stripeCustomerId) return;
    setIsPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/create-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeCustomerId }),
      });
      const data = await res.json() as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setIsPortalLoading(false);
    }
  }

  if (isLoading) {
    return <div className="max-w-lg mx-auto px-4 py-20 text-center text-slate-400">読み込み中...</div>;
  }

  const badge = statusLabel[status] ?? statusLabel.free;

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">アカウント</h1>

      {/* サブスク状態カード */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <p className="text-sm font-medium text-slate-500 mb-3">現在のプラン</p>
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${badge.color}`}>
            {badge.text}
          </span>
          {isPremium && (
            <span className="text-sm font-bold text-slate-900">プレミアムプラン（月額500円）</span>
          )}
        </div>

        {isPremium && currentPeriodEnd && (
          <p className="text-sm text-slate-500">
            次回更新日：{formatDate(currentPeriodEnd)}
          </p>
        )}

        {status === "canceled" && currentPeriodEnd && (
          <p className="text-sm text-amber-600">
            {formatDate(currentPeriodEnd)} まで利用可能です
          </p>
        )}

        {status === "past_due" && (
          <p className="text-sm text-amber-600">
            お支払いに問題があります。カード情報を更新してください。
          </p>
        )}
      </div>

      {/* アクションボタン */}
      <div className="space-y-3">
        {isPremium || status === "past_due" ? (
          <button
            onClick={handleOpenPortal}
            disabled={isPortalLoading || !stripeCustomerId}
            className="w-full px-5 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            {isPortalLoading ? "処理中..." : "プラン管理・解約・カード変更 →"}
          </button>
        ) : (
          <Link
            href="/pricing"
            className="block text-center px-5 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors"
          >
            プレミアムプランに登録する →
          </Link>
        )}
      </div>

      <p className="mt-6 text-xs text-slate-400 text-center">
        解約はいつでも可能です。解約後も期間末まで全機能をご利用いただけます。
      </p>
    </div>
  );
}
