/**
 * app/api/stripe/create-checkout/route.ts
 *
 * Stripe Checkout Session を作成し、決済ページの URL を返す。
 * Phase 1 実装時に app/api/stripe/create-checkout/route.ts としてコピーして使用。
 *
 * 依存パッケージ（Phase 1 実装時にインストール）:
 *   npm install stripe @stripe/stripe-js
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// 環境変数が未設定の場合はエラーを返す（ベータ期間中は安全に無効化）
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const priceId = process.env.STRIPE_PRICE_ID;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://teisha-navi.vercel.app";

export async function POST(request: NextRequest) {
  if (!stripeSecretKey || !priceId) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-04-30.basil" });

  try {
    const { clerkUserId, email } = await request.json() as {
      clerkUserId: string;
      email: string;
    };

    if (!clerkUserId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Stripe Customer を作成（既存の場合は再利用するため、
    // 実運用では Convex から stripeCustomerId を取得して渡す）
    const customer = await stripe.customers.create({
      email,
      metadata: { clerkUserId },
    });

    // Checkout Session を作成
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // 決済完了後のリダイレクト先
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      // 日本円請求書の自動発行
      invoice_creation: undefined,
      // メタデータ（Webhook で clerkUserId を参照するため）
      metadata: { clerkUserId },
      // 日本語ロケール
      locale: "ja",
      // 電話番号は任意
      phone_number_collection: { enabled: false },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
