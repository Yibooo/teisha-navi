import { SimulatorForm } from "@/components/simulator/SimulatorForm";

export const metadata = {
  title: "将来価値シミュレーター｜定借ナビ",
  description:
    "購入価格・残存年数・居住予定年数を入力するだけで、売却時の予測価格と最適な売り時を確認できます。",
};

export default function SimulatorPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          将来価値シミュレーター
        </h1>
        <p className="text-slate-600">
          購入価格・現在の残存年数・居住予定年数を入力すると、
          売却時の予測価格と価格変動率を過去の取引データに基づいて算出します。
        </p>
      </div>
      <SimulatorForm />
    </div>
  );
}
