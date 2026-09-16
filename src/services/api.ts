import {
  Device,
  PriceAnalysisResult,
  PriceRecord,
  TransactionReport,
  UserProfile,
  AdminStats,
} from '../types/index.js';

export const api = {
  async getMe(): Promise<UserProfile> {
    const res = await fetch('/api/auth/me');
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async updateRole(role: UserProfile['role']): Promise<UserProfile> {
    const res = await fetch('/api/auth/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('Failed to update role');
    return res.json();
  },

  async getDevices(): Promise<Device[]> {
    const res = await fetch('/api/devices');
    if (!res.ok) throw new Error('Failed to fetch devices');
    return res.json();
  },

  async getDevice(id: string): Promise<Device> {
    const res = await fetch(`/api/devices/${id}`);
    if (!res.ok) throw new Error('Failed to fetch device');
    return res.json();
  },

  async createDevice(data: Partial<Device>): Promise<Device> {
    const res = await fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create device');
    return res.json();
  },

  async updateDevice(id: string, data: Partial<Device>): Promise<Device> {
    const res = await fetch(`/api/devices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update device');
    return res.json();
  },

  async deleteDevice(id: string): Promise<void> {
    const res = await fetch(`/api/devices/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete device');
  },

  async updateConditionItem(deviceId: string, itemId: string, updates: any): Promise<Device> {
    const res = await fetch(`/api/devices/${deviceId}/conditions/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update condition item');
    return res.json();
  },

  async uploadPhoto(deviceId: string, url: string, angle: string): Promise<{ device: Device; aiAnalysis: any }> {
    const res = await fetch(`/api/devices/${deviceId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, angle }),
    });
    if (!res.ok) throw new Error('Failed to upload photo and run AI analysis');
    return res.json();
  },

  async deletePhoto(deviceId: string, photoId: string): Promise<Device> {
    const res = await fetch(`/api/devices/${deviceId}/photos/${photoId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete photo');
    const data = await res.json();
    return data.device;
  },

  async getPriceAnalysis(deviceId: string): Promise<PriceAnalysisResult> {
    const res = await fetch(`/api/devices/${deviceId}/price-analysis`);
    if (!res.ok) throw new Error('Failed to fetch price analysis');
    return res.json();
  },

  async getPriceRecords(model?: string, storage?: string): Promise<PriceRecord[]> {
    const params = new URLSearchParams();
    if (model) params.set('model', model);
    if (storage) params.set('storage', storage);
    const res = await fetch(`/api/prices/records?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch price records');
    return res.json();
  },

  async addPriceRecord(record: Partial<PriceRecord>): Promise<PriceRecord> {
    const res = await fetch('/api/prices/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error('Failed to add price record');
    return res.json();
  },

  async getReport(deviceId: string): Promise<TransactionReport> {
    const res = await fetch(`/api/devices/${deviceId}/report`);
    if (!res.ok) throw new Error('Failed to fetch report');
    return res.json();
  },

  async getSharedReport(shareToken: string): Promise<{ device: Device; report: TransactionReport }> {
    const res = await fetch(`/api/share/${shareToken}`);
    if (!res.ok) throw new Error('Failed to fetch shared report');
    return res.json();
  },

  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch('/api/admin/stats');
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return res.json();
  },
};
