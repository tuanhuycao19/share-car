'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { Role } from '@share-car/api-client';
import { CarFrontIcon, LogOutIcon, MenuIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth';
import { ROLE_LABEL } from '@/lib/labels';
import { cn } from '@/lib/utils';

type NavItem = { href: string; label: string };

const NAV: Record<Role | 'GUEST', NavItem[]> = {
  GUEST: [{ href: '/', label: 'Tìm chuyến' }],
  PASSENGER: [
    { href: '/', label: 'Tìm chuyến' },
    { href: '/passenger/bookings', label: 'Vé của tôi' },
  ],
  DRIVER: [
    { href: '/driver', label: 'Tổng quan' },
    { href: '/driver/trips', label: 'Chuyến của tôi' },
    { href: '/driver/trips/new', label: 'Đăng chuyến' },
    { href: '/driver/vehicles', label: 'Xe của tôi' },
  ],
  ADMIN: [
    { href: '/admin', label: 'Tổng quan' },
    { href: '/admin/drivers', label: 'Duyệt tài xế' },
    { href: '/admin/users', label: 'Người dùng' },
    { href: '/admin/trips', label: 'Chuyến xe' },
  ],
};

function isActive(pathname: string, href: string) {
  if (href === '/' || href === '/driver' || href === '/admin') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const { user, isLoading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = NAV[user?.role ?? 'GUEST'];

  const logout = () => {
    signOut();
    setOpen(false);
    router.push('/');
  };

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <CarFrontIcon className="size-5" />
          </span>
          <span>ShareCar</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive(pathname, item.href) && 'bg-accent text-accent-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {isLoading ? null : user ? (
            <>
              <div className="text-right text-sm leading-tight">
                <div className="font-medium">{user.fullName}</div>
                <div className="text-muted-foreground text-xs">{ROLE_LABEL[user.role]}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} aria-label="Đăng xuất">
                <LogOutIcon />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Đăng nhập</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Đăng ký</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto md:hidden" aria-label="Mở menu">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              {user && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{user.fullName}</span>
                  <Badge variant="secondary">{ROLE_LABEL[user.role]}</Badge>
                </div>
              )}
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium',
                    isActive(pathname, item.href) ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <Separator />
            <div className="flex flex-col gap-2 px-4">
              {user ? (
                <Button variant="outline" onClick={logout}>
                  <LogOutIcon /> Đăng xuất
                </Button>
              ) : (
                <>
                  <Button asChild onClick={() => setOpen(false)}>
                    <Link href="/login">Đăng nhập</Link>
                  </Button>
                  <Button variant="outline" asChild onClick={() => setOpen(false)}>
                    <Link href="/register">Đăng ký</Link>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
