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
  if (typeof error.detail === 'string') return error.detail;
  if (Array.isArray(error.detail) && error.detail.length > 0) {
    return error.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
  }
  if (error.message) return error.message;
  return 'Unknown error';
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync('access_token');
  }

  private async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync('refresh_token');
  }

  private async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync('access_token', accessToken);
    await SecureStore.setItemAsync('refresh_token', refreshToken);
  }

  private async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
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

      if (!response.ok) return false;

      const data = await response.json();
      await this.storeTokens(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    }
  }

  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = config;

    const accessToken = await this.getAccessToken();
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

    if (response.status === 401 && accessToken) {
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
    const refreshToken = await this.getRefreshToken();
    if (refreshToken) {
      await this.request('/auth/logout', {
        method: 'POST',
        body: { refresh_token: refreshToken },
      });
    }
    await this.clearTokens();
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

  async isLoggedIn(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }
}

export const api = new ApiClient(API_BASE_URL);
