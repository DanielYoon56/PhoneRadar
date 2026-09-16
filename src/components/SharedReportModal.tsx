import React, { useEffect, useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Coins,
  FileText,
  Info,
  ExternalLink,
} from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig.js';
import { api } from '../services/api.js';
import { Device, TransactionReport } from '../types/index.js';

interface SharedReportModalProps {
  shareToken: string;
  onClose: () => void;
}

export const SharedReportModal: React.FC<SharedReportModalProps> = ({
  shareToken,
  onClose,
}) => {
  const [data, setData] = useState<{ device: Device; report: TransactionReport } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShared();
  }, [shareToken]);

  const loadShared = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSharedReport(shareToken);
      setData(res);
    } catch (err: any) {
      setError(err.message || '공유된 리포트를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                PhoneCheck AI 거래 판단 공인 리포트
              </h2>
              <span className="text-[11px] text-slate-500">
                구매자 전용 투명성 검증 뷰
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              리포트를 불러오는 중입니다...
            </div>
          ) : error || !data ? (
            <div className="py-12 text-center text-xs text-rose-600">
              {error || '리포트가 존재하지 않거나 유효하지 않습니다.'}
            </div>
          ) : (
            <>
              {/* Device Overview */}
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0">
                  {data.device.images.length > 0 ? (
                    <img
                      src={data.device.images[0].url}
                      alt={data.device.model}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400">
                    {data.device.brand} · {data.device.releaseYear}년 출시 · {data.device.telecom || '자급제'}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {data.device.model} ({data.device.storage})
                  </h3>
                  <div className="text-xs text-slate-600 mt-0.5">
                    색상: <strong>{data.device.color}</strong> · 등록가격:{' '}
                    <strong>
                      {data.device.askingPrice ? `₩${data.device.askingPrice.toLocaleString()}` : '미입력'}
                    </strong>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    상태 정보 충족도
                  </span>
                  <span className="text-xl font-black text-emerald-600">
                    {data.report.conditionSummary.sufficiencyScore} / 100
                  </span>
                </div>
              </div>

              {/* Price Judgement */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-blue-600" />
                  시장 가격 비교 판단
                </h4>
                <div className="text-xs text-blue-900 leading-relaxed">
                  비교 범위: <strong>{data.report.marketPriceAnalysis.priceRangeText}</strong> <br />
                  상대적 위치: <strong>{data.report.marketPriceAnalysis.relativePositionText}</strong>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  {data.report.marketPriceAnalysis.disclaimer}
                </p>
              </div>

              {/* Verified vs Needs Check */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
                  <div className="text-xs font-bold text-emerald-900 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    확인된 항목
                  </div>
                  <ul className="text-xs text-emerald-800 space-y-1">
                    {data.report.conditionSummary.verifiedItems.map((item, idx) => (
                      <li key={idx}>✓ {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
                  <div className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    거래 전 대면 확인 필요
                  </div>
                  <ul className="text-xs text-amber-800 space-y-1">
                    {data.report.conditionSummary.needsCheckItems.map((item, idx) => (
                      <li key={idx}>! {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Risk & Checkpoints */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="text-xs font-bold text-emerald-400">
                  구매자가 반드시 직접 점검해야 할 항목:
                </div>
                <ul className="text-xs text-slate-300 space-y-1">
                  {data.report.riskAndCheckPoints.map((pt, idx) => (
                    <li key={idx}>• {pt}</li>
                  ))}
                </ul>
              </div>

              {/* Legal Disclaimer Box */}
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                <div className="font-bold mb-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  법적 고지 (Section 20)
                </div>
                <p>{APP_CONFIG.legalDisclaimer}</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            PhoneCheck AI · 거래 판단 플랫폼
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
