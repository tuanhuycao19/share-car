'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Location } from '@share-car/api-client';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { PlacePicker } from '@/components/place-picker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { formatVnd, isoToVnLocalInput, vnLocalInputToIso } from '@/lib/format';
import { VEHICLE_TYPE_LABEL } from '@/lib/labels';
import { DriverStatusAlert } from '../../driver-status-alert';

export default function NewTripPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const vehicles = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => (await api.GET('/vehicles')).data!,
  });
  const active = useMemo(() => vehicles.data?.filter((v) => v.isActive) ?? [], [vehicles.data]);

  const [vehicleId, setVehicleId] = useState('');
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [departure, setDeparture] = useState('');
  const [price, setPrice] = useState(150_000);
  const [seats, setSeats] = useState(4);
  const [note, setNote] = useState('');

  const vehicle = active.find((v) => v.id === vehicleId) ?? active[0];
  const capacity = vehicle?.passengerCapacity ?? 4;
  const minDeparture = isoToVnLocalInput(new Date(Date.now() + 30 * 60_000));

  const create = useMutation({
    mutationFn: async () =>
      (
        await api.POST('/trips', {
          body: {
            vehicleId: vehicle!.id,
            origin: origin!,
            destination: destination!,
            departureTime: vnLocalInputToIso(departure),
            pricePerSeat: price,
            totalSeats: Math.min(seats, capacity),
            note: note || undefined,
          },
        })
      ).data!,
    onSuccess: (trip) => {
      toast.success('Đã đăng chuyến');
      void queryClient.invalidateQueries({ queryKey: ['trips'] });
      router.push(`/driver/trips/${trip.id}`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (user?.driverProfile?.status !== 'APPROVED') {
    return (
      <div>
        <PageHeader title="Đăng chuyến" />
        <DriverStatusAlert />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Đăng chuyến mới" description="Giờ hiển thị và nhập theo giờ Việt Nam (GMT+7)" />
      {vehicles.isSuccess && active.length === 0 ? (
        <Alert>
          <AlertDescription>
            Bạn cần{' '}
            <Link href="/driver/vehicles" className="text-primary font-medium underline">
              thêm xe
            </Link>{' '}
            trước khi đăng chuyến.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!origin || !destination) {
                  toast.error('Vui lòng chọn điểm đi và điểm đến từ danh sách gợi ý');
                  return;
                }
                create.mutate();
              }}
            >
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="vehicle">Xe</Label>
                <NativeSelect id="vehicle" value={vehicle?.id ?? ''} onChange={(e) => setVehicleId(e.target.value)}>
                  {active.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} — {VEHICLE_TYPE_LABEL[v.type]} {v.brand} {v.model}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="sm:col-span-2">
                <PlacePicker label="Điểm đi" value={origin} onChange={setOrigin} required />
              </div>
              <div className="sm:col-span-2">
                <PlacePicker label="Điểm đến" value={destination} onChange={setDestination} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departure">Giờ khởi hành</Label>
                <Input
                  id="departure"
                  type="datetime-local"
                  min={minDeparture}
                  value={departure}
                  onChange={(e) => setDeparture(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seats">Số ghế mở bán (tối đa {capacity})</Label>
                <NativeSelect id="seats" value={Math.min(seats, capacity)} onChange={(e) => setSeats(Number(e.target.value))}>
                  {Array.from({ length: capacity }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} ghế
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Giá mỗi ghế (VND)</Label>
                <Input
                  id="price"
                  type="number"
                  inputMode="numeric"
                  min={10_000}
                  max={5_000_000}
                  step={1_000}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  required
                />
                <p className="text-muted-foreground text-xs">{formatVnd(price || 0)} / ghế</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="note">Ghi chú (tùy chọn)</Label>
                <Textarea
                  id="note"
                  maxLength={500}
                  placeholder="Ví dụ: đón dọc QL5, không hút thuốc..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="ghost" asChild>
                  <Link href="/driver/trips">Hủy</Link>
                </Button>
                <Button type="submit" disabled={create.isPending || !vehicle}>
                  {create.isPending ? 'Đang đăng...' : 'Đăng chuyến'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
