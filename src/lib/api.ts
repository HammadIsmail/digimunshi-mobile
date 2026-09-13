import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

interface RequestConfig {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

function extractErrorMessage(error: any): string {
  let msg = '';
  if (typeof error.detail === 'string') msg = error.detail;
  else if (Array.isArray(error.detail) && error.detail.length > 0) {
    msg = error.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
  } else if (error.message) {
    msg = error.message;
  }

  if (!msg) return 'نامعلوم خرابی پیش آئی ہے۔';

  if (msg.includes('Account not found') || msg.includes('Shop not found')) {
    return 'آپ کا اکاؤنٹ موجود نہیں ہے۔ براہِ کرم نیا اکاؤنٹ بنائیں۔';
  }
  if (msg.includes('Invalid PIN') || msg.includes('Invalid phone number or PIN')) {
    return 'آپ کا پِن غلط ہے۔ براہِ کرم دوبارہ درست پِن درج کریں۔';
  }
  if (msg.includes('Phone number already registered')) {
    return 'یہ موبائل نمبر پہلے سے رجسٹرڈ ہے۔ براہِ کرم لاگ ان کریں۔';
  }
  if (msg.includes('Account locked')) {
    return 'اکاؤنٹ عارضی طور پر لاک ہے۔ براہِ کرم کچھ دیر بعد کوشش کریں۔';
  }

  return msg;
}

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    let jsonStr = '';
    if (typeof atob === 'function') {
      jsonStr = atob(base64);
    } else {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let bc = 0;
      let bs = 0;
      let buffer: string;
      for (let idx = 0; (buffer = base64.charAt(idx++)); ) {
        const index = chars.indexOf(buffer);
        if (index === -1) continue;
        bs = bc % 4 ? bs * 64 + index : index;
        if (bc++ % 4) {
          jsonStr += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
        }
      }
    }

    const payload = JSON.parse(jsonStr);
    if (!payload.exp) return false;
    // Consider token expired if within 30 seconds of expiration
    return payload.exp * 1000 <= Date.now() + 30000;
  } catch {
    return true;
  }
}

class ApiClient {
  private baseUrl: string;
  private unauthorizedListeners: Array<() => void> = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  onUnauthorized(listener: () => void) {
    this.unauthorizedListeners.push(listener);
    return () => {
      this.unauthorizedListeners = this.unauthorizedListeners.filter((l) => l !== listener);
    };
  }

