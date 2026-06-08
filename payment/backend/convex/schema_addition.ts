/**
 * Convex スキーマ追加分 — payment/backend/convex/schema_addition.ts
 *
 * このファイルのテーブル定義を convex/schema.ts の defineSchema({}) 内に追加する。
 * Phase 1 実装時に実際の schema.ts に統合すること。
 *
 * 追加手順:
 *   1. convex/schema.ts を開く
 *   2. defineSchema({ ... }) の中に下記 users テーブルを追加
 *   3. npx convex dev で型を再生成
 */

import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * users テーブル
 *
 * Clerk の userId をキーに、Stripe のサブスクリプション状態を管理する。
 * Clerk の userId はフロントエンドから useAuth().userId で取得できる。
 */
export const usersTableDefinition = defineTable({
  /** Clerk の userId（例: "user_2abc..."） */
  clerkUserId: v.string(),

  /** ユーザーのメールアドレス（Clerk から取得） */
  email: v.string(),

  /**
   * Stripe の Customer ID（例: "cus_Nffrfeq..."）
   * Checkout Session 作成時に初めてセットされる
   */
  stripeCustomerId: v.optional(v.string()),

  /**
   * サブスクリプション状態
   * - free:      未課金（デフォルト）
   * - active:    有効
   * - past_due:  支払い遅延中（Stripe がリトライ中）
   * - canceled:  解約済み or 期限切れ
   */
  subscriptionStatus: v.union(
    v.literal("free"),
    v.literal("active"),
    v.literal("past_due"),
    v.literal("canceled"),
  ),

  /** Stripe の Subscription ID（例: "sub_1N..."） */
  subscriptionId: v.optional(v.string()),

  /**
   * 現在の課金期間の終了日（Unix timestamp 秒）
   * この日時まではキャンセル後も利用可能
   */
  currentPeriodEnd: v.optional(v.number()),

  /** プラン識別子（例: "monthly_500"） */
  planId: v.optional(v.string()),

  /** レコード作成日時（Unix timestamp ミリ秒） */
  createdAt: v.number(),
})
  .index("by_clerk_id", ["clerkUserId"])
  .index("by_stripe_customer", ["stripeCustomerId"]);

// convex/schema.ts への統合例:
//
// import { usersTableDefinition } from "./users"; // 実際はここに直接書く
//
// export default defineSchema({
//   properties: ..., // 既存
//   transactions: ..., // 既存
//   users: usersTableDefinition, // ← これを追加
// });
