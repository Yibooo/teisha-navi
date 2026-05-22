#!/usr/bin/env python3
"""
REINS 売買物件検索結果（成約）PDF → JSON コンバーター

使い方:
  python parse_pdf_transactions.py <pdf.pdf> [マンション名]
  python parse_pdf_transactions.py ブリリアシティ西早稲田.pdf "ブリリアシティ西早稲田"

出力:
  stdout → JSON配列（Convex importBatch へ貼り付け用）
  stderr → 進捗・警告メッセージ

依存ライブラリ:
  pip install pdfplumber

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
出力JSON の各レコードフィールド定義（Convex transactions テーブルと対応）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  buildingName    : str   物件マスタの名前と完全一致する必要あり
  sourceRecordId  : str   物件番号（12桁）重複防止キー
  price           : float 成約価格（万円）
  areaSqm         : float 専有面積（m²）
  transactionDate : str   成約年月日 "YYYY-MM-DD"  ← 日付を3フィールドに分けて格納
                              ↓ importBatch が自動計算
                          transactionYear  : int  取引年  例: 2026
                          transactionYearQ : str  取引年月 "YYYY-MM" 例: "2026-05"
  layout          : str   間取 例: "3LDK"
  managementFee   : int   管理費（円/月）
  buildingYear    : int   築年（検証用、DBには格納しない）
  _recordNo       : int   PDF内のNo.（デバッグ用）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

import re
import json
import sys
import pdfplumber

# ── 和暦 → 西暦 ──────────────────────────────────────────────────────────────
ERA_BASE = {"令和": 2018, "平成": 1988, "昭和": 1925}


def wareki_to_date(era: str, y: int, m: int, d: int = 1) -> str:
    base = ERA_BASE.get(era, 2018)
    return f"{base + y}-{m:02d}-{d:02d}"


# ── 1レコードのパース ─────────────────────────────────────────────────────────
def parse_record(text: str, building_name_override: str | None = None) -> dict | None:
    """テキストブロック 1件分からフィールドを抽出する。"""

    result: dict = {}

    # ── 物件番号 ──
    m = re.search(r'物件番号\s*[：:＊\s]\s*(\d{10,13})', text)
    if not m:
        # ラベルなし: 先頭付近の10〜13桁数字
        m = re.search(r'\b(\d{12})\b', text)
    if m:
        result["sourceRecordId"] = m.group(1)

    # ── 専有面積 ──
    m = re.search(r'(\d{2,3}\.\d{1,2})\s*[㎡㎡m²]', text)
    if m:
        result["areaSqm"] = float(m.group(1))

    # ── 価格（万円）──
    # ラベル付き（「価格: 10,800万円」等）を優先
    m = re.search(r'価格\s*[：:＊]?\s*([\d,]+)\s*万円', text)
    if m:
        result["price"] = int(m.group(1).replace(',', ''))
    else:
        # ラベルなし: 全ての万円値を取得し最大値を成約価格とする
        # 原則: 成約価格 > 坪単価 > ㎡単価 なので最大値が必ず成約価格
        # 例: "10,800万円"=10800, "9,161.4万円"=9161.4, "149.7万円"=149.7 → max=10800
        all_manyen = re.findall(r'([\d,]+(?:\.\d+)?)\s*万円', text)
        all_vals = []
        for p in all_manyen:
            try:
                val = float(p.replace(',', ''))
                all_vals.append(val)
            except ValueError:
                pass
        if all_vals:
            result["price"] = max(all_vals)  # 成約価格は常に最大値

    # ── 建物名 ──
    m = re.search(r'建物名\s*[：:＊]?\s*(.+?)(?=\s+\d+階|\s+\d[SLDK]|\s*$)', text, re.MULTILINE)
    if m:
        result["buildingName"] = m.group(1).strip()
    elif building_name_override:
        result["buildingName"] = building_name_override

    # ── 所在階 ──
    m = re.search(r'所在階\s*[：:＊]?\s*(\d{1,2})\s*階', text)
    if not m:
        m = re.search(r'(?<!\d)(\d{1,2})\s*階(?!\d)', text)
    if m:
        result["floor"] = int(m.group(1))

    # ── 間取 ──
    m = re.search(r'\b(\d[SLDK]+DK?|\d+LDK|\d+DK|\d+LK|\d+K|1R|ワンルーム)\b', text)
    if m:
        result["layout"] = m.group(1)

    # ── 管理費 ──
    m = re.search(r'管理費\s*[：:＊]?\s*([\d,]+)\s*円', text)
    if m:
        result["managementFee"] = int(m.group(1).replace(',', ''))

    # ── 成約年月日 ──
    m = re.search(
        r'成約年月日\s*[：:＊]?\s*(令和|平成|昭和)\s*(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日',
        text,
    )
    if m:
        result["transactionDate"] = wareki_to_date(
            m.group(1), int(m.group(2)), int(m.group(3)), int(m.group(4))
        )

    # ── 築年月（検証用） ──
    m = re.search(r'築年月\s*[：:＊]?\s*(\d{4})\s*年', text)
    if m:
        result["buildingYear"] = int(m.group(1))
    else:
        m = re.search(r'築年月\s*[：:＊]?\s*(令和|平成|昭和)\s*(\d+)\s*年', text)
        if m:
            base = ERA_BASE.get(m.group(1), 2018)
            result["buildingYear"] = base + int(m.group(2))

    # ── 必須フィールドの確認 ──
    required = ["sourceRecordId", "price", "areaSqm", "transactionDate"]
    missing = [f for f in required if f not in result]
    if missing:
        return {"_missing": missing, "_partial": result}

    return result


# ── PDFを全ページ読み込んでレコード分割 ──────────────────────────────────────
def parse_pdf(pdf_path: str, building_name_override: str | None = None) -> list[dict]:
    """REINS PDF を読み込み、レコードリストを返す。"""

    full_text = ""
    with pdfplumber.open(pdf_path) as pdf:
        print(f"📄 総ページ数: {len(pdf.pages)}", file=sys.stderr)
        for i, page in enumerate(pdf.pages):
            text = page.extract_text(x_tolerance=3, y_tolerance=3)
            if text:
                full_text += f"\n<<PAGE{i+1}>>\n" + text

    if not full_text.strip():
        print("❌ テキストを抽出できませんでした。スキャンPDFの可能性があります。", file=sys.stderr)
        return []

    # レコード境界: 「No.X」行を起点に分割
    parts = re.split(r'\n(?=No\.\s*\d+\b)', full_text)

    records = []
    warnings = []

    for part in parts:
        part = part.strip()
        if not part:
            continue
        no_match = re.match(r'No\.\s*(\d+)', part)
        if not no_match:
            continue

        rec_num = int(no_match.group(1))
        rec = parse_record(part, building_name_override)

        if rec is None:
            warnings.append(f"No.{rec_num}: パース失敗")
            continue

        if "_missing" in rec:
            warnings.append(
                f"No.{rec_num}: 必須フィールド不足 {rec['_missing']} — 除外します"
            )
            print(
                f"  ⚠️ No.{rec_num} 除外: {rec['_missing']}\n"
                f"     テキスト冒頭: {part[:300]!r}",
                file=sys.stderr,
            )
            continue

        rec["_recordNo"] = rec_num

        # buildingName がない場合はコマンドライン引数の名前を補完
        if "buildingName" not in rec and building_name_override:
            rec["buildingName"] = building_name_override

        if "buildingName" not in rec:
            warnings.append(f"No.{rec_num}: buildingName 不明（--building_name を指定してください）")

        records.append(rec)

    print(f"\n✅ {len(records)} 件パース成功 / {len(warnings)} 件スキップ", file=sys.stderr)
    for w in warnings:
        print(f"   ⚠️ {w}", file=sys.stderr)

    return records


# ── エントリーポイント ────────────────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(
            "使い方: python parse_pdf_transactions.py <pdf.pdf> [マンション名]\n"
            "  例:  python parse_pdf_transactions.py ブリリアシティ西早稲田.pdf \"ブリリアシティ西早稲田\"\n"
            "出力: JSONをstdoutに出力（Convex admin画面に貼り付けてください）",
            file=sys.stderr,
        )
        sys.exit(1)

    pdf_path = sys.argv[1]
    building_name = sys.argv[2] if len(sys.argv) > 2 else None

    print(f"📂 {pdf_path} を読み込み中…", file=sys.stderr)
    if building_name:
        print(f"🏢 マンション名（補完用）: {building_name}", file=sys.stderr)

    records = parse_pdf(pdf_path, building_name)

    if not records:
        print("❌ レコードが0件です。", file=sys.stderr)
        sys.exit(1)

    output = json.dumps(records, ensure_ascii=False, indent=2)
    print(output)

    print(
        f"\n📋 次のステップ:\n"
        f"  1. 上のJSONをコピー\n"
        f"  2. https://teisha-navi.vercel.app/admin/import を開く\n"
        f"  3.「REINS PDF」タブ → JSONを貼り付けて「インポート実行」",
        file=sys.stderr,
    )
