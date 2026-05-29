# 定借ナビ 開発計画書

> 作成日: 2026-05-29  
> 本番URL: https://teisha-navi.vercel.app  
> Convex本番: `prod:precious-mongoose-658.convex.cloud`  
> リポジトリ: /Users/yibozhou/Desktop/teisha-navi

---

## 優先度・難易度マトリクス（実装順）

| # | 機能 | 難易度 | 優先度 | 状態 |
|---|------|--------|--------|------|
| 0 | 南砂町以外の新築価格データ削除 | 低 | 🔴 最高 | 未着手 |
| 1 | 免責事項の追加 | 低 | 🔴 高 | 未着手 |
| 2 | 個別ページに売り出し価格追加 | 中 | 🔴 高 | 未着手 |
| 3 | Google Formアンケート追加 | 低 | 🟡 中 | 未着手（URLをユーザーが作成後） |
| 4 | ログイン機能 + SaaS化 | 高 | 🟢 低〜中 | 設計のみ（実装は後フェーズ） |

---

## Step 0: 南砂町以外の新築価格データ削除

### 背景
スクレイピング精度が不安定なため、Web調査で取得した新築坪単価データは
「リビオシティ南砂町ステーションサイト（source: "Web-scraping-新築"）」のみ残し、
それ以外は全て削除する。後日、手入力で正確なデータを投入する予定。

### 対象
- `source` が `"Web-scraping-新築"` で、物件名が **リビオシティ南砂町ステーションサイト以外** のレコード

### 実装方針
```bash
# 1. 削除対象を確認
CONVEX_DEPLOYMENT=prod:precious-mongoose-658 npx convex run \
  importPdfTransactions:listNewConstructionBySource \
  '{"source": "Web-scraping-新築"}'

# 2. 南砂町以外を削除するConvex mutationを実行
CONVEX_DEPLOYMENT=prod:precious-mongoose-658 npx convex run \
  importPdfTransactions:deleteNewConstructionExcept \
  '{"keepPropertyName": "リビオシティ南砂町ステーションサイト"}'

# 3. analyticsCacheを再構築
CONVEX_DEPLOYMENT=prod:precious-mongoose-658 npx convex run analytics:rebuildCache '{}'
```

### 追加するConvex mutation（`convex/importPdfTransactions.ts`）
```typescript
// 南砂町以外の新築データを削除するマイグレーション
export const deleteNewConstructionExcept = mutation({
  args: { keepPropertyName: v.string() },
  handler: async (ctx, args) => {
    const properties = await ctx.db.query("properties").collect();
    const keepPropId = properties.find(
      (p) => p.name === args.keepPropertyName
    )?._id;

    const allTx = await ctx.db.query("transactions").collect();
    const targets = allTx.filter(
      (t) =>
        (t.priceType === "new_construction" || t.isNewConstruction === true) &&
        t.propertyId !== keepPropId
    );

    let deleted = 0;
    for (const t of targets) {
      await ctx.db.delete(t._id);
      deleted++;
    }
    return { deleted };
  },
});
```

---

## Step 1: 免責事項の追加

### 対象ページ
- `/analytics`（全体サマリページ）
- `/analytics/property/[id]`（個別マンションページ）

### 実装内容
既存の「注意事項」パネルに文言を追加、またはページ最下部にフッター免責を追加。

**追加文言（案）**:
> 「本サイトの価格情報は随時更新される場合があります。最新情報は各物件の販売会社・REINS等にてご確認ください。本情報は参考目的のみであり、投資判断の根拠としての利用はお控えください。」

### 対象ファイル
- `app/analytics/page.tsx` — 既存の「⚠️ 注意事項」パネルに文言追加
- `app/analytics/property/[id]/page.tsx` — 同様の免責パネルを追加

### 実装難易度: 低（JSX編集のみ）

---

## Step 2: 個別マンションページに売り出し価格追加

### 背景
`priceType: "listing"` のデータが既に91件存在する。個別ページの成約価格情報の
下に、現在の売り出し価格と売り出し坪単価を追加表示する。

### データ確認
```bash
CONVEX_DEPLOYMENT=prod:precious-mongoose-658 npx convex run \
  transactions:getStats '{}'
# listing: 91件 が存在
```

### UI設計
個別ページ（`/analytics/property/[id]`）の構成：
```
[現行] 成約価格グラフ（残存年数別坪単価）
[追加] 現在の売り出し価格
         - 売出物件数: N件
         - 売出坪単価レンジ: 〇〇万円 〜 〇〇万円/坪
         - 直近の売出価格リスト（テーブル）
             | 面積 | 階 | 間取 | 売出価格 | 坪単価 | 登録日 |
```

