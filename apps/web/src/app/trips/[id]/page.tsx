import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { TripDetail } from './trip-detail';

export default function TripPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <TripDetail />
    </Suspense>
  );
}
