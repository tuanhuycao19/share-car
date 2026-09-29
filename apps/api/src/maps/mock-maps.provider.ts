import { Injectable } from '@nestjs/common';
import { MapsProvider } from './maps.provider';
import { MOCK_PLACES } from './mock-places';
import { PlaceDto } from './place.dto';

export function normalizeVi(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * ⚠️ MOCK maps provider:
 * - Tìm địa điểm trong danh sách cố định MOCK_PLACES.
 * - Tuyến đường (dùng khi ghép khách) được coi là đoạn thẳng điểm đi → điểm đến,
 *   xem cột route_geog trong migration và RoutingProvider trong services/engine.
 */
@Injectable()
export class MockMapsProvider implements MapsProvider {
  readonly name = 'mock';

  async searchPlaces(query: string | undefined, limit: number): Promise<PlaceDto[]> {
    const q = query ? normalizeVi(query) : '';
    const results = q
      ? MOCK_PLACES.filter((p) =>
          normalizeVi(`${p.name} ${p.address} ${p.province}`).includes(q),
        )
      : MOCK_PLACES;
    return results.slice(0, limit);
  }
}
