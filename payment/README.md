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
