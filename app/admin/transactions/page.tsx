"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function TransactionsPage() {
  const transactions = useQuery(api.transactions.list, {});
  const properties = useQuery(api.properties.list, {});
  const remove = useMutation(api.transactions.remove);

  const propMap = new Map((properties ?? []).map((p) => [p._id as string, p.name]));

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
                <th className="text-left px-4 py-3 font-medium text-slate-600">物件名</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">取引時期</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">成約価格</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">面積</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">単価</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">残存年数</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">種別</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {transactions?.map((t) => (
                <tr key={t._id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{propMap.get(t.propertyId as string) ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{t.transactionYearQ}</td>
                  <td className="px-4 py-3 text-right">{t.price.toLocaleString()}万円</td>
                  <td className="px-4 py-3 text-right">{t.areaSqm}m²</td>
                  <td className="px-4 py-3 text-right">{t.pricePerSqm}万円/m²</td>
                  <td className="px-4 py-3 text-right">
                    <span className={t.remainingLeaseYears < 30 ? "text-red-600 font-medium" : t.remainingLeaseYears < 40 ? "text-amber-600" : ""}>
                      {t.remainingLeaseYears}年
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${t.isNewConstruction ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                      {t.isNewConstruction ? "新築" : "中古"}
                    </span>
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
              ))}
              {transactions?.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
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
