'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DriverStatus } from '@share-car/api-client';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { DriverStatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { formatDateTime } from '@/lib/format';
import { DRIVER_STATUS } from '@/lib/labels';

export default function AdminDriversPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<DriverStatus | ''>('PENDING');
  const drivers = useQuery({
    queryKey: ['admin', 'drivers', status],
    queryFn: async () =>
      (await api.GET('/admin/drivers', { params: { query: { status: status || undefined, pageSize: 100 } } })).data!,
  });

  const review = useMutation({
    mutationFn: async ({ userId, approve, reason }: { userId: string; approve: boolean; reason?: string }) =>
      (
        await api.POST(approve ? '/admin/drivers/{userId}/approve' : '/admin/drivers/{userId}/reject', {
          params: { path: { userId } },
          body: { reason },
        })
      ).data!,
    onSuccess: (_d, v) => {
      toast.success(v.approve ? 'Đã duyệt tài xế' : 'Đã từ chối tài xế');
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <div>
      <PageHeader
        title="Duyệt tài xế"
        actions={
          <div className="w-44">
            <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as DriverStatus | '')}>
              <option value="">Tất cả</option>
              {Object.entries(DRIVER_STATUS).map(([v, s]) => (
                <option key={v} value={v}>
                  {s.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        }
      />
      {drivers.isPending ? (
        <Skeleton className="h-32" />
      ) : drivers.data?.items.length === 0 ? (
        <EmptyState title="Không có tài xế nào" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {drivers.data?.items.map((d) => (
            <Card key={d.id}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{d.fullName}</div>
                    <div className="text-muted-foreground text-sm">
                      {d.email} · {d.phone}
                    </div>
                  </div>
                  {d.driverProfile && <DriverStatusBadge status={d.driverProfile.status} />}
                </div>
                <div className="text-sm">
                  GPLX: <span className="font-medium">{d.driverProfile?.licenseNumber}</span> · {d.vehicleCount} xe
                </div>
                <div className="text-muted-foreground text-xs">Đăng ký lúc {formatDateTime(d.createdAt)}</div>
                {d.driverProfile?.rejectReason && (
                  <div className="text-destructive text-sm">Lý do từ chối: {d.driverProfile.rejectReason}</div>
                )}
                <div className="flex gap-2">
                  {d.driverProfile?.status !== 'APPROVED' && (
                    <Button size="sm" disabled={review.isPending} onClick={() => review.mutate({ userId: d.id, approve: true })}>
                      Duyệt
                    </Button>
                  )}
                  {d.driverProfile?.status !== 'REJECTED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={review.isPending}
                      onClick={() => {
                        const reason = window.prompt('Lý do từ chối:');
                        if (reason?.trim()) review.mutate({ userId: d.id, approve: false, reason });
                      }}
                    >
                      Từ chối
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
