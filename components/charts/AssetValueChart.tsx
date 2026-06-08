"use client";

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
} from "recharts";
type CachePoint = {
  remainingYearsBucket: string;
  bucketMin: number;
  bucketMax: number;
  avgPriceRatio?: number | null;
  medianPriceRatio?: number | null;
  ratioSampleCount?: number | null;
  sampleCount: number;
  avgPricePerSqm: number;
  medianPricePerSqm: number;
  avgPricePerTsubo?: number | null;
  medianPricePerTsubo?: number | null;
  [key: string]: unknown; // DB の追加フィールド(_id, _creationTime等)を許容
};

type NewConstructionPoint = {
  remainingLeaseYears: number;
  pricePerTsubo: number;
  propertyName: string;
};

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  newConstructionPoints?: NewConstructionPoint[];
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; payload?: NewConstructionPoint }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-bold text-slate-900 mb-2">残存{label}年</p>
      {payload.map((p) => (
        <div key={p.name}>
          <p style={{ color: p.color }}>
            {p.name}: {p.name.includes("比率") ? `${(p.value * 100).toFixed(1)}%` : `${p.value.toFixed(1)}万円/坪`}
          </p>
          {p.payload?.propertyName && (
            <p className="text-xs text-slate-500 ml-2">{p.payload.propertyName}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export function AssetValueChart({ data, newConstructionPoints = [] }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-slate-400">
        <p>データがありません。Adminからデータをインポートしてください。</p>
      </div>
    );
  }

  // 新築比グラフ用データ：新築価格との比較データがある点のみ（ない点は null でスキップ）
  const ratioData = data.map((d) => ({
    ...d,
    avgPriceRatio: d.ratioSampleCount && d.ratioSampleCount > 0 ? d.avgPriceRatio : null,
    medianPriceRatio: d.ratioSampleCount && d.ratioSampleCount > 0 ? d.medianPriceRatio : null,
  }));
  const hasAnyRatioData = ratioData.some((d) => d.avgPriceRatio != null);

  return (
    <div className="space-y-8">
      {/* 新築比価格比率グラフ */}
      <div>
        <h3 className="text-base font-semibold text-slate-700 mb-1">新築時価格を100%とした場合の価格比率</h3>
        <p className="text-xs text-slate-400 mb-3">
          100%超 = 新築時より値上がり。新築価格データがある物件のみ表示（データなし年数帯はグラフ非表示）
        </p>
        {!hasAnyRatioData ? (
          <div className="flex items-center justify-center h-40 text-slate-400 border border-dashed border-slate-200 rounded-lg">
            <p className="text-sm">新築価格との比較データがまだありません</p>
          </div>
        ) : (
          <div className="relative">
            {/* 右端フェード（スクロール示唆） */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 sm:hidden rounded-r-lg" />
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[520px]">
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={ratioData} margin={{ top: 10, right: 24, left: 8, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="bucketMin"
                      tickFormatter={(v) => `${v}年`}
                      label={{ value: "残存年数", position: "insideBottom", offset: -10, fontSize: 12 }}
                    />
                    <YAxis
                      tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                      domain={[0, "auto"]}
                      width={48}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" />
                    <ReferenceLine y={1} stroke="#94a3b8" strokeDasharray="6 3" label={{ value: "新築時=100%", position: "right", fontSize: 11 }} />
                    <Bar dataKey="avgPriceRatio" name="平均比率" fill="#93c5fd" radius={[3, 3, 0, 0]} />
                    <Line dataKey="medianPriceRatio" name="中央値比率" type="monotone" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center mt-1 sm:hidden">← 横スクロールで全体表示 →</p>
          </div>
        )}
      </div>

      {/* 坪単価グラフ */}
      <div>
        <h3 className="text-base font-semibold text-slate-700 mb-1">残存年数別 平均坪単価（万円/坪）</h3>
        <p className="text-xs text-slate-400 mb-3">
          サンプル件数が少ないバケットはご参考程度にご覧ください
          {newConstructionPoints.length > 0 && (
            <span className="ml-2 text-blue-400">● 新築時坪単価（各物件の新築分譲価格）</span>
          )}
        </p>
        <div className="relative">
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 sm:hidden rounded-r-lg" />
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[520px]">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={data} margin={{ top: 10, right: 24, left: 8, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="bucketMin"
                    type="number"
                    domain={[0, 75]}
                    tickFormatter={(v) => `${v}年`}
                    allowDuplicatedCategory={false}
                  />
                  <YAxis tickFormatter={(v) => `${v}万`} width={52} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" />
                  <Bar dataKey="avgPricePerTsubo" name="平均坪単価（万円/坪）" fill="#6ee7b7" radius={[3, 3, 0, 0]} />
                  <Line dataKey="medianPricePerTsubo" name="中央値坪単価（万円/坪）" type="monotone" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} />
                  {newConstructionPoints.length > 0 && (
                    <Scatter
                      data={newConstructionPoints.map((p) => ({
                        bucketMin: p.remainingLeaseYears,
                        avgPricePerTsubo: p.pricePerTsubo,
                        propertyName: p.propertyName,
                      }))}
                      dataKey="avgPricePerTsubo"
                      name="新築時坪単価"
                      fill="#3b82f6"
                      shape="circle"
                      legendType="circle"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center mt-1 sm:hidden">← 横スクロールで全体表示 →</p>
        </div>
      </div>

      {/* サンプル数テーブル */}
      <div>
        <div className="relative">
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 sm:hidden" />
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-600 min-w-[480px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium whitespace-nowrap pr-4">残存年数帯</th>
                  <th className="text-right py-2 font-medium whitespace-nowrap px-3">サンプル数</th>
                  <th className="text-right py-2 font-medium whitespace-nowrap px-3">平均坪単価</th>
                  <th className="text-right py-2 font-medium whitespace-nowrap px-3">中央値坪単価</th>
                  <th className="text-right py-2 font-medium whitespace-nowrap pl-3">新築比（中央値）</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.remainingYearsBucket} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 whitespace-nowrap pr-4">{d.bucketMin}〜{d.bucketMax}年</td>
                    <td className="text-right py-2 whitespace-nowrap px-3">{d.sampleCount}件</td>
                    <td className="text-right py-2 whitespace-nowrap px-3">{(d.avgPricePerTsubo ?? d.avgPricePerSqm * 3.30578).toFixed(1)}万円/坪</td>
                    <td className="text-right py-2 whitespace-nowrap px-3">{(d.medianPricePerTsubo ?? d.medianPricePerSqm * 3.30578).toFixed(1)}万円/坪</td>
                    <td className="text-right py-2 whitespace-nowrap pl-3">
                      {d.ratioSampleCount && d.ratioSampleCount > 0 && d.medianPriceRatio != null
                        ? `${(d.medianPriceRatio * 100).toFixed(1)}%`
                        : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 text-center mt-1 sm:hidden">← 横スクロールで全列表示 →</p>
        </div>
      </div>
    </div>
  );
}
