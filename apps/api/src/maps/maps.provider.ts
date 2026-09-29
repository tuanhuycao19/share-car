import { PlaceDto } from './place.dto';

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Hợp đồng cho dịch vụ bản đồ. Giai đoạn đầu dùng MockMapsProvider;
 * sau này có thể thay bằng Google Maps / Goong / Vietmap / OSRM mà không đổi nghiệp vụ.
 */
export interface MapsProvider {
  readonly name: string;
  searchPlaces(query: string | undefined, limit: number): Promise<PlaceDto[]>;
}

export const MAPS_PROVIDER = Symbol('MAPS_PROVIDER');

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
