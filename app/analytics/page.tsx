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
import Link from "next/link";

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

  const propertiesWithData = useQuery(api.analytics.getPropertiesWithDataCounts, {
    ward: selectedWard === "all" ? undefined : selectedWard,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          残存年数別 資産価値グラフ
        </h1>
        <p className="text-slate-600 mb-4">
          東京23区の定期借地権マンションの<strong>実成約価格</strong>（REINS成約データ）に基づく、残存年数別の資産価値推移です。
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {txStats && (
            <>
              <Badge variant="secondary">
                成約価格 {txStats.transaction}件
              </Badge>
              <Badge variant="secondary">
                新築価格 {txStats.newConstruction}件
              </Badge>
            </>
          )}
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

      {/* 対象物件一覧 */}
      <div className="bg-white rounded-2xl border border-slate-200 mb-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">
            対象物件一覧
            {propertiesWithData && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                （{selectedWard === "all" ? "東京23区 全体" : selectedWard}・{propertiesWithData.length}件）
              </span>
            )}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">マンション名</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">区</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">竣工</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">借地期限</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">残存年数</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">総戸数</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">最寄駅</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">データ</th>
              </tr>
            </thead>
            <tbody>
              {propertiesWithData === undefined ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-400 text-sm">読み込み中...</td>
                </tr>
              ) : propertiesWithData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-400 text-sm">
                    {selectedWard === "all" ? "物件データがありません" : `${selectedWard}の物件データがありません`}
                  </td>
                </tr>
              ) : (
                propertiesWithData.map((p) => (
                  <tr key={p._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/analytics/property/${p._id}`}
                        className="text-blue-700 underline hover:text-blue-900 cursor-pointer"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.ward}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{p.buildingYear}年</td>
                    <td className="px-4 py-3 text-right text-slate-600">{p.leaseEndYear}年</td>
                    <td className="px-4 py-3 text-right">
                      <span className={
                        p.remainingYears < 25 ? "text-red-600 font-semibold" :
                        p.remainingYears < 35 ? "text-amber-600 font-medium" :
                        "text-slate-700"
                      }>
                        {p.remainingYears}年
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{p.totalUnits ?? "—"}戸</td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.nearestStation ? `${p.nearestStation}駅 徒歩${p.walkMinutes}分` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {p.dataNew > 0 && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                            新築{p.dataNew}
                          </span>
                        )}
                        {p.dataListing > 0 && (
                          <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                            売出{p.dataListing}
                          </span>
                        )}
                        {p.dataTransaction > 0 && (
                          <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                            成約{p.dataTransaction}
                          </span>
                        )}
                        {p.dataNew === 0 && p.dataListing === 0 && p.dataTransaction === 0 && (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 解説 */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2">📈 グラフの見方</h3>
          <ul className="text-sm text-blue-800 space-y-1 leading-relaxed">
            <li>• データ：REINS実成約価格（売り出し価格ではなく、実際に取引が成立した価格）</li>
            <li>• 横軸：成約時点での残存借地権年数</li>
            <li>• 縦軸（上段）：新築時価格を100%とした場合の比率</li>
            <li>• 縦軸（下段）：坪単価（万円/坪）</li>
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
