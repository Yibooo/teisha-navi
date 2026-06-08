# 決済機能 — 技術アーキテクチャ設計

## システム全体図

```
┌─────────────────────────────────────────────────────────────┐
│                        ユーザーブラウザ                         │
│                                                             │
│   Next.js App Router  ←→  Clerk Auth (既存)                 │
│   ├── /pricing        (料金ページ)                           │
│   ├── /success        (決済完了)                             │
│   ├── /account        (サブスク管理)                         │
│   └── PremiumGate     (機能制限コンポーネント)                 │
└──────────┬──────────────────────┬───────────────────────────┘
           │ useQuery/useMutation │ fetch (API Routes)
    ┌──────▼──────┐      ┌────────▼────────────────┐
    │  Convex DB  │      │    Next.js API Routes    │
    │  users      │◄────►│  /api/stripe/            │
    │  テーブル    │      │   ├── create-checkout    │
    └─────────────┘      │   ├── create-portal      │
                         │   └── webhook            │
                         └────────┬────────────────┘
                                  │ Stripe SDK
                         ┌────────▼────────────────┐
                         │      Stripe API          │
                         │  Customer / Subscription │
                         │  Checkout / Portal       │
                         │  Webhook Events          │
                         └─────────────────────────┘
```

---

## Convex スキーマ設計

### users テーブル（新規追加）

```typescript
users: defineTable({
  clerkUserId:         v.string(),           // Clerk の userId（主キー相当）
  email:               v.string(),
  stripeCustomerId:    v.optional(v.string()), // Stripe Customer ID
  subscriptionStatus:  v.union(
    v.literal("free"),
    v.literal("active"),     // 有効
    v.literal("past_due"),   // 支払い遅延中
    v.literal("canceled"),   // 解約済み
  ),
  subscriptionId:      v.optional(v.string()), // Stripe Subscription ID
  currentPeriodEnd:    v.optional(v.number()), // Unix timestamp（次回更新日）
  planId:              v.optional(v.string()), // "monthly_500"
  createdAt:           v.number(),
})
  .index("by_clerk_id",       ["clerkUserId"])
  .index("by_stripe_customer", ["stripeCustomerId"]),
```

---

## 決済フロー詳細

### 1. 新規申込フロー

```
[ユーザー]                [Next.js]               [Stripe]         [Convex]
    │                         │                        │                │
    │── 「登録する」クリック ──►│                        │                │
    │                         │── POST create-checkout ►│                │
    │                         │                        │                │
    │                         │◄── Checkout Session URL ─│                │
    │                         │                        │                │
    │◄── redirect to Stripe ──│                        │                │
    │                                                  │                │
    │── カード入力・確定 ──────────────────────────────►│                │
    │                                                  │                │
    │                         │◄── Webhook: checkout.session.completed   │
    │                         │                        │                │
    │                         │── mutation: updateUser ──────────────────►│
    │                         │   (status: "active")   │                │
    │                         │                        │                │
    │◄── redirect to /success ─│                        │                │
```

### 2. 毎月の更新フロー（自動）

```
Stripe が自動課金
    → invoice.payment_succeeded Webhook
    → currentPeriodEnd を更新
    → status は "active" 継続
```

### 3. 支払い失敗フロー

```
Stripe が課金失敗（3回リトライ）
    → invoice.payment_failed Webhook
    → status: "past_due" に更新
    → ユーザーに再試行メール（Stripe 自動送信）
    → 最終的に失敗 → subscription.deleted
    → status: "canceled" に更新
```

### 4. 解約フロー（ユーザー主導）

```
[ユーザー] /account ページで「解約する」クリック
    → POST /api/stripe/create-portal
    → Stripe Customer Portal URL を返す
    → ユーザーがポータルで解約操作
    → customer.subscription.deleted Webhook
    → status: "canceled"（期間末まで利用可能）
```

---

## 機能ゲーティング設計

### プラン別機能表（案）

| 機能 | 無料 | プレミアム（月500円） |
|------|------|---------------------|
| 資産価値グラフ（全体集計） | ✅ | ✅ |
| 物件別詳細ページ | 閲覧制限あり | ✅ 全件 |
| シミュレーター（基本） | ✅ | ✅ |
| シミュレーター（詳細条件） | ❌ | ✅ |
| データCSVエクスポート | ❌ | ✅ |
| 新着物件アラート（将来） | ❌ | ✅ |

### PremiumGate コンポーネントの使い方

```tsx
// プレミアム機能を囲むだけで自動的に制限がかかる
<PremiumGate feature="csv_export">
  <CSVDownloadButton />
</PremiumGate>

// 制限時はアップグレード促進UIが表示される
```

---

## Webhook セキュリティ

Stripe からの Webhook は**署名検証**が必須です。

```typescript
// 署名検証の仕組み
const sig = request.headers.get("stripe-signature");
const event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
// 失敗すると例外が飛ぶ → 400 を返す
```

`STRIPE_WEBHOOK_SECRET` が設定されていない場合、Webhook エンドポイントは
`503 Service Unavailable` を返すようにしてあります（未設定でも本番に影響なし）。

---

## テスト方法

```bash
# Stripe CLI でローカル Webhook 転送
stripe listen --forward-to localhost:3000/api/stripe/webhook

# テスト決済
stripe trigger checkout.session.completed

# テストカード
4242 4242 4242 4242  有効期限: 任意の未来日  CVV: 任意3桁
```
