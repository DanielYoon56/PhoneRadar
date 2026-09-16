import fs from 'fs';
import path from 'path';
import {
  Device,
  PriceRecord,
  UserProfile,
  TransactionReport,
  AdminStats,
  ConditionItem,
  DeviceImage,
  ShareAccessLog,
} from '../src/types/index.js';
import { DEFAULT_CONDITION_ITEMS } from '../src/config/appConfig.js';

// Pre-seeded realistic Price Records with sources and collection dates (September 2026 / recent)
const INITIAL_PRICE_RECORDS: PriceRecord[] = [
  // iPhone 15 Pro 256GB
  {
    id: 'pr-1',
    source: '당근마켓',
    sourceType: 'MARKETPLACE',
    productId: 'apple-iphone-15-pro',
    model: 'iPhone 15 Pro',
    storage: '256GB',
    conditionGrade: 'A',
    batteryCondition: '배터리 91%',
    price: 1120000,
    currency: 'KRW',
    region: '서울 강남구',
    listingOrTransaction: 'TRANSACTION',
    collectedAt: '2026-09-10',
    dataConfidence: 'HIGH',
    notes: '정상 해지, 박스 풀구성, 액정 강화유리 부착 사용',
  },
  {
    id: 'pr-2',
    source: '번개장터 번개케어',
    sourceType: 'MARKETPLACE',
    productId: 'apple-iphone-15-pro',
    model: 'iPhone 15 Pro',
    storage: '256GB',
    conditionGrade: 'A',
    batteryCondition: '배터리 89%',
    price: 1150000,
    currency: 'KRW',
    region: '전국 택배',
    listingOrTransaction: 'TRANSACTION',
    collectedAt: '2026-09-12',
    dataConfidence: 'HIGH',
    notes: '전문 검수 통과 완료 기기',
  },
  {
    id: 'pr-3',
    source: '중고나라',
    sourceType: 'MARKETPLACE',
    productId: 'apple-iphone-15-pro',
    model: 'iPhone 15 Pro',
    storage: '256GB',
    conditionGrade: 'B',
    batteryCondition: '배터리 86%',
    price: 1060000,
    currency: 'KRW',
    region: '경기 성남시',
    listingOrTransaction: 'LISTING',
    collectedAt: '2026-09-14',
    dataConfidence: 'MEDIUM',
    notes: '모서리 1곳 미세 콕, 액정 기스 없음',
  },
  {
    id: 'pr-4',
    source: '제휴 중고폰 매입업체 (용산 파트너스)',
    sourceType: 'PARTNER',
    productId: 'apple-iphone-15-pro',
    model: 'iPhone 15 Pro',
    storage: '256GB',
    conditionGrade: 'A',
    price: 980000,
    currency: 'KRW',
    region: '서울 용산구',
    listingOrTransaction: 'BUY_OFFER',
    collectedAt: '2026-09-15',
    dataConfidence: 'HIGH',
    notes: '딜러 매입 단가 기준 (외관 A급 무흠집)',
  },
  {
    id: 'pr-5',
    source: '당근마켓',
    sourceType: 'MARKETPLACE',
    productId: 'apple-iphone-15-pro',
    model: 'iPhone 15 Pro',
    storage: '256GB',
    conditionGrade: 'S',
    batteryCondition: '배터리 96%',
    price: 1210000,
    currency: 'KRW',
    region: '서울 송파구',
    listingOrTransaction: 'LISTING',
    collectedAt: '2026-09-15',
    dataConfidence: 'HIGH',
    notes: '애플케어플러스 잔여 4개월',
  },
  {
    id: 'pr-6',
    source: '전문 리퍼몰 (리폰)',
    sourceType: 'RETAILER',
    productId: 'apple-iphone-15-pro',
    model: 'iPhone 15 Pro',
    storage: '256GB',
    conditionGrade: 'A',
    batteryCondition: '배터리 90% 이상 보증',
    price: 1190000,
    currency: 'KRW',
    region: '온라인',
    listingOrTransaction: 'SELL_OFFER',
    collectedAt: '2026-09-11',
    dataConfidence: 'HIGH',
    notes: '30일 무상 AS 보증 포함 소매가',
  },

  // Galaxy S24 Ultra 512GB
  {
    id: 'pr-7',
    source: '당근마켓',
    sourceType: 'MARKETPLACE',
    productId: 'samsung-galaxy-s24-ultra',
    model: 'Galaxy S24 Ultra',
    storage: '512GB',
    conditionGrade: 'A',
    price: 1180000,
    currency: 'KRW',
    region: '부산 해운대구',
    listingOrTransaction: 'TRANSACTION',
    collectedAt: '2026-09-08',
    dataConfidence: 'HIGH',
    notes: '자급제, 삼케플 양도 가능, 케이스 착용 사용',
  },
  {
    id: 'pr-8',
    source: '번개장터',
    sourceType: 'MARKETPLACE',
    productId: 'samsung-galaxy-s24-ultra',
    model: 'Galaxy S24 Ultra',
    storage: '512GB',
    conditionGrade: 'A',
    price: 1220000,
    currency: 'KRW',
    region: '전국',
    listingOrTransaction: 'LISTING',
    collectedAt: '2026-09-14',
    dataConfidence: 'HIGH',
    notes: '티타늄 블랙, 미세 실기스 1곳',
  },
  {
    id: 'pr-9',
    source: '도매 유통 단가표 (성동 테크)',
    sourceType: 'WHOLESALER',
    productId: 'samsung-galaxy-s24-ultra',
    model: 'Galaxy S24 Ultra',
    storage: '512GB',
    conditionGrade: 'A',
    price: 1040000,
    currency: 'KRW',
    region: '서울 성동구',
    listingOrTransaction: 'BUY_OFFER',
    collectedAt: '2026-09-13',
    dataConfidence: 'HIGH',
    notes: '수출/내수 B2B 도매 단가',
  },

  // Galaxy Z Flip 5 256GB
  {
    id: 'pr-10',
    source: '당근마켓',
    sourceType: 'MARKETPLACE',
    productId: 'samsung-galaxy-z-flip-5',
    model: 'Galaxy Z Flip 5',
    storage: '256GB',
    conditionGrade: 'A',
    price: 520000,
    currency: 'KRW',
    region: '대구 수성구',
    listingOrTransaction: 'TRANSACTION',
    collectedAt: '2026-09-09',
    dataConfidence: 'HIGH',
    notes: '힌지 깨끗함, 내부 필름 정품 교체 완료',
  },
  {
    id: 'pr-11',
    source: '중고나라',
    sourceType: 'MARKETPLACE',
    productId: 'samsung-galaxy-z-flip-5',
    model: 'Galaxy Z Flip 5',
    storage: '256GB',
    conditionGrade: 'B',
    price: 470000,
    currency: 'KRW',
    region: '인천 연수구',
    listingOrTransaction: 'LISTING',
    collectedAt: '2026-09-15',
    dataConfidence: 'MEDIUM',
    notes: '힌지 찍힘 2곳 있으나 화면 깨끗',
  },

  // iPhone 14 128GB
  {
    id: 'pr-12',
    source: '당근마켓',
    sourceType: 'MARKETPLACE',
    productId: 'apple-iphone-14',
    model: 'iPhone 14',
    storage: '128GB',
    conditionGrade: 'A',
    batteryCondition: '배터리 87%',
    price: 640000,
    currency: 'KRW',
    region: '서울 마포구',
    listingOrTransaction: 'TRANSACTION',
    collectedAt: '2026-09-11',
    dataConfidence: 'HIGH',
  },
  {
    id: 'pr-13',
    source: '번개장터',
    sourceType: 'MARKETPLACE',
    productId: 'apple-iphone-14',
    model: 'iPhone 14',
    storage: '128GB',
    conditionGrade: 'A',
    batteryCondition: '배터리 85%',
    price: 660000,
    currency: 'KRW',
    region: '전국',
    listingOrTransaction: 'LISTING',
    collectedAt: '2026-09-15',
    dataConfidence: 'MEDIUM',
  },
];

