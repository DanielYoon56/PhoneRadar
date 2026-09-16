import React from 'react';
import {
  Smartphone,
  ShieldCheck,
  TrendingUp,
  PlusCircle,
  CreditCard,
  BarChart3,
  Users,
} from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig.js';
import { UserProfile, UserRole } from '../types/index.js';

interface HeaderProps {
  currentTab: 'dashboard' | 'price-intel' | 'pricing' | 'admin';
  onSelectTab: (tab: 'dashboard' | 'price-intel' | 'pricing' | 'admin') => void;
  onOpenNewDevice: () => void;
  user: UserProfile | null;
  availableUsers?: UserProfile[];
  onSwitchUser?: (userId: string) => void;
  onRoleChange: (role: UserRole) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewDevice,
  user,
  availableUsers = [],
  onSwitchUser,
  onRoleChange,
}) => {
  const roles: { key: UserRole; label: string; desc: string }[] = [
    { key: 'SELLER', label: '개인 판매자', desc: '내 기기 상태 점검 & 적정 판매가 판단' },
    { key: 'DEALER', label: '전문 유통업자', desc: '매입·판매 마진 분석 & B2B 시세' },
    { key: 'EXPORTER', label: '수출 사업자', desc: '대량 단말기 외관 등급 검증' },
    { key: 'ADMIN', label: '시스템 관리자', desc: '전체 테넌트 단말기 열람 및 운영 통계' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Motto */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onSelectTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm group-hover:bg-slate-800 transition">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  {APP_CONFIG.brandName}
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  거래 판단 플랫폼
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                {APP_CONFIG.brandSubtitle}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                currentTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              기기 대시보드
            </button>
            <button
              onClick={() => onSelectTab('price-intel')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                currentTab === 'price-intel'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-slate-500" />
              시세 비교 데이터
            </button>
            <button
              onClick={() => onSelectTab('pricing')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                currentTab === 'pricing'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-4 h-4 text-slate-500" />
              요금제
            </button>
            <button
              onClick={() => onSelectTab('admin')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                currentTab === 'admin'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-slate-500" />
              관리자 지표
            </button>
          </nav>

          {/* User Role Switcher & New Device CTA */}
          <div className="flex items-center gap-3">
            {/* User Account & Role Switcher */}
            <div className="relative group">
              <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 cursor-pointer">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-slate-900 leading-tight">
                    {user?.name || '김민준'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {roles.find((r) => r.key === user?.role)?.label || '개인 판매자'}
                  </span>
                </div>
              </div>
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 hidden group-hover:block z-50">
                {availableUsers && availableUsers.length > 0 && (
                  <>
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      테넌트 계정 전환 (데이터 격리 검증)
                    </div>
                    {availableUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => onSwitchUser && onSwitchUser(u.id)}
                        className={`w-full text-left px-3 py-2 text-xs transition flex items-center justify-between ${
                          user?.id === u.id
                            ? 'bg-emerald-50 text-emerald-950 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="font-medium">{u.name}</div>
                          <div className="text-[10px] text-slate-400">{u.email}</div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {u.role}
                        </span>
                      </button>
                    ))}
                    <div className="my-1.5 border-t border-slate-100" />
                  </>
                )}

                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  현재 계정 권한 역할 변경
                </div>
                {roles.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => onRoleChange(r.key)}
                    className={`w-full text-left px-3 py-1.5 text-xs transition flex flex-col ${
                      user?.role === r.key
                        ? 'bg-slate-100 font-semibold text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{r.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* New Device CTA */}
            <button
              onClick={onOpenNewDevice}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-sm transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>새 기기 분석 등록</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
