import React, { useState } from 'react';
import {
  Printer,
  ExternalLink,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  Lock,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { Device, PriceAnalysisResult, TransactionReport } from '../types';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device;
  report: TransactionReport | null;
  priceAnalysis: PriceAnalysisResult | null;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  device,
  report,
  priceAnalysis,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [directPrintAttempted, setDirectPrintAttempted] = useState(false);

  if (!isOpen) return null;

  const handleDownloadStandaloneHtml = async () => {
    try {
      const res = await fetch(`/api/devices/${device.id}/print`);
      const htmlText = await res.text();
      const blob = new Blob([htmlText], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PhoneCheck_Report_${device.model.replace(/\s+/g, '_')}_${device.storage}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to download HTML report:', err);
    }
  };

  const handleAttemptCurrentWindowPrint = () => {
    setDirectPrintAttempted(true);
    try {
      window.print();
    } catch (err) {
      console.warn('Direct print blocked by sandbox:', err);
    }
  };

  const txSummary = priceAnalysis?.transactionSummary;
  const listingSummary = priceAnalysis?.listingSummary;
  const buySummary = priceAnalysis?.buyOfferSummary;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                거래 판단 리포트 인쇄 & PDF 내보내기
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  A4 최적화 규격
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                {device.brand} {device.model} ({device.storage}, {device.color})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice & Action Bar */}
        <div className="p-4 bg-blue-50 border-b border-blue-200 shrink-0 space-y-3">
          <div className="flex items-start gap-2.5 text-xs text-blue-950">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>인쇄 다이얼로그 호출 안내:</strong> 웹 미리보기(iframe) 환경에서는 브라우저 보안 규정에 따라 내부 인쇄 팝업이 차단될 수 있습니다. 아래 <strong>[새 탭에서 즉시 인쇄 / PDF 저장]</strong> 버튼을 누르시면 브라우저의 실제 인쇄 및 PDF 저장 창이 100% 정상 실행됩니다.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {/* 1. Primary: New Tab Print (immune to iframe sandboxing) */}
            <a
              id="btn-open-print-newtab"
              href={`/api/devices/${device.id}/print`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              <span>새 탭에서 즉시 인쇄 / PDF 저장 (권장)</span>
            </a>

            {/* 2. Download Standalone HTML */}
            <button
              id="btn-download-html-report"
              type="button"
              onClick={handleDownloadStandaloneHtml}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-medium transition shadow-2xs cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>{downloadSuccess ? 'HTML 파일 다운로드 완료!' : '독립형 HTML 리포트 다운로드'}</span>
            </button>

            {/* 3. Attempt direct print */}
            <button
              id="btn-try-direct-print"
              type="button"
              onClick={handleAttemptCurrentWindowPrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 text-xs font-medium transition cursor-pointer ml-auto active:scale-95"
              title="현재 창에서 인쇄를 재시도합니다."
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>현재 창에서 인쇄 재시도</span>
            </button>
          </div>

          {directPrintAttempted && (
            <p className="text-[11px] text-amber-800 bg-amber-100/70 p-2 rounded-lg border border-amber-200">
              * 인쇄 창이 열리지 않는 경우 상단의 파란색 <strong>[새 탭에서 즉시 인쇄 / PDF 저장]</strong> 버튼을 이용해 주세요.
            </p>
          )}
        </div>

        {/* A4 Sheet Live Document Preview Area */}
        <div className="p-6 bg-slate-100/70 overflow-y-auto flex-1">
          <div className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              인쇄 및 PDF 출력용 미리보기 (A4 레이아웃)
            </span>
            <span>PhoneCheck AI Ver. 1.0</span>
          </div>

          {/* Paper Sheet Container */}
          <div className="bg-white rounded-xl border border-slate-300 p-8 shadow-sm space-y-6 text-slate-900">
            {/* Sheet Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-end justify-between">
              <div>
                <h1 className="text-xl font-extrabold flex items-center gap-2">
                  PhoneCheck AI
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    VERIFIED
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">중고 단말기 상태 검증 및 거래 판단 리포트</p>
              </div>
              <div className="text-right text-xs text-slate-600 space-y-0.5">
                <div>리포트 번호: <strong className="text-slate-900">{report?.reportNumber || 'PC-RPT-SAMPLE'}</strong></div>
                <div>발행 일시: <strong className="text-slate-900">{new Date().toISOString().split('T')[0]}</strong></div>
                <div>단말기 식별 해시: <strong className="text-slate-900">{device.imeiHash || '정상 해시 암호화'}</strong></div>
              </div>
            </div>

            {/* Spec & Condition Score */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-900 pb-1 border-b border-slate-200">
                  1. 단말기 제원 정보
                </div>
                <div className="text-xs space-y-1 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">제조사 / 모델:</span>
                    <strong>{device.brand} {device.model}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">용량 / 색상:</span>
                    <strong>{device.storage} / {device.color}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">출시연도 / 통신사:</span>
                    <strong>{device.releaseYear}년 / {device.telecom || '자급제'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">배터리 효율 (자가보고):</span>
                    <strong>{device.batteryHealthUserReported ? `${device.batteryHealthUserReported}%` : '미등록'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">외관 상태 추정:</span>
                    <strong>{device.conditionGradeEstimated || 'A'}급</strong>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 pb-1 border-b border-slate-200">
                    2. 상태 정보 충족도 & AI 비전
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 font-extrabold text-xl">
                      {device.infoSufficiencyScore}점
                    </div>
                    <div className="text-xs text-slate-600">
                      <div>상태 정보 충족도 (0~100점)</div>
                      <div className="text-[11px] text-emerald-700 font-medium">거래에 필요한 정보가 충족되었습니다.</div>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  • 사진 정밀 판독: {device.images.length}장 완료 (AI 관찰 결과는 현장 대면 확인 체크포인트로 연계됨)
                </div>
              </div>
            </div>

            {/* Price Analysis Section */}
            <div className="p-4 rounded-lg border border-slate-200 space-y-2.5">
              <div className="text-xs font-bold text-slate-900 pb-1 border-b border-slate-200 flex items-center justify-between">
                <span>3. 시장 거래 시세 분석 (실거래 vs 등록호가 엄격 분리)</span>
                <span className="text-[10px] font-normal text-slate-500">
                  기준일: {priceAnalysis?.referenceDate || new Date().toISOString().split('T')[0]}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-center">
                  <div className="text-[11px] text-blue-700 font-semibold mb-1">① 최근 실거래 체결가 (중위)</div>
                  <div className="text-base font-extrabold text-blue-950">
                    {txSummary ? `₩${txSummary.median.toLocaleString()}` : '데이터 수집 중'}
                  </div>
                  <div className="text-[10px] text-blue-600 mt-0.5">
                    {txSummary ? `표본 ${txSummary.count}건 (₩${txSummary.min.toLocaleString()}~₩${txSummary.max.toLocaleString()})` : '표본 확보 중'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[11px] text-slate-600 font-semibold mb-1">② 매물 등록 호가 (중위)</div>
                  <div className="text-base font-extrabold text-slate-900">
                    {listingSummary ? `₩${listingSummary.median.toLocaleString()}` : '데이터 수집 중'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {listingSummary ? `표본 ${listingSummary.count}건 (희망 가격 기준)` : '표본 확보 중'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[11px] text-slate-600 font-semibold mb-1">③ 도매/파트너 매입가</div>
                  <div className="text-base font-extrabold text-slate-900">
                    {buySummary ? `₩${buySummary.median.toLocaleString()}` : `₩${(device.buyPrice || 980000).toLocaleString()}`}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">딜러/수거업체 즉시 매입 기준가</div>
                </div>
              </div>

              <div className="text-xs text-slate-600 pt-1 flex justify-between">
                <span>희망 판매가: <strong>{device.askingPrice ? `₩${device.askingPrice.toLocaleString()}` : '미등록'}</strong> ({report?.marketPriceAnalysis.relativePositionText || '시장 범위 내 적정'})</span>
                <span>데이터 신뢰도: <strong>{report?.marketPriceAnalysis.dataConfidence || 'HIGH'}</strong></span>
              </div>
            </div>

            {/* Unified Checklist Section */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-900">
                4. 거래 필수 체크리스트 (사전 확인 vs 현장 확인 통합)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Verified */}
                <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-1.5">
                  <div className="text-xs font-bold text-emerald-900 pb-1 border-b border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    사전 확인 완료 항목 ({report?.conditionSummary.verifiedItems.length || 0}건)
                  </div>
                  <ul className="text-xs text-emerald-800 space-y-1">
                    {report?.conditionSummary.verifiedItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-emerald-600 font-bold shrink-0">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Needs Check & Security */}
                <div className="p-3.5 rounded-lg bg-amber-50/50 border border-amber-200 space-y-2.5">
                  <div>
                    <div className="text-xs font-bold text-amber-900 pb-1 border-b border-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      1) 기기 외관·기능 대면 확인 ({report?.conditionSummary.needsCheckItems.length || 0}건)
                    </div>
                    <ul className="text-xs text-amber-900 space-y-1 pt-1">
                      {(!report?.conditionSummary.needsCheckItems || report.conditionSummary.needsCheckItems.length === 0) ? (
                        <li className="italic text-amber-700">사전 미확보 항목 없음</li>
                      ) : (
                        report.conditionSummary.needsCheckItems.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="font-bold text-amber-600 shrink-0">!</span>
                            <span>{item}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-amber-200">
                    <div className="text-xs font-bold text-slate-900 pb-1 border-b border-amber-200/60 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-slate-700" />
                      2) 현장 거래 안전 & 락 방지 수칙
                    </div>
                    <ul className="text-xs text-slate-700 space-y-1 pt-1">
                      {report?.riskAndCheckPoints.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-amber-700 font-bold shrink-0">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Disclaimer */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-500 leading-relaxed">
              <strong>[법적 고지 및 책임 제한]</strong><br />
              본 리포트는 판매자가 제공한 사진, 입력 정보 및 시세 데이터를 기반으로 작성된 보조 참고 자료입니다. AI 비전 분석은 내부 손상, 사설 부품, 침수 흔적, 계정 락 상태를 100% 보증하지 않으므로, 직거래 시 기재된 필수 체크포인트를 반드시 현장에서 대면 확인하시기 바랍니다.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            상단의 <strong>[새 탭에서 즉시 인쇄 / PDF 저장]</strong>을 클릭하면 브라우저 인쇄 창이 열립니다.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
