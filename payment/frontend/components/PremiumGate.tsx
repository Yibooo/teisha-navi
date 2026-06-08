/**
 * components/PremiumGate.tsx
 *
 * プレミアム機能を囲むコンポーネント。
 * 未課金ユーザーにはアップグレード促進UIを表示し、コンテンツをブロックする。
 *
 * 使い方:
 *   <PremiumGate feature="csv_export">
 *     <CSVDownloadButton />
 *   </PremiumGate>
 */

"use client";

import Link from "next/link";
import { useSubscription } from "@/hooks/useSubscription";

type PremiumFeature =
  | "property_detail"   // 物件別詳細ページ
  | "simulator_advanced" // シミュレーター詳細条件
  | "csv_export"        // CSVエクスポート
  | "alert";            // 新着アラート（将来）

interface PremiumGateProps {
  feature: PremiumFeature;
  children: React.ReactNode;
  /** ブロックUI のタイトル（省略時はデフォルト文言） */
  title?: string;
  /** ブロックUI の説明（省略時はデフォルト文言） */
  description?: string;
}

const featureLabels: Record<PremiumFeature, string> = {
  property_detail:    "物件別詳細データ",
  simulator_advanced: "シミュレーター詳細条件",
  csv_export:         "CSVエクスポート",
  alert:              "新着物件アラート",
};

export function PremiumGate({
  feature,
  children,
  title,
  description,
}: PremiumGateProps) {
  const { isPremium, isLoading } = useSubscription();

  // ローディング中は何も表示しない（ちらつき防止）
  if (isLoading) {
    return (
      <div className="animate-pulse bg-slate-100 rounded-xl h-24" />
    );
  }

  // プレミアム会員は普通に表示
  if (isPremium) {
    return <>{children}</>;
  }

  // 未課金ユーザーにはブロックUI を表示
  return (
    <div className="relative">
      {/* ぼかしオーバーレイ */}
      <div className="filter blur-sm pointer-events-none select-none opacity-40">
        {children}
      </div>

      {/* アップグレード促進UI */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 max-w-sm text-center mx-4">
          <div className="text-2xl mb-2">🔒</div>
          <p className="font-bold text-slate-900 mb-1">
            {title ?? `${featureLabels[feature]}はプレミアム機能です`}
          </p>
          <p className="text-sm text-slate-500 mb-4">
            {description ?? "月額500円のプレミアムプランでご利用いただけます。"}
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-colors"
          >
            プレミアムプランを見る →
          </Link>
        </div>
      </div>
    </div>
  );
}
