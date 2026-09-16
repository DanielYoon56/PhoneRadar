import React, { useState } from 'react';
import {
  X,
  Smartphone,
  CheckCircle2,
  Camera,
  Coins,
  ArrowRight,
  ArrowLeft,
  Upload,
  AlertCircle,
} from 'lucide-react';
import { CANONICAL_MODELS, resolveCanonicalModel } from '../config/appConfig.js';
import { api } from '../services/api.js';
import { Device } from '../types/index.js';

interface NewDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (device: Device) => void;
}

export const NewDeviceModal: React.FC<NewDeviceModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [brand, setBrand] = useState('Apple');
  const [modelInput, setModelInput] = useState('iPhone 15 Pro');
  const [storage, setStorage] = useState('256GB');
  const [color, setColor] = useState('내추럴 티타늄');
  const [releaseYear, setReleaseYear] = useState(2023);
  const [telecom, setTelecom] = useState('자급제');

  // Condition input
  const [batteryHealthReported, setBatteryHealthReported] = useState<number | ''>(91);
  const [screenCrackReported, setScreenCrackReported] = useState<'NONE' | 'SCRATCH' | 'CRACK'>('NONE');
  const [repairHistoryReported, setRepairHistoryReported] = useState<'NONE' | 'OFFICIAL' | 'THIRD_PARTY'>('NONE');

  // Price setup
  const [askingPrice, setAskingPrice] = useState<number | ''>(1140000);
  const [buyPrice, setBuyPrice] = useState<number | ''>(980000);
  const [referencePrice, setReferencePrice] = useState<number | ''>(1150000);

  // Photos
  const [photos, setPhotos] = useState<Array<{ url: string; angle: string }>>([
    {
      url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
      angle: 'FRONT',
    },
    {
      url: 'https://images.unsplash.com/photo-1695048065059-8ff7c503460d?w=800&auto=format&fit=crop&q=80',
      angle: 'BACK',
    },
  ]);

  if (!isOpen) return null;

  const handleSelectPredefinedModel = (m: (typeof CANONICAL_MODELS)[0]) => {
    setBrand(m.brand);
    setModelInput(m.model);
    setStorage(m.storages[0]);
    setColor(m.colors[0]);
    setReleaseYear(m.releaseYear);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, angle: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('사진 파일 용량은 10MB 이하만 지원됩니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotos((prev) => [...prev, { url: reader.result as string, angle }]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create device record
      const created = await api.createDevice({
        brand,
        model: modelInput,
        storage,
        color,
        releaseYear: Number(releaseYear),
        telecom,
        askingPrice: askingPrice !== '' ? Number(askingPrice) : undefined,
        buyPrice: buyPrice !== '' ? Number(buyPrice) : undefined,
        referencePrice: referencePrice !== '' ? Number(referencePrice) : undefined,
        batteryHealthUserReported: batteryHealthReported !== '' ? Number(batteryHealthReported) : undefined,
      });

      // Step 2: Upload and run AI vision on provided photos
      let updatedDevice = created;
      for (const p of photos) {
        try {
          const res = await api.uploadPhoto(created.id, p.url, p.angle);
          updatedDevice = res.device;
        } catch (photoErr) {
          console.error('Photo analysis error:', photoErr);
        }
      }

      onCreated(updatedDevice);
      onClose();
    } catch (err: any) {
      setError(err.message || '기기 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 text-white">
                STEP {step} / 4
              </span>
              <h2 className="text-lg font-bold text-slate-900">새 중고폰 검증 등록</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === 1 && '기기 모델 및 기본 식별 정보 입력 (자동 정규화)'}
              {step === 2 && '판매자 자가 상태 입력 (AI 관찰 결과와 별도 관리)'}
              {step === 3 && '기기 외관 사진 업로드 (AI 사진 품질 및 외관 검사)'}
              {step === 4 && '가격 설정 및 거래 판단 지표 확인'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: 기기 식별 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  주요 기종 원클릭 선택 (Canonical 매핑)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CANONICAL_MODELS.slice(0, 4).map((m) => (
                    <button
                      key={m.canonicalId}
                      type="button"
                      onClick={() => handleSelectPredefinedModel(m)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition ${
                        modelInput === m.model
                          ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50'
                      }`}
                    >
                      <div className="font-bold">{m.model}</div>
                      <div className="text-[10px] opacity-75">{m.brand} · {m.releaseYear}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    제조사 *
                  </label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="Apple">Apple</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Google">Google</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    모델명 *
                  </label>
                  <input
                    type="text"
                    value={modelInput}
                    onChange={(e) => setModelInput(e.target.value)}
                    placeholder="예: iPhone 15 Pro, 아이폰15프로"
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    정규화 ID:{' '}
                    {resolveCanonicalModel(modelInput)?.canonicalId || 'custom-model'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    저장용량 *
                  </label>
                  <select
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="128GB">128GB</option>
                    <option value="256GB">256GB</option>
                    <option value="512GB">512GB</option>
                    <option value="1TB">1TB</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    색상
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="예: 내추럴 티타늄, 블랙"
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    출시년도
                  </label>
                  <input
                    type="number"
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    통신사 / 자급제
                  </label>
                  <select
                    value={telecom}
                    onChange={(e) => setTelecom(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="자급제">자급제 (무약정)</option>
                    <option value="SKT">SKT 정상해지</option>
                    <option value="KT">KT 정상해지</option>
                    <option value="LGU+">LGU+ 정상해지</option>
                    <option value="알뜰폰">알뜰폰</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: 판매자 입력 상태 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                <strong>주의 원칙:</strong> 판매자가 입력한 상태는 시스템에서{' '}
                <span className="font-bold underline">USER_REPORTED</span>로 명확히 표기되며,
                사진이나 진단기록 없이 AI가 확정 진단하지 않습니다.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  배터리 성능 최대치 (설정창 기준 자가보고 %)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={batteryHealthReported}
                    onChange={(e) =>
                      setBatteryHealthReported(e.target.value ? Number(e.target.value) : '')
                    }
                    placeholder="예: 91"
                    className="w-32 text-sm border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900"
                  />
                  <span className="text-xs text-slate-500">
                    % (사진만으로 알 수 없으므로 구매자 현장 재확인 항목으로 표시됩니다)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  액정 유리 상태 (자가보고)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'NONE', label: '무흠집/깨끗함' },
                    { val: 'SCRATCH', label: '미세 생활기스' },
                    { val: 'CRACK', label: '액정 균열/파손' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setScreenCrackReported(opt.val as any)}
                      className={`p-2.5 rounded-lg border text-xs font-medium transition ${
                        screenCrackReported === opt.val
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 text-slate-700 bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  수리 및 부품 교체 이력 (자가보고)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'NONE', label: '수리 이력 없음' },
                    { val: 'OFFICIAL', label: '공식 센터 정품 수리' },
                    { val: 'THIRD_PARTY', label: '사설 수리/부품 교체' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setRepairHistoryReported(opt.val as any)}
                      className={`p-2.5 rounded-lg border text-xs font-medium transition ${
                        repairHistoryReported === opt.val
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 text-slate-700 bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  * 수리 이력 증빙이 없는 경우 AI가 추정하여 확정하지 않습니다.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: 사진 업로드 & AI Vision */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    기기 사진 등록 ({photos.length}장 등록됨)
                  </h3>
                  <p className="text-xs text-slate-500">
                    AI가 사진 초점, 조명 밝기, 반사 유무 및 외관 손상 후보를 점검합니다.
                  </p>
                </div>
              </div>

              {/* Photo thumbnails */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {photos.map((p, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-50 aspect-square flex flex-col items-center justify-center"
                  >
                    <img
                      src={p.url}
                      alt={p.angle}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[10px] py-1 text-center font-medium">
                      {p.angle === 'FRONT'
                        ? '전면'
                        : p.angle === 'BACK'
                        ? '후면'
                        : p.angle === 'RIGHT'
                        ? '우측 프레임'
                        : '외관'}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Upload Button */}
                <label className="border-2 border-dashed border-slate-300 hover:border-slate-900 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer p-3 text-center transition bg-slate-50 hover:bg-slate-100">
                  <Camera className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-700">+ 사진 추가</span>
                  <span className="text-[10px] text-slate-400">전면, 후면, 측면</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'FRONT')}
                  />
                </label>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">📸 사진 촬영 팁:</div>
                <div>• 빛 반사가 심하거나 어두우면 AI가 "초점 불량 / 추가 사진 요청"을 냅니다.</div>
                <div>• 모서리 찍힘이 자주 발생하는 상·하단 모서리를 가까이 촬영해 주세요.</div>
              </div>
            </div>
          )}

          {/* STEP 4: 가격 설정 & 판단 기준 */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
                <strong>거래 판단 원칙:</strong> 단일 가격을 단정하지 않고, 수집된 실거래가 및 등록
                매물 데이터와 비교하여 상대 위치(시장 범위 내/이탈)와 표본 신뢰도를 산출합니다.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  희망 판매가격 (원) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="10000"
                    value={askingPrice}
                    onChange={(e) =>
                      setAskingPrice(e.target.value ? Number(e.target.value) : '')
                    }
                    placeholder="예: 1140000"
                    className="w-full text-base font-bold border border-slate-200 rounded-lg p-2.5 pl-8 bg-white text-slate-900"
                  />
                  <span className="absolute left-3 top-3 text-slate-400 font-bold">₩</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    매입가격 (유통업자/딜러 마진 계산용, 선택)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="10000"
                      value={buyPrice}
                      onChange={(e) =>
                        setBuyPrice(e.target.value ? Number(e.target.value) : '')
                      }
                      placeholder="예: 980000"
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 pl-8 bg-white text-slate-900"
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₩</span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    예상 마진: {askingPrice && buyPrice ? `₩${(Number(askingPrice) - Number(buyPrice)).toLocaleString()}` : '-'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    참고한 시장 가격 (출처 기록용, 선택)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="10000"
                      value={referencePrice}
                      onChange={(e) =>
                        setReferencePrice(e.target.value ? Number(e.target.value) : '')
                      }
                      placeholder="예: 1150000"
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 pl-8 bg-white text-slate-900"
                    />
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₩</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>이전</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <span>다음 단계</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <span>AI 분석 및 등록 중...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>기기 등록 & AI 상태 분석 시작</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
