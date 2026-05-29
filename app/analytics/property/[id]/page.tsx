"use client";

import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
  ScatterChart,
} from "recharts";

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value.toFixed(1)}万円/坪
        </p>
      ))}
    </div>
  );
};

export default function PropertyAnalyticsPage() {
  const params = useParams();
  const id = params.id as Id<"properties">;

  const data = useQuery(api.analytics.getPropertyChartData, { propertyId: id });

  if (data === undefined) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-slate-400 text-center py-20">読み込み中...</div>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-red-500 text-center py-20">物件が見つかりません</div>
      </div>
    );
  }

  const { property, points, newConstructionPricePerTsubo, totalTransactions, listingData } = data;
  const hasData = points.length > 0;
  const hasListings = listingData && listingData.length > 0;
  const listingTsuboPrices = listingData?.map((l) => l.pricePerTsubo) ?? [];
  const minListingTsubo = hasListings ? Math.min(...listingTsuboPrices) : null;
  const maxListingTsubo = hasListings ? Math.max(...listingTsuboPrices) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* パンくず */}
      <div className="text-sm text-slate-400 mb-6">
        <Link href="/analytics" className="hover:text-slate-600 transition-colors">
          ← 資産価値グラフ一覧
        </Link>
      </div>

      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{property.name}</h1>
        <div className="flex flex-wrap gap-3 text-sm text-slate-500 mb-4">
          <span>{property.ward}</span>
          <span>竣工 {property.buildingYear}年</span>
          <span>新築時残存 {property.leaseEndYear - property.buildingYear}年</span>
          <span>借地期限 {property.leaseEndYear}年（現残存 {property.remainingYears}年）</span>
          {property.totalUnits && <span>総戸数 {property.totalUnits}戸</span>}
          {property.nearestStation && (
            <span>{property.nearestStation}駅 徒歩{property.walkMinutes}分</span>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full">
            成約データ {totalTransactions}件
          </span>
          {newConstructionPricePerTsubo && (
            <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">
              新築時坪単価 {newConstructionPricePerTsubo.toFixed(1)}万円/坪
            </span>
          )}
        </div>
      </div>

      {/* グラフ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        <h2 className="text-base font-semibold text-slate-700 mb-1">
          残存年数別 坪単価推移（成約価格）
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          横軸：成約時点での残存借地権年数（1年刻み）　縦軸：坪単価（万円/坪）
        </p>

        {!hasData ? (
          <div className="flex items-center justify-center h-60 text-slate-400 border border-dashed border-slate-200 rounded-lg">
            <p className="text-sm">成約価格データがまだありません</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={points} margin={{ top: 10, right: 160, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="remainingYears"
                tickFormatter={(v) => `${v}年`}
                label={{ value: "残存年数", position: "insideBottom", offset: -5, fontSize: 12 }}
                type="number"
                domain={["dataMin - 1", "dataMax + 1"]}
                allowDecimals={false}
              />
              <YAxis
                tickFormatter={(v) => `${v}万`}
                label={{ value: "万円/坪", angle: -90, position: "insideLeft", offset: 10, fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" />

              {/* 新築価格の参照線 */}
              {newConstructionPricePerTsubo && (
                <ReferenceLine
                  y={newConstructionPricePerTsubo}
                  stroke="#3b82f6"
                  strokeDasharray="6 3"
                  label={{
                    value: `新築時 ${newConstructionPricePerTsubo.toFixed(0)}万円/坪`,
                    position: "right",
                    fontSize: 11,
                    fill: "#3b82f6",
                  }}
                />
              )}

              {/* サンプルが1件のみの場合は棒グラフで実感しやすく */}
              <Bar
                dataKey="avgPricePerTsubo"
                name="平均坪単価（万円/坪）"
                fill="#6ee7b7"
                radius={[3, 3, 0, 0]}
                barSize={points.length > 20 ? 8 : 14}
              />
              <Line
                dataKey="medianPricePerTsubo"
                name="中央値坪単価（万円/坪）"
                type="monotone"
                stroke="#059669"
                strokeWidth={2}
                dot={{ r: 4, fill: "#059669" }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* データテーブル */}
      {hasData && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 text-sm">成約データ詳細</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-600">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-right px-4 py-2 font-medium">残存年数</th>
                  <th className="text-right px-4 py-2 font-medium">件数</th>
                  <th className="text-right px-4 py-2 font-medium">平均坪単価</th>
                  <th className="text-right px-4 py-2 font-medium">中央値坪単価</th>
                  <th className="text-right px-4 py-2 font-medium">最安値</th>
                  <th className="text-right px-4 py-2 font-medium">最高値</th>
                  {newConstructionPricePerTsubo && (
                    <th className="text-right px-4 py-2 font-medium">新築比</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {[...points].reverse().map((d) => (
                  <tr key={d.remainingYears} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-2 text-right font-medium text-slate-800">
                      {d.remainingYears}年
                    </td>
                    <td className="px-4 py-2 text-right">{d.sampleCount}件</td>
                    <td className="px-4 py-2 text-right">{d.avgPricePerTsubo.toFixed(1)}万円/坪</td>
                    <td className="px-4 py-2 text-right">{d.medianPricePerTsubo.toFixed(1)}万円/坪</td>
                    <td className="px-4 py-2 text-right text-slate-400">{d.minPricePerTsubo.toFixed(1)}</td>
                    <td className="px-4 py-2 text-right text-slate-400">{d.maxPricePerTsubo.toFixed(1)}</td>
                    {newConstructionPricePerTsubo && (
                      <td className="px-4 py-2 text-right">
                        {((d.medianPricePerTsubo / newConstructionPricePerTsubo) * 100).toFixed(1)}%
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 売り出し価格セクション */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 text-sm">
            現在の売り出し価格
          </h2>
          {hasListings && (
            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
              {listingData!.length}件
            </span>
          )}
        </div>
        {!hasListings ? (
          <div className="px-6 py-8 text-center text-slate-400 text-sm">
            売り出し価格データがまだありません
          </div>
        ) : (
          <>
            {/* サマリ */}
            <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 flex flex-wrap gap-4 text-sm">
              <span className="text-amber-800">
                坪単価レンジ：
                <span className="font-semibold">
                  {minListingTsubo === maxListingTsubo
                    ? `${minListingTsubo!.toFixed(1)}万円/坪`
                    : `${minListingTsubo!.toFixed(1)} 〜 ${maxListingTsubo!.toFixed(1)}万円/坪`}
                </span>
              </span>
              {newConstructionPricePerTsubo && minListingTsubo && (
                <span className="text-slate-500 text-xs self-center">
                  （新築時比 {((minListingTsubo / newConstructionPricePerTsubo) * 100).toFixed(0)}〜
                  {((maxListingTsubo! / newConstructionPricePerTsubo) * 100).toFixed(0)}%）
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-600">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-right px-4 py-2 font-medium">売出価格</th>
                    <th className="text-right px-4 py-2 font-medium">坪単価</th>
                    <th className="text-right px-4 py-2 font-medium">専有面積</th>
                    <th className="text-right px-4 py-2 font-medium">階</th>
                    <th className="text-left px-4 py-2 font-medium">間取</th>
                    <th className="text-right px-4 py-2 font-medium">登録年月</th>
                  </tr>
                </thead>
                <tbody>
                  {listingData!.map((l, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-2 text-right font-medium text-slate-800">
                        {l.price.toLocaleString()}万円
                      </td>
                      <td className="px-4 py-2 text-right text-amber-700 font-medium">
                        {l.pricePerTsubo.toFixed(1)}万円/坪
                      </td>
                      <td className="px-4 py-2 text-right">{l.areaSqm}m²</td>
                      <td className="px-4 py-2 text-right">
                        {l.floor != null ? `${l.floor}階` : "—"}
                      </td>
                      <td className="px-4 py-2">{l.layout ?? "—"}</td>
                      <td className="px-4 py-2 text-right text-slate-400">
                        {l.transactionYearQ ?? l.transactionDate?.slice(0, 7) ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* 免責事項 */}
      <div className="bg-amber-50 rounded-xl p-5 border border-amber-100 text-sm text-amber-800">
        <p className="font-semibold mb-1">⚠️ ご注意</p>
        <p className="leading-relaxed">
          本ページの価格情報は随時更新される場合があります。最新情報は各物件の販売会社・REINS等にてご確認ください。
          本情報は参考目的のみであり、投資判断の根拠としての利用はお控えください。将来の価値を保証するものではありません。
        </p>
      </div>
    </div>
  );
}
