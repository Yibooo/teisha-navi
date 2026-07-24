import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

// 駅徒歩バケット判定（"all"/未指定=全件。徒歩不明(null)は特定バケット選択時は除外）
function inWalkBucket(walk: number | undefined, bucket?: string): boolean {
  if (!bucket || bucket === "all") return true;
  if (walk == null) return false;
  if (bucket === "w0_5") return walk <= 5;
  if (bucket === "w6_9") return walk >= 6 && walk <= 9;
  if (bucket === "w10up") return walk >= 10;
  return true;
}

// 物件ごとの新築平均単価（万円/m²）
function computeAvgNewPrice(allTx: Doc<"transactions">[]): Record<string, number> {
  const acc: Record<string, number[]> = {};
  for (const tx of allTx) {
    if (tx.isNewConstruction) {
      const id = tx.propertyId as string;
      (acc[id] ??= []).push(tx.pricePerSqm);
    }
  }
  const out: Record<string, number> = {};
  for (const [id, arr] of Object.entries(acc)) {
    out[id] = arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  return out;
}

// 残存年数5年刻みバケットの集計（getChartData のライブ集計・rebuildCache と同一ロジック）
type BucketRow = {
  remainingYearsBucket: string;
  bucketMin: number;
  bucketMax: number;
  avgPricePerSqm: number;
  medianPricePerSqm: number;
  avgPricePerTsubo: number;
  medianPricePerTsubo: number;
  avgPriceRatio?: number;
  medianPriceRatio?: number;
  ratioSampleCount?: number;
  sampleCount: number;
};

function computeBucketRows(
  resale: Doc<"transactions">[],
  avgNewPrice: Record<string, number>,
): BucketRow[] {
  const buckets: Array<{ min: number; max: number; label: string }> = [];
  for (let max = 70; max >= 5; max -= 5) {
    buckets.push({ min: max - 5, max, label: `${max - 5}-${max}` });
  }
  const rows: BucketRow[] = [];
  for (const bucket of buckets) {
    const inBucket = resale.filter(
      (t) => t.remainingLeaseYears >= bucket.min && t.remainingLeaseYears < bucket.max,
    );
    if (inBucket.length === 0) continue;
    const prices = inBucket.map((t) => t.pricePerSqm).sort((a, b) => a - b);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const median = prices[Math.floor(prices.length / 2)];
    const tsuboPrices = inBucket
      .map((t) => t.pricePerTsubo ?? t.pricePerSqm * 3.30578)
      .sort((a, b) => a - b);
    const avgTsubo = Math.round((tsuboPrices.reduce((a, b) => a + b, 0) / tsuboPrices.length) * 10) / 10;
    const medianTsubo = Math.round(tsuboPrices[Math.floor(tsuboPrices.length / 2)] * 10) / 10;
    const ratios = inBucket
      .map((t) => {
        const np = avgNewPrice[t.propertyId as string];
        return np ? t.pricePerSqm / np : null;
      })
      .filter((r): r is number => r !== null);
    const sortedRatios = [...ratios].sort((a, b) => a - b);
    const ratioFields: Pick<
      BucketRow,
      "avgPriceRatio" | "medianPriceRatio" | "ratioSampleCount"
    > =
      ratios.length > 0
        ? {
            avgPriceRatio: ratios.reduce((a, b) => a + b, 0) / ratios.length,
            medianPriceRatio: sortedRatios[Math.floor(sortedRatios.length / 2)],
            ratioSampleCount: ratios.length,
          }
        : {};
    rows.push({
      remainingYearsBucket: bucket.label,
      bucketMin: bucket.min,
      bucketMax: bucket.max,
      avgPricePerSqm: avg,
      medianPricePerSqm: median,
      avgPricePerTsubo: avgTsubo,
      medianPricePerTsubo: medianTsubo,
      ...ratioFields,
      sampleCount: inBucket.length,
    });
  }
  return rows;
}

// グラフ用データ取得（残存年数別の取引データ）
export const getChartData = query({
  args: {
    ward: v.optional(v.string()),
    walkBucket: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 駅徒歩フィルター指定時はキャッシュを使わずライブ集計（区キャッシュは駅徒歩非対応のため）
    if (args.walkBucket && args.walkBucket !== "all") {
      const properties = await ctx.db.query("properties").collect();
      const allTx = await ctx.db.query("transactions").collect();
      const avgNewPrice = computeAvgNewPrice(allTx);
      const allowed = new Set(
        properties
          .filter(
            (p) =>
              (!args.ward || p.ward === args.ward) &&
              inWalkBucket(p.walkMinutes, args.walkBucket),
          )
          .map((p) => p._id),
      );
      const resale = allTx.filter(
        (t) => t.priceType === "transaction" && allowed.has(t.propertyId),
      );
      const now = Date.now();
      return computeBucketRows(resale, avgNewPrice)
        .sort((a, b) => a.bucketMin - b.bucketMin)
        .map((c) => ({
          remainingYearsBucket: c.remainingYearsBucket,
          bucketMin: c.bucketMin,
          bucketMax: c.bucketMax,
          ward: args.ward,
          avgPricePerSqm: c.avgPricePerSqm,
          medianPricePerSqm: c.medianPricePerSqm,
          avgPricePerTsubo: c.avgPricePerTsubo,
          medianPricePerTsubo: c.medianPricePerTsubo,
          avgPriceRatio: c.avgPriceRatio,
          medianPriceRatio: c.medianPriceRatio,
          ratioSampleCount: c.ratioSampleCount,
          sampleCount: c.sampleCount,
          updatedAt: now,
        }));
    }

    // analysisCache から集計済みデータを返す
    const allCache = await ctx.db.query("analysisCache").collect();

    let filtered = args.ward
      ? allCache.filter((c) => c.ward === args.ward)
      : allCache.filter((c) => c.ward === undefined || c.ward === null);

    // bucketMin で昇順ソート、必要フィールドのみ返す
    filtered.sort((a, b) => a.bucketMin - b.bucketMin);
    return filtered.map((c) => ({
      remainingYearsBucket: c.remainingYearsBucket,
      bucketMin: c.bucketMin,
      bucketMax: c.bucketMax,
      ward: c.ward,
      avgPricePerSqm: c.avgPricePerSqm,
      medianPricePerSqm: c.medianPricePerSqm,
      avgPricePerTsubo: c.avgPricePerTsubo,
      medianPricePerTsubo: c.medianPricePerTsubo,
      avgPriceRatio: c.avgPriceRatio,
      medianPriceRatio: c.medianPriceRatio,
      ratioSampleCount: c.ratioSampleCount,
      sampleCount: c.sampleCount,
      updatedAt: c.updatedAt,
    }));
  },
});

// 駅徒歩バケットごとの物件件数（フィルターのバッジ表示用）
export const getWalkBucketCounts = query({
  args: { ward: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const properties = await ctx.db.query("properties").collect();
    const inWard = properties.filter((p) => !args.ward || p.ward === args.ward);
    const count = (b: string) => inWard.filter((p) => inWalkBucket(p.walkMinutes, b)).length;
    return {
      all: inWard.length,
      w0_5: count("w0_5"),
      w6_9: count("w6_9"),
      w10up: count("w10up"),
      unknown: inWard.filter((p) => p.walkMinutes == null).length,
    };
  },
});

// シミュレーション用: 残存年数に近いキャッシュデータを取得
export const getSimulationPoints = query({
  args: {},
  handler: async (ctx) => {
    const allCache = await ctx.db
      .query("analysisCache")
      .collect();

    // 全区集計 & 新築比データがあるもののみ取得し、bucketMinで昇順
    const globalPoints = allCache
      .filter(
        (c) =>
          (c.ward === undefined || c.ward === null) &&
          c.avgPriceRatio != null &&
          c.medianPriceRatio != null
      )
      .sort((a, b) => a.bucketMin - b.bucketMin);

    // シミュレーション用に必要フィールドのみ返す
    return globalPoints.map((c) => ({
      bucketMin: c.bucketMin,
      bucketMax: c.bucketMax,
      avgPriceRatio: c.avgPriceRatio as number,
      medianPriceRatio: c.medianPriceRatio as number,
      sampleCount: c.sampleCount,
    }));
  },
});

// 生取引データ取得（散布図用）
export const getRawTransactions = query({
  args: {
    ward: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allTx = await ctx.db.query("transactions").collect();

    // 成約価格のみ
    let resale = allTx.filter((t) => t.priceType === "transaction");

    if (args.ward) {
      // ward でフィルタするためには property を join する
      const properties = await ctx.db.query("properties").collect();
      const wardPropIds = new Set(
        properties.filter((p) => p.ward === args.ward).map((p) => p._id)
      );
      resale = resale.filter((t) => wardPropIds.has(t.propertyId));
    }

    return resale.map((t) => ({
      remainingLeaseYears: t.remainingLeaseYears,
      pricePerSqm: t.pricePerSqm,
      transactionYear: t.transactionYear,
      priceType: t.priceType ?? "transaction",
    }));
  },
});

// グラフ対象物件一覧（データ件数付き）
export const getPropertiesWithDataCounts = query({
  args: { ward: v.optional(v.string()), walkBucket: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const properties = await ctx.db.query("properties").collect();
    const filtered = properties.filter(
      (p) =>
        (!args.ward || p.ward === args.ward) &&
        inWalkBucket(p.walkMinutes, args.walkBucket),
    );

    const allTx = await ctx.db.query("transactions").collect();
    const currentYear = 2026;

    return filtered
      .map((p) => {
        const propTx = allTx.filter((t) => t.propertyId === p._id);
        const leaseEndYear = p.leaseStartYear + p.leaseTotalYears;

        // 新築坪単価
        const newTx = propTx.filter(
          (t) => t.priceType === "new_construction" || t.isNewConstruction
        );
        const newConstructionPricePerTsubo =
          newTx.length > 0
            ? newTx.reduce(
                (a, t) => a + (t.pricePerTsubo ?? t.pricePerSqm * 3.30578),
                0
              ) / newTx.length
            : null;

        // 最新成約坪単価（transactionDate降順で1件目）
        const transactions = propTx
          .filter(
            (t) =>
              t.priceType === "transaction" ||
              (!t.isNewConstruction && !t.priceType)
          )
          .sort((a, b) =>
            (b.transactionDate ?? b.transactionYearQ ?? "").localeCompare(
              a.transactionDate ?? a.transactionYearQ ?? ""
            )
          );
        const latestTx = transactions[0];
        const latestTransactionPricePerTsubo = latestTx
          ? (latestTx.pricePerTsubo ?? latestTx.pricePerSqm * 3.30578)
          : null;

        // 新築比（%）
        const priceRatio =
          newConstructionPricePerTsubo != null &&
          latestTransactionPricePerTsubo != null
            ? Math.round(
                (latestTransactionPricePerTsubo / newConstructionPricePerTsubo) *
                  1000
              ) / 10
            : null;

        return {
          _id: p._id,
          name: p.name,
          ward: p.ward,
          buildingYear: p.buildingYear,
          leaseEndYear,
          remainingYears: leaseEndYear - currentYear,
          totalUnits: p.totalUnits,
          nearestStation: p.nearestStation,
          walkMinutes: p.walkMinutes,
          dataNew: newTx.length,
          dataListing: propTx.filter((t) => t.priceType === "listing").length,
          dataTransaction: transactions.length,
          newConstructionPricePerTsubo:
            newConstructionPricePerTsubo != null
              ? Math.round(newConstructionPricePerTsubo * 10) / 10
              : null,
          latestTransactionPricePerTsubo:
            latestTransactionPricePerTsubo != null
              ? Math.round(latestTransactionPricePerTsubo * 10) / 10
              : null,
          priceRatio,
        };
      })
      .sort((a, b) => (b.totalUnits ?? 0) - (a.totalUnits ?? 0));
  },
});

// 物件別グラフデータ（1年刻み・成約価格のみ）
export const getPropertyChartData = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const property = await ctx.db.get(args.propertyId);
    if (!property) return null;

    const allTx = await ctx.db
      .query("transactions")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .collect();

    // 成約価格のみ
    const txOnly = allTx.filter((t) => t.priceType === "transaction");

    // 新築価格（参照線用）
    const newTx = allTx.filter(
      (t) => t.priceType === "new_construction" || t.isNewConstruction
    );
    const newConstructionPricePerTsubo =
      newTx.length > 0
        ? Math.round(
            (newTx.reduce(
              (a, t) => a + (t.pricePerTsubo ?? t.pricePerSqm * 3.30578),
              0
            ) /
              newTx.length) *
              10
          ) / 10
        : null;

    // 1年刻みでグループ化
    const byYear = new Map<number, { tsuboPrices: number[]; dates: string[] }>();
    for (const t of txOnly) {
      const year = Math.round(t.remainingLeaseYears);
      if (!byYear.has(year)) byYear.set(year, { tsuboPrices: [], dates: [] });
      const tsubo = t.pricePerTsubo ?? t.pricePerSqm * 3.30578;
      byYear.get(year)!.tsuboPrices.push(tsubo);
      if (t.transactionDate) byYear.get(year)!.dates.push(t.transactionDate);
    }

    const points = Array.from(byYear.entries())
      .map(([year, { tsuboPrices, dates }]) => {
        const sorted = [...tsuboPrices].sort((a, b) => a - b);
        return {
          remainingYears: year,
          avgPricePerTsubo:
            Math.round(
              (tsuboPrices.reduce((a, b) => a + b, 0) / tsuboPrices.length) * 10
            ) / 10,
          medianPricePerTsubo:
            Math.round(sorted[Math.floor(sorted.length / 2)] * 10) / 10,
          minPricePerTsubo: Math.round(sorted[0] * 10) / 10,
          maxPricePerTsubo: Math.round(sorted[sorted.length - 1] * 10) / 10,
          sampleCount: tsuboPrices.length,
          latestDate: dates.sort().reverse()[0] ?? null,
        };
      })
      .sort((a, b) => a.remainingYears - b.remainingYears);

    const leaseEndYear = property.leaseStartYear + property.leaseTotalYears;
    const currentYear = 2026;

    // 売り出し価格データ
    const listings = allTx
      .filter((t) => t.priceType === "listing")
      .map((t) => ({
        price: t.price,
        areaSqm: t.areaSqm,
        floor: t.floor ?? null,
        layout: t.layout ?? null,
        pricePerTsubo:
          Math.round((t.pricePerTsubo ?? t.pricePerSqm * 3.30578) * 10) / 10,
        transactionDate: t.transactionDate ?? null,
        transactionYearQ: t.transactionYearQ ?? null,
      }))
      .sort((a, b) =>
        (b.transactionDate ?? "").localeCompare(a.transactionDate ?? "")
      );

    return {
      property: {
        _id: property._id,
        name: property.name,
        ward: property.ward,
        buildingYear: property.buildingYear,
        leaseEndYear,
        remainingYears: leaseEndYear - currentYear,
        totalUnits: property.totalUnits,
        nearestStation: property.nearestStation,
        walkMinutes: property.walkMinutes,
      },
      points,
      newConstructionPricePerTsubo,
      totalTransactions: txOnly.length,
      listingData: listings,
    };
  },
});

