"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Id } from "@/convex/_generated/dataModel";

type PropertyForm = {
  name: string;
  ward: string;
  address: string;
  leaseStartYear: string;
  leaseTotalYears: string;
  buildingYear: string;
  totalUnits: string;
  nearestStation: string;
  walkMinutes: string;
  notes: string;
};

const EMPTY_FORM: PropertyForm = {
  name: "",
  ward: "",
  address: "",
  leaseStartYear: "",
  leaseTotalYears: "70",
  buildingYear: "",
  totalUnits: "",
  nearestStation: "",
  walkMinutes: "",
  notes: "",
};

const WARDS = [
  "千代田区","中央区","港区","新宿区","文京区","台東区",
  "墨田区","江東区","品川区","目黒区","大田区","世田谷区",
  "渋谷区","中野区","杉並区","豊島区","北区","荒川区",
  "板橋区","練馬区","足立区","葛飾区","江戸川区",
];

export default function PropertiesPage() {
  const properties = useQuery(api.properties.list, {});
  const upsert = useMutation(api.properties.upsert);
  const remove = useMutation(api.properties.remove);

  const [form, setForm] = useState<PropertyForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await upsert({
        id: editingId ? (editingId as Id<"properties">) : undefined,
        name: form.name,
        ward: form.ward,
        address: form.address,
        leaseStartYear: Number(form.leaseStartYear),
        leaseTotalYears: Number(form.leaseTotalYears),
        buildingYear: Number(form.buildingYear),
        totalUnits: form.totalUnits ? Number(form.totalUnits) : undefined,
        nearestStation: form.nearestStation || undefined,
        walkMinutes: form.walkMinutes ? Number(form.walkMinutes) : undefined,
        notes: form.notes || undefined,
      });
      setForm(EMPTY_FORM);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p: NonNullable<typeof properties>[0]) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      ward: p.ward,
      address: p.address,
      leaseStartYear: String(p.leaseStartYear),
      leaseTotalYears: String(p.leaseTotalYears),
      buildingYear: String(p.buildingYear),
      totalUnits: p.totalUnits ? String(p.totalUnits) : "",
      nearestStation: p.nearestStation ?? "",
      walkMinutes: p.walkMinutes ? String(p.walkMinutes) : "",
      notes: p.notes ?? "",
    });
  };

  const f = (k: keyof PropertyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-8">物件マスタ管理</h1>

      {/* フォーム */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
        <h2 className="font-semibold text-slate-900 mb-4">
          {editingId ? "物件を編集" : "物件を追加"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>マンション名 *</Label>
              <Input value={form.name} onChange={f("name")} required className="mt-1" />
            </div>
            <div>
              <Label>区 *</Label>
              <select
                value={form.ward}
                onChange={f("ward")}
                required
                className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="">選択してください</option>
                {WARDS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>住所 *</Label>
              <Input value={form.address} onChange={f("address")} required className="mt-1" />
            </div>
            <div>
              <Label>借地権開始年 *</Label>
              <Input type="number" value={form.leaseStartYear} onChange={f("leaseStartYear")} required className="mt-1" placeholder="例: 2000" />
            </div>
            <div>
              <Label>借地権総期間（年） *</Label>
              <Input type="number" value={form.leaseTotalYears} onChange={f("leaseTotalYears")} required className="mt-1" placeholder="例: 70" />
            </div>
            <div>
              <Label>建築年 *</Label>
              <Input type="number" value={form.buildingYear} onChange={f("buildingYear")} required className="mt-1" placeholder="例: 2001" />
            </div>
            <div>
              <Label>総戸数</Label>
              <Input type="number" value={form.totalUnits} onChange={f("totalUnits")} className="mt-1" placeholder="例: 150" />
            </div>
            <div>
              <Label>最寄駅</Label>
              <Input value={form.nearestStation} onChange={f("nearestStation")} className="mt-1" placeholder="例: 品川駅" />
            </div>
            <div>
              <Label>徒歩分数</Label>
              <Input type="number" value={form.walkMinutes} onChange={f("walkMinutes")} className="mt-1" placeholder="例: 5" />
            </div>
            <div className="sm:col-span-2">
              <Label>備考</Label>
              <textarea
                value={form.notes}
                onChange={f("notes")}
                className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm min-h-16"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "保存中..." : editingId ? "更新" : "追加"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                キャンセル
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 一覧 */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-slate-900">物件一覧（{properties?.length ?? 0}件）</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">物件名</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">区</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">建築年</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">借地権</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">残存年数</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {properties?.map((p) => {
                const remaining = p.leaseStartYear + p.leaseTotalYears - new Date().getFullYear();
                return (
                  <tr key={p._id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600">{p.ward}</td>
                    <td className="px-4 py-3 text-slate-600">{p.buildingYear}年</td>
                    <td className="px-4 py-3 text-slate-600">{p.leaseStartYear}年〜{p.leaseTotalYears}年</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${remaining < 30 ? "text-red-600" : remaining < 40 ? "text-amber-600" : "text-green-700"}`}>
                        {remaining}年
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(p)} className="text-xs text-blue-600 hover:underline">編集</button>
                        <button
                          onClick={() => { if (confirm(`「${p.name}」を削除しますか？`)) remove({ id: p._id }); }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {properties?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    物件が登録されていません
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