// Seed initial sample devices with strictly separated owners and proper condition statuses (No auto-VERIFIED for AI observations)
const INITIAL_DEVICES: Device[] = [
  {
    id: 'dev-1',
    userId: 'user-seller-1',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    canonicalId: 'apple-iphone-15-pro',
    modelNumber: 'A3102',
    storage: '256GB',
    color: '내추럴 티타늄',
    releaseYear: 2023,
    telecom: '자급제',
    imeiHash: '8642****391',
    batteryHealthUserReported: 91,
    conditionGradeEstimated: 'A',
    status: 'REPORT_READY',
    createdAt: '2026-09-14T10:20:00Z',
    updatedAt: '2026-09-15T14:30:00Z',
    askingPrice: 1140000,
    buyPrice: 980000,
    referencePrice: 1150000,
    infoSufficiencyScore: 88,
    shareToken: 'share-sample-ip15p',
    shareExpiresAt: '2026-10-15T00:00:00Z',
    shareIsRevoked: false,
    shareAccessCount: 3,
    images: [
      {
        id: 'img-1',
        deviceId: 'dev-1',
        url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
        angle: 'FRONT',
        uploadedAt: '2026-09-14T10:22:00Z',
        analysisMethod: 'GEMINI_VISION_API',
        isFallback: false,
        qualityAnalysis: {
          score: 95,
          isAcceptable: true,
          issues: [],
          isFallback: false,
        },
        visualObservations: [
          {
            category: 'screen',
            observation: '전면 액정 균열 없음, 강화유리 미부착 상태로 미세 실기스 1곳 관찰됨',
            severity: 'MINOR',
            confidence: 0.92,
            status: 'AI_OBSERVED',
            requiresAdditionalCheck: true,
            checkRecommendation: '흰색 화면에서 번인 잔상 및 터치 감도 실물 확인 필요',
            isFallback: false,
            analysisMethod: 'GEMINI_VISION_API',
          },
        ],
      },
      {
        id: 'img-2',
        deviceId: 'dev-1',
        url: 'https://images.unsplash.com/photo-1695048065059-8ff7c503460d?w=800&auto=format&fit=crop&q=80',
        angle: 'BACK',
        uploadedAt: '2026-09-14T10:23:00Z',
        analysisMethod: 'GEMINI_VISION_API',
        isFallback: false,
        qualityAnalysis: {
          score: 92,
          isAcceptable: true,
          issues: [],
          isFallback: false,
        },
        visualObservations: [
          {
            category: 'back',
            observation: '후면 매트 글래스 상태 양호, 파손 및 변색 없음 관찰',
            severity: 'NONE',
            confidence: 0.95,
            status: 'AI_OBSERVED',
            requiresAdditionalCheck: true,
            isFallback: false,
            analysisMethod: 'GEMINI_VISION_API',
          },
          {
            category: 'camera_lens',
            observation: '3개 렌즈 림 주변 미세 먼지 외 렌즈 긁힘 없음',
            severity: 'NONE',
            confidence: 0.91,
            status: 'AI_OBSERVED',
            requiresAdditionalCheck: true,
            checkRecommendation: '카메라 앱 멍 발생 여부 실물 확인 필요',
            isFallback: false,
            analysisMethod: 'GEMINI_VISION_API',
          },
        ],
      },
      {
        id: 'img-3',
        deviceId: 'dev-1',
        url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
        angle: 'RIGHT',
        uploadedAt: '2026-09-14T10:24:00Z',
        analysisMethod: 'GEMINI_VISION_API',
        isFallback: false,
        qualityAnalysis: {
          score: 84,
          isAcceptable: true,
          issues: ['프레임 우측 하단 반사 일부 존재'],
          recommendedAction: '상단 모서리 부분 가까이 재촬영 권장',
          isFallback: false,
        },
        visualObservations: [
          {
            category: 'frame',
            observation: '티타늄 프레임 우측 상단 모서리에 0.5mm 수준의 미세 찍힘(덴트) 관찰됨',
            severity: 'MINOR',
            confidence: 0.88,
            status: 'AI_OBSERVED',
            requiresAdditionalCheck: true,
            checkRecommendation: '우측 상단 덴트 깊이 직접 확인 권장',
            isFallback: false,
            analysisMethod: 'GEMINI_VISION_API',
          },
        ],
      },
    ],
    // Constitutional Rule: AI observations are NEVER automatically VERIFIED!
    conditions: [
      {
        id: 'display_glass',
        category: 'DISPLAY',
        label: '전면 액정 파손 및 균열',
        status: 'NEEDS_CHECK',
        evidenceSource: 'AI_OBSERVED',
        detail: 'AI 시각 관찰: 전면 유리 파손 없음 관찰 (실물 대면 터치/번인 확인 대기)',
        requiresCheck: true,
        checkReason: '사진만으로 내부 OLED 손상 및 터치 불량을 단정할 수 없으므로 대면 확인 필요',
      },
      {
        id: 'display_scratch',
        category: 'DISPLAY',
        label: '화면 미세 스크래치 및 잔상',
        status: 'NEEDS_CHECK',
        evidenceSource: 'USER_REPORTED',
        detail: '판매자 미세 실기스 1곳 기재. 번인 여부는 OLED 특성상 실기기 흰 화면 확인 필요',
        requiresCheck: true,
        checkReason: '설정 화면 등 흰 배경에서 번인/잔상 여부 확인 권장',
      },
      {
        id: 'frame_dents',
        category: 'EXTERIOR',
        label: '측면 프레임 찍힘 및 도색 벗겨짐',
        status: 'NEEDS_CHECK',
        evidenceSource: 'AI_OBSERVED',
        detail: 'AI가 우측 상단 프레임에 0.5mm 미세 콕 관찰',
        requiresCheck: true,
        checkReason: '사진 각도에 따른 빛 반사 가능성 있으므로 육안 확인 요망',
      },
      {
        id: 'back_glass',
        category: 'EXTERIOR',
        label: '후면 유리 및 패널 파손/기스',
        status: 'NEEDS_CHECK',
        evidenceSource: 'AI_OBSERVED',
        detail: 'AI 시각 관찰: 후면 무광 글래스 파손 미발견 (실물 촉감 확인 권장)',
        requiresCheck: true,
      },
      {
        id: 'camera_lens',
        category: 'CAMERA',
        label: '카메라 렌즈 균열 및 멍',
        status: 'NEEDS_CHECK',
        evidenceSource: 'AI_OBSERVED',
        detail: 'AI 시각 관찰: 트리플 렌즈 표면 크랙 미발견',
        requiresCheck: true,
        checkReason: '카메라 구동 시 내부 센서 멍 유무 확인 필요',
      },
      {
        id: 'battery_health',
        category: 'BATTERY',
        label: '배터리 실제 성능 상태',
        status: 'NEEDS_CHECK',
        evidenceSource: 'USER_REPORTED',
        detail: '판매자 입력 91%. 사진만으로 배터리 성능 확인 불가 (설정 스크린샷 확인 필요)',
        requiresCheck: true,
        checkReason: '설정 > 배터리 > 배터리 성능 상태 증빙 필요',
      },
      {
        id: 'biometrics_face_touch',
        category: 'BIOMETRICS',
        label: '생체인식 (Face ID / 지문인식)',
        status: 'NEEDS_CHECK',
        evidenceSource: 'USER_REPORTED',
        detail: '판매자 Face ID 정상 보고. 사진으로 확인 불가',
        requiresCheck: true,
        checkReason: '직거래 또는 수령 후 Face ID 등록 테스트 필요',
      },
      {
        id: 'repair_history',
        category: 'REPAIR',
        label: '부품 교체 및 사설 수리 이력',
        status: 'NEEDS_CHECK',
        evidenceSource: 'USER_REPORTED',
        detail: '판매자 무수리 보고. 사진만으로 사설 부품 교체 여부 단정 불가',
        requiresCheck: true,
        checkReason: '설정 > 일반 > 정보 > 부품 및 서비스 내역에 알 수 없는 부품 표시 없는지 확인 필요',
      },
    ],
  },
  // Device owned by Dealer
  {
    id: 'dev-2',
    userId: 'user-dealer-1',
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    canonicalId: 'samsung-galaxy-s24-ultra',
    storage: '512GB',
    color: '티타늄 그레이',
    releaseYear: 2024,
    telecom: '자급제',
    batteryHealthUserReported: 98,
    conditionGradeEstimated: 'S',
    status: 'REPORT_READY',
    createdAt: '2026-09-15T09:00:00Z',
    updatedAt: '2026-09-15T11:00:00Z',
    askingPrice: 1200000,
    buyPrice: 1050000,
    referencePrice: 1220000,
    infoSufficiencyScore: 92,
    shareToken: 'share-sample-s24u',
    shareExpiresAt: '2026-10-15T00:00:00Z',
    shareIsRevoked: false,
    shareAccessCount: 1,
    images: [
      {
        id: 'img-4',
        deviceId: 'dev-2',
        url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop&q=80',
        angle: 'FRONT',
        uploadedAt: '2026-09-15T09:10:00Z',
        analysisMethod: 'GEMINI_VISION_API',
        isFallback: false,
        qualityAnalysis: { score: 96, isAcceptable: true, issues: [], isFallback: false },
        visualObservations: [
          {
            category: 'screen',
            observation: '전면 플랫 디스플레이 흠집 없음 관찰, 반사 방지 코팅 유지',
            severity: 'NONE',
            confidence: 0.96,
            status: 'AI_OBSERVED',
            requiresAdditionalCheck: true,
            checkRecommendation: '터치 및 S펜 입력 감도 실물 확인 권장',
            isFallback: false,
            analysisMethod: 'GEMINI_VISION_API',
          },
        ],
      },
    ],
    conditions: [
      {
        id: 'display_glass',
        category: 'DISPLAY',
        label: '전면 액정 파손 및 균열',
        status: 'NEEDS_CHECK',
        evidenceSource: 'AI_OBSERVED',
        detail: 'AI 시각 관찰: 파손 없음',
        requiresCheck: true,
      },
      {
        id: 'frame_dents',
        category: 'EXTERIOR',
        label: '측면 프레임 찍힘 및 도색 벗겨짐',
        status: 'NEEDS_CHECK',
        evidenceSource: 'AI_OBSERVED',
        detail: 'AI 시각 관찰: 티타늄 프레임 무흠집',
        requiresCheck: true,
      },
      {
        id: 'battery_health',
        category: 'BATTERY',
        label: '배터리 실제 성능 상태',
        status: 'NEEDS_CHECK',
        evidenceSource: 'USER_REPORTED',
        detail: '삼성 멤버스 배터리 진단 정상 (사진 확인 불가)',
        requiresCheck: true,
      },
    ],
  },
  // Additional Dealer Inventory Device
  {
    id: 'dev-3',
    userId: 'user-dealer-1',
    brand: 'Apple',
    model: 'iPhone 14 Pro',
    canonicalId: 'apple-iphone-14-pro',
    storage: '128GB',
    color: '딥 퍼플',
    releaseYear: 2022,
    telecom: 'KT',
    batteryHealthUserReported: 87,
    conditionGradeEstimated: 'A',
    status: 'REPORT_READY',
    createdAt: '2026-09-13T11:00:00Z',
    updatedAt: '2026-09-14T09:30:00Z',
    askingPrice: 890000,
    buyPrice: 760000,
    referencePrice: 910000,
    infoSufficiencyScore: 82,
    shareToken: 'share-sample-ip14p',
    shareExpiresAt: '2026-10-10T00:00:00Z',
    shareIsRevoked: false,
    shareAccessCount: 5,
    images: [],
    conditions: [
      {
        id: 'display_glass',
        category: 'DISPLAY',
        label: '전면 액정 파손 및 균열',
        status: 'NEEDS_CHECK',
        evidenceSource: 'USER_REPORTED',
        detail: '판매자 정상 보고',
        requiresCheck: true,
      },
    ],
  },
  // Exporter Batch Device
  {
    id: 'dev-4',
    userId: 'user-exporter-1',
    brand: 'Samsung',
    model: 'Galaxy S23',
    canonicalId: 'samsung-galaxy-s23',
    storage: '256GB',
    color: '팬텀 블랙',
    releaseYear: 2023,
    telecom: '자급제',
    batteryHealthUserReported: 90,
    conditionGradeEstimated: 'B',
    status: 'ANALYZED',
    createdAt: '2026-09-12T15:00:00Z',
    updatedAt: '2026-09-13T18:00:00Z',
    askingPrice: 580000,
    buyPrice: 480000,
    referencePrice: 590000,
    infoSufficiencyScore: 78,
    shareToken: 'share-sample-s23',
    shareExpiresAt: '2026-10-05T00:00:00Z',
    shareIsRevoked: false,
    shareAccessCount: 2,
    images: [],
    conditions: [
      {
        id: 'display_glass',
        category: 'DISPLAY',
        label: '전면 액정 파손 및 균열',
        status: 'NEEDS_CHECK',
        evidenceSource: 'USER_REPORTED',
        detail: '수출 검수 대기 중',
        requiresCheck: true,
      },
    ],
  },
];

