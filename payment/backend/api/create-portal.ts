/**
 * app/api/stripe/create-portal/route.ts
 *
 * Stripe Customer Portal の URL を生成する。
 * ユーザーはこのページでカード変更・解約ができる。
 *
 * Phase 1 実装時に app/api/stripe/create-portal/route.ts としてコピーして使用。
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://teisha-navi.vercel.app";

export async function POST(request: NextRequest) {
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-04-30.basil" });

  try {
    const { stripeCustomerId } = await request.json() as { stripeCustomerId: string };

    if (!stripeCustomerId) {
      return NextResponse.json({ error: "Missing stripeCustomerId" }, { status: 400 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${baseUrl}/account`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Stripe portal error:", error);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
