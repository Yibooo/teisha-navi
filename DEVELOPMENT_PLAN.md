# 定借ナビ 開発計画書

> 作成日: 2026-05-29  
> 本番URL: https://teisha-navi.vercel.app  
> Convex本番: `prod:precious-mongoose-658.convex.cloud`  
> リポジトリ: /Users/yibozhou/Desktop/teisha-navi

---

## 確定した方針・決定事項

| 項目 | 決定内容 |
|------|---------|
| Google Form | **ユーザーがフォームを作成してURLをClaudeに渡す**。回答収集・管理はGoogleスプレッドシートで完結 |
| アカウント作成 | **ベータ期間は招待制（管理者発行）**。スパム防止・品質フィードバック収集のため。一般公開後はセルフサインアップに移行 |
| ベータ期間の課金 | **課金UI/システムは実装しない**。支払いは友人間で直接行う（現金・振込等）。Stripeは一般公開時に導入 |

---

## 優先度・難易度マトリクス（実装順）

| # | 機能 | 難易度 | 優先度 | 状態 |
|---|------|--------|--------|------|
| 0 | 南砂町以外の新築価格データ削除 | 低 | 🔴 最高 | 未着手 |
| 1 | 免責事項の追加 | 低 | 🔴 高 | 未着手 |
| 2 | 個別ページに売り出し価格追加 | 中 | 🔴 高 | 未着手 |
| 3 | Google Formアンケート追加 | 低 | 🟡 中 | 未着手（URLをユーザーが作成後） |
| 4 | ログイン機能（ベータ：招待制・課金なし） | 中 | 🟢 低〜中 | 設計のみ（実装は後フェーズ） |
| 5 | 課金機能（Stripe）| 高 | 🔵 一般公開時 | ベータ期間は実装しない |

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

## Step 4: ログイン機能（ベータ版：Clerk認証のみ、課金UI不要）

### ✅ 確定方針
- **ベータ期間は課金UIを実装しない**。支払いは友人間で直接行う（現金・振込等）
- **招待制（管理者発行）** でアカウントを管理。Clerkのダッシュボードからメール招待
- Stripeは一般公開時に追加する（Step 5として分離）

### ベータ版アーキテクチャ（シンプル）

```
[ユーザー]
    ↓ メール/パスワード（招待制）
[Clerk] ← 認証プロバイダー（無料枠10,000MAU）
    ↓ JWT / ユーザーID
[Next.js App Router + middleware.ts]
    ↓ Convex Auth（Clerk連携）
[Convex DB] ← ログインユーザーのみデータ閲覧可能
```

### 選定技術スタック

| 役割 | 採用技術 | 理由 |
|------|---------|------|
| 認証 | **Clerk** | Next.js/Convex公式対応、日本語UI対応、無料10,000MAU、招待機能あり |
| 認可 | Convex Auth (Clerk連携) | ConvexのミドルウェアがClerk JWTを直接検証 |

> **Stripeは使わない（ベータ期間）**。支払いは友人間で直接管理。

### アカウント管理フロー（ベータ）

1. **管理者（自分）** がClerkダッシュボードで友人のメールアドレスを招待
2. 友人がメールのリンクからアカウント作成（パスワード設定）
3. `/analytics` 等の保護ページにログインして閲覧可能になる
4. 未ログインのユーザーは `/sign-in` へリダイレクト

### 実装ファイル一覧（ベータ版）

```
convex/
  auth.config.ts          # Clerk JWT設定（Convex側）

app/
  (auth)/
    sign-in/[[...sign-in]]/page.tsx   # Clerkサインインページ
  (protected)/
    layout.tsx            # 認証ガード（未ログイン→sign-inへ）
    analytics/            # 現行の analytics/ をここに移動
      page.tsx
      property/[id]/page.tsx

middleware.ts             # Clerk認証ミドルウェア（公開/保護ルート設定）

components/
  layout/
    Header.tsx            # ヘッダーにUserButton（ログアウト等）追加
```

### 実装ステップ（詳細）

#### Step 4-1: Clerk セットアップ（2〜3時間）
1. `npm install @clerk/nextjs`
2. https://dashboard.clerk.com でアプリ作成
3. Vercel環境変数に追加:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...`
   - `CLERK_SECRET_KEY=sk_live_...`
4. `middleware.ts` を作成（保護ルート: `/analytics(.*)` 等）
5. `app/layout.tsx` を `<ClerkProvider>` でラップ

#### Step 4-2: Convex + Clerk 連携（1時間）
1. `convex/auth.config.ts` を作成（Clerk JWT URL設定）
2. Convex Dashboardで環境変数 `CLERK_JWT_ISSUER_DOMAIN` を設定

#### Step 4-3: UIの対応（1〜2時間）
1. ヘッダーに `<UserButton />` を追加（アバター + ログアウトメニュー）
2. `/sign-in` ページ作成（Clerkの`<SignIn />`コンポーネントを使用）
3. 未ログイン時のランディングページ（簡易的な説明 + ログインボタン）

### 必要環境変数（ベータ版）

```env
# Clerk（Vercelに設定）
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/analytics

# Convex
CONVEX_DEPLOYMENT=prod:precious-mongoose-658
```

### 実装難易度: 中（ベータ版・課金なし）
### 想定工数: 半日〜1日

---

## Step 5: 課金機能（Stripe）— 一般公開時

> ⚠️ **ベータ期間は実装しない**。友人からは直接支払いを受け取る。

### 概要
ベータ終了後、一般公開時にStripeを導入して月額課金を自動化する。

### アーキテクチャ（将来）

```
[Clerk認証] + [Stripe課金]
    ↓
[Convex DB: subscriptions table]
    ↓ 有効サブスク確認
[保護ページ閲覧可能]
```

### 料金プラン設計（案）

| プラン | 月額 | 機能 |
|--------|------|------|
| ベーシック | ¥980/月 | 全成約データ閲覧、物件別詳細ページ、売り出し価格 |
| プロ（将来）| ¥2,980/月 | シミュレーション、API、優先サポート |

### DBスキーマ追加（将来）
```typescript
subscriptions: defineTable({
  clerkUserId: v.string(),
  stripeCustomerId: v.string(),
  stripeSubscriptionId: v.optional(v.string()),
  status: v.union(
    v.literal("active"), v.literal("trialing"),
    v.literal("past_due"), v.literal("canceled"),
  ),
  planId: v.string(),
  currentPeriodEnd: v.number(),
}).index("by_clerk_user_id", ["clerkUserId"])
  .index("by_stripe_customer_id", ["stripeCustomerId"]),
```

### 実装難易度: 高（Stripe Webhook + 課金フロー）
### 想定工数: 3〜4日（Step 4完了後に追加）

---

## 開発ロードマップ

```
Week 1（現在）:
  [x] シティタワー品川 誤データ修正
  [ ] Step 0: 不要な新築データ削除
  [ ] Step 1: 免責事項追加
  [ ] Step 2: 売り出し価格表示追加
  [ ] Step 3: Google Form（URLをユーザーが作成後に実装）

Week 2:
  [ ] Step 4-1: Clerk セットアップ
  [ ] Step 4-2: Convex + Clerk 連携
  [ ] Step 4-3: ヘッダーUI + ログインページ

一般公開時（時期未定）:
  [ ] Step 5-1: Stripe商品・価格設定
  [ ] Step 5-2: Webhook + subscriptionsテーブル
  [ ] Step 5-3: 認可ゲート（サブスク確認）
  [ ] Step 5-4: 料金ページ・マイアカウント
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
