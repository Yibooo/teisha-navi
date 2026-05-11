import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

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
