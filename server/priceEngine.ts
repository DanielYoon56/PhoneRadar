import { Device, PriceAnalysisResult, PriceRecord } from '../src/types/index.js';

export function analyzeDevicePrice(
  device: Device,
  records: PriceRecord[]
): PriceAnalysisResult {
  const askingPrice = device.askingPrice || 0;
  const buyPrice = device.buyPrice;

  // Filter records by matching product / model
  const matchingRecords = records.filter((r) => {
    if (device.canonicalId && r.productId === device.canonicalId) return true;
    if (r.model.toLowerCase() === device.model.toLowerCase()) return true;
    return false;
  });

  const comparisonCount = matchingRecords.length;
  const sourcesUsed = Array.from(new Set(matchingRecords.map((r) => `${r.source} (${r.sourceType})`)));
  const hasTransactionPrices = matchingRecords.some((r) => r.listingOrTransaction === 'TRANSACTION');

  // Fallback when insufficient data
  if (comparisonCount === 0) {
    return {
      deviceId: device.id,
      analysisStatus: 'INSUFFICIENT_DATA',
      marketPriceMin: 0,
      marketPriceMax: 0,
      marketPriceMedian: 0,
      currentListingPrice: askingPrice,
      buyPrice,
      relativePosition: 'UNKNOWN',
      priceConfidence: 'INSUFFICIENT_DATA',
      comparisonCount: 0,
      referenceDate: new Date().toISOString().split('T')[0],
      sourcesUsed: [],
      hasTransactionPrices: false,
      aiPriceJudgement: '현재 기기와 비교할 수 있는 가격자료가 충분하지 않아 신뢰도 높은 가격 범위를 산출하기 어렵습니다.',
      notes: [
        '자체 가격 데이터베이스에 동일 모델의 공인 비교자료가 미등록 상태입니다.',
        '판매자 또는 제휴 파트너가 직접 입력한 비교가격이나 매입자료를 등록하시면 즉시 제한적 비교가 가능합니다.',
      ],
      marginEstimate:
        buyPrice && askingPrice
          ? {
              buyPrice,
              expectedSellPrice: askingPrice,
              grossMargin: askingPrice - buyPrice,
              marginPercent: Math.round(((askingPrice - buyPrice) / buyPrice) * 100),
            }
          : undefined,
    };
  }

  // Calculate prices
  const prices = matchingRecords.map((r) => r.price).sort((a, b) => a - b);
  const minPrice = prices[0];
  const maxPrice = prices[prices.length - 1];
  const medianPrice =
    prices.length % 2 === 0
      ? Math.round((prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2)
      : prices[Math.floor(prices.length / 2)];

  // Confidence assessment
  let priceConfidence: PriceAnalysisResult['priceConfidence'] = 'LOW';
  let analysisStatus: PriceAnalysisResult['analysisStatus'] = 'LIMITED';

  if (comparisonCount >= 6 && hasTransactionPrices) {
    priceConfidence = 'HIGH';
    analysisStatus = 'SUFFICIENT';
  } else if (comparisonCount >= 3) {
    priceConfidence = 'MEDIUM';
    analysisStatus = 'LIMITED';
  } else {
    priceConfidence = 'LOW';
    analysisStatus = 'LIMITED';
  }

  // Relative Position determination
  let relativePosition: PriceAnalysisResult['relativePosition'] = 'UNKNOWN';
  let aiPriceJudgement = '';

  if (askingPrice <= 0) {
    relativePosition = 'UNKNOWN';
    aiPriceJudgement = '희망 판매가격이 입력되지 않아 시장 비교 위치를 산정하지 않았습니다.';
  } else if (askingPrice < minPrice) {
    relativePosition = 'BELOW_MARKET';
    aiPriceJudgement =
      '현재 등록가격은 비교 데이터의 일반적인 가격 범위보다 낮게 나타납니다. 급매 여부 또는 상태 특이사항을 확인하세요.';
  } else if (askingPrice > maxPrice) {
    relativePosition = 'ABOVE_MARKET';
    aiPriceJudgement =
      '현재 등록가격은 비교 데이터의 일반적인 가격 범위보다 높게 형성되어 있습니다. 추가 구성품 또는 보증 잔여 여부를 점검하세요.';
  } else {
    relativePosition = 'WITHIN_MARKET';
    aiPriceJudgement = '현재 확보된 비교 데이터 기준으로 해당 가격은 시장가격 범위 내에 있습니다.';
  }

  if (analysisStatus === 'LIMITED') {
    aiPriceJudgement += ` (동일 모델·용량의 비교자료가 ${comparisonCount}건으로 표본이 제한적이므로 참고용으로만 활용하시기 바랍니다.)`;
  }

  const notes: string[] = [
    `수집된 ${comparisonCount}건 중 실거래 ${matchingRecords.filter((r) => r.listingOrTransaction === 'TRANSACTION').length}건, 등록매물 ${matchingRecords.filter((r) => r.listingOrTransaction === 'LISTING').length}건, 유통/도매 제휴가 ${matchingRecords.filter((r) => r.listingOrTransaction === 'BUY_OFFER' || r.listingOrTransaction === 'SELL_OFFER').length}건 포함.`,
  ];

  if (hasTransactionPrices) {
    notes.push('실제 체결된 거래 데이터가 포함되어 시세 판단의 객관성을 보조합니다.');
  } else {
    notes.push('등록 호가(Listing) 중심 데이터이므로 실제 체결 시 3~5% 내외의 네고 차이가 발생할 수 있습니다.');
  }

  const marginEstimate =
    buyPrice && askingPrice
      ? {
          buyPrice,
          expectedSellPrice: askingPrice,
          grossMargin: askingPrice - buyPrice,
          marginPercent: Math.round(((askingPrice - buyPrice) / buyPrice) * 100),
        }
      : undefined;

  return {
    deviceId: device.id,
    analysisStatus,
    marketPriceMin: minPrice,
    marketPriceMax: maxPrice,
    marketPriceMedian: medianPrice,
    currentListingPrice: askingPrice,
    buyPrice,
    relativePosition,
    priceConfidence,
    comparisonCount,
    referenceDate: new Date().toISOString().split('T')[0],
    sourcesUsed,
    hasTransactionPrices,
    aiPriceJudgement,
    notes,
    marginEstimate,
  };
}
