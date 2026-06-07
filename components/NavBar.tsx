"use client";

import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";

export function NavBar() {
  const { isSignedIn } = useAuth();

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-slate-900 hover:text-slate-700">
          定借ナビ
        </Link>
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/analytics" className="hover:text-slate-900 transition-colors">
              資産価値グラフ
            </Link>
            <Link href="/simulator" className="hover:text-slate-900 transition-colors">
              シミュレーター
            </Link>
            <Link href="/teisyaku-basics" className="hover:text-slate-900 transition-colors">
              定借マンションとは？
            </Link>
            <Link href="/about" className="hover:text-slate-900 transition-colors">
              このサービスについて
            </Link>
          </nav>

          {/* ログイン済み: アバターアイコン（クリックでログアウトメニュー） */}
          {isSignedIn && (
            <UserButton />
          )}

          {/* 未ログイン: ログインボタン */}
          {!isSignedIn && (
            <Link
              href="/sign-in"
              className="text-sm font-medium px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
