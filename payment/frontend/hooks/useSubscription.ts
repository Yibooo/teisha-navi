/**
 * hooks/useSubscription.ts
 *
 * サブスクリプション状態を取得するカスタムフック。
 * フロントエンド全体でサブスク状態の確認に使う。
 *
 * 使い方:
 *   const { isPremium, status, isLoading } = useSubscription();
 */

"use client";

import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";

export type SubscriptionStatus = "free" | "active" | "past_due" | "canceled";

export interface UseSubscriptionReturn {
  /** プレミアム機能が使えるか（active のみ true） */
  isPremium: boolean;
  /** 詳細なステータス */
  status: SubscriptionStatus;
  /** Stripe Customer ID */
  stripeCustomerId: string | null;
  /** 次回更新日（Unix timestamp 秒） */
  currentPeriodEnd: number | null;
  /** ローディング中 */
  isLoading: boolean;
  /** エラー */
  error: Error | null;
}

export function useSubscription(): UseSubscriptionReturn {
  const { userId } = useAuth();

  const user = useQuery(
    api.users.getMySubscription,
    userId ? { clerkUserId: userId } : "skip"
  );

  if (!userId || user === undefined) {
    return {
      isPremium: false,
      status: "free",
      stripeCustomerId: null,
      currentPeriodEnd: null,
      isLoading: true,
      error: null,
    };
  }

  const status: SubscriptionStatus = user?.subscriptionStatus ?? "free";

  return {
    isPremium: status === "active",
    status,
    stripeCustomerId: user?.stripeCustomerId ?? null,
    currentPeriodEnd: user?.currentPeriodEnd ?? null,
    isLoading: false,
    error: null,
  };
}
