import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Share2,
  Printer,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Camera,
  Coins,
  FileText,
  CheckCircle2,
  ExternalLink,
  Plus,
  RefreshCw,
  Info,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig.js';
import { api } from '../services/api.js';
import {
  Device,
  PriceAnalysisResult,
  PriceRecord,
  TransactionReport,
  ConditionItem,
} from '../types/index.js';

interface DeviceDetailViewProps {
  device: Device;
  onBack: () => void;
  onDeviceUpdated: (updated: Device) => void;
  onOpenPriceRecordModal: (device: Device) => void;
}

export const DeviceDetailView: React.FC<DeviceDetailViewProps> = ({
  device,
  onBack,
  onDeviceUpdated,
  onOpenPriceRecordModal,
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'ai-vision' | 'conditions' | 'price'>('report');
  const [report, setReport] = useState<TransactionReport | null>(null);
  const [priceAnalysis, setPriceAnalysis] = useState<PriceAnalysisResult | null>(null);
  const [priceRecords, setPriceRecords] = useState<PriceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Load Report & Price Analysis
  useEffect(() => {
    loadAnalysisData();
  }, [device.id]);

  const loadAnalysisData = async () => {
    setLoading(true);
    try {
      const [rep, pAnalysis, pRecords] = await Promise.all([
        api.getReport(device.id),
        api.getPriceAnalysis(device.id),
        api.getPriceRecords(device.model, device.storage),
      ]);
      setReport(rep);
      setPriceAnalysis(pAnalysis);
      setPriceRecords(pRecords);
    } catch (err) {
      console.error('Failed to load analysis details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/#share=${device.shareToken}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, angle: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await api.uploadPhoto(device.id, reader.result as string, angle);
        onDeviceUpdated(res.device);
        await loadAnalysisData();
      } catch (err) {
        alert('사진 업로드 및 AI 분석 중 오류가 발생했습니다.');
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleConditionStatus = async (item: ConditionItem) => {
    const nextStatus =
      item.status === 'VERIFIED'
        ? 'NEEDS_CHECK'
        : item.status === 'NEEDS_CHECK'
        ? 'UNKNOWN'
        : 'VERIFIED';

    try {
      const updated = await api.updateConditionItem(device.id, item.id, {
        status: nextStatus,
        evidenceSource: nextStatus === 'VERIFIED' ? 'USER_REPORTED' : item.evidenceSource,
        verifiedAt: nextStatus === 'VERIFIED' ? new Date().toISOString() : undefined,
      });
      onDeviceUpdated(updated);
      await loadAnalysisData();
    } catch (err) {
      console.error('Failed to update condition:', err);
    }
  };

  const verifiedCount = device.conditions.filter((c) => c.status === 'VERIFIED').length;
  const needsCheckCount = device.conditions.filter((c) => c.status === 'NEEDS_CHECK').length;
  const unknownCount = device.conditions.filter((c) => c.status === 'UNKNOWN').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>기기 목록으로 돌아가기</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyShareLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-medium transition shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{copySuccess ? '공유 링크 복사됨!' : '구매자 공유 링크'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-medium transition shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>PDF 리포트 출력</span>
          </button>
        </div>
      </div>

      {/* Device Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
            {device.images.length > 0 ? (
              <img
                src={device.images[0].url}
                alt={device.model}
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {device.brand}
              </span>
              <span className="text-xs text-slate-400">출시: {device.releaseYear}년</span>
              <span className="text-xs text-slate-400">· {device.telecom || '자급제'}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              {device.model} <span className="text-slate-500 font-normal">{device.storage}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              색상: <strong className="text-slate-700">{device.color}</strong> · 등록일:{' '}
              {new Date(device.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-xl w-full md:w-auto justify-between md:justify-end">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              희망 등록가격
            </span>
            <span className="text-xl font-black text-slate-900">
              {device.askingPrice ? `₩${device.askingPrice.toLocaleString()}` : '미입력'}
            </span>
          </div>
          {device.buyPrice && (
            <div className="pl-4 border-l border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                매입 원가
              </span>
              <span className="text-sm font-bold text-slate-600">
                ₩{device.buyPrice.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* TOP 3 CRITICAL CARDS (Section 35 & 52) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. CONDITION (상태) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                ① CONDITION
              </span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                충족도 {device.infoSufficiencyScore}/100
              </span>
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              확인 {verifiedCount}건 · 점검필요 {needsCheckCount}건
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              점수는 품질 점수가 아닌 <strong>상태 정보 확보 충족도</strong>를 나타냅니다. 미확인 항목은
              거래 전 대면 점검이 필요합니다.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>배터리 자가보고: {device.batteryHealthUserReported ? `${device.batteryHealthUserReported}%` : '미입력'}</span>
            <span className="text-slate-400">사진 {device.images.length}장 분석</span>
          </div>
        </div>

        {/* 2. MARKET PRICE (시장가격) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-blue-600" />
                ② MARKET PRICE
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  priceAnalysis?.priceConfidence === 'HIGH'
                    ? APP_CONFIG.priceConfidenceLabels.HIGH.color
                    : priceAnalysis?.priceConfidence === 'MEDIUM'
                    ? APP_CONFIG.priceConfidenceLabels.MEDIUM.color
                    : APP_CONFIG.priceConfidenceLabels.LOW.color
                }`}
              >
                신뢰도:{' '}
                {priceAnalysis?.priceConfidence === 'HIGH'
                  ? '높음'
                  : priceAnalysis?.priceConfidence === 'MEDIUM'
                  ? '보통'
                  : '낮음 (표본제한)'}
              </span>
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">
              {priceAnalysis?.analysisStatus === 'INSUFFICIENT_DATA'
                ? '비교 데이터 부족'
                : `₩${priceAnalysis?.marketPriceMin.toLocaleString()} ~ ₩${priceAnalysis?.marketPriceMax.toLocaleString()}`}
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {priceAnalysis?.aiPriceJudgement || '시장 비교 데이터를 집계 중입니다.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>비교 표본: {priceAnalysis?.comparisonCount || 0}건</span>
            <span className="text-slate-400">기준일: {priceAnalysis?.referenceDate || '2026-09'}</span>
          </div>
        </div>

        {/* 3. CHECK POINTS (거래 전 확인사항) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                ③ CHECK POINTS
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                필수 4개 항목
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 mt-1">
              사진으로 확인할 수 없는 핵심 사항
            </div>
            <ul className="text-xs text-slate-600 mt-2 space-y-1">
              <li>• 통신사 정상 해지 및 분실/도난 여부 조회</li>
              <li>• 흰색 화면에서 OLED 번인/잔상 육안 확인</li>
              <li>• 설정 &gt; 배터리 성능 최대치 수치 확인</li>
              <li>• Face ID / 지문인식 실제 등록 테스트</li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            * 전문 감정서가 아니므로 실물 대면 검증 필수
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'report'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>거래 판단 리포트 (Report)</span>
        </button>
        <button
          onClick={() => setActiveTab('ai-vision')}
          className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'ai-vision'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>AI 사진 및 품질 검사 ({device.images.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('conditions')}
          className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'conditions'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>상태 상세 매트릭스 ({device.conditions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('price')}
          className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'price'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>시장 시세 비교 풀 ({priceRecords.length})</span>
        </button>
      </div>

      {/* TAB 1: TRANSACTION DECISION REPORT */}
      {activeTab === 'report' && report && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Report Header */}
          <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                  PhoneCheck AI
                </span>
                <span className="text-xs text-slate-500">
                  리포트 번호: {report.reportNumber}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                AI 중고폰 상태·가격 분석 리포트
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                분석 일시: {new Date(report.createdAt).toLocaleString()} · 대상 기기:{' '}
                {report.deviceSummary.brand} {report.deviceSummary.model} (
                {report.deviceSummary.storage})
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                상태 정보 충족도
              </span>
              <span className="text-2xl font-black text-emerald-600">
                {report.conditionSummary.sufficiencyScore} / 100
              </span>
            </div>
          </div>

          {/* Section 1 & 2: Summaries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Device Summary
              </h3>
              <div className="grid grid-cols-2 gap-y-1 text-xs text-slate-600">
                <div>제조사: <strong>{report.deviceSummary.brand}</strong></div>
                <div>모델: <strong>{report.deviceSummary.model}</strong></div>
                <div>저장용량: <strong>{report.deviceSummary.storage}</strong></div>
                <div>색상: <strong>{report.deviceSummary.color}</strong></div>
                <div>출시년도: <strong>{report.deviceSummary.releaseYear}년</strong></div>
                <div>통신환경: <strong>{report.deviceSummary.telecom}</strong></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Market Price Analysis
              </h3>
              <div className="text-xs space-y-1 text-slate-700">
                <div>비교가격 범위: <strong className="text-slate-900">{report.marketPriceAnalysis.priceRangeText}</strong></div>
                <div>등록가격: <strong>{report.marketPriceAnalysis.currentPriceText}</strong></div>
                <div>상대적 위치: <strong>{report.marketPriceAnalysis.relativePositionText}</strong></div>
                <div className="text-[11px] text-slate-500 pt-1">
                  * 비교 표본: {report.marketPriceAnalysis.dataCount}건 (데이터 신뢰도: {report.marketPriceAnalysis.dataConfidence})
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Condition Verification Items */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              3. Condition & AI Image Observations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  확인 완료된 항목 ({report.conditionSummary.verifiedItems.length}건)
                </div>
                <ul className="text-xs text-emerald-900 space-y-1">
                  {report.conditionSummary.verifiedItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                <div className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  거래 전 추가 점검 필요 항목 ({report.conditionSummary.needsCheckItems.length}건)
                </div>
                <ul className="text-xs text-amber-900 space-y-1">
                  {report.conditionSummary.needsCheckItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span>!</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Section 4: Risk & Checklist */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              4. 거래 전 필수 체크포인트 (Risk & Check Points)
            </h3>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-1">
              {report.riskAndCheckPoints.map((pt, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Final Summary Statement */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-1">
            <div className="font-bold text-slate-900">최종 분석 코멘트:</div>
            <p>{report.finalSummaryStatement}</p>
          </div>

          {/* Legal Disclaimer Box (Section 20 mandatory requirement) */}
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed">
            <div className="font-bold mb-1 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-rose-600 shrink-0" />
              <span>법적 고지 및 참고사항</span>
            </div>
            <p>{report.legalDisclaimer}</p>
          </div>
        </div>
      )}

      {/* TAB 2: AI PHOTO & QUALITY INSPECTION */}
      {activeTab === 'ai-vision' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                AI 시각 분석 및 사진 품질 진단
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Gemini Vision AI가 조명, 초점, 반사, 가림을 검사하고 외관 스크래치 및 덴트 후보를
                관찰합니다.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer hover:bg-slate-800 transition">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>{uploadingPhoto ? '분석 중...' : '+ 사진 추가 분석'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingPhoto}
                onChange={(e) => handlePhotoUpload(e, 'OTHER')}
              />
            </label>
          </div>

          {/* Photo Grid with Quality & Observations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {device.images.map((img) => (
              <div
                key={img.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col"
              >
                <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                  <img
                    src={img.url}
                    alt={img.angle}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 rounded bg-slate-900/80 text-white text-[10px] font-semibold">
                    {img.angle === 'FRONT'
                      ? '전면 화면'
                      : img.angle === 'BACK'
                      ? '후면'
                      : img.angle === 'RIGHT'
                      ? '우측 프레임'
                      : '기기 외관'}
                  </div>
                  {img.qualityAnalysis && (
                    <div
                      className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold ${
                        img.qualityAnalysis.isAcceptable
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      품질 {img.qualityAnalysis.score}점
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  {/* Photo Quality Feedback */}
                  {img.qualityAnalysis && (
                    <div className="text-xs space-y-1">
                      <div className="font-semibold text-slate-700 flex items-center justify-between">
                        <span>사진 품질 진단:</span>
                        <span className="text-[11px] text-slate-400">
                          {img.qualityAnalysis.isAcceptable ? '판독 양호' : '재촬영 권장'}
                        </span>
                      </div>
                      {img.qualityAnalysis.issues.length > 0 ? (
                        <div className="text-amber-700 bg-amber-50 p-2 rounded text-[11px]">
                          ⚠️ {img.qualityAnalysis.issues.join(', ')}
                        </div>
                      ) : (
                        <div className="text-emerald-700 bg-emerald-50 p-1.5 rounded text-[11px]">
                          ✓ 조명 및 초점 상태 양호
                        </div>
                      )}
                      {img.qualityAnalysis.recommendedAction && (
                        <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                          💡 <strong>촬영 권고:</strong> {img.qualityAnalysis.recommendedAction}
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Visual Observations */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      AI 시각 관찰 결과:
                    </span>
                    {img.visualObservations && img.visualObservations.length > 0 ? (
                      img.visualObservations.map((obs, oIdx) => (
                        <div
                          key={oIdx}
                          className="p-2 rounded bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">[{obs.category}]</span>
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                obs.severity === 'NONE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {obs.severity === 'NONE' ? '흠집 없음' : '미세 손상'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">{obs.observation}</p>
                          {obs.checkRecommendation && (
                            <p className="text-[10px] text-amber-700 font-medium">
                              → {obs.checkRecommendation}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">특이 관찰 사항 없음</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DETAILED CONDITION MATRIX */}
      {activeTab === 'conditions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900">상태 표준화 점검표</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              각 항목은 <span className="font-bold text-emerald-700">VERIFIED(확인됨)</span>,{' '}
              <span className="font-bold text-amber-700">NEEDS_CHECK(추가확인필요)</span>,{' '}
              <span className="font-bold text-slate-600">UNKNOWN(확인불가)</span>로 구분됩니다.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">점검 카테고리 / 항목</th>
                  <th className="px-6 py-3">판정 상태</th>
                  <th className="px-6 py-3">근거 출처</th>
                  <th className="px-6 py-3">상세 내용 및 확인 가이드</th>
                  <th className="px-6 py-3 text-right">상태 변경</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {device.conditions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{item.label}</div>
                      <div className="text-[10px] text-slate-400 uppercase">{item.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] border ${
                          item.status === 'VERIFIED'
                            ? APP_CONFIG.statusBadge.VERIFIED.color
                            : item.status === 'NEEDS_CHECK'
                            ? APP_CONFIG.statusBadge.NEEDS_CHECK.color
                            : APP_CONFIG.statusBadge.UNKNOWN.color
                        }`}
                      >
                        <span>
                          {item.status === 'VERIFIED'
                            ? '✓'
                            : item.status === 'NEEDS_CHECK'
                            ? '!'
                            : '?'}
                        </span>
                        <span>
                          {item.status === 'VERIFIED'
                            ? '확인됨'
                            : item.status === 'NEEDS_CHECK'
                            ? '추가확인 필요'
                            : '확인불가'}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600 font-medium">
                        {item.evidenceSource === 'USER_REPORTED'
                          ? '판매자 입력'
                          : item.evidenceSource === 'AI_OBSERVED'
                          ? 'AI 사진 관찰'
                          : '기기 진단기록'}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <div className="text-slate-700">{item.detail || '특이사항 없음'}</div>
                      {item.checkReason && (
                        <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                          → {item.checkReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleConditionStatus(item)}
                        className="px-2.5 py-1 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-medium transition"
                      >
                        상태 전환
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MARKET PRICE INTELLIGENCE */}
      {activeTab === 'price' && priceAnalysis && (
        <div className="space-y-6">
          {/* Price Range Visualizer Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {device.model} ({device.storage}) 시장 비교 시세 분석
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  단일 숫자로 단정하지 않고, 수집된 비교자료의 범위와 상대 위치를 제시합니다.
                </p>
              </div>
              <button
                onClick={() => onOpenPriceRecordModal(device)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ 내 거래/비교 가격 추가 (Section 57)</span>
              </button>
            </div>

            {/* Visual Bar */}
            {priceAnalysis.analysisStatus !== 'INSUFFICIENT_DATA' ? (
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>최저 비교가 ₩{priceAnalysis.marketPriceMin.toLocaleString()}</span>
                  <span className="text-slate-500">중간값 ₩{priceAnalysis.marketPriceMedian.toLocaleString()}</span>
                  <span>최고 비교가 ₩{priceAnalysis.marketPriceMax.toLocaleString()}</span>
                </div>

                <div className="relative h-4 bg-slate-200 rounded-full overflow-visible flex items-center">
                  <div className="absolute inset-y-0 left-0 right-0 bg-blue-200 rounded-full" />
                  {device.askingPrice && (
                    <div
                      className="absolute -top-3 -bottom-3 w-3 bg-slate-900 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 flex items-center justify-center"
                      style={{
                        left: `${Math.min(
                          Math.max(
                            ((device.askingPrice - priceAnalysis.marketPriceMin) /
                              (priceAnalysis.marketPriceMax - priceAnalysis.marketPriceMin || 1)) *
                              100,
                            5
                          ),
                          95
                        )}%`,
                      }}
                    >
                      <div className="absolute -top-7 whitespace-nowrap px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-extrabold shadow">
                        내 등록가: ₩{device.askingPrice.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 mt-2">
                  <strong>AI 시세 판단:</strong> {priceAnalysis.aiPriceJudgement}
                </div>
              </div>
            ) : (
              <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>비교 데이터 부족 안내 (Section 57 정책)</span>
                </div>
                <p>
                  현재 기기와 비교할 수 있는 가격자료가 충분하지 않습니다. 사용자가 직접 거래한 가격이나
                  참고자료를 등록하면 즉시 제한적 비교분석이 가능합니다.
                </p>
              </div>
            )}

            {/* Dealer Margin Estimator */}
            {priceAnalysis.marginEstimate && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5" />
                    유통/딜러 예상 마진 분석
                  </span>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    매입가 ₩{priceAnalysis.marginEstimate.buyPrice.toLocaleString()} 대비 예상 매출이익
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-900">
                    +₩{priceAnalysis.marginEstimate.grossMargin.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 block">
                    마진율 {priceAnalysis.marginEstimate.marginPercent}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  수집된 공인 비교자료 목록 ({priceRecords.length}건)
                </h4>
                <p className="text-xs text-slate-500">
                  실제 거래 체결가와 등록 호가를 투명하게 구분하여 표기합니다.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">출처 및 채널</th>
                    <th className="px-5 py-3">구분</th>
                    <th className="px-5 py-3">상태 등급</th>
                    <th className="px-5 py-3">가격 (원)</th>
                    <th className="px-5 py-3">수집 기준일</th>
                    <th className="px-5 py-3">비고 / 조건</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {priceRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        {r.source}
                        <span className="text-[10px] text-slate-400 font-normal block">
                          {r.sourceType}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.listingOrTransaction === 'TRANSACTION'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.listingOrTransaction === 'BUY_OFFER'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {r.listingOrTransaction === 'TRANSACTION'
                            ? '실거래 완료'
                            : r.listingOrTransaction === 'BUY_OFFER'
                            ? '매입 단가'
                            : '판매 등록가'}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-bold text-slate-700">
                        {r.conditionGrade}급 {r.batteryCondition ? `(${r.batteryCondition})` : ''}
                      </td>
                      <td className="px-5 py-3 font-bold text-slate-900">
                        ₩{r.price.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-slate-500">{r.collectedAt}</td>
                      <td className="px-5 py-3 text-slate-600 max-w-xs truncate">
                        {r.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
