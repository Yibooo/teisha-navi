"use client";

import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { AuthAwareLink } from "@/components/AuthAwareLink";

export function NavBar() {
  const { isSignedIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-slate-900 hover:text-slate-700">
          定借ナビ
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <AuthAwareLink to="analytics" className="hover:text-slate-900 transition-colors">
              資産価値グラフ
            </AuthAwareLink>
            <AuthAwareLink to="simulator" className="hover:text-slate-900 transition-colors">
              シミュレーター
            </AuthAwareLink>
            <Link href="/teisyaku-basics" className="hover:text-slate-900 transition-colors">
              定借マンションとは？
            </Link>
            <Link href="/about" className="hover:text-slate-900 transition-colors">
              このサービスについて
            </Link>
          </nav>

          {isSignedIn && <UserButton />}
          {!isSignedIn && (
            <Link
              href="/sign-in"
              className="text-sm font-medium px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              ログイン
            </Link>
          )}
        </div>

        {/* Mobile: auth + hamburger */}
        <div className="flex sm:hidden items-center gap-3">
          {isSignedIn && <UserButton />}
          {!isSignedIn && (
            <Link
              href="/sign-in"
              className="text-sm font-medium px-3 py-1 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              ログイン
            </Link>
          )}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="メニューを開く"
            className="text-2xl leading-none text-slate-700 focus:outline-none"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-3 text-sm font-medium text-slate-700">
          <AuthAwareLink to="analytics" onClick={() => setMenuOpen(false)} className="hover:text-slate-900 transition-colors py-1">
            資産価値グラフ
          </AuthAwareLink>
          <AuthAwareLink to="simulator" onClick={() => setMenuOpen(false)} className="hover:text-slate-900 transition-colors py-1">
            シミュレーター
          </AuthAwareLink>
          <Link href="/teisyaku-basics" onClick={() => setMenuOpen(false)} className="hover:text-slate-900 transition-colors py-1">
            定借マンションとは？
          </Link>
          <Link href="/about" onClick={() => setMenuOpen(false)} className="hover:text-slate-900 transition-colors py-1">
            このサービスについて
          </Link>
        </div>
      )}
    </header>
  );
}
