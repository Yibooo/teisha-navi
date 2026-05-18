import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Tier1物件マスタ + 新築価格データの登録
export const seedTier1 = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 物件マスタ定義
    const tier1Properties = [
      {
        name: "シティタワー品川",
        ward: "港区",
        address: "東京都港区港南4丁目",
        leaseStartYear: 2008,
        leaseTotalYears: 70, // 2008+70=2078年（期限）
        buildingYear: 2008,
        totalUnits: 828,
        nearestStation: "品川",
        walkMinutes: 5,
        notes: "借地期限: 2078年10月。一般定期借地権（賃借権）。東京都有地PFI事業。住友不動産分譲。43階建。最高378倍抽選の人気物件。",
      },
      {
        name: "広尾ガーデンフォレスト",
        ward: "渋谷区",
        address: "東京都渋谷区広尾4丁目",
        leaseStartYear: 2013,
        leaseTotalYears: 50, // 2013+50=2063年（期限）
        buildingYear: 2013,
        totalUnits: 674,
        nearestStation: "広尾",
        walkMinutes: 6,
        notes: "借地期限: 2063年頃。一般定期借地権（地上権）。地主: 日本赤十字社。8棟構成（A〜H棟）。2009〜2013年段階的分譲。三井不動産ほか分譲。",
      },
      {
        name: "パークコート渋谷 ザ タワー",
        ward: "渋谷区",
        address: "東京都渋谷区宇田川町",
        leaseStartYear: 2020,
        leaseTotalYears: 73, // 2020+73=2093年（期限）
        buildingYear: 2020,
        totalUnits: 505,
        nearestStation: "渋谷",
        walkMinutes: 5,
        notes: "借地期限: 2093年9月30日。一般定期借地権（転借地権）。地主: 渋谷区。渋谷区役所建替プロジェクト。三井不動産レジデンシャル分譲。39階建。地代70年分一括前払い方式。",
      },
      {
        name: "パークコート神宮前",
        ward: "渋谷区",
        address: "東京都渋谷区神宮前1丁目",
        leaseStartYear: 2009,
        leaseTotalYears: 52, // 2009+52=2061年（期限）
        buildingYear: 2009,
        totalUnits: 385,
        nearestStation: "明治神宮前",
        walkMinutes: 3,
        notes: "借地期限: 2061年3月。定期借地権（転借地権）。東京都有地PFI事業。三井不動産レジデンシャル+東電不動産。隈研吾デザイン監修。坪単価318万（分譲時平均）。",
      },
      {
        name: "パークホームズ南麻布 ザ レジデンス",
        ward: "港区",
        address: "東京都港区南麻布4丁目",
        leaseStartYear: 2013,
        leaseTotalYears: 51, // 2013+51=2064年（期限）
        buildingYear: 2013,
        totalUnits: 336,
        nearestStation: "麻布十番",
        walkMinutes: 7,
        notes: "借地期限: 2064年9月。一般定期借地権（賃借権）。月額地代: 14,490円。NTT社宅跡地。三井不動産レジデンシャル分譲。清水建設施工。",
      },
    ] as const;

    // 各物件の新築代表価格データ（STEP1）
    // price=万円, areaSqm=m², pricePerSqm=万円/m², transactionYear=分譲年
    const newConstructionPrices: Record<string, {
      transactionYear: number; q: number; price: number; areaSqm: number;
      pricePerSqm: number; remainingLeaseYears: number; source: string;
    }> = {
      "シティタワー品川": {
        transactionYear: 2008, q: 1,
        price: 3200,        // 最多価格帯 3,200万円台
        areaSqm: 65,        // 代表住戸（60〜70㎡）
        pricePerSqm: 49.2,  // 3200/65
        remainingLeaseYears: 70, // 2078-2008
        source: "https://www.dai3.co.jp/_old_hp/rbayakyu/20th/times/news236.htm",
      },
      "広尾ガーデンフォレスト": {
        transactionYear: 2013, q: 2,
        price: 8000,         // 椿レジデンス（最終棟）代表 7,000〜9,000万中間値
        areaSqm: 80,         // 代表住戸（71〜191㎡より代表値）
        pricePerSqm: 100.0,  // 8000/80
        remainingLeaseYears: 50, // 2063-2013
        source: "https://hiroo-gf.premium-mansion-selection.com/page16/",
      },
      "パークコート渋谷 ザ タワー": {
        transactionYear: 2020, q: 2,
        price: 11000,         // 1億〜1.2億中間値
        areaSqm: 57,          // 代表住戸（40〜75㎡より代表値）
        pricePerSqm: 193.0,   // 11000/57
        remainingLeaseYears: 73, // 2093-2020
        source: "https://manmani.net/?p=38829",
      },
      "パークコート神宮前": {
        transactionYear: 2009, q: 1,
        price: 4800,         // 坪318万×50㎡≈4,810万（坪単価から逆算）
        areaSqm: 50,         // 代表住戸（37〜169㎡より最多販売帯）
        pricePerSqm: 96.2,   // 318万/坪 ÷ 3.306m²/坪
        remainingLeaseYears: 52, // 2061-2009
        source: "https://www.dai3.co.jp/_old_hp/rbayakyu/20th/times/news333.htm",
      },
      "パークホームズ南麻布 ザ レジデンス": {
        transactionYear: 2013, q: 2,
        price: 5500,         // 5,000〜6,000万中間値
        areaSqm: 62,         // 代表住戸（41〜83㎡より代表値）
        pricePerSqm: 88.7,   // 5500/62
        remainingLeaseYears: 51, // 2064-2013
        source: "https://www.nomu.com/mansion/library/id/P0025774/",
      },
    };

    const results: string[] = [];

    for (const prop of tier1Properties) {
      // 既存チェック
      const existing = await ctx.db
        .query("properties")
        .withSearchIndex("search_name", (q) => q.search("name", prop.name))
        .first();

      let propertyId: string;
      if (existing) {
        propertyId = existing._id;
        results.push(`SKIP property: ${prop.name}（既存 ${propertyId}）`);
      } else {
        propertyId = await ctx.db.insert("properties", prop);
        results.push(`OK property: ${prop.name} (${propertyId})`);
      }

      // 新築価格データを登録（既存チェック: 同propertyId + 同transactionYear + priceType=new_construction）
      const nc = newConstructionPrices[prop.name];
      if (nc) {
        const existingTx = await ctx.db
          .query("transactions")
          .withIndex("by_property", (q) => q.eq("propertyId", propertyId as never))
          .filter((q) =>
            q.and(
              q.eq(q.field("transactionYear"), nc.transactionYear),
              q.eq(q.field("priceType"), "new_construction"),
            )
          )
          .first();

        if (existingTx) {
          results.push(`SKIP tx: ${prop.name} 新築価格（既存）`);
        } else {
          await ctx.db.insert("transactions", {
            propertyId: propertyId as never,
            transactionYearQ: `${nc.transactionYear}Q${nc.q}`,
            transactionYear: nc.transactionYear,
            price: nc.price,
            areaSqm: nc.areaSqm,
            remainingLeaseYears: nc.remainingLeaseYears,
            pricePerSqm: nc.pricePerSqm,
            isNewConstruction: true,
            priceType: "new_construction",
            source: nc.source,
          });
          results.push(`OK tx: ${prop.name} 新築価格 ${nc.price}万円（${nc.areaSqm}㎡, ${nc.pricePerSqm}万/m²）`);
        }
      }
    }

    return results;
  },
});

