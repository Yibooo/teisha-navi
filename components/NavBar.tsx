import Link from "next/link";

export function NavBar() {
  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-slate-900 hover:text-slate-700">
          定借ナビ
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/analytics" className="hover:text-slate-900 transition-colors">
            資産価値グラフ
          </Link>
          <Link href="/simulator" className="hover:text-slate-900 transition-colors">
            シミュレーター
          </Link>
          <Link href="/about" className="hover:text-slate-900 transition-colors">
            このサービスについて
          </Link>
        </nav>
      </div>
    </header>
  );
}
