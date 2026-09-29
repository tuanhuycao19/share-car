'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { Role } from '@share-car/api-client';
import { ShieldAlertIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/labels';

/**
 * Chặn truy cập phía giao diện theo role. Đây chỉ là trải nghiệm người dùng —
 * quyền thật sự được kiểm soát ở backend (JwtAuthGuard + RolesGuard).
 */
export function RoleGuard({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isLoading, user, router, pathname]);

  if (isLoading || !user) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!roles.includes(user.role)) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
        <ShieldAlertIcon className="text-destructive size-10" />
        <h1 className="text-xl font-semibold">Bạn không có quyền truy cập trang này</h1>
        <Button asChild>
          <Link href={ROLE_HOME[user.role]}>Về trang của tôi</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