class MemoryStore {
  private users: Map<string, UserProfile> = new Map();
  private devices: Map<string, Device> = new Map();
  private priceRecords: PriceRecord[] = [];
  private reports: Map<string, TransactionReport> = new Map();
  private shareAccessLogs: ShareAccessLog[] = [];
  private auditLogs: Array<{
    id: string;
    action: string;
    timestamp: string;
    deviceId?: string;
    meta?: any;
  }> = [];

  constructor() {
    this.initDefaultData();
    // Attempt to load from persistent disk file
    const loaded = this.loadFromDisk();
    if (!loaded) {
      this.saveToDisk();
    }
  }

  private initDefaultData() {
    // Default user profiles for testing roles
    this.users.set('user-seller-1', {
      id: 'user-seller-1',
      name: '김민수 (개인 판매자)',
      email: 'seller@example.com',
      role: 'SELLER',
      subscriptionTier: 'BASIC',
      monthlyAnalysisCount: 4,
      monthlyQuota: 30,
    });
    this.users.set('user-dealer-1', {
      id: 'user-dealer-1',
      name: '강남 모바일 유통 (딜러)',
      email: 'dealer@example.com',
      role: 'DEALER',
      subscriptionTier: 'PRO',
      monthlyAnalysisCount: 42,
      monthlyQuota: 120,
    });
    this.users.set('user-exporter-1', {
      id: 'user-exporter-1',
      name: '동남아 무역상사 (수출업자)',
      email: 'export@example.com',
      role: 'EXPORTER',
      subscriptionTier: 'ENTERPRISE',
      monthlyAnalysisCount: 215,
      monthlyQuota: 9999,
    });
    this.users.set('user-admin-1', {
      id: 'user-admin-1',
      name: '시스템 최고 관리자',
      email: 'admin@phonecheck.ai',
      role: 'ADMIN',
      subscriptionTier: 'ENTERPRISE',
      monthlyAnalysisCount: 999,
      monthlyQuota: 99999,
    });

    // Seed devices
    for (const dev of INITIAL_DEVICES) {
      this.devices.set(dev.id, dev);
    }

    // Seed price records
    this.priceRecords = [...INITIAL_PRICE_RECORDS];
  }

