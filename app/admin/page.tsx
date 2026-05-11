"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

export default function AdminDashboard() {
  const txStats = useQuery(api.transactions.getStats, {});
  const properties = useQuery(api.properties.list, {});

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Admin ダッシュボード</h1>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">物件マスタ</p>
          <p className="text-3xl font-bold text-slate-900">{properties?.length ?? "—"}</p>
          <p className="text-xs text-slate-400 mt-1">件</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">取引データ（中古）</p>
          <p className="text-3xl font-bold text-slate-900">{txStats?.resale ?? "—"}</p>
          <p className="text-xs text-slate-400 mt-1">件</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">取引データ（新築）</p>
          <p className="text-3xl font-bold text-slate-900">{txStats?.newConstruction ?? "—"}</p>
          <p className="text-xs text-slate-400 mt-1">件</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { href: "/admin/import", label: "データインポート", desc: "国交省APIからデータを取得" },
          { href: "/admin/properties", label: "物件マスタ管理", desc: "定期借地権マンションの追加・編集" },
          { href: "/admin/transactions", label: "取引データ管理", desc: "取引履歴の確認・編集" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <p className="font-semibold text-slate-900 mb-1">{item.label}</p>
            <p className="text-sm text-slate-500">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
