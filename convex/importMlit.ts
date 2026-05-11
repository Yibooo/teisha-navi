import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// 東京23区の市区町村コード
const TOKYO_23_WARDS: Record<string, string> = {
  "13101": "千代田区",
  "13102": "中央区",
  "13103": "港区",
  "13104": "新宿区",
  "13105": "文京区",
  "13106": "台東区",
  "13107": "墨田区",
  "13108": "江東区",
  "13109": "品川区",
  "13110": "目黒区",
  "13111": "大田区",
  "13112": "世田谷区",
  "13113": "渋谷区",
  "13114": "中野区",
  "13115": "杉並区",
  "13116": "豊島区",
  "13117": "北区",
  "13118": "荒川区",
  "13119": "板橋区",
  "13120": "練馬区",
  "13121": "足立区",
  "13122": "葛飾区",
  "13123": "江戸川区",
};

type MlitRecord = {
  Type: string;
  LandRight: string;
  Prefecture: string;
  Municipality: string;
  DistrictName: string;
  TradePrice: string;
  Area: string;
  BuildingYear: string;
  Structure: string;
  Use: string;
  FloorPlan: string;
  Period: string;
  NearestStation: string;
  TimeToNearestStation: string;
  MunicipalityCode: string;
};

type ImportResult = {
  total: number;
  leaseholdFound: number;
  imported: number;
  errors: string[];
};

// 国交省 不動産取引価格情報APIから借地権マンションデータを取得・インポート
export const importFromMlit = action({
  args: {
    fromQuarter: v.string(), // 例: "20151"（2015年第1四半期）
    toQuarter: v.string(),   // 例: "20244"（2024年第4四半期）
  },
  handler: async (ctx, args): Promise<ImportResult> => {
    const result: ImportResult = {
      total: 0,
      leaseholdFound: 0,
      imported: 0,
      errors: [],
    };

    // 既存の物件マスタを取得（照合用）
    const existingProperties: Array<{ _id: string; name: string; ward: string; leaseStartYear: number; leaseTotalYears: number; buildingYear: number }> = await ctx.runQuery(api.properties.list, {});

    for (const [cityCode, wardName] of Object.entries(TOKYO_23_WARDS)) {
      try {
        const url = new URL(
          "https://www.land.mlit.go.jp/webland/api/TradeListSearch"
        );
        url.searchParams.set("from", args.fromQuarter);
        url.searchParams.set("to", args.toQuarter);
        url.searchParams.set("city", cityCode);

        const res = await fetch(url.toString());
        if (!res.ok) {
          result.errors.push(`${wardName}: HTTP ${res.status}`);
          continue;
        }

        const json = await res.json();
        const records: MlitRecord[] = json.data ?? [];
        result.total += records.length;

        // 中古マンション + 借地権フラグ でフィルタ
        const leaseholdRecords = records.filter(
          (r) =>
            r.Type === "中古マンション等" &&
            r.LandRight &&
            r.LandRight.includes("借地")
        );
        result.leaseholdFound += leaseholdRecords.length;

        for (const r of leaseholdRecords) {
          try {
            // 建築年を取得
            const buildingYearMatch = r.BuildingYear?.match(/(\d{4})/);
            const buildingYear = buildingYearMatch
              ? parseInt(buildingYearMatch[1])
              : null;
            if (!buildingYear) continue;

            // 取引時期を取得（例: "2023年第3四半期" → 2023Q3）
            const periodMatch = r.Period?.match(/(\d{4})年第(\d)四半期/);
            if (!periodMatch) continue;
            const txYear = parseInt(periodMatch[1]);
            const txQ = parseInt(periodMatch[2]);
            const transactionYearQ = `${txYear}Q${txQ}`;

            // 価格・面積
            const price = parseInt(r.TradePrice.replace(/,/g, "")) / 10000; // 円 → 万円
            const areaSqm = parseFloat(r.Area);
            if (!price || !areaSqm) continue;
            const pricePerSqm = Math.round((price / areaSqm) * 10) / 10;

            // 既存物件マスタと照合（住所・建築年ベース）
            const matched = existingProperties.find(
              (p) =>
                p.ward === wardName && p.buildingYear === buildingYear
            );
            if (!matched) continue; // マスタに登録されていない物件はスキップ

            // 残存年数計算
            const leaseEndYear = matched.leaseStartYear + matched.leaseTotalYears;
            const remainingLeaseYears = leaseEndYear - txYear;
            if (remainingLeaseYears <= 0) continue;

            // インポート
            await ctx.runMutation(api.transactions.upsert, {
              propertyId: matched._id as Parameters<typeof ctx.runMutation>[1]["propertyId"],
              transactionYearQ,
              transactionYear: txYear,
              price,
              areaSqm,
              remainingLeaseYears,
              pricePerSqm,
              isNewConstruction: false,
              source: "国土交通省不動産取引価格情報",
            });
            result.imported++;
          } catch (e) {
            result.errors.push(`レコード処理エラー: ${String(e)}`);
          }
        }
      } catch (e) {
        result.errors.push(`${wardName} APIエラー: ${String(e)}`);
      }
    }

    // キャッシュ再構築
    if (result.imported > 0) {
      await ctx.runMutation(api.analytics.rebuildCache, {});
    }

    return result;
  },
});
