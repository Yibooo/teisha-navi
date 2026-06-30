"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

/**
 * 認証状態に応じて遷移先を切り替えるリンク。
 * - 未ログイン: /public/* （ログイン不要の公開版）へ遷移し、ログイン壁に当たらない
 * - ログイン済み: /* （通常版）へ遷移し、認証ありの体験を維持
 *
 * 保護ページ（/analytics, /simulator）や proxy.ts は変更しないため、
 * ログイン機能はそのまま維持される。
 */
export function AuthAwareLink({
  to,
  className,
  children,
  onClick,
}: {
  to: "analytics" | "simulator";
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const { isSignedIn } = useAuth();
  // isSignedIn が undefined（読み込み中）の場合は公開版を既定にして壁を避ける
  const href = isSignedIn ? `/${to}` : `/public/${to}`;
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
