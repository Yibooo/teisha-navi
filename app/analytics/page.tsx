"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AssetValueChart } from "@/components/charts/AssetValueChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const WARDS = [
  "千代田区", "中央区", "港区", "新宿区", "文京区", "台東区",
  "墨田区", "江東区", "品川区", "目黒区", "大田区", "世田谷区",
  "渋谷区", "中野区", "杉並区", "豊島区", "北区", "荒川区",
  "板橋区", "練馬区", "足立区", "葛飾区", "江戸川区",
];

export default function AnalyticsPage() {
  const [selectedWard, setSelectedWard] = useState<string>("all");

  const chartData = useQuery(api.analytics.getChartData, {
    ward: selectedWard === "all" ? undefined : selectedWard,
  });

  const txStats = useQuery(api.transactions.getStats, {});

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          残存年数別 資産価値グラフ
        </h1>
        <p className="text-slate-600 mb-4">
          東京23区の定期借地権マンションの実取引データに基づく、残存年数別の価格推移です。
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {txStats && (
            <Badge variant="secondary">
              取引データ {txStats.total}件（中古 {txStats.resale}件）
            </Badge>
          )}
          <Badge variant="outline">出典: 国土交通省 不動産取引価格情報</Badge>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">エリア</label>
          <Select value={selectedWard} onValueChange={(v) => setSelectedWard(v ?? "all")}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">東京23区 全体</SelectItem>
              {WARDS.map((w) => (
                <SelectItem key={w} value={w}>{w}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* グラフ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        {chartData === undefined ? (
          <div className="flex items-center justify-center h-80">
            <div className="text-slate-400">データを読み込み中...</div>
          </div>
        ) : (
          <AssetValueChart data={chartData} />
        )}
      </div>

      {/* 解説 */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2">📈 グラフの見方</h3>
          <ul className="text-sm text-blue-800 space-y-1 leading-relaxed">
            <li>• 横軸：残存借地権年数</li>
            <li>• 縦軸（上段）：新築時価格を100%とした場合の比率</li>
            <li>• 縦軸（下段）：成約単価（万円/m²）</li>
            <li>• サンプル数が少ないバケットは参考値として参照ください</li>
          </ul>
        </div>
        <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
          <h3 className="font-semibold text-amber-900 mb-2">⚠️ 注意事項</h3>
          <ul className="text-sm text-amber-800 space-y-1 leading-relaxed">
            <li>• 本グラフは過去の取引データに基づく参考情報です</li>
            <li>• 将来の価値を保証するものではありません</li>
            <li>• 個別物件の状況により価格は大きく異なります</li>
            <li>• 投資判断は専門家にご相談ください</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
