/**
 * @share-car/api-client — client typed sinh từ OpenAPI.
 *
 * Tái sinh sau khi đổi API:  pnpm api-client:generate  (ở gốc monorepo)
 *   1. apps/api xuất openapi.json
 *   2. openapi-typescript sinh src/schema.d.ts
 */
import createClient, { type Middleware } from 'openapi-fetch';
import type { components, paths } from './schema';

export type { components, paths };
export type Schemas = components['schemas'];

export type User = Schemas['UserDto'];
export type AdminUser = Schemas['AdminUserDto'];
export type Vehicle = Schemas['VehicleDto'];
export type Trip = Schemas['TripDto'];
export type TripMatch = Schemas['TripMatchDto'];
export type Booking = Schemas['BookingDto'];
export type Place = Schemas['PlaceDto'];
export type Location = Schemas['LocationDto'];
export type Role = User['role'];
export type TripStatus = Trip['status'];
export type BookingStatus = Booking['status'];
export type DriverStatus = Schemas['DriverProfileDto']['status'];
export type VehicleType = Vehicle['type'];

/** Lỗi chuẩn hóa từ response lỗi của NestJS */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const m = (body as { message: unknown }).message;
    if (Array.isArray(m)) return m.join('\n');
    if (typeof m === 'string') return m;
  }
  return fallback;
}

export interface ApiClientOptions {
  baseUrl: string;
  /** Trả về JWT hiện tại (hoặc null) */
  getToken?: () => string | null | undefined;
  /** Gọi khi API trả 401 (vd: xóa token, chuyển về trang đăng nhập) */
  onUnauthorized?: () => void;
}

export function createApiClient({ baseUrl, getToken, onUnauthorized }: ApiClientOptions) {
  const client = createClient<paths>({ baseUrl });

  const auth: Middleware = {
    onRequest({ request }) {
      const token = getToken?.();
      if (token) request.headers.set('Authorization', `Bearer ${token}`);
      return request;
    },
    async onResponse({ response }) {
      if (response.ok) return response;
      if (response.status === 401) onUnauthorized?.();
      const body = await response
        .clone()
        .json()
        .catch(() => undefined);
      throw new ApiError(response.status, extractMessage(body, response.statusText), body);
    },
  };
  client.use(auth);
  return client;
}

export type ApiClient = ReturnType<typeof createApiClient>;

/**
 * Tiện ích: lấy `data` từ kết quả openapi-fetch (lỗi đã được middleware ném ra dạng ApiError).
 */
export async function unwrap<T>(promise: Promise<{ data?: T; error?: unknown }>): Promise<T> {
  const { data } = await promise;
  return data as T;
}