// SUUMOスクレイピング試験3件の物件マスタ登録
export const seedProperties = internalMutation({
  args: {},
  handler: async (ctx) => {
    const properties = [
      {
        name: "明石町パークハウス",
        ward: "中央区",
        address: "東京都中央区明石町",
        leaseStartYear: 1998,
        leaseTotalYears: 50,
        buildingYear: 1998,
        totalUnits: 22,
        nearestStation: "新富町",
        walkMinutes: 5,
        notes: "借地期限: 2048年3月。一般定期借地権（地上権）。月額地代: 25,440円。出典: SUUMO",
      },
      {
        name: "ドレッセ洗足池",
        ward: "大田区",
        address: "東京都大田区上池台2",
        leaseStartYear: 2019,
        leaseTotalYears: 51,
        buildingYear: 2019,
        totalUnits: 32,
        nearestStation: "洗足池",
        walkMinutes: 2,
        notes: "借地期限: 2070年2月。一般定期借地権（賃借権）。月額地代: 13,400円。出典: SUUMO",
      },
      {
        name: "ブリリア大島",
        ward: "江東区",
        address: "東京都江東区北砂5",
        leaseStartYear: 2020,
        leaseTotalYears: 64,
        buildingYear: 2020,
        totalUnits: 127,
        nearestStation: "大島",
        walkMinutes: 10,
        notes: "存続期間64年（〜2084年）。一般定期借地権（地上権）。月額地代: 9,171円。出典: SUUMO",
      },
    ];

    const inserted: string[] = [];
    for (const prop of properties) {
      // 既に同名物件が存在する場合はスキップ
      const existing = await ctx.db
        .query("properties")
        .withSearchIndex("search_name", (q) => q.search("name", prop.name))
        .first();
      if (existing) {
        inserted.push(`SKIP: ${prop.name}（既存）`);
        continue;
      }
      const id = await ctx.db.insert("properties", prop);
      inserted.push(`OK: ${prop.name} (${id})`);
    }
    return inserted;
  },
});

