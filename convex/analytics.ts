import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// グラフ用データ取得（残存年数別の取引データ）
export const getChartData = query({
  args: {
    ward: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // analysisCache から集計済みデータを返す
    let cacheQuery = ctx.db.query("analysisCache");
    const allCache = await cacheQuery.collect();

    let filtered = args.ward
      ? allCache.filter((c) => c.ward === args.ward)
      : allCache.filter((c) => c.ward === undefined || c.ward === null);

    // bucketMin で昇順ソート
    filtered.sort((a, b) => a.bucketMin - b.bucketMin);
    return filtered;
  },
});

// シミュレーション用: 残存年数に近いキャッシュデータを取得
export const getSimulationPoints = query({
  args: {},
  handler: async (ctx) => {
    const allCache = await ctx.db
      .query("analysisCache")
      .collect();

    // 全区集計のみ取得し、bucketMinで昇順
    const globalPoints = allCache
      .filter((c) => c.ward === undefined || c.ward === null)
      .sort((a, b) => a.bucketMin - b.bucketMin);

    return globalPoints;
  },
});

// 生取引データ取得（散布図用）
export const getRawTransactions = query({
  args: {
    ward: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allTx = await ctx.db.query("transactions").collect();

    // 中古取引のみ
    let resale = allTx.filter((t) => !t.isNewConstruction);

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

    const resale = allTx.filter((t) => !t.isNewConstruction);
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

        // 新築比（各取引の物件の新築価格と比較）
        const ratios = inBucket
          .map((t) => {
            const newPrice = avgNewPrice[t.propertyId as string];
            return newPrice ? t.pricePerSqm / newPrice : null;
          })
          .filter((r): r is number => r !== null);

        const avgRatio =
          ratios.length > 0
            ? ratios.reduce((a, b) => a + b, 0) / ratios.length
            : 1;
        const sortedRatios = [...ratios].sort((a, b) => a - b);
        const medianRatio =
          sortedRatios.length > 0
            ? sortedRatios[Math.floor(sortedRatios.length / 2)]
            : 1;

        await ctx.db.insert("analysisCache", {
          remainingYearsBucket: bucket.label,
          bucketMin: bucket.min,
          bucketMax: bucket.max,
          ward: ward ?? undefined,
          avgPricePerSqm: avg,
          medianPricePerSqm: median,
          avgPricePerTsubo: avgTsubo,
          medianPricePerTsubo: medianTsubo,
          avgPriceRatio: avgRatio,
          medianPriceRatio: medianRatio,
          sampleCount: inBucket.length,
          updatedAt: now,
        });
      }
    }

    return { success: true, rebuilt: true };
  },
});
