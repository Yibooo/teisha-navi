import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// 国交省CSVのフィールド名マッピング（UTF-8 BOM対応）
const FIELD = {
  type: "種類",
  landRight: "土地の権利形態",
  price: "取引価格（総額）",
  area: "面積（㎡）",
  buildingYear: "建築年",
  period: "取引時点",
  station: "最寄駅：名称",
  municipality: "市区町村名",
  address: "地区名",
} as const;

type CsvRow = Record<string, string>;

function parseJapaneseYear(raw: string): number | null {
  // "令和元年" "平成30年" "昭和XX年" → 西暦
  const wareki: Record<string, number> = { 昭和: 1925, 平成: 1988, 令和: 2018 };
  for (const [era, base] of Object.entries(wareki)) {
    const m = raw.match(new RegExp(`${era}(元|\\d+)年`));
    if (m) return base + (m[1] === "元" ? 1 : parseInt(m[1]));
  }
  const m = raw.match(/(\d{4})年/);
  return m ? parseInt(m[1]) : null;
}

function parsePeriod(raw: string): { year: number; q: number } | null {
  const m = raw.match(/(\d{4})年第(\d)四半期/);
  if (!m) return null;
  return { year: parseInt(m[1]), q: parseInt(m[2]) };
}

function parseCsv(text: string): CsvRow[] {
  // BOM除去
  const clean = text.replace(/^﻿/, "");
  const lines = clean.split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
    });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "ファイルが必要です" }, { status: 400 });

  const text = await file.text();
  const rows = parseCsv(text);

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const properties = await convex.query(api.properties.list, {});

  const result = { total: rows.length, leaseholdFound: 0, imported: 0, skipped: 0, errors: [] as string[] };

  for (const row of rows) {
    try {
      // 中古マンション + 借地権フィルタ
      const type = row[FIELD.type] ?? "";
      const landRight = row[FIELD.landRight] ?? "";
      if (!type.includes("中古マンション") || !landRight.includes("借地")) continue;
      result.leaseholdFound++;

      const buildingYear = parseJapaneseYear(row[FIELD.buildingYear] ?? "");
      if (!buildingYear) continue;

      const period = parsePeriod(row[FIELD.period] ?? "");
      if (!period) continue;

      const rawPrice = (row[FIELD.price] ?? "").replace(/[,円]/g, "");
      const price = parseInt(rawPrice) / 10000;
      const areaSqm = parseFloat(row[FIELD.area] ?? "0");
      if (!price || !areaSqm) continue;

      const ward = (row[FIELD.municipality] ?? "").replace("東京都", "").trim();

      // 物件マスタと照合（区 + 建築年）
      const matched = properties.find(
        (p) => p.ward === ward && p.buildingYear === buildingYear
      );
      if (!matched) { result.skipped++; continue; }

      const remainingLeaseYears = (matched.leaseStartYear + matched.leaseTotalYears) - period.year;
      if (remainingLeaseYears <= 0) continue;

      await convex.mutation(api.transactions.upsert, {
        propertyId: matched._id,
        transactionYearQ: `${period.year}Q${period.q}`,
        transactionYear: period.year,
        price,
        areaSqm,
        remainingLeaseYears,
        pricePerSqm: Math.round((price / areaSqm) * 10) / 10,
        isNewConstruction: false,
        source: "国土交通省不動産取引価格情報（CSV）",
      });
      result.imported++;
    } catch (e) {
      result.errors.push(String(e));
    }
  }

  if (result.imported > 0) {
    await convex.mutation(api.analytics.rebuildCache, {});
  }

  return NextResponse.json(result);
}
