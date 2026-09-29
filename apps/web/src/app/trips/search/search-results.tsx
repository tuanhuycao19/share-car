'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { InfoIcon, SparklesIcon } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { SearchForm } from '@/components/search-form';
import { TripSummary } from '@/components/trip-summary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { formatDate, formatVnd } from '@/lib/format';
import { paramsToSearch } from '@/lib/search-params';

export function SearchResults() {
  const params = useSearchParams();
  const search = paramsToSearch(params);
  const valid = !!(search.pickup && search.dropoff && search.date);

  const query = useQuery({
    queryKey: ['trips', 'search', params.toString()],
    enabled: valid,
    queryFn: async () =>
      (
        await api.GET('/trips/search', {
          params: {
            query: {
              pickupLat: search.pickup!.lat,
              pickupLng: search.pickup!.lng,
              dropoffLat: search.dropoff!.lat,
              dropoffLng: search.dropoff!.lng,
              date: search.date!,
              time: search.time,
              seats: search.seats ?? 1,
            },
          },
        })
      ).data!,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tìm chuyến"
        description={valid ? `${formatDate(`${search.date}T12:00:00+07:00`)} · ${search.seats ?? 1} ghế` : undefined}
      />
      <Card>
        <CardContent>
          <SearchForm key={params.toString()} initial={search} />
        </CardContent>
      </Card>

      {!valid ? (
        <EmptyState title="Chọn điểm đón, điểm trả và ngày đi để tìm chuyến" />
      ) : query.isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(query.error)}</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <span>Tìm thấy {query.data.items.length} chuyến phù hợp</span>
            {query.data.matchSource === 'fallback' && (
              <Badge variant="warning">Engine tạm thời không khả dụng — xếp hạng đơn giản</Badge>
            )}
            {query.data.mapsProvider === 'mock' && (
              <Badge variant="muted" title="Dữ liệu bản đồ đang dùng bản mock">
                <InfoIcon /> Bản đồ mô phỏng
              </Badge>
            )}
          </div>
          {query.data.items.length === 0 && (
            <EmptyState title="Chưa có chuyến phù hợp">Thử đổi ngày, bỏ giờ mong muốn hoặc giảm số ghế.</EmptyState>
          )}
          {query.data.items.map((trip) => (
            <Link key={trip.id} href={`/trips/${trip.id}?${params}`} className="block">
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="grid gap-4 md:grid-cols-[1fr_auto]">
                  <TripSummary trip={trip} />
                  <div className="flex flex-row items-end justify-between gap-2 md:flex-col md:items-end">
                    <Badge variant="secondary" className="gap-1">
                      <SparklesIcon /> Phù hợp {Math.round(trip.match.score)}%
                    </Badge>
                    <div className="text-right">
                      <div className="text-muted-foreground text-xs">Tạm tính {search.seats ?? 1} ghế</div>
                      <div className="text-primary text-lg font-semibold">
                        {formatVnd(trip.pricePerSeat * (search.seats ?? 1))}
                      </div>
                    </div>
                  </div>
                  <ul className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-xs md:col-span-2">
                    {trip.match.reasons.map((r) => (
                      <li key={r}>• {r}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