// 新築散布点データ取得（全体グラフ用）
export const getNewConstructionPoints = query({
  args: { ward: v.optional(v.string()), walkBucket: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const allTx = await ctx.db.query("transactions").collect();
    const properties = await ctx.db.query("properties").collect();
    const propMap = new Map(properties.map((p) => [p._id, p]));

    let newTx = allTx.filter(
      (t) => t.priceType === "new_construction" || t.isNewConstruction
    );

    const allowedIds = new Set(
      properties
        .filter(
          (p) =>
            (!args.ward || p.ward === args.ward) &&
            inWalkBucket(p.walkMinutes, args.walkBucket),
        )
        .map((p) => p._id),
    );
    newTx = newTx.filter((t) => allowedIds.has(t.propertyId));

    return newTx.map((t) => ({
      remainingLeaseYears: Math.round(t.remainingLeaseYears),
      pricePerTsubo:
        Math.round((t.pricePerTsubo ?? t.pricePerSqm * 3.30578) * 10) / 10,
      propertyName: propMap.get(t.propertyId)?.name ?? "不明",
    }));
  },
});

// キャッシュ再構築（Admin から呼ぶ）
export const rebuildCache = mutation({
  args: {},
  handler: async (ctx) => {
    const allTx = await ctx.db.query("transactions").collect();
    const properties = await ctx.db.query("properties").collect();
    const propMap = new Map(properties.map((p) => [p._id, p]));

    // 新築取引から物件ごとの新築単価を算出
    const newConstructionPrices: Record<string, number[]> = {};
    for (const tx of allTx) {
      if (tx.isNewConstruction) {
        const propId = tx.propertyId as string;
        if (!newConstructionPrices[propId]) newConstructionPrices[propId] = [];
        newConstructionPrices[propId].push(tx.pricePerSqm);
      }
    }
    const avgNewPrice: Record<string, number> = {};
    for (const [propId, prices] of Object.entries(newConstructionPrices)) {
      avgNewPrice[propId] = prices.reduce((a, b) => a + b, 0) / prices.length;
    }

    // 残存年数帯のバケット定義（5年刻み）
    const buckets: Array<{ min: number; max: number; label: string }> = [];
    for (let max = 70; max >= 5; max -= 5) {
      buckets.push({ min: max - 5, max, label: `${max - 5}-${max}` });
    }

    // 既存キャッシュを全削除
    const existing = await ctx.db.query("analysisCache").collect();
    await Promise.all(existing.map((c) => ctx.db.delete(c._id)));

    // 成約価格のみを対象とする（売り出し価格・新築価格は除外）
    const resale = allTx.filter((t) => t.priceType === "transaction");
    const now = Date.now();

    // 全区 + 区別でキャッシュ構築
    const wardSet = new Set<string | undefined>([undefined]);
    for (const p of properties) wardSet.add(p.ward);

    for (const ward of wardSet) {
      let wardTx = resale;
      if (ward) {
        const wardPropIds = new Set(
          properties.filter((p) => p.ward === ward).map((p) => p._id)
        );
        wardTx = resale.filter((t) => wardPropIds.has(t.propertyId));
      }

      for (const bucket of buckets) {
        const inBucket = wardTx.filter(
          (t) =>
            t.remainingLeaseYears >= bucket.min &&
            t.remainingLeaseYears < bucket.max
        );
        if (inBucket.length === 0) continue;

        const prices = inBucket.map((t) => t.pricePerSqm).sort((a, b) => a - b);
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const median = prices[Math.floor(prices.length / 2)];

        // 坪単価（万円/坪）= 万円/m² × 3.30578
        const tsuboPrices = inBucket
          .map((t) => t.pricePerTsubo ?? t.pricePerSqm * 3.30578)
          .sort((a, b) => a - b);
        const avgTsubo = Math.round(tsuboPrices.reduce((a, b) => a + b, 0) / tsuboPrices.length * 10) / 10;
        const medianTsubo = Math.round(tsuboPrices[Math.floor(tsuboPrices.length / 2)] * 10) / 10;

        // 新築比（新築価格データがある物件のみ比較）
        const ratios = inBucket
          .map((t) => {
            const newPrice = avgNewPrice[t.propertyId as string];
            return newPrice ? t.pricePerSqm / newPrice : null;
          })
          .filter((r): r is number => r !== null);

        // 新築比はデータがある場合のみ保存（デフォルト100%での誤魔化しを防ぐ）
        const sortedRatios = [...ratios].sort((a, b) => a - b);
        const ratioFields =
          ratios.length > 0
            ? {
                avgPriceRatio: ratios.reduce((a, b) => a + b, 0) / ratios.length,
                medianPriceRatio: sortedRatios[Math.floor(sortedRatios.length / 2)],
                ratioSampleCount: ratios.length,
              }
            : {};

        await ctx.db.insert("analysisCache", {
          remainingYearsBucket: bucket.label,
          bucketMin: bucket.min,
          bucketMax: bucket.max,
          ward: ward ?? undefined,
          avgPricePerSqm: avg,
          medianPricePerSqm: median,
          avgPricePerTsubo: avgTsubo,
          medianPricePerTsubo: medianTsubo,
          ...ratioFields,
          sampleCount: inBucket.length,
          updatedAt: now,
        });
      }
    }

    return { success: true, rebuilt: true };
  },
});
