"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ImportResult = {
  total: number;
  leaseholdFound: number;
  imported: number;
  skipped?: number;
  errors: string[];
};

export default function ImportPage() {
  const [fromQ, setFromQ] = useState("20151");
  const [toQ, setToQ] = useState("20244");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [rebuildOnly, setRebuildOnly] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const rebuildCache = useMutation(api.analytics.rebuildCache);

  const handleApiImport = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/import-mlit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromQuarter: fromQ, toQuarter: toQ }),
      });
      setResult(await res.json());
    } catch (e) {
      setResult({ total: 0, leaseholdFound: 0, imported: 0, errors: [String(e)] });
    } finally {
      setRunning(false);
    }
  };

  const handleCsvImport = async () => {
    if (!selectedFile) return;
    setRunning(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      const res = await fetch("/api/import-csv", { method: "POST", body: form });
      setResult(await res.json());
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
      <p className="text-slate-600 mb-6 text-sm">
        国土交通省の不動産取引価格情報を取り込みます。物件マスタに登録済みの物件のみがインポートされます。
      </p>

      <Tabs defaultValue="csv" className="mb-6">
        <TabsList>
          <TabsTrigger value="csv">CSV アップロード（推奨）</TabsTrigger>
          <TabsTrigger value="api">API 直接取得</TabsTrigger>
        </TabsList>

        {/* ─── CSV タブ ─── */}
        <TabsContent value="csv">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-1">国交省 CSV を手動ダウンロードしてアップロード</h2>
            <p className="text-sm text-slate-500 mb-5">
              国交省サーバーは海外IPからのAPIアクセスをブロックするため、CSVを手動でダウンロードします。
            </p>

            {/* ダウンロード手順 */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 mb-6">
              <p className="text-sm font-semibold text-blue-900 mb-2">📥 CSVダウンロード手順</p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>
                  <a
                    href="https://www.land.mlit.go.jp/webland/servlet/MainServlet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    国土交通省 土地総合情報システム
                  </a>
                  を開く
                </li>
                <li>「不動産取引価格情報ダウンロード」を選択</li>
                <li>都道府県：東京都 / 期間：任意（例: 2015年〜2024年）を選択</li>
                <li>「ダウンロード」ボタンを押してCSVファイルを保存</li>
                <li>下のフォームからそのCSVをアップロード</li>
              </ol>
            </div>

            <div className="mb-5">
              <Label className="text-sm mb-1 block">CSVファイルを選択</Label>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100"
              />
              {selectedFile && (
                <p className="text-xs text-slate-400 mt-1">{selectedFile.name}（{(selectedFile.size / 1024).toFixed(0)} KB）</p>
              )}
            </div>

            <button
              onClick={handleCsvImport}
              disabled={running || !selectedFile}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {running ? "インポート中…" : "CSVをインポート"}
            </button>
          </div>
        </TabsContent>

        {/* ─── API タブ ─── */}
        <TabsContent value="api">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-1">国交省 API 直接取得</h2>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 text-xs text-amber-800 mb-4">
              ⚠️ 国交省サーバーは海外IPからのアクセスをブロックする場合があります。接続できない場合はCSVタブをご利用ください。
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div>
                <Label className="text-sm">開始時期</Label>
                <Input value={fromQ} onChange={(e) => setFromQ(e.target.value)} className="mt-1" placeholder="例: 20151" />
                <p className="text-xs text-slate-400 mt-1">形式: YYYYQ</p>
              </div>
              <div>
                <Label className="text-sm">終了時期</Label>
                <Input value={toQ} onChange={(e) => setToQ(e.target.value)} className="mt-1" placeholder="例: 20244" />
                <p className="text-xs text-slate-400 mt-1">形式: YYYYQ</p>
              </div>
            </div>
            <button
              onClick={handleApiImport}
              disabled={running}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {running ? "インポート中…（数分かかります）" : "API取得を実行"}
            </button>
          </div>
        </TabsContent>
      </Tabs>

      {/* キャッシュ再構築 */}
      <div className="mb-6">
        <button
          onClick={handleRebuild}
          disabled={rebuildOnly || running}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {rebuildOnly ? "再構築中..." : "グラフキャッシュを再構築"}
        </button>
        <p className="text-xs text-slate-400 mt-1">取引データ追加後にグラフを更新する場合に実行</p>
      </div>

      {/* 結果 */}
      {result && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">インポート結果</h2>
          <div className="grid sm:grid-cols-4 gap-4 mb-4">
            {[
              { label: "CSV全行数", val: result.total },
              { label: "借地権フィルタ後", val: result.leaseholdFound },
              { label: "物件マスタ不一致", val: result.skipped ?? 0 },
              { label: "インポート成功", val: result.imported, blue: true },
            ].map((s) => (
              <div key={s.label} className={`rounded-lg p-3 text-center ${s.blue ? "bg-blue-50" : "bg-slate-50"}`}>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className={`text-xl font-bold ${s.blue ? "text-blue-700" : ""}`}>{s.val.toLocaleString()}件</p>
              </div>
            ))}
          </div>
          {result.errors.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
              <p className="text-xs font-semibold text-red-700 mb-2">エラー ({result.errors.length}件)</p>
              <ul className="text-xs text-red-700 space-y-1 max-h-40 overflow-y-auto">
                {result.errors.slice(0, 20).map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
