import type { Trip } from '@share-car/api-client';
import { CarIcon, ClockIcon, UsersIcon } from 'lucide-react';
import { TripStatusBadge } from '@/components/status-badge';
import { formatDateTime, formatVnd } from '@/lib/format';
import { VEHICLE_TYPE_LABEL } from '@/lib/labels';

/** Tuyến đường dạng timeline: điểm đi → điểm đến */
export function RouteLine({ from, to }: { from: string; to: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-3">
      <div className="flex flex-col items-center pt-1.5">
        <span className="border-primary size-2.5 rounded-full border-2" />
        <span className="bg-border my-1 w-px flex-1" />
        <span className="bg-primary size-2.5 rounded-full" />
      </div>
      <div className="space-y-3">
        <p className="leading-snug font-medium">{from}</p>
        <p className="leading-snug font-medium">{to}</p>
      </div>
    </div>
  );
}

export function TripSummary({ trip, showStatus = false }: { trip: Trip; showStatus?: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <ClockIcon className="size-4" />
          <span className="text-foreground font-medium">{formatDateTime(trip.departureTime)}</span>
        </div>
        {showStatus && <TripStatusBadge status={trip.status} />}
      </div>
      <RouteLine from={trip.origin.address} to={trip.destination.address} />
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5">
          <CarIcon className="size-4" />
          {VEHICLE_TYPE_LABEL[trip.vehicle.type]} · {trip.vehicle.brand} {trip.vehicle.model}
        </span>
        <span className="flex items-center gap-1.5">
          <UsersIcon className="size-4" />
          Còn {trip.availableSeats}/{trip.totalSeats} ghế
        </span>
        <span className="text-foreground font-semibold">{formatVnd(trip.pricePerSeat)}/ghế</span>
      </div>
    </div>
  );
}
