'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Role, Schemas } from '@share-car/api-client';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDebounced } from '@/hooks/use-debounced';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { formatDateTime } from '@/lib/format';
import { ROLE_LABEL } from '@/lib/labels';

type UserStatus = Schemas['UserStatus'];
const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  return (
    <Suspense>
      <UsersTable />
    </Suspense>
  );
}

function UsersTable() {
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const [role, setRole] = useState<Role | ''>((params.get('role') as Role) ?? '');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const debouncedQ = useDebounced(q, 300);

  const users = useQuery({
    queryKey: ['admin', 'users', role, status, debouncedQ, page],
    queryFn: async () =>
      (
        await api.GET('/admin/users', {
          params: {
            query: { role: role || undefined, status: status || undefined, q: debouncedQ || undefined, page, pageSize: PAGE_SIZE },
          },
        })
      ).data!,
    placeholderData: (prev) => prev,
  });

  const setUserStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: UserStatus }) =>
      (await api.PATCH('/admin/users/{id}/status', { params: { path: { id } }, body: { status } })).data!,
    onSuccess: (u) => {
      toast.success(u.status === 'LOCKED' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const totalPages = users.data ? Math.max(1, Math.ceil(users.data.total / PAGE_SIZE)) : 1;

  return (
    <div>
      <PageHeader title="Người dùng" description={users.data ? `${users.data.total} tài khoản` : undefined} />
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <Input placeholder="Tìm tên, email, SĐT..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <NativeSelect value={role} onChange={(e) => { setRole(e.target.value as Role | ''); setPage(1); }}>
          <option value="">Mọi vai trò</option>
          {Object.entries(ROLE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect value={status} onChange={(e) => { setStatus(e.target.value as UserStatus | ''); setPage(1); }}>
          <option value="">Mọi trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="LOCKED">Đã khóa</option>
        </NativeSelect>
      </div>

      {users.isPending ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.data?.items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.fullName}</TableCell>
                  <TableCell className="text-xs">
                    <div>{u.email}</div>
                    <div className="text-muted-foreground">{u.phone}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ROLE_LABEL[u.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.status === 'ACTIVE' ? 'success' : 'destructive'}>
                      {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{formatDateTime(u.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    {u.role !== 'ADMIN' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={setUserStatus.isPending}
                        onClick={() =>
                          setUserStatus.mutate({ id: u.id, status: u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE' })
                        }
                      >
                        {u.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
