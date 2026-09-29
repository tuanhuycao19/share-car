import type { Location } from '@share-car/api-client';

/** Tham số tìm chuyến được giữ trên URL để chia sẻ link & điền sẵn form đặt vé. */
export interface TripSearch {
  pickup: Location;
  dropoff: Location;
  date: string;
  time?: string;
  seats: number;
}

export function searchToParams(s: TripSearch): URLSearchParams {
  const p = new URLSearchParams({
    pickupAddress: s.pickup.address,
    pickupLat: String(s.pickup.lat),
    pickupLng: String(s.pickup.lng),
    dropoffAddress: s.dropoff.address,
    dropoffLat: String(s.dropoff.lat),
    dropoffLng: String(s.dropoff.lng),
    date: s.date,
    seats: String(s.seats),
  });
  if (s.time) p.set('time', s.time);
  return p;
}

function loc(p: URLSearchParams, prefix: 'pickup' | 'dropoff'): Location | null {
  const address = p.get(`${prefix}Address`);
  const lat = Number(p.get(`${prefix}Lat`));
  const lng = Number(p.get(`${prefix}Lng`));
  if (!address || !Number.isFinite(lat) || !Number.isFinite(lng) || p.get(`${prefix}Lat`) === null) {
    return null;
  }
  return { address, lat, lng };
}

export function paramsToSearch(p: URLSearchParams): Partial<TripSearch> {
  const seats = Number(p.get('seats'));
  return {
    pickup: loc(p, 'pickup') ?? undefined,
    dropoff: loc(p, 'dropoff') ?? undefined,
    date: p.get('date') ?? undefined,
    time: p.get('time') ?? undefined,
    seats: Number.isInteger(seats) && seats >= 1 && seats <= 6 ? seats : undefined,
  };
}
