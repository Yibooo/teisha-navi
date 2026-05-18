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

// Tier3A物件（10件）の物件マスタ + 新築価格 + SUUMO売り出し価格データ登録（2026年5月調査）
export const seedTier3A = internalMutation({
  args: {},
  handler: async (ctx) => {
    const results: string[] = [];

    // ── ヘルパー ───────────────────────────────────────────────────────
    const ensureProperty = async (prop: {
      name: string; ward: string; address: string;
      leaseStartYear: number; leaseTotalYears: number; buildingYear: number;
      totalUnits: number; nearestStation?: string; walkMinutes?: number; notes?: string;
    }) => {
      const existing = await ctx.db
        .query("properties")
        .withSearchIndex("search_name", (q) => q.search("name", prop.name))
        .collect();
      const exact = existing.find((p) => p.name === prop.name);
      if (exact) {
        results.push(`SKIP property: ${prop.name}（既存）`);
        return exact._id as string;
      }
      const id = await ctx.db.insert("properties", prop);
      results.push(`OK property: ${prop.name}`);
      return id as string;
    };

    const insertListing = async (
      propertyName: string,
      propertyId: string,
      price: number,
      areaSqm: number,
      floor: number | undefined,
      remainingLeaseYears: number,
      transactionYear: number,
      source: string,
    ) => {
      const existing = await ctx.db
        .query("transactions")
        .withIndex("by_property", (q) => q.eq("propertyId", propertyId as never))
        .filter((q) =>
          q.and(q.eq(q.field("source"), source), q.eq(q.field("priceType"), "listing"))
        )
        .first();
      if (existing) { results.push(`SKIP listing: ${propertyName} ${price}万`); return; }
      const pricePerSqm = Math.round(price / areaSqm * 100) / 100;
      const data: Record<string, unknown> = {
        propertyId: propertyId as never,
        transactionYearQ: `${transactionYear}Q2`,
        transactionYear,
        price, areaSqm,
        remainingLeaseYears, pricePerSqm,
        isNewConstruction: false, priceType: "listing", source,
      };
      if (floor !== undefined) data.floor = floor;
      await ctx.db.insert("transactions", data as never);
      results.push(`OK listing: ${propertyName} ${price}万（${areaSqm}m², 残${remainingLeaseYears}年）`);
    };

    const insertNewConst = async (
      propertyName: string,
      propertyId: string,
      transactionYear: number,
      price: number,
      areaSqm: number,
      floor: number | undefined,
      remainingLeaseYears: number,
      source: string,
    ) => {
      // 同一物件 + 同一年 + 同一pricePerSqm で重複チェック
      const pricePerSqm = Math.round(price / areaSqm * 100) / 100;
      const existing = await ctx.db
        .query("transactions")
        .withIndex("by_property", (q) => q.eq("propertyId", propertyId as never))
        .filter((q) =>
          q.and(
            q.eq(q.field("priceType"), "new_construction"),
            q.eq(q.field("price"), price),
            q.eq(q.field("areaSqm"), areaSqm),
          )
        )
        .first();
      if (existing) { results.push(`SKIP nc: ${propertyName} ${price}万`); return; }
      const data: Record<string, unknown> = {
        propertyId: propertyId as never,
        transactionYearQ: `${transactionYear}Q1`,
        transactionYear, price, areaSqm,
        remainingLeaseYears, pricePerSqm,
        isNewConstruction: true, priceType: "new_construction", source,
      };
      if (floor !== undefined) data.floor = floor;
      await ctx.db.insert("transactions", data as never);
      results.push(`OK nc: ${propertyName} ${price}万（${areaSqm}m², 残${remainingLeaseYears}年）`);
    };

    // ──────────────────────────────────────────────────────────────────
    // T3A-1: ブリリアシティ西早稲田（豊島区, 竣工2022, 借地〜2092年）
    // ──────────────────────────────────────────────────────────────────
    const propBrilliaW = await ensureProperty({
      name: "ブリリアシティ西早稲田",
      ward: "豊島区",
      address: "東京都豊島区高田1丁目",
      leaseStartYear: 2020, leaseTotalYears: 72,
      buildingYear: 2022, totalUnits: 454,
      nearestStation: "面影橋", walkMinutes: 1,
      notes: "借地期限: 2092年5月31日。東京建物分譲。都電荒川線最寄り。",
    });
    const srcBW = "https://manmani.net/?p=32142";
    await insertNewConst("ブリリアシティ西早稲田", propBrilliaW, 2020, 5900, 71.48, 3, 72, srcBW);
    await insertNewConst("ブリリアシティ西早稲田", propBrilliaW, 2020, 6400, 71.48, 8, 72, srcBW);
    await insertNewConst("ブリリアシティ西早稲田", propBrilliaW, 2020, 7200, 71.48, 13, 72, srcBW);
    await insertNewConst("ブリリアシティ西早稲田", propBrilliaW, 2020, 7300, 82.13, 3, 72, srcBW);
    await insertNewConst("ブリリアシティ西早稲田", propBrilliaW, 2020, 7200, 71.69, 8, 72, srcBW);
    // listings（残66年 = 2092-2026）
    const bwListings: [number, number, number | undefined, string][] = [
      [9980, 72.16, 6, "https://suumo.jp/ms/chuko/tokyo/sc_toshima/nc_79042055/"],
      [9980, 71.69, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_toshima/nc_20427548/"],
      [10190, 72.05, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_toshima/nc_20629149/"],
      [10260, 72.16, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_toshima/nc_20537715/"],
      [10340, 71.77, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_toshima/nc_20812078/"],
      [10580, 72.17, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_toshima/nc_78707732/"],
      [10780, 72.16, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_toshima/nc_20345314/"],
      [10780, 72.16, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_toshima/nc_20538450/"],
      [11500, 72.05, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_toshima/nc_20737139/"],
      [11500, 71.69, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_toshima/nc_20321996/"],
    ];
    for (const [p, a, f, s] of bwListings) await insertListing("ブリリアシティ西早稲田", propBrilliaW, p, a, f, 66, 2026, s);

    // ──────────────────────────────────────────────────────────────────
    // T3A-2: ブリリアシティ三鷹（練馬区, 竣工2019, 借地〜2087年）
    // ──────────────────────────────────────────────────────────────────
    const propBrilliaM = await ensureProperty({
      name: "ブリリアシティ三鷹",
      ward: "練馬区",
      address: "東京都練馬区関町南4丁目",
      leaseStartYear: 2017, leaseTotalYears: 70,
      buildingYear: 2019, totalUnits: 436,
      nearestStation: "武蔵関", walkMinutes: 16,
      notes: "借地期限: 2087年12月29日。東京建物・住友商事分譲。西武新宿線最寄り。",
    });
    const srcBM = "https://manmani.net/?p=12880";
    // 残68年 = 2087-2019
    await insertNewConst("ブリリアシティ三鷹", propBrilliaM, 2019, 4400, 71.47, 2, 68, srcBM);
    await insertNewConst("ブリリアシティ三鷹", propBrilliaM, 2019, 5300, 73.79, 5, 68, srcBM);
    await insertNewConst("ブリリアシティ三鷹", propBrilliaM, 2019, 3900, 70.98, 2, 68, srcBM);
    await insertNewConst("ブリリアシティ三鷹", propBrilliaM, 2019, 4300, 74.00, 2, 68, srcBM);
    // listings（残61年 = 2087-2026）
    await insertListing("ブリリアシティ三鷹", propBrilliaM, 6480, 71.47, undefined, 61, 2026, "https://suumo.jp/ms/chuko/tokyo/sc_nerima/nc_77876341/");
    await insertListing("ブリリアシティ三鷹", propBrilliaM, 7780, 87.75, undefined, 61, 2026, "https://suumo.jp/ms/chuko/tokyo/sc_nerima/nc_96315991/");

    // ──────────────────────────────────────────────────────────────────
    // T3A-3: リビオシティ南砂町ステーションサイト（江東区, 竣工2023, 借地〜2085年）
    // ──────────────────────────────────────────────────────────────────
    const propLivio = await ensureProperty({
      name: "リビオシティ南砂町ステーションサイト",
      ward: "江東区",
      address: "東京都江東区南砂",
      leaseStartYear: 2023, leaseTotalYears: 62,
      buildingYear: 2023, totalUnits: 361,
      nearestStation: "南砂町",
      notes: "借地期限: 2085年9月30日。日鉄興和不動産分譲。東京メトロ東西線最寄り。",
    });
    const srcLV = "https://manmani.net/?p=39206";
    // 残63年 = 2085-2022（先行販売は2022年）
    await insertNewConst("リビオシティ南砂町SS", propLivio, 2022, 5978, 72.45, 1, 63, srcLV);
    await insertNewConst("リビオシティ南砂町SS", propLivio, 2022, 5998, 72.45, 4, 63, srcLV);
    await insertNewConst("リビオシティ南砂町SS", propLivio, 2022, 6268, 72.45, 9, 63, srcLV);
    await insertNewConst("リビオシティ南砂町SS", propLivio, 2022, 6398, 72.45, 12, 63, srcLV);
    // 中古流通なし（2023年竣工の新しい物件）

    // ──────────────────────────────────────────────────────────────────
    // T3A-4: ジオ板橋大山（板橋区, 竣工2025, 借地〜2098年）
    // ──────────────────────────────────────────────────────────────────
    const propGeo = await ensureProperty({
      name: "ジオ板橋大山",
      ward: "板橋区",
      address: "東京都板橋区仲町",
      leaseStartYear: 2026, leaseTotalYears: 72,
      buildingYear: 2025, totalUnits: 285,
      nearestStation: "大山", walkMinutes: 6,
      notes: "借地期限: 2098年7月31日。阪急阪神不動産分譲。東武東上線最寄り。",
    });
    const srcGeo = "https://manmani.net/?p=52584";
    // 残72年 = 2098-2026
    await insertNewConst("ジオ板橋大山", propGeo, 2026, 5990, 68.42, 1, 72, srcGeo);
    await insertNewConst("ジオ板橋大山", propGeo, 2026, 7090, 70.86, 5, 72, srcGeo);
    await insertNewConst("ジオ板橋大山", propGeo, 2026, 7890, 78.96, 3, 72, srcGeo);
    await insertNewConst("ジオ板橋大山", propGeo, 2026, 9990, 87.85, 9, 72, srcGeo);
    await insertNewConst("ジオ板橋大山", propGeo, 2026, 4990, 56.10, 1, 72, srcGeo);
    // 2026年現在も新築販売中（中古売り出しなし）

    // ──────────────────────────────────────────────────────────────────
    // T3A-5: ブリリアタワー大崎（品川区, 竣工2007, 借地〜2078年）
    // ──────────────────────────────────────────────────────────────────
    const propBrilliaOsaki = await ensureProperty({
      name: "ブリリアタワー大崎",
      ward: "品川区",
      address: "東京都品川区大崎1丁目",
      leaseStartYear: 2007, leaseTotalYears: 71,
      buildingYear: 2007, totalUnits: 238,
      nearestStation: "大崎", walkMinutes: 4,
      notes: "借地期限: 2078年11月。東京建物分譲。JR山手線等最寄り。新築坪単価約450万円。",
    });
    // 新築時: 坪単価約450万円（平均）→ 70m²の代表住戸で推定
    // pricePerSqm=450/3.30578=136, price=136*70=9520万
    await insertNewConst("ブリリアタワー大崎", propBrilliaOsaki, 2007, 9520, 70.00, undefined, 71,
      "https://emoto.tokyo/journal/brilliatower-ohsaki");
    // listing（残52年 = 2078-2026）
    await insertListing("ブリリアタワー大崎", propBrilliaOsaki, 15080, 81.01, 24, 52, 2026,
      "https://suumo.jp/ms/chuko/tokyo/sc_shinagawa/nc_20636708/");

    // ──────────────────────────────────────────────────────────────────
    // T3A-6: ザ・パークハウス市谷加賀町レジデンス（新宿区, 竣工2021, 借地〜2091年）
    // ──────────────────────────────────────────────────────────────────
    const propIchigaya = await ensureProperty({
      name: "ザ・パークハウス市谷加賀町レジデンス",
      ward: "新宿区",
      address: "東京都新宿区市谷加賀町1丁目",
      leaseStartYear: 2021, leaseTotalYears: 70,
      buildingYear: 2021, totalUnits: 228,
      nearestStation: "牛込柳町", walkMinutes: 6,
      notes: "借地期限: 2091年11月1日。三菱地所レジデンス分譲。都営大江戸線最寄り。新築坪単価370〜480万円。",
    });
    const srcIchi = "https://manmani.net/?p=30171";
    // 残70年 = 2091-2021
    await insertNewConst("パークハウス市谷加賀町", propIchigaya, 2021, 8000, 66.00, 4, 70, srcIchi);
    await insertNewConst("パークハウス市谷加賀町", propIchigaya, 2021, 10000, 70.75, 6, 70, srcIchi);
    await insertNewConst("パークハウス市谷加賀町", propIchigaya, 2021, 16000, 110.08, 8, 70, srcIchi);
    // listings（残65年 = 2091-2026）
    await insertListing("パークハウス市谷加賀町", propIchigaya, 11980, 60.37, 3, 65, 2026, "https://suumo.jp/ms/chuko/tokyo/sc_shinjuku/nc_20774395/");
    await insertListing("パークハウス市谷加賀町", propIchigaya, 12800, 66.00, undefined, 65, 2026, "https://suumo.jp/ms/chuko/tokyo/sc_shinjuku/nc_20650693/");
    await insertListing("パークハウス市谷加賀町", propIchigaya, 14480, 77.55, undefined, 65, 2026, "https://suumo.jp/ms/chuko/tokyo/sc_shinjuku/nc_20570820/");

    // ──────────────────────────────────────────────────────────────────
    // T3A-7: ブリリアタワー品川シーサイド（品川区, 竣工2006, 借地〜2057年）
    // ──────────────────────────────────────────────────────────────────
    const propBrilliaSS = await ensureProperty({
      name: "ブリリアタワー品川シーサイド",
      ward: "品川区",
      address: "東京都品川区東品川4丁目13-24",
      leaseStartYear: 2004, leaseTotalYears: 53,
      buildingYear: 2006, totalUnits: 187,
      nearestStation: "品川シーサイド", walkMinutes: 2,
      notes: "借地期限: 2057年5月17日。東京建物分譲。りんかい線最寄り。残存期間短め。",
    });
    // 2011年二次流通事例（新築後の最古公開データ）、残46年 = 2057-2011
    await insertListing("ブリリアタワー品川シーサイド", propBrilliaSS, 3450, 58.90, 16, 46, 2011,
      "https://mansion-madori.com/blog-entry-173.html");
    // 2026年現在の売り出し（残31年 = 2057-2026）
    const ssListings: [number, number, string][] = [
      [5180, 58.85, "https://suumo.jp/ms/chuko/tokyo/sc_shinagawa/nc_20848292/"],
      [5180, 58.85, "https://suumo.jp/ms/chuko/tokyo/sc_shinagawa/nc_20774369/"],
      [5900, 60.76, "https://suumo.jp/ms/chuko/tokyo/sc_shinagawa/nc_20726165/"],
      // ※ 9800万の2件は権利金（前払い地代）込みのため除外
    ];
    for (const [p, a, s] of ssListings) await insertListing("ブリリアタワー品川シーサイド", propBrilliaSS, p, a, undefined, 31, 2026, s);

    // ──────────────────────────────────────────────────────────────────
    // T3A-8: パークタワー西新宿エムズポート（新宿区, 竣工2014, 借地〜2084年）
    // ──────────────────────────────────────────────────────────────────
    const propPTW = await ensureProperty({
      name: "パークタワー西新宿エムズポート",
      ward: "新宿区",
      address: "東京都新宿区西新宿8丁目14-27",
      leaseStartYear: 2014, leaseTotalYears: 70,
      buildingYear: 2014, totalUnits: 179,
      nearestStation: "西新宿", walkMinutes: 3,
      notes: "借地期限: 2084年11月29日。三井不動産レジデンシャル分譲。東京メトロ丸ノ内線最寄り。新築坪単価442万円。",
    });
    // 新築: 坪単価442万円 → 70m²代表住戸で推定
    // pricePerSqm=442/3.30578=133.7, price=133.7*70=9359万
    await insertNewConst("パークタワー西新宿エムズポート", propPTW, 2013, 9360, 70.00, undefined, 70,
      "https://www.mansion-review.jp/mansion/535634.html");
    // listings（残58年 = 2084-2026）
    const ptwListings: [number, number, number | undefined, string][] = [
      [7480, 38.51, 13, "https://suumo.jp/ms/chuko/tokyo/sc_shinjuku/nc_20076755/"],
      [10480, 57.34, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_shinjuku/nc_20543722/"],
      [16500, 74.64, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_shinjuku/nc_20697075/"],
      [16500, 74.64, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_shinjuku/nc_20695502/"],
      [16500, 74.64, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_shinjuku/nc_20718709/"],
      [16500, 74.64, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_shinjuku/nc_20631916/"],
    ];
    for (const [p, a, f, s] of ptwListings) await insertListing("パークタワー西新宿エムズポート", propPTW, p, a, f, 58, 2026, s);

    // ──────────────────────────────────────────────────────────────────
    // T3A-9: 麻布台パークハウス（港区, 竣工2010, 借地〜2062年）
    // ──────────────────────────────────────────────────────────────────
    const propAzabudai = await ensureProperty({
      name: "麻布台パークハウス",
      ward: "港区",
      address: "東京都港区麻布台2丁目1-2",
      leaseStartYear: 2010, leaseTotalYears: 52,
      buildingYear: 2010, totalUnits: 165,
      nearestStation: "麻布十番", walkMinutes: 6,
      notes: "借地期限: 2062年3月10日。三菱地所分譲。都営大江戸線・東京メトロ南北線最寄り。新築坪単価約561万円。",
    });
    // 新築: 坪単価561万円 → 70m²代表住戸で推定
    // pricePerSqm=561/3.30578=169.8, price=169.8*70=11886万 → 11900万
    await insertNewConst("麻布台パークハウス", propAzabudai, 2010, 11900, 70.00, undefined, 52,
      "https://mansion-market.com/mansions/detail/1400");
    // listings（残36年 = 2062-2026）
    const azListings: [number, number, number | undefined, string][] = [
      [16500, 45.44, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_minato/nc_78967548/"],
      [21980, 62.01, 6, "https://suumo.jp/ms/chuko/tokyo/sc_minato/nc_20279309/"],
      [21980, 62.01, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_minato/nc_76964109/"],
      [35200, 84.30, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_minato/nc_20538703/"],
      [36800, 88.38, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_minato/nc_78965100/"],
      [38000, 94.68, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_minato/nc_20759526/"],
      [46500, 126.31, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_minato/nc_20751710/"],
      [46500, 126.31, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_minato/nc_78328154/"],
      [49800, 129.71, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_minato/nc_78435961/"],
      [49800, 129.71, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_minato/nc_78441610/"],
      [54800, 119.63, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_minato/nc_20766821/"],
      [55500, 126.82, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_minato/nc_20625942/"],
      [75800, 163.35, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_minato/nc_20617409/"],
    ];
    for (const [p, a, f, s] of azListings) await insertListing("麻布台パークハウス", propAzabudai, p, a, f, 36, 2026, s);

    // ──────────────────────────────────────────────────────────────────
    // T3A-10: 桜プレイス（豊島区, 竣工2012, 借地〜2062年）
    // ──────────────────────────────────────────────────────────────────
    const propSakura = await ensureProperty({
      name: "桜プレイス",
      ward: "豊島区",
      address: "東京都豊島区高田2丁目4-22",
      leaseStartYear: 2012, leaseTotalYears: 50,
      buildingYear: 2012, totalUnits: 149,
      nearestStation: "学習院下", walkMinutes: 3,
      notes: "借地期限: 2062年6月〜8月頃。鹿島建設設計・施工。都電荒川線最寄り。新築坪単価約248万円。",
    });
    // 新築: 坪単価248万円 → 70m²代表住戸で推定
    // pricePerSqm=248/3.30578=75.0, price=75.0*70=5250万
    await insertNewConst("桜プレイス", propSakura, 2012, 5250, 70.00, undefined, 50,
      "https://mansion-market.com/mansions/detail/9618");
    // listings（残36年 = 2062-2026）
    const sakuraListings: [number, number, number | undefined, string][] = [
      [7980, 86.94, 3, "https://suumo.jp/ms/chuko/tokyo/sc_toshima/nc_78737098/"],
      [8800, 86.94, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_toshima/nc_20661532/"],
      [8800, 86.94, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_toshima/nc_20726617/"],
      [8800, 86.94, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_toshima/nc_20601929/"],
      [8800, 86.94, undefined, "https://suumo.jp/ms/chuko/tokyo/sc_toshima/nc_20657156/"],
    ];
    for (const [p, a, f, s] of sakuraListings) await insertListing("桜プレイス", propSakura, p, a, f, 36, 2026, s);

    return results;
  },
});

// Tier3B物件（10件）の物件マスタ + 新築価格 + SUUMO売り出し価格データ登録（2026年5月調査）
export const seedTier3B = internalMutation({
  args: {},
  handler: async (ctx) => {
    const results: string[] = [];

    const ensureProperty = async (prop: {
      name: string; ward: string; address: string;
      leaseStartYear: number; leaseTotalYears: number; buildingYear: number;
      totalUnits: number; nearestStation?: string; walkMinutes?: number; notes?: string;
    }) => {
      const existing = await ctx.db
        .query("properties")
        .withSearchIndex("search_name", (q) => q.search("name", prop.name))
        .collect();
      const exact = existing.find((p) => p.name === prop.name);
      if (exact) { results.push(`SKIP property: ${prop.name}（既存）`); return exact._id as string; }
      const id = await ctx.db.insert("properties", prop);
      results.push(`OK property: ${prop.name}`);
      return id as string;
    };

    const insertListing = async (
      propertyName: string, propertyId: string,
      price: number, areaSqm: number, floor: number | undefined,
      remainingLeaseYears: number, transactionYear: number, source: string,
    ) => {
      const existing = await ctx.db.query("transactions")
        .withIndex("by_property", (q) => q.eq("propertyId", propertyId as never))
        .filter((q) => q.and(q.eq(q.field("source"), source), q.eq(q.field("priceType"), "listing")))
        .first();
      if (existing) { results.push(`SKIP listing: ${propertyName} ${price}万`); return; }
      const pricePerSqm = Math.round(price / areaSqm * 100) / 100;
      const data: Record<string, unknown> = {
        propertyId: propertyId as never,
        transactionYearQ: `${transactionYear}Q2`, transactionYear,
        price, areaSqm, remainingLeaseYears, pricePerSqm,
        isNewConstruction: false, priceType: "listing", source,
      };
      if (floor !== undefined) data.floor = floor;
      await ctx.db.insert("transactions", data as never);
      results.push(`OK listing: ${propertyName} ${price}万（${areaSqm}m², 残${remainingLeaseYears}年）`);
    };

    const insertNewConst = async (
      propertyName: string, propertyId: string,
      transactionYear: number, price: number, areaSqm: number,
      floor: number | undefined, remainingLeaseYears: number, source: string,
    ) => {
      const existing = await ctx.db.query("transactions")
        .withIndex("by_property", (q) => q.eq("propertyId", propertyId as never))
        .filter((q) => q.and(
          q.eq(q.field("priceType"), "new_construction"),
          q.eq(q.field("price"), price),
          q.eq(q.field("areaSqm"), areaSqm),
        ))
        .first();
      if (existing) { results.push(`SKIP nc: ${propertyName} ${price}万`); return; }
      const pricePerSqm = Math.round(price / areaSqm * 100) / 100;
      const data: Record<string, unknown> = {
        propertyId: propertyId as never,
        transactionYearQ: `${transactionYear}Q1`, transactionYear,
        price, areaSqm, remainingLeaseYears, pricePerSqm,
        isNewConstruction: true, priceType: "new_construction", source,
      };
      if (floor !== undefined) data.floor = floor;
      await ctx.db.insert("transactions", data as never);
      results.push(`OK nc: ${propertyName} ${price}万（${areaSqm}m², 残${remainingLeaseYears}年）`);
    };

    // ──────────────────────────────────────────────────────────────────
    // T3B-1: プラウド南麻布（港区, 竣工2013, 借地〜2073年）
    // ──────────────────────────────────────────────────────────────────
    const propProudMinami = await ensureProperty({
      name: "プラウド南麻布",
      ward: "港区",
      address: "東京都港区南麻布4丁目",
      leaseStartYear: 2013, leaseTotalYears: 60,
      buildingYear: 2013, totalUnits: 88,
      nearestStation: "広尾", walkMinutes: 7,
      notes: "借地期限: 2073年12月。野村不動産・三井物産分譲。旧フランス大使館跡地。新築坪単価約422万円。",
    });
    // 新築: 平均坪単価422万円 → 76m²代表住戸
    // pricePerSqm=422/3.30578=127.7, price=127.7*76.01=9706万 → 9700万
    await insertNewConst("プラウド南麻布", propProudMinami, 2012, 9700, 76.01, undefined, 61,
      "https://www.ienojikan.com/house/mansion/20120926.html");
    // listings（残47年 = 2073-2026）
    await insertListing("プラウド南麻布", propProudMinami, 26800, 77.52, 3, 47, 2026,
      "https://suumo.jp/ms/chuko/tokyo/sc_minato/nc_76705391/");

    // ──────────────────────────────────────────────────────────────────
    // T3B-2: グランスイート三軒茶屋スカイテラス（世田谷区, 竣工2014, 借地〜2064年）
    // ──────────────────────────────────────────────────────────────────
    const propGrandSuite = await ensureProperty({
      name: "グランスイート三軒茶屋スカイテラス",
      ward: "世田谷区",
      address: "東京都世田谷区上馬1丁目",
      leaseStartYear: 2014, leaseTotalYears: 50,
      buildingYear: 2014, totalUnits: 52,
      nearestStation: "駒沢大学", walkMinutes: 8,
      notes: "借地期限: 2064年4月。丸紅分譲。地代月額5,060円（3年毎改定）。長谷工施工。",
    });
    // 新築価格: 公開データなし
    // listings（残38年 = 2064-2026）
    await insertListing("グランスイート三軒茶屋スカイテラス", propGrandSuite, 9999, 54.74, undefined, 38, 2026,
      "https://suumo.jp/library/tf_13/sc_13112/to_1001859682/");
    await insertListing("グランスイート三軒茶屋スカイテラス", propGrandSuite, 7480, 54.74, undefined, 38, 2026,
      "https://suumo.jp/ms/chuko/tokyo/sc_setagaya/nc_75545755/");
    await insertListing("グランスイート三軒茶屋スカイテラス", propGrandSuite, 7680, 54.74, undefined, 38, 2026,
      "https://suumo.jp/ms/chuko/tokyo/sc_setagaya/nc_76181474/");

    // ──────────────────────────────────────────────────────────────────
    // T3B-3: レ・ジェイドクロス千代田神保町（千代田区, 竣工2021, 借地〜2095年）
    // ──────────────────────────────────────────────────────────────────
    const propJade = await ensureProperty({
      name: "レ・ジェイドクロス千代田神保町",
      ward: "千代田区",
      address: "東京都千代田区西神田2丁目",
      leaseStartYear: 2022, leaseTotalYears: 73,
      buildingYear: 2021, totalUnits: 50,
      nearestStation: "神保町", walkMinutes: 4,
      notes: "借地期限: 2095年5月16日。日本エスコン分譲。旧東方学会本館を保存・継承。新築坪単価平均611万円。",
    });
    // 新築: 平均坪単価611万円 → 65m²代表住戸（残73年 = 2095-2022）
    // pricePerSqm=611/3.30578=184.8, price=184.8*65=12012万 → 12000万
    await insertNewConst("レ・ジェイドクロス千代田神保町", propJade, 2022, 12000, 65.00, undefined, 73,
      "https://sumai.es-conjapan.co.jp/jimbocho30/asset/index.html");
    // listing（残69年 = 2095-2026）
    await insertListing("レ・ジェイドクロス千代田神保町", propJade, 24000, 86.87, undefined, 69, 2026,
      "https://suumo.jp/library/tf_13/sc_13101/to_1002488374/");

    // ──────────────────────────────────────────────────────────────────
    // T3B-4: パークホームズ落合南長崎（豊島区, 竣工2017, 借地〜2089年）
    // ──────────────────────────────────────────────────────────────────
    const propOchiai = await ensureProperty({
      name: "パークホームズ落合南長崎",
      ward: "豊島区",
      address: "東京都豊島区南長崎2丁目",
      leaseStartYear: 2019, leaseTotalYears: 70,
      buildingYear: 2017, totalUnits: 41,
      nearestStation: "落合南長崎", walkMinutes: 9,
      notes: "借地期限: 2089年1月。三井不動産レジデンシャル分譲。地主: NTT。都営大江戸線最寄り。",
    });
    // 新築（残72年 = 2089-2017）: 坪単価256〜296万円/坪
    // Lタイプ1F 4700万 280万/坪: pricePerSqm=280/3.30578=84.7, areaSqm=4700/84.7=55.5
    await insertNewConst("パークホームズ落合南長崎", propOchiai, 2017, 4700, 55.50, 1, 72,
      "https://manmani.net/?p=8561");
    // Hタイプ1F 5500万 256万/坪: pricePerSqm=256/3.30578=77.5, areaSqm=5500/77.5=71.0
    await insertNewConst("パークホームズ落合南長崎", propOchiai, 2017, 5500, 71.00, 1, 72,
      "https://manmani.net/?p=8561");
    // Fタイプ5F 6100万 296万/坪: pricePerSqm=296/3.30578=89.6, areaSqm=6100/89.6=68.1
    await insertNewConst("パークホームズ落合南長崎", propOchiai, 2017, 6100, 68.10, 5, 72,
      "https://manmani.net/?p=8561");
    // listing（残63年 = 2089-2026）
    await insertListing("パークホームズ落合南長崎", propOchiai, 7980, 70.00, undefined, 63, 2026,
      "https://suumo.jp/ms/chuko/tokyo/sc_toshima/nc_77770804/");

    // ──────────────────────────────────────────────────────────────────
    // T3B-5: サンクタスガーデン目黒（目黒区, 竣工2004, 借地〜2054年）
    // ──────────────────────────────────────────────────────────────────
    const propSanctusM = await ensureProperty({
      name: "サンクタスガーデン目黒",
      ward: "目黒区",
      address: "東京都目黒区目黒2丁目13-32",
      leaseStartYear: 2004, leaseTotalYears: 50,
      buildingYear: 2004, totalUnits: 43,
      nearestStation: "目黒", walkMinutes: 12,
      notes: "借地期限: 2054年4月。ダイナセル・オリックスリアルエステート分譲。大林組施工。残存年数短め。",
    });
    // 新築価格: 公開データなし
    // listings（残28年 = 2054-2026）
    // areaSqm for 6580万: pricePerSqm=85.5 → areaSqm=6580/85.5=76.96
    await insertListing("サンクタスガーデン目黒", propSanctusM, 6580, 76.96, undefined, 28, 2026,
      "https://suumo.jp/ms/chuko/tokyo/sc_meguro/nc_20337905/");
    await insertListing("サンクタスガーデン目黒", propSanctusM, 7299, 78.38, undefined, 28, 2026,
      "https://suumo.jp/ms/chuko/tokyo/sc_meguro/nc_75285131/");

    // ──────────────────────────────────────────────────────────────────
    // T3B-6: ウエリス渋谷本町（渋谷区, 竣工2016, 借地〜2087年）
    // ──────────────────────────────────────────────────────────────────
    const propUelis = await ensureProperty({
      name: "ウエリス渋谷本町",
      ward: "渋谷区",
      address: "東京都渋谷区本町4丁目",
      leaseStartYear: 2016, leaseTotalYears: 71,
      buildingYear: 2016, totalUnits: 33,
      nearestStation: "西新宿五丁目", walkMinutes: 8,
      notes: "借地期限: 2087年1月31日。NTT都市開発分譲。地主: NTT。都営大江戸線最寄り。",
    });
    // 新築（残71年 = 2087-2016）: 11階56㎡ 5090万 坪単価301万円
    await insertNewConst("ウエリス渋谷本町", propUelis, 2016, 5090, 56.04, 11, 71,
      "https://manmani.net/?p=1348");
    // listings（残61年 = 2087-2026）: areaSqm推定50m²（34.90〜56.04m²レンジの中央値）
    await insertListing("ウエリス渋谷本町", propUelis, 6490, 50.00, undefined, 61, 2026,
      "https://suumo.jp/ms/chuko/tokyo/sc_shibuya/nc_75731331/");
    await insertListing("ウエリス渋谷本町", propUelis, 6277, 50.00, undefined, 61, 2026,
      "https://suumo.jp/ms/chuko/tokyo/sc_shibuya/nc_77487895/");

    // ──────────────────────────────────────────────────────────────────
    // T3B-7: プラウド神田駿河台（千代田区, 竣工2021, 借地〜2083年）
    // ──────────────────────────────────────────────────────────────────
    const propProudSurugadai = await ensureProperty({
      name: "プラウド神田駿河台",
      ward: "千代田区",
      address: "東京都千代田区神田駿河台",
      leaseStartYear: 2021, leaseTotalYears: 62,
      buildingYear: 2021, totalUnits: 36,
      nearestStation: "御茶ノ水", walkMinutes: 5,
      notes: "借地期限: 2083年3月末。野村不動産分譲。竹中工務店施工。木造ハイブリッド高層。御茶ノ水駅徒歩5分。",
    });
    // 新築（残62年 = 2083-2021）: manmani.net データより
    // Cタイプ52.62㎡ 各階: pricePerTsubo=545/565/586/609万円/坪
    const surugadaiSrc = "https://manmani.net/?p=32421";
    // 2F: pricePerSqm=545/3.30578=164.9, price=164.9*52.62=8675→8700
    await insertNewConst("プラウド神田駿河台", propProudSurugadai, 2021, 8700, 52.62, 2, 62, surugadaiSrc);
    // 4F: pricePerSqm=565/3.30578=170.9, price=170.9*52.62=8991→9000
    await insertNewConst("プラウド神田駿河台", propProudSurugadai, 2021, 9000, 52.62, 4, 62, surugadaiSrc);
    // 8F: pricePerSqm=586/3.30578=177.3, price=177.3*52.62=9326→9300
    await insertNewConst("プラウド神田駿河台", propProudSurugadai, 2021, 9300, 52.62, 8, 62, surugadaiSrc);
    // 10F: pricePerSqm=609/3.30578=184.2, price=184.2*52.62=9692→9700
    await insertNewConst("プラウド神田駿河台", propProudSurugadai, 2021, 9700, 52.62, 10, 62, surugadaiSrc);
    // Dタイプ79.66㎡:
    // 12F: pricePerSqm=655/3.30578=198.1, price=198.1*79.66=15782→15800
    await insertNewConst("プラウド神田駿河台", propProudSurugadai, 2021, 15800, 79.66, 12, 62, surugadaiSrc);
    // 14F: pricePerSqm=697/3.30578=210.8, price=210.8*79.66=16792→16800
    await insertNewConst("プラウド神田駿河台", propProudSurugadai, 2021, 16800, 79.66, 14, 62, surugadaiSrc);
    // listing（残57年 = 2083-2026）
    await insertListing("プラウド神田駿河台", propProudSurugadai, 14580, 52.62, undefined, 57, 2026,
      "https://suumo.jp/ms/chuko/tokyo/sc_chiyoda/nc_78616027/");

    // ──────────────────────────────────────────────────────────────────
    // T3B-8: リーベスト桜新町（世田谷区, 竣工2001, 借地〜2056年）
    // ──────────────────────────────────────────────────────────────────
    const propLiebest = await ensureProperty({
      name: "リーベスト桜新町",
      ward: "世田谷区",
      address: "東京都世田谷区弦巻3丁目21-6",
      leaseStartYear: 2001, leaseTotalYears: 55,
      buildingYear: 2001, totalUnits: 37,
      nearestStation: "桜新町", walkMinutes: 11,
      notes: "借地期限: 2056年3月31日。住友石炭鉱業分譲。東急田園都市線最寄り。残存約30年。",
    });
    // 新築価格: 公開データなし
    // listings（残30年 = 2056-2026）
    await insertListing("リーベスト桜新町", propLiebest, 7990, 105.65, 6, 30, 2026,
      "https://suumo.jp/ms/chuko/tokyo/sc_setagaya/nc_76497859/");
    await insertListing("リーベスト桜新町", propLiebest, 4099, 59.52, undefined, 30, 2026,
      "https://suumo.jp/ms/chuko/tokyo/sc_setagaya/nc_20101791/");

    // ──────────────────────────────────────────────────────────────────
    // T3B-9: サンクタスガーデン砧（世田谷区, 竣工2005, 借地〜2056年）
    // ──────────────────────────────────────────────────────────────────
    const propSanctusK = await ensureProperty({
      name: "サンクタスガーデン砧",
      ward: "世田谷区",
      address: "東京都世田谷区砧2丁目",
      leaseStartYear: 2005, leaseTotalYears: 51,
      buildingYear: 2005, totalUnits: 34,
      nearestStation: "千歳船橋", walkMinutes: 11,
      notes: "借地期限: 2056年3月8日。オリックス・リアルエステート分譲。東急コミュニティー管理。残存約30年。",
    });
    // 新築価格: 公開データなし
    // listings（残30年 = 2056-2026）
    await insertListing("サンクタスガーデン砧", propSanctusK, 4100, 70.00, undefined, 30, 2026,
      "https://suumo.jp/ms/chuko/tokyo/sc_setagaya/nc_74780237/");
    await insertListing("サンクタスガーデン砧", propSanctusK, 5100, 80.00, undefined, 30, 2025,
      "https://t23m-navi.jp/indexes/d/4652 (上層階3LDK)");
    await insertListing("サンクタスガーデン砧", propSanctusK, 5300, 80.00, undefined, 30, 2025,
      "https://t23m-navi.jp/indexes/d/4652 (中層階3LDK)");

    // ──────────────────────────────────────────────────────────────────
    // T3B-10: Brillia大島 Green Avenue（江東区, 竣工2024, 借地〜2095年）
    // ──────────────────────────────────────────────────────────────────
    const propBrilliaGreen = await ensureProperty({
      name: "Brillia大島 Green Avenue",
      ward: "江東区",
      address: "東京都江東区北砂5丁目",
      leaseStartYear: 2022, leaseTotalYears: 73,
      buildingYear: 2024, totalUnits: 64,
      nearestStation: "大島", walkMinutes: 9,
      notes: "借地期限: 2095年1月31日。東京建物分譲。都営新宿線最寄り。入居2025年1月。",
    });
    // 新築（第1期 2022〜2023年販売）: 坪単価268〜284万円/坪
    // areaSqm=70.29, 268万/坪: pricePerSqm=81.07, price=81.07*70.29=5699→5700, 残73年=2095-2022
    await insertNewConst("Brillia大島 Green Avenue", propBrilliaGreen, 2022, 5700, 70.29, undefined, 73,
      "https://manmani.net/?p=51200");
    // areaSqm=70.29, 284万/坪: pricePerSqm=85.91, price=85.91*70.29=6039→6040, 残72年=2095-2023
    await insertNewConst("Brillia大島 Green Avenue", propBrilliaGreen, 2023, 6040, 70.29, undefined, 72,
      "https://manmani.net/?p=51200");
    // 中古流通なし（入居2025年1月の新物件）

    return results;
  },
});

// Tier2物件の新築価格 + SUUMO売り出し価格データ登録（2026年5月調査）
export const seedTier2 = internalMutation({
  args: {},
  handler: async (ctx) => {
    // ─── 新築価格（STEP1）───────────────────────────────────────────
    const newPrices = [
      {
        // 銀座タワー: 分譲時坪単価約252万（成約履歴から逆算）
        propertyId: "j97cc0e4ajz179x3qwzd2a2gy586zm2h",
        propertyName: "銀座タワー",
        transactionYear: 2003, q: 2,
        price: 5640, areaSqm: 74, pricePerSqm: 76.2,
        remainingLeaseYears: 50, // 2053-2003
        source: "https://mansion-market.com/mansions/detail/251",
      },
      {
        // パークコート神楽坂: 2009年11月販売開始 坪単価346〜350万
        propertyId: "j977znsqegt1qxbq9h1z4x7sg186zjek",
        propertyName: "パークコート神楽坂",
        transactionYear: 2009, q: 4,
        price: 8260, areaSqm: 79, pricePerSqm: 104.6,
        remainingLeaseYears: 74, // 2083-2009
        source: "https://www.mitsuifudosan.co.jp/corporate/news/2009/1104_01/",
      },
      {
        // パークホームズ月島二丁目: 2019年 最多6,000万台 坪単価約345万
        propertyId: "j975m61wenq27kbz00qj1er9qd86yvf9",
        propertyName: "パークホームズ月島二丁目",
        transactionYear: 2019, q: 2,
        price: 6500, areaSqm: 62, pricePerSqm: 104.8,
        remainingLeaseYears: 50, // 2069-2019
        source: "https://manmani.net/?p=29754",
      },
      {
        // パークコート三番町ハウス: 2025年第3期 坪単価約1,075万
        propertyId: "j9796wxjyxxcyynmyxhecjeved86z6v6",
        propertyName: "パークコート ザ・三番町ハウス",
        transactionYear: 2025, q: 3,
        price: 19000, areaSqm: 57, pricePerSqm: 333.3,
        remainingLeaseYears: 72, // 2097-2025
        source: "https://manmani.net/?p=58703",
      },
    ];

    // ─── SUUMO売り出し価格（STEP2）──────────────────────────────────
    const listings = [
      // 銀座タワー（残27年 = 2053-2026）
      { propertyName: "銀座タワー", propertyId: "j97cc0e4ajz179x3qwzd2a2gy586zm2h",
        price: 11480, areaSqm: 73.81, floor: 7,
        pricePerSqm: Math.round(11480 / 73.81 * 10) / 10, remainingLeaseYears: 27,
        source: "https://suumo.jp/ms/chuko/tokyo/sc_chuo/nc_78661771/" },
      { propertyName: "銀座タワー", propertyId: "j97cc0e4ajz179x3qwzd2a2gy586zm2h",
        price: 15000, areaSqm: 94.14, floor: 20,
        pricePerSqm: Math.round(15000 / 94.14 * 10) / 10, remainingLeaseYears: 27,
        source: "https://sumikae.ttfuhan.co.jp/mansion/TAP250001/" },
      // パークコート神楽坂（残57年 = 2083-2026）
      { propertyName: "パークコート神楽坂", propertyId: "j977znsqegt1qxbq9h1z4x7sg186zjek",
        price: 20480, areaSqm: 85.97, floor: 4,
        pricePerSqm: Math.round(20480 / 85.97 * 10) / 10, remainingLeaseYears: 57,
        source: "https://suumo.jp/ms/chuko/tokyo/sc_shinjuku/nc_76325368/" },
      { propertyName: "パークコート神楽坂", propertyId: "j977znsqegt1qxbq9h1z4x7sg186zjek",
        price: 26980, areaSqm: 93.96, floor: 3,
        pricePerSqm: Math.round(26980 / 93.96 * 10) / 10, remainingLeaseYears: 57,
        source: "https://suumo.jp/ms/chuko/tokyo/sc_shinjuku/nc_77423545/" },
      // パークホームズ月島二丁目（残43年 = 2069-2026）
      { propertyName: "パークホームズ月島二丁目", propertyId: "j975m61wenq27kbz00qj1er9qd86yvf9",
        price: 9280, areaSqm: 54.66, floor: 3,
        pricePerSqm: Math.round(9280 / 54.66 * 10) / 10, remainingLeaseYears: 43,
        source: "https://suumo.jp/ms/chuko/tokyo/sc_chuo/nc_20503947/" },
      { propertyName: "パークホームズ月島二丁目", propertyId: "j975m61wenq27kbz00qj1er9qd86yvf9",
        price: 11200, areaSqm: 68.57, floor: 4,
        pricePerSqm: Math.round(11200 / 68.57 * 10) / 10, remainingLeaseYears: 43,
        source: "https://suumo.jp/ms/chuko/tokyo/sc_chuo/nc_20436177/" },
    ];

    const results: string[] = [];

    for (const nc of newPrices) {
      const existing = await ctx.db
        .query("transactions")
        .withIndex("by_property", (q) => q.eq("propertyId", nc.propertyId as never))
        .filter((q) =>
          q.and(
            q.eq(q.field("transactionYear"), nc.transactionYear),
            q.eq(q.field("priceType"), "new_construction"),
          )
        )
        .first();
      if (existing) { results.push(`SKIP nc: ${nc.propertyName}（既存）`); continue; }
      await ctx.db.insert("transactions", {
        propertyId: nc.propertyId as never,
        transactionYearQ: `${nc.transactionYear}Q${nc.q}`,
        transactionYear: nc.transactionYear,
        price: nc.price, areaSqm: nc.areaSqm, remainingLeaseYears: nc.remainingLeaseYears,
        pricePerSqm: nc.pricePerSqm, isNewConstruction: true, priceType: "new_construction",
        source: nc.source,
      });
      results.push(`OK nc: ${nc.propertyName} ${nc.price}万（${nc.areaSqm}m², 残${nc.remainingLeaseYears}年）`);
    }

    for (const l of listings) {
      const existing = await ctx.db
        .query("transactions")
        .withIndex("by_property", (q) => q.eq("propertyId", l.propertyId as never))
        .filter((q) =>
          q.and(q.eq(q.field("source"), l.source), q.eq(q.field("priceType"), "listing"))
        )
        .first();
      if (existing) { results.push(`SKIP listing: ${l.propertyName} ${l.price}万（既存）`); continue; }
      await ctx.db.insert("transactions", {
        propertyId: l.propertyId as never,
        transactionYearQ: "2026Q2", transactionYear: 2026,
        price: l.price, areaSqm: l.areaSqm, floor: l.floor,
        remainingLeaseYears: l.remainingLeaseYears, pricePerSqm: l.pricePerSqm,
        isNewConstruction: false, priceType: "listing", source: l.source,
      });
      results.push(`OK listing: ${l.propertyName} ${l.price}万（${l.areaSqm}m², 残${l.remainingLeaseYears}年）`);
    }
    return results;
  },
});
