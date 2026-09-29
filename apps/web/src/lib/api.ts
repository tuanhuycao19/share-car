import { createApiClient } from '@share-car/api-client';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const TOKEN_KEY = 'sharecar.token';
export const AUTH_LOGOUT_EVENT = 'sharecar:logout';

/**
 * Lưu JWT ở localStorage cho đơn giản ở giai đoạn đầu.
 * TODO: chuyển sang httpOnly cookie + refresh token khi lên production.
 */
export const tokenStore = {
  get(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    window.localStorage.removeItem(TOKEN_KEY);
  },
};

export const api = createApiClient({
  baseUrl: API_URL,
  getToken: tokenStore.get,
  onUnauthorized: () => {
    if (typeof window !== 'undefined' && tokenStore.get()) {
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
    }
  },
});
