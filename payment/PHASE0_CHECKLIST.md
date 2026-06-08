# Phase 0 — 手動作業チェックリスト

本番稼働前に、以下をすべて完了させてください。

---

## 1. Stripe アカウント開設

- [ ] https://stripe.com/jp でアカウント作成
- [ ] ビジネス情報入力（個人事業主 / 屋号または本名）
- [ ] 本人確認書類アップロード（マイナンバーカード 表裏 / 運転免許証）
- [ ] 銀行口座登録（個人名義口座でOK）
- [ ] 審査完了（通常1〜3営業日）

---

## 2. Stripe で商品・価格を作成

- [ ] ダッシュボード → 「製品カタログ」→「商品を追加」
- [ ] 商品名：`定借ナビ プレミアムプラン`
- [ ] 価格：`500円 / 月`（繰り返し請求）
- [ ] 作成後、`price_xxxxx` の Price ID をメモ → `STRIPE_PRICE_ID` に設定

---

## 3. 環境変数の取得

- [ ] ダッシュボード → 「開発者」→「APIキー」
  - `pk_live_xxx` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `sk_live_xxx` → `STRIPE_SECRET_KEY`
- [ ] Webhook エンドポイント登録（デプロイ後）
  - URL: `https://teisha-navi.vercel.app/api/stripe/webhook`
  - 受信イベント（下記 4項目をすべて選択）:
    - `checkout.session.completed`
    - `invoice.payment_succeeded`
    - `invoice.payment_failed`
    - `customer.subscription.deleted`
  - 署名シークレット `whsec_xxx` → `STRIPE_WEBHOOK_SECRET`
- [ ] Vercel ダッシュボード → Environment Variables に上記4変数を追加

---

## 4. 法的書類の公開（必須）

- [ ] **特定商取引法 表記ページ**を `/tokushoho` に公開
  - テンプレート: `payment/legal/tokushoho_template.md`
  - `[TODO: 販売者名]` `[TODO: 住所]` `[TODO: 電話番号]` を実際の値に差し替え
- [ ] **プライバシーポリシー**を更新（または `/privacy` に新規公開）
  - 追記ドラフト: `payment/legal/privacy_policy_addition.md`
- [ ] **利用規約**を `/terms` に公開
  - ドラフト: `payment/legal/terms_of_service.md`
  - `[TODO: サービス名]` `[TODO: 運営者名]` 等を差し替え
- [ ] NavBar または Footer に上記3ページへのリンクを追加

---

## 5. 住所の準備（特商法対応）

自宅住所を公開したくない場合:

- [ ] バーチャルオフィス契約（月額1,000〜3,000円）
  - おすすめ: Karigo / Regus / GMO オフィスサポート
  - 東京都内の住所が取得可能
- [ ] 取得した住所を特商法ページに記載

---

## 6. テスト決済の確認

- [ ] Stripe テストモード（`sk_test_xxx`）で一通りフローを確認
  - テストカード番号: `4242 4242 4242 4242`（有効期限・CVV は任意）
- [ ] Webhook がローカル環境で受信できることを確認
  - `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] 本番モードに切り替えて最終確認

---

## 完了条件

上記すべてにチェックが入ったら、`STRIPE_SECRET_KEY` 等を本番環境変数にセットして Phase 4（本番有効化）へ。
