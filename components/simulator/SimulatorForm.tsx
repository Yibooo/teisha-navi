"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { calculateSimulation } from "@/lib/simulation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export function SimulatorForm() {
  const [purchasePrice, setPurchasePrice] = useState<string>("5000");
  const [remainingYears, setRemainingYears] = useState<string>("60");
  const [yearsToLive, setYearsToLive] = useState<string>("20");

  const cachePoints = useQuery(api.analytics.getSimulationPoints, {});

  const canCalculate =
    cachePoints &&
    cachePoints.length > 0 &&
    Number(purchasePrice) > 0 &&
    Number(remainingYears) > 0 &&
    Number(yearsToLive) > 0;

  const result = canCalculate
    ? calculateSimulation(
        Number(purchasePrice),
        Number(remainingYears),
        Number(yearsToLive),
        cachePoints
      )
    : null;

  return (
    <div className="space-y-8">
      {/* 入力フォーム */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">物件情報を入力</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="price" className="text-sm font-medium text-slate-700">
              購入価格（万円）
            </Label>
            <Input
              id="price"
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="mt-1"
              min={100}
              max={100000}
              placeholder="例: 5000"
            />
            <p className="text-xs text-slate-400 mt-1">単位: 万円</p>
          </div>
          <div>
            <Label htmlFor="remaining" className="text-sm font-medium text-slate-700">
              現在の残存借地権年数（年）
            </Label>
            <Input
              id="remaining"
              type="number"
              value={remainingYears}
              onChange={(e) => setRemainingYears(e.target.value)}
              className="mt-1"
              min={1}
              max={70}
              placeholder="例: 60"
            />
            <p className="text-xs text-slate-400 mt-1">1〜70年</p>
          </div>
          <div>
            <Label htmlFor="years" className="text-sm font-medium text-slate-700">
              居住予定年数（年）
            </Label>
            <Input
              id="years"
              type="number"
              value={yearsToLive}
              onChange={(e) => setYearsToLive(e.target.value)}
              className="mt-1"
              min={1}
              max={70}
              placeholder="例: 20"
            />
            <p className="text-xs text-slate-400 mt-1">何年後に売却を想定？</p>
          </div>
        </div>
      </div>

      {/* 結果 */}
      {!cachePoints ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
          データを読み込み中...
        </div>
      ) : cachePoints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
          <p>データがありません。Adminからデータをインポートしてください。</p>
        </div>
      ) : result ? (
        <div className="space-y-4">
          {/* 警告バナー */}
          {result.warning !== "none" && (
            <div
              className={`rounded-xl p-4 border ${
                result.warning === "danger"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              <p className="font-semibold mb-1">
                {result.warning === "danger" ? "⚠️ 要注意" : "⚡ 注意"}
              </p>
              <p className="text-sm">{result.warningMessage}</p>
            </div>
          )}

          {/* 予測結果サマリー */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              {Number(yearsToLive)}年後の予測売却価格
            </h2>
            <div className="grid sm:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">購入価格</p>
                <p className="text-2xl font-bold text-slate-900">
                  {Number(purchasePrice).toLocaleString()}万円
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">予測売却価格</p>
                <p className="text-2xl font-bold text-blue-700">
                  {result.predictedPrice.toLocaleString()}万円
                </p>
              </div>
              <div
                className={`text-center p-4 rounded-xl ${
                  result.priceChangeRate >= 0
                    ? "bg-green-50"
                    : "bg-red-50"
                }`}
              >
                <p className="text-xs text-slate-500 mb-1">価格変動率</p>
                <p
                  className={`text-2xl font-bold ${
                    result.priceChangeRate >= 0 ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {result.priceChangeRate >= 0 ? "+" : ""}
                  {result.priceChangeRate.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <Badge variant="outline">
                売却時残存年数: {result.futureRemainingYears}年
              </Badge>
              <Badge variant="outline">
                参考取引件数: {result.sampleCount}件
              </Badge>
              <Badge variant="secondary">過去の中央値ベースの参考値</Badge>
            </div>
          </div>

          {/* 価格推移グラフ */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-700 mb-4">
              居住年数別 予測売却価格推移
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={result.dataPoints} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="year"
                  tickFormatter={(v) => `${v}年後`}
                />
                <YAxis
                  tickFormatter={(v) => `${Number(v).toLocaleString()}万`}
                  domain={["auto", "auto"]}
                  width={70}
                />
                <Tooltip
                  formatter={(v) => [`${Number(v).toLocaleString()}万円`, "予測売却価格"]}
                  labelFormatter={(l) => `${l}年後`}
                />
                <ReferenceLine
                  y={Number(purchasePrice)}
                  stroke="#94a3b8"
                  strokeDasharray="6 3"
                  label={{ value: "購入価格", position: "right", fontSize: 11 }}
                />
                <Line
                  dataKey="predictedPrice"
                  name="予測売却価格"
                  type="monotone"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {/* 注意事項 */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-xs text-amber-800">
        <p className="font-semibold mb-1">⚠️ 免責事項</p>
        <p>
          シミュレーション結果は、東京23区の過去の定期借地権マンション取引データの中央値に基づく参考値です。
          個別物件の状況（立地・築年数・仕様等）により実際の価格は大きく異なります。
          本シミュレーションは投資助言ではありません。売買の意思決定は必ず専門家にご相談ください。
        </p>
      </div>
    </div>
  );
}
