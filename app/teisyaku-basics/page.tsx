import { PublicNavLink } from "@/components/PublicNavLink";

export const metadata = {
  title: "そもそも定借マンションとは？｜定借ナビ",
  description:
    "定期借地権付マンションの仕組み・メリット・注意点を、図解とQ&Aでわかりやすく解説。所有権マンションとの違いや、地代・税金・ローンについても詳しく説明します。",
};

export default function TeisyakuBasicsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
      <div className="mb-10">
        <p className="text-sm font-semibold text-blue-600 tracking-widest uppercase mb-2">Basic Guide</p>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          そもそも定借マンションとは？
        </h1>
        <p className="text-slate-600 leading-relaxed">
          「定期借地権付マンション」は、<strong>土地を所有せずに期限付きで借りる</strong>マンションです。
          好立地・低コストが魅力ですが、所有権マンションとは仕組みが大きく異なります。
          このページでは基本的な仕組みから費用・注意点まで解説します。
        </p>
      </div>

      {/* タブナビ（ページ内アンカー） */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-10 border-b border-slate-200 pb-4">
        {[
          { href: "#what", label: "仕組み" },
          { href: "#merit", label: "メリット" },
          { href: "#caution", label: "注意点" },
          { href: "#cost", label: "費用" },
          { href: "#tax", label: "税金・ローン" },
          { href: "#faq", label: "Q&A" },
        ].map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="text-sm px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-800 transition-colors font-medium"
          >
            {label}
          </a>
        ))}
      </div>

      <div className="space-y-14 text-slate-700 leading-relaxed">

        {/* 1. 仕組み */}
        <section id="what">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="text-blue-600">01</span> 仕組みをざっくり理解する
          </h2>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
            <p className="text-blue-900 font-semibold text-lg mb-2">一言で言うと</p>
            <p className="text-blue-800">
              「土地は借りる、建物は所有する」マンション。
              <strong>借地借家法（1992年施行）</strong>で定められた「定期借地権」を使って、
              期限付きで土地を利用する権利を得ます。
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border-2 border-slate-200 rounded-xl p-5">
              <p className="font-bold text-slate-900 mb-3">🏢 所有権マンション</p>
              <ul className="text-sm space-y-2">
                <li>✅ 土地の所有権（持分）あり</li>
                <li>✅ 期限なし・永住可能</li>
                <li>❌ 取得価格が高い</li>
                <li>❌ 土地の固定資産税も負担</li>
              </ul>
            </div>
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-5">
              <p className="font-bold text-slate-900 mb-3">📋 定借マンション</p>
              <ul className="text-sm space-y-2">
                <li>✅ 好立地・低コストで取得しやすい</li>
                <li>✅ 土地の固定資産税は地主負担</li>
                <li>⚠️ 借地期間あり（50〜75年が多い）</li>
                <li>⚠️ 毎月の地代・解体積立金が必要</li>
              </ul>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <p className="font-semibold text-slate-900 mb-2">権利の種類：地上権 vs 賃借権</p>
            <p className="text-sm mb-3">
              定借マンションの土地利用権には2種類あります。最近の物件は流通性・融資面で有利な<strong>「地上権」</strong>が主流です。
            </p>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <p className="font-semibold text-green-700 mb-1">地上権（物権）</p>
                <ul className="space-y-1 text-slate-600">
                  <li>・地主の承諾なしで売却可能</li>
                  <li>・地上権自体に抵当権設定可</li>
                  <li>・住宅融資に有利</li>
                  <li>・登記請求権あり</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <p className="font-semibold text-amber-700 mb-1">賃借権（債権）</p>
                <ul className="space-y-1 text-slate-600">
                  <li>・売却に地主の承諾が必要</li>
                  <li>・登記請求権なし</li>
                  <li>・承諾料が発生するケースも</li>
                  <li>・転借地権も賃借権の一種</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 2. メリット */}
        <section id="merit">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="text-green-600">02</span> 定借マンションの3つのメリット
          </h2>

          <div className="space-y-4">
            <div className="flex gap-4 bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="text-3xl">📍</div>
              <div>
                <p className="font-bold text-slate-900 mb-1">メリット①：好立地で手に入れやすい</p>
                <p className="text-sm text-slate-600">
                  地主が「土地は手放したくないが収益化したい」場所を活用するため、
                  駅近・都心エリアの<strong>好立地物件が多い</strong>のが特徴です。
                  フランス大使館旧館跡地（港区）、日赤医療センター（渋谷区）、
                  お茶の水女子大学用地（板橋区）など有名な事例があります。
                </p>
              </div>
            </div>

            <div className="flex gap-4 bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="text-3xl">💰</div>
              <div>
                <p className="font-bold text-slate-900 mb-1">メリット②：初期費用が抑えられる</p>
                <p className="text-sm text-slate-600">
                  土地代が含まれない分、<strong>周辺所有権物件の約80%前後の価格水準</strong>が目安です（国土交通省データ）。
                  浮いた資金を広めの間取りや内装グレードアップに充てることも可能です。
                </p>
              </div>
            </div>

            <div className="flex gap-4 bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="text-3xl">🏷️</div>
              <div>
                <p className="font-bold text-slate-900 mb-1">メリット③：各種税金が軽減される</p>
                <p className="text-sm text-slate-600">
                  土地を所有しないため、<strong>土地の固定資産税・都市計画税は地主負担</strong>。
                  不動産取得税・登録免許税も建物部分のみに課税され、税負担が軽くなります。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. 注意点 */}
        <section id="caution">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="text-amber-600">03</span> 購入前に知っておきたい注意点
          </h2>

          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="font-bold text-slate-900 mb-2">⚠️ 注意点①：借地期間が終わると返還が必要</p>
              <p className="text-sm text-slate-600">
                定期借地権は更新できません。期間（多くは50〜75年）が満了したら、
                建物を解体して<strong>更地で地主に返還</strong>します。
                「永住したい」「孫の代まで住みたい」という場合は注意が必要です。
                ただし、残存期間が十分あれば実質的には一般マンションと同じ期間住み続けられます。
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="font-bold text-slate-900 mb-2">⚠️ 注意点②：毎月の地代・解体積立金がかかる</p>
              <p className="text-sm text-slate-600">
                管理費・修繕積立金に加え、<strong>地代（月数千円〜数万円）</strong>と
                <strong>解体準備積立金（月数千円）</strong>が毎月かかります。
                管理費・修繕積立金も合わせると月の固定費が高めになる傾向があります。
                購入時には月々の総支払額を試算して確認しましょう。
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="font-bold text-slate-900 mb-2">⚠️ 注意点③：資産価値の判断は所有権より慎重に</p>
              <p className="text-sm text-slate-600">
                定借マンションは残存年数という固有の要素があるため、所有権マンションと同じ感覚では資産価値を測れません。
                価格は上がることも下がることもあり、<strong>物件ごとに実際の取引データを確認することが不可欠</strong>です。
                定借ナビの「資産価値グラフ」を活用してください。
              </p>
            </div>
          </div>
        </section>

        {/* 4. 費用 */}
        <section id="cost">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="text-purple-600">04</span> 費用のしくみ
          </h2>

          <p className="text-sm text-slate-600 mb-4">
            定借マンションは「取得時の一時金」と「毎月のランニングコスト」の両面でコストが発生します。
          </p>

          <div className="overflow-x-auto mb-6">
            <table className="w-full min-w-[480px] text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="text-left p-3 rounded-tl-lg">費用の種類</th>
                  <th className="text-left p-3">内容</th>
                  <th className="text-left p-3 rounded-tr-lg">備考</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200 bg-purple-50">
                  <td className="p-3 font-medium text-purple-800">分譲価格</td>
                  <td className="p-3">建物 + 権利金（一時金）</td>
                  <td className="p-3">土地代は含まない</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-3 font-medium">権利金</td>
                  <td className="p-3">借地権設定の対価</td>
                  <td className="p-3">返還されない</td>
                </tr>
                <tr className="border-b border-slate-200 bg-purple-50">
                  <td className="p-3 font-medium text-purple-800">前払賃料</td>
                  <td className="p-3">地代の前払い分</td>
                  <td className="p-3">物件により分譲価格に含む</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-3 font-medium">保証金（敷金）</td>
                  <td className="p-3">地代・義務履行の担保</td>
                  <td className="p-3">期間満了時に返還（通例）</td>
                </tr>
                <tr className="border-b border-slate-200 bg-blue-50">
                  <td className="p-3 font-medium text-blue-800">地代（月額）</td>
                  <td className="p-3">土地利用料</td>
                  <td className="p-3">3年ごと固都税連動で改定</td>
                </tr>
                <tr className="bg-blue-50">
                  <td className="p-3 font-medium text-blue-800">解体準備積立金（月額）</td>
                  <td className="p-3">期間満了時の解体費用積立</td>
                  <td className="p-3">管理組合が管理</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <p className="font-semibold text-slate-900 mb-2">地代はどう決まる？どう変わる？</p>
            <p className="text-sm text-slate-600 mb-2">
              地代は通常<strong>3年ごとに見直し</strong>されます。改定の計算式は物件ごとに異なりますが、
              多くは「土地の固定資産税・都市計画税の変動率に連動」する方式です。
            </p>
            <div className="bg-white rounded-lg p-3 border border-slate-200 text-sm font-mono text-slate-700">
              改定後の地代 = 現在の地代 × (改定年度の固都税 ÷ 基準年度の固都税)
            </div>
            <p className="text-xs text-slate-500 mt-2">
              ※改定差額が1万円未満の場合は据え置きとする規定が多い
            </p>
          </div>
        </section>

        {/* 5. 税金・ローン */}
        <section id="tax">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="text-indigo-600">05</span> 税金・住宅ローン
          </h2>

          <div className="overflow-x-auto mb-6">
            <table className="w-full min-w-[480px] text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-3 border-b border-slate-200">税金の種類</th>
                  <th className="text-center p-3 border-b border-slate-200">所有権マンション</th>
                  <th className="text-center p-3 border-b border-slate-200 text-blue-700">定借マンション</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["固定資産税・都市計画税", "土地＋建物に課税", "建物のみ（土地は地主）"],
                  ["不動産取得税", "土地＋建物に課税", "建物のみ課税"],
                  ["登録免許税（移転）", "土地＋建物に課税", "地上権・建物に課税（1/2軽減あり）"],
                  ["住宅ローン控除", "適用可", "適用可（建物・借地権部分）"],
                ].map(([item, owned, leased], i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="p-3 border-b border-slate-100 font-medium">{item}</td>
                    <td className="p-3 border-b border-slate-100 text-center text-slate-600">{owned}</td>
                    <td className="p-3 border-b border-slate-100 text-center text-blue-700 font-medium">{leased}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <p className="font-semibold text-indigo-900 mb-2">住宅ローンは使える？</p>
              <p className="text-sm text-indigo-800">
                ✅ フラット35・提携銀行ローン利用可能。
                地上権付きは地上権自体に抵当権が設定できるため融資条件に有利。
                中古購入時も利用可能（金融機関により条件あり）。
              </p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <p className="font-semibold text-indigo-900 mb-2">相続税は？</p>
              <p className="text-sm text-indigo-800">
                定期借地権付き物件は相続の対象になります。
                建物は固定資産税評価額ベース、借地権は「残存年数を反映した評価係数」で計算。
                詳細は税理士に確認を。
              </p>
            </div>
          </div>
        </section>

        {/* 6. Q&A */}
        <section id="faq">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="text-rose-600">06</span> よくある質問
          </h2>

          <div className="space-y-3">
            {[
              {
                q: "借地期間が終わったら、強制退去させられるの？",
                a: "はい、期間満了時には建物を解体して土地を返還します。ただし期間は50〜75年と長く、購入後に十分な居住期間があります。急に退去を求められることはなく、事前に期間は明確に定められています。",
              },
              {
                q: "売却・賃貸・相続はできる？",
                a: "いずれも可能です。地上権付きなら売却に地主の承諾は不要。賃貸は借地期間内に終了する条件で可能。相続は速やかに地主へ通知が必要なのが一般的です。",
              },
              {
                q: "地主が破産したら借地権はどうなる？",
                a: "地上権は登記されていれば第三者対抗力があり、新しい地主にも権利を主張できます。賃借権も登記があれば同様です。定期借地権の内容は地主が変わっても引き継がれます。",
              },
              {
                q: "解体費用はどれくらいかかる？積立は十分？",
                a: "一般的なマンションの解体費用は1戸あたり数十万〜百万円程度です。毎月の解体準備積立金で期間満了までに賄える設計になっています。積立計画は管理組合で確認できます。",
              },
              {
                q: "定借ナビのグラフで資産価値を確認できる？",
                a: "はい。定借ナビの「資産価値グラフ」では、残存年数別の坪単価推移と新築時比（何%まで価値が変化したか）をデータで確認できます。個別マンションのページでも詳細が見られます。",
              },
            ].map(({ q, a }, i) => (
              <details key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden group">
                <summary className="px-5 py-4 cursor-pointer font-semibold text-slate-900 flex items-center justify-between hover:bg-slate-50 transition-colors list-none">
                  <span>Q. {q}</span>
                  <span className="text-slate-400 text-sm ml-4 shrink-0 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                  <p className="pt-3">A. {a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl p-8 text-center">
          <p className="text-blue-200 text-sm mb-2">定借ナビで確認する</p>
          <h3 className="text-xl font-bold text-white mb-4">
            実際の取引データで資産価値を確認しよう
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            <PublicNavLink
              to="analytics"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-900 font-semibold rounded-xl hover:bg-blue-50 transition-colors text-sm shadow"
            >
              📊 資産価値グラフを見る →
            </PublicNavLink>
            <PublicNavLink
              to="simulator"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors text-sm shadow border border-blue-600"
            >
              🔢 将来価値をシミュレーション →
            </PublicNavLink>
          </div>
        </section>

        {/* 免責 */}
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-xs text-amber-700">
          <p className="font-semibold mb-1">⚠️ 免責事項</p>
          <p>
            本ページの情報は一般的な解説を目的としており、特定の物件・案件に関する法的アドバイスではありません。
            個別の権利内容は必ず各物件の「定期借地権設定契約書」および「確認合意書」でご確認ください。
            投資・売買の意思決定は必ず専門家にご相談ください。
          </p>
        </div>

      </div>
    </div>
  );
}
