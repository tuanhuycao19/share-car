'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { VehicleType } from '@share-car/api-client';
import { PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { VEHICLE_TYPE_LABEL } from '@/lib/labels';
import { DriverStatusAlert } from '../driver-status-alert';

const EMPTY = { plateNumber: '', brand: '', model: '', color: '', type: 'SEATS_5' as VehicleType };

export default function VehiclesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const vehicles = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => (await api.GET('/vehicles')).data!,
  });

  const create = useMutation({
    mutationFn: async () =>
      (await api.POST('/vehicles', { body: { ...form, color: form.color || undefined } })).data!,
    onSuccess: () => {
      toast.success('Đã thêm xe');
      setForm(EMPTY);
      setShowForm(false);
      void queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      (await api.PATCH('/vehicles/{id}', { params: { path: { id } }, body: { isActive } })).data!,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <div>
      <PageHeader
        title="Xe của tôi"
        description="Xe 5 chỗ nhận tối đa 4 khách, xe 7 chỗ nhận tối đa 6 khách"
        actions={
          <Button onClick={() => setShowForm((s) => !s)}>
            <PlusIcon /> Thêm xe
          </Button>
        }
      />
      <DriverStatusAlert />

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Thêm xe mới</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="plate">Biển số</Label>
                <Input
                  id="plate"
                  placeholder="30A-123.45"
                  value={form.plateNumber}
                  onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Loại xe</Label>
                <NativeSelect
                  id="type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as VehicleType })}
                >
                  <option value="SEATS_5">Xe 5 chỗ (tối đa 4 khách)</option>
                  <option value="SEATS_7">Xe 7 chỗ (tối đa 6 khách)</option>
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Hãng xe</Label>
                <Input id="brand" placeholder="Toyota" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Dòng xe</Label>
                <Input id="model" placeholder="Vios" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Màu (tùy chọn)</Label>
                <Input id="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" disabled={create.isPending}>
                  Lưu xe
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Hủy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {vehicles.isPending ? (
        <Skeleton className="h-32" />
      ) : vehicles.data?.length === 0 ? (
        <EmptyState title="Bạn chưa có xe nào">Thêm xe để bắt đầu đăng chuyến.</EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {vehicles.data?.map((v) => (
            <Card key={v.id} className={v.isActive ? '' : 'opacity-60'}>
              <CardContent className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-lg font-semibold">{v.plateNumber}</div>
                  <div className="text-muted-foreground text-sm">
                    {v.brand} {v.model}
                    {v.color ? ` · ${v.color}` : ''}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Badge variant="secondary">{VEHICLE_TYPE_LABEL[v.type]}</Badge>
                    <Badge variant="outline">Tối đa {v.passengerCapacity} khách</Badge>
                    {!v.isActive && <Badge variant="muted">Ngừng sử dụng</Badge>}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={toggle.isPending}
                  onClick={() => toggle.mutate({ id: v.id, isActive: !v.isActive })}
                >
                  {v.isActive ? 'Ngừng dùng' : 'Dùng lại'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
