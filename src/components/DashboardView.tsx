import React, { useState } from 'react';
import {
  Smartphone,
  ShieldCheck,
  Search,
  Filter,
  PlusCircle,
  ExternalLink,
  Trash2,
  Share2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Device } from '../types/index.js';

interface DashboardViewProps {
  devices: Device[];
  onSelectDevice: (device: Device) => void;
  onOpenNewDevice: () => void;
  onDeleteDevice: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  devices,
  onSelectDevice,
  onOpenNewDevice,
  onDeleteDevice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState<'ALL' | 'Apple' | 'Samsung'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredDevices = devices.filter((d) => {
    const matchesSearch =
      d.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.color?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = brandFilter === 'ALL' || d.brand === brandFilter;
    return matchesSearch && matchesBrand;
  });

  const totalDevices = devices.length;
  const analyzedCount = devices.filter((d) => d.status === 'REPORT_READY' || d.status === 'ANALYZED').length;
  const avgSufficiency = totalDevices > 0
    ? Math.round(devices.reduce((acc, cur) => acc + cur.infoSufficiencyScore, 0) / totalDevices)
    : 0;

  const handleCopyLink = (e: React.MouseEvent, token?: string, id?: string) => {
    e.stopPropagation();
    if (!token) return;
    const url = `${window.location.origin}/#share=${token}`;
    navigator.clipboard.writeText(url);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('해당 기기 및 관련 분석 데이터를 삭제하시겠습니까?')) {
      onDeleteDevice(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800 text-emerald-400 text-xs font-semibold border border-slate-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI 중고폰 상태·가격 검증 플랫폼</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            거래 플랫폼이 아닌, <br className="hidden sm:block" />
            <span className="text-emerald-400">합리적 거래 판단</span>을 돕는 인텔리전스
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
            기기 상태 표준화 점검표와 AI 사진 분석, 실거래가 표본 비교를 통해 판매자와 구매자 모두가
            신뢰할 수 있는 객관적 리포트를 발급합니다.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenNewDevice}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>새 기기 검증 등록하기</span>
            </button>
          </div>
        </div>

        {/* Abstract Background Accent */}
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase">총 등록 기기</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalDevices}대</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">보유 자산 및 판매 매물</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase">AI 분석 완료</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{analyzedCount}대</div>
          <span className="text-[11px] text-emerald-700 mt-0.5 block">
            전체 대비 {totalDevices > 0 ? Math.round((analyzedCount / totalDevices) * 100) : 0}%
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase">평균 정보 충족도</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{avgSufficiency} / 100</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">점검 항목 확보율</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block uppercase">비교 시세 데이터풀</span>
          <div className="text-2xl font-black text-slate-900 mt-1">13건 이상</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">실거래 & 등록 호가 분리</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="모델명, 제조사, 색상 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium">제조사:</span>
          {(['ALL', 'Apple', 'Samsung'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBrandFilter(b)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                brandFilter === b
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {b === 'ALL' ? '전체' : b}
            </button>
          ))}
        </div>
      </div>

      {/* Device List Cards */}
      {filteredDevices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDevices.map((dev) => (
            <div
              key={dev.id}
              onClick={() => onSelectDevice(dev)}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
            >
              <div className="p-5 space-y-3">
                {/* Card Top: Badges & Model */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {dev.brand}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {dev.telecom || '자급제'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1 group-hover:text-emerald-600 transition">
                      {dev.model}
                    </h3>
                    <div className="text-xs text-slate-500 font-medium">
                      {dev.storage} · {dev.color}
                    </div>
                  </div>

                  <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {dev.images.length > 0 ? (
                      <img
                        src={dev.images[0].url}
                        alt={dev.model}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Smartphone className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                </div>

                {/* Score & Photo stats */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">정보 충족도</span>
                    <span className="font-extrabold text-slate-900">
                      {dev.infoSufficiencyScore} / 100
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">희망 등록가</span>
                    <span className="font-black text-slate-900">
                      {dev.askingPrice ? `₩${dev.askingPrice.toLocaleString()}` : '미입력'}
                    </span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2 pt-1 text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
                      dev.status === 'REPORT_READY'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{dev.status === 'REPORT_READY' ? '리포트 발급 완료' : '추가 분석 가능'}</span>
                  </span>
                  <span className="text-slate-400">사진 {dev.images.length}장</span>
                </div>
              </div>

              {/* Card Footer: Action Buttons */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => handleCopyLink(e, dev.shareToken, dev.id)}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedId === dev.id ? '링크 복사됨!' : '공유'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, dev.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-slate-900 group-hover:underline flex items-center gap-1">
                    상세보기 &gt;
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Smartphone className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">등록된 기기가 없습니다</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            새 중고폰을 등록하고 AI 사진 분석과 객관적인 시장 비교 시세 리포트를 확인해 보세요.
          </p>
          <button
            onClick={onOpenNewDevice}
            className="inline-flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-800 transition"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>기기 등록하기</span>
          </button>
        </div>
      )}
    </div>
  );
};
