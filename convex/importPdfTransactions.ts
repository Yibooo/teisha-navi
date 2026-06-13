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

// ── 南砂町以外の新築データを削除するマイグレーション ──────────────────────────
export const deleteNewConstructionExcept = mutation({
  args: { keepPropertyName: v.string() },
  handler: async (ctx, args) => {
    const properties = await ctx.db.query("properties").collect();
    const keepProp = properties.find((p) => p.name === args.keepPropertyName);

    // 削除前に対象一覧を収集
    const allTx = await ctx.db.query("transactions").collect();
    const targets = allTx.filter(
      (t) =>
        (t.priceType === "new_construction" || t.isNewConstruction === true) &&
        t.propertyId !== keepProp?._id
    );

    const deletedNames = targets.map((t) => {
      const prop = properties.find((p) => p._id === t.propertyId);
      return prop?.name ?? "不明";
    });

    let deleted = 0;
    for (const t of targets) {
      await ctx.db.delete(t._id);
      deleted++;
    }
    return { deleted, deletedPropertyNames: [...new Set(deletedNames)] };
  },
});

// ── Excelから新築坪単価を一括インポート ────────────────────────────────────────
export const importNewConstructionPrices = mutation({
  args: {
    items: v.array(
      v.object({
        propertyName: v.string(),
        pricePerTsubo: v.number(), // 万円/坪
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = {
      inserted: 0,
      deleted: 0,
      notFound: 0,
      errors: [] as string[],
    };

    const allProps = await ctx.db.query("properties").collect();

    for (const item of args.items) {
      // 物件マスタを検索（完全一致 → 正規化一致）
      const property =
        allProps.find((p) => p.name === item.propertyName) ??
        allProps.find(
          (p) => normalizeName(p.name) === normalizeName(item.propertyName)
        );

      if (!property) {
        results.notFound++;
        results.errors.push(`「${item.propertyName}」が物件マスタに見つかりません`);
        continue;
      }

      // 既存の new_construction レコードを削除
      const existingNewConst = await ctx.db
        .query("transactions")
        .withIndex("by_property", (q) => q.eq("propertyId", property._id))
        .collect();
      const toDelete = existingNewConst.filter(
        (t) => t.priceType === "new_construction" || t.isNewConstruction === true
      );
      for (const t of toDelete) {
        await ctx.db.delete(t._id);
        results.deleted++;
      }

      // 単価変換
      const pricePerSqm =
        Math.round((item.pricePerTsubo / 3.30578) * 100) / 100; // 万円/m²
      const price = Math.round(pricePerSqm * 70); // 70m²代表面積

      // 新築時 = 借地開始年、残存 = leaseTotalYears
      const transactionYear = property.leaseStartYear;
      const remainingLeaseYears = property.leaseTotalYears;
      const transactionYearQ = `${transactionYear}-01`;
      const transactionDate = `${transactionYear}-01-01`;

      await ctx.db.insert("transactions", {
        propertyId: property._id,
        transactionYear,
        transactionYearQ,
        transactionDate,
        remainingLeaseYears,
        price,
        areaSqm: 70,
        pricePerSqm,
        pricePerTsubo: item.pricePerTsubo,
        isNewConstruction: true,
        priceType: "new_construction",
        source: "manual-excel",
        sourceRecordId: `manual-new-const-${property._id}`,
      });

      results.inserted++;
    }

    return results;
  },
});

// ── 重複物件マスタの統合 ────────────────────────────────────────────────────
// removeId の取引を keepId に付け替え、removeId（重複マスタ）を削除する。
// 取引データそのものは削除しない（propertyId を付け替えるのみ）。
export const mergeProperties = mutation({
  args: {
    pairs: v.array(
      v.object({
        keepId: v.id("properties"),
        removeId: v.id("properties"),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = {
      moved: 0,
      deletedProps: 0,
      details: [] as Array<{
        keep: string;
        remove: string;
        moved: number;
      }>,
    };

    for (const { keepId, removeId } of args.pairs) {
      const keep = await ctx.db.get(keepId);
      const remove = await ctx.db.get(removeId);
      if (!keep || !remove) {
        results.details.push({
          keep: keepId,
          remove: removeId,
          moved: -1, // どちらかが見つからない
        });
        continue;
      }

      const txs = await ctx.db
        .query("transactions")
        .withIndex("by_property", (q) => q.eq("propertyId", removeId))
        .collect();

      let moved = 0;
      for (const t of txs) {
        await ctx.db.patch(t._id, { propertyId: keepId });
        moved++;
        results.moved++;
      }

      await ctx.db.delete(removeId);
      results.deletedProps++;

      results.details.push({
        keep: `${keep.name}(${keep.ward})`,
        remove: `${remove.name}(${remove.ward})`,
        moved,
      });
    }

    return results;
  },
});

// ── 残存年数の再計算 ────────────────────────────────────────────────────────
// 各取引の remainingLeaseYears を、紐づく物件の (leaseStartYear + leaseTotalYears)
// − transactionYear で再計算する。統合で物件を付け替えた取引の残存年数ズレを補正する。
// 非統合物件ではインポート時と同じ値になる（冪等）。
export const recomputeRemainingYears = mutation({
  args: {
    propertyIds: v.optional(v.array(v.id("properties"))),
  },
  handler: async (ctx, args) => {
    const props = await ctx.db.query("properties").collect();
    const propMap = new Map(props.map((p) => [p._id, p]));

    const targetIds = args.propertyIds
      ? new Set(args.propertyIds.map((id) => id as string))
      : null;

    const allTx = await ctx.db.query("transactions").collect();
    let updated = 0;
    let skipped = 0;

    for (const t of allTx) {
      if (targetIds && !targetIds.has(t.propertyId as string)) continue;
      const p = propMap.get(t.propertyId);
      if (!p) {
        skipped++;
        continue;
      }
      const leaseEndYear = p.leaseStartYear + p.leaseTotalYears;
      const correct = leaseEndYear - t.transactionYear;
      if (t.remainingLeaseYears !== correct) {
        await ctx.db.patch(t._id, { remainingLeaseYears: correct });
        updated++;
      }
    }

    return { updated, skipped, totalScanned: allTx.length };
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
