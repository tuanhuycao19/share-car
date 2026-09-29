import type { BookingStatus, DriverStatus, TripStatus } from '@share-car/api-client';
import { Badge } from '@/components/ui/badge';
import { BOOKING_STATUS, DRIVER_STATUS, TRIP_STATUS } from '@/lib/labels';

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const s = TRIP_STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const s = BOOKING_STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  const s = DRIVER_STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
