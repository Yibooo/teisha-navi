import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const TOKYO_23_WARDS: Record<string, string> = {
  "13101": "千代田区", "13102": "中央区", "13103": "港区",
  "13104": "新宿区", "13105": "文京区", "13106": "台東区",
  "13107": "墨田区", "13108": "江東区", "13109": "品川区",
  "13110": "目黒区", "13111": "大田区", "13112": "世田谷区",
  "13113": "渋谷区", "13114": "中野区", "13115": "杉並区",
  "13116": "豊島区", "13117": "北区",  "13118": "荒川区",
  "13119": "板橋区", "13120": "練馬区", "13121": "足立区",
  "13122": "葛飾区", "13123": "江戸川区",
};

type MlitRecord = {
  Type: string;
  LandRight: string;
  TradePrice: string;
  Area: string;
  BuildingYear: string;
  Period: string;
  NearestStation: string;
  MunicipalityCode: string;
};

export async function POST(req: NextRequest) {
  const { fromQuarter, toQuarter } = await req.json();

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

  // 物件マスタ取得
  const properties = await convex.query(api.properties.list, {});

  const result = { total: 0, leaseholdFound: 0, imported: 0, errors: [] as string[] };

  for (const [cityCode, wardName] of Object.entries(TOKYO_23_WARDS)) {
    try {
      const url = new URL("https://www.land.mlit.go.jp/webland/api/TradeListSearch");
      url.searchParams.set("from", fromQuarter);
      url.searchParams.set("to", toQuarter);
      url.searchParams.set("city", cityCode);

      const res = await fetch(url.toString(), {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; research-bot/1.0)" },
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) { result.errors.push(`${wardName}: HTTP ${res.status}`); continue; }

      const json = await res.json();
      const records: MlitRecord[] = json.data ?? [];
      result.total += records.length;

      const leasehold = records.filter(
        (r) => r.Type === "中古マンション等" && r.LandRight?.includes("借地")
      );
      result.leaseholdFound += leasehold.length;

      for (const r of leasehold) {
        try {
          const buildingYearMatch = r.BuildingYear?.match(/(\d{4})/);
          const buildingYear = buildingYearMatch ? parseInt(buildingYearMatch[1]) : null;
          if (!buildingYear) continue;

          const periodMatch = r.Period?.match(/(\d{4})年第(\d)四半期/);
          if (!periodMatch) continue;
          const txYear = parseInt(periodMatch[1]);
          const txQ = parseInt(periodMatch[2]);

          const price = parseInt(r.TradePrice.replace(/,/g, "")) / 10000;
          const areaSqm = parseFloat(r.Area);
          if (!price || !areaSqm) continue;

          // 物件マスタと照合（区 + 建築年）
          const matched = properties.find(
            (p) => p.ward === wardName && p.buildingYear === buildingYear
          );
          if (!matched) continue;

          const leaseEndYear = matched.leaseStartYear + matched.leaseTotalYears;
          const remainingLeaseYears = leaseEndYear - txYear;
          if (remainingLeaseYears <= 0) continue;

          await convex.mutation(api.transactions.upsert, {
            propertyId: matched._id,
            transactionYearQ: `${txYear}Q${txQ}`,
            transactionYear: txYear,
            price,
            areaSqm,
            remainingLeaseYears,
            pricePerSqm: Math.round((price / areaSqm) * 10) / 10,
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
    await convex.mutation(api.analytics.rebuildCache, {});
  }

  return NextResponse.json(result);
}
