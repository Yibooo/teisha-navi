/**
 * convex/users.ts — ユーザー管理 Mutation / Query
 *
 * Phase 1 実装時に convex/users.ts としてコピーして使用する。
 * convex/schema.ts への users テーブル追加が先に必要。
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─────────────────────────────────────────────
// Query
// ─────────────────────────────────────────────

/**
 * 現在のユーザーのサブスクリプション情報を取得する
 * フロントエンド側: const sub = useQuery(api.users.getMySubscription);
 */
export const getMySubscription = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", clerkUserId))
      .first();
    return user ?? null;
  },
});

/**
 * Stripe Customer ID からユーザーを検索する（Webhook処理用）
 */
export const getByStripeCustomerId = query({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, { stripeCustomerId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_stripe_customer", (q) =>
        q.eq("stripeCustomerId", stripeCustomerId)
      )
      .first();
  },
});

// ─────────────────────────────────────────────
// Mutation
// ─────────────────────────────────────────────

/**
 * ユーザーを作成（初回ログイン時 or Checkout 時に呼ぶ）
 * 既存の場合は stripeCustomerId のみ更新する
 */
export const upsertUser = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    stripeCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, { clerkUserId, email, stripeCustomerId }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", clerkUserId))
      .first();

    if (existing) {
      if (stripeCustomerId && !existing.stripeCustomerId) {
        await ctx.db.patch(existing._id, { stripeCustomerId });
      }
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkUserId,
      email,
      stripeCustomerId,
      subscriptionStatus: "free",
      createdAt: Date.now(),
    });
  },
});

/**
 * サブスクリプション状態を更新する（Webhook処理から呼ぶ）
 */
export const updateSubscription = mutation({
  args: {
    stripeCustomerId: v.string(),
    subscriptionStatus: v.union(
      v.literal("free"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
    ),
    subscriptionId: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    planId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_customer", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .first();

    if (!user) {
      console.error(`User not found for stripeCustomerId: ${args.stripeCustomerId}`);
      return;
    }

    await ctx.db.patch(user._id, {
      subscriptionStatus: args.subscriptionStatus,
      ...(args.subscriptionId && { subscriptionId: args.subscriptionId }),
      ...(args.currentPeriodEnd && { currentPeriodEnd: args.currentPeriodEnd }),
      ...(args.planId && { planId: args.planId }),
    });
  },
});
