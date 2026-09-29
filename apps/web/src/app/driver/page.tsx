'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CarIcon, PlusIcon, RouteIcon, UsersIcon } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { DriverStatusBadge } from '@/components/status-badge';
import { TripSummary } from '@/components/trip-summary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DriverStatusAlert } from './driver-status-alert';

export default function DriverDashboard() {
  const { user } = useAuth();
  const trips = useQuery({
    queryKey: ['trips', 'mine', 'SCHEDULED'],
    queryFn: async () => (await api.GET('/trips/mine', { params: { query: { status: 'SCHEDULED' } } })).data!,
  });
  const vehicles = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => (await api.GET('/vehicles')).data!,
  });

  const upcoming = [...(trips.data ?? [])].sort((a, b) => a.departureTime.localeCompare(b.departureTime));
  const bookedSeats = upcoming.reduce((sum, t) => sum + t.bookedSeats, 0);
  const approved = user?.driverProfile?.status === 'APPROVED';

  return (
    <div>
      <PageHeader
        title={`Xin chào, ${user?.fullName ?? ''}`}
        description={
          user?.driverProfile && (
            <span className="inline-flex items-center gap-2">
              Trạng thái hồ sơ: <DriverStatusBadge status={user.driverProfile.status} />
            </span>
          )
        }
        actions={
          approved && (
            <Button asChild>
              <Link href="/driver/trips/new">
                <PlusIcon /> Đăng chuyến
              </Link>
            </Button>
          )
        }
      />
      <DriverStatusAlert />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat icon={RouteIcon} label="Chuyến sắp chạy" value={trips.data?.length} />
        <Stat icon={UsersIcon} label="Ghế đã có khách đặt" value={trips.data ? bookedSeats : undefined} />
        <Stat icon={CarIcon} label="Xe đang hoạt động" value={vehicles.data?.filter((v) => v.isActive).length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chuyến sắp khởi hành</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trips.isPending ? (
            <Skeleton className="h-32" />
          ) : upcoming.length === 0 ? (
            <EmptyState title="Chưa có chuyến sắp chạy" />
          ) : (
            upcoming.slice(0, 5).map((t) => (
              <Link
                key={t.id}
                href={`/driver/trips/${t.id}`}
                className="hover:border-primary/50 block rounded-lg border p-4 transition-colors"
              >
                <TripSummary trip={t} />
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof CarIcon; label: string; value?: number }) {
  return (
    <Card className="py-4">
      <CardContent className="flex items-center gap-3 px-4">
        <span className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-lg">
          <Icon className="size-5" />
        </span>
        <div>
          <div className="text-2xl font-semibold">{value ?? '–'}</div>
          <div className="text-muted-foreground text-xs">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
