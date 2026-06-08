# 定借ナビ — 決済機能 開発ドキュメント

このディレクトリは、Stripe を使ったサブスクリプション決済機能の**設計・実装コード・法的テンプレート**をまとめたものです。  
ベータ版では機能を有効化しませんが、コードとアーキテクチャは事前に完成させておきます。

---

## ディレクトリ構成

```
payment/
├── README.md                         # このファイル
├── PHASE0_CHECKLIST.md               # 手動作業チェックリスト
├── architecture/
│   └── ARCHITECTURE.md               # 技術設計・フロー詳細
├── backend/
│   ├── convex/
│   │   ├── schema_addition.ts        # Convex スキーマ追加分
│   │   └── users.ts                  # ユーザーCRUD Mutation/Query
│   └── api/
│       ├── create-checkout.ts        # Stripe Checkout Session 生成
│       ├── create-portal.ts          # Stripe Customer Portal
│       └── webhook.ts                # Stripe Webhook 処理
├── frontend/
│   ├── hooks/
│   │   └── useSubscription.ts        # サブスク状態カスタムフック
│   ├── components/
│   │   └── PremiumGate.tsx           # プレミアム機能ゲート
│   └── pages/
│       ├── pricing.tsx               # 料金ページ
│       ├── success.tsx               # 決済完了ページ
│       └── account.tsx               # アカウント・解約ページ
└── legal/
    ├── tokushoho_template.md         # 特定商取引法 表記テンプレート
    ├── privacy_policy_addition.md    # プライバシーポリシー 追記ドラフト
    └── terms_of_service.md          # 利用規約ドラフト
```

---

## 実装フェーズ概要

| Phase | 内容 | ステータス |
|-------|------|----------|
| Phase 0 | Stripe アカウント開設・法的書類・環境変数取得 | 手動作業（要対応） |
| Phase 1 | バックエンド基盤（Convex スキーマ・API Routes・Webhook） | コード準備済み |
| Phase 2 | フロントエンド（料金ページ・決済フロー・アカウント管理） | コード準備済み |
| Phase 3 | 機能ゲーティング（プレミアム制限・アップグレード促進UI） | コード準備済み |
| Phase 4 | 本番有効化（環境変数セット → デプロイ → Webhook登録） | Phase 0 完了後 |

---

## Phase 0 — 作業の分担（何がClaude Codeで対応できるか）

| 作業 | Claude Code で可能か | 補足 |
|------|---------------------|------|
| Stripe アカウント開設・審査 | ❌ 完全手動 | stripe.com/jp で直接操作が必要 |
| 銀行口座・本人確認書類の登録 | ❌ 完全手動 | マイナンバー・口座情報はご本人が入力 |
| 月額500円「商品」の作成 | ❌ 手動（約5分） | Stripe ダッシュボード → 製品カタログで作成 |
| **特定商取引法ページの実装** | ✅ **叩き台作成済み** | `legal/tokushoho_template.md` の `[TODO]` 箇所（住所・電話番号・氏名）を埋めるだけ。ページ実装も依頼可能 |
| **プライバシーポリシーの作成** | ✅ **ドラフト作成済み** | `legal/privacy_policy_addition.md` — Stripe・Convex・Clerk 対応の条文込み |
| **利用規約の作成** | ✅ **ドラフト作成済み** | `legal/terms_of_service.md` — 解約ポリシー・返金規定込み |
| **法的書類の Next.js ページ実装** | ✅ **コード実装可能** | 「特商法・PP・利規のページを実装して」で即対応 |
| **NavBar / Footer へのリンク追加** | ✅ **コード実装可能** | `/tokushoho` `/privacy` `/terms` へのリンク追加 |
| 環境変数の取得（APIキー等） | ❌ 手動 | Stripe ダッシュボード → 開発者 → APIキーで確認 |
| Vercel への環境変数設定 | ❌ 手動（約5分） | Vercel ダッシュボード → Settings → Environment Variables |
| Webhook URL のStripeへの登録 | ❌ 手動（約5分） | デプロイ後に Stripe ダッシュボードで登録 |
| **Phase 1〜3 のコード統合・実装** | ✅ **全て実装可能** | `payment/` 内のコードを本体に統合するだけ |

### あなたが実際にやること（合計 約1〜2時間）

1. **Stripe アカウント開設・審査**（30分）
2. **住所の準備** — 自宅住所 or バーチャルオフィス契約（月1,000〜3,000円）
3. **法的書類の `[TODO]` を埋める** — 住所・電話番号・氏名・日付（15分）
4. **環境変数を Vercel に貼る**（5分）
5. **Webhook URL を Stripe に登録**（デプロイ後・5分）

> 上記以外はすべて「実装して」の一言で対応可能です。

---

## 必要な環境変数（Phase 0 完了後に .env.local に追加）

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxx
STRIPE_PRICE_ID=price_xxxxxxxxxxxxxxxx   # 月額500円の商品ID

# Vercel にも同じ変数を追加すること
```

---

## 参考リンク

- [Stripe ダッシュボード](https://dashboard.stripe.com)
- [Stripe Docs — Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Docs — Webhooks](https://stripe.com/docs/webhooks)
- [特定商取引法ガイド（消費者庁）](https://www.no-trouble.caa.go.jp/)
