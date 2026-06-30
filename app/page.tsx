import { AuthAwareLink } from "@/components/AuthAwareLink";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Hero */}
      <section className="py-10 sm:py-20 text-center">
        <Badge variant="secondary" className="mb-4">東京23区 実取引データ使用</Badge>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl mb-6 leading-tight">
          定期借地権マンションの<br />
          資産価値を<span className="text-blue-600">数値で確認</span>しよう
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          「定期借地権は損？」の疑問に、実際の取引データで答えます。
          残存年数別の価格推移グラフと将来価値シミュレーターで、
          購入・売却の意思決定を数値でサポートします。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <AuthAwareLink
            to="analytics"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            資産価値グラフを見る →
          </AuthAwareLink>
          <AuthAwareLink
            to="simulator"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-8 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            将来価値をシミュレーション
          </AuthAwareLink>
        </div>
      </section>

      {/* 解決できる2つの疑問 */}
      <section className="py-12 grid sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <div className="text-3xl mb-3">📈</div>
          <h2 className="text-lg font-bold text-slate-900 mb-3">
            ケース① 購入してから20年、価値は上がった？
          </h2>
          <p className="text-slate-600 leading-relaxed text-sm">
            70年物件を購入し20年居住、残存50年の状態での成約実績を確認。
            エリア・築年数によっては<strong className="text-slate-800">価値が上昇しているケース</strong>もデータで分かります。
          </p>
        </div>
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <div className="text-3xl mb-3">⚠️</div>
          <h2 className="text-lg font-bold text-slate-900 mb-3">
            ケース② 残存30〜40年で価値が急落する前に売るべき？
          </h2>
          <p className="text-slate-600 leading-relaxed text-sm">
            過去の取引データから、残存年数が一定水準を下回ると
            <strong className="text-slate-800">価格下落が加速する傾向</strong>が確認されています。
            売り時の判断をデータで裏付けます。
          </p>
        </div>
      </section>

      {/* 特徴 */}
      <section className="py-12">
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-10">
          定借ナビの3つの特徴
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: "🏛️",
              title: "第三者性",
              desc: "不動産会社ではなく、公的データをもとに中立的な情報を提供します。営業トークでなく数値で判断できます。",
            },
            {
              icon: "📊",
              title: "実取引データ",
              desc: "国土交通省の不動産取引価格情報をベースに、東京23区の実際の成約データを可視化しています。",
            },
            {
              icon: "🔮",
              title: "売り時シミュレーション",
              desc: "購入価格・残存年数・居住予定年数を入力するだけで、将来の予測売却価格と最適な売り時が分かります。",
            },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 sm:py-16 text-center">
        <div className="bg-blue-600 rounded-3xl px-8 py-14 text-white">
          <h2 className="text-2xl font-bold mb-4">まずはグラフで実績を確認</h2>
          <p className="text-blue-100 mb-8 max-w-md mx-auto">
            残存年数が変わると資産価値はどう変わるのか。過去の取引データを一目で確認できます。
          </p>
          <AuthAwareLink
            to="analytics"
            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-base font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            グラフを見る →
          </AuthAwareLink>
        </div>
      </section>

      {/* 免責 */}
      <section className="py-8 text-center">
        <p className="text-xs text-slate-400 max-w-xl mx-auto">
          当サービスは参考情報の提供を目的としており、投資・売買の勧誘を行うものではありません。
          掲載データは過去の実績であり、将来の価値を保証するものではありません。
        </p>
      </section>
    </div>
  );
}