  /**
   * Persists the current database state to disk for durability (Requirement 10)
   */
  public saveToDisk(): void {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const dbPath = path.join(dataDir, 'database.json');
      const payload = {
        users: Array.from(this.users.values()),
        devices: Array.from(this.devices.values()),
        priceRecords: this.priceRecords,
        reports: Array.from(this.reports.values()),
        auditLogs: this.auditLogs,
        shareAccessLogs: this.shareAccessLogs,
        savedAt: new Date().toISOString(),
      };
      fs.writeFileSync(dbPath, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  /**
   * Loads state from disk on startup
   */
  private loadFromDisk(): boolean {
    try {
      const dbPath = path.join(process.cwd(), 'data', 'database.json');
      if (!fs.existsSync(dbPath)) return false;
      const raw = fs.readFileSync(dbPath, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.users) && data.users.length > 0) {
        this.users.clear();
        for (const u of data.users) this.users.set(u.id, u);
      }
      if (Array.isArray(data.devices) && data.devices.length > 0) {
        this.devices.clear();
        for (const d of data.devices) this.devices.set(d.id, d);
      }
      if (Array.isArray(data.priceRecords) && data.priceRecords.length > 0) {
        this.priceRecords = data.priceRecords;
      }
      if (Array.isArray(data.reports)) {
        this.reports.clear();
        for (const r of data.reports) this.reports.set(r.deviceId, r);
      }
      if (Array.isArray(data.auditLogs)) {
        this.auditLogs = data.auditLogs;
      }
      if (Array.isArray(data.shareAccessLogs)) {
        this.shareAccessLogs = data.shareAccessLogs;
      }
      return true;
    } catch (err) {
      console.error('Failed to load database from disk:', err);
      return false;
    }
  }

  getUser(userId: string): UserProfile | undefined {
    return this.users.get(userId) || this.users.get('user-seller-1');
  }

  getAllUsers(): UserProfile[] {
    return Array.from(this.users.values());
  }

  updateUserRole(userId: string, role: UserProfile['role']): UserProfile {
    const user = this.getUser(userId);
    if (user) {
      user.role = role;
      this.users.set(user.id, user);
      this.saveToDisk();
      return user;
    }
    const newUser: UserProfile = {
      id: userId,
      name: '사용자',
      email: 'user@example.com',
      role,
      subscriptionTier: 'BASIC',
      monthlyAnalysisCount: 1,
      monthlyQuota: 30,
    };
    this.users.set(userId, newUser);
    this.saveToDisk();
    return newUser;
  }

  /**
   * Returns devices with strict multi-user tenant data isolation (Requirement 10)
   * Admin role can view all devices; standard users can ONLY view their own devices.
   */
  getDevices(userId?: string, role?: string): Device[] {
    const list = Array.from(this.devices.values());
    if (role === 'ADMIN') {
      return list;
    }
    if (userId) {
      return list.filter((d) => d.userId === userId);
    }
    return [];
  }

  getDevice(id: string): Device | undefined {
    return this.devices.get(id);
  }

  getDeviceByShareToken(token: string): Device | undefined {
    return Array.from(this.devices.values()).find((d) => d.shareToken === token);
  }

  createDevice(dev: Omit<Device, 'id' | 'createdAt' | 'updatedAt' | 'conditions' | 'images' | 'infoSufficiencyScore'>): Device {
    const id = `dev-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const newDevice: Device = {
      ...dev,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'DRAFT',
      images: [],
      conditions: JSON.parse(JSON.stringify(DEFAULT_CONDITION_ITEMS)),
      infoSufficiencyScore: 40, // Base default
      shareToken: `share-${Math.random().toString(36).substring(2, 10)}`,
      shareExpiresAt: expiresAt,
      shareIsRevoked: false,
      shareAccessCount: 0,
    };
    this.devices.set(id, newDevice);
    this.logAction('CREATE_DEVICE', id, { model: newDevice.model, userId: newDevice.userId });
    this.saveToDisk();
    return newDevice;
  }

  updateDevice(id: string, updates: Partial<Device>): Device | undefined {
    const dev = this.devices.get(id);
    if (!dev) return undefined;

    const updated: Device = {
      ...dev,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate sufficiency score
    updated.infoSufficiencyScore = this.calculateSufficiencyScore(updated);

    this.devices.set(id, updated);
    this.logAction('UPDATE_DEVICE', id);
    this.saveToDisk();
    return updated;
  }

  deleteDevice(id: string): boolean {
    const deleted = this.devices.delete(id);
    if (deleted) {
      this.logAction('DELETE_DEVICE', id);
      this.saveToDisk();
    }
    return deleted;
  }

  addDeviceImage(deviceId: string, image: Omit<DeviceImage, 'id' | 'deviceId' | 'uploadedAt'>): DeviceImage | undefined {
    const dev = this.devices.get(deviceId);
    if (!dev) return undefined;

    const newImg: DeviceImage = {
      ...image,
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      deviceId,
      uploadedAt: new Date().toISOString(),
    };

    dev.images.push(newImg);
    dev.infoSufficiencyScore = this.calculateSufficiencyScore(dev);
    dev.updatedAt = new Date().toISOString();
    this.devices.set(deviceId, dev);
    this.saveToDisk();
    return newImg;
  }

  deleteDeviceImage(deviceId: string, imageId: string): boolean {
    const dev = this.devices.get(deviceId);
    if (!dev) return false;
    const initialLen = dev.images.length;
    dev.images = dev.images.filter((img) => img.id !== imageId);
    if (dev.images.length !== initialLen) {
      dev.infoSufficiencyScore = this.calculateSufficiencyScore(dev);
      dev.updatedAt = new Date().toISOString();
      this.devices.set(deviceId, dev);
      this.saveToDisk();
      return true;
    }
    return false;
  }

  updateConditionItem(deviceId: string, itemId: string, updates: Partial<ConditionItem>): Device | undefined {
    const dev = this.devices.get(deviceId);
    if (!dev) return undefined;

    const idx = dev.conditions.findIndex((c) => c.id === itemId);
    if (idx >= 0) {
      dev.conditions[idx] = { ...dev.conditions[idx], ...updates };
    } else {
      // create new
      dev.conditions.push({
        id: itemId,
        category: 'EXTERIOR',
        label: itemId,
        status: 'USER_REPORTED' as any,
        evidenceSource: 'USER_REPORTED',
        detail: '',
        requiresCheck: true,
        ...updates,
      });
    }

    dev.infoSufficiencyScore = this.calculateSufficiencyScore(dev);
    dev.updatedAt = new Date().toISOString();
    this.devices.set(deviceId, dev);
    this.saveToDisk();
    return dev;
  }

  // Share Token Lifecycle Management (Requirement 8)
  generateShareToken(deviceId: string, validityDays = 7): Device | undefined {
    const dev = this.devices.get(deviceId);
    if (!dev) return undefined;
    const token = `share-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString();
    dev.shareToken = token;
    dev.shareExpiresAt = expiresAt;
    dev.shareIsRevoked = false;
    dev.updatedAt = new Date().toISOString();
    this.devices.set(deviceId, dev);
    this.logAction('GENERATE_SHARE_TOKEN', deviceId, { token, expiresAt });
    this.saveToDisk();
    return dev;
  }

  revokeShareToken(deviceId: string): Device | undefined {
    const dev = this.devices.get(deviceId);
    if (!dev) return undefined;
    dev.shareIsRevoked = true;
    dev.updatedAt = new Date().toISOString();
    this.devices.set(deviceId, dev);
    this.logAction('REVOKE_SHARE_TOKEN', deviceId);
    this.saveToDisk();
    return dev;
  }

  recordShareAccess(shareToken: string, meta: { ip?: string; userAgent?: string }): { valid: boolean; error?: string; status: number; device?: Device } {
    const dev = Array.from(this.devices.values()).find((d) => d.shareToken === shareToken);
    if (!dev) {
      return { valid: false, status: 404, error: '존재하지 않거나 삭제된 공유 리포트 링크입니다.' };
    }
    if (dev.shareIsRevoked) {
      return { valid: false, status: 410, error: '판매자에 의해 취소(비활성화)된 공유 리포트 링크입니다.' };
    }
    if (dev.shareExpiresAt && new Date(dev.shareExpiresAt).getTime() < Date.now()) {
      return { valid: false, status: 410, error: '공유 링크 유효기간이 만료되었습니다. 판매자에게 새로운 공유 링크를 요청하세요.' };
    }

    // Record access log
    const log: ShareAccessLog = {
      id: `sal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      deviceId: dev.id,
      shareToken,
      accessedAt: new Date().toISOString(),
      ip: meta.ip || '127.0.0.1',
      userAgent: meta.userAgent || 'Unknown',
    };
    this.shareAccessLogs.unshift(log);
    if (this.shareAccessLogs.length > 500) this.shareAccessLogs.pop();

    dev.shareAccessCount = (dev.shareAccessCount || 0) + 1;
    this.devices.set(dev.id, dev);
    this.saveToDisk();

    return { valid: true, status: 200, device: dev };
  }

  getShareAccessLogs(deviceId: string): ShareAccessLog[] {
    return this.shareAccessLogs.filter((l) => l.deviceId === deviceId);
  }

  // Price Records
  getPriceRecords(productId?: string, model?: string, storage?: string): PriceRecord[] {
    let list = [...this.priceRecords];
    if (productId) {
      const matchProduct = list.filter((r) => r.productId === productId);
      if (matchProduct.length > 0) list = matchProduct;
    }
    if (model) {
      const matchModel = list.filter((r) => r.model.toLowerCase().includes(model.toLowerCase()));
      if (matchModel.length > 0) list = matchModel;
    }
    if (storage) {
      const matchStorage = list.filter((r) => r.storage === storage);
      if (matchStorage.length > 0) list = matchStorage;
    }
    return list;
  }

  getAllPriceRecords(): PriceRecord[] {
    return this.priceRecords;
  }

  addPriceRecord(record: Omit<PriceRecord, 'id' | 'collectedAt'> & { collectedAt?: string }): PriceRecord {
    const collectedAt = record.collectedAt || new Date().toISOString().split('T')[0];
    const expiresAt = record.expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const newRecord: PriceRecord = {
      ...record,
      id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      collectedAt,
      expiresAt,
      isStale: false,
    };
    this.priceRecords.unshift(newRecord);
    this.logAction('ADD_PRICE_RECORD', undefined, { model: record.model, price: record.price });
    this.saveToDisk();
    return newRecord;
  }

  // Reports
  saveReport(report: TransactionReport): void {
    this.reports.set(report.deviceId, report);
    this.saveToDisk();
  }

  getReport(deviceId: string): TransactionReport | undefined {
    return this.reports.get(deviceId);
  }

  // Admin Stats
  getAdminStats(): AdminStats {
    const totalDevices = this.devices.size;
    const completedAnalyses = Array.from(this.devices.values()).filter(
      (d) => d.status === 'REPORT_READY' || d.status === 'ANALYZED'
    ).length;

    return {
      totalUsers: this.users.size + 140,
      activeUsers: 89,
      paidUsers: 34,
      totalDevices,
      completedAnalyses,
      aiApiCallCount: 384,
      estimatedAiCostUsd: 1.92,
      priceRecordCount: this.priceRecords.length,
      mrrKrw: 1690000,
    };
  }

  private calculateSufficiencyScore(dev: Device): number {
    let score = 20; // base registered info
    if (dev.storage) score += 10;
    if (dev.color) score += 5;
    if (dev.telecom) score += 5;

    // Photos uploaded
    const photoCount = dev.images.length;
    score += Math.min(photoCount * 10, 30);

    // Conditions verified or reported
    const nonUnknownConditions = dev.conditions.filter((c) => c.status !== 'UNKNOWN').length;
    score += Math.min(nonUnknownConditions * 3, 20);

    // Price details provided
    if (dev.askingPrice) score += 5;
    if (dev.buyPrice) score += 5;

    return Math.min(score, 100);
  }

  private logAction(action: string, deviceId?: string, meta?: any) {
    this.auditLogs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      deviceId,
      meta,
      timestamp: new Date().toISOString(),
    });
    if (this.auditLogs.length > 500) this.auditLogs.pop();
  }
}

export const store = new MemoryStore();
