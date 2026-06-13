import Link from "next/link";

// 公開版（認証不要）エリア共通レイアウト
// proxy.ts の保護対象に含まれないため、ログインなしで閲覧できる。
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* 公開版バナー / サブナビ */}
      <div className="bg-emerald-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-semibold flex items-center gap-1">
            🔓 公開版（ログイン不要）
          </span>
          <nav className="flex items-center gap-4 font-medium">
            <Link href="/public/analytics" className="hover:underline">
              資産価値グラフ
            </Link>
            <Link href="/public/simulator" className="hover:underline">
              シミュレーター
            </Link>
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
