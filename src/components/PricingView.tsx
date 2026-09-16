import React from 'react';
import { Check, ShieldCheck, Zap, Sparkles, Building2 } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig.js';
import { UserProfile } from '../types/index.js';

interface PricingViewProps {
  user: UserProfile | null;
}

export const PricingView: React.FC<PricingViewProps> = ({ user }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>구독 플랜 및 수익 모델 (Section 30)</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          투명한 거래 판단을 위한 플랜 선택
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          개인 판매자부터 유통 딜러, 대량 수출 기업까지 규모에 맞춘 AI 분석 및 시세 인텔리전스를 제공합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {APP_CONFIG.subscriptionTiers.map((tier) => {
          const isCurrent = user?.subscriptionTier === tier.id;
          return (
            <div
              key={tier.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition relative ${
                tier.recommended
                  ? 'border-slate-900 bg-white shadow-xl ring-2 ring-slate-900'
                  : 'border-slate-200 bg-white shadow-xs hover:border-slate-300'
              }`}
            >
              {tier.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full">
                  가장 인기 있는 플랜
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{tier.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    {tier.priceMonth !== null ? (
                      <>
                        <span className="text-2xl font-black text-slate-900">
                          ₩{tier.priceMonth.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">/ 월</span>
                      </>
                    ) : (
                      <span className="text-xl font-bold text-slate-900">별도 문의</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-medium">
                    월 {tier.quotaPerMonth.toLocaleString()}대 정밀 분석 포함
                  </div>
                </div>

                <ul className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                <button
                  disabled={isCurrent}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : tier.recommended
                      ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {isCurrent ? '현재 이용 중인 플랜' : `${tier.name} 시작하기`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
