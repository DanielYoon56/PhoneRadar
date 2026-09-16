import { Device, PriceAnalysisResult, PriceCategorySummary, PriceRecord } from '../src/types/index.js';

// Calculate summary metrics for a specific subset of price records
function calculateCategorySummary(records: PriceRecord[], description: string): PriceCategorySummary | null {
  if (records.length === 0) return null;
  const sorted = records.map((r) => r.price).sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median =
    sorted.length % 2 === 0
      ? Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
      : sorted[Math.floor(sorted.length / 2)];
  const average = Math.round(sorted.reduce((acc, v) => acc + v, 0) / sorted.length);

  return {
    min,
    max,
    median,
    average,
    count: records.length,
    description,
  };
}

/**
 * 사업계획서 정책 기준 가격 데이터 유효기간 (30일)
 * 급변하는 중고 스마트폰 감가상각 및 시세 변동성을 신속히 반영하기 위해
 * 수집일로부터 30일이 경과한 데이터는 Stale(만료) 처리되어 실시간 시세 산정에서 제외됩니다.
 */
export const PRICE_RECORD_VALIDITY_DAYS = 30;

/**
 * Checks if a price record is stale (older than 30 days from collection date)
 * 사업계획서 정책 준수: 수집일로부터 30일을 초과한 데이터는 만료로 판정
 */
export function isPriceRecordStale(record: PriceRecord, referenceDate = new Date()): boolean {
  if (record.isStale) return true;
  if (!record.collectedAt) return false;
  const collected = new Date(record.collectedAt).getTime();
  if (isNaN(collected)) return false;
  const diffDays = (referenceDate.getTime() - collected) / (1000 * 60 * 60 * 24);
  return diffDays > PRICE_RECORD_VALIDITY_DAYS;
}

/**
 * Validates price record input schema, bounds, source, and deduplication
 */
export interface PriceValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: Partial<PriceRecord>;
}

