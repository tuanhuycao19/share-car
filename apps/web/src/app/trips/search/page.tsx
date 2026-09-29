import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchResults } from './search-results';

export const metadata: Metadata = { title: 'Kết quả tìm chuyến' };

export default function SearchPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <SearchResults />
    </Suspense>
  );
}
