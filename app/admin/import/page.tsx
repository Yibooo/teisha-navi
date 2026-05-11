"use client";

import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ImportResult = {
  total: number;
  leaseholdFound: number;
  imported: number;
  errors: string[];
};

export default function ImportPage() {
  const [fromQ, setFromQ] = useState("20150");
  const [toQ, setToQ] = useState("20244");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [rebuildOnly, setRebuildOnly] = useState(false);

  const importAction = useAction(api.importMlit.importFromMlit);
  const rebuildCache = useMutation(api.analytics.rebuildCache);

  const handleImport = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await importAction({ fromQuarter: fromQ, toQuarter: toQ });
      setResult(res as ImportResult);
    } catch (e) {
      setResult({ total: 0, leaseholdFound: 0, imported: 0, errors: [String(e)] });
    } finally {
      setRunning(false);
    }
  };

  const handleRebuild = async () => {
    setRebuildOnly(true);
    await rebuildCache({});
    setRebuildOnly(false);
    alert("キャッシュを再構築しました");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">データインポート</h1>
      <p className="text-slate-600 mb-8 text-sm">
        国土交通省 不動産取引価格情報APIから東京23区の借地権マンション取引データを取得します。
        物件マスタに登録済みの物件のみがインポートされます。
      </p>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">取得期間</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <Label className="text-sm">開始時期</Label>
            <Input
              value={fromQ}
              onChange={(e) => setFromQ(e.target.value)}
              placeholder="例: 20151（2015年第1四半期）"
              className="mt-1"
            />
            <p className="text-xs text-slate-400 mt-1">形式: YYYYQ（例: 20151）</p>
          </div>
          <div>
            <Label className="text-sm">終了時期</Label>
            <Input
              value={toQ}
              onChange={(e) => setToQ(e.target.value)}
              placeholder="例: 20244（2024年第4四半期）"
              className="mt-1"
            />
            <p className="text-xs text-slate-400 mt-1">形式: YYYYQ（例: 20244）</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleImport}
            disabled={running}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? "インポート中…（数分かかります）" : "インポート実行"}
          </button>
          <button
            onClick={handleRebuild}
            disabled={rebuildOnly || running}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {rebuildOnly ? "再構築中..." : "キャッシュのみ再構築"}
          </button>
        </div>
      </div>

      {/* 注意事項 */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-sm text-amber-800 mb-6">
        <p className="font-semibold mb-1">⚠️ 実行前の確認事項</p>
        <ul className="space-y-1">
          <li>• 物件マスタに定期借地権マンションを先に登録してください</li>
          <li>• 23区分のAPIを順番に呼び出すため、完了まで数分かかります</li>
          <li>• 同じデータが重複してインポートされる可能性があります（要確認）</li>
        </ul>
      </div>

      {/* 結果 */}
      {result && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">インポート結果</h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500">取得した全取引</p>
              <p className="text-xl font-bold">{result.total.toLocaleString()}件</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500">借地権フィルタ後</p>
              <p className="text-xl font-bold">{result.leaseholdFound.toLocaleString()}件</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500">インポート成功</p>
              <p className="text-xl font-bold text-blue-700">{result.imported.toLocaleString()}件</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
              <p className="text-xs font-semibold text-red-700 mb-2">エラー ({result.errors.length}件)</p>
              <ul className="text-xs text-red-700 space-y-1 max-h-40 overflow-y-auto">
                {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
