import {
  Device,
  PriceAnalysisResult,
  PriceRecord,
  TransactionReport,
  UserProfile,
  AdminStats,
  ShareAccessLog,
} from '../types/index.js';

let activeUserId: string =
  typeof window !== 'undefined'
    ? localStorage.getItem('phonecheck_active_user_id') || 'user-seller-1'
    : 'user-seller-1';

export function getActiveUserId(): string {
  return activeUserId;
}

export function setActiveUserId(id: string): void {
  activeUserId = id;
  if (typeof window !== 'undefined') {
    localStorage.setItem('phonecheck_active_user_id', id);
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('x-user-id', activeUserId);

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`;
    try {
      const errData = await res.json();
      errorMsg = errData.error || errData.message || (errData.details ? errData.details.join(', ') : errorMsg);
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  getActiveUserId,
  setActiveUserId,

  async getMe(): Promise<UserProfile> {
    return request<UserProfile>('/api/auth/me');
  },

  async getUsers(): Promise<UserProfile[]> {
    return request<UserProfile[]>('/api/auth/users');
  },

  async updateRole(role: UserProfile['role']): Promise<UserProfile> {
    return request<UserProfile>('/api/auth/role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  },

  async getDevices(): Promise<Device[]> {
    return request<Device[]>('/api/devices');
  },

  async getDevice(id: string): Promise<Device> {
    return request<Device>(`/api/devices/${id}`);
  },

  async createDevice(data: Partial<Device>): Promise<Device> {
    return request<Device>('/api/devices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateDevice(id: string, data: Partial<Device>): Promise<Device> {
    return request<Device>(`/api/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteDevice(id: string): Promise<void> {
    await request(`/api/devices/${id}`, { method: 'DELETE' });
  },

  async updateConditionItem(deviceId: string, itemId: string, updates: any): Promise<Device> {
    return request<Device>(`/api/devices/${deviceId}/conditions/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async uploadPhoto(deviceId: string, url: string, angle: string): Promise<{ device: Device; aiAnalysis: any; image: any }> {
    return request<{ device: Device; aiAnalysis: any; image: any }>(`/api/devices/${deviceId}/photos`, {
      method: 'POST',
      body: JSON.stringify({ url, angle }),
    });
  },

  async deletePhoto(deviceId: string, photoId: string): Promise<Device> {
    const data = await request<{ success: boolean; device: Device }>(`/api/devices/${deviceId}/photos/${photoId}`, {
      method: 'DELETE',
    });
    return data.device;
  },

  async getPriceAnalysis(deviceId: string): Promise<PriceAnalysisResult> {
    return request<PriceAnalysisResult>(`/api/devices/${deviceId}/price-analysis`);
  },

  async getPriceRecords(model?: string, storage?: string, type?: string): Promise<PriceRecord[]> {
    const params = new URLSearchParams();
    if (model) params.set('model', model);
    if (storage) params.set('storage', storage);
    if (type) params.set('type', type);
    return request<PriceRecord[]>(`/api/prices/records?${params.toString()}`);
  },

  async addPriceRecord(record: Partial<PriceRecord>): Promise<PriceRecord> {
    return request<PriceRecord>('/api/prices/records', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },

  async getReport(deviceId: string): Promise<TransactionReport> {
    return request<TransactionReport>(`/api/devices/${deviceId}/report`);
  },

  // Share Token Lifecycle APIs
  async generateShareToken(deviceId: string, validityDays: number = 7): Promise<{ success: boolean; shareToken: string; shareExpiresAt: string; device: Device }> {
    return request<{ success: boolean; shareToken: string; shareExpiresAt: string; device: Device }>(`/api/devices/${deviceId}/share/generate`, {
      method: 'POST',
      body: JSON.stringify({ validityDays }),
    });
  },

  async revokeShareToken(deviceId: string): Promise<{ success: boolean; shareIsRevoked: boolean; device: Device }> {
    return request<{ success: boolean; shareIsRevoked: boolean; device: Device }>(`/api/devices/${deviceId}/share/revoke`, {
      method: 'POST',
    });
  },

  async getShareLogs(deviceId: string): Promise<{ deviceId: string; totalAccessCount: number; logs: ShareAccessLog[] }> {
    return request<{ deviceId: string; totalAccessCount: number; logs: ShareAccessLog[] }>(`/api/devices/${deviceId}/share/logs`);
  },

  async getSharedReport(shareToken: string): Promise<{ device: Device; report: TransactionReport; isSharedView: boolean }> {
    const res = await fetch(`/api/share/${shareToken}`);
    if (!res.ok) {
      let msg = '공유된 리포트를 불러올 수 없습니다.';
      try {
        const d = await res.json();
        if (d.error) msg = d.error;
      } catch {}
      throw new Error(msg);
    }
    return res.json();
  },

  // Admin APIs
  async getAdminStats(): Promise<AdminStats> {
    return request<AdminStats>('/api/admin/stats');
  },

  async getAdminDevices(): Promise<Device[]> {
    return request<Device[]>('/api/admin/devices');
  },

  async getAdminUsers(): Promise<UserProfile[]> {
    return request<UserProfile[]>('/api/admin/users');
  },
};

