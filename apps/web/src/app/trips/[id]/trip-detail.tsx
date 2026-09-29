'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Location, Trip } from '@share-car/api-client';
import { ArrowLeftIcon, UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PlacePicker } from '@/components/place-picker';
import { TripSummary } from '@/components/trip-summary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { formatVnd } from '@/lib/format';
import { paramsToSearch } from '@/lib/search-params';

export function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const trip = useQuery({
    queryKey: ['trips', id],
    queryFn: async () => (await api.GET('/trips/{id}', { params: { path: { id } } })).data!,
  });

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={params.get('pickupLat') ? `/trips/search?${params}` : '/'}>
          <ArrowLeftIcon /> Quay lại
        </Link>
      </Button>

      {trip.isPending ? (
        <Skeleton className="h-96 w-full" />
      ) : trip.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(trip.error)}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Chi tiết chuyến</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <TripSummary trip={trip.data} showStatus />
              <Separator />
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <Info label="Tài xế">
                  <span className="flex items-center gap-1.5">
                    <UserIcon className="size-4" /> {trip.data.driver.fullName}
                  </span>
                </Info>
                <Info label="Xe">
                  {trip.data.vehicle.brand} {trip.data.vehicle.model}
                  {trip.data.vehicle.color ? ` · ${trip.data.vehicle.color}` : ''}
                </Info>
                {trip.data.note && <Info label="Ghi chú của tài xế">{trip.data.note}</Info>}
              </div>
              <p className="text-muted-foreground text-xs">
                Số điện thoại tài xế và biển số xe hiển thị trong mục “Vé của tôi” sau khi đặt thành công.
              </p>
            </CardContent>
          </Card>
          <BookingPanel trip={trip.data} />
        </div>
      )}
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="font-medium">{children}</div>
    </div>
  );
}

function BookingPanel({ trip }: { trip: Trip }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const search = paramsToSearch(params);

  const maxSeats = trip.availableSeats;
  const [seats, setSeats] = useState(Math.min(search.seats ?? 1, Math.max(maxSeats, 1)));
  const [pickup, setPickup] = useState<Location | null>(search.pickup ?? trip.origin);
  const [dropoff, setDropoff] = useState<Location | null>(search.dropoff ?? trip.destination);
  const [note, setNote] = useState('');

  const book = useMutation({
    mutationFn: async () =>
      (
        await api.POST('/bookings', {
          body: { tripId: trip.id, seats, pickup: pickup!, dropoff: dropoff!, note: note || undefined },
        })
      ).data!,
    onSuccess: (booking) => {
      toast.success(`Đặt ${booking.seats} ghế thành công — tổng ${formatVnd(booking.totalPrice)}`);
      void queryClient.invalidateQueries({ queryKey: ['trips'] });
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      router.push('/passenger/bookings');
    },
    onError: (err) => {
      toast.error(errorMessage(err));
      void queryClient.invalidateQueries({ queryKey: ['trips', trip.id] });
    },
  });

  const bookable = trip.status === 'SCHEDULED' && maxSeats > 0 && new Date(trip.departureTime) > new Date();
  const next = `${pathname}?${params}`;

  return (
    <Card className="h-fit lg:sticky lg:top-20">
      <CardHeader>
        <CardTitle>Đặt ghế</CardTitle>
        <CardDescription>{formatVnd(trip.pricePerSeat)} / ghế · thanh toán trực tiếp cho tài xế</CardDescription>
      </CardHeader>
      <CardContent>
        {!bookable ? (
          <Alert>
            <AlertDescription>Chuyến này hiện không nhận đặt chỗ.</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !user ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">Đăng nhập bằng tài khoản hành khách để đặt ghế.</p>
            <Button asChild className="w-full">
              <Link href={`/login?next=${encodeURIComponent(next)}`}>Đăng nhập để đặt</Link>
            </Button>
          </div>
        ) : user.role !== 'PASSENGER' ? (
          <Alert>
            <AlertDescription>Chỉ tài khoản hành khách mới đặt được ghế.</AlertDescription>
          </Alert>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!pickup || !dropoff) {
                toast.error('Vui lòng chọn điểm đón và điểm trả');
                return;
              }
              book.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="seats">Số ghế</Label>
              <NativeSelect id="seats" value={seats} onChange={(e) => setSeats(Number(e.target.value))}>
                {Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} ghế
                  </option>
                ))}
              </NativeSelect>
            </div>
            <PlacePicker label="Điểm đón" value={pickup} onChange={setPickup} required />
            <PlacePicker label="Điểm trả" value={dropoff} onChange={setDropoff} required />
            <div className="space-y-2">
              <Label htmlFor="note">Ghi chú cho tài xế</Label>
              <Textarea
                id="note"
                value={note}
                maxLength={500}
                placeholder="Ví dụ: đón ở cổng chính, có 1 vali lớn..."
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Tạm tính</span>
              <span className="text-primary text-xl font-semibold">{formatVnd(trip.pricePerSeat * seats)}</span>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={book.isPending}>
              {book.isPending ? 'Đang đặt...' : 'Xác nhận đặt ghế'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
