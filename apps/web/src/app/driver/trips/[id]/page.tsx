'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Booking } from '@share-car/api-client';
import { ArrowLeftIcon, PhoneIcon } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { BookingStatusBadge } from '@/components/status-badge';
import { TripSummary } from '@/components/trip-summary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { formatVnd } from '@/lib/format';

type NextStatus = 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export default function DriverTripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const tripQuery = useQuery({
    queryKey: ['trips', id],
    queryFn: async () => (await api.GET('/trips/{id}', { params: { path: { id } } })).data!,
  });
  const trip = tripQuery.data;
  const bookings = useQuery({
    queryKey: ['trips', id, 'bookings'],
    queryFn: async () => (await api.GET('/trips/{id}/bookings', { params: { path: { id } } })).data!,
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['trips'] });

  const changeStatus = useMutation({
    mutationFn: async (status: NextStatus) =>
      (await api.PATCH('/trips/{id}/status', { params: { path: { id } }, body: { status } })).data!,
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái chuyến');
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const reject = useMutation({
    mutationFn: async (bookingId: string) =>
      (await api.POST('/bookings/{id}/reject', { params: { path: { id: bookingId } }, body: {} })).data!,
    onSuccess: () => {
      toast.success('Đã từ chối khách, ghế được hoàn lại');
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const actions: { status: NextStatus; label: string; variant: 'default' | 'outline' | 'destructive'; confirm?: string }[] =
    trip?.status === 'SCHEDULED'
      ? [
          { status: 'ONGOING', label: 'Bắt đầu chạy', variant: 'default' },
          { status: 'CANCELLED', label: 'Hủy chuyến', variant: 'destructive', confirm: 'Hủy chuyến sẽ hủy toàn bộ vé của khách. Tiếp tục?' },
        ]
      : trip?.status === 'ONGOING'
        ? [
            { status: 'COMPLETED', label: 'Hoàn thành', variant: 'default' },
            { status: 'CANCELLED', label: 'Hủy chuyến', variant: 'destructive', confirm: 'Hủy chuyến đang chạy?' },
          ]
        : [];

  const active = bookings.data?.filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED') ?? [];
  const revenue = active.reduce((s, b) => s + b.totalPrice, 0);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/driver/trips">
          <ArrowLeftIcon /> Danh sách chuyến
        </Link>
      </Button>

      {tripQuery.isPending ? (
        <Skeleton className="h-48" />
      ) : !trip || bookings.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {bookings.isError ? errorMessage(bookings.error) : errorMessage(tripQuery.error)}
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin chuyến</CardTitle>
            <CardDescription>
              Xe {trip.vehicle.plateNumber} · Doanh thu dự kiến {formatVnd(revenue)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TripSummary trip={trip} showStatus />
            {actions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {actions.map((a) => (
                  <Button
                    key={a.status}
                    variant={a.variant}
                    disabled={changeStatus.isPending}
                    onClick={() => {
                      if (!a.confirm || window.confirm(a.confirm)) changeStatus.mutate(a.status);
                    }}
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Hành khách</CardTitle>
          <CardDescription>
            {trip ? `${trip.bookedSeats}/${trip.totalSeats} ghế đã đặt` : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.isPending ? (
            <Skeleton className="h-24" />
          ) : bookings.data?.length === 0 ? (
            <EmptyState title="Chưa có khách đặt" />
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {bookings.data?.map((b) => (
                  <PassengerCard key={b.id} booking={b} canReject={trip?.status === 'SCHEDULED'} onReject={reject.mutate} />
                ))}
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khách</TableHead>
                      <TableHead>Đón → Trả</TableHead>
                      <TableHead>Ghế</TableHead>
                      <TableHead>Tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.data?.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="font-medium">{b.passenger?.fullName}</div>
                          {b.passenger?.phone && (
                            <a href={`tel:${b.passenger.phone}`} className="text-primary text-xs">
                              {b.passenger.phone}
                            </a>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs text-xs whitespace-normal">
                          {b.pickup.address} → {b.dropoff.address}
                          {b.note && <div className="text-muted-foreground italic">“{b.note}”</div>}
                        </TableCell>
                        <TableCell>{b.seats}</TableCell>
                        <TableCell>{formatVnd(b.totalPrice)}</TableCell>
                        <TableCell>
                          <BookingStatusBadge status={b.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {b.status === 'CONFIRMED' && trip?.status === 'SCHEDULED' && (
                            <RejectButton onConfirm={() => reject.mutate(b.id)} />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RejectButton({ onConfirm }: { onConfirm: () => void }) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        if (window.confirm('Từ chối khách này? Ghế sẽ được mở bán lại.')) onConfirm();
      }}
    >
      Từ chối
    </Button>
  );
}

function PassengerCard({
  booking: b,
  canReject,
  onReject,
}: {
  booking: Booking;
  canReject: boolean;
  onReject: (id: string) => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{b.passenger?.fullName}</span>
        <BookingStatusBadge status={b.status} />
      </div>
      {b.passenger?.phone && (
        <a href={`tel:${b.passenger.phone}`} className="text-primary inline-flex items-center gap-1">
          <PhoneIcon className="size-3.5" /> {b.passenger.phone}
        </a>
      )}
      <p className="text-muted-foreground">
        {b.pickup.address} → {b.dropoff.address}
      </p>
      {b.note && <p className="text-muted-foreground italic">“{b.note}”</p>}
      <div className="flex items-center justify-between">
        <span>
          {b.seats} ghế · <strong>{formatVnd(b.totalPrice)}</strong>
        </span>
        {canReject && b.status === 'CONFIRMED' && <RejectButton onConfirm={() => onReject(b.id)} />}
      </div>
    </div>
  );
}
