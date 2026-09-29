'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TripStatus } from '@share-car/api-client';
import { toast } from 'sonner';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { TripSummary } from '@/components/trip-summary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { TRIP_STATUS } from '@/lib/labels';

const PAGE_SIZE = 20;

export default function AdminTripsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TripStatus | ''>('');
  const [page, setPage] = useState(1);
  const trips = useQuery({
    queryKey: ['admin', 'trips', status, page],
    queryFn: async () =>
      (await api.GET('/admin/trips', { params: { query: { status: status || undefined, page, pageSize: PAGE_SIZE } } }))
        .data!,
    placeholderData: (prev) => prev,
  });

  const cancel = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      (await api.POST('/admin/trips/{id}/cancel', { params: { path: { id } }, body: { reason } })).data!,
    onSuccess: () => {
      toast.success('Đã hủy chuyến');
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const totalPages = trips.data ? Math.max(1, Math.ceil(trips.data.total / PAGE_SIZE)) : 1;

  return (
    <div>
      <PageHeader
        title="Chuyến xe"
        description={trips.data ? `${trips.data.total} chuyến` : undefined}
        actions={
          <div className="w-44">
            <NativeSelect
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as TripStatus | '');
                setPage(1);
              }}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(TRIP_STATUS).map(([v, s]) => (
                <option key={v} value={v}>
                  {s.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        }
      />
      {trips.isPending ? (
        <Skeleton className="h-40" />
      ) : trips.data?.items.length === 0 ? (
        <EmptyState title="Không có chuyến nào" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {trips.data?.items.map((t) => (
            <Card key={t.id}>
              <CardContent className="space-y-3">
                <TripSummary trip={t} showStatus />
                <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>
                    Tài xế: <span className="text-foreground">{t.driver.fullName}</span> ({t.driver.phone}) ·{' '}
                    {t.vehicle.plateNumber}
                  </span>
                  {(t.status === 'SCHEDULED' || t.status === 'ONGOING') && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={cancel.isPending}
                      onClick={() => {
                        const reason = window.prompt('Lý do hủy chuyến (khách sẽ thấy lý do này):');
                        if (reason !== null) cancel.mutate({ id: t.id, reason });
                      }}
                    >
                      Hủy chuyến
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <div className="mt-4 flex items-center justify-end gap-2 text-sm">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Trước
        </Button>
        <span>
          Trang {page}/{totalPages}
        </span>
        <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Sau
        </Button>
      </div>
    </div>
  );
}
