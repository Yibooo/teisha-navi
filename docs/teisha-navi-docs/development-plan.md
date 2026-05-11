# 開発計画書

**サービス名**: 定借ナビ  
**バージョン**: 1.0  
**作成日**: 2026-05-11

---

## 1. フェーズ概要

| フェーズ | 内容 | 期間目安 |
|---|---|---|
| **Phase 0** | 基盤構築・データインポート | 1〜2週間 |
| **Phase 1** | MVP公開（グラフ・シミュレーター） | 2〜3週間 |
| **Phase 2** | 品質向上・SEO・データ精度改善 | 1〜2週間 |
| **Phase 3** | B2B機能（PDF・API・課金） | 別途検討 |

---

## 2. Phase 0: 基盤構築

### 目標
- プロジェクトの骨格を構築し、Vercelにデプロイ済みの状態にする
- 国交省APIから東京23区の借地権マンション取引データを取り込む
- Admin画面でデータを確認できる状態にする

### タスク一覧

| # | タスク | 詳細 |
|---|---|---|
| 0-1 | Next.js 15プロジェクト初期化 | App Router・TypeScript・Tailwind CSS |
| 0-2 | Convex セットアップ | `npx convex dev` 初期化・Vercel連携 |
| 0-3 | shadcn/ui セットアップ | 基本コンポーネント導入 |
| 0-4 | Convex スキーマ定義 | properties / transactions / analysisCache |
| 0-5 | 国交省APIインポート実装 | Convex Action で東京23区・借地権フラグで取得 |
| 0-6 | 物件マスタ初期データ作成 | 既知の定期借地権マンションをCSV/JSON で手動作成 |
| 0-7 | データ照合ロジック実装 | 物件マスタとAPI取得データの照合・残存年数計算 |
| 0-8 | Admin認証セットアップ | Convex Auth（メールアドレス＋パスワード） |
| 0-9 | Admin画面（データ確認） | 物件マスタ一覧・取引データ一覧 |
| 0-10 | Vercel デプロイ | 本番環境・プレビュー環境の設定 |

### 完了条件
- [ ] `https://teisha-navi.vercel.app` でアクセス可能（スケルトン状態）
- [ ] 国交省APIから取引データが取り込まれている
- [ ] Admin画面でデータを確認・編集できる

---

## 3. Phase 1: MVP公開

### 目標
- コア機能（グラフ・シミュレーター）が動作する状態で公開

### タスク一覧

| # | タスク | 詳細 |
|---|---|---|
| 1-1 | LP作成 | サービス説明・使い方・CTA・免責事項 |
| 1-2 | グラフページ実装 | 残存年数別価格推移グラフ（Recharts 散布図＋折れ線） |
| 1-3 | グラフフィルター実装 | 区・間取り・専有面積帯でフィルタリング |
| 1-4 | 分析ロジック実装 | 新築比価格比率の計算・キャッシュ更新 |
| 1-5 | シミュレーターUI実装 | 入力フォーム・結果表示・グラフへのプロット |
| 1-6 | シミュレーション計算ロジック | 過去データから回帰・予測価格・売り時推奨 |
| 1-7 | About ページ | データソース・算出方法・免責事項 |
| 1-8 | Admin: インポート画面 | 国交省APIインポート実行ボタン・進捗表示 |
| 1-9 | Admin: 物件マスタ管理 | 追加・編集・削除フォーム |
| 1-10 | レスポンシブ対応 | SP・タブレット対応 |

### 完了条件
- [ ] グラフページでデータが表示される
- [ ] シミュレーターで予測価格・売り時が出力される
- [ ] スマートフォンで正常に表示される
- [ ] データ件数・出典が画面上に明示されている

---

## 4. Phase 2: 品質向上

### タスク一覧

| # | タスク | 詳細 |
|---|---|---|
| 2-1 | SEO対策 | メタタグ・OGP・サイトマップ・robots.txt |
| 2-2 | 物件別価格履歴ページ | マンション名検索・個別物件の取引履歴 |
| 2-3 | エリア比較グラフ | 複数区の同時比較 |
| 2-4 | シミュレーション精度改善 | データ件数増加後の回帰モデル見直し |
| 2-5 | パフォーマンス最適化 | グラフ描画速度・キャッシュ戦略 |
| 2-6 | データ更新フロー整備 | 四半期ごとの国交省データ更新手順書 |

---

## 5. Phase 3: B2B機能

