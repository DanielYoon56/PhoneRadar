import { GoogleGenAI, Type } from '@google/genai';
import { Device, PhotoQualityResult, VisualObservation } from '../src/types/index.js';

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface AiVisionAnalysisResult {
  photoQuality: PhotoQualityResult;
  observations: VisualObservation[];
  needsCheckItems: string[];
  unknownItems: string[];
  recommendedAngles: string[];
  summaryNote: string;
  analysisMethod: 'GEMINI_VISION_API' | 'RULE_BASED_FALLBACK';
  isFallback: boolean;
  modelUsed: string;
}

/**
 * Analyzes device photos with Gemini Vision API
 * Follows strict anti-hallucination rules (No battery guessing, no internal hardware claims)
 */
export async function analyzeDeviceImageWithGemini(
  device: Device,
  imageBase64OrUrl: string,
  angle: string
): Promise<AiVisionAnalysisResult> {
  const client = getAiClient();

  // If Gemini API Key is not provided or image is a dummy placeholder, provide a deterministic structured fallback
  if (!client || !imageBase64OrUrl || imageBase64OrUrl.startsWith('http')) {
    return generateStructuredFallbackAnalysis(device, angle);
  }

  try {
    const isBase64 = imageBase64OrUrl.includes('base64,');
    const mimeType = isBase64
      ? imageBase64OrUrl.substring(imageBase64OrUrl.indexOf(':') + 1, imageBase64OrUrl.indexOf(';'))
      : 'image/jpeg';
    const cleanBase64 = isBase64 ? imageBase64OrUrl.split('base64,')[1] : imageBase64OrUrl;

    const prompt = `You are the specialized AI Vision Inspector for "PhoneCheck AI", a used phone condition verification platform.

CRITICAL NON-NEGOTIABLE CONSTITUTIONAL RULES:
1. NEVER guess or estimate internal hardware defects (e.g. motherboard, water damage, logic board).
2. NEVER guess or claim battery health % from exterior appearance.
3. NEVER claim repair or genuine part history from photos alone.
4. Only inspect visible exterior surfaces: screen glass, frame edges, back glass, camera lens surfaces, charging port exterior.
5. Inspect photo quality: blur, darkness, reflections/glare, cropped angles, obstructed parts.
6. Clearly output what can be observed vs what CANNOT be observed and requires in-person check.

DEVICE CONTEXT:
- Brand: ${device.brand}
- Model: ${device.model} (${device.storage})
- Angle of this photo: ${angle}

Return valid JSON adhering strictly to the response schema.`;

    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            photoQuality: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.INTEGER, description: 'Photo quality score from 0 to 100' },
                isAcceptable: { type: Type.BOOLEAN },
                issues: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of photo quality issues like darkness, glare, blur, cropped edges',
                },
                recommendedAction: {
                  type: Type.STRING,
                  description: 'Specific advice for taking a better photo or close-up if needed',
                },
              },
              required: ['score', 'isAcceptable', 'issues'],
            },
            observations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: {
                    type: Type.STRING,
                    description: 'screen, frame, back, camera_lens, ports, or general',
                  },
                  observation: { type: Type.STRING, description: 'Objective visual observation in Korean' },
                  severity: {
                    type: Type.STRING,
                    description: 'NONE, MINOR, MODERATE, or SEVERE',
                  },
                  confidence: { type: Type.NUMBER, description: 'Confidence between 0 and 1' },
                  requiresAdditionalCheck: { type: Type.BOOLEAN },
                  checkRecommendation: { type: Type.STRING },
                },
                required: ['category', 'observation', 'severity', 'confidence', 'requiresAdditionalCheck'],
              },
            },
            needsCheckItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Items that need further user test or physical check (e.g. OLED burn-in, Face ID, buttons)',
            },
            unknownItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Items completely impossible to verify from this photo (battery health %, water damage, internal faults)',
            },
            recommendedAngles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Next angles needed to complete full condition inspection',
            },
            summaryNote: {
              type: Type.STRING,
              description: 'Brief objective visual summary in Korean',
            },
          },
          required: ['photoQuality', 'observations', 'needsCheckItems', 'unknownItems', 'summaryNote'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    return {
      photoQuality: {
        score: parsed.photoQuality?.score || 85,
        isAcceptable: parsed.photoQuality?.isAcceptable ?? true,
        issues: parsed.photoQuality?.issues || [],
        recommendedAction: parsed.photoQuality?.recommendedAction,
        isFallback: false,
      },
      observations: (parsed.observations || []).map((o: any) => ({
        category: o.category || 'general',
        observation: o.observation || '외관 특이사항 없음',
        severity: o.severity || 'NONE',
        confidence: o.confidence || 0.85,
        status: 'AI_OBSERVED',
        requiresAdditionalCheck: !!o.requiresAdditionalCheck,
        checkRecommendation: o.checkRecommendation,
        isFallback: false,
        analysisMethod: 'GEMINI_VISION_API',
      })),
      needsCheckItems: parsed.needsCheckItems || [
        'OLED 백색 화면 잔상(번인) 확인',
        '버튼 클릭감 및 충전 단자 유격',
      ],
      unknownItems: parsed.unknownItems || [
        '사진만으로 배터리 실제 성능 % 확인 불가',
        '침수 여부 및 내부 부품 교체 이력 확인 불가',
      ],
      recommendedAngles: parsed.recommendedAngles || ['전면 화면', '후면 전체', '측면 모서리'],
      summaryNote: parsed.summaryNote || '사진 상 외관 관찰이 완료되었습니다.',
      analysisMethod: 'GEMINI_VISION_API',
      isFallback: false,
      modelUsed: 'gemini-2.5-flash',
    };
  } catch (err) {
    console.error('Gemini vision analysis failed, falling back to rule-based analysis:', err);
    return generateStructuredFallbackAnalysis(device, angle);
  }
}

