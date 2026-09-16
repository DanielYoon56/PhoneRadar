import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { DashboardView } from './components/DashboardView.js';
import { DeviceDetailView } from './components/DeviceDetailView.js';
import { PriceIntelView } from './components/PriceIntelView.js';
import { PricingView } from './components/PricingView.js';
import { AdminView } from './components/AdminView.js';
import { NewDeviceModal } from './components/NewDeviceModal.js';
import { AddPriceRecordModal } from './components/AddPriceRecordModal.js';
import { SharedReportModal } from './components/SharedReportModal.js';
import { api } from './services/api.js';
import { Device, PriceRecord, UserProfile, UserRole } from './types/index.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'price-intel' | 'pricing' | 'admin'>('dashboard');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isNewDeviceOpen, setIsNewDeviceOpen] = useState(false);
  const [isAddPriceOpen, setIsAddPriceOpen] = useState(false);
  const [deviceForPriceRecord, setDeviceForPriceRecord] = useState<Device | null>(null);
  const [shareTokenModal, setShareTokenModal] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    loadInitialData();

    // Check URL hash for shared token: e.g. #share=xyz
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.includes('share=')) {
        const token = hash.split('share=')[1].split('&')[0];
        if (token) setShareTokenModal(token);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [u, devList] = await Promise.all([api.getMe(), api.getDevices()]);
      setUser(u);
      setDevices(devList);
    } catch (err) {
      console.error('Initial load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (role: UserRole) => {
    try {
      const updated = await api.updateRole(role);
      setUser(updated);
    } catch (err) {
      console.error('Failed to change role:', err);
    }
  };

  const handleDeviceCreated = (newDev: Device) => {
    setDevices((prev) => [newDev, ...prev]);
    setSelectedDevice(newDev);
    setCurrentTab('dashboard');
  };

  const handleDeviceUpdated = (updated: Device) => {
    setDevices((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setSelectedDevice(updated);
  };

  const handleDeleteDevice = async (id: string) => {
    try {
      await api.deleteDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
      if (selectedDevice?.id === id) {
        setSelectedDevice(null);
      }
    } catch (err) {
      alert('기기 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleOpenPriceModalForDevice = (dev: Device) => {
    setDeviceForPriceRecord(dev);
    setIsAddPriceOpen(true);
  };

  const handlePriceRecordAdded = (record: PriceRecord) => {
    // If we're looking at a selected device, trigger a refresh
    if (selectedDevice) {
      setSelectedDevice({ ...selectedDevice });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedDevice(null);
          setCurrentTab(tab);
        }}
        onOpenNewDevice={() => setIsNewDeviceOpen(true)}
        user={user}
        onRoleChange={handleRoleChange}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-xs font-semibold text-slate-500">
            데이터 로딩 중...
          </div>
        ) : selectedDevice ? (
          <DeviceDetailView
            device={selectedDevice}
            onBack={() => setSelectedDevice(null)}
            onDeviceUpdated={handleDeviceUpdated}
            onOpenPriceRecordModal={handleOpenPriceModalForDevice}
          />
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                devices={devices}
                onSelectDevice={(d) => setSelectedDevice(d)}
                onOpenNewDevice={() => setIsNewDeviceOpen(true)}
                onDeleteDevice={handleDeleteDevice}
              />
            )}
            {currentTab === 'price-intel' && (
              <PriceIntelView
                onOpenAddPriceModal={() => {
                  setDeviceForPriceRecord(null);
                  setIsAddPriceOpen(true);
                }}
              />
            )}
            {currentTab === 'pricing' && <PricingView user={user} />}
            {currentTab === 'admin' && <AdminView />}
          </>
        )}
      </main>

      {/* Modals */}
      <NewDeviceModal
        isOpen={isNewDeviceOpen}
        onClose={() => setIsNewDeviceOpen(false)}
        onCreated={handleDeviceCreated}
      />

      <AddPriceRecordModal
        isOpen={isAddPriceOpen}
        onClose={() => {
          setIsAddPriceOpen(false);
          setDeviceForPriceRecord(null);
        }}
        defaultDevice={deviceForPriceRecord}
        onRecordAdded={handlePriceRecordAdded}
      />

      {shareTokenModal && (
        <SharedReportModal
          shareToken={shareTokenModal}
          onClose={() => {
            setShareTokenModal(null);
            window.location.hash = '';
          }}
        />
      )}
    </div>
  );
}