| # | タスク | 詳細 |
|---|---|---|
| 3-1 | ユーザー認証（B2B） | 事業者向けアカウント登録・ログイン |
| 3-2 | PDF レポート生成 | シミュレーション結果・グラフをPDF出力 |
| 3-3 | API 提供 | 月額課金制の外部API（残存年数→予測価格） |
| 3-4 | 課金システム | Stripe 連携・プラン管理 |
| 3-5 | 埋め込みウィジェット | 不動産会社サイトへの埋め込み用ウィジェット |

---

## 6. 技術スタック詳細

### フロントエンド
```
Next.js 15 (App Router)
├── TypeScript
├── Tailwind CSS
├── shadcn/ui（ボタン・フォーム・カード等）
└── Recharts（散布図・折れ線グラフ・エリアチャート）
```

### バックエンド・DB
```
Convex
├── Schema: properties / transactions / analysisCache
├── Queries
│   ├── getChartData（グラフデータ取得・フィルター対応）
│   ├── getSimulationData（シミュレーション用集計データ取得）
│   └── Admin CRUD（物件・取引データ管理）
├── Mutations
│   └── upsertProperty / upsertTransaction
└── Actions
    └── importFromMlit（国交省APIインポート・単発実行）
```

### 国交省API 呼び出し仕様
```
エンドポイント:
  https://www.land.mlit.go.jp/webland/api/TradeListSearch

主要パラメータ:
  from:       取得開始時期（例: 20201）= 2020年第1四半期
  to:         取得終了時期
  prefecture: 都道府県コード（東京 = 13）
  city:       市区町村コード（23区分）

フィルタリング:
  取得後に Type = "中古マンション等" かつ LandRight に "借地" を含む行を抽出
```

### ディレクトリ構成
```
teisha-navi/
├── app/
│   ├── (public)/
│   │   ├── page.tsx              # LP
│   │   ├── analytics/page.tsx    # グラフページ
│   │   ├── simulator/page.tsx    # シミュレーター
│   │   └── about/page.tsx        # サービス説明
│   └── admin/
│       ├── layout.tsx            # Admin共通レイアウト（認証チェック）
│       ├── page.tsx              # Adminダッシュボード
│       ├── import/page.tsx       # データインポート
│       ├── properties/page.tsx   # 物件マスタ管理
│       └── transactions/page.tsx # 取引データ管理
├── components/
│   ├── charts/
│   │   ├── AssetValueChart.tsx   # 残存年数別価格推移グラフ
│   │   └── SimulatorChart.tsx    # シミュレーター結果グラフ
│   ├── simulator/
│   │   └── SimulatorForm.tsx     # シミュレーター入力フォーム
│   └── ui/                       # shadcn/ui コンポーネント
├── convex/
│   ├── schema.ts                 # DBスキーマ定義
│   ├── properties.ts             # 物件マスタ Query/Mutation
│   ├── transactions.ts           # 取引データ Query/Mutation
│   ├── analytics.ts              # グラフ・シミュレーション Query
│   ├── analysisCache.ts          # 集計キャッシュ更新 Mutation
│   └── importMlit.ts             # 国交省APIインポート Action
├── lib/
│   ├── simulation.ts             # シミュレーション計算ロジック
│   └── analysis.ts               # 分析・集計ロジック
├── docs/
│   ├── requirements.md           # 要件定義書
│   └── development-plan.md       # 開発計画書（本ドキュメント）
└── README.md
```

---

## 7. 開発環境セットアップ手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/Yibooo/teisha-navi.git
cd teisha-navi

# 2. 依存パッケージインストール
npm install

# 3. Convex 開発サーバー起動（初回は npx convex dev でセットアップ）
npx convex dev

# 4. Next.js 開発サーバー起動（別ターミナル）
npm run dev
```

---

## 8. デプロイ戦略

| 環境 | URL | 用途 |
|---|---|---|
| 本番 | `https://teisha-navi.vercel.app` | 公開サービス |
| プレビュー | `https://teisha-navi-git-<branch>.vercel.app` | PRごとの確認 |

- `main` ブランチへのマージで本番デプロイが自動実行される
- Convex は本番・開発で別プロジェクトを使用

---

## 9. 今後の検討事項

| 項目 | 内容 | 検討時期 |
|---|---|---|
| データ更新頻度 | 国交省データの定期取込（四半期 or 月次）| MVP完成後 |
| スクレイピング | 不動産ポータルからの補完データ収集（法的確認必要）| Phase 2 |
| 独自ドメイン | teishanavi.jp 等の取得 | Phase 1完成後 |
| 収益化開始時期 | B2B機能の有料化タイミング | Phase 3 |