export function validatePriceRecord(
  record: any,
  existingRecords: PriceRecord[]
): PriceValidationResult {
  const errors: string[] = [];

  // 1. Source verification
  if (!record.source || typeof record.source !== 'string' || record.source.trim().length < 2) {
    errors.push('출처(source)는 2자 이상의 유효한 명칭이어야 합니다.');
  }
  const validSourceTypes = ['MARKETPLACE', 'RETAILER', 'WHOLESALER', 'EXPORT', 'USER_INPUT', 'PARTNER'];
  if (!validSourceTypes.includes(record.sourceType)) {
    errors.push(`유효하지 않은 출처 유형입니다. (${validSourceTypes.join(', ')})`);
  }

  // 2. Type verification
  const validListingTypes = ['LISTING', 'TRANSACTION', 'BUY_OFFER', 'SELL_OFFER'];
  if (!validListingTypes.includes(record.listingOrTransaction)) {
    errors.push(`가격 유형은 [${validListingTypes.join(', ')}] 중 하나여야 합니다.`);
  }

  // 3. Price bounds check
  const priceNum = Number(record.price);
  if (isNaN(priceNum) || priceNum < 10000 || priceNum > 10000000 || !Number.isInteger(priceNum)) {
    errors.push('가격(price)은 10,000원 이상 10,000,000원 이하의 정수여야 합니다.');
  }

  // 4. Model and storage check
  if (!record.model || typeof record.model !== 'string' || record.model.trim().length < 2) {
    errors.push('기기 모델명(model)이 올바르지 않습니다.');
  }
  if (!record.storage || typeof record.storage !== 'string') {
    errors.push('저장용량(storage)을 지정해야 합니다.');
  }

  // 5. Condition grade check
  const validGrades = ['S', 'A', 'B', 'C'];
  if (!validGrades.includes(record.conditionGrade)) {
    errors.push('상태 등급은 S, A, B, C 중 하나여야 합니다.');
  }

  // 6. Validity date check (collectedAt cannot be in the future)
  const now = new Date();
  const collectedAtDate = record.collectedAt ? new Date(record.collectedAt) : now;
  if (isNaN(collectedAtDate.getTime())) {
    errors.push('수집일자(collectedAt) 포맷이 올바르지 않습니다.');
  } else if (collectedAtDate.getTime() > now.getTime() + 24 * 60 * 60 * 1000) {
    errors.push('수집일자는 미래 날짜일 수 없습니다.');
  }

  // 7. Deduplication check (same model, storage, conditionGrade, source, price, and listingOrTransaction within 14 days)
  const isDuplicate = existingRecords.some((existing) => {
    if (
      existing.model.toLowerCase() === (record.model || '').toLowerCase() &&
      existing.storage === record.storage &&
      existing.conditionGrade === record.conditionGrade &&
      existing.source.toLowerCase() === (record.source || '').toLowerCase() &&
      existing.listingOrTransaction === record.listingOrTransaction &&
      existing.price === priceNum
    ) {
      const existingTime = new Date(existing.collectedAt).getTime();
      const newTime = collectedAtDate.getTime();
      const diffDays = Math.abs(newTime - existingTime) / (1000 * 60 * 60 * 24);
      return diffDays <= 14;
    }
    return false;
  });

  if (isDuplicate) {
    errors.push('동일 출처·모델·용량·등급·유형 및 가격의 데이터가 14일 이내 이미 등록되어 있습니다 (중복 방지).');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Calculate default expiration based on business policy (30 days)
  const expiresAt = new Date(
    collectedAtDate.getTime() + PRICE_RECORD_VALIDITY_DAYS * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .split('T')[0];

  const sanitized: Partial<PriceRecord> = {
    source: record.source.trim(),
    sourceType: record.sourceType,
    productId: record.productId || `${record.model.toLowerCase().replace(/\s+/g, '-')}-${record.storage.toLowerCase()}`,
    model: record.model.trim(),
    storage: record.storage.trim(),
    conditionGrade: record.conditionGrade,
    batteryCondition: record.batteryCondition?.trim(),
    price: priceNum,
    currency: 'KRW',
    region: record.region?.trim() || '전국/온라인',
    listingOrTransaction: record.listingOrTransaction,
    collectedAt: collectedAtDate.toISOString().split('T')[0],
    expiresAt,
    isStale: false,
    sourceUrl: record.sourceUrl?.trim(),
    dataConfidence: record.dataConfidence || 'MEDIUM',
    notes: record.notes?.trim() || '검증된 가격 데이터',
  };

  return { valid: true, errors: [], sanitized };
}

export function analyzeDevicePrice(
  device: Device,
  records: PriceRecord[]
): PriceAnalysisResult {
  const askingPrice = device.askingPrice || 0;
  const buyPrice = device.buyPrice;

  // Filter records by matching product / model and check staleness
  const matchingRecords = records.filter((r) => {
    const isModelMatch =
      (device.canonicalId && r.productId === device.canonicalId) ||
      r.model.toLowerCase() === device.model.toLowerCase();
    if (!isModelMatch) return false;
    // Mark staleness if older than 30 days (사업계획서 정책 준수)
    r.isStale = isPriceRecordStale(r);
    return true;
  });

  // Active records (exclude stale records for real-time market range)
  const activeRecords = matchingRecords.filter((r) => !r.isStale);
  const comparisonCount = activeRecords.length;
  const sourcesUsed = Array.from(new Set(activeRecords.map((r) => `${r.source} (${r.sourceType})`)));

  // Strict separation of 3 price categories (Requirement 6)
  const transactionRecords = activeRecords.filter((r) => r.listingOrTransaction === 'TRANSACTION');
  const listingRecords = activeRecords.filter((r) => r.listingOrTransaction === 'LISTING');
  const buyOfferRecords = activeRecords.filter((r) => r.listingOrTransaction === 'BUY_OFFER');

  const transactionSummary = calculateCategorySummary(transactionRecords, '실거래 체결가 (실제 성사된 거래)');
  const listingSummary = calculateCategorySummary(listingRecords, '등록 희망 호가 (판매자가 등록한 호가)');
  const buyOfferSummary = calculateCategorySummary(buyOfferRecords, '도매/딜러 매입가 (유통/수출 매입 단가)');

  const hasTransactionPrices = transactionRecords.length > 0;

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
      aiPriceJudgement: `현재 기기와 비교할 수 있는 유효 가격자료(${PRICE_RECORD_VALIDITY_DAYS}일 이내)가 충분하지 않아 신뢰도 높은 가격 범위를 산출하기 어렵습니다.`,
      notes: [
        '자체 가격 데이터베이스에 동일 모델의 유효 비교자료가 미등록 상태입니다.',
        '판매자 또는 제휴 파트너가 직접 입력한 비교가격이나 매입자료를 등록하시면 즉시 분리 비교가 가능합니다.',
      ],
      transactionSummary: null,
      listingSummary: null,
      buyOfferSummary: null,
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

  // Calculate overall prices across all active records
  const prices = activeRecords.map((r) => r.price).sort((a, b) => a - b);
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

  // Relative Position determination (evaluated against listing or transaction reference)
  let relativePosition: PriceAnalysisResult['relativePosition'] = 'UNKNOWN';
  let aiPriceJudgement = '';

  if (askingPrice <= 0) {
    relativePosition = 'UNKNOWN';
    aiPriceJudgement = '희망 판매가격이 입력되지 않아 시장 비교 위치를 산정하지 않았습니다.';
  } else if (askingPrice < minPrice) {
    relativePosition = 'BELOW_MARKET';
    aiPriceJudgement =
      '현재 등록가격은 수집된 가격 범위 최저가보다 낮게 설정되어 있습니다. 빠른 처분을 목표로 하거나 상태 특이사항 유무를 점검하세요.';
  } else if (askingPrice > maxPrice) {
    relativePosition = 'ABOVE_MARKET';
    aiPriceJudgement =
      '현재 등록가격은 수집된 비교 데이터의 최고가보다 높게 형성되어 있습니다. 추가 사은품 또는 미사용급 상태가 아니라면 가격 조정을 권장합니다.';
  } else {
    relativePosition = 'WITHIN_MARKET';
    aiPriceJudgement = '현재 확보된 시장 비교 범위 내에 안정적으로 위치하고 있습니다.';
  }

  if (analysisStatus === 'LIMITED') {
    aiPriceJudgement += ` (동일 모델의 유효자료가 ${comparisonCount}건으로 표본이 제한적이므로 참고용으로만 활용하시기 바랍니다.)`;
  }

  const notes: string[] = [
    `유효자료 ${comparisonCount}건: 실거래 체결 ${transactionRecords.length}건, 등록 호가 ${listingRecords.length}건, 도매/매입단가 ${buyOfferRecords.length}건 분리 집계 완료.`,
  ];

  if (transactionSummary) {
    notes.push(
      `실거래가 중간값은 ₩${transactionSummary.median.toLocaleString()}으로, 등록 호가 대비 실체결 가격 흐름을 반영합니다.`
    );
  } else {
    notes.push('실거래 체결 데이터가 아직 없어 등록 호가(Listing) 중심으로 산출되었습니다. 체결 시 3~5% 내외의 네고 차이가 발생할 수 있습니다.');
  }

  if (buyOfferSummary) {
    notes.push(
      `유통/딜러 매입가 범위는 ₩${buyOfferSummary.min.toLocaleString()} ~ ₩${buyOfferSummary.max.toLocaleString()}으로, 빠른 현금화 기준선입니다.`
    );
  }

  const staleCount = matchingRecords.filter((r) => r.isStale).length;
  if (staleCount > 0) {
    notes.push(`* ${PRICE_RECORD_VALIDITY_DAYS}일 경과 만료(Stale) 데이터 ${staleCount}건은 실시간 시세 산출에서 자동으로 제외되었습니다.`);
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
    transactionSummary,
    listingSummary,
    buyOfferSummary,
    marginEstimate,
  };
}