  private notifyUnauthorized() {
    this.unauthorizedListeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.warn('Error in unauthorized listener:', err);
      }
    });
  }

  private async getStorageItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      try {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    }
  }

  private async setStorageItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch {
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      } catch (err) {
        console.warn('Failed to set storage item:', err);
      }
    }
  }

  private async deleteStorageItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch {
      try {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      } catch (err) {
        console.warn('Failed to delete storage item:', err);
      }
    }
  }

  private async getAccessToken(): Promise<string | null> {
    return this.getStorageItem('access_token');
  }

  private async getRefreshToken(): Promise<string | null> {
    return this.getStorageItem('refresh_token');
  }

  private async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    await this.setStorageItem('access_token', accessToken);
    await this.setStorageItem('refresh_token', refreshToken);
  }

  private async clearTokens(): Promise<void> {
    await this.deleteStorageItem('access_token');
    await this.deleteStorageItem('refresh_token');
  }

  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        await this.clearTokens();
        return false;
      }

      const data = await response.json();
      await this.storeTokens(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    }
  }

  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = config;

    let accessToken = await this.getAccessToken();

    // Proactive JWT token refresh if token expired or about to expire
    if (accessToken && isTokenExpired(accessToken)) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        accessToken = await this.getAccessToken();
      }
    }

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (accessToken) {
      requestHeaders['Authorization'] = `Bearer ${accessToken}`;
    }

    let response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        const newAccessToken = await this.getAccessToken();
        if (newAccessToken) {
          requestHeaders['Authorization'] = `Bearer ${newAccessToken}`;
          response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
          });
        }
      } else {
        await this.clearTokens();
        this.notifyUnauthorized();
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
      throw new Error(extractErrorMessage(error));
    }

    if (response.status === 204) return {} as T;
    return response.json();
  }


  async register(ownerName: string, phoneNumber: string, pin: string) {
    const data = await this.request<{
      shop_id: string;
      access_token: string;
      refresh_token: string;
    }>('/auth/register', {
      method: 'POST',
      body: { owner_name: ownerName, phone_number: phoneNumber, pin },
    });

    await this.storeTokens(data.access_token, data.refresh_token);
    return data;
  }

  async checkPhone(phoneNumber: string): Promise<{ exists: boolean }> {
    try {
      return await this.request<{ exists: boolean }>(
        `/auth/check-phone?phone_number=${encodeURIComponent(phoneNumber)}`
      );
    } catch {
      return { exists: false };
    }
  }

  async login(phoneNumber: string, pin: string) {
    const data = await this.request<{
      access_token: string;
      refresh_token: string;
    }>('/auth/login', {
      method: 'POST',
      body: { phone_number: phoneNumber, pin },
    });

    await this.storeTokens(data.access_token, data.refresh_token);
    return data;
  }

  async logout() {
    try {
      const refreshToken = await this.getRefreshToken();
      if (refreshToken) {
        await this.request('/auth/logout', {
          method: 'POST',
          body: { refresh_token: refreshToken },
        }).catch((err) => {
          console.warn('Server logout failed, proceeding with local token clear:', err);
        });
      }
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      await this.clearTokens();
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async processVoice(audioUri: string, sessionId: string) {
    let base64Audio = '';
    const isWav = audioUri.toLowerCase().endsWith('.wav');
    const format = isWav ? 'wav' : 'm4a';

    if (Platform.OS === 'web') {
      const response = await fetch(audioUri);
      const blob = await response.blob();
      base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const b64 = result.includes(',') ? result.split(',')[1] : result;
          resolve(b64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      try {
        base64Audio = await FileSystem.readAsStringAsync(audioUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch {
        const response = await fetch(audioUri);
        const blob = await response.blob();
        base64Audio = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const b64 = result.includes(',') ? result.split(',')[1] : result;
            resolve(b64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    }

    return this.request<{
      transcript: string;
      intent: string;
      requires_confirmation: boolean;
      pending_action_id: string | null;
      response_text: string;
      response_audio_url: string | null;
      resolved_entities: Record<string, any>;
      ledger_updated?: boolean;
    }>('/voice/process', {
      method: 'POST',
      body: {
        audio_base64: base64Audio,
        session_id: sessionId,
        format,
      },
    });
  }

  async transcribeAudio(audioUri: string): Promise<string> {
    let base64Audio = '';
    const isWav = audioUri.toLowerCase().endsWith('.wav');
    const format = isWav ? 'wav' : 'm4a';

    if (Platform.OS === 'web') {
      const response = await fetch(audioUri);
      const blob = await response.blob();
      base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const b64 = result.includes(',') ? result.split(',')[1] : result;
          resolve(b64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      try {
        base64Audio = await FileSystem.readAsStringAsync(audioUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch {
        const response = await fetch(audioUri);
        const blob = await response.blob();
        base64Audio = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const b64 = result.includes(',') ? result.split(',')[1] : result;
            resolve(b64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    }

    const res = await this.request<{ transcript: string }>('/voice/transcribe', {
      method: 'POST',
      body: {
        audio_base64: base64Audio,
        format,
      },
    });

    return res.transcript || '';
  }


  async confirmVoice(pendingActionId: string, confirmed: boolean) {
    return this.request<{
      response_text: string;
      response_audio_url: string | null;
      status: string;
      ledger_updated?: boolean;
      [key: string]: any;
    }>('/voice/confirm', {

      method: 'POST',
      body: { pending_action_id: pendingActionId, confirmed },
    });
  }

  async getRealtimeSession() {
    return this.request<{
      token: string;
      wsUrl: string;
      roomName: string;
    }>('/voice/realtime-session', {
      method: 'POST',
    });
  }

  async getCustomers() {
    return this.request<Array<{ id: string; name: string; balance: number }>>('/customers');
  }

  async getBalance(customerId: string) {
    return this.request<{ customer_id: string; customer_name: string; balance: number }>(
      `/ledger/balance?customer_id=${customerId}`
    );
  }

  async getEntries(customerId: string) {
    return this.request<Array<{ id: string; amount: number; entry_type: string; description?: string; created_at: string }>>(
      `/ledger/entries?customer_id=${customerId}`
    );
  }



  async getSummary() {
    return this.request<{ total_outstanding: number; customer_count: number }>('/ledger/summary');
  }

  async getMe() {
    return this.request<{ shop_id: string; owner_name: string; phone_number: string }>('/auth/me');
  }

  async clearCustomerKhata(customerId: string) {
    return this.request<{ status: string; message: string; cleared_entries_count: number }>(
      `/customers/${customerId}/clear`,
      {
        method: 'POST',
        body: { confirmed: true },
      }
    );
  }

  async cancelLedgerEntry(entryId: string) {
    return this.request<{ status: string; message: string; cleared_entries_count: number }>(
      `/entries/${entryId}/cancel`,
      {
        method: 'POST',
        body: { confirmed: true },
      }
    );
  }

  async createLedgerEntry(
    customerId: string,
    amount: number,
    entryType: 'udhaar' | 'wusool',
    description?: string,
    confirmed: boolean = false
  ) {
    return this.request<{
      id: string;
      amount: number;
      entry_type: string;
      description?: string;
      created_at: string;
    }>('/ledger/entries', {
      method: 'POST',
      body: {
        customer_id: customerId,
        amount,
        entry_type: entryType,
        description,
        confirmed,
      },
    });
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      let token = await this.getAccessToken();
      const refreshToken = await this.getRefreshToken();

      if (!token && !refreshToken) {
        return false;
      }

      // If access token is missing or expired, attempt refresh
      if (!token || isTokenExpired(token)) {
        if (refreshToken) {
          const refreshed = await this.refreshAccessToken();
          if (!refreshed) {
            await this.clearTokens();
            return false;
          }
          token = await this.getAccessToken();
        } else {
          await this.clearTokens();
          return false;
        }
      }

      // Validate session with server /auth/me to guarantee JWT validity
      try {
        await this.getMe();
        return true;
      } catch (err: any) {
        // If 401 or token rejected, attempt one final refresh before giving up
        if (refreshToken) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            try {
              await this.getMe();
              return true;
            } catch {
              // Server rejected fresh token
            }
          }
        }
        await this.clearTokens();
        return false;
      }
    } catch {
      return false;
    }
  }
}

export const api = new ApiClient(API_BASE_URL);

