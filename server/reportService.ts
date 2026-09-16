import { APP_CONFIG } from '../src/config/appConfig.js';
import { Device, PriceAnalysisResult, TransactionReport } from '../src/types/index.js';

export function generateTransactionReport(
  device: Device,
  priceAnalysis: PriceAnalysisResult
): TransactionReport {
  const verifiedItems: string[] = [];
  const needsCheckItems: string[] = [];
  const unknownItems: string[] = [];

  for (const c of device.conditions) {
    if (c.status === 'VERIFIED') {
      verifiedItems.push(`${c.label}: ${c.detail || '정상 확인'}`);
    } else if (c.status === 'NEEDS_CHECK') {
      needsCheckItems.push(`${c.label}: ${c.detail || '현장 추가 검증 필요'}`);
    } else {
      unknownItems.push(`${c.label}: 정보 미확보`);
    }
  }

  // Observed issues from AI images
  const observedIssues: string[] = [];
  for (const img of device.images) {
    if (img.visualObservations) {
      for (const obs of img.visualObservations) {
        if (obs.severity !== 'NONE') {
          observedIssues.push(`[${obs.category}] ${obs.observation}`);
        }
      }
    }
  }

  const riskAndCheckPoints: string[] = [
    '통신사 정상 해지 및 25% 선택약정 할인 가능 여부 (이동전화 단말기 자급제 사이트 IMEI 조회 권장)',
    'OLED 디스플레이 잔상(번인) 및 백화 현상: 흰색 전체 화면에서 픽셀 열화 직접 육안 점검',
    '생체인식 센서(Face ID / 지문인식)의 실제 등록 및 잠금 해제 동작 검증',
    '배터리 성능 최대치 수치 및 급방전 여부 (설정 > 배터리 메뉴에서 직접 확인)',
    '애플 아이클라우드 / 삼성 계정 로그아웃 및 기기 완전 초기화(FRP 락 해제) 확인',
  ];

  if (device.conditions.some((c) => c.category === 'REPAIR' && c.status === 'NEEDS_CHECK')) {
    riskAndCheckPoints.push('부품 교체 이력: 설정 > 일반 > 정보 메뉴에서 정품 디스플레이/배터리 경고문구 유무 확인');
  }

  const priceRangeText =
    priceAnalysis.analysisStatus === 'INSUFFICIENT_DATA'
      ? '비교 표본 부족으로 산출 불가'
      : `₩${priceAnalysis.marketPriceMin.toLocaleString()} ~ ₩${priceAnalysis.marketPriceMax.toLocaleString()}`;

  const currentPriceText = device.askingPrice
    ? `₩${device.askingPrice.toLocaleString()}`
    : '미등록';

  let relativePositionText = '시장 범위 내 적정';
  if (priceAnalysis.relativePosition === 'BELOW_MARKET') {
    relativePositionText = '시장가격 범위보다 낮음 (급매/조건 확인 요망)';
  } else if (priceAnalysis.relativePosition === 'ABOVE_MARKET') {
    relativePositionText = '시장가격 범위보다 높음 (구성품/보증 확인 요망)';
  } else if (priceAnalysis.relativePosition === 'UNKNOWN') {
    relativePositionText = '판단 보류 (데이터 또는 희망가 부족)';
  }

  const reportNumber = `PC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${device.id.replace('dev-', '')}`;

  return {
    id: `rep-${device.id}`,
    deviceId: device.id,
    reportNumber,
    createdAt: new Date().toISOString(),
    deviceSummary: {
      brand: device.brand,
      model: device.model,
      storage: device.storage,
      color: device.color,
      releaseYear: device.releaseYear,
      telecom: device.telecom || '자급제/공용',
    },
    conditionSummary: {
      sufficiencyScore: device.infoSufficiencyScore,
      verifiedItems,
      needsCheckItems,
      unknownItems,
      batteryNote: device.batteryHealthUserReported
        ? `판매자 보고: ${device.batteryHealthUserReported}% (실제 설정창 확인 필요)`
        : '배터리 상태 미입력 (사진만으로 성능 확인 불가)',
      repairNote: '외관 사진만으로 내부 사설 수리 및 정품 부품 교체 이력을 단정할 수 없습니다.',
    },
    aiImageAnalysis: {
      photoCount: device.images.length,
      qualityPassed: device.images.every((img) => img.qualityAnalysis?.isAcceptable ?? true),
      observedIssues: observedIssues.length > 0 ? observedIssues : ['특이 외관 파손 없음'],
      unverifiedAngles:
        device.images.length < 3
          ? ['측면 모서리 각도 미촬영', '카메라 렌즈 근접 각도 필요']
          : [],
    },
    marketPriceAnalysis: {
      analysisStatus: priceAnalysis.analysisStatus,
      priceRangeText,
      currentPriceText,
      relativePositionText,
      dataCount: priceAnalysis.comparisonCount,
      dataConfidence:
        priceAnalysis.priceConfidence === 'HIGH'
          ? '높음'
          : priceAnalysis.priceConfidence === 'MEDIUM'
            ? '보통'
            : priceAnalysis.priceConfidence === 'LOW'
              ? '낮음 (표본 제한적)'
              : '데이터 부족',
      referenceDate: priceAnalysis.referenceDate,
      disclaimer: priceAnalysis.aiPriceJudgement,
    },
    riskAndCheckPoints,
    finalSummaryStatement:
      '입력된 정보와 확보된 가격 데이터를 기준으로 분석한 참고 결과입니다. 배터리 상태와 수리 이력은 별도의 기기 진단 또는 증빙자료 확인이 필요합니다.',
    legalDisclaimer: APP_CONFIG.legalDisclaimer,
    shareToken: device.shareToken || `share-${device.id}`,
  };
}
