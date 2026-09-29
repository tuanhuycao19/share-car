'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';

export default function AdminDashboard() {
  const stats = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => (await api.GET('/admin/stats')).data!,
  });
  const s = stats.data;
  const items = [
    { label: 'Tài xế chờ duyệt', value: s?.pendingDrivers, href: '/admin/drivers', highlight: !!s?.pendingDrivers },
    { label: 'Tổng người dùng', value: s?.totalUsers, href: '/admin/users' },
    { label: 'Hành khách', value: s?.totalPassengers, href: '/admin/users?role=PASSENGER' },
    { label: 'Tài xế', value: s?.totalDrivers, href: '/admin/users?role=DRIVER' },
    { label: 'Chuyến sắp chạy', value: s?.scheduledTrips, href: '/admin/trips' },
    { label: 'Vé đang hiệu lực', value: s?.confirmedBookings, href: '/admin/trips' },
  ];
  return (
    <div>
      <PageHeader title="Quản trị" description="Tổng quan hệ thống" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {items.map((i) => (
          <Link key={i.label} href={i.href}>
            <Card className={`hover:border-primary/50 py-4 transition-colors ${i.highlight ? 'border-amber-300 bg-amber-50' : ''}`}>
              <CardContent className="px-4">
                <div className="text-3xl font-semibold">{i.value ?? '–'}</div>
                <div className="text-muted-foreground text-sm">{i.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
