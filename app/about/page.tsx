export const metadata = {
  title: "このサービスについて｜定借ナビ",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">このサービスについて</h1>

      <div className="space-y-8 text-slate-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">定借ナビとは</h2>
          <p>
            定借ナビは、定期借地権マンションの資産価値を第三者視点で可視化するWebサービスです。
            不動産会社ではなく、公的データに基づいて中立的な情報を提供することで、
            購入・売却の意思決定を数値でサポートします。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">データについて</h2>
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h3 className="font-semibold mb-1">📊 国土交通省 不動産取引価格情報</h3>
              <p className="text-sm">
                国土交通省が公開している実際の不動産取引価格情報をベースにしています。
                売主・買主の双方に対して実施したアンケートに基づくデータです。
              </p>
              <a
                href="https://www.land.mlit.go.jp/webland/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline mt-1 inline-block"
              >
                データ出典: 国土交通省 土地総合情報システム →
              </a>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h3 className="font-semibold mb-1">🏢 物件マスタ</h3>
              <p className="text-sm">
                定期借地権マンションの物件一覧は、公開情報を元に手動で管理しています。
                借地権開始年・権利期間等の情報を組み合わせて残存年数を算出しています。
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">算出方法</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>国交省APIで東京23区の「借地権」フラグ付き取引データを取得</li>
            <li>既知の定期借地権マンションリストと照合し、該当取引を抽出</li>
            <li>残存年数 = 借地権開始年 + 権利期間 − 取引年 で計算</li>
            <li>残存年数を5年刻みのバケットに分類し、中央値・平均を集計</li>
            <li>新築時取引価格と中古取引価格の比率から「新築比価格比率」を算出</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">免責事項</h2>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-sm text-amber-800 space-y-2">
            <p>• 本サービスの情報は参考情報の提供を目的としており、投資・売買の勧誘を行うものではありません。</p>
            <p>• 掲載データは過去の実績であり、将来の価値を保証するものではありません。</p>
            <p>• シミュレーション結果は過去データの中央値に基づく参考値です。個別物件の状況により実際の価格は大きく異なります。</p>
            <p>• 売買の意思決定は必ず不動産の専門家にご相談ください。</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">対象エリア</h2>
          <p>東京都23区（現在）</p>
        </section>
      </div>
    </div>
  );
}
