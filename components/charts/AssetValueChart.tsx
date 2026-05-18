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
} from "recharts";

type CachePoint = {
  remainingYearsBucket: string;
  bucketMin: number;
  bucketMax: number;
  avgPriceRatio: number;
  medianPriceRatio: number;
  sampleCount: number;
  avgPricePerSqm: number;
  medianPricePerSqm: number;
  avgPricePerTsubo?: number;
  medianPricePerTsubo?: number;
};

type Props = {
  data: CachePoint[];
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-bold text-slate-900 mb-2">残存{label}年</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.name.includes("比率") ? `${(p.value * 100).toFixed(1)}%` : `${p.value.toFixed(1)}万円/坪`}
        </p>
      ))}
    </div>
  );
};

export function AssetValueChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-slate-400">
        <p>データがありません。Adminからデータをインポートしてください。</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 新築比価格比率グラフ */}
      <div>
        <h3 className="text-base font-semibold text-slate-700 mb-1">新築時価格を100%とした場合の価格比率</h3>
        <p className="text-xs text-slate-400 mb-4">100%超 = 新築時より値上がり。残存年数が長いほど高い傾向にあります</p>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="bucketMin"
              tickFormatter={(v) => `${v}年`}
              label={{ value: "残存年数", position: "insideBottom", offset: -5, fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              domain={[0, "auto"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" />
            <ReferenceLine y={1} stroke="#94a3b8" strokeDasharray="6 3" label={{ value: "新築時=100%", position: "right", fontSize: 11 }} />
            <Bar dataKey="avgPriceRatio" name="平均比率" fill="#93c5fd" radius={[3, 3, 0, 0]} />
            <Line dataKey="medianPriceRatio" name="中央値比率" type="monotone" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 坪単価グラフ */}
      <div>
        <h3 className="text-base font-semibold text-slate-700 mb-1">残存年数別 平均坪単価（万円/坪）</h3>
        <p className="text-xs text-slate-400 mb-4">サンプル件数が少ないバケットはご参考程度にご覧ください</p>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="bucketMin"
              tickFormatter={(v) => `${v}年`}
            />
            <YAxis tickFormatter={(v) => `${v}万`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" />
            <Bar dataKey="avgPricePerTsubo" name="平均坪単価（万円/坪）" fill="#6ee7b7" radius={[3, 3, 0, 0]} />
            <Line dataKey="medianPricePerTsubo" name="中央値坪単価（万円/坪）" type="monotone" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* サンプル数テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-slate-600">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-medium">残存年数帯</th>
              <th className="text-right py-2 font-medium">サンプル数</th>
              <th className="text-right py-2 font-medium">平均坪単価</th>
              <th className="text-right py-2 font-medium">中央値坪単価</th>
              <th className="text-right py-2 font-medium">新築比（中央値）</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.remainingYearsBucket} className="border-b last:border-0 hover:bg-slate-50">
                <td className="py-2">{d.bucketMin}〜{d.bucketMax}年</td>
                <td className="text-right py-2">{d.sampleCount}件</td>
                <td className="text-right py-2">{(d.avgPricePerTsubo ?? d.avgPricePerSqm * 3.30578).toFixed(1)}万円/坪</td>
                <td className="text-right py-2">{(d.medianPricePerTsubo ?? d.medianPricePerSqm * 3.30578).toFixed(1)}万円/坪</td>
                <td className="text-right py-2">{(d.medianPriceRatio * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
