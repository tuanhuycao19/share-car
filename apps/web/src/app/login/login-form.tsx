'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { ROLE_HOME } from '@/lib/labels';

const DEMO_ACCOUNTS = [
  { email: 'khach1@sharecar.vn', label: 'Hành khách' },
  { email: 'taixe1@sharecar.vn', label: 'Tài xế' },
  { email: 'admin@sharecar.vn', label: 'Admin' },
];

/** Chỉ cho phép chuyển hướng nội bộ để tránh open redirect */
function safeNext(next: string | null): string | null {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = useMutation({
    mutationFn: async () => (await api.POST('/auth/login', { body: { email, password } })).data!,
    onSuccess: ({ accessToken, user }) => {
      signIn(accessToken, user);
      toast.success(`Xin chào, ${user.fullName}!`);
      router.replace(safeNext(params.get('next')) ?? ROLE_HOME[user.role]);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Đăng nhập</CardTitle>
          <CardDescription>Dùng email và mật khẩu đã đăng ký</CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            login.mutate();
          }}
        >
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="mt-6 flex-col gap-3">
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
            <p className="text-muted-foreground text-sm">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Đăng ký
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      {process.env.NODE_ENV !== 'production' && (
        <div className="text-muted-foreground rounded-lg border border-dashed p-3 text-xs">
          <p className="mb-2 font-medium">Tài khoản demo (mật khẩu: Demo@123)</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <Button
                key={a.email}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setEmail(a.email);
                  setPassword('Demo@123');
                }}
              >
                {a.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