/**
 * Deterministic fallback that strictly adheres to the platform constitution.
 * Explicitly separated from actual Gemini vision observations so buyers and users are never misled.
 */
function generateStructuredFallbackAnalysis(device: Device, angle: string): AiVisionAnalysisResult {
  const isFront = angle === 'FRONT' || angle === 'SCREEN_ON';
  const isBack = angle === 'BACK';
  const isFrame = angle === 'LEFT' || angle === 'RIGHT' || angle === 'TOP' || angle === 'BOTTOM';

  const observations: VisualObservation[] = [];

  if (isFront) {
    observations.push({
      category: 'screen',
      observation: '[규칙기반 대체추정] 전면 액정 글래스 파손 없음 추정 (실제 Vision 관찰 아님 - 실물 확인 필수)',
      severity: 'NONE',
      confidence: 0.7,
      status: 'AI_OBSERVED',
      requiresAdditionalCheck: true,
      checkRecommendation: '흰색 화면을 띄워 OLED 잔상(번인) 및 백화 여부 확인 권장',
      isFallback: true,
      analysisMethod: 'RULE_BASED_FALLBACK',
    });
  } else if (isBack) {
    observations.push({
      category: 'back',
      observation: '[규칙기반 대체추정] 후면 패널 균열 및 파손 미발견 추정 (실제 Vision 관찰 아님)',
      severity: 'NONE',
      confidence: 0.7,
      status: 'AI_OBSERVED',
      requiresAdditionalCheck: true,
      isFallback: true,
      analysisMethod: 'RULE_BASED_FALLBACK',
    });
    observations.push({
      category: 'camera_lens',
      observation: '[규칙기반 대체추정] 카메라 렌즈 표면 크랙 없음 추정',
      severity: 'NONE',
      confidence: 0.7,
      status: 'AI_OBSERVED',
      requiresAdditionalCheck: true,
      checkRecommendation: '카메라 앱 구동 시 멍 또는 초점 불량 여부 확인 필요',
      isFallback: true,
      analysisMethod: 'RULE_BASED_FALLBACK',
    });
  } else if (isFrame) {
    observations.push({
      category: 'frame',
      observation: '[규칙기반 대체추정] 측면 프레임 테두리 모서리 미세 스크래치 가능성',
      severity: 'MINOR',
      confidence: 0.7,
      status: 'AI_OBSERVED',
      requiresAdditionalCheck: true,
      checkRecommendation: '모서리 4방향 실물 육안 점검 필요',
      isFallback: true,
      analysisMethod: 'RULE_BASED_FALLBACK',
    });
  } else {
    observations.push({
      category: 'general',
      observation: '[규칙기반 대체추정] 일반 외관 표준 기준 적용',
      severity: 'NONE',
      confidence: 0.65,
      status: 'AI_OBSERVED',
      requiresAdditionalCheck: true,
      isFallback: true,
      analysisMethod: 'RULE_BASED_FALLBACK',
    });
  }

  return {
    photoQuality: {
      score: 85,
      isAcceptable: true,
      issues: ['오프라인 기본 규칙 적용됨 (Gemini Vision 미호출/대체)'],
      recommendedAction: '실제 AI 비전 정밀 판정을 위해 조명이 균일한 환경에서 다시 분석을 실행할 수 있습니다.',
      isFallback: true,
    },
    observations,
    needsCheckItems: [
      '디스플레이 흰 화면에서 OLED 잔상(번인) 유무',
      'Face ID / 지문인식 등록 테스트',
      '설정 > 배터리 성능 최대치 수치 확인',
    ],
    unknownItems: [
      '사진만으로 배터리 실제 수명 % 확인 불가',
      '침수 및 메인보드 내부 부품 상태 확인 불가',
      '사설 수리 및 정품 부품 교체 이력 사진 판정 불가',
    ],
    recommendedAngles: ['전면 액정 정면', '후면 전체', '상하좌우 측면 프레임', '카메라 렌즈 근접'],
    summaryNote:
      '[규칙 기반 대체 추정 결과] Gemini Vision 모델 미호출 또는 오류로 인한 오프라인 기본 규칙 추정치입니다. 실제 AI 비전 관찰 결과와 구분되며, 대면 실물 확인이 필수적입니다.',
    analysisMethod: 'RULE_BASED_FALLBACK',
    isFallback: true,
    modelUsed: 'heuristic-rule-engine-v1',
  };
}

