/**
 * app/api/stripe/webhook/route.ts
 *
 * Stripe からの Webhook を受信し、Convex の users テーブルを更新する。
 * 署名検証で不正なリクエストを弾く。
 *
 * Phase 1 実装時に app/api/stripe/webhook/route.ts としてコピーして使用。
 *
 * ⚠️ Next.js の bodyParser を無効化する必要がある（route.ts では自動で raw body が使える）
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

export async function POST(request: NextRequest) {
  if (!stripeSecretKey || !webhookSecret) {
    console.warn("Stripe webhook: environment variables not configured");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-04-30.basil" });
  const convex = new ConvexHttpClient(convexUrl);

  // raw body を取得（署名検証に必要）
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ─────────────────────────────────────────
  // イベント処理
  // ─────────────────────────────────────────

  try {
    switch (event.type) {
      // 決済完了 → active に更新
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Subscription の詳細を取得して期間終了日を取る
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        await convex.mutation(api.users.updateSubscription, {
          stripeCustomerId: customerId,
          subscriptionStatus: "active",
          subscriptionId,
          currentPeriodEnd: subscription.current_period_end,
          planId: "monthly_500",
        });
        break;
      }

      // 月次更新成功 → currentPeriodEnd を更新
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        await convex.mutation(api.users.updateSubscription, {
          stripeCustomerId: customerId,
          subscriptionStatus: "active",
          subscriptionId,
          currentPeriodEnd: subscription.current_period_end,
        });
        break;
      }

      // 支払い失敗 → past_due に更新
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await convex.mutation(api.users.updateSubscription, {
          stripeCustomerId: customerId,
          subscriptionStatus: "past_due",
        });
        break;
      }

      // 解約・期限切れ → canceled に更新
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await convex.mutation(api.users.updateSubscription, {
          stripeCustomerId: customerId,
          subscriptionStatus: "canceled",
        });
        break;
      }

      default:
        // 未処理のイベントは無視（200 を返して Stripe に受信済みを通知）
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
