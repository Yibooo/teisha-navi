type CachePoint = {
  bucketMin: number;
  bucketMax: number;
  medianPriceRatio: number;
  avgPriceRatio: number;
  sampleCount: number;
};

export type SimulationResult = {
  futureRemainingYears: number;
  predictedPrice: number;
  priceChangeRate: number;      // %
  currentRatio: number;
  futureRatio: number;
  warning: "none" | "caution" | "danger";
  warningMessage: string;
  dataPoints: Array<{
    year: number;
    remainingYears: number;
    predictedPrice: number;
    ratio: number;
  }>;
  sampleCount: number;
};

// 残存年数に対応する価格比率を補間して取得
function interpolateRatio(
  cachePoints: CachePoint[],
  remainingYears: number
): { ratio: number; sampleCount: number } {
  if (cachePoints.length === 0) return { ratio: 1, sampleCount: 0 };

  // 残存年数が含まれるバケットを探す
  const bucket = cachePoints.find(
    (p) => remainingYears >= p.bucketMin && remainingYears < p.bucketMax
  );
  if (bucket) {
    return { ratio: bucket.medianPriceRatio, sampleCount: bucket.sampleCount };
  }

  // バケット外の場合は最近傍を使用
  const sorted = [...cachePoints].sort((a, b) => a.bucketMin - b.bucketMin);
  if (remainingYears < sorted[0].bucketMin) {
    return { ratio: sorted[0].medianPriceRatio, sampleCount: sorted[0].sampleCount };
  }
  const last = sorted[sorted.length - 1];
  return { ratio: last.medianPriceRatio, sampleCount: last.sampleCount };
}

export function calculateSimulation(
  purchasePrice: number,          // 万円
  currentRemainingYears: number,  // 年
  yearsToLive: number,            // 年
  cachePoints: CachePoint[]
): SimulationResult {
  const futureRemainingYears = currentRemainingYears - yearsToLive;

  const { ratio: currentRatio } = interpolateRatio(cachePoints, currentRemainingYears);
  const { ratio: futureRatio, sampleCount } = interpolateRatio(
    cachePoints,
    Math.max(futureRemainingYears, 0)
  );

  // 将来価格 = 購入価格 × (将来比率 / 現在比率)
  const ratioChange = currentRatio > 0 ? futureRatio / currentRatio : futureRatio;
  const predictedPrice = Math.round(purchasePrice * ratioChange);
  const priceChangeRate = Math.round((ratioChange - 1) * 1000) / 10;

  // 警告レベル判定
  let warning: "none" | "caution" | "danger" = "none";
  let warningMessage = "";
  if (futureRemainingYears <= 0) {
    warning = "danger";
    warningMessage = "借地権満了後は資産価値がゼロになります。売却時期を再検討してください。";
  } else if (futureRemainingYears < 25) {
    warning = "danger";
    warningMessage = `残存${futureRemainingYears}年は要注意ゾーンです。融資が付きにくくなるため売却が困難になる可能性があります。`;
  } else if (futureRemainingYears < 35) {
    warning = "caution";
    warningMessage = `残存${futureRemainingYears}年付近から価格下落が加速する傾向があります。売り時を意識し始めましょう。`;
  }

  // 年次推移データ（5年刻み）
  const dataPoints = [];
  const maxYears = Math.min(yearsToLive, currentRemainingYears);
  for (let y = 0; y <= maxYears; y += Math.max(1, Math.floor(maxYears / 10))) {
    const rem = currentRemainingYears - y;
    const { ratio } = interpolateRatio(cachePoints, Math.max(rem, 0));
    const rChange = currentRatio > 0 ? ratio / currentRatio : ratio;
    dataPoints.push({
      year: y,
      remainingYears: rem,
      predictedPrice: Math.round(purchasePrice * rChange),
      ratio,
    });
  }
  // 最終年を必ず追加
  if (maxYears > 0 && dataPoints[dataPoints.length - 1].year !== maxYears) {
    const rem = currentRemainingYears - maxYears;
    const { ratio } = interpolateRatio(cachePoints, Math.max(rem, 0));
    const rChange = currentRatio > 0 ? ratio / currentRatio : ratio;
    dataPoints.push({
      year: maxYears,
      remainingYears: rem,
      predictedPrice: Math.round(purchasePrice * rChange),
      ratio,
    });
  }

  return {
    futureRemainingYears,
    predictedPrice,
    priceChangeRate,
    currentRatio,
    futureRatio,
    warning,
    warningMessage,
    dataPoints,
    sampleCount,
  };
}
