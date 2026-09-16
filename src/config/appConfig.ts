/**
 * Centralized Application Configuration
 * PhoneCheck AI Master Config
 */

export const APP_CONFIG = {
  brandName: 'PhoneCheck AI',
  brandSubtitle: 'AI 중고폰 상태·가격 검증 플랫폼',
  brandMotto: '중고폰을 어디서 거래할 것인가가 아니라, 어떤 상태로 평가하고 얼마에 거래하는 것이 합리적인지를 판단합니다.',
  
  legalDisclaimer:
    '본 리포트는 제공된 기기 정보, 이미지 및 확보된 가격 데이터를 기반으로 생성된 참고자료입니다. 전문 감정서 또는 품질보증서를 의미하지 않으며, 이미지나 입력정보만으로 확인할 수 없는 사항은 별도의 기기 점검이 필요합니다.',
  
  priceAbsenceNotice:
    '현재 입력된 사용자 및 제한적 표본 자료를 기반으로 계산한 참고 결과이며, 전체 시장의 대표가격을 의미하지 않습니다.',

  priceConfidenceLabels: {
    HIGH: { label: '높음', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    MEDIUM: { label: '보통', color: 'text-blue-700 bg-blue-50 border-blue-200' },
    LOW: { label: '낮음 (표본 제한적)', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    INSUFFICIENT_DATA: { label: '데이터 부족', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  },

  statusBadge: {
    VERIFIED: { label: '확인됨', symbol: '✓', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    NEEDS_CHECK: { label: '추가 확인 필요', symbol: '!', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    UNKNOWN: { label: '확인 불가', symbol: '?', color: 'text-slate-600 bg-slate-100 border-slate-200' },
  },

  evidenceLabels: {
    USER_REPORTED: { label: '판매자 입력', short: '입력' },
    AI_OBSERVED: { label: 'AI 사진 관찰', short: 'AI 관찰' },
    DEVICE_DIAGNOSTIC: { label: '기기 진단 결과', short: '진단기록' },
  },

  subscriptionTiers: [
    {
      id: 'FREE',
      name: 'Free',
      priceMonth: 0,
      quotaPerMonth: 3,
      features: ['기기 3대 등록', '기본 상태 체크리스트', '제한적 AI 사진 점검', '기본 리포트'],
    },
    {
      id: 'BASIC',
      name: 'Basic',
      priceMonth: 19900,
      quotaPerMonth: 30,
      features: ['월 30대 분석', '전체 AI 사진 및 각도 분석', '시장가격 범위 분석', '공유 링크 & PDF 리포트'],
      recommended: true,
    },
    {
      id: 'PRO',
      name: 'Pro',
      priceMonth: 49900,
      quotaPerMonth: 120,
      features: ['월 120대 분석', '유통업체/딜러 마진 계산기', '거래가격 데이터 기여 및 정밀 비교', '우선 AI 분석 속도', '데이터 엑셀 내보내기'],
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      priceMonth: null,
      quotaPerMonth: 9999,
      features: ['대량 기기 분석 (수출업체용)', '전용 B2B API', '맞춤형 도매·수출 시세 연동', '전담 기술 지원'],
    },
  ],
};

/**
 * Standard baseline condition items for phone inspection
 */
export const DEFAULT_CONDITION_ITEMS = [
  {
    id: 'display_glass',
    category: 'DISPLAY' as const,
    label: '전면 액정 파손 및 균열',
    status: 'UNKNOWN' as const,
    evidenceSource: 'AI_OBSERVED' as const,
    detail: '사진 업로드 후 AI 관찰 대기',
    requiresCheck: true,
    checkReason: '전면 화면 사진 촬영 필요',
  },
  {
    id: 'display_scratch',
    category: 'DISPLAY' as const,
    label: '화면 미세 스크래치 및 잔상',
    status: 'NEEDS_CHECK' as const,
    evidenceSource: 'USER_REPORTED' as const,
    detail: 'OLED 잔상(번인) 및 백화는 사진만으로 단정할 수 없어 실기기 확인 권장',
    requiresCheck: true,
    checkReason: '흰색 화면 띄워 번인 유무 확인 권장',
  },
  {
    id: 'frame_dents',
    category: 'EXTERIOR' as const,
    label: '측면 프레임 찍힘 및 도색 벗겨짐',
    status: 'UNKNOWN' as const,
    evidenceSource: 'AI_OBSERVED' as const,
    detail: '사이드 및 모서리 사진 필요',
    requiresCheck: true,
    checkReason: '상·하·좌·우 모서리 각도 촬영 필요',
  },
  {
    id: 'back_glass',
    category: 'EXTERIOR' as const,
    label: '후면 유리 및 패널 파손/기스',
    status: 'UNKNOWN' as const,
    evidenceSource: 'AI_OBSERVED' as const,
    detail: '후면 사진 업로드 후 AI 관찰 대기',
    requiresCheck: true,
  },
  {
    id: 'camera_lens',
    category: 'CAMERA' as const,
    label: '카메라 렌즈 균열 및 멍',
    status: 'UNKNOWN' as const,
    evidenceSource: 'AI_OBSERVED' as const,
    detail: '카메라 렌즈 표면 스크래치 여부 확인 대기',
    requiresCheck: true,
  },
  {
    id: 'battery_health',
    category: 'BATTERY' as const,
    label: '배터리 실제 성능 상태',
    status: 'NEEDS_CHECK' as const,
    evidenceSource: 'USER_REPORTED' as const,
    detail: '사진만으로는 배터리 성능 확인 불가 (설정 내 배터리 성능 상태 수치 확인 필요)',
    requiresCheck: true,
    checkReason: '설정 > 배터리 > 성능 최대치 수치 확인 필요',
  },
  {
    id: 'biometrics_face_touch',
    category: 'BIOMETRICS' as const,
    label: '생체인식 (Face ID / 지문인식)',
    status: 'NEEDS_CHECK' as const,
    evidenceSource: 'USER_REPORTED' as const,
    detail: '사진으로 확인 불가 (기기 동작 테스트 필요)',
    requiresCheck: true,
    checkReason: 'Face ID 등록 및 잠금 해제 동작 검증 필요',
  },
  {
    id: 'ports_buttons',
    category: 'EXTERIOR' as const,
    label: '충전 포트 및 물리 버튼 클릭감',
    status: 'UNKNOWN' as const,
    evidenceSource: 'USER_REPORTED' as const,
    detail: '전원/볼륨 버튼 및 충전 단자 유격 확인 필요',
    requiresCheck: true,
  },
  {
    id: 'audio_mic',
    category: 'AUDIO' as const,
    label: '상/하단 스피커 및 마이크 통화 품질',
    status: 'UNKNOWN' as const,
    evidenceSource: 'USER_REPORTED' as const,
    detail: '통화 수화음 및 하단 스피커 잡음 테스트 필요',
    requiresCheck: true,
  },
  {
    id: 'connectivity_network',
    category: 'CONNECTIVITY' as const,
    label: 'Wi-Fi, Bluetooth 및 유심 통신',
    status: 'UNKNOWN' as const,
    evidenceSource: 'USER_REPORTED' as const,
    detail: '유심 장착 통화 및 Wi-Fi 연결 테스트 필요',
    requiresCheck: true,
  },
  {
    id: 'repair_history',
    category: 'REPAIR' as const,
    label: '부품 교체 및 사설 수리 이력',
    status: 'UNKNOWN' as const,
    evidenceSource: 'USER_REPORTED' as const,
    detail: '사진만으로 정품/사설 부품 교체 여부 단정 불가 (설정 내 부품 및 서비스 내역 확인 필요)',
    requiresCheck: true,
    checkReason: '설정 > 정보 > 부품 및 서비스 내역 증빙 권장',
  },
];

/**
 * Standard device catalog with canonical resolution
 */
export interface CanonicalModelDef {
  brand: string;
  model: string;
  aliases: string[];
  canonicalId: string;
  storages: string[];
  colors: string[];
  releaseYear: number;
}

export const CANONICAL_MODELS: CanonicalModelDef[] = [
  {
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    aliases: ['아이폰 15 프로', '아이폰15프로', 'iphone 15 pro', 'iphone15pro'],
    canonicalId: 'apple-iphone-15-pro',
    storages: ['128GB', '256GB', '512GB', '1TB'],
    colors: ['내추럴 티타늄', '블루 티타늄', '화이트 티타늄', '블랙 티타늄'],
    releaseYear: 2023,
  },
  {
    brand: 'Apple',
    model: 'iPhone 15',
    aliases: ['아이폰 15', '아이폰15', 'iphone 15', 'iphone15'],
    canonicalId: 'apple-iphone-15',
    storages: ['128GB', '256GB', '512GB'],
    colors: ['블랙', '블루', '그린', '옐로', '핑크'],
    releaseYear: 2023,
  },
  {
    brand: 'Apple',
    model: 'iPhone 14 Pro',
    aliases: ['아이폰 14 프로', '아이폰14프로', 'iphone 14 pro', 'iphone14pro'],
    canonicalId: 'apple-iphone-14-pro',
    storages: ['128GB', '256GB', '512GB', '1TB'],
    colors: ['딥 퍼플', '골드', '실버', '스페이스 블랙'],
    releaseYear: 2022,
  },
  {
    brand: 'Apple',
    model: 'iPhone 14',
    aliases: ['아이폰 14', '아이폰14', 'iphone 14', 'iphone14'],
    canonicalId: 'apple-iphone-14',
    storages: ['128GB', '256GB', '512GB'],
    colors: ['미드나이트', '스타라이트', '블루', '퍼플', '옐로', '(PRODUCT)RED'],
    releaseYear: 2022,
  },
  {
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    aliases: ['갤럭시 S24 울트라', '갤럭시s24울트라', 's24 ultra', 's24ultra', '갤럭시 24 울트라'],
    canonicalId: 'samsung-galaxy-s24-ultra',
    storages: ['256GB', '512GB', '1TB'],
    colors: ['티타늄 그레이', '티타늄 블랙', '티타늄 바이올렛', '티타늄 옐로우'],
    releaseYear: 2024,
  },
  {
    brand: 'Samsung',
    model: 'Galaxy S24',
    aliases: ['갤럭시 S24', '갤럭시s24', 's24'],
    canonicalId: 'samsung-galaxy-s24',
    storages: ['256GB', '512GB'],
    colors: ['오닉스 블랙', '마블 그레이', '코발트 바이올렛', '앰버 옐로우'],
    releaseYear: 2024,
  },
  {
    brand: 'Samsung',
    model: 'Galaxy Z Flip 5',
    aliases: ['갤럭시 Z 플립 5', '갤럭시 제트 플립5', 'z flip 5', 'zflip5', '플립5'],
    canonicalId: 'samsung-galaxy-z-flip-5',
    storages: ['256GB', '512GB'],
    colors: ['민트', '크림', '라벤더', '그라파이트'],
    releaseYear: 2023,
  },
  {
    brand: 'Samsung',
    model: 'Galaxy S23',
    aliases: ['갤럭시 S23', '갤럭시s23', 's23'],
    canonicalId: 'samsung-galaxy-s23',
    storages: ['128GB', '256GB', '512GB'],
    colors: ['팬텀 블랙', '크림', '그린', '라벤더'],
    releaseYear: 2023,
  },
];

export function resolveCanonicalModel(input: string): CanonicalModelDef | null {
  const normalized = input.trim().toLowerCase().replace(/\s+/g, ' ');
  for (const item of CANONICAL_MODELS) {
    if (item.model.toLowerCase() === normalized) return item;
    for (const alias of item.aliases) {
      if (normalized.includes(alias.toLowerCase())) return item;
    }
  }
  return null;
}