### 変更ファイル
1. **`convex/analytics.ts`** — `getPropertyChartData`に`listingData`を追加
   ```typescript
   // getPropertyChartData の return に追加
   const listings = allTx.filter((t) => t.priceType === "listing");
   const listingData = listings.map((t) => ({
     price: t.price,
     areaSqm: t.areaSqm,
     floor: t.floor,
     layout: t.layout,
     pricePerTsubo: t.pricePerTsubo ?? Math.round(t.pricePerSqm * 3.30578 * 10) / 10,
     transactionDate: t.transactionDate,
     transactionYearQ: t.transactionYearQ,
   })).sort((a, b) => (b.transactionDate ?? "").localeCompare(a.transactionDate ?? ""));

   return {
     property: { ... },
     points,
     newConstructionPricePerTsubo,
     totalTransactions: txOnly.length,
     listingData,  // 追加
   };
   ```

2. **`app/analytics/property/[id]/page.tsx`** — 売り出し価格テーブルを追加

### 実装難易度: 中（Convex query修正 + UIコンポーネント追加）

---

## Step 3: Google Formアンケートの追加

### 実装方法の推奨

**ユーザーが行う作業（Claude不要）**:
1. https://forms.google.com でフォームを作成
2. フォーム項目（案）:
   - Q1: 本サイトをどこで知りましたか？（選択）
   - Q2: 定期借地権マンションへの関心度（1〜5スケール）
   - Q3: どの情報が最も役立ちましたか？（チェックボックス）
   - Q4: 改善してほしい点・要望（テキスト）
3. フォームの「送信」→「リンクを取得」またはiframeのembed URLを取得してClaudeに渡す

**Claudeが行う実装**（URL受け取り後）:
- サイト下部フッターにリンクボタンまたはiframe埋め込みを追加
- 全体サマリページ(`/analytics`)の最下部 + フッター(`components/layout/Footer.tsx` 等)

### 実装コード（URLを受け取り次第）
```tsx
{/* Googleフォームへのリンク */}
<div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-center">
  <h3 className="font-semibold text-slate-700 mb-2">サイト改善アンケート</h3>
  <p className="text-sm text-slate-600 mb-3">
    定借ナビをご利用いただきありがとうございます。サービス向上のため、
    ぜひアンケートにご協力ください（所要時間：約2分）
  </p>
  <a
    href="GOOGLE_FORM_URL"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
  >
    アンケートに答える →
  </a>
</div>
```

### 実装難易度: 低（JSX追加のみ）

---

## Step 4: ログイン機能 + SaaS化（詳細設計）

### 概要
定借ナビをID/パスワード認証付きの月額課金SaaSとして運用する。

### アーキテクチャ設計

```
[ユーザー]
    ↓ メール/パスワード or Google OAuth
[Clerk] ← 認証プロバイダー（無料枠10,000MAU）
    ↓ JWT / ユーザーID
[Next.js App Router]
    ↓ Convex Auth（Clerk連携）
[Convex DB]
    ↓ サブスクリプション状態確認
[Stripe] ← 課金管理
    ↓ Webhook → Convex mutation
[Convex DB: subscriptions table]
```

### 選定技術スタック

| 役割 | 採用技術 | 理由 |
|------|---------|------|
| 認証 | **Clerk** | Next.js/Convex公式対応、日本語UI対応、無料10,000MAU |
| 課金 | **Stripe** | 月額課金の業界標準、日本円対応、Webhook連携容易 |
| 認可 | Convex Auth (Clerk連携) | ConvexのミドルウェアがClerk JWTを直接検証 |

### DBスキーマ追加（`convex/schema.ts`）

```typescript
// 既存に追加
subscriptions: defineTable({
  clerkUserId: v.string(),        // Clerk ユーザーID
  stripeCustomerId: v.string(),   // Stripe Customer ID
  stripeSubscriptionId: v.optional(v.string()),
  status: v.union(
    v.literal("active"),
    v.literal("trialing"),
    v.literal("past_due"),
    v.literal("canceled"),
    v.literal("incomplete"),
  ),
  planId: v.string(),             // "monthly_basic" | "monthly_pro"
  currentPeriodEnd: v.number(),   // Unix timestamp
  cancelAtPeriodEnd: v.boolean(),
}).index("by_clerk_user_id", ["clerkUserId"])
  .index("by_stripe_customer_id", ["stripeCustomerId"]),
```

### 実装ファイル一覧

