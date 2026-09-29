import { Inject, Injectable, Logger } from '@nestjs/common';
import { APP_ENV, AppEnv } from '../config/env';
import { haversineKm } from '../maps/maps.provider';
import { EngineMatchRequest, EngineMatchResponse, EngineSuggestion } from './engine.types';

export interface MatchResult {
  suggestions: EngineSuggestion[];
  source: 'engine' | 'fallback';
}

/**
 * Gọi matching engine để lấy đề xuất ghép chuyến.
 * Engine CHỈ đề xuất & xếp hạng; backend vẫn là nơi kiểm tra quyền, giá, tồn ghế và lưu booking.
 * Nếu engine lỗi/timeout → dùng xếp hạng dự phòng đơn giản để hệ thống vẫn hoạt động.
 */
@Injectable()
export class EngineService {
  private readonly logger = new Logger(EngineService.name);

  constructor(@Inject(APP_ENV) private readonly env: AppEnv) {}

  async match(body: EngineMatchRequest): Promise<MatchResult> {
    if (body.candidates.length === 0) return { suggestions: [], source: 'engine' };
    try {
      const res = await fetch(`${this.env.engineUrl}/v1/match`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.env.engineTimeoutMs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = (await res.json()) as EngineMatchResponse;
      return { suggestions: data.suggestions, source: 'engine' };
    } catch (err) {
      this.logger.warn(`Engine không khả dụng, dùng xếp hạng dự phòng: ${(err as Error).message}`);
      return { suggestions: this.fallback(body), source: 'fallback' };
    }
  }

  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${this.env.engineUrl}/health`, {
        signal: AbortSignal.timeout(this.env.engineTimeoutMs),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /** Dự phòng: sắp xếp theo tổng khoảng cách điểm đón/trả tới điểm đi/đến của chuyến. */
  private fallback({ request, candidates, limit }: EngineMatchRequest): EngineSuggestion[] {
    const desired = request.desired_departure ? Date.parse(request.desired_departure) : null;
    return candidates
      .filter((c) => c.available_seats >= request.seats)
      .map((c) => {
        const pickupKm = haversineKm(request.pickup, c.origin);
        const dropoffKm = haversineKm(request.dropoff, c.destination);
        const timeDiff =
          desired === null ? null : Math.round((Date.parse(c.departure_time) - desired) / 60000);
        return {
          trip_id: c.trip_id,
          score: Math.max(0, 100 - (pickupKm + dropoffKm) * 2),
          pickup_distance_km: round1(pickupKm),
          dropoff_distance_km: round1(dropoffKm),
          detour_km: 0,
          time_diff_minutes: timeDiff,
          reasons: ['Xếp hạng dự phòng (engine không khả dụng)'],
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
