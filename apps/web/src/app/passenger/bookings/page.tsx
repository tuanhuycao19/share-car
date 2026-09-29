'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Booking } from '@share-car/api-client';
import { PhoneIcon } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { BookingStatusBadge } from '@/components/status-badge';
import { RouteLine } from '@/components/trip-summary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { formatDateTime, formatVnd } from '@/lib/format';
import { VEHICLE_TYPE_LABEL } from '@/lib/labels';

export default function MyBookingsPage() {
  const bookings = useQuery({
    queryKey: ['bookings', 'mine'],
    queryFn: async () => (await api.GET('/bookings/mine')).data!,
  });

  return (
    <div>
      <PageHeader
        title="Vé của tôi"
        description="Lịch sử đặt chỗ và các chuyến sắp đi"
        actions={
          <Button asChild>
            <Link href="/">Tìm chuyến mới</Link>
          </Button>
        }
      />
      {bookings.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : bookings.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(bookings.error)}</AlertDescription>
        </Alert>
      ) : bookings.data.length === 0 ? (
        <EmptyState title="Bạn chưa đặt chuyến nào">
          <Link href="/" className="text-primary hover:underline">
            Tìm chuyến ngay
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {bookings.data.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const queryClient = useQueryClient();
  const trip = booking.trip!;
  const cancellable =
    booking.status === 'CONFIRMED' && trip.status === 'SCHEDULED' && new Date(trip.departureTime) > new Date();

  const cancel = useMutation({
    mutationFn: async () =>
      (await api.POST('/bookings/{id}/cancel', { params: { path: { id: booking.id } }, body: {} })).data!,
    onSuccess: () => {
      toast.success('Đã hủy vé');
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Card>
      <CardContent className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <BookingStatusBadge status={booking.status} />
            <span className="text-sm font-medium">{formatDateTime(trip.departureTime)}</span>
          </div>
          <RouteLine from={booking.pickup.address} to={booking.dropoff.address} />
          <div className="text-muted-foreground space-y-1 text-sm">
            <p>
              Chuyến: {trip.origin.address} → {trip.destination.address}
            </p>
            <p>
              {VEHICLE_TYPE_LABEL[trip.vehicle.type]} {trip.vehicle.brand} {trip.vehicle.model} ·{' '}
              <span className="text-foreground font-medium">{trip.vehicle.plateNumber}</span> · Tài xế{' '}
              {trip.driver.fullName}
            </p>
            {trip.driver.phone && (
              <a href={`tel:${trip.driver.phone}`} className="text-primary inline-flex items-center gap-1 font-medium">
                <PhoneIcon className="size-3.5" /> {trip.driver.phone}
              </a>
            )}
            {booking.cancelReason && <p>Lý do: {booking.cancelReason}</p>}
          </div>
        </div>
        <div className="flex flex-row items-end justify-between gap-3 md:flex-col md:items-end">
          <div className="text-right">
            <div className="text-muted-foreground text-xs">
              {booking.seats} ghế × {formatVnd(booking.pricePerSeat)}
            </div>
            <div className="text-lg font-semibold">{formatVnd(booking.totalPrice)}</div>
          </div>
          {cancellable && (
            <Button
              variant="outline"
              size="sm"
              disabled={cancel.isPending}
              onClick={() => {
                if (window.confirm('Bạn chắc chắn muốn hủy vé này?')) cancel.mutate();
              }}
            >
              Hủy vé
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