```
convex/
  auth.config.ts          # Clerk JWT設定
  subscriptions.ts        # サブスクリプション queries/mutations
  schema.ts               # subscriptionsテーブル追加

app/
  (auth)/
    sign-in/page.tsx      # Clerkサインインページ
    sign-up/page.tsx      # Clerkサインアップページ
  (protected)/
    layout.tsx            # 認証ガード + サブスクリプション確認
    analytics/            # 現行の analytics/ をここに移動
      page.tsx
      property/[id]/page.tsx

  api/
    webhooks/
      stripe/route.ts     # Stripe Webhookハンドラー
  
  pricing/page.tsx        # 料金ページ
  
middleware.ts             # Clerk認証ミドルウェア（公開/保護ルート設定）

components/
  auth/
    UserButton.tsx        # ヘッダーのユーザーメニュー
  subscription/
    SubscriptionGate.tsx  # サブスク有効確認ゲートコンポーネント
    PricingCard.tsx       # 料金カード
```

### 料金プラン設計（案）

| プラン | 月額 | 機能 |
|--------|------|------|
| 無料 | ¥0 | グラフ閲覧（過去データのみ）、物件一覧 |
| ベーシック | ¥980/月 | 全成約データ閲覧、物件別詳細ページ |
| プロ（将来）| ¥2,980/月 | 売り出し価格リアルタイム、シミュレーション、API |

### アカウント作成方針

**推奨: ベータ期間は招待制（管理者発行）→ 一般公開時はセルフサインアップ**

- **ベータ期間（〜100ユーザー）**: Clerkの招待機能でメールアドレスを管理者が承認。スパム防止・フィードバック収集に有効。
- **一般公開後**: セルフサインアップ可能（メール認証 or Google OAuth）。Clerkのセキュリティ設定（CAPTCHA等）で不正防止。

### 実装ステップ（詳細）

#### Phase 4-1: 認証基盤（1〜2日）
1. `npm install @clerk/nextjs`
2. Clerkダッシュボードでアプリ作成、環境変数設定
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. `middleware.ts` でルート保護設定
4. `convex/auth.config.ts` でClerk JWT設定
5. ヘッダーにUserButtonを追加
6. `/sign-in`, `/sign-up` ページ作成

#### Phase 4-2: Stripe課金（1〜2日）
1. `npm install stripe @stripe/stripe-js`
2. Stripeダッシュボードで商品・価格を作成
   - 環境変数: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
3. `/api/webhooks/stripe/route.ts` でWebhookハンドラー作成
   - `customer.subscription.created/updated/deleted` イベント処理
4. Convex `subscriptions` テーブルへの書き込み

#### Phase 4-3: 認可ゲート（半日）
1. `SubscriptionGate.tsx` コンポーネント作成
2. 保護ページのlayout.tsxに組み込み
3. 未サブスク→料金ページへリダイレクト

#### Phase 4-4: 料金ページ（半日）
1. `/pricing/page.tsx` 作成
2. Stripeのチェックアウトセッション作成APIを実装
3. マイアカウントページ（サブスク管理）

### 必要環境変数

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/analytics
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/pricing

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...

# Convex
CONVEX_DEPLOYMENT=prod:precious-mongoose-658
```

### 実装難易度: 高（外部サービス連携 + 認証フロー + 課金フロー）
### 想定工数: 4〜6日

---

## 開発ロードマップ

```
Week 1（現在）:
  [x] シティタワー品川 誤データ修正
  [ ] Step 0: 不要な新築データ削除
  [ ] Step 1: 免責事項追加
  [ ] Step 2: 売り出し価格表示追加
  [ ] Step 3: Google Form（URLをユーザーが作成後に実装）

Week 2〜3:
  [ ] Step 4-1: Clerk認証基盤
  [ ] Step 4-2: Stripe課金
  [ ] Step 4-3: 認可ゲート
  [ ] Step 4-4: 料金ページ・マイアカウント
```

---

## 技術スタック（現行）

| 項目 | 技術 |
|------|------|
| フロントエンド | Next.js 15 App Router, TypeScript, Tailwind CSS |
| バックエンド | Convex (DB + Serverless Functions) |
| グラフ | Recharts |
| ホスティング | Vercel |
| 本番DB | `prod:precious-mongoose-658.convex.cloud` |

---

## よく使うコマンド

```bash
# 本番へデプロイ
cd /Users/yibozhou/Desktop/teisha-navi
CONVEX_DEPLOYMENT=prod:precious-mongoose-658 npx convex deploy --typecheck disable

# Convex mutationを本番で実行
CONVEX_DEPLOYMENT=prod:precious-mongoose-658 npx convex run <function> '<json args>'

# キャッシュ再構築（データ変更後は必須）
CONVEX_DEPLOYMENT=prod:precious-mongoose-658 npx convex run analytics:rebuildCache '{}'

# ローカル開発
npm run dev
```

---

*このドキュメントはトークン上限後も続きから開発を再開できるように、
実装の文脈・技術設計・未完了タスクを記録しています。*
