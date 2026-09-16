import React, { useState } from 'react';
import { X, Coins, CheckCircle2, AlertCircle } from 'lucide-react';
import { CANONICAL_MODELS } from '../config/appConfig.js';
import { api } from '../services/api.js';
import { Device, PriceRecord } from '../types/index.js';

interface AddPriceRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDevice?: Device | null;
  onRecordAdded: (record: PriceRecord) => void;
}

export const AddPriceRecordModal: React.FC<AddPriceRecordModalProps> = ({
  isOpen,
  onClose,
  defaultDevice,
  onRecordAdded,
}) => {
  const [model, setModel] = useState(defaultDevice?.model || 'iPhone 15 Pro');
  const [storage, setStorage] = useState(defaultDevice?.storage || '256GB');
  const [price, setPrice] = useState<number | ''>('');
  const [listingOrTransaction, setListingOrTransaction] = useState<PriceRecord['listingOrTransaction']>('TRANSACTION');
  const [source, setSource] = useState('당근마켓 직접 거래');
  const [sourceType, setSourceType] = useState<PriceRecord['sourceType']>('USER_INPUT');
  const [conditionGrade, setConditionGrade] = useState<'S' | 'A' | 'B' | 'C'>('A');
  const [region, setRegion] = useState('서울 강남구');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!model || !price) {
      setError('모델명과 가격을 입력해 주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const created = await api.addPriceRecord({
        model,
        storage,
        price: Number(price),
        listingOrTransaction,
        source,
        sourceType,
        conditionGrade,
        region,
        notes,
      });
      onRecordAdded(created);
      onClose();
    } catch (err: any) {
      setError(err.message || '가격 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              비교 가격 데이터 등록 (Section 57)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              실제 거래 완료가 또는 확인한 매물 가격을 등록하여 시세 신뢰도를 높입니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                기기 모델명 *
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="예: iPhone 15 Pro"
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                저장용량
              </label>
              <select
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900"
              >
                <option value="128GB">128GB</option>
                <option value="256GB">256GB</option>
                <option value="512GB">512GB</option>
                <option value="1TB">1TB</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              거래 가격 (원) *
            </label>
            <input
              type="number"
              step="10000"
              value={price}
              onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
              placeholder="예: 1120000"
              className="w-full text-sm font-bold border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                거래 구분 *
              </label>
              <select
                value={listingOrTransaction}
                onChange={(e) => setListingOrTransaction(e.target.value as any)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900"
              >
                <option value="TRANSACTION">실거래 체결 완료가</option>
                <option value="LISTING">판매 등록 호가</option>
                <option value="BUY_OFFER">딜러/도매 매입가</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                기기 외관 등급
              </label>
              <select
                value={conditionGrade}
                onChange={(e) => setConditionGrade(e.target.value as any)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900"
              >
                <option value="S">S급 (무흠집 미사용급)</option>
                <option value="A">A급 (미세 생활실기스)</option>
                <option value="B">B급 (모서리 찍힘 등)</option>
                <option value="C">C급 (파손 또는 기능하자)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              출처 / 채널명
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="예: 당근마켓 직거래, 번개장터, 용산 도매단가"
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              비고 및 조건 메모 (선택)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="예: 박스 풀구성, 배터리 90%, 정상해지 자급제"
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{loading ? '등록 중...' : '데이터 풀에 등록'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
