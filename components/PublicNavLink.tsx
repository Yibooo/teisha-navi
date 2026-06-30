import Link from "next/link";

/**
 * トップ・解説ページなど「誰でも見られる」導線から、資産価値グラフ /
 * シミュレーターへ遷移するためのリンク。
 *
 * 認証状態に関わらず必ず公開版（/public/*）へ遷移する。
 * これにより、未ログインはもちろん、セッション切れ等で auth 状態が
 * 不安定なユーザーでもログイン壁（パスワード要求）に当たらない。
 *
 * 保護ページ（/analytics, /simulator, /admin）と proxy.ts は変更しないため、
 * 直接アクセス時のログイン機能はそのまま維持される。
 */
export function PublicNavLink({
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
  return (
    <Link href={`/public/${to}`} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
