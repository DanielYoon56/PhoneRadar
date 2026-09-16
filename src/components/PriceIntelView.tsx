import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Info,
  Building2,
  Users,
} from 'lucide-react';
import { APP_CONFIG, CANONICAL_MODELS } from '../config/appConfig.js';
import { api } from '../services/api.js';
import { PriceRecord } from '../types/index.js';

interface PriceIntelViewProps {
  onOpenAddPriceModal: () => void;
}

export const PriceIntelView: React.FC<PriceIntelViewProps> = ({ onOpenAddPriceModal }) => {
  const [records, setRecords] = useState<PriceRecord[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPriceRecords();
  }, [selectedModel]);

  const loadPriceRecords = async () => {
    setLoading(true);
    try {
      const data = await api.getPriceRecords(selectedModel === 'ALL' ? undefined : selectedModel);
      setRecords(data);
    } catch (err) {
      console.error('Failed to load price records:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (selectedType === 'ALL') return true;
    return r.listingOrTransaction === selectedType;
  });

  const transactionCount = records.filter((r) => r.listingOrTransaction === 'TRANSACTION').length;
  const listingCount = records.filter((r) => r.listingOrTransaction === 'LISTING').length;
  const partnerCount = records.filter((r) => r.listingOrTransaction === 'BUY_OFFER' || r.listingOrTransaction === 'SELL_OFFER').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              거래 판단 인텔리전스
            </span>
            <span className="text-xs text-slate-400">데이터 수집 기준일: 2026-09</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            중고폰 시장 시세 비교 풀 (Price Intelligence)
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            단일 숫자로 가격을 강제하지 않으며, 호가와 실거래가를 엄격히 구분하여 통계적 신뢰도와 범위를
            제공합니다.
          </p>
        </div>

        <button
          onClick={onOpenAddPriceModal}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>새 가격 데이터 등록 (Section 57)</span>
        </button>
      </div>

      {/* Notice Banner (Section 57) */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <strong>데이터 공정성 안내: </strong>
          {APP_CONFIG.priceAbsenceNotice}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 block">실거래 체결 데이터</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{transactionCount}건</div>
          <span className="text-[10px] text-slate-400">네고 완료된 실체결 가격</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">등록 매물 호가</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{listingCount}건</div>
          <span className="text-[10px] text-slate-400">판매자 희망 등록가격</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-700 block">도매/제휴 유통 단가</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{partnerCount}건</div>
          <span className="text-[10px] text-slate-400">전문 매입·소매 리퍼몰</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-500 shrink-0">모델 필터:</span>
          <button
            onClick={() => setSelectedModel('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition ${
              selectedModel === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            전체 모델
          </button>
          {CANONICAL_MODELS.slice(0, 5).map((m) => (
            <button
              key={m.canonicalId}
              onClick={() => setSelectedModel(m.model)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition ${
                selectedModel === m.model
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m.model}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs font-semibold text-slate-500">거래 구분:</span>
          {[
            { key: 'ALL', label: '전체' },
            { key: 'TRANSACTION', label: '실거래' },
            { key: 'LISTING', label: '등록호가' },
            { key: 'BUY_OFFER', label: '매입단가' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setSelectedType(t.key)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                selectedType === t.key
                  ? 'bg-slate-200 text-slate-900 font-bold'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">모델 및 용량</th>
                <th className="px-5 py-3.5">데이터 출처 채널</th>
                <th className="px-5 py-3.5">구분</th>
                <th className="px-5 py-3.5">상태 등급</th>
                <th className="px-5 py-3.5">가격 (원)</th>
                <th className="px-5 py-3.5">지역</th>
                <th className="px-5 py-3.5">수집일</th>
                <th className="px-5 py-3.5">특이사항 / 메모</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900">{r.model}</div>
                    <div className="text-[10px] text-slate-400">{r.storage}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-800">{r.source}</div>
                    <span className="text-[10px] text-slate-400">{r.sourceType}</span>
                  </td>
                  <td className="px-5 py-3.5">
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
                        ? '실거래 체결'
                        : r.listingOrTransaction === 'BUY_OFFER'
                        ? '매입 단가'
                        : '판매 등록가'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-slate-700">{r.conditionGrade}급</span>
                    {r.batteryCondition && (
                      <span className="text-[10px] text-slate-500 block">
                        {r.batteryCondition}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-900 text-sm">
                    ₩{r.price.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{r.region || '전국'}</td>
                  <td className="px-5 py-3.5 text-slate-500">{r.collectedAt}</td>
                  <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">
                    {r.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
