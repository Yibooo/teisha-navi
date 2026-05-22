import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 定期借地権マンション物件マスタ
  properties: defineTable({
    name: v.string(),                  // マンション名
    ward: v.string(),                  // 区（例: 港区）
    address: v.string(),               // 住所
    leaseStartYear: v.number(),        // 借地権開始年
    leaseTotalYears: v.number(),       // 借地権総期間（例: 70）
    buildingYear: v.number(),          // 建築年
    totalUnits: v.optional(v.number()), // 総戸数
    nearestStation: v.optional(v.string()), // 最寄駅
    walkMinutes: v.optional(v.number()), // 徒歩分数
    notes: v.optional(v.string()),     // 備考
  })
    .index("by_ward", ["ward"])
    .searchIndex("search_name", { searchField: "name" }),

  // 取引履歴
  transactions: defineTable({
    propertyId: v.id("properties"),   // 物件マスタへの参照
    transactionYearQ: v.string(),      // 取引時期（例: 2023Q3）
    transactionYear: v.number(),       // 取引年（計算用）
    price: v.number(),                 // 価格（万円）
    areaSqm: v.number(),               // 専有面積（m²）
    floor: v.optional(v.number()),     // 階数
    remainingLeaseYears: v.number(),   // 残存借地権年数（計算値）
    pricePerSqm: v.number(),           // 単価（万円/m²）
    pricePerTsubo: v.optional(v.number()), // 坪単価（万円/坪）= pricePerSqm × 3.30578
    isNewConstruction: v.boolean(),    // 新築フラグ（後方互換）
    // priceType: 価格種別
    //   "new_construction" = 新築売り出し価格（STEP1）
    //   "listing"          = 中古売り出し価格・SUUMO等（STEP2）
    //   "transaction"      = 実際の成約価格・国交省等（STEP3）
    priceType: v.optional(v.union(
      v.literal("new_construction"),
      v.literal("listing"),
      v.literal("transaction"),
    )),
    source: v.string(),               // データソース（URL含む）
    // REINS PDF インポート用フィールド
    transactionDate: v.optional(v.string()),     // 成約年月日 "YYYY-MM-DD"
    layout: v.optional(v.string()),              // 間取（例: "3LDK"）
    managementFee: v.optional(v.number()),       // 管理費（円）
    sourceRecordId: v.optional(v.string()),      // 物件番号（REINS等・重複防止用）
  })
    .index("by_property", ["propertyId"])
    .index("by_remaining_years", ["remainingLeaseYears"])
    .index("by_year", ["transactionYear"])
    .index("by_source_record_id", ["sourceRecordId"]),

  // グラフ・シミュレーション用集計キャッシュ
  analysisCache: defineTable({
    remainingYearsBucket: v.string(),  // 残存年数帯（例: "60-70", "50-60"）
    bucketMin: v.number(),             // 残存年数帯の下限
    bucketMax: v.number(),             // 残存年数帯の上限
    ward: v.optional(v.string()),      // 区（null = 全区）
    avgPricePerSqm: v.number(),        // 平均単価（万円/m²）
    medianPricePerSqm: v.number(),     // 中央値単価（万円/m²）
    avgPricePerTsubo: v.optional(v.number()),    // 平均坪単価（万円/坪）
    medianPricePerTsubo: v.optional(v.number()), // 中央値坪単価（万円/坪）
    avgPriceRatio: v.number(),         // 新築比平均価格比率（0〜1）
    medianPriceRatio: v.number(),      // 新築比中央値価格比率（0〜1）
    sampleCount: v.number(),           // サンプル件数
    updatedAt: v.number(),             // 更新日時（Unix ms）
  })
    .index("by_bucket", ["remainingYearsBucket"])
    .index("by_bucket_ward", ["remainingYearsBucket", "ward"]),
});
