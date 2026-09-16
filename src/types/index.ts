/**
 * PhoneCheck AI - Domain Types and Contracts
 * AI 기반 중고폰 상태·가격 검증 플랫폼
 */

export type UserRole = 'SELLER' | 'DEALER' | 'EXPORTER' | 'BUYER';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  subscriptionTier: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  monthlyAnalysisCount: number;
  monthlyQuota: number;
}

export type ItemStatus = 'VERIFIED' | 'NEEDS_CHECK' | 'UNKNOWN';

export type EvidenceSource = 'USER_REPORTED' | 'AI_OBSERVED' | 'DEVICE_DIAGNOSTIC';

export interface ConditionItem {
  id: string;
  category: 'EXTERIOR' | 'DISPLAY' | 'CAMERA' | 'AUDIO' | 'BIOMETRICS' | 'BATTERY' | 'CONNECTIVITY' | 'REPAIR';
  label: string;
  status: ItemStatus;
  evidenceSource: EvidenceSource;
  detail: string;
  requiresCheck: boolean;
  checkReason?: string;
  verifiedAt?: string;
}

export interface DeviceImage {
  id: string;
  deviceId: string;
  url: string;
  angle: 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM' | 'CAMERA_MODULE' | 'SCREEN_ON' | 'OTHER';
  uploadedAt: string;
  qualityAnalysis?: PhotoQualityResult;
  visualObservations?: VisualObservation[];
}

export interface PhotoQualityResult {
  score: number; // 0 to 100
  isAcceptable: boolean;
  issues: string[]; // e.g. "조명 어두움", "초점 흐림", "반사 심함", "화면 상단 가려짐"
  recommendedAction?: string; // e.g. "프레임 우측 상단을 가까이 촬영해 주세요."
}

export interface VisualObservation {
  category: 'screen' | 'frame' | 'back' | 'camera_lens' | 'ports' | 'general';
  observation: string;
  severity: 'NONE' | 'MINOR' | 'MODERATE' | 'SEVERE';
  confidence: number;
  status: 'AI_OBSERVED';
  requiresAdditionalCheck: boolean;
  checkRecommendation?: string;
}

export type PriceSourceType =
  | 'MARKETPLACE'
  | 'RETAILER'
  | 'WHOLESALER'
  | 'EXPORT'
  | 'USER_INPUT'
  | 'PARTNER';

export type ListingOrTransaction =
  | 'LISTING'
  | 'TRANSACTION'
  | 'BUY_OFFER'
  | 'SELL_OFFER';

export interface PriceRecord {
  id: string;
  source: string; // e.g. "당근마켓", "번개장터", "제휴 도매상 A", "사용자 등록", "중고나라"
  sourceType: PriceSourceType;
  productId: string;
  model: string;
  storage: string;
  conditionGrade: 'S' | 'A' | 'B' | 'C';
  batteryCondition?: string;
  price: number;
  currency: 'KRW';
  region?: string;
  listingOrTransaction: ListingOrTransaction;
  collectedAt: string;
  sourceUrl?: string;
  dataConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
}

export interface PriceAnalysisResult {
  deviceId: string;
  analysisStatus: 'SUFFICIENT' | 'LIMITED' | 'INSUFFICIENT_DATA';
  marketPriceMin: number;
  marketPriceMax: number;
  marketPriceMedian: number;
  currentListingPrice: number;
  buyPrice?: number;
  relativePosition: 'BELOW_MARKET' | 'WITHIN_MARKET' | 'ABOVE_MARKET' | 'UNKNOWN';
  priceConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';
  comparisonCount: number;
  referenceDate: string;
  sourcesUsed: string[];
  hasTransactionPrices: boolean;
  aiPriceJudgement: string; // strict non-hype wording
  notes: string[];
  marginEstimate?: {
    buyPrice: number;
    expectedSellPrice: number;
    grossMargin: number;
    marginPercent: number;
  };
}

export interface Device {
  id: string;
  userId: string;
  brand: string; // Apple, Samsung, etc.
  model: string; // iPhone 15 Pro, Galaxy S24 Ultra, etc.
  canonicalId: string; // iphone-15-pro-256
  modelNumber?: string;
  storage: string; // 128GB, 256GB, 512GB, 1TB
  color: string;
  releaseYear: number;
  telecom?: string; // SKT, KT, LGU+, 자급제
  imeiHash?: string; // One-way hash or masked
  batteryHealthUserReported?: number; // e.g. 88
  conditionGradeEstimated?: 'S' | 'A' | 'B' | 'C';
  status: 'DRAFT' | 'ANALYZING' | 'ANALYZED' | 'REPORT_READY';
  createdAt: string;
  updatedAt: string;
  askingPrice?: number;
  buyPrice?: number;
  referencePrice?: number;
  images: DeviceImage[];
  conditions: ConditionItem[];
  infoSufficiencyScore: number; // 0-100 (상태 정보 충족도)
  shareToken?: string;
}

export interface TransactionReport {
  id: string;
  deviceId: string;
  reportNumber: string;
  createdAt: string;
  deviceSummary: {
    brand: string;
    model: string;
    storage: string;
    color: string;
    releaseYear: number;
    telecom: string;
  };
  conditionSummary: {
    sufficiencyScore: number;
    verifiedItems: string[];
    needsCheckItems: string[];
    unknownItems: string[];
    batteryNote: string;
    repairNote: string;
  };
  aiImageAnalysis: {
    photoCount: number;
    qualityPassed: boolean;
    observedIssues: string[];
    unverifiedAngles: string[];
  };
  marketPriceAnalysis: {
    analysisStatus: 'SUFFICIENT' | 'LIMITED' | 'INSUFFICIENT_DATA';
    priceRangeText: string;
    currentPriceText: string;
    relativePositionText: string;
    dataCount: number;
    dataConfidence: string;
    referenceDate: string;
    disclaimer: string;
  };
  riskAndCheckPoints: string[];
  finalSummaryStatement: string;
  legalDisclaimer: string;
  shareToken: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  paidUsers: number;
  totalDevices: number;
  completedAnalyses: number;
  aiApiCallCount: number;
  estimatedAiCostUsd: number;
  priceRecordCount: number;
  mrrKrw: number;
}
