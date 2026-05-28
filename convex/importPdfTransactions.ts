import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ── 1件分のレコード型（Pythonパーサー出力に対応） ──────────────────────────
const recordValidator = v.object({
  buildingName: v.string(),                   // マンション名（PDF内）
  price: v.number(),                          // 成約価格（万円）
  areaSqm: v.number(),                        // 専有面積（m²）
  floor: v.optional(v.number()),              // 所在階
  transactionDate: v.string(),               // 成約年月日 "YYYY-MM-DD"
  layout: v.optional(v.string()),             // 間取（例: "3LDK"）
  managementFee: v.optional(v.number()),      // 管理費（円）
  sourceRecordId: v.string(),                // 物件番号（重複防止キー）
  buildingYear: v.optional(v.number()),       // 築年（検証用）
  _recordNo: v.optional(v.number()),          // PDF内の通し番号（デバッグ用）
});

// ── 物件名の正規化（City ↔ シティ 等） ──────────────────────────────────────
function normalizeName(name: string): string {
  return name
    .replace(/[Ｃｉｔｙ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/City/gi, "シティ")
    .replace(/\s+/g, "")
    .toLowerCase();
}

// ── バッチインポート mutation ────────────────────────────────────────────────
export const importBatch = mutation({
  args: {
    records: v.array(recordValidator),
    source: v.optional(v.string()), // 省略時 → "REINS-PDF"
  },
  handler: async (ctx, args) => {
    const source = args.source ?? "REINS-PDF";

    const results = {
      inserted: 0,
      skipped: 0,
      notFound: 0,
      errors: [] as string[],
    };

    for (const record of args.records) {
      const tag = `No.${record._recordNo ?? "?"}（${record.buildingName}）`;

      try {
        // ── 1. 物件マスタを検索 ───────────────────────────────────────────────
        // まず searchIndex で候補を絞り、なければ全件スキャン（物件数が少ないため許容）
        const candidates = await ctx.db
          .query("properties")
          .withSearchIndex("search_name", (q) =>
            q.search("name", record.buildingName)
          )
          .collect();

        let property =
          candidates.find((p) => p.name === record.buildingName) ??
          candidates.find(
            (p) => normalizeName(p.name) === normalizeName(record.buildingName)
          );

        // searchIndex が日本語をトークナイズできなかった場合のフォールバック
        if (!property) {
          const allProps = await ctx.db.query("properties").collect();
          property =
            allProps.find((p) => p.name === record.buildingName) ??
            allProps.find(
              (p) =>
                normalizeName(p.name) === normalizeName(record.buildingName)
            );
        }

        if (!property) {
          results.notFound++;
          results.errors.push(
            `${tag}: 物件マスタに「${record.buildingName}」が見つかりません`
          );
          continue;
        }

        // ── 2. 重複チェック（物件番号ベース） ──────────────────────────────
        const existing = await ctx.db
          .query("transactions")
          .withIndex("by_source_record_id", (q) =>
            q.eq("sourceRecordId", record.sourceRecordId)
          )
          .first();

        if (existing) {
          results.skipped++;
          continue;
        }

        // ── 3. 日付から取引年・年月を導出 ──────────────────────────────────
        const [yearStr, monthStr] = record.transactionDate.split("-");
        const transactionYear = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        // "YYYY-MM" 形式で格納（例: "2026-05"）
        const transactionYearQ = `${transactionYear}-${monthStr.padStart(2, "0")}`;

        // ── 4. 残存借地権年数を計算 ─────────────────────────────────────────
        const remainingLeaseYears =
          property.leaseStartYear + property.leaseTotalYears - transactionYear;

        // ── 5. 単価を計算 ───────────────────────────────────────────────────
        const pricePerSqm =
          Math.round((record.price / record.areaSqm) * 100) / 100;
        const pricePerTsubo =
          Math.round(pricePerSqm * 3.30578 * 100) / 100;

        // ── 6. INSERT ────────────────────────────────────────────────────────
        await ctx.db.insert("transactions", {
          propertyId: property._id,
          transactionYearQ,
          transactionYear,
          price: record.price,
          areaSqm: record.areaSqm,
          floor: record.floor,
          remainingLeaseYears,
          pricePerSqm,
          pricePerTsubo,
          isNewConstruction: false,
          priceType: "transaction",
          source,
          transactionDate: record.transactionDate,
          layout: record.layout,
          managementFee: record.managementFee,
          sourceRecordId: record.sourceRecordId,
        });

        results.inserted++;
      } catch (err) {
        results.errors.push(`${tag}: ${String(err)}`);
      }
    }

    return results;
  },
});

// ── source が一致するレコードの priceType を新築に更新するマイグレーション ──
export const fixPriceTypeBySource = mutation({
  args: { source: v.string(), priceType: v.union(v.literal("new_construction"), v.literal("listing"), v.literal("transaction")) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("transactions").collect();
    const targets = all.filter((t) => t.source === args.source);
    let updated = 0;
    for (const t of targets) {
      await ctx.db.patch(t._id, { priceType: args.priceType, isNewConstruction: args.priceType === "new_construction" });
      updated++;
    }
    return { updated };
  },
});

// ── transactionYearQ を "YYYYQn" → "YYYY-MM" に一括更新するマイグレーション ──
// transactionDate を持つレコード（REINS PDFインポート分）のみ対象
export const migrateYearQToYearMonth = internalMutation({
  args: {},
  handler: async (ctx) => {
    // sourceRecordId を持つ = PDF由来レコード
    const all = await ctx.db.query("transactions").collect();
    const targets = all.filter(
      (t) => t.sourceRecordId !== undefined && t.transactionDate !== undefined
    );

    let updated = 0;
    for (const t of targets) {
      // 既に "YYYY-MM" 形式なら skip
      if (t.transactionYearQ && /^\d{4}-\d{2}$/.test(t.transactionYearQ)) continue;

      const [yearStr, monthStr] = (t.transactionDate as string).split("-");
      const newYearQ = `${yearStr}-${monthStr.padStart(2, "0")}`;
      await ctx.db.patch(t._id, { transactionYearQ: newYearQ });
      updated++;
    }
    return { updated };
  },
});
