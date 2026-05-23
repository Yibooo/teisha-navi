"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function TransactionsPage() {
  const transactions = useQuery(api.transactions.list, {});
  const properties = useQuery(api.properties.list, {});
  const remove = useMutation(api.transactions.remove);

  const propMap = new Map((properties ?? []).map((p) => [p._id as string, p.name]));

  // 物件ごとの連番を計算（成約日降順で No.1, 2, 3...）
  const noMap = new Map<string, number>();
  if (transactions) {
    // 物件ごとにグループ化して成約日降順でソート
    const groups = new Map<string, typeof transactions>();
    for (const t of transactions) {
      const key = t.propertyId as string;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    for (const [, group] of groups) {
      const sorted = [...group].sort((a, b) => {
        const da = (a.transactionDate as string | undefined) ?? a.transactionYearQ ?? "";
        const db = (b.transactionDate as string | undefined) ?? b.transactionYearQ ?? "";
        return db.localeCompare(da); // 降順
      });
      sorted.forEach((t, i) => noMap.set(t._id as string, i + 1));
    }
  }

  // 表示順: マンション名昇順 → 成約日降順
  const sorted = [...(transactions ?? [])].sort((a, b) => {
    const na = propMap.get(a.propertyId as string) ?? "";
    const nb = propMap.get(b.propertyId as string) ?? "";
    if (na !== nb) return na.localeCompare(nb, "ja");
    const da = (a.transactionDate as string | undefined) ?? a.transactionYearQ ?? "";
    const db = (b.transactionDate as string | undefined) ?? b.transactionYearQ ?? "";
    return db.localeCompare(da);
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">取引データ管理</h1>
      <p className="text-slate-600 text-sm mb-8">
        取引データは「データインポート」または「物件マスタ編集」から追加できます。
      </p>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-slate-900">取引一覧（{transactions?.length ?? 0}件）</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">マンション名</th>
                <th className="text-right px-3 py-3 font-medium text-slate-600">No</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">成約年月日</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">成約価格</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">面積</th>
                <th className="text-left px-3 py-3 font-medium text-slate-600">間取</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">管理費</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">単価</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">残存年数</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">種別</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => {
                const propName = propMap.get(t.propertyId as string) ?? "—";
                const no = noMap.get(t._id as string) ?? "—";
                const dateDisplay =
                  (t.transactionDate as string | undefined) ?? t.transactionYearQ ?? "—";
                const managementFee = t.managementFee as number | undefined;
                const layout = t.layout as string | undefined;
                return (
                  <tr key={t._id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{propName}</td>
                    <td className="px-3 py-3 text-right text-slate-400 text-xs">{no}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{dateDisplay}</td>
                    <td className="px-4 py-3 text-right font-medium">{t.price.toLocaleString()}万円</td>
                    <td className="px-4 py-3 text-right">{t.areaSqm}m²</td>
                    <td className="px-3 py-3 text-slate-600">{layout ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {managementFee != null ? `${managementFee.toLocaleString()}円` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">{t.pricePerSqm}万円/m²</td>
                    <td className="px-4 py-3 text-right">
                      <span className={t.remainingLeaseYears < 30 ? "text-red-600 font-medium" : t.remainingLeaseYears < 40 ? "text-amber-600" : ""}>
                        {t.remainingLeaseYears}年
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const pt = t.priceType ?? (t.isNewConstruction ? "new_construction" : "transaction");
                        const map: Record<string, { label: string; cls: string }> = {
                          new_construction: { label: "新築価格", cls: "bg-blue-100 text-blue-700" },
                          listing:          { label: "売り出し", cls: "bg-amber-100 text-amber-700" },
                          transaction:      { label: "成約価格", cls: "bg-green-100 text-green-700" },
                        };
                        const { label, cls } = map[pt] ?? { label: pt, cls: "bg-slate-100 text-slate-600" };
                        return <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { if (confirm("この取引データを削除しますか？")) remove({ id: t._id }); }}
                        className="text-xs text-red-500 hover:underline"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                );
              })}
              {transactions?.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                    取引データがありません。インポートページからデータを取得してください。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
