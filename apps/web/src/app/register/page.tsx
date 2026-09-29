'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { CarFrontIcon, UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/errors';
import { ROLE_HOME } from '@/lib/labels';
import { cn } from '@/lib/utils';

type RegisterRole = 'PASSENGER' | 'DRIVER';

export default function RegisterPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [role, setRole] = useState<RegisterRole>('PASSENGER');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', licenseNumber: '' });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const register = useMutation({
    mutationFn: async () =>
      (
        await api.POST('/auth/register', {
          body: {
            ...form,
            role,
            licenseNumber: role === 'DRIVER' ? form.licenseNumber : undefined,
          },
        })
      ).data!,
    onSuccess: ({ accessToken, user }) => {
      signIn(accessToken, user);
      toast.success(
        user.role === 'DRIVER'
          ? 'Đăng ký thành công! Hồ sơ tài xế đang chờ admin duyệt.'
          : 'Đăng ký thành công!',
      );
      router.replace(ROLE_HOME[user.role]);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const roles: { value: RegisterRole; label: string; icon: typeof UserIcon }[] = [
    { value: 'PASSENGER', label: 'Hành khách', icon: UserIcon },
    { value: 'DRIVER', label: 'Tài xế', icon: CarFrontIcon },
  ];

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tạo tài khoản</CardTitle>
          <CardDescription>Chọn vai trò của bạn</CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            register.mutate();
          }}
        >
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2" role="radiogroup">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  role="radio"
                  aria-checked={role === r.value}
                  onClick={() => setRole(r.value)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors',
                    role === r.value ? 'border-primary bg-accent text-accent-foreground' : 'hover:bg-muted',
                  )}
                >
                  <r.icon className="size-4" /> {r.label}
                </button>
              ))}
            </div>
            <Field id="fullName" label="Họ và tên" value={form.fullName} onChange={set('fullName')} autoComplete="name" />
            <Field id="email" label="Email" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
            <Field
              id="phone"
              label="Số điện thoại"
              type="tel"
              inputMode="numeric"
              pattern="0[0-9]{9}"
              title="10 chữ số, bắt đầu bằng 0"
              value={form.phone}
              onChange={set('phone')}
              autoComplete="tel"
            />
            <Field
              id="password"
              label="Mật khẩu (tối thiểu 8 ký tự)"
              type="password"
              minLength={8}
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
            />
            {role === 'DRIVER' && (
              <Field id="licenseNumber" label="Số giấy phép lái xe" value={form.licenseNumber} onChange={set('licenseNumber')} />
            )}
          </CardContent>
          <CardFooter className="mt-6 flex-col gap-3">
            <Button type="submit" className="w-full" disabled={register.isPending}>
              {register.isPending ? 'Đang tạo tài khoản...' : 'Đăng ký'}
            </Button>
            <p className="text-muted-foreground text-sm">
              Đã có tài khoản?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Đăng nhập
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

function Field({ id, label, ...props }: { id: string; label: string } & React.ComponentProps<'input'>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} required {...props} />
    </div>
  );
}
