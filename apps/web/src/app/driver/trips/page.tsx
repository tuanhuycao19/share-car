'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import type { TripStatus } from '@share-car/api-client';
import { PlusIcon } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { TripSummary } from '@/components/trip-summary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { TRIP_STATUS } from '@/lib/labels';

export default function DriverTripsPage() {
  const [status, setStatus] = useState<TripStatus | ''>('');
  const trips = useQuery({
    queryKey: ['trips', 'mine', status],
    queryFn: async () =>
      (await api.GET('/trips/mine', { params: { query: { status: status || undefined } } })).data!,
  });

  return (
    <div>
      <PageHeader
        title="Chuyến của tôi"
        actions={
          <>
            <div className="w-44">
              <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as TripStatus | '')}>
                <option value="">Tất cả trạng thái</option>
                {Object.entries(TRIP_STATUS).map(([value, s]) => (
                  <option key={value} value={value}>
                    {s.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <Button asChild>
              <Link href="/driver/trips/new">
                <PlusIcon /> Đăng chuyến
              </Link>
            </Button>
          </>
        }
      />
      {trips.isPending ? (
        <Skeleton className="h-40" />
      ) : trips.data?.length === 0 ? (
        <EmptyState title="Chưa có chuyến nào" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {trips.data?.map((t) => (
            <Link key={t.id} href={`/driver/trips/${t.id}`}>
              <Card className="hover:border-primary/50 h-full transition-colors">
                <CardContent>
                  <TripSummary trip={t} showStatus />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