// Tier1物件のSUUMO中古売り出し価格データ登録（2026年5月調査）
export const seedTier1Listings = internalMutation({
  args: {},
  handler: async (ctx) => {
    // propertyId は本番DBで登録済みの値
    // transactionYear=2026, priceType="listing", 残存年数=期限年-2026
    const listings: Array<{
      propertyName: string;
      propertyId: string;
      price: number;       // 万円
      areaSqm: number;
      floor: number;
      pricePerSqm: number;
      remainingLeaseYears: number;
      source: string;
    }> = [
      // ─── シティタワー品川（期限2078年 → 残52年）──────────────────
      {
        propertyName: "シティタワー品川",
        propertyId: "j973rkhggeftq2b181tpaj613s86ym81",
        price: 11900, areaSqm: 82.77, floor: 4,
        pricePerSqm: Math.round(11900 / 82.77 * 10) / 10,
        remainingLeaseYears: 52,
        source: "https://suumo.jp/ms/chuko/tokyo/sc_minato/nc_20666800/",
      },
      {
        propertyName: "シティタワー品川",
        propertyId: "j973rkhggeftq2b181tpaj613s86ym81",
        price: 12500, areaSqm: 84.26, floor: 18,
        pricePerSqm: Math.round(12500 / 84.26 * 10) / 10,
        remainingLeaseYears: 52,
        source: "https://suumo.jp/ms/chuko/tokyo/sc_minato/nc_20765077/",
      },
      {
        propertyName: "シティタワー品川",
        propertyId: "j973rkhggeftq2b181tpaj613s86ym81",
        price: 12500, areaSqm: 82.77, floor: 35,
        pricePerSqm: Math.round(12500 / 82.77 * 10) / 10,
        remainingLeaseYears: 52,
        source: "https://suumo.jp/ms/chuko/tokyo/sc_minato/nc_20865595/",
      },
      {
        propertyName: "シティタワー品川",
        propertyId: "j973rkhggeftq2b181tpaj613s86ym81",
        price: 14500, areaSqm: 82.77, floor: 40,
        pricePerSqm: Math.round(14500 / 82.77 * 10) / 10,
        remainingLeaseYears: 52,
        source: "https://suumo.jp/ms/chuko/tokyo/sc_minato/nc_20810315/",
      },
      // ─── 広尾ガーデンフォレスト（期限2063年 → 残37年）─────────────
      {
        propertyName: "広尾ガーデンフォレスト",
        propertyId: "j971ws7ypt2qr4gezmke8anfrd86z6a2",
        price: 30000, areaSqm: 108.27, floor: 8,
        pricePerSqm: Math.round(30000 / 108.27 * 10) / 10,
        remainingLeaseYears: 37,
        source: "https://suumo.jp/ms/chuko/tokyo/sc_shibuya/nc_79166166/",
      },
      {
        propertyName: "広尾ガーデンフォレスト",
        propertyId: "j971ws7ypt2qr4gezmke8anfrd86z6a2",
        price: 31800, areaSqm: 96.48, floor: 4,
        pricePerSqm: Math.round(31800 / 96.48 * 10) / 10,
        remainingLeaseYears: 37,
        source: "https://suumo.jp/ms/chuko/tokyo/sc_shibuya/nc_78859290/",
      },
      // ─── パークコート渋谷 ザ タワー（期限2093年 → 残67年）──────────
      {
        propertyName: "パークコート渋谷 ザ タワー",
        propertyId: "j97b8wwhdmw4nm9t2gxds989qh86zsf6",
        price: 17500, areaSqm: 59.34, floor: 19,
        pricePerSqm: Math.round(17500 / 59.34 * 10) / 10,
        remainingLeaseYears: 67,
        source: "https://suumo.jp/ms/chuko/tokyo/sc_shibuya/nc_78877576/",
      },
      {
        propertyName: "パークコート渋谷 ザ タワー",
        propertyId: "j97b8wwhdmw4nm9t2gxds989qh86zsf6",
        price: 24800, areaSqm: 63.35, floor: 38,
        pricePerSqm: Math.round(24800 / 63.35 * 10) / 10,
        remainingLeaseYears: 67,
        source: "https://suumo.jp/ms/chuko/tokyo/sc_shibuya/nc_20437784/",
      },
      {
        propertyName: "パークコート渋谷 ザ タワー",
        propertyId: "j97b8wwhdmw4nm9t2gxds989qh86zsf6",
        price: 33000, areaSqm: 93.13, floor: 24,
        pricePerSqm: Math.round(33000 / 93.13 * 10) / 10,
        remainingLeaseYears: 67,
        source: "https://suumo.jp/ms/chuko/tokyo/sc_shibuya/nc_20437192/",
      },
      // ─── パークコート神宮前（期限2061年 → 残35年）───────────────────
      {
        propertyName: "パークコート神宮前",
        propertyId: "j9794mx9mm62ap9mk6r09hf5zx86z1nc",
        price: 5999, areaSqm: 37.55, floor: 2,
        pricePerSqm: Math.round(5999 / 37.55 * 10) / 10,
        remainingLeaseYears: 35,
        source: "https://suumo.jp/ms/chuko/tokyo/sc_shibuya/nc_20011741/",
      },
      // ─── パークホームズ南麻布 ザ レジデンス（期限2064年 → 残38年）──
      {
        propertyName: "パークホームズ南麻布 ザ レジデンス",
        propertyId: "j97f9bnx3d9bfccr9t6rk9j9rd86z0eb",
        price: 14800, areaSqm: 63.13, floor: 13,
        pricePerSqm: Math.round(14800 / 63.13 * 10) / 10,
        remainingLeaseYears: 38,
        source: "https://suumo.jp/ms/chuko/tokyo/sc_minato/nc_20861607/",
      },
      {
        propertyName: "パークホームズ南麻布 ザ レジデンス",
        propertyId: "j97f9bnx3d9bfccr9t6rk9j9rd86z0eb",
        price: 14800, areaSqm: 63.13, floor: 13,
        pricePerSqm: Math.round(14800 / 63.13 * 10) / 10,
        remainingLeaseYears: 38,
        source: "https://suumo.jp/ms/chuko/tokyo/sc_minato/nc_20862052/",
      },
    ];

    const results: string[] = [];
    for (const l of listings) {
      // 同一source（URL）で既存チェック
      const existing = await ctx.db
        .query("transactions")
        .withIndex("by_property", (q) => q.eq("propertyId", l.propertyId as never))
        .filter((q) =>
          q.and(
            q.eq(q.field("source"), l.source),
            q.eq(q.field("priceType"), "listing"),
          )
        )
        .first();
      if (existing) {
        results.push(`SKIP: ${l.propertyName} ${l.price}万（既存）`);
        continue;
      }
      await ctx.db.insert("transactions", {
        propertyId: l.propertyId as never,
        transactionYearQ: "2026Q2",
        transactionYear: 2026,
        price: l.price,
        areaSqm: l.areaSqm,
        floor: l.floor,
        remainingLeaseYears: l.remainingLeaseYears,
        pricePerSqm: l.pricePerSqm,
        isNewConstruction: false,
        priceType: "listing",
        source: l.source,
      });
      results.push(`OK: ${l.propertyName} ${l.price}万（${l.areaSqm}m², 残${l.remainingLeaseYears}年）`);
    }
    return results;
  },
});
