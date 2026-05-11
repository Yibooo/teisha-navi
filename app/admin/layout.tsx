import Link from "next/link";

export const metadata = { title: "Admin｜定借ナビ" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin" className="hover:text-slate-800 font-medium">Admin</Link>
        <span>/</span>
        <nav className="flex gap-4">
          <Link href="/admin/properties" className="hover:text-slate-800">物件マスタ</Link>
          <Link href="/admin/transactions" className="hover:text-slate-800">取引データ</Link>
          <Link href="/admin/import" className="hover:text-slate-800">データインポート</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
